(() => {
  const backend = window.LOL_MATCH_STORY_BACKEND || {};
  const dictionaries = window.MATCH_STORY_I18N || {};
  const state = { locale: localStorage.getItem('lms-locale') || 'pt', matches: [], selected: 0, lookup: null, live: false };

  const demoMatches = [
    {
      id:'demo-1', win:true, championName:'Ahri', championId:103, queue:'Ranked Solo', duration:2052, kills:10, deaths:3, assists:11,
      cs:228, vision:31, kp:61, gold:12840, score:84, date:'Hoje',
      titlePt:'A partida em que você não desistiu.', titleEn:'The match where you refused to give up.',
      subtitlePt:'Um começo difícil, um mid game paciente e uma luta que virou tudo.', subtitleEn:'A rough start, a patient mid game, and one fight that changed everything.',
      moments:[
        {m:'08:14',pt:'Primeiro sinal de controle',en:'First sign of control',dpt:'Você evitou uma troca ruim e manteve a rota jogável até o primeiro recall.',den:'You avoided a bad trade and kept the lane playable until the first recall.'},
        {m:'19:42',pt:'A luta que segurou o jogo',en:'The fight that kept the game alive',dpt:'Participação em três eliminações perto do dragão impediu o snowball adversário.',den:'Three takedown contributions near dragon stopped the enemy snowball.'},
        {m:'27:08',pt:'O ponto de virada',en:'The turning point',dpt:'Um pick antes do Barão abriu a primeira janela real para assumir o mapa.',den:'A pick before Baron opened the first real window to take over the map.'}
      ]
    },
    {
      id:'demo-2', win:false, championName:'Jinx', championId:222, queue:'Ranked Solo', duration:1845, kills:8, deaths:7, assists:6,
      cs:252, vision:18, kp:54, gold:12120, score:66, date:'Ontem',
      titlePt:'Você teve dano. Faltou espaço para usar.', titleEn:'You had the damage. You lacked the space to use it.',
      subtitlePt:'Boa economia, lutas difíceis e um fim decidido antes do seu pico completo.', subtitleEn:'Good economy, difficult fights, and an ending decided before your full spike.',
      moments:[
        {m:'10:02',pt:'Farm acima do ritmo',en:'Ahead on farm',dpt:'Você construiu uma base sólida de ouro sem precisar arriscar a rota.',den:'You built a solid gold base without over-risking lane.'},
        {m:'21:33',pt:'Pressão sem proteção',en:'Pressure without protection',dpt:'O time entrou separado e você precisou recuar antes de conseguir bater livre.',den:'The team entered split and you had to retreat before getting free damage.'},
        {m:'29:51',pt:'Última defesa',en:'Last defense',dpt:'O dano apareceu, mas a luta começou tarde demais para recuperar o mapa.',den:'The damage showed up, but the fight started too late to recover the map.'}
      ]
    },
    {
      id:'demo-3', win:true, championName:'Lux', championId:99, queue:'Normal Draft', duration:1677, kills:6, deaths:2, assists:15,
      cs:173, vision:42, kp:70, gold:10480, score:91, date:'2 dias',
      titlePt:'Você venceu antes do placar mostrar.', titleEn:'You won before the scoreboard showed it.',
      subtitlePt:'Visão, picks e controle de espaço construíram uma vitória limpa.', subtitleEn:'Vision, picks, and space control built a clean win.',
      moments:[
        {m:'07:48',pt:'Primeira rotação útil',en:'First useful rotation',dpt:'Você saiu da rota na hora certa e transformou pressão em assistência.',den:'You left lane at the right time and turned pressure into an assist.'},
        {m:'16:20',pt:'Mapa escuro para o rival',en:'A dark map for the enemy',dpt:'A vantagem de visão começou a gerar picks sem necessidade de luta longa.',den:'Vision advantage started creating picks without needing long fights.'},
        {m:'24:44',pt:'Controle total',en:'Full control',dpt:'A última sequência de visão e zoneamento encerrou qualquer chance de contestação.',den:'The final chain of vision and zoning ended any chance to contest.'}
      ]
    }
  ];

  const $ = (s) => document.querySelector(s);
  const locale = () => state.locale;
  const t = (k) => dictionaries[locale()]?.[k] || dictionaries.pt?.[k] || k;
  const platformRegion = (p) => ({br1:'americas',na1:'americas',la1:'americas',la2:'americas',oc1:'sea',euw1:'europe',eun1:'europe',tr1:'europe',ru:'europe',kr:'asia',jp1:'asia'})[p] || 'americas';
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function championSplash(id){ return id ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey(id)}_0.jpg` : ''; }
  const championKeys = {103:'Ahri',222:'Jinx',99:'Lux',157:'Yasuo',266:'Aatrox',84:'Akali',145:'Kaisa',64:'LeeSin',238:'Zed',81:'Ezreal',22:'Ashe',412:'Thresh'};
  function championKey(id){ return championKeys[Number(id)] || 'Ahri'; }

  function applyI18n(){
    document.documentElement.lang = locale()==='pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (key === 'heroTitle') el.innerHTML = t(key); else el.textContent = t(key);
    });
    $('#langBtn').textContent = locale()==='pt' ? 'EN' : 'PT';
    if (state.matches.length) renderSelected();
  }

  function toast(msg){
    const el=$('#toast'); el.textContent=msg; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2600);
  }

  function setSource(type, message){
    const el=$('#sourceState'); el.className='source-state ' + type; el.textContent=message;
  }

  function normalizeMatch(raw, i){
    const p = raw?.participant || raw?.player || raw?.self || raw;
    const info = raw?.info || raw;
    const duration = Number(info?.gameDuration || raw?.duration || raw?.gameDuration || 0);
    const win = Boolean(p?.win ?? raw?.win);
    const kills = Number(p?.kills ?? raw?.kills ?? 0), deaths = Number(p?.deaths ?? raw?.deaths ?? 0), assists = Number(p?.assists ?? raw?.assists ?? 0);
    const cs = Number(p?.totalMinionsKilled ?? p?.cs ?? raw?.cs ?? 0) + Number(p?.neutralMinionsKilled ?? 0);
    const vision = Number(p?.visionScore ?? raw?.visionScore ?? 0);
    const gold = Number(p?.goldEarned ?? raw?.goldEarned ?? 0);
    const championName = p?.championName || raw?.championName || 'Champion';
    const championId = Number(p?.championId || raw?.championId || 0);
    const kp = Math.min(100, Math.max(0, Number(raw?.killParticipation || p?.killParticipation || 0) * (Number(raw?.killParticipation || p?.killParticipation || 0) <= 1 ? 100 : 1))) || Math.min(95, 38 + assists * 2 + kills);
    const score = Math.max(35, Math.min(98, Math.round(55 + (win?12:0) + kills*1.4 + assists*.7 - deaths*2 + vision*.2)));
    const strong = kills + assists >= 15;
    const titlePt = win ? (strong ? 'Você encontrou o momento e tomou a partida.' : 'Você transformou consistência em vitória.') : (deaths <= 4 ? 'Você resistiu. A partida escapou em outro lugar.' : 'A partida acelerou antes de você estabilizar.');
    const titleEn = win ? (strong ? 'You found the moment and took over the match.' : 'You turned consistency into a win.') : (deaths <= 4 ? 'You held on. The match slipped elsewhere.' : 'The game accelerated before you stabilized.');
    return {
      id: raw?.metadata?.matchId || raw?.matchId || raw?.id || 'live-'+i, win, championName, championId, queue: raw?.queueName || raw?.queue || 'League of Legends',
      duration, kills, deaths, assists, cs, vision, kp: Math.round(kp), gold, score, date: locale()==='pt'?'Recente':'Recent', titlePt, titleEn,
      subtitlePt: win ? 'O jogo teve um ponto de aceleração claro — e você estava presente nele.' : 'Os números contam só metade. O contexto mostra onde a partida começou a escapar.',
      subtitleEn: win ? 'The game had a clear acceleration point — and you were present for it.' : 'The numbers tell only half the story. Context shows where the match began to slip.',
      moments: buildMoments({win,kills,deaths,assists,vision,duration})
    };
  }

  function buildMoments(m){
    const total=Math.max(1200,m.duration||1800), m1=Math.round(total*.25), m2=Math.round(total*.57), m3=Math.round(total*.82);
    const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    return [
      {m:fmt(m1),pt:'Primeiro retrato da rota',en:'First lane snapshot',dpt:m.deaths<=2?'Você manteve a partida estável e preservou recursos.':'A fase inicial cobrou caro e passou a exigir recuperação.',den:m.deaths<=2?'You kept the match stable and preserved resources.':'The early game was costly and forced a recovery plan.'},
      {m:fmt(m2),pt:'A partida mudou de escala',en:'The match changed scale',dpt:m.kills+m.assists>=12?'Sua participação começou a pesar nas lutas coletivas.':'As lutas cresceram, seu impacto ainda dependia de encontrar uma janela melhor.',den:m.kills+m.assists>=12?'Your participation started to matter in team fights.':'As fights grew, your impact still depended on finding a better window.'},
      {m:fmt(m3),pt:m.win?'A janela decisiva':'O momento decisivo',en:m.win?'The decisive window':'The decisive moment',dpt:m.win?'O time converteu pressão em objetivo e o mapa finalmente abriu.':'A última sequência definiu o mapa antes de uma nova recuperação.',den:m.win?'The team converted pressure into an objective and the map finally opened.':'The final sequence decided the map before another recovery was possible.'}
    ];
  }

  function adaptResponse(data){
    const list = data?.matches || data?.recentMatches || data?.data?.matches || [];
    return Array.isArray(list) ? list.map(normalizeMatch) : [];
  }

  async function fetchLive(lookup){
    const controller = new AbortController(), timer=setTimeout(()=>controller.abort(),14000);
    try{
      const res=await fetch(backend.lolProfile,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        gameName:lookup.gameName, tagLine:lookup.tagLine, platform:lookup.platform, region:platformRegion(lookup.platform), limit:12, matchLimit:12
      }),signal:controller.signal});
      let data=null; try{ data=await res.json(); }catch{}
      if(!res.ok || data?.error) throw Object.assign(new Error(data?.message||'lookup_failed'),{status:res.status,code:data?.error});
      return data;
    }finally{ clearTimeout(timer); }
  }

  function renderRail(){
    $('#matchRail').innerHTML=state.matches.map((m,i)=>`
      <button class="match-pill ${i===state.selected?'active':''}" data-index="${i}">
        <span class="mini-result ${m.win?'win':'loss'}">${m.win ? (locale()==='pt'?'V':'W') : (locale()==='pt'?'D':'L')}</span>
        <span><strong>${esc(m.championName)}</strong><small>${m.kills}/${m.deaths}/${m.assists}</small></span>
      </button>`).join('');
    document.querySelectorAll('.match-pill').forEach(b=>b.addEventListener('click',()=>{state.selected=Number(b.dataset.index);renderRail();renderSelected();}));
  }

  function renderSelected(){
    const m=state.matches[state.selected]; if(!m)return;
    const mins=Math.floor(m.duration/60), secs=String(m.duration%60).padStart(2,'0');
    $('#storyKicker').textContent=`${m.queue.toUpperCase()} • ${mins}:${secs}`;
    $('#storyTitle').textContent=locale()==='pt'?m.titlePt:m.titleEn;
    $('#storySubtitle').textContent=locale()==='pt'?m.subtitlePt:m.subtitleEn;
    $('#resultBadge').textContent=m.win?(locale()==='pt'?'VITÓRIA':'VICTORY'):(locale()==='pt'?'DERROTA':'DEFEAT');
    $('#resultBadge').className='result '+(m.win?'win':'loss');
    $('#championName').textContent=m.championName; $('#kda').textContent=`${m.kills} / ${m.deaths} / ${m.assists}`;
    $('#csValue').textContent=m.cs||'—'; $('#visionValue').textContent=m.vision||'—'; $('#kpValue').textContent=(m.kp||0)+'%';
    $('#goldValue').textContent=m.gold? (m.gold/1000).toFixed(1)+'k':'—'; $('#impactScore').textContent=m.score;
    $('#storyCard').style.setProperty('--cover', `url("${championSplash(m.championId)}")`);
    $('#openingTitle').textContent=locale()==='pt' ? (m.deaths<=3?'Você construiu a partida sem se entregar cedo.':'O começo exigiu recuperação.') : (m.deaths<=3?'You built the game without giving it away early.':'The opening demanded recovery.');
    $('#openingText').textContent=locale()==='pt' ? `Com ${m.cs||0} de farm e ${m.vision||0} de visão, o início mostra ${m.deaths<=3?'controle de risco':'um ritmo mais turbulento'} antes das lutas maiores.` : `With ${m.cs||0} CS and ${m.vision||0} vision, the opening shows ${m.deaths<=3?'risk control':'a more turbulent pace'} before larger fights.`;
    $('#impactTitle').textContent=locale()==='pt'?`Impacto geral: ${m.score}/100.`:`Overall impact: ${m.score}/100.`;
    $('#impactText').textContent=locale()==='pt'?`Você terminou com ${m.kills+m.assists} participações diretas em abates e ${m.deaths} mortes. O resumo prioriza o que isso significou no fluxo da partida.`:`You finished with ${m.kills+m.assists} direct takedown contributions and ${m.deaths} deaths. The summary focuses on what that meant in the flow of the match.`;
    $('#endingTitle').textContent=locale()==='pt'?(m.win?'O último capítulo foi de conversão.':'O último capítulo mostra onde a recuperação parou.'):(m.win?'The final chapter was about conversion.':'The final chapter shows where the recovery stopped.');
    $('#endingText').textContent=locale()==='pt'?(m.win?'A vantagem só importou quando virou espaço, objetivo e encerramento. Essa foi a assinatura desta vitória.':'Mesmo com momentos bons, a partida terminou antes de uma nova janela segura aparecer.'):(m.win?'The lead only mattered once it became space, objectives, and a finish. That was the signature of this win.':'Even with good moments, the match ended before another safe window appeared.');
    $('#moments').innerHTML=m.moments.map(x=>`<div class="moment"><span class="moment-time">${x.m}</span><div><strong>${esc(locale()==='pt'?x.pt:x.en)}</strong><p>${esc(locale()==='pt'?x.dpt:x.den)}</p></div></div>`).join('');
    const chips = locale()==='pt'
      ? [`${m.kills+m.assists} participações`,`${m.vision} visão`,`${m.cs} CS`,m.win?'Vitória convertida':'Derrota revisável']
      : [`${m.kills+m.assists} takedowns`,`${m.vision} vision`,`${m.cs} CS`,m.win?'Converted win':'Reviewable loss'];
    $('#highlights').innerHTML=chips.map(x=>`<div class="highlight">${esc(x)}</div>`).join('');
  }

  function showStory(){
    $('#storyApp').classList.remove('hidden'); $('#playerTitle').textContent=`${state.lookup.gameName}#${state.lookup.tagLine}`; renderRail(); renderSelected();
    $('#storyApp').scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function runLookup(useDemo=false){
    const gameName=$('#gameName').value.trim(), tagLine=$('#tagLine').value.trim().replace('#',''), platform=$('#platform').value;
    if(!gameName || !tagLine){toast(locale()==='pt'?'Preencha seu Riot ID.':'Enter your Riot ID.');return;}
    state.lookup={gameName,tagLine,platform}; state.selected=0;
    if(useDemo){state.matches=demoMatches;state.live=false;setSource('demo',locale()==='pt'?'Modo demonstrativo: história construída com dados de exemplo.':'Demo mode: story built with example data.');showStory();return;}
    setSource('loading',locale()==='pt'?'Buscando suas partidas recentes…':'Loading your recent matches…');
    try{
      const data=await fetchLive(state.lookup), matches=adaptResponse(data);
      if(!matches.length) throw new Error('empty_matches');
      state.matches=matches; state.live=true;
      const canonical=data?.player;
      if(canonical?.gameName){state.lookup.gameName=canonical.gameName;state.lookup.tagLine=canonical.tagLine||tagLine;}
      setSource('live',locale()==='pt'?`Dados Riot carregados: ${matches.length} partidas recentes.`:`Riot data loaded: ${matches.length} recent matches.`);
      showStory();
    }catch(err){
      state.matches=demoMatches; state.live=false;
      setSource('demo', locale()==='pt'?'Dados Riot indisponíveis agora. Mantivemos um exemplo claramente identificado para você conhecer a experiência.':'Riot data is unavailable right now. A clearly labeled example is shown so you can explore the experience.');
      showStory();
    }
  }

  $('#lookupForm').addEventListener('submit',e=>{e.preventDefault();runLookup(false);});
  $('#demoBtn').addEventListener('click',()=>runLookup(true));
  $('#refreshBtn').addEventListener('click',()=>runLookup(false));
  $('#langBtn').addEventListener('click',()=>{state.locale=locale()==='pt'?'en':'pt';localStorage.setItem('lms-locale',state.locale);applyI18n();});
  $('#shareBtn').addEventListener('click',async()=>{
    const m=state.matches[state.selected]; if(!m)return;
    const text=locale()==='pt'?`${m.championName} • ${m.kills}/${m.deaths}/${m.assists} • ${m.win?'Vitória':'Derrota'} — minha partida contada no LoL Match Story.`:`${m.championName} • ${m.kills}/${m.deaths}/${m.assists} • ${m.win?'Victory':'Defeat'} — my match told by LoL Match Story.`;
    try{ if(navigator.share) await navigator.share({title:'LoL Match Story',text,url:location.href}); else {await navigator.clipboard.writeText(text+' '+location.href);toast(locale()==='pt'?'Resumo copiado.':'Summary copied.');} }catch{}
  });

  applyI18n();
})();