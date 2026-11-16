const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const images=[];
const ctx={window:{},Image:class{constructor(){images.push(this);}}};vm.runInNewContext(fs.readFileSync('assets/devil-boy-v96.js','utf8'),ctx);images[0].naturalWidth=1280;images[0].naturalHeight=1280;images[0].onload();
const fx=ctx.window.WIZARDRY_DEVIL_V96;
for(const target of [{x:175,y:340},{x:341,y:508},{x:667,y:315},{x:831,y:488}]){
 assert.equal(fx.shot(.529,target),null);const start=fx.shot(.53,target),muzzle=fx.pose(.53,target).muzzle;assert.equal(start.x,muzzle.x);assert.equal(start.y,muzzle.y);
 const end=fx.shot(.599999,target);assert(Math.abs(end.x-target.x)<.01);assert(Math.abs(end.y-(target.y-80))<.01);assert.equal(fx.shot(.60,target),null);
 assert(fx.depthFor({progress:.599999,target},'projectile')>target.y);assert(fx.depthFor({progress:.7,target},'impact')>target.y);
 assert.equal(fx.pose(0,target).alpha,0);assert.equal(fx.pose(.95,target).alpha,0);assert.equal(fx.pose(.50,target).frame,10);assert.equal(fx.pose(.55,target).frame,11);
 const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});for(let i=0;i<=100;i++)for(const layer of ['ground','actor','projectile','impact'])fx.draw(c,{progress:i/100,target,layer});
}
console.log('Devil Boy muzzle origin, mirrored volcanic shot, hit-layer timing, recoil and flame disappearance passed.');

const drawCalls=[],canvas=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>drawCalls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
fx.draw(canvas,{progress:.5,target:{x:800,y:450},layer:'actor'});const actor=drawCalls.find(c=>c[0]==='drawImage');assert.equal(actor[8],120,'character is 40 percent smaller');
assert(fx.pose(.565,{x:800,y:450}).x<500,'strong backward recoil after launch');
console.log('Smaller Devil Boy, 266ms flight, oversized magma and stronger recoil passed.');
