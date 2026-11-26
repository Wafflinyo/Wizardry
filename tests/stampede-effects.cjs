const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1792;this.naturalHeight=896;}},setTimeout:()=>0,clearTimeout:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/stampede.js','utf8'),ctx);
const fx=ctx.window.Stampede;
for(const team of [0,1]){const dir=team===0?1:-1,source={team};
 const targets=Array.from({length:4},(_,i)=>({id:'t'+i,x:500+dir*(230+i*15),y:360+i*55,hitAt:.48+i*.045}));
 for(const t of targets){
  const scene=fx.scene(source,targets,t.hitAt),h=scene.herds.find(h=>h.id===t.id);
  assert.ok(h);assert.ok(Math.abs(h.x+dir*76*h.w/224-t.x)<1e-8);
  assert.equal(h.y,t.y);assert.equal(h.speed,1);
  const calls=[],gradient={addColorStop:()=>{}},g=new Proxy({globalAlpha:1,createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
  fx.trail(g,h);assert.ok(calls.filter(a=>a[0]==='fill').length>=40);
  calls.length=0;fx.impact(g,scene,t);assert.ok(calls.filter(a=>a[0]==='fill').length>=80);
  assert.ok(fx.shake(t.hitAt*4500,4500,targets,dir).x*dir>0);
 }
}
console.log('Stampede: accelerated charge, target contact, green trails and stronger hit effects.');
