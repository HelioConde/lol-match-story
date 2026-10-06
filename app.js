(() => {
  const backend = window.LOL_MATCH_STORY_BACKEND || {};
  const dictionaries = window.MATCH_STORY_I18N || {};
  const state = { locale: localStorage.getItem('lms-locale') || 'pt', matches: [], selected: 0, lookup: null, live: false, timelineCache: new Map(), requestedMatchId: null, ddVersion: '16.19.1' };

  const demoMatches = [
    {id:'demo-1',win:true,championName:'Ahri',queue:'Ranked Solo',durationSeconds:2052,kills:10,deaths:3,assists:11,cs:228,vision:31,kp:61,gold:12840,damage:27600,damagePerMin:807,teamDamageShare:28.4,firstBloodAssist:true,soloKills:2,doubleKills:1,largestKillingSpree:6,turretDamage:3200,objectiveDamage:5100,score:86},
    {id:'demo-2',win:false,championName:'Jinx',queue:'Ranked Solo',durationSeconds:1845,kills:8,deaths:7,assists:6,cs:252,vision:18,kp:54,gold:12120,damage:31100,damagePerMin:1011,teamDamageShare:31.7,tripleKills:1,largestKillingSpree:4,turretDamage:4700,objectiveDamage:3800,score:70},
    {id:'demo-3',win:true,championName:'Lux',queue:'Normal Draft',durationSeconds:1677,kills:6,deaths:2,assists:15,cs:173,vision:42,kp:70,gold:10480,damage:19800,damagePerMin:708,teamDamageShare:22.1,firstBloodAssist:true,controlWards:4,wardsPlaced:18,ccSeconds:31,score:91}
  ];

  const $ = s => document.querySelector(s);
  const locale = () => state.locale;
  const t = k => dictionaries[locale()]?.[k] || dictionaries.pt?.[k] || k;
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const platformRegion = p => ({br1:'americas',na1:'americas',la1:'americas',la2:'americas',oc1:'sea',ph2:'sea',sg2:'sea',th2:'sea',tw2:'sea',vn2:'sea',euw1:'europe',eun1:'europe',tr1:'europe',ru:'europe',kr:'asia',jp1:'asia'})[p] || 'americas';

  function safeNumber(...values) {
    for (const value of values) if (value !== undefined && value !== null && Number.isFinite(Number(value))) return Number(value);
    return 0;
  }

  function durationSeconds(raw, info) {
    if (info?.gameDuration != null) return Number(info.gameDuration);
    if (raw?.gameDuration != null) return Number(raw.gameDuration);
    if (raw?.durationSeconds != null) return Number(raw.durationSeconds);
    if (raw?.duration != null) {
      const value = Number(raw.duration);
      return value > 240 ? value : Math.round(value * 60);
    }
    return 0;
  }

  function championAssetName(name) {
    const map={Wukong:'MonkeyKing',"Kai'Sa":'Kaisa',Kaisa:'Kaisa',"Kha'Zix":'Khazix',Khazix:'Khazix',"Cho'Gath":'Chogath',Chogath:'Chogath',"Rek'Sai":'RekSai',RekSai:'RekSai',"Bel'Veth":'Belveth',BelVeth:'Belveth',Nunu:'Nunu',NunuWillump:'Nunu',LeBlanc:'Leblanc',VelKoz:'Velkoz'};
    return map[name] || String(name||'Ahri').replace(/[^A-Za-z0-9]/g,'');
  }

  function championSplash(name) {
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championAssetName(name)}_0.jpg`;
  }

  function archetype(m) {
    if (m.context==='ARENA') {
      if (m.placement===1) return {key:'arena-champion',pt:'CAMPEÃO DA ARENA',en:'ARENA CHAMPION'};
      if (m.placement>0 && m.placement<=4) return {key:'arena-top4',pt:'TOP 4 NA ARENA',en:'ARENA TOP 4'};
      if (m.kills+m.assists>=20) return {key:'arena-brawler',pt:'BRIGA ATÉ O FIM',en:'FIGHT TO THE END'};
      return {key:'arena-run',pt:'CORRIDA DE ARENA',en:'ARENA RUN'};
    }
    if (m.context==='ARAM' || m.context==='ARAM MAYHEM') {
      if (m.kills+m.assists>=25) return {key:'aram-brawl',pt:'CAOS CONTROLADO',en:'CONTROLLED CHAOS'};
      if (!m.win && m.damagePerMin>=900) return {key:'aram-pressure',pt:'PRESSÃO ATÉ O FIM',en:'PRESSURE TO THE END'};
    }
    if (m.pentaKills) return {key:'legendary',pt:'NOITE LENDÁRIA',en:'LEGENDARY NIGHT'};
    if (m.win && m.deaths >= 6 && m.kills + m.assists >= 16) return {key:'comeback',pt:'COMEBACK',en:'COMEBACK'};
    if (m.win && m.deaths <= 2 && m.score >= 85) return {key:'control',pt:'CONTROLE TOTAL',en:'TOTAL CONTROL'};
    if (m.teamDamageShare >= 30 || m.damagePerMin >= 900 || m.kills >= 12) return {key:'carry',pt:'CARRY',en:'CARRY'};
    if (m.vision >= 35 || m.ccSeconds >= 25 || m.assists >= 15) return {key:'utility',pt:'MAESTRO',en:'PLAYMAKER'};
    if (!m.win && m.deaths <= 4 && m.kills + m.assists >= 10) return {key:'resistance',pt:'RESISTÊNCIA',en:'RESISTANCE'};
    if (!m.win && m.damagePerMin >= 850) return {key:'pressure',pt:'PRESSÃO SEM CONVERSÃO',en:'PRESSURE WITHOUT CONVERSION'};
    return {key:m.win?'steady-win':'learning-loss',pt:m.win?'VITÓRIA CONSISTENTE':'DERROTA PARA REVISAR',en:m.win?'STEADY WIN':'LOSS TO REVIEW'};
  }

  function storyCopy(m) {
    const a=archetype(m);
    const copies={
      legendary:{pt:['Uma partida para guardar.','Você criou o tipo de momento que muda uma partida e vira lembrança.'],en:['A match worth keeping.','You created the kind of moment that changes a game and becomes a memory.']},
      comeback:{pt:['A partida em que cair não significou acabar.','O começo cobrou caro, mas sua presença cresceu justamente quando o jogo ficou mais difícil.'],en:['The match where falling behind did not mean the end.','The start was costly, but your presence grew exactly when the game became harder.']},
      control:{pt:['Você venceu antes do placar parecer decidido.','Poucas mortes, impacto alto e controle suficiente para não devolver a partida.'],en:['You won before the scoreboard looked decided.','Few deaths, high impact, and enough control to never hand the game back.']},
      carry:{pt:['Quando o time precisou de dano, você apareceu.','A partida girou ao redor da sua capacidade de transformar recursos em pressão real.'],en:['When the team needed damage, you showed up.','The match revolved around turning your resources into real pressure.']},
      utility:{pt:['Você fez a partida acontecer para os outros.','Visão, assistências e controle de espaço foram o fio invisível desta história.'],en:['You made the game happen for everyone else.','Vision, assists, and space control were the invisible thread of this story.']},
      resistance:{pt:['Você resistiu mais do que o resultado mostra.','A derrota esconde uma partida em que você ainda encontrou maneiras de manter o jogo vivo.'],en:['You held on longer than the result suggests.','The loss hides a game where you still found ways to keep it alive.']},
      pressure:{pt:['Você teve impacto. Faltou transformar pressão em mapa.','Os números mostram presença, mas o jogo terminou antes dessa força virar controle.'],en:['You had impact. The missing piece was converting pressure into map control.','The numbers show presence, but the game ended before that strength became control.']},
      'steady-win':{pt:['Você transformou consistência em vitória.','Sem depender de um único lance, sua partida foi construída por decisões que se acumularam.'],en:['You turned consistency into a win.','Without relying on one play, your match was built by decisions that accumulated.']},
      'learning-loss':{pt:['A partida acelerou antes de você estabilizar.','Nem toda derrota nasce em um único erro; aqui, o ritmo foi escapando em pequenas janelas.'],en:['The match accelerated before you stabilized.','Not every loss comes from one mistake; here, the pace slipped through smaller windows.']},
      'arena-champion':{pt:['Você terminou no topo da Arena.','Rounds agressivos, adaptação e sobrevivência convergiram para o primeiro lugar.'],en:['You finished on top of the Arena.','Aggressive rounds, adaptation, and survival converged into first place.']},
      'arena-top4':{pt:['Você foi longe na Arena.','A run se sustentou por rounds suficientes para transformar consistência em Top 4.'],en:['You made a deep Arena run.','The run held through enough rounds to turn consistency into a Top 4 finish.']},
      'arena-brawler':{pt:['Você transformou a Arena em guerra de atrito.','Mesmo sem o topo, sua participação em eliminações mostra uma run de combate constante.'],en:['You turned the Arena into a war of attrition.','Even without the top finish, your takedown involvement shows a constant fighting run.']},
      'arena-run':{pt:['Cada round contou uma parte da run.','Na Arena, a história não é sobre rota ou torres: é sobre sobreviver, adaptar e vencer confrontos.'],en:['Every round told part of the run.','In Arena, the story is not about lanes or towers: it is about surviving, adapting, and winning fights.']},
      'aram-brawl':{pt:['A ponte virou uma sequência de lutas sem pausa.','No ARAM, seu impacto veio da presença constante nas eliminações e do ritmo de combate.'],en:['The bridge became a nonstop chain of fights.','In ARAM, your impact came from constant takedown presence and combat pace.']},
      'aram-pressure':{pt:['Você manteve a pressão até o fim.','Mesmo na derrota, o dano por minuto mostra que você permaneceu relevante nas lutas.'],en:['You kept the pressure until the end.','Even in defeat, damage per minute shows you stayed relevant in fights.']}
    };
    return copies[a.key][locale()];
  }

  function computeScore(m) {
    if(m.context==='ARENA'){
      let score=48+(m.placement?Math.max(0,18-(m.placement-1)*3):0)+Math.min(18,(m.kills+m.assists)*.55)-Math.min(12,m.deaths*1.2);
      score+=Math.min(8,m.damagePerMin/180);
      return Math.max(35,Math.min(99,Math.round(score)));
    }
    let score=48+(m.win?10:0)+Math.min(16,(m.kills+m.assists)*.75)-Math.min(16,m.deaths*1.8);
    if(m.position==='SUPPORT') score+=Math.min(12,m.vision*.22)+Math.min(10,m.assists*.35)+Math.min(6,m.ccSeconds/8);
    else if(m.position==='JUNGLE') score+=Math.min(10,(m.dragonKills+m.baronKills+m.riftHeraldTakedowns)*3)+Math.min(8,m.objectiveDamage/2500);
    else score+=Math.min(9,m.damagePerMin/170)+Math.min(6,m.csPerMin||m.cs/Math.max(1,m.durationSeconds/60));
    if(m.firstBloodKill||m.firstBloodAssist) score+=3;
    if(m.pentaKills) score+=10; else if(m.quadraKills) score+=7; else if(m.tripleKills) score+=4;
    if(m.objectivesStolen) score+=6;
    return Math.max(35,Math.min(99,Math.round(score)));
  }

  function normalizeMatch(raw, i) {
    const p=raw?.participant || raw?.player || raw?.self || raw;
    const info=raw?.info || raw;
    const kills=safeNumber(p?.kills,raw?.kills), deaths=safeNumber(p?.deaths,raw?.deaths), assists=safeNumber(p?.assists,raw?.assists);
    const cs=safeNumber(p?.cs,raw?.cs,p?.totalMinionsKilled)+safeNumber(p?.neutralMinionsKilled);
    const kpRaw=p?.killParticipation ?? raw?.killParticipation;
    const kp=kpRaw == null ? Math.min(95,38+assists*2+kills) : Math.round(Number(kpRaw)<=1?Number(kpRaw)*100:Number(kpRaw));
    const m={
      id:raw?.metadata?.matchId || raw?.matchId || raw?.id || 'live-'+i,
      win:Boolean(p?.win ?? raw?.win),
      championName:p?.champion || p?.championName || raw?.champion || raw?.championName || 'Champion',
      queue:raw?.queueName || raw?.queue || raw?.context || 'League of Legends',
      durationSeconds:durationSeconds(raw,info),
      kills,deaths,assists,cs,
      vision:safeNumber(p?.vision,raw?.vision,p?.visionScore,raw?.visionScore),
      kp,
      gold:safeNumber(p?.gold,raw?.gold,p?.goldEarned,raw?.goldEarned),
      damage:safeNumber(p?.damage,raw?.damage,p?.totalDamageDealtToChampions),
      damagePerMin:safeNumber(p?.damagePerMin,raw?.damagePerMin),
      teamDamageShare:safeNumber(p?.teamDamageShare,raw?.teamDamageShare),
      objectiveDamage:safeNumber(p?.objectiveDamage,raw?.objectiveDamage,p?.damageDealtToObjectives),
      turretDamage:safeNumber(p?.turretDamage,raw?.turretDamage,p?.damageDealtToTurrets),
      turretTakedowns:safeNumber(p?.turretTakedowns,raw?.turretTakedowns),
      firstBloodKill:Boolean(p?.firstBloodKill ?? raw?.firstBloodKill),
      firstBloodAssist:Boolean(p?.firstBloodAssist ?? raw?.firstBloodAssist),
      soloKills:safeNumber(p?.soloKills,raw?.soloKills),
      doubleKills:safeNumber(p?.doubleKills,raw?.doubleKills),
      tripleKills:safeNumber(p?.tripleKills,raw?.tripleKills),
      quadraKills:safeNumber(p?.quadraKills,raw?.quadraKills),
      pentaKills:safeNumber(p?.pentaKills,raw?.pentaKills),
      largestKillingSpree:safeNumber(p?.largestKillingSpree,raw?.largestKillingSpree),
      objectivesStolen:safeNumber(p?.objectivesStolen,raw?.objectivesStolen),
      wardsPlaced:safeNumber(p?.wardsPlaced,raw?.wardsPlaced),
      wardsKilled:safeNumber(p?.wardsKilled,raw?.wardsKilled),
      controlWards:safeNumber(p?.controlWards,raw?.controlWards),
      ccSeconds:safeNumber(p?.ccSeconds,raw?.ccSeconds,p?.timeCCingOthers),
      position:p?.position || raw?.position || null,
      context:String(p?.context || raw?.context || raw?.queue || '').toUpperCase(),
      placement:safeNumber(p?.placement,raw?.placement),
      augments:Array.isArray(p?.augments)?p.augments:(Array.isArray(raw?.augments)?raw.augments:[]),
      items:Array.isArray(p?.items)?p.items:(Array.isArray(raw?.items)?raw.items:[]),
      runeStyles:Array.isArray(p?.runeStyles)?p.runeStyles:(Array.isArray(raw?.runeStyles)?raw.runeStyles:[]),
      summonerSpells:Array.isArray(p?.summonerSpells)?p.summonerSpells:(Array.isArray(raw?.summonerSpells)?raw.summonerSpells:[]),
      dragonKills:safeNumber(p?.dragonKills,raw?.dragonKills),
      baronKills:safeNumber(p?.baronKills,raw?.baronKills),
      riftHeraldTakedowns:safeNumber(p?.riftHeraldTakedowns,raw?.riftHeraldTakedowns),
      csPerMin:safeNumber(p?.csPerMin,raw?.csPerMin),
      visionPerMin:safeNumber(p?.visionPerMin,raw?.visionPerMin),
      goldPerMin:safeNumber(p?.goldPerMin,raw?.goldPerMin)
    };
    m.score=safeNumber(raw?.score)||computeScore(m);
    m.moments=buildMoments(m);
    return m;
  }

  function buildMoments(m) {
    const total=Math.max(900,m.durationSeconds||1800);
    const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.round(s)%60).padStart(2,'0');
    const moments=[];
    if(m.context==='ARENA') {
      moments.push({m:fmt(total*.22),pt:'Primeiros rounds',en:'Opening rounds',dpt:'A Arena começou testando dano, sobrevivência e a sinergia da dupla.',den:'Arena opened by testing damage, survival, and duo synergy.'});
      moments.push({m:fmt(total*.58),pt:'A run ganhou forma',en:'The run took shape',dpt:m.kills+m.assists>=20?'Sua presença em eliminações manteve pressão alta conforme os rounds ficaram mais difíceis.':'A adaptação entre rounds passou a valer mais do que qualquer vantagem inicial.',den:m.kills+m.assists>=20?'Your takedown involvement kept pressure high as rounds became harder.':'Adapting between rounds started to matter more than any early edge.'});
      moments.push({m:fmt(total*.84),pt:m.placement===1?'Último round, primeiro lugar':m.placement>0?`Fim da run: #${m.placement}`:'Fim da run',en:m.placement===1?'Final round, first place':m.placement>0?`Run ended: #${m.placement}`:'End of the run',dpt:m.placement===1?'A run fechou no topo: sobrevivência e conversão até o último confronto.':m.placement>0?`Você encerrou a Arena na colocação #${m.placement}.`:'A run terminou depois de uma sequência de confrontos progressivamente mais difíceis.',den:m.placement===1?'The run finished on top: survival and conversion through the last fight.':m.placement>0?`You finished Arena in place #${m.placement}.`:'The run ended after a sequence of progressively harder fights.'});
      return moments;
    }
    if(m.firstBloodKill||m.firstBloodAssist) moments.push({m:fmt(total*.12),pt:'Você apareceu no primeiro sangue',en:'You were there for first blood',dpt:m.firstBloodKill?'A primeira eliminação da partida foi sua.':'Você participou da primeira eliminação e ajudou a abrir o placar.',den:m.firstBloodKill?'The first kill of the match was yours.':'You contributed to first blood and helped open the game.'});
    else moments.push({m:fmt(total*.24),pt:'Primeiro retrato da partida',en:'First snapshot of the match',dpt:m.deaths<=2?'Você manteve risco baixo e preservou recursos.':'O começo exigiu recuperação antes das lutas maiores.',den:m.deaths<=2?'You kept risk low and preserved resources.':'The opening demanded recovery before larger fights.'});

    if(m.pentaKills||m.quadraKills||m.tripleKills||m.doubleKills) {
      const label=m.pentaKills?'Pentakill':m.quadraKills?'Quadrakill':m.tripleKills?'Triple kill':'Double kill';
      moments.push({m:fmt(total*.58),pt:label+' mudou o ritmo',en:label+' changed the pace',dpt:'Uma sequência de eliminações concentrou seu maior pico de impacto da partida.',den:'A multi-kill sequence concentrated your biggest impact spike of the match.'});
    } else if(m.largestKillingSpree>=5) {
      moments.push({m:fmt(total*.58),pt:'Você entrou em sequência',en:'You went on a streak',dpt:`Sua maior sequência chegou a ${m.largestKillingSpree} eliminações sem cair.`,den:`Your biggest streak reached ${m.largestKillingSpree} kills without dying.`});
    } else {
      moments.push({m:fmt(total*.57),pt:'A partida mudou de escala',en:'The match changed scale',dpt:m.kills+m.assists>=12?'Sua participação começou a pesar nas lutas coletivas.':'As lutas cresceram, a janela de impacto ficou mais apertada.',den:m.kills+m.assists>=12?'Your participation started to matter in team fights.':'As fights grew, the impact window became tighter.'});
    }

    if(m.objectivesStolen) moments.push({m:fmt(total*.8),pt:'Um objetivo roubado virou o mapa',en:'An objective steal flipped the map',dpt:'Você tirou um objetivo das mãos do adversário e criou uma mudança imediata de pressão.',den:'You stole an objective and created an immediate pressure swing.'});
    else if(m.turretTakedowns>=2 || m.turretDamage>=4000) moments.push({m:fmt(total*.82),pt:'Pressão virou estrutura',en:'Pressure became structures',dpt:'Seu impacto saiu das lutas e apareceu diretamente nas torres.',den:'Your impact moved beyond fights and showed up directly on structures.'});
    else moments.push({m:fmt(total*.82),pt:m.win?'A janela decisiva':'O momento decisivo',en:m.win?'The decisive window':'The decisive moment',dpt:m.win?'O time converteu pressão e fechou a partida.':'A última sequência definiu o mapa antes de uma nova recuperação.',den:m.win?'The team converted pressure and closed the game.':'The final sequence decided the map before another recovery was possible.'});
    return moments.slice(0,3);
  }

  function applyI18n() {
    document.documentElement.lang=locale()==='pt'?'pt-BR':'en';
    document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(key==='heroTitle')el.innerHTML=t(key);else el.textContent=t(key);});
    $('#langBtn').textContent=locale()==='pt'?'EN':'PT';
    if(state.matches.length){renderRail();renderSelected();}
  }

  function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600);}
  function setSource(type,message){const el=$('#sourceState');el.className='source-state '+type;el.textContent=message;}

  function adaptResponse(data) {
    const list=data?.matches || data?.recentMatches || data?.data?.matches || [];
    return Array.isArray(list)?list.map(normalizeMatch):[];
  }

  async function fetchLive(lookup) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
    try{
      const res=await fetch(backend.lolProfile,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gameName:lookup.gameName,tagLine:lookup.tagLine,platform:lookup.platform,region:platformRegion(lookup.platform),limit:12,matchLimit:12}),signal:controller.signal});
      let data=null;try{data=await res.json();}catch{}
      if(!res.ok||data?.error)throw Object.assign(new Error(data?.message||'lookup_failed'),{status:res.status,code:data?.error});
      return data;
    }finally{clearTimeout(timer);}
  }

  async function fetchTimeline(match) {
    if(!state.live || !match?.id || String(match.id).startsWith('demo-') || !backend.lolMatchStory) return null;
    if(state.timelineCache.has(match.id)) return state.timelineCache.get(match.id);
    const res=await fetch(backend.lolMatchStory,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      matchId:match.id,
      gameName:state.lookup.gameName,
      tagLine:state.lookup.tagLine,
      platform:state.lookup.platform,
      region:platformRegion(state.lookup.platform)
    })});
    let data=null;try{data=await res.json();}catch{}
    if(!res.ok||data?.error) throw Object.assign(new Error(data?.error||'timeline_failed'),{status:res.status});
    state.timelineCache.set(match.id,data);
    return data;
  }

  function timelineMoment(e,m) {
    if(!e) return null;
    if(e.type==='KILL') return {m:e.time,pt:'Eliminação no momento certo',en:'A kill at the right moment',dpt:'Você participou diretamente da pressão ao eliminar um adversário.',den:'You directly added pressure by securing a kill.'};
    if(e.type==='ASSIST') return {m:e.time,pt:'Você entrou na jogada',en:'You joined the play',dpt:'Sua assistência conectou você a uma eliminação importante.',den:'Your assist connected you to an important takedown.'};
    if(e.type==='DEATH') return {m:e.time,pt:'A partida cobrou um preço',en:'The match charged a price',dpt:'Uma morte abriu espaço para o adversário e mudou o ritmo por alguns instantes.',den:'A death opened space for the enemy and shifted the pace for a while.'};
    if(e.type==='OBJECTIVE') return {m:e.time,pt:`Objetivo: ${e.objective||'controle de mapa'}`,en:`Objective: ${e.objective||'map control'}`,dpt:'Seu time converteu pressão em um objetivo real.',den:'Your team converted pressure into a real objective.'};
    if(e.type==='STRUCTURE') return {m:e.time,pt:'Pressão virou estrutura',en:'Pressure became a structure',dpt:'A vantagem foi convertida em espaço permanente no mapa.',den:'The advantage was converted into permanent map space.'};
    if(e.type==='MULTI_KILL') return {m:e.time,pt:`Sequência de ${e.count} eliminações`,en:`${e.count}-kill sequence`,dpt:'Esse foi um dos maiores picos de impacto individual da partida.',den:'This was one of the largest individual impact spikes of the match.'};
    return null;
  }

  async function loadTimelineForSelected() {
    const m=state.matches[state.selected]; if(!m) return;
    const source=$('#timelineSource');
    if(!state.live || m.context==='ARENA'){
      source.textContent=locale()==='pt'?'Narrativa contextual do modo.':'Mode-contextual narrative.';
      return;
    }
    source.textContent=locale()==='pt'?'Carregando eventos reais da partida…':'Loading real match events…';
    try{
      const data=await fetchTimeline(m);
      if(!data){source.textContent='';return;}
      const picks=[];
      if(data.firstBlood) picks.push(data.firstBlood);
      if(data.turningPoint && !picks.some(x=>x.timestamp===data.turningPoint.timestamp)) picks.push(data.turningPoint);
      const last=[...(data.events||[])].reverse().find(x=>x.type==='OBJECTIVE'||x.type==='STRUCTURE'||x.type==='KILL'||x.type==='ASSIST');
      if(last && !picks.some(x=>x.timestamp===last.timestamp)) picks.push(last);
      const moments=picks.map(x=>timelineMoment(x,m)).filter(Boolean).slice(0,3);
      if(moments.length){
        m.moments=moments;
        m.timelineReal=true;
        $('#moments').innerHTML=m.moments.map(x=>`<div class="moment"><span class="moment-time">${x.m}</span><div><strong>${esc(locale()==='pt'?x.pt:x.en)}</strong><p>${esc(locale()==='pt'?x.dpt:x.den)}</p></div></div>`).join('');
      }
      source.textContent=locale()==='pt'?'Timeline real do Match-V5.':'Real Match-V5 timeline.';
    }catch{
      source.textContent=locale()==='pt'?'Timeline real indisponível; mantendo leitura estimada.':'Real timeline unavailable; keeping estimated narrative.';
    }
  }

  function renderRail() {
    $('#matchRail').innerHTML=state.matches.map((m,i)=>`<button class="match-pill ${i===state.selected?'active':''}" data-index="${i}"><span class="mini-result ${m.win?'win':'loss'}">${m.context==='ARENA'&&m.placement?'#'+m.placement:(m.win?(locale()==='pt'?'V':'W'):(locale()==='pt'?'D':'L'))}</span><span><strong>${esc(m.championName)}</strong><small>${m.kills}/${m.deaths}/${m.assists}</small></span></button>`).join('');
    document.querySelectorAll('.match-pill').forEach(b=>b.addEventListener('click',()=>{state.selected=Number(b.dataset.index);renderRail();renderSelected();updateShareUrl();loadTimelineForSelected();}));
  }

  function renderSelected() {
    const m=state.matches[state.selected];if(!m)return;
    const mins=Math.floor(m.durationSeconds/60),secs=String(m.durationSeconds%60).padStart(2,'0');
    const copy=storyCopy(m),a=archetype(m);
    $('#storyKicker').textContent=`${String(m.queue).toUpperCase()} • ${mins}:${secs}`;
    $('#storyTitle').textContent=copy[0];$('#storySubtitle').textContent=copy[1];
    $('#archetypeBadge').textContent=locale()==='pt'?a.pt:a.en;
    $('#resultBadge').textContent=m.context==='ARENA' && m.placement ? `#${m.placement}` : (m.win?(locale()==='pt'?'VITÓRIA':'VICTORY'):(locale()==='pt'?'DERROTA':'DEFEAT'));
    $('#resultBadge').className='result '+(m.win?'win':'loss');
    $('#championName').textContent=m.championName;$('#kda').textContent=`${m.kills} / ${m.deaths} / ${m.assists}`;
    $('#csValue').textContent=m.cs||'—';$('#visionValue').textContent=m.vision||'—';$('#kpValue').textContent=(m.kp||0)+'%';$('#goldValue').textContent=m.gold?(m.gold/1000).toFixed(1)+'k':'—';$('#impactScore').textContent=m.score;
    $('#impactRing').style.setProperty('--score',m.score);
    $('#storyCard').style.setProperty('--cover',`url("${championSplash(m.championName)}")`);
    $('#openingTitle').textContent=m.context==='ARENA' ? (locale()==='pt'?'A run começou pela adaptação.':'The run started with adaptation.') : (locale()==='pt'?(m.firstBloodKill?'Você abriu o placar.':m.deaths<=3?'Você construiu espaço sem entregar cedo.':'O começo exigiu recuperação.'):(m.firstBloodKill?'You opened the scoreboard.':m.deaths<=3?'You built space without giving the game away early.':'The opening demanded recovery.'));
    const pace=m.damagePerMin? `${Math.round(m.damagePerMin)} DPM` : `${m.kills+m.assists} participações`;
    $('#openingText').textContent=m.context==='ARENA' ? (locale()==='pt'?`Na Arena, ${m.kills+m.assists} participações e ${m.augments.length||0} augments ajudam a contar como a run ganhou força.`:`In Arena, ${m.kills+m.assists} takedown contributions and ${m.augments.length||0} augments help tell how the run built momentum.`) : (locale()==='pt'?`Com ${m.cs||0} CS, ${m.vision||0} de visão e ${pace}, o início ajuda a explicar como seu ritmo foi construído.`:`With ${m.cs||0} CS, ${m.vision||0} vision and ${pace}, the opening helps explain how your pace was built.`);
    $('#impactTitle').textContent=locale()==='pt'?`Impacto geral: ${m.score}/100.`:`Overall impact: ${m.score}/100.`;
    const damageK=m.damage?(m.damage/1000).toFixed(1):null;
    $('#impactText').textContent=locale()==='pt'
      ? (damageK?`Você terminou com ${m.kills+m.assists} participações, ${m.deaths} mortes e ${damageK}k de dano a campeões.`:`Você terminou com ${m.kills+m.assists} participações e ${m.deaths} mortes, com impacto distribuído ao longo da partida.`)
      : (damageK?`You finished with ${m.kills+m.assists} takedown contributions, ${m.deaths} deaths and ${damageK}k champion damage.`:`You finished with ${m.kills+m.assists} takedown contributions and ${m.deaths} deaths, with impact spread across the match.`);
    $('#endingTitle').textContent=m.context==='ARENA' ? (locale()==='pt'?(m.placement===1?'A run terminou no topo.':`A run terminou em #${m.placement||'—'}.`):(m.placement===1?'The run ended on top.':`The run ended at #${m.placement||'—'}.`)) : (locale()==='pt'?(m.win?'O último capítulo foi de conversão.':'O último capítulo mostra onde a recuperação parou.'):(m.win?'The final chapter was about conversion.':'The final chapter shows where the recovery stopped.'));
    $('#endingText').textContent=m.context==='ARENA' ? (locale()==='pt'?'Na Arena, o resultado resume uma sequência de rounds: composição, augments, sobrevivência e execução pesaram até o fim.':'In Arena, the result summarizes a sequence of rounds: composition, augments, survival, and execution mattered until the end.') : (locale()==='pt'?(m.win?'A vantagem só importou quando virou espaço, estruturas ou objetivo. Essa foi a assinatura desta vitória.':'Mesmo com momentos bons, a partida terminou antes de uma nova janela segura aparecer.'):(m.win?'The lead only mattered once it became space, structures, or objectives. That was the signature of this win.':'Even with good moments, the match ended before another safe window appeared.'));
    $('#moments').innerHTML=m.moments.map(x=>`<div class="moment"><span class="moment-time">${x.m}</span><div><strong>${esc(locale()==='pt'?x.pt:x.en)}</strong><p>${esc(locale()==='pt'?x.dpt:x.den)}</p></div></div>`).join('');
    const chips=locale()==='pt'
      ? (m.context==='ARENA' ? [`#${m.placement||'—'} colocação`,`${m.kills+m.assists} participações`,`${m.augments.length||0} augments`,m.damagePerMin?`${Math.round(m.damagePerMin)} DPM`:'Run de Arena'] : [`${m.kills+m.assists} participações`,m.damagePerMin?`${Math.round(m.damagePerMin)} DPM`:`${m.vision} visão`,m.largestKillingSpree>=3?`Sequência x${m.largestKillingSpree}`:`${m.cs} CS`,m.win?'Vitória convertida':'Derrota revisável'])
      : (m.context==='ARENA' ? [`#${m.placement||'—'} placement`,`${m.kills+m.assists} takedowns`,`${m.augments.length||0} augments`,m.damagePerMin?`${Math.round(m.damagePerMin)} DPM`:'Arena run'] : [`${m.kills+m.assists} takedowns`,m.damagePerMin?`${Math.round(m.damagePerMin)} DPM`:`${m.vision} vision`,m.largestKillingSpree>=3?`Streak x${m.largestKillingSpree}`:`${m.cs} CS`,m.win?'Converted win':'Reviewable loss']);
    $('#highlights').innerHTML=chips.map(x=>`<div class="highlight">${esc(x)}</div>`).join('');
    renderComparison(m);
    renderMatchDetails(m);
  }

  function metricDelta(value,avg,suffix=''){
    if(!Number.isFinite(value)||!Number.isFinite(avg)||avg===0) return '—';
    const pct=Math.round((value-avg)/Math.abs(avg)*100);
    return (pct>0?'+':'')+pct+'%'+suffix;
  }

  function renderComparison(m){
    const peers=state.matches.filter((x,i)=>i!==state.selected && x.context===m.context);
    const box=$('#comparison');
    if(!peers.length){box.innerHTML='';return;}
    const avg=k=>peers.reduce((a,x)=>a+Number(x[k]||0),0)/peers.length;
    const kda=(m.kills+m.assists)/Math.max(1,m.deaths);
    const peerKda=peers.reduce((a,x)=>a+((x.kills+x.assists)/Math.max(1,x.deaths)),0)/peers.length;
    const items=[
      [locale()==='pt'?'Impacto vs média':'Impact vs avg',metricDelta(m.score,avg('score'))],
      [locale()==='pt'?'KDA vs média':'KDA vs avg',metricDelta(kda,peerKda)],
      [m.context==='ARENA'?(locale()==='pt'?'Colocação':'Placement'):'DPM',m.context==='ARENA'?(m.placement?('#'+m.placement):'—'):metricDelta(m.damagePerMin,avg('damagePerMin'))]
    ];
    box.innerHTML=`<div class="chapter-label">${locale()==='pt'?'COMPARAÇÃO COM PARTIDAS DO MESMO MODO':'COMPARISON WITH SAME-MODE MATCHES'}</div><div class="comparison-grid">${items.map(([a,b])=>`<div class="comparison-item"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join('')}</div>`;
  }

  const spellNames={4:'Flash',14:'Ignite',12:'Teleport',7:'Heal',3:'Exhaust',11:'Smite',6:'Ghost',21:'Barrier'};
  function renderMatchDetails(m){
    const box=$('#matchDetails');
    const groups=[];
    if(m.items.length) groups.push([locale()==='pt'?'Itens':'Items',m.items.map(id=>`<span class="detail-chip"><img alt="" loading="lazy" src="https://ddragon.leagueoflegends.com/cdn/${state.ddVersion}/img/item/${id}.png">#${id}</span>`).join('')]);
    if(m.summonerSpells.length) groups.push([locale()==='pt'?'Feitiços':'Summoner spells',m.summonerSpells.map(id=>`<span class="detail-chip">${esc(spellNames[id]||('Spell '+id))}</span>`).join('')]);
    if(m.runeStyles.length) groups.push([locale()==='pt'?'Runas':'Runes',m.runeStyles.map(r=>`<span class="detail-chip">Style ${esc(r.style||'—')}</span>`).join('')]);
    if(m.augments.length) groups.push(['Augments',m.augments.map(id=>`<span class="detail-chip">#${esc(id)}</span>`).join('')]);
    const objectiveBits=[];
    if(m.dragonKills) objectiveBits.push((locale()==='pt'?'Dragões ':'Dragons ')+m.dragonKills);
    if(m.baronKills) objectiveBits.push('Baron '+m.baronKills);
    if(m.riftHeraldTakedowns) objectiveBits.push((locale()==='pt'?'Arauto ':'Herald ')+m.riftHeraldTakedowns);
    if(m.objectivesStolen) objectiveBits.push((locale()==='pt'?'Roubos ':'Steals ')+m.objectivesStolen);
    if(objectiveBits.length) groups.push([locale()==='pt'?'Objetivos':'Objectives',objectiveBits.map(x=>`<span class="detail-chip">${esc(x)}</span>`).join('')]);
    box.innerHTML=groups.map(([title,html])=>`<section><h4>${esc(title)}</h4><div class="detail-row">${html}</div></section>`).join('');
  }

  function shareUrl(){
    const m=state.matches[state.selected];
    const u=new URL(location.href);
    if(state.lookup){u.searchParams.set('gameName',state.lookup.gameName);u.searchParams.set('tagLine',state.lookup.tagLine);u.searchParams.set('platform',state.lookup.platform);}
    if(m?.id && !String(m.id).startsWith('demo-')) u.searchParams.set('match',m.id); else u.searchParams.delete('match');
    return u.toString();
  }
  function updateShareUrl(){
    if(!state.live) return;
    const u=new URL(shareUrl());
    history.replaceState(null,'',u.pathname+u.search+u.hash);
  }
  function showStory(){
    $('#storyApp').classList.remove('hidden');
    $('#playerTitle').textContent=`${state.lookup.gameName}#${state.lookup.tagLine}`;
    renderRail();renderSelected();updateShareUrl();loadTimelineForSelected();
    $('#storyApp').scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function runLookup(useDemo=false) {
    const gameName=$('#gameName').value.trim(),tagLine=$('#tagLine').value.trim().replace('#',''),platform=$('#platform').value;
    if(!gameName||!tagLine){toast(locale()==='pt'?'Preencha seu Riot ID.':'Enter your Riot ID.');return;}
    state.lookup={gameName,tagLine,platform};state.selected=0;
    if(useDemo){state.matches=demoMatches.map(normalizeMatch);state.live=false;setSource('demo',locale()==='pt'?'Modo demonstrativo: história construída com dados de exemplo.':'Demo mode: story built with example data.');showStory();return;}
    setSource('loading',locale()==='pt'?'Buscando suas partidas recentes…':'Loading your recent matches…');
    try{
      const data=await fetchLive(state.lookup),matches=adaptResponse(data);
      if(!matches.length)throw new Error('empty_matches');
      state.matches=matches;state.live=true;
      const canonical=data?.player;if(canonical?.gameName){state.lookup.gameName=canonical.gameName;state.lookup.tagLine=canonical.tagLine||tagLine;}
      setSource('live',locale()==='pt'?`Dados Riot carregados: ${matches.length} partidas recentes.`:`Riot data loaded: ${matches.length} recent matches.`);
      showStory();
    }catch(err){
      state.matches=demoMatches.map(normalizeMatch);state.live=false;
      const rate=err?.status===429||err?.code==='rate_limited';
      setSource('demo',locale()==='pt'?(rate?'A Riot limitou a consulta temporariamente. Exibindo uma história de exemplo até ser possível atualizar.':'Dados Riot indisponíveis agora. Mantivemos um exemplo claramente identificado para você conhecer a experiência.'):(rate?'Riot temporarily rate-limited the lookup. Showing an example story until data can be refreshed.':'Riot data is unavailable right now. A clearly labeled example is shown so you can explore the experience.'));
      showStory();
    }
  }

  function roundedRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}

  function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){
    const words=String(text).split(/\s+/);let line='',lines=[];
    for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}
    if(line)lines.push(line);lines=lines.slice(0,maxLines);
    lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));return y+lines.length*lineHeight;
  }

  function drawShareCard() {
    const m=state.matches[state.selected];if(!m)return null;
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');
    const g=ctx.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#111a2b');g.addColorStop(.55,'#080b12');g.addColorStop(1,'#17130b');ctx.fillStyle=g;ctx.fillRect(0,0,1080,1350);
    ctx.fillStyle='#d7b15d';ctx.font='800 28px system-ui';ctx.fillText('LOL MATCH STORY',70,90);
    ctx.fillStyle='#74829a';ctx.font='600 24px system-ui';ctx.fillText(state.lookup?`${state.lookup.gameName}#${state.lookup.tagLine}`:'',70,132);
    const a=archetype(m);ctx.fillStyle='#2a2214';roundedRect(ctx,70,190,420,62,18);ctx.fillStyle='#e2bd65';ctx.font='900 27px system-ui';ctx.fillText(locale()==='pt'?a.pt:a.en,94,231);
    ctx.fillStyle='#f5f7fb';ctx.font='900 72px system-ui';const copy=storyCopy(m);let next=wrapText(ctx,copy[0],70,350,940,84,3);
    ctx.fillStyle='#aab4c4';ctx.font='500 32px system-ui';next=wrapText(ctx,copy[1],70,next+32,900,46,3);
    ctx.fillStyle=m.win?'#63e5cd':'#ff8e98';ctx.font='900 30px system-ui';ctx.fillText(m.win?(locale()==='pt'?'VITÓRIA':'VICTORY'):(locale()==='pt'?'DERROTA':'DEFEAT'),70,next+72);
    ctx.fillStyle='#f5f7fb';ctx.font='800 48px system-ui';ctx.fillText(m.championName,70,next+135);ctx.font='700 34px system-ui';ctx.fillText(`${m.kills} / ${m.deaths} / ${m.assists}`,70,next+185);
    const stats=[['CS',m.cs||'—'],[locale()==='pt'?'VISÃO':'VISION',m.vision||'—'],['KP',(m.kp||0)+'%'],['IMPACT',m.score+'/100']];
    stats.forEach((s,i)=>{const x=70+i*235;ctx.fillStyle='#111927';roundedRect(ctx,x,970,210,130,20);ctx.fillStyle='#77859a';ctx.font='700 20px system-ui';ctx.fillText(s[0],x+22,1010);ctx.fillStyle='#f5f7fb';ctx.font='900 38px system-ui';ctx.fillText(String(s[1]),x+22,1068);});
    ctx.fillStyle='#526078';ctx.font='500 22px system-ui';ctx.fillText(locale()==='pt'?'Sua partida. Sua história.':'Your match. Your story.',70,1235);ctx.fillStyle='#d7b15d';ctx.font='800 24px system-ui';ctx.fillText('LoL Match Story',70,1280);
    return canvas;
  }

  function downloadCard(){
    const canvas=drawShareCard();if(!canvas)return;
    canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);const m=state.matches[state.selected];const champion=String(m.championName||'match').toLowerCase().replace(/[^a-z0-9]+/g,'-');a.download=`lol-match-story-${champion}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast(locale()==='pt'?'Card PNG gerado.':'PNG card generated.');},'image/png');
  }

  $('#lookupForm').addEventListener('submit',e=>{e.preventDefault();runLookup(false);});
  $('#demoBtn').addEventListener('click',()=>runLookup(true));
  $('#refreshBtn').addEventListener('click',()=>runLookup(false));
  $('#langBtn').addEventListener('click',()=>{state.locale=locale()==='pt'?'en':'pt';localStorage.setItem('lms-locale',state.locale);applyI18n();});
  $('#downloadBtn').addEventListener('click',downloadCard);
  $('#shareBtn').addEventListener('click',async()=>{const m=state.matches[state.selected];if(!m)return;const text=locale()==='pt'?`${m.championName} • ${m.kills}/${m.deaths}/${m.assists} • ${m.win?'Vitória':'Derrota'} — minha partida contada no LoL Match Story.`:`${m.championName} • ${m.kills}/${m.deaths}/${m.assists} • ${m.win?'Victory':'Defeat'} — my match told by LoL Match Story.`;try{if(navigator.share)await navigator.share({title:'LoL Match Story',text,url:location.href});else{await navigator.clipboard.writeText(text+' '+location.href);toast(locale()==='pt'?'Resumo copiado.':'Summary copied.');}}catch{}});

  applyI18n();
})();