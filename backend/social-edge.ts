const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"",allowed=origin==="https://wafflinyo.github.io"||/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);
 const headers={"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","Access-Control-Allow-Origin":allowed?origin:"https://wafflinyo.github.io","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
 const reply=(d:unknown,status=200)=>new Response(JSON.stringify(d),{status,headers});
 if(origin&&!allowed)return reply({error:"Origin not allowed."},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"POST required."},405);
 try{
  const reader=req.body?.getReader();if(!reader)return reply({error:"Missing request."},400);
  let raw="",bytes=0;const dec=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>8192){await reader.cancel();return reply({error:"Request too large."},413);}raw+=dec.decode(value,{stream:true});}raw+=dec.decode();
  const b=JSON.parse(raw);if(!b||!["list","offline","request","accept","remove","invite","inviteAccept","inviteDecline"].includes(b.action)||typeof b.token!=="string"||!/^[0-9a-f]{64}$/.test(b.token))return reply({error:"Invalid request."},400);
  const r=await fetch(url+"/rest/v1/rpc/wizardry_social_request",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({p_action:b.action,p_token:b.token,p_payload:b.payload??{}})});
  if(!r.ok)return reply({error:"Friends service unavailable."},503);
  const d=await r.json(),status=d.status||200;delete d.status;return reply(d,status);
 }catch{return reply({error:"Friends service unavailable."},503);}
});