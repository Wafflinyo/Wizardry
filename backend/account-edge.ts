// Wizardry account transport: service-role access is server-side only.
const url=Deno.env.get("SUPABASE_URL")!;
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
Deno.serve(async (req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const allowed=origin==="https://wafflinyo.github.io"||/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);
 const headers={"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","Access-Control-Allow-Origin":allowed?origin:"https://wafflinyo.github.io","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!allowed)return reply({error:"Origin not allowed."},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"POST required."},405);
 try{
  if(Number(req.headers.get("content-length")||0)>1100000)return reply({error:"Save too large."},413);
  const reader=req.body?.getReader();if(!reader)return reply({error:"Missing request."},400);
  const decoder=new TextDecoder();let raw="",bytes=0;
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1100000){await reader.cancel();return reply({error:"Save too large."},413);}raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();let body;try{body=JSON.parse(raw);}catch{return reply({error:"Invalid request."},400);}
  if(!body||!["signup","login","get","save","logout"].includes(body.action))return reply({error:"Invalid action."},400);
  const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",").pop()?.trim()||"unknown").slice(0,100);
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ip));
  const ipHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  const p={p_action:body.action,p_username:typeof body.username==="string"?body.username.trim().toLowerCase():null,p_password:typeof body.password==="string"?body.password:null,p_token:typeof body.token==="string"?body.token:null,p_revision:Number.isSafeInteger(body.revision)?body.revision:null,p_wizards:body.action==="save"?body.wizards??null:null,p_ip:ipHash};
  const r=await fetch(url+"/rest/v1/rpc/wizardry_account_request",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(p)});
  if(!r.ok)return reply({error:"Account service unavailable. Your local saves are safe."},503);
  const data=await r.json();const status=data.status||200;delete data.status;return reply(data,status);
 }catch{return reply({error:"Account service unavailable. Your local saves are safe."},503);}
});
