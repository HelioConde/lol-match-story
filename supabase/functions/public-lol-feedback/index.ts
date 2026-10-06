import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
const out=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...H,"Content-Type":"application/json","Cache-Control":"no-store"}});
const reasons=new Set(["clear","too_generic","wrong_context","missing_event"]);

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:H});
  if(req.method!=="POST")return out({error:"method"},405);
  const url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service)return out({error:"unavailable"},503);
  let b:any={};try{b=await req.json()}catch{return out({error:"json"},400)}
  const action=String(b.action||"submit");
  const matchId=String(b.matchId||"").trim();
  if(!/^[A-Za-z0-9]+_\d+$/.test(matchId))return out({error:"match_id"},400);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

  const {data:story}=await db.from("lol_public_stories").select("match_id,story_data").eq("match_id",matchId).maybeSingle();
  if(!story)return out({error:"story_not_found"},404);

  if(action==="summary"){
    const {data,error}=await db.from("lol_story_feedback").select("helpful,reason").eq("match_id",matchId).limit(1000);
    if(error)return out({error:"summary_failed"},500);
    const rows=data||[],helpful=rows.filter((x:any)=>x.helpful).length;
    const reasonCounts:any={};
    rows.forEach((x:any)=>{if(x.reason)reasonCounts[x.reason]=(reasonCounts[x.reason]||0)+1});
    return out({matchId,responses:rows.length,helpful,helpfulRate:rows.length?Math.round(helpful/rows.length*100):null,reasons:reasonCounts});
  }

  if(action!=="submit")return out({error:"action"},400);
  if(typeof b.helpful!=="boolean")return out({error:"helpful"},400);
  const reason=b.reason==null?null:String(b.reason);
  if(reason&&!reasons.has(reason))return out({error:"reason"},400);
  const context=String(b.context||story.story_data?.match?.context||"").slice(0,32)||null;
  const locale=String(b.locale||"pt-BR").slice(0,12);
  const {error}=await db.from("lol_story_feedback").insert({match_id:matchId,helpful:b.helpful,reason,context,locale});
  if(error)return out({error:"persist_failed"},500);
  return out({ok:true});
});