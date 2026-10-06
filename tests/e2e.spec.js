const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('abre em PT-BR e mostra a proposta principal', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { name: /Pare de olhar só números/i })).toBeVisible();
  await expect(page.locator('#lookupForm')).toBeVisible();
});

test('demo cria uma história navegável', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('#storyApp')).toBeVisible();
  await expect(page.locator('#storyTitle')).toContainText(/partida|dano|venceu|consistência|vitória/i);
  await expect(page.locator('.match-pill')).toHaveCount(3);
  await page.locator('.match-pill').nth(1).click();
  await expect(page.locator('#championName')).toHaveText('Jinx');
});

test('idioma inglês persiste', async ({ page }) => {
  await page.locator('#langBtn').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: /Stop looking only at numbers/i })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('dados reais substituem demo quando public-lol-profile responde', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      player: { gameName: 'RealPlayer', tagLine: 'BR1' },
      matches: [{
        id: 'BR1_1', championName: 'Lux', championId: 99, win: true,
        kills: 9, deaths: 2, assists: 14, cs: 220, visionScore: 36,
        goldEarned: 13200, duration: 32, damage: 31200, damagePerMin: 975, teamDamageShare: 31.5,
        largestKillingSpree: 7, tripleKills: 1, firstBloodAssist: true
      }]
    })
  }));

  await page.locator('#gameName').fill('RealPlayer');
  await page.locator('#tagLine').fill('BR1');
  await page.getByRole('button', { name: /Criar minha história/i }).click();

  await expect(page.locator('#storyApp')).toBeVisible();
  await expect(page.locator('#playerTitle')).toHaveText('RealPlayer#BR1');
  await expect(page.locator('#championName')).toHaveText('Lux');
  await expect(page.locator('#sourceState')).toContainText('Dados Riot carregados');
  await expect(page.locator('#storyKicker')).toContainText('32:00');
  await expect(page.locator('#archetypeBadge')).toHaveText('CONTROLE TOTAL');
});

test('falha do backend mantém fallback demonstrativo identificado', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status: 429,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'rate_limited' })
  }));
  await page.getByRole('button', { name: /Criar minha história/i }).click();
  await expect(page.locator('#storyApp')).toBeVisible();
  await expect(page.locator('#sourceState')).toContainText('exemplo');
});

test('mobile não cria overflow horizontal crítico', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(361);
});

test('gera card PNG da partida selecionada', async ({ page }) => {
  await page.locator('#demoBtn').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Baixar card PNG/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^lol-match-story-ahri\.png$/);
});


test('Riot ID padrão de teste é AlchemyFlames#BR1', async ({ page }) => {
  await expect(page.locator('#gameName')).toHaveValue('AlchemyFlames');
  await expect(page.locator('#tagLine')).toHaveValue('BR1');
  await expect(page.locator('#platform')).toHaveValue('br1');
});


test('Arena usa colocação e narrativa específica', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      player: { gameName: 'AlchemyFlames', tagLine: 'BR1' },
      matches: [{
        id: 'BR1_3288690697', champion: 'Gragas', context: 'ARENA', queue: 'ARENA',
        placement: 1, win: true, duration: 26, kills: 4, deaths: 6, assists: 21,
        gold: 16562, damagePerMin: 820, augments: [101,102,103,104]
      }]
    })
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({
      events:[],
      arenaRounds:[
        {round:1,startTime:'01:25',endTime:'02:08',participation:2,playerKills:1,playerDeaths:0,playerAssists:1},
        {round:2,startTime:'03:54',endTime:'04:38',participation:4,playerKills:1,playerDeaths:1,playerAssists:3},
        {round:3,startTime:'06:03',endTime:'06:42',participation:3,playerKills:0,playerDeaths:0,playerAssists:3}
      ]
    })
  }));

  await page.getByRole('button', { name: /Criar minha história/i }).click();
  await expect(page.locator('#championName')).toHaveText('Gragas');
  await expect(page.locator('#resultBadge')).toHaveText('#1');
  await expect(page.locator('#archetypeBadge')).toHaveText('CAMPEÃO DA ARENA');
  await expect(page.locator('#storyTitle')).toContainText(/topo da Arena/i);
  await expect(page.locator('#highlights')).toContainText('4 augments');
  await expect(page.locator('#timelineSource')).toContainText('janelas de combate');
  await expect(page.locator('#moments')).toContainText('01:25');
  await expect(page.locator('#matchDetails')).toContainText('3 detectadas');
});


test('timeline real substitui momentos estimados', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      player:{gameName:'AlchemyFlames',tagLine:'BR1'},
      matches:[
        {id:'BR1_42',champion:'Ahri',context:'RANKED',queue:'RANKED SOLO/DUO',win:true,duration:30,kills:8,deaths:3,assists:10,damagePerMin:700,killParticipation:62,items:[3089],summonerSpells:[4,14]},
        {id:'BR1_41',champion:'Ahri',context:'RANKED',queue:'RANKED SOLO/DUO',win:false,duration:29,kills:5,deaths:5,assists:8,damagePerMin:600,killParticipation:50}
      ]
    })
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({
      matchId:'BR1_42',
      firstBlood:{type:'ASSIST',timestamp:101000,time:'01:41',isFirstBlood:true},
      turningPoint:{type:'OBJECTIVE',timestamp:1200000,time:'20:00',objective:'Baron Nashor'},
      events:[{type:'STRUCTURE',timestamp:1500000,time:'25:00',structure:'Tower'}]
    })
  }));
  await page.getByRole('button',{name:/Criar minha história/i}).click();
  await expect(page.locator('#timelineSource')).toContainText('Timeline real');
  await expect(page.locator('#moments')).toContainText('20:00');
  await expect(page.locator('#comparison')).toContainText('COMPARAÇÃO');
  await expect(page.locator('#matchDetails')).toContainText('Itens');
});

test('link compartilhável abre diretamente a partida solicitada', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'SharePlayer',tagLine:'BR1'},matches:[
      {id:'BR1_1',champion:'Lux',context:'RANKED',queue:'RANKED',win:true,duration:28,kills:4,deaths:2,assists:10},
      {id:'BR1_2',champion:'Jinx',context:'RANKED',queue:'RANKED',win:false,duration:31,kills:9,deaths:7,assists:4}
    ]})
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[]})}));
  await page.goto('/?gameName=SharePlayer&tagLine=BR1&platform=br1&match=BR1_2');
  await expect(page.locator('#championName')).toHaveText('Jinx');
  await expect(page).toHaveURL(/match=BR1_2/);
});

test('salva histórico local de Riot IDs pesquisados', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'AlchemyFlames',tagLine:'BR1'},matches:[{id:'BR1_9',champion:'Gragas',context:'ARENA',queue:'ARENA',placement:1,win:true,duration:26,kills:4,deaths:6,assists:21}]})
  }));
  await page.getByRole('button',{name:/Criar minha história/i}).click();
  await expect(page.locator('#searchHistory')).toContainText('AlchemyFlames#BR1');
});

test('manifest PWA está disponível', async ({ page }) => {
  const response=await page.request.get('/manifest.webmanifest');
  expect(response.ok()).toBeTruthy();
  const manifest=await response.json();
  expect(manifest.name).toBe('LoL Match Story');
  expect(manifest.icons.length).toBeGreaterThan(0);
});


test('publica snapshot seguro antes de copiar link', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'AlchemyFlames',tagLine:'BR1'},matches:[
      {id:'BR1_99',champion:'Ahri',context:'RANKED',queue:'RANKED SOLO/DUO',win:true,duration:30,kills:8,deaths:2,assists:11}
    ]})
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[]})}));
  await page.route('**/public-lol-story', async route => {
    const body=route.request().postDataJSON();
    if(body.action==='records'){
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedStories:0,pentakills:0,records:{}})});
      return;
    }
    expect(body.action).toBe('publish');
    expect(body.matchId).toBe('BR1_99');
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,matchId:'BR1_99',publicPath:'story.html?match=BR1_99'})});
  });
  await page.getByRole('button',{name:/Criar minha história/i}).click();
  await page.locator('#copyLinkBtn').click();
  await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toContain('public-lol-story-page?match=BR1_99');
});

test('página pública renderiza snapshot persistido', async ({ page }) => {
  await page.route('**/public-lol-story', async route => {
    const body=route.request().postDataJSON();
    expect(body.action).toBe('get');
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({story:{
      match_id:'BR1_123',
      riot_id:'AlchemyFlames#BR1',
      story_data:{match:{id:'BR1_123',champion:'Ahri',context:'RANKED',win:true,durationSeconds:1800,kills:10,deaths:2,assists:9,cs:220,vision:28,gold:13000,damage:28000,damagePerMin:933,killParticipation:65,largestKillingSpree:6}}
    }})});
  });
  await page.goto('/story.html?match=BR1_123');
  await expect(page.locator('#publicStory')).toBeVisible();
  await expect(page.locator('#publicChampion')).toHaveText('Ahri');
  await expect(page.locator('#publicKicker')).toContainText('AlchemyFlames#BR1');
  await expect(page.locator('#publicResult')).toHaveText('VITÓRIA');
});


test('mostra recordes persistentes das histórias publicadas', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'AlchemyFlames',tagLine:'BR1'},matches:[
      {id:'BR1_77',champion:'Ahri',context:'RANKED',queue:'RANKED',win:true,duration:30,kills:10,deaths:2,assists:9}
    ]})
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[]})}));
  await page.route('**/public-lol-story', async route => {
    const body=route.request().postDataJSON();
    expect(body.action).toBe('records');
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      publishedStories:4,pentakills:1,
      records:{
        damagePerMin:{champion:'Ahri',value:1012},
        kda:{champion:'Lux',value:8.5},
        kills:{champion:'Jinx',value:19},
        arena:{champion:'Gragas',value:1}
      },
      monthlyStories:[{matchId:'BR1_70',champion:'Ahri',context:'RANKED',win:true,placement:null}]
    })});
  });
  await page.getByRole('button',{name:/Criar minha história/i}).click();
  await expect(page.locator('#historicalRecords')).toContainText('Recordes persistentes');
  await expect(page.locator('#historicalRecords')).toContainText('1012');
  await expect(page.locator('#historicalRecords')).toContainText('#1');
  await expect(page.locator('#historicalRecords')).toContainText('últimos 30 dias');
  await expect(page.locator('#historicalRecords a')).toHaveAttribute('href','./story.html?match=BR1_70');
});


test('estrutura principal é navegável por teclado e possui semântica acessível', async ({ page }) => {
  await expect(page.locator('.skip-link')).toHaveAttribute('href','#mainContent');
  await page.locator('.skip-link').focus();
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('#sourceState')).toHaveAttribute('role','status');
  await expect(page.locator('#gameName')).toHaveAccessibleName(/Game Name/i);
  await expect(page.locator('#platform')).toHaveAccessibleName(/Servidor/i);
});

test('rail de partidas expõe seleção como tabs', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('.match-pill').first()).toHaveAttribute('role','tab');
  await expect(page.locator('.match-pill').first()).toHaveAttribute('aria-selected','true');
  await page.locator('.match-pill').nth(1).click();
  await expect(page.locator('.match-pill').nth(1)).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.match-pill').first()).toHaveAttribute('aria-selected','false');
});


test('história pública envia feedback anônimo estruturado', async ({ page }) => {
  await page.route('**/public-lol-story', route => route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({story:{
      match_id:'BR1_555',riot_id:'AlchemyFlames#BR1',
      story_data:{match:{id:'BR1_555',champion:'Ahri',context:'RANKED',win:true,durationSeconds:1800,kills:8,deaths:2,assists:10}}
    }})
  }));
  let feedback=null;
  await page.route('**/public-lol-feedback', async route => {
    feedback=route.request().postDataJSON();
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});
  });
  await page.goto('/story.html?match=BR1_555');
  await expect(page.locator('#feedbackBlock')).toBeVisible();
  await page.getByRole('button',{name:/Sim, ficou claro/i}).click();
  await expect.poll(()=>feedback?.helpful).toBe(true);
  expect(feedback.matchId).toBe('BR1_555');
  expect(feedback.reason).toBe('clear');
  await expect(page.locator('#feedbackStatus')).toContainText('Obrigado');
});


test('anúncios ficam desativados sem configuração real', async ({ page }) => {
  await expect(page.locator('#adsConsent')).toHaveCount(0);
  await expect(page.locator('script[data-lms-adsense]')).toHaveCount(0);
  await expect(page.locator('[data-ad-slot="story"]')).toHaveCount(1);
  await expect(page.locator('[data-ad-slot="story"]')).toBeHidden();
});


test('rail de partidas aceita navegação por setas', async ({ page }) => {
  await page.locator('#demoBtn').click();
  const first=page.locator('.match-pill').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.match-pill').nth(1)).toBeFocused();
  await expect(page.locator('.match-pill').nth(1)).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('End');
  await expect(page.locator('.match-pill').last()).toBeFocused();
});
