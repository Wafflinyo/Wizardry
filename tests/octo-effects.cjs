const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{},Image:class{}};vm.runInNewContext(fs.readFileSync('assets/octo-whip-v95.js','utf8'),ctx);
const fx=ctx.window.WIZARDRY_OCTO_V95;
for(const target of [{x:175,y:340},{x:341,y:508},{x:667,y:315},{x:831,y:488}]){
 for(let i=20;i<=86;i++){const b=fx.pose(i/100,target);assert(Math.abs(b.x-500)<=7.001,'body stays planted');assert.equal(b.y,425,'grounded during whip');}
 const hit=fx.pose(.70,target);assert(Math.abs(hit.tip.x-target.x)<.001);assert(Math.abs(hit.tip.y-(target.y-75))<.001);
 assert.equal(fx.pose(1,target).exit,1,'dive finishes before cast ends');
 const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{calls.push([k,...args]);},set:(o,k,v)=>(o[k]=v,true)});
 for(const layer of ['ground','body','whip'])for(let i=0;i<=100;i++)fx.draw(c,{progress:i/100,target,layer});
 assert(calls.some(x=>x[0]==='clip'),'dive clips body at water surface');
}
console.log('Octo planted body, exact mirrored contact, water clipping and full dive passed.');
