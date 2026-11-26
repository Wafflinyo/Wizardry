const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const images=[],ctx={window:{},Image:class{constructor(){images.push(this);}}};
vm.runInNewContext(fs.readFileSync('assets/octo-whip-v95.js','utf8'),ctx);
for(const im of images){im.naturalWidth=1600;im.naturalHeight=1056;im.onload();}
const fx=ctx.window.WIZARDRY_OCTO_V95;
assert.equal(images.length,1);assert.ok(images[0].src.includes('octo-submerged-v99'));
for(const target of [{x:175,y:340},{x:341,y:508},{x:667,y:315},{x:831,y:488}]){
 assert.equal(fx.pose(0,target).x,500);
 assert.equal(fx.pose(.7,target).groundY,target.y);
 assert.equal(fx.pose(.7,target).frame,20);
 assert.ok(Math.abs(fx.pose(.7,target).x+fx.pose(.7,target).dir*82*1.65-target.x)<1e-8);
 const frames=new Set();
 for(let i=0;i<=1000;i++){
  const p=i/1000,b=fx.pose(p,target);frames.add(b.frame);
  assert.equal(b.y,b.groundY);
  assert.ok(b.frame>=0&&b.frame<32);
 }
 assert.equal(frames.size,32);
 const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
 fx.draw(c,{progress:.7,target,layer:'body'});
 const d=calls.find(x=>x[0]==='drawImage');assert.ok(d);assert.ok(Math.abs(d[8]/d[4]-d[9]/d[5])<1e-9);
 assert.equal(fx.pose(1,target).alpha,0);
}
for(const team of [0,1]){
 const entries=[{type:'ground'},{type:'wizard',unitTeam:team},{type:'octo-body'},{type:'wizard',unitTeam:1-team},{type:'octo-whip'},{type:'wizard',unitTeam:team},{type:'wizard',unitTeam:1-team}];
 const order=fx.orderRenderables(entries,team);assert.equal(order[0].type,'ground');
 assert.deepEqual(Array.from(order.slice(1),e=>e.type==='wizard'?e.unitTeam===team?'ally':'enemy':e.type),['enemy','enemy','octo-body','octo-whip','ally','ally']);
}
console.log('32 submerged frames, mirrored contact, stable waterline and team layering passed.');
