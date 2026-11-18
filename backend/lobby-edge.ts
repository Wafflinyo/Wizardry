// Custom capability authentication: raw 256-bit session keys never leave request bodies.
import './builds.js';
import cards from './cards.json' with {type:'json'};
const allowed=['https://wafflinyo.github.io'];
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const accepted=allowed.includes(origin)||/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin);
 const cors={'Access-Control-Allow-Origin':accepted?origin:allowed[0],'Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  if(req.method!=='POST')throw Error('POST required.');
  const text=await req.text();if(text.length>150000)throw Error('Request is too large.');const body=JSON.parse(text);
  if(!/^[a-f0-9]{64}$/.test(body.token||''))throw Error('Invalid player session.');
  const actions=['create','join','seat','ready','size','start','plan','sync','poll','leave','cpuAdd','cpuRemove'];if(!actions.includes(body.action))throw Error('Invalid lobby action.');
  const payload=body.payload||{};
  if(['create','join','cpuAdd'].includes(body.action)){
   if(!payload.profile||payload.profile.deck?.length>24)throw Error('Invalid wizard.');
   payload.profile=(globalThis as any).WizardryBuilds.normalize(payload.profile,cards);if(payload.profile.level!==20)throw Error('This test requires a level-20 wizard.');
  }
  if(body.action==='ready'&&typeof payload.ready!=='boolean')throw Error('Invalid ready state.');
  if(body.action==='seat'&&(![0,1].includes(payload.team)||!Number.isInteger(payload.slot)||payload.slot<0||payload.slot>3))throw Error('Invalid seat.');
  if(body.action==='plan'&&(!payload.plan||!Number.isInteger(payload.plan.round)))throw Error('Invalid action.');
  if(payload.state&&JSON.stringify(payload.state).length>120000)throw Error('Combat state is too large.');
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.token)),hash=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const result=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/rpc/wizardry_test_action',{method:'POST',headers:{'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+key},body:JSON.stringify({action_name:body.action,room_id:body.roomId||null,actor_key:hash,payload})});
  const data=await result.json();if(!result.ok)throw Error(data.message||'Lobby request failed.');
  return Response.json(data,{headers:cors});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Lobby error'},{status:400,headers:cors});}
});
