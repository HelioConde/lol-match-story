(() => {
  const backend=window.LOL_MATCH_STORY_BACKEND||{};
  const $=s=>document.querySelector(s);
  const publicCopies={
    pt:{
      createOwn:'Criar minha história',createOwnArrow:'Criar minha história →',loading:'Carregando história…',
      portrait:'O RETRATO DA PARTIDA',highlights:'DESTAQUES',helpImprove:'AJUDE A MELHORAR',
      feedbackTitle:'Essa história ajudou você a entender a partida?',feedbackYes:'Sim, ficou claro',feedbackNo:'Ainda não',
      whatMissing:'O que faltou?',tooGeneric:'Ficou genérica',wrongContext:'Contexto incorreto',missingEvent:'Faltou um evento importante',
      shareTitle:'Quer transformar sua própria partida em história?',shareText:'Busque seu Riot ID e gere uma narrativa visual das suas partidas recentes.',
      shareStory:'Compartilhar esta história',footerDisclaimer:'Produto independente. Não afiliado à Riot Games.',
      sending:'Enviando feedback…',feedbackThanks:'Obrigado. Esse feedback entra na validação do Match Story.',feedbackError:'Não foi possível enviar agora.',
      shareMessage:'Veja esta partida contada como uma história no LoL Match Story.',copied:'Link copiado',
      invalidLink:'Link de história inválido.',unavailable:'Esta história não está disponível. Ela pode ainda não ter sido publicada.'
    },
    en:{
      createOwn:'Create my story',createOwnArrow:'Create my story →',loading:'Loading story…',
      portrait:'THE MATCH SNAPSHOT',highlights:'HIGHLIGHTS',helpImprove:'HELP US IMPROVE',
      feedbackTitle:'Did this story help you understand the match?',feedbackYes:'Yes, it was clear',feedbackNo:'Not yet',
      whatMissing:'What was missing?',tooGeneric:'Too generic',wrongContext:'Wrong context',missingEvent:'An important event was missing',
      shareTitle:'Want to turn your own match into a story?',shareText:'Search your Riot ID and generate a visual narrative from your recent matches.',
      shareStory:'Share this story',footerDisclaimer:'Independent product. Not affiliated with Riot Games.',
      sending:'Sending feedback…',feedbackThanks:'Thanks. This feedback helps validate Match Story.',feedbackError:'Could not send it right now.',
      shareMessage:'See this League of Legends match told as a story in LoL Match Story.',copied:'Link copied',
      invalidLink:'Invalid story link.',unavailable:'This story is not available. It may not have been published yet.'
    }
  };
  let publicLocale=localStorage.getItem('lms-locale')==='en'?'en':'pt';
  const tr=key=>publicCopies[publicLocale]?.[key]||publicCopies.pt[key]||key;
  const localized=(pt,en)=>publicLocale==='pt'?pt:en;
  function applyPublicLocale(){
    document.documentElement.lang=publicLocale==='pt'?'pt-BR':'en';
    document.querySelectorAll('[data-public-i18n]').forEach(el=>{el.textContent=tr(el.dataset.publicI18n);});
    const btn=$('#publicLangBtn');
    if(btn){
      btn.textContent=publicLocale==='pt'?'EN':'PT';
      btn.setAttribute('aria-label',publicLocale==='pt'?'Switch to English':'Mudar para português');
    }
  }
  const escText=(el,value)=>{if(el)el.textContent=String(value??'')};
  const championAssetName=name=>{
    const map={Wukong:'MonkeyKing',"Kai'Sa":'Kaisa',Kaisa:'Kaisa',"Kha'Zix":'Khazix',Khazix:'Khazix',"Cho'Gath":'Chogath',Chogath:'Chogath',"Rek'Sai":'RekSai',RekSai:'RekSai',"Bel'Veth":'Belveth',BelVeth:'Belveth',LeBlanc:'Leblanc',VelKoz:'Velkoz'};
    return map[name]||String(name||'Ahri').replace(/[^A-Za-z0-9]/g,'');
  };
  const splash=name=>`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championAssetName(name)}_0.jpg`;
  const formatRiotId=value=>{
    const raw=String(value||'');
    const i=raw.lastIndexOf('#');
    return i>0?`${raw.slice(0,i)}#${raw.slice(i+1).toUpperCase()}`:raw;
  };
  const n=v=>Number(v||0);
  let currentMatchId=null,currentContext=null,currentStory=null;

  function resultTone(m){
    if(m?.context==='ARENA'&&m?.placement){
      if(Number(m.placement)===1)return 'win';
      if(Number(m.placement)<=4)return 'placement';
      return 'loss';
    }
    return m?.win?'win':'loss';
  }

  function score(m){
    if(m.context==='ARENA'){
      return Math.max(35,Math.min(99,Math.round(48+(m.placement?Math.max(0,18-(m.placement-1)*3):0)+Math.min(18,(n(m.kills)+n(m.assists))*.55)-Math.min(12,n(m.deaths)*1.2)+Math.min(8,n(m.damagePerMin)/180))));
    }
    return Math.max(35,Math.min(99,Math.round(50+(m.win?10:0)+Math.min(18,(n(m.kills)+n(m.assists))*.75)-Math.min(16,n(m.deaths)*1.8)+Math.min(9,n(m.damagePerMin)/170))));
  }

  function archetype(m){
    if(m.context==='ARENA'){
      if(m.placement===1)return [localized('CAMPEÃO DA ARENA','ARENA CHAMPION'),localized('Você terminou no topo da Arena.','You finished on top of the Arena.'),localized('Rodadas, adaptação e sobrevivência convergiram para o primeiro lugar.','Rounds, adaptation, and survival came together for first place.')];
      if(m.placement&&m.placement<=4)return [localized('TOP 4 NA ARENA','ARENA TOP 4'),localized('Você foi longe na Arena.','You made a deep Arena run.'),localized('A campanha se sustentou até uma colocação de destaque.','The run held together through a standout finish.')];
      return [localized('CAMPANHA DE ARENA','ARENA RUN'),localized('Cada rodada contou uma parte da campanha.','Every round told part of the run.'),localized('Na Arena, sobreviver e adaptar importou tanto quanto eliminar.','In Arena, surviving and adapting mattered as much as eliminating opponents.')];
    }
    if(m.pentaKills)return [localized('NOITE LENDÁRIA','LEGENDARY NIGHT'),localized('Uma partida para guardar.','A match worth keeping.'),localized('Um Pentakill transformou esta partida em memória.','A Pentakill turned this match into a memory.')];
    if(n(m.damagePerMin)>=900||n(m.teamDamageShare)>=30||n(m.kills)>=12)return ['CARRY',localized('Quando o time precisou de pressão, você apareceu.','When the team needed pressure, you showed up.'),localized('Dano e participação colocaram você no centro da história.','Damage and participation put you at the center of the story.')];
    if(n(m.vision)>=35||n(m.assists)>=15)return [localized('MAESTRO','PLAYMAKER'),localized('Você fez a partida acontecer para os outros.','You made the match happen for everyone else.'),localized('Assistências e controle ajudaram a construir o resultado.','Assists and control helped build the result.')];
    if(m.win)return [localized('VITÓRIA CONSISTENTE','CONSISTENT WIN'),localized('Você transformou consistência em vitória.','You turned consistency into a win.'),localized('O resultado foi construído ao longo da partida, não em um único lance.','The result was built across the match, not in a single play.')];
    return [localized('DERROTA PARA REVISAR','A LOSS TO REVIEW'),localized('A partida escapou em pequenas janelas.','The match slipped away in small windows.'),localized('O resultado final mostra onde vale olhar com mais atenção.','The final result shows where a closer look is worthwhile.')];
  }
  function render(story){
    const m=story?.story_data?.match;
    if(!m)throw new Error('invalid_story');
    currentStory=story;
    const champ=m.champion||'Champion',arc=archetype(m),impact=score(m),seconds=n(m.durationSeconds),mins=Math.floor(seconds/60),secs=String(seconds%60).padStart(2,'0');
    $('#publicCover').style.setProperty('--cover',`url("${splash(champ)}")`);
    escText($('#publicKicker'),`${String(m.context||m.mode||'LEAGUE OF LEGENDS').toUpperCase()} • ${mins}:${secs} • ${formatRiotId(story.riot_id)}`);
    escText($('#publicTitle'),arc[1]);escText($('#publicSubtitle'),arc[2]);
    const result=m.context==='ARENA'&&m.placement?`#${m.placement}`:(m.win?localized('VITÓRIA','VICTORY'):localized('DERROTA','DEFEAT'));
    escText($('#publicResult'),result);$('#publicResult').className='result '+resultTone(m);
    escText($('#publicArchetype'),arc[0]);escText($('#publicChampion'),champ);escText($('#publicKda'),`${n(m.kills)} / ${n(m.deaths)} / ${n(m.assists)}`);
    escText($('#publicImpactTitle'),`${localized('Impacto contextual','Contextual impact')}: ${impact}/100`);
    const takedowns=n(m.kills)+n(m.assists);
    const damage=m.damage?`${(n(m.damage)/1000).toFixed(1)}k ${localized('de dano','damage')}`:`${takedowns} ${localized('participações','takedowns')}`;
    const arenaImpact=m.context==='ARENA'
      ? localized(
          `Esta história pública usa os dados reais da Arena: #${m.placement||'—'}, ${takedowns} participações, ${m.damagePerMin?Math.round(n(m.damagePerMin))+' DPM':'ritmo de combate'}${Array.isArray(m.augments)&&m.augments.length?', '+m.augments.length+' aprimoramentos':''}.`,
          `This public story uses real Arena data: #${m.placement||'—'}, ${takedowns} takedowns, ${m.damagePerMin?Math.round(n(m.damagePerMin))+' DPM':'combat pace'}${Array.isArray(m.augments)&&m.augments.length?', '+m.augments.length+' augments':''}.`
        )
      : localized(
          `Esta história pública foi gerada a partir dos dados reais da partida: ${damage}, ${n(m.deaths)} mortes e ${n(m.killParticipation)}% de participação em abates.`,
          `This public story was generated from real match data: ${damage}, ${n(m.deaths)} deaths and ${n(m.killParticipation)}% kill participation.`
        );
    escText($('#publicImpactText'),arenaImpact);
    const stats=m.context==='ARENA'
      ? [[localized('Colocação','Placement'),m.placement?'#'+m.placement:'—'],[localized('Participações','Takedowns'),takedowns],['DPM',m.damagePerMin?Math.round(n(m.damagePerMin)):'—'],[localized('Aprimoramentos','Augments'),Array.isArray(m.augments)&&m.augments.length?m.augments.length:'—']]
      : [['CS',m.cs||'—'],[localized('Visão','Vision'),m.vision||'—'],['KP',(m.killParticipation??0)+'%'],[localized('Impacto','Impact'),impact]];
    $('#publicStats').replaceChildren(...stats.map(([label,value])=>{const d=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=String(value);span.textContent=label;d.append(strong,span);return d;}));
    const chips=m.context==='ARENA'
      ? [
          `#${m.placement||'—'} ${localized('colocação','placement')}`,
          `${takedowns} ${localized('participações','takedowns')}`,
          m.damagePerMin?`${Math.round(n(m.damagePerMin))} DPM`:'Arena',
          Array.isArray(m.augments)&&m.augments.length?`${m.augments.length} ${localized('aprimoramentos','augments')}`:localized('Campanha de Arena','Arena run')
        ]
      : [`${takedowns} ${localized('participações','takedowns')}`,m.damagePerMin?`${Math.round(n(m.damagePerMin))} DPM`:`${m.vision||0} ${localized('visão','vision')}`,m.largestKillingSpree>=3?`${localized('Sequência','Spree')} x${m.largestKillingSpree}`:(m.position||m.context||'LoL'),m.win?localized('Vitória','Win'):localized('Derrota','Loss')];
    $('#publicHighlights').replaceChildren(...chips.map(value=>{const d=document.createElement('div');d.className='highlight';d.textContent=value;return d;}));
    document.title=`${champ} • ${result} — LoL Match Story`;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content',document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content',arc[1]+' '+arc[2]);
    $('#publicStory').classList.remove('hidden');$('#publicStatus').classList.add('hidden');
    currentMatchId=story.match_id;currentContext=m.context||null;setupFeedback();
  }
  function feedbackKey(){return currentMatchId?'lms-feedback-'+currentMatchId:null;}
  function setupFeedback(){
    const block=$('#feedbackBlock');if(!block||!currentMatchId||!backend.lolFeedback)return;
    if(localStorage.getItem(feedbackKey())==='sent'){block.classList.add('hidden');return;}
    block.classList.remove('hidden');
  }
  async function submitFeedback(helpful,reason){
    if(!currentMatchId||!backend.lolFeedback)return;
    const status=$('#feedbackStatus');
    try{
      status.textContent=tr('sending');
      const r=await fetch(backend.lolFeedback,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        action:'submit',matchId:currentMatchId,helpful,reason:reason||null,context:currentContext,locale:publicLocale==='pt'?'pt-BR':'en'
      })});
      const data=await r.json().catch(()=>null);
      if(!r.ok||!data?.ok)throw new Error('feedback_failed');
      localStorage.setItem(feedbackKey(),'sent');
      $('#feedbackChoices')?.classList.add('hidden');
      $('#feedbackReasons')?.classList.add('hidden');
      status.textContent=tr('feedbackThanks');
    }catch{
      status.textContent=tr('feedbackError');
    }
  }

  async function sharePublicStory(){
    const title=document.title;
    const url=location.href;
    try{
      if(navigator.share){
        await navigator.share({title,text:tr('shareMessage'),url});
        return;
      }
      await navigator.clipboard.writeText(url);
      const btn=$('#publicShareBtn');
      if(btn){
        const old=btn.textContent;
        btn.textContent=tr('copied');
        setTimeout(()=>{btn.textContent=old;},1800);
      }
    }catch(err){
      if(err?.name==='AbortError')return;
      try{await navigator.clipboard.writeText(url);}catch{}
    }
  }

  $('#publicShareBtn')?.addEventListener('click',sharePublicStory);
  $('#publicLangBtn')?.addEventListener('click',()=>{
    publicLocale=publicLocale==='pt'?'en':'pt';
    localStorage.setItem('lms-locale',publicLocale);
    applyPublicLocale();
    if(currentStory)render(currentStory);
  });

  document.querySelectorAll('[data-helpful]').forEach(btn=>btn.addEventListener('click',()=>{
    const helpful=btn.dataset.helpful==='true';
    if(helpful)submitFeedback(true,'clear');
    else $('#feedbackReasons')?.classList.remove('hidden');
  }));
  document.querySelectorAll('[data-reason]').forEach(btn=>btn.addEventListener('click',()=>submitFeedback(false,btn.dataset.reason)));

  async function main(){
    const matchId=new URLSearchParams(location.search).get('match');
    if(!matchId||!backend.lolStory){escText($('#publicStatus'),tr('invalidLink'));return;}
    try{
      const r=await fetch(backend.lolStory,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get',matchId})});
      const data=await r.json().catch(()=>null);
      if(!r.ok||!data?.story)throw new Error(data?.error||'not_found');
      render(data.story);
    }catch{
      escText($('#publicStatus'),tr('unavailable'));
      $('#publicStatus').className='source-state error';
    }
  }
  applyPublicLocale();
  main();
})();