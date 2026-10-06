const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#gameName').fill('AlchemyFlames');
  await page.locator('#tagLine').fill('BR1');
  await page.locator('#platform').selectOption('br1');
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


test('home pública não embute Riot ID no HTML', async ({ page }) => {
  await expect(page.locator('#gameName')).not.toHaveAttribute('value', /AlchemyFlames/i);
  await expect(page.locator('#gameName')).toHaveAttribute('placeholder','Game Name ou Nome#TAG');
  await expect(page.locator('#tagLine')).not.toHaveAttribute('value', /BR1/i);
  await expect(page.locator('#tagLine')).toHaveAttribute('placeholder','BR1');
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
  await expect(page.locator('#highlights')).toContainText('4 aprimoramentos');
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


test('resumo da sessão abre a partida destacada', async ({ page }) => {
  await page.locator('#demoBtn').click();
  const links=page.locator('[data-session-index]');
  await expect(links.first()).toBeVisible();
  const index=await links.first().getAttribute('data-session-index');
  await links.first().click();
  await expect(page.locator('.match-pill').nth(Number(index))).toHaveAttribute('aria-selected','true');
});


test('ao abrir história entra em modo resultado compacto', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('body')).toHaveClass(/results-mode/);
  await expect(page.locator('.product-preview')).toBeHidden();
  await expect(page.locator('.hero h1')).toBeHidden();
  await expect(page.locator('#storyApp')).toBeVisible();
});

test('nova busca restaura a home completa', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await page.locator('#newSearchBtn').click();
  await expect(page.locator('body')).not.toHaveClass(/results-mode/);
  await expect(page.locator('.product-preview')).toBeVisible();
  await expect(page.locator('#storyApp')).toBeHidden();
});


test('história possui navegação direta entre capítulos', async ({ page }) => {
  await page.locator('#demoBtn').click();
  const nav=page.locator('.chapter-nav');
  await expect(nav).toBeVisible();
  await expect(nav.locator('a')).toHaveCount(4);
  await expect(nav.locator('a').nth(0)).toHaveAttribute('href','#openingChapter');
  await expect(nav.locator('a').nth(3)).toHaveAttribute('href','#finalChapter');
});


test('detalhes técnicos ficam recolhidos por padrão', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'AlchemyFlames',tagLine:'BR1'},matches:[{
      id:'BR1_900',champion:'Ahri',context:'RANKED',queue:'RANKED',win:true,duration:30,
      kills:8,deaths:2,assists:10,items:[3089],summonerSpells:[4,14]
    }]})
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[]})}));
  await page.route('**/public-lol-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedStories:0,pentakills:0,records:{}})}));
  await page.locator('#lookupForm button[type="submit"]').click();
  const details=page.locator('.match-details-panel');
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute('open','');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open','');
});


test('modo resultado esconde demo redundante e placeholder de anúncio', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('#demoBtn')).toBeHidden();
  await expect(page.locator('[data-ad-slot="story"]')).toBeHidden();
});


test('PT-BR traduz o nome do modo e ouro na história', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('#storyKicker')).toContainText('RANQUEADA SOLO');
  await expect(page.locator('#stat4Label')).toHaveText('Ouro');
});


test('navegação de capítulos indica o capítulo atual', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('.chapter-nav a').first()).toHaveAttribute('aria-current','step');
  await page.locator('.chapter-nav a[href="#finalChapter"]').click();
  await expect(page.locator('.chapter-nav a[href="#finalChapter"]')).toHaveAttribute('aria-current','step');
});


test('perfil real mostra ícone e nível do invocador', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({
      player:{gameName:'AlchemyFlames',tagLine:'BR1',profileIconId:123,level:77,platform:'BR1'},
      matches:[{id:'BR1_123',champion:'Ahri',context:'RANKED',queue:'RANKED SOLO',win:true,duration:30,kills:8,deaths:2,assists:10}]
    })
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[]})}));
  await page.route('**/public-lol-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedStories:0,pentakills:0,records:{}})}));
  await page.locator('#lookupForm button[type="submit"]').click();
  await expect(page.locator('#playerIcon')).toBeVisible();
  await expect(page.locator('#playerIcon')).toHaveAttribute('src',/profileicon\/123\.png/);
  await expect(page.locator('#playerMeta')).toContainText('Nível 77');
  await expect(page.locator('#playerMeta')).toContainText('Servidor BR');
});


test('Arena usa métricas contextuais no capítulo de abertura', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'AlchemyFlames',tagLine:'BR1'},matches:[{
      id:'BR1_321',champion:'Gragas',context:'ARENA',queue:'ARENA',placement:2,win:false,duration:26,
      kills:4,deaths:6,assists:21,damagePerMin:1082,augments:[1,2,3,4,5]
    }]})
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[],arenaRounds:[]})}));
  await page.route('**/public-lol-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedStories:0,pentakills:0,records:{}})}));
  await page.locator('#lookupForm button[type="submit"]').click();
  await expect(page.locator('#stat1Label')).toHaveText('Colocação');
  await expect(page.locator('#csValue')).toHaveText('#2');
  await expect(page.locator('#stat2Label')).toHaveText('Participações');
  await expect(page.locator('#visionValue')).toHaveText('25');
  await expect(page.locator('#stat3Label')).toHaveText('DPM');
  await expect(page.locator('#kpValue')).toHaveText('1082');
  await expect(page.locator('#stat4Label')).toHaveText('Aprimoramentos');
  await expect(page.locator('#goldValue')).toHaveText('5');
});


test('Tag do Riot ID é exibida em maiúsculas', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({
      player:{gameName:'AlchemyFlames',tagLine:'br1'},
      matches:[{id:'BR1_700',champion:'Ahri',context:'RANKED',queue:'RANKED SOLO',win:true,duration:30,kills:8,deaths:2,assists:10}]
    })
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[]})}));
  await page.route('**/public-lol-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedStories:0,pentakills:0,records:{}})}));
  await page.locator('#lookupForm button[type="submit"]').click();
  await expect(page.locator('#playerTitle')).toHaveText('AlchemyFlames#BR1');
});


test('Top 4 da Arena não é tratado visualmente como derrota', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'AlchemyFlames',tagLine:'BR1'},matches:[{
      id:'BR1_222',champion:'Gragas',context:'ARENA',queue:'ARENA',placement:2,win:false,duration:26,kills:4,deaths:6,assists:21
    }]})
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[],arenaRounds:[]})}));
  await page.route('**/public-lol-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedStories:0,pentakills:0,records:{}})}));
  await page.locator('#lookupForm button[type="submit"]').click();
  await expect(page.locator('#resultBadge')).toHaveClass(/placement/);
  await expect(page.locator('.mini-result').first()).toHaveClass(/placement/);
  await expect(page.locator('#resultBadge')).not.toHaveClass(/loss/);
});


test('recordes persistentes usam pluralização correta', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'AlchemyFlames',tagLine:'BR1'},matches:[
      {id:'BR1_55',champion:'Gragas',context:'ARENA',queue:'ARENA',placement:2,win:false,duration:26,kills:4,deaths:6,assists:21}
    ]})
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[],arenaRounds:[]})}));
  await page.route('**/public-lol-story', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({publishedStories:1,pentakills:1,records:{},monthlyStories:[]})
  }));
  await page.locator('#lookupForm button[type="submit"]').click();
  await expect(page.locator('#historicalRecords')).toContainText('1 história publicada');
  await expect(page.locator('#historicalRecords')).toContainText('1 pentakill');
});


test('timeline da Arena pluraliza eliminações corretamente', async ({ page }) => {
  await page.route('**/public-lol-profile', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({player:{gameName:'AlchemyFlames',tagLine:'BR1'},matches:[{
      id:'BR1_777',champion:'Gragas',context:'ARENA',queue:'ARENA',placement:2,win:false,duration:26,kills:4,deaths:6,assists:21
    }]})
  }));
  await page.route('**/public-lol-match-story', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({events:[],arenaRounds:[
      {round:1,startTime:'01:00',endTime:'01:20',participation:1,playerKills:0,playerDeaths:0,playerAssists:1}
    ]})
  }));
  await page.route('**/public-lol-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedStories:0,pentakills:0,records:{}})}));
  await page.locator('#lookupForm button[type="submit"]').click();
  await expect(page.locator('#moments')).toContainText('1 eliminação');
  await expect(page.locator('#moments')).not.toContainText('1 eliminações');
});


test('resultado prioriza a história e move recordes para depois do card', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('.lookup-card')).toBeHidden();
  const storyBox=await page.locator('#storyCard').boundingBox();
  const recordsBox=await page.locator('#historicalRecords').boundingBox();
  if(recordsBox) expect(recordsBox.y).toBeGreaterThan(storyBox.y);
});

test('navegação mobile usa rótulos curtos de capítulos', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.locator('#demoBtn').click();
  await expect(page.locator('.chapter-nav')).toContainText('Abertura');
  await expect(page.locator('.chapter-nav')).toContainText('Momentos');
  await expect(page.locator('.chapter-nav')).toContainText('Impacto');
  await expect(page.locator('.chapter-nav')).toContainText('Final');
});


test('fonte dos dados aparece junto ao perfil no modo resultado', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('#sourceState')).toBeHidden();
  await expect(page.locator('#resultSourceState')).toBeVisible();
  await expect(page.locator('#resultSourceState')).toContainText('Modo demonstrativo');
  await page.locator('#newSearchBtn').click();
  await expect(page.locator('#resultSourceState')).toBeHidden();
});


test('rail centraliza automaticamente a partida selecionada', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.locator('#demoBtn').click();
  const rail=page.locator('#matchRail');
  await page.locator('.match-pill').last().click();
  await page.waitForTimeout(250);
  const left=await rail.evaluate(el=>el.scrollLeft);
  expect(left).toBeGreaterThan(0);
});


test('home mobile compacta diferenciais e remove CTA demo redundante', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('.hero-proof')).toBeVisible();
  const cols=await page.locator('.hero-proof').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(cols).toBe(3);
  await expect(page.locator('.product-copy .preview-demo')).toBeHidden();
  await expect(page.locator('#demoBtn')).toBeVisible();
});


test('home mobile mantém identidade curta e prioriza preview visual', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('.brand-short')).toBeVisible();
  await expect(page.locator('.brand-short')).toHaveText('Match Story');
  await expect(page.locator('.brand-long')).toBeHidden();
  const cardOrder=await page.locator('.preview-card').evaluate(el=>getComputedStyle(el).order);
  expect(Number(cardOrder)).toBeLessThan(0);
});


test('card visual da home abre a demo', async ({ page }) => {
  await expect(page.locator('.preview-demo-card')).toBeVisible();
  await page.locator('.preview-demo-card').click();
  await expect(page.locator('#storyApp')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/results-mode/);
});


test('card visual da home também abre demo pelo teclado', async ({ page }) => {
  const card=page.locator('.preview-demo-card');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#storyApp')).toBeVisible();
});


test('demo funciona com Riot ID vazio', async ({ page }) => {
  await page.locator('#gameName').fill('');
  await page.locator('#tagLine').fill('');
  await page.locator('#demoBtn').click();
  await expect(page.locator('#storyApp')).toBeVisible();
  await expect(page.locator('#resultSourceState')).toContainText('Modo demonstrativo');
});


test('colar Riot ID completo separa Game Name e Tag automaticamente', async ({ page }) => {
  await page.locator('#gameName').fill('AlchemyFlames#br1');
  await page.locator('#gameName').blur();
  await expect(page.locator('#gameName')).toHaveValue('AlchemyFlames');
  await expect(page.locator('#tagLine')).toHaveValue('BR1');
});

test('submit aceita Riot ID completo digitado no primeiro campo', async ({ page }) => {
  await page.route('**/public-lol-profile', async route => {
    const body=route.request().postDataJSON();
    expect(body.gameName).toBe('RealPlayer');
    expect(body.tagLine).toBe('BR1');
    await route.fulfill({
      status:200,contentType:'application/json',
      body:JSON.stringify({player:{gameName:'RealPlayer',tagLine:'BR1'},matches:[
        {id:'BR1_800',champion:'Lux',context:'RANKED',queue:'RANKED SOLO',win:true,duration:30,kills:7,deaths:2,assists:10}
      ]})
    });
  });
  await page.route('**/public-lol-match-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[]})}));
  await page.route('**/public-lol-story', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedStories:0,pentakills:0,records:{}})}));
  await page.locator('#gameName').fill('RealPlayer#br1');
  await page.locator('#lookupForm button[type="submit"]').click();
  await expect(page.locator('#playerTitle')).toHaveText('RealPlayer#BR1');
});


test('placeholder do Riot ID acompanha idioma', async ({ page }) => {
  await expect(page.locator('#gameName')).toHaveAttribute('placeholder','Game Name ou Nome#TAG');
  await page.locator('#langBtn').click();
  await expect(page.locator('#gameName')).toHaveAttribute('placeholder','Game Name or Name#TAG');
});


test('história pública trata Top 4 da Arena como colocação positiva', async ({ page }) => {
  await page.route('**/public-lol-story', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({story:{
      match_id:'BR1_999',riot_id:'AlchemyFlames#BR1',
      story_data:{match:{champion:'Gragas',context:'ARENA',placement:2,win:false,durationSeconds:1500,kills:4,deaths:6,assists:21,damagePerMin:1082}}
    }})
  }));
  await page.goto('/story.html?match=BR1_999');
  await expect(page.locator('#publicResult')).toHaveText('#2');
  await expect(page.locator('#publicResult')).toHaveClass(/placement/);
  await expect(page.locator('#publicSubtitle')).toContainText('campanha');
  await expect(page.locator('#publicSubtitle')).not.toContainText(/run|round/i);
});


test('história pública mantém motivos de feedback ocultos até resposta negativa', async ({ page }) => {
  await page.route('**/public-lol-story', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({story:{
      match_id:'BR1_404',riot_id:'AlchemyFlames#br1',
      story_data:{match:{champion:'Gragas',context:'ARENA',placement:2,win:false,durationSeconds:1500,kills:4,deaths:6,assists:21,damagePerMin:1082,augments:[1,2,3,4,5]}}
    }})
  }));
  await page.goto('/story.html?match=BR1_404');
  await expect(page.locator('#feedbackReasons')).toBeHidden();
  await page.getByRole('button',{name:'Ainda não'}).click();
  await expect(page.locator('#feedbackReasons')).toBeVisible();
});

test('história pública da Arena usa métricas contextuais e Tag normalizada', async ({ page }) => {
  await page.route('**/public-lol-story', route => route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({story:{
      match_id:'BR1_405',riot_id:'AlchemyFlames#br1',
      story_data:{match:{champion:'Gragas',context:'ARENA',placement:2,win:false,durationSeconds:1500,kills:4,deaths:6,assists:21,damagePerMin:1082,augments:[1,2,3,4,5]}}
    }})
  }));
  await page.goto('/story.html?match=BR1_405');
  await expect(page.locator('#publicKicker')).toContainText('AlchemyFlames#BR1');
  await expect(page.locator('#publicStats')).toContainText('Participações');
  await expect(page.locator('#publicHighlights')).toContainText('5 aprimoramentos');
  await expect(page.locator('#publicImpactText')).not.toContainText('% de participação em abates');
});


test('demo explícita usa título amigável e esconde atualização de dados', async ({ page }) => {
  await page.locator('#gameName').fill('');
  await page.locator('#tagLine').fill('');
  await page.locator('#demoBtn').click();
  await expect(page.locator('#playerTitle')).toHaveText('História demonstrativa');
  await expect(page.locator('#refreshBtn')).toBeHidden();
  await expect(page.locator('#newSearchBtn')).toBeVisible();
});
