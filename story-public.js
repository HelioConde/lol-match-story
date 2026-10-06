(() => {
  const backend=window.LOL_MATCH_STORY_BACKEND||{};
  const $=s=>document.querySelector(s);
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
  let currentMatchId=null,currentContext=null;

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
      if(m.placement===1)return ['CAMPEÃO DA ARENA','Você terminou no topo da Arena.','Rodadas, adaptação e sobrevivência convergiram para o primeiro lugar.'];
      if(m.placement&&m.placement<=4)return ['TOP 4 NA ARENA','Você foi longe na Arena.','A campanha se sustentou até uma colocação de destaque.'];
      return ['CAMPANHA DE ARENA','Cada rodada contou uma parte da campanha.','Na Arena, sobreviver e adaptar importou tanto quanto eliminar.'];
    }
    if(m.pentaKills)return ['NOITE LENDÁRIA','Uma partida para guardar.','Um Pentakill transformou esta partida em memória.'];
    if(n(m.damagePerMin)>=900||n(m.teamDamageShare)>=30||n(m.kills)>=12)return ['CARRY','Quando o time precisou de pressão, você apareceu.','Dano e participação colocaram você no centro da história.'];
    if(n(m.vision)>=35||n(m.assists)>=15)return ['MAESTRO','Você fez a partida acontecer para os outros.','Assistências e controle ajudaram a construir o resultado.'];
    if(m.win)return ['VITÓRIA CONSISTENTE','Você transformou consistência em vitória.','O resultado foi construído ao longo da partida, não em um único lance.'];
    return ['DERROTA PARA REVISAR','A partida escapou em pequenas janelas.','O resultado final mostra onde vale olhar com mais atenção.'];
  }

  function render(story){
    const m=story?.story_data?.match;
    if(!m)throw new Error('invalid_story');
    const champ=m.champion||'Champion',arc=archetype(m),impact=score(m),seconds=n(m.durationSeconds),mins=Math.floor(seconds/60),secs=String(seconds%60).padStart(2,'0');
    $('#publicCover').style.setProperty('--cover',`url("${splash(champ)}")`);
    escText($('#publicKicker'),`${String(m.context||m.mode||'LEAGUE OF LEGENDS').toUpperCase()} • ${mins}:${secs} • ${formatRiotId(story.riot_id)}`);
    escText($('#publicTitle'),arc[1]);escText($('#publicSubtitle'),arc[2]);
    const result=m.context==='ARENA'&&m.placement?`#${m.placement}`:(m.win?'VITÓRIA':'DERROTA');
    escText($('#publicResult'),result);$('#publicResult').className='result '+resultTone(m);
    escText($('#publicArchetype'),arc[0]);escText($('#publicChampion'),champ);escText($('#publicKda'),`${n(m.kills)} / ${n(m.deaths)} / ${n(m.assists)}`);
    escText($('#publicImpactTitle'),`Impacto contextual: ${impact}/100`);
    const damage=m.damage?`${(n(m.damage)/1000).toFixed(1)}k de dano`:`${n(m.kills)+n(m.assists)} participações`;
    const arenaImpact=m.context==='ARENA'
      ? `Esta história pública usa os dados reais da Arena: #${m.placement||'—'}, ${n(m.kills)+n(m.assists)} participações, ${m.damagePerMin?Math.round(n(m.damagePerMin))+' DPM':'ritmo de combate'}${Array.isArray(m.augments)&&m.augments.length?', '+m.augments.length+' aprimoramentos':''}.`
      : `Esta história pública foi gerada a partir dos dados reais da partida: ${damage}, ${n(m.deaths)} mortes e ${n(m.killParticipation)}% de participação em abates.`;
    escText($('#publicImpactText'),arenaImpact);
    const stats=m.context==='ARENA'
      ? [['Colocação',m.placement?'#'+m.placement:'—'],['Participações',n(m.kills)+n(m.assists)],['DPM',m.damagePerMin?Math.round(n(m.damagePerMin)):'—'],['Impacto',impact]]
      : [['CS',m.cs||'—'],['Visão',m.vision||'—'],['KP',(m.killParticipation??0)+'%'],['Impacto',impact]];
    $('#publicStats').replaceChildren(...stats.map(([label,value])=>{const d=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=String(value);span.textContent=label;d.append(strong,span);return d;}));
    const chips=m.context==='ARENA'
      ? [
          `#${m.placement||'—'} colocação`,
          `${n(m.kills)+n(m.assists)} participações`,
          m.damagePerMin?`${Math.round(n(m.damagePerMin))} DPM`:'Arena',
          Array.isArray(m.augments)&&m.augments.length?`${m.augments.length} aprimoramentos`:'Campanha de Arena'
        ]
      : [`${n(m.kills)+n(m.assists)} participações`,m.damagePerMin?`${Math.round(n(m.damagePerMin))} DPM`:`${m.vision||0} visão`,m.largestKillingSpree>=3?`Sequência x${m.largestKillingSpree}`:(m.position||m.context||'LoL'),m.win?'Vitória':'Derrota'];
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
      status.textContent='Enviando feedback…';
      const r=await fetch(backend.lolFeedback,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        action:'submit',matchId:currentMatchId,helpful,reason:reason||null,context:currentContext,locale:'pt-BR'
      })});
      const data=await r.json().catch(()=>null);
      if(!r.ok||!data?.ok)throw new Error('feedback_failed');
      localStorage.setItem(feedbackKey(),'sent');
      $('#feedbackChoices')?.classList.add('hidden');
      $('#feedbackReasons')?.classList.add('hidden');
      status.textContent='Obrigado. Esse feedback entra na validação do Match Story.';
    }catch{
      status.textContent='Não foi possível enviar agora.';
    }
  }

  async function sharePublicStory(){
    const title=document.title;
    const url=location.href;
    try{
      if(navigator.share){
        await navigator.share({title,text:'Veja esta partida contada como uma história no LoL Match Story.',url});
        return;
      }
      await navigator.clipboard.writeText(url);
      const btn=$('#publicShareBtn');
      if(btn){
        const old=btn.textContent;
        btn.textContent='Link copiado';
        setTimeout(()=>{btn.textContent=old;},1800);
      }
    }catch(err){
      if(err?.name==='AbortError')return;
      try{await navigator.clipboard.writeText(url);}catch{}
    }
  }

  $('#publicShareBtn')?.addEventListener('click',sharePublicStory);

  document.querySelectorAll('[data-helpful]').forEach(btn=>btn.addEventListener('click',()=>{
    const helpful=btn.dataset.helpful==='true';
    if(helpful)submitFeedback(true,'clear');
    else $('#feedbackReasons')?.classList.remove('hidden');
  }));
  document.querySelectorAll('[data-reason]').forEach(btn=>btn.addEventListener('click',()=>submitFeedback(false,btn.dataset.reason)));

  async function main(){
    const matchId=new URLSearchParams(location.search).get('match');
    if(!matchId||!backend.lolStory){escText($('#publicStatus'),'Link de história inválido.');return;}
    try{
      const r=await fetch(backend.lolStory,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get',matchId})});
      const data=await r.json().catch(()=>null);
      if(!r.ok||!data?.story)throw new Error(data?.error||'not_found');
      render(data.story);
    }catch{
      escText($('#publicStatus'),'Esta história não está disponível. Ela pode ainda não ter sido publicada.');
      $('#publicStatus').className='source-state error';
    }
  }
  main();
})();