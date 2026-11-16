const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const images=[];const ctx={window:{},Image:class{constructor(){images.push(this);}}};vm.runInNewContext(fs.readFileSync('assets/octo-whip-v95.js','utf8'),ctx);
for(const im of images){im.naturalWidth=1280;im.naturalHeight=im.src.includes('slam')?1280:1240;im.onload();}
const fx=ctx.window.WIZARDRY_OCTO_V95;
for(const target of [{x:175,y:340},{x:341,y:508},{x:667,y:315},{x:831,y:488}]){
 const root=fx.pose(.2,target);
 for(let i=20;i<=86;i++){const b=fx.pose(i/100,target);assert.equal(b.x,root.x,'body stays planted');assert.equal(b.y,target.y,'same ground plane throughout slam');}
 const sourceFrames=[];
 for(const p of [.46,.52,.59,.66,.71,.76,.81,.85]){
  const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
  fx.draw(c,{progress:p,target,layer:'whip'});
  const draws=calls.filter(x=>x[0]==='drawImage');assert.equal(draws.length,1,'one complete rendered pose, no arm strips');
  const d=draws[0];assert(d[1].src.includes('octo-slam-v97'));assert(Math.abs(d[8]/d[4]-d[9]/d[5])<1e-9,'equal X and Y scale: no stretch');
  sourceFrames.push(d[2]+','+d[3]);
  assert(calls.some(x=>x[0]==='translate'&&x[1]===root.x&&x[2]===root.y),'fixed actor origin');
 }
 assert.equal(new Set(sourceFrames).size,8,'all eight redrawn attack poses play');
 assert.equal(fx.pose(.69,target).slamFrame,3,'descending tentacle precedes damage');
 assert.equal(fx.pose(.70,target).slamFrame,4,'flat slam coincides with 400-damage contact');
 assert.equal(fx.pose(1,target).exit,1,'dive completes');
 const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
 fx.draw(c,{progress:.98,target,layer:'body'});assert(calls.some(x=>x[0]==='clip'),'dive clips at water surface');
}
console.log('Eight full rendered slam frames, uniform scale, rooted body, hit timing and underwater exit passed.');
