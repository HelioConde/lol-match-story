import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const RH: Record<string,string> = {
  americas:"americas.api.riotgames.com",
  europe:"europe.api.riotgames.com",
  asia:"asia.api.riotgames.com",
  sea:"sea.api.riotgames.com",
};
const out = (body: unknown, status=200) => new Response(JSON.stringify(body), {
  status,
  headers: {...H, "Content-Type":"application/json", "Cache-Control":"public, max-age=60"}
});
async function riot(url:string,key:string){
  const r = await fetch(url,{headers:{"X-Riot-Token":key,Accept:"application/json"}});
  let data:any=null; try{data=await r.json()}catch{}
  return {ok:r.ok,status:r.status,data};
}
const mmss=(ms:number)=>{
  const sec=Math.max(0,Math.round(Number(ms||0)/1000));
  return String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");
};
const cleanMonster=(v:string,sub?:string)=>{
  const raw=String(sub||v||"OBJECTIVE").replaceAll("_"," ");
  return raw.replace(/\b\w/g,c=>c.toUpperCase());
};

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:H});
  if(req.method!=="POST") return out({error:"method"},405);

  const key=Deno.env.get("RIOT_API_KEY");
  const url=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!key||!url||!service) return out({error:"unavailable"},503);

  let b:any={}; try{b=await req.json()}catch{return out({error:"json"},400)}
  const matchId=String(b.matchId||"").trim();
  const region=String(b.region||"americas").toLowerCase();
  const gameName=String(b.gameName||"").trim();
  const tagLine=String(b.tagLine||"").replace(/^#/,"").trim();
  if(!matchId || !/^[A-Za-z0-9]+_\d+$/.test(matchId)) return out({error:"match_id"},400);
  if(!RH[region]) return out({error:"region"},400);
  if(!gameName||!tagLine) return out({error:"riot_id"},400);

  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const cacheKey=region+":"+String(b.platform||"br1").toLowerCase()+":"+gameName.toLowerCase()+"#"+tagLine.toLowerCase();

  let puuid:string|null=null;
  const {data:pc}=await db.from("riot_player_cache").select("account_data,expires_at").eq("cache_key",cacheKey).maybeSingle();
  if(pc?.account_data?.puuid) puuid=String(pc.account_data.puuid);
  if(!puuid){
    const ar=await riot("https://"+RH[region]+"/riot/account/v1/accounts/by-riot-id/"+encodeURIComponent(gameName)+"/"+encodeURIComponent(tagLine),key);
    if(!ar.ok) return out({error:"player",riotStatus:ar.status},ar.status===429?429:502);
    puuid=String(ar.data?.puuid||"");
  }
  if(!puuid) return out({error:"player_puuid"},502);

  const {data:mc}=await db.from("lol_match_cache").select("match_data").eq("match_id",matchId).maybeSingle();
  const own=mc?.match_data?.info?.participants?.find((x:any)=>String(x.puuid)===puuid);
  if(!mc?.match_data || !own) return out({error:"match_not_available_for_player",matchId},404);

  let timeline:any=null, cacheHit=false;
  const {data:cached}=await db.from("lol_timeline_cache").select("timeline_data,expires_at").eq("match_id",matchId).maybeSingle();
  if(cached && new Date(cached.expires_at).getTime()>Date.now()){
    timeline=cached.timeline_data; cacheHit=true;
  } else {
    const tr=await riot("https://"+RH[region]+"/lol/match/v5/matches/"+encodeURIComponent(matchId)+"/timeline",key);
    if(!tr.ok) return out({error:"timeline",riotStatus:tr.status},tr.status===429?429:502);
    timeline=tr.data;
    await db.from("lol_timeline_cache").upsert({
      match_id:matchId,region,timeline_data:timeline,fetched_at:new Date().toISOString(),
      expires_at:new Date(Date.now()+30*24*60*60*1000).toISOString(),updated_at:new Date().toISOString()
    },{onConflict:"match_id"});
  }

  const participants=Array.isArray(timeline?.metadata?.participants)?timeline.metadata.participants:[];
  const participantId=participants.findIndex((x:any)=>String(x)===puuid)+1;
  if(participantId<=0) return out({error:"participant_not_found",matchId},404);

  let teamId=Number(own.teamId||0)||(participantId<=5?100:200);

  const frames=Array.isArray(timeline?.info?.frames)?timeline.info.frames:[];
  const matchParticipants=Array.isArray(mc?.match_data?.info?.participants)?mc.match_data.info.participants:[];
  const participantTeam=new Map<number,number>();
  participants.forEach((pu:any,idx:number)=>{
    const mp=matchParticipants.find((x:any)=>String(x.puuid)===String(pu));
    if(mp?.teamId) participantTeam.set(idx+1,Number(mp.teamId));
  });
  const goldTimeline=frames.map((frame:any)=>{
    let ownGold=0,enemyGold=0;
    const pf=frame?.participantFrames||{};
    Object.entries(pf).forEach(([idStr,v]:any)=>{
      const id=Number(idStr),gold=Number(v?.totalGold||0),tid=participantTeam.get(id)||(id<=5?100:200);
      if(tid===teamId) ownGold+=gold; else enemyGold+=gold;
    });
    return {timestamp:Number(frame?.timestamp||0),time:mmss(Number(frame?.timestamp||0)),ownGold,enemyGold,diff:ownGold-enemyGold};
  }).filter((x:any)=>x.timestamp>=0);

  const closestPhase=(target:number)=>{
    if(!goldTimeline.length)return null;
    return goldTimeline.reduce((best:any,x:any)=>Math.abs(x.timestamp-target)<Math.abs(best.timestamp-target)?x:best,goldTimeline[0]);
  };
  const early=closestPhase(10*60*1000),mid=closestPhase(20*60*1000),late=goldTimeline.at(-1)||null;
  let biggestSwing:any=null;
  for(let i=1;i<goldTimeline.length;i++){
    const prev=goldTimeline[i-1],cur=goldTimeline[i],delta=cur.diff-prev.diff;
    if(!biggestSwing||Math.abs(delta)>Math.abs(biggestSwing.delta)) biggestSwing={from:prev.time,to:cur.time,timestamp:cur.timestamp,time:cur.time,delta,diffAfter:cur.diff};
  }

  const events:any[]=[];
  const kills:any[]=[];
  let firstChampionKill:any=null;
  for(const frame of frames){
    for(const e of (frame?.events||[])){
      const ts=Number(e.timestamp||frame.timestamp||0);
      if(e.type==="CHAMPION_KILL"){
        const assists=Array.isArray(e.assistingParticipantIds)?e.assistingParticipantIds.map(Number):[];
        const playerKilled=Number(e.killerId)===participantId;
        const playerDied=Number(e.victimId)===participantId;
        const playerAssisted=assists.includes(participantId);
        if(!firstChampionKill) firstChampionKill={timestamp:ts,time:mmss(ts),killerId:Number(e.killerId||0),victimId:Number(e.victimId||0),assists};
        if(playerKilled||playerDied||playerAssisted){
          const kind=playerKilled?"KILL":playerDied?"DEATH":"ASSIST";
          kills.push({type:kind,timestamp:ts,time:mmss(ts),killerId:Number(e.killerId||0),victimId:Number(e.victimId||0)});
        }
      }
      if(e.type==="ELITE_MONSTER_KILL" && Number(e.killerTeamId||0)===teamId){
        events.push({type:"OBJECTIVE",timestamp:ts,time:mmss(ts),objective:cleanMonster(e.monsterType,e.monsterSubType)});
      }
      if(e.type==="BUILDING_KILL"){
        const destroyedTeam=Number(e.teamId||0);
        if(destroyedTeam && destroyedTeam!==teamId){
          events.push({type:"STRUCTURE",timestamp:ts,time:mmss(ts),structure:cleanMonster(e.buildingType,e.towerType)});
        }
      }
    }
  }

  let firstBlood:any=null;
  if(firstChampionKill){
    const involvedKill=firstChampionKill.killerId===participantId;
    const involvedDeath=firstChampionKill.victimId===participantId;
    const involvedAssist=Array.isArray(firstChampionKill.assists)&&firstChampionKill.assists.includes(participantId);
    if(involvedKill||involvedDeath||involvedAssist){
      firstBlood={type:involvedKill?"KILL":involvedDeath?"DEATH":"ASSIST",timestamp:firstChampionKill.timestamp,time:firstChampionKill.time,isFirstBlood:true};
    }
  }
  let bestMulti:any=null;
  const ownKills=kills.filter((x:any)=>x.type==="KILL").sort((a:any,b:any)=>a.timestamp-b.timestamp);
  for(let i=0;i<ownKills.length;i++){
    let count=1,j=i+1;
    while(j<ownKills.length && ownKills[j].timestamp-ownKills[j-1].timestamp<=10000){count++;j++}
    if(!bestMulti||count>bestMulti.count) bestMulti={count,timestamp:ownKills[i].timestamp,time:mmss(ownKills[i].timestamp)};
  }
  if(bestMulti?.count<2) bestMulti=null;

  const combined=[...kills,...events].sort((a:any,b:any)=>a.timestamp-b.timestamp);
  const candidates=combined.map((e:any)=>{
    let weight=1;
    if(e.type==="OBJECTIVE") weight=4;
    else if(e.type==="STRUCTURE") weight=3;
    else if(e.type==="KILL") weight=2.4;
    else if(e.type==="ASSIST") weight=1.7;
    else if(e.type==="DEATH") weight=-2;
    return {...e,weight};
  });
  let turningPoint=candidates.sort((a:any,b:any)=>Math.abs(b.weight)-Math.abs(a.weight))[0]||null;
  if(bestMulti && (!turningPoint || bestMulti.count>=3)) turningPoint={type:"MULTI_KILL",...bestMulti,weight:5+bestMulti.count};
  if(biggestSwing && Math.abs(biggestSwing.delta)>=1200){
    const nearest=combined.reduce((best:any,e:any)=>{
      const dist=Math.abs(Number(e.timestamp||0)-biggestSwing.timestamp);
      return !best||dist<best.dist?{event:e,dist}:best;
    },null);
    if(nearest?.event && nearest.dist<=90000){
      turningPoint={...nearest.event,weight:6,reason:"gold_swing",goldSwing:biggestSwing.delta,goldDiffAfter:biggestSwing.diffAfter};
    }else{
      turningPoint={type:"GOLD_SWING",timestamp:biggestSwing.timestamp,time:biggestSwing.time,weight:6,reason:"gold_swing",goldSwing:biggestSwing.delta,goldDiffAfter:biggestSwing.diffAfter};
    }
  }

  return out({
    matchId,participantId,teamId,cacheHit,
    firstBlood,
    bestMulti,
    turningPoint,
    gold:{
      phases:{early,mid,late},
      biggestSwing
    },
    events:combined.slice(0,80),
    counts:{
      kills:kills.filter((x:any)=>x.type==="KILL").length,
      deaths:kills.filter((x:any)=>x.type==="DEATH").length,
      assists:kills.filter((x:any)=>x.type==="ASSIST").length,
      objectives:events.filter((x:any)=>x.type==="OBJECTIVE").length,
      structures:events.filter((x:any)=>x.type==="STRUCTURE").length
    }
  });
});