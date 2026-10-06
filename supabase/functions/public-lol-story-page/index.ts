import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const esc=(v:string)=>String(v||"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const asset=(name:string)=>{
  const map:Record<string,string>={Wukong:"MonkeyKing","Kai'Sa":"Kaisa","Kha'Zix":"Khazix","Cho'Gath":"Chogath","Rek'Sai":"RekSai","Bel'Veth":"Belveth",LeBlanc:"Leblanc",VelKoz:"Velkoz"};
  return map[name]||String(name||"Ahri").replace(/[^A-Za-z0-9]/g,"");
};
const html=(body:string,status=200)=>new Response(body,{status,headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=300"}});

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET") return html("<h1>Method not allowed</h1>",405);
  const url=new URL(req.url);
  const matchId=String(url.searchParams.get("match")||"").trim();
  if(!/^[A-Za-z0-9]+_\d+$/.test(matchId)) return html("<h1>Partida inválida</h1>",400);

  const sbUrl=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!sbUrl||!service) return html("<h1>Indisponível</h1>",503);
  const db=createClient(sbUrl,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data}=await db.from("lol_public_stories")
    .select("match_id,riot_id,story_data,updated_at")
    .eq("match_id",matchId).maybeSingle();
  if(!data) return html("<h1>História não encontrada</h1>",404);

  const m:any=data.story_data?.match||{};
  const champion=String(m.champion||m.championName||"League of Legends");
  const context=String(m.context||"League of Legends");
  const result=context==="ARENA"&&m.placement?("#"+m.placement):(m.win?"Vitória":"Derrota");
  const kda=[m.kills,m.deaths,m.assists].map((x)=>Number(x||0)).join("/");
  const title=`${champion} · ${result} — LoL Match Story`;
  const description=`${data.riot_id} · ${context} · ${kda}. Veja a partida contada como uma história visual.`;
  const target=`https://helioconde.github.io/lol-match-story/story.html?match=${encodeURIComponent(matchId)}`;
  const image=`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${asset(champion)}_0.jpg`;

  return html(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(target)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="canonical" href="${esc(target)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
<script>location.replace(${JSON.stringify(target)})</script>
</head>
<body style="background:#080b12;color:#fff;font-family:system-ui;padding:40px">
<p>Abrindo LoL Match Story…</p>
<p><a style="color:#d7b15d" href="${esc(target)}">Abrir história</a></p>
</body></html>`);
});