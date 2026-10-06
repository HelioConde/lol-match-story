import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
const out=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...H,"Content-Type":"application/json","Cache-Control":"public, max-age=120"}});
const CTX:any={400:"NORMAL",420:"RANKED",430:"NORMAL",440:"RANKED",480:"NORMAL",490:"NORMAL",450:"ARAM",1700:"ARENA",1710:"ARENA",1740:"ARENA",1750:"ARENA",1810:"SWARM",1820:"SWARM",1830:"SWARM",1840:"SWARM",2300:"BRAWL",2400:"ARAM MAYHEM"};
const POS:any={TOP:"TOP",JUNGLE:"JUNGLE",MIDDLE:"MID",MID:"MID",BOTTOM:"ADC",UTILITY:"SUPPORT"};
const num=(v:any)=>Number(v||0);

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:H});
  if(req.method!=="POST")return out({error:"method"},405);
  const url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service)return out({error:"unavailable"},503);
  let b:any={};try{b=await req.json()}catch{return out({error:"json"},400)}
  const action=String(b.action||"get");
  const matchId=String(b.matchId||"").trim();
  if(!/^[A-Za-z0-9]+_\d+$/.test(matchId))return out({error:"match_id"},400);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

  if(action==="get"){
    const {data}=await db.from("lol_public_stories").select("match_id,riot_id,region,platform,locale,story_data,published_at,updated_at").eq("match_id",matchId).maybeSingle();
    if(!data)return out({error:"not_found"},404);
    return out({story:data});
  }

  if(action==="records"){
    const gameName=String(b.gameName||"").trim(),tagLine=String(b.tagLine||"").replace(/^#/,"").trim();
    if(!gameName||!tagLine)return out({error:"riot_id"},400);
    const riotId=gameName+"#"+tagLine;
    const {data,error}=await db.from("lol_public_stories")
      .select("match_id,riot_id,story_data,published_at")
      .ilike("riot_id",riotId)
      .order("published_at",{ascending:false})
      .limit(100);
    if(error)return out({error:"records_failed"},500);
    const rows=(data||[]).map((x:any)=>({matchId:x.match_id,publishedAt:x.published_at,...(x.story_data?.match||{})}));
    const kda=(m:any)=>(num(m.kills)+num(m.assists))/Math.max(1,num(m.deaths));
    const by=(fn:(x:any)=>number)=>rows.slice().sort((a:any,b:any)=>fn(b)-fn(a))[0]||null;
    const arena=rows.filter((x:any)=>String(x.context||"").toUpperCase()==="ARENA"&&num(x.placement)>0).sort((a:any,b:any)=>num(a.placement)-num(b.placement))[0]||null;
    const cutoff=Date.now()-30*24*60*60*1000;
    const month=rows.filter((x:any)=>new Date(x.publishedAt).getTime()>=cutoff);
    const safeRecord=(m:any)=>m?{matchId:m.matchId,champion:m.champion||m.championName||"Champion",context:m.context||null,placement:m.placement||null,value:null}:null;
    const bestDamage=by((x:any)=>num(x.damagePerMin));
    const bestKda=by(kda);
    const mostKills=by((x:any)=>num(x.kills));
    const bestMonthly=month.slice().sort((a:any,b:any)=>(num(b.damagePerMin)+kda(b)*50)-(num(a.damagePerMin)+kda(a)*50))[0]||null;
    return out({
      riotId,
      publishedStories:rows.length,
      pentakills:rows.reduce((s:number,x:any)=>s+num(x.pentaKills),0),
      records:{
        damagePerMin:bestDamage?{...safeRecord(bestDamage),value:num(bestDamage.damagePerMin)}:null,
        kda:bestKda?{...safeRecord(bestKda),value:+kda(bestKda).toFixed(2)}:null,
        kills:mostKills?{...safeRecord(mostKills),value:num(mostKills.kills)}:null,
        arena:arena?{...safeRecord(arena),value:num(arena.placement)}:null,
        monthly:bestMonthly?{...safeRecord(bestMonthly),value:num(bestMonthly.damagePerMin)}:null
      }
    });
  }

  if(action!=="publish")return out({error:"action"},400);
  const gameName=String(b.gameName||"").trim(),tagLine=String(b.tagLine||"").replace(/^#/,"").trim();
  const platform=String(b.platform||"br1").toLowerCase(),region=String(b.region||"americas").toLowerCase();
  if(!gameName||!tagLine)return out({error:"riot_id"},400);

  const cacheKey=region+":"+platform+":"+gameName.toLowerCase()+"#"+tagLine.toLowerCase();
  const {data:pc}=await db.from("riot_player_cache").select("account_data").eq("cache_key",cacheKey).maybeSingle();
  const puuid=String(pc?.account_data?.puuid||"");
  if(!puuid)return out({error:"player_cache_required"},404);

  const {data:mc}=await db.from("lol_match_cache").select("match_data").eq("match_id",matchId).maybeSingle();
  const info=mc?.match_data?.info||null;
  const participants=Array.isArray(info?.participants)?info.participants:[];
  const p=participants.find((x:any)=>String(x.puuid)===puuid);
  if(!info||!p)return out({error:"match_not_available_for_player"},404);

  const qid=num(info.queueId),rawMode=String(info.gameMode||"").toUpperCase();
  const context=rawMode==="CHERRY"?"ARENA":(CTX[qid]||rawMode||"OUTRO");
  const placement=num(p.subteamPlacement)||null,secs=num(info.gameDuration),mins=Math.max(1,secs/60);
  const champion=p.championName==="MonkeyKing"?"Wukong":String(p.championName||"Champion");
  const teamId=num(p.teamId);
  const cs=num(p.totalMinionsKilled)+num(p.neutralMinionsKilled);
  const safe={
    id:matchId,
    playedAt:num(info.gameStartTimestamp)||null,
    durationSeconds:secs,
    queueId:qid,
    context,
    mode:String(info.gameMode||""),
    win:context==="ARENA"?placement===1:!!p.win,
    placement,
    champion,
    position:POS[String(p.teamPosition||p.individualPosition||"").toUpperCase()]||null,
    kills:num(p.kills),deaths:num(p.deaths),assists:num(p.assists),
    cs,csPerMin:+(cs/mins).toFixed(2),
    vision:num(p.visionScore),
    gold:num(p.goldEarned),
    damage:num(p.totalDamageDealtToChampions),
    damagePerMin:+num(p.challenges?.damagePerMinute||(num(p.totalDamageDealtToChampions)/mins)).toFixed(0),
    killParticipation:p.challenges?.killParticipation!=null?Math.round(Number(p.challenges.killParticipation)*100):null,
    teamDamageShare:p.challenges?.teamDamagePercentage!=null?Math.round(Number(p.challenges.teamDamagePercentage)*1000)/10:null,
    dragonKills:num(p.dragonKills),baronKills:num(p.baronKills),riftHeraldTakedowns:num(p.challenges?.riftHeraldTakedowns),
    objectivesStolen:num(p.objectivesStolen),turretTakedowns:num(p.turretTakedowns),
    firstBloodKill:!!p.firstBloodKill,firstBloodAssist:!!p.firstBloodAssist,
    doubleKills:num(p.doubleKills),tripleKills:num(p.tripleKills),quadraKills:num(p.quadraKills),pentaKills:num(p.pentaKills),
    largestKillingSpree:num(p.largestKillingSpree),
    items:[p.item0,p.item1,p.item2,p.item3,p.item4,p.item5,p.item6].map(num).filter((x:number)=>x>0),
    augments:[p.playerAugment1,p.playerAugment2,p.playerAugment3,p.playerAugment4,p.playerAugment5,p.playerAugment6].map(num).filter((x:number)=>x>0),
    summonerSpells:[num(p.summoner1Id),num(p.summoner2Id)].filter((x:number)=>x>0),
    runeStyles:(p.perks?.styles||[]).map((x:any)=>({style:num(x.style),selections:(x.selections||[]).map((s:any)=>num(s.perk)).filter((v:number)=>v>0)})),
    teamChampions:participants.filter((x:any)=>num(x.teamId)===teamId).map((x:any)=>x.championName==="MonkeyKing"?"Wukong":x.championName)
  };
  const riotId=String(pc.account_data?.gameName||gameName)+"#"+String(pc.account_data?.tagLine||tagLine);
  const storyData={match:safe};
  const now=new Date().toISOString();
  const {error}=await db.from("lol_public_stories").upsert({match_id:matchId,riot_id:riotId,region,platform,locale:String(b.locale||"pt-BR"),story_data:storyData,updated_at:now},{onConflict:"match_id"});
  if(error)return out({error:"persist_failed"},500);
  return out({ok:true,matchId,publicPath:"story.html?match="+encodeURIComponent(matchId)});
});