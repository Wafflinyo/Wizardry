const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=2176;this.naturalHeight=724;}},setTimeout:()=>0,clearTimeout:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/giant-armadillo.js','utf8'),ctx);
const fx=ctx.window.GiantArmadillo;
for(const team of [0,1]){
 const dir=team===0?1:-1,source={team},target={x:500+dir*300,y:430};
 const frames=new Set();for(let i=0;i<=1000;i++)frames.add(fx.scene(source,target,i/1000).frame);
 assert.equal(frames.size,32);assert.ok([...frames].every(n=>n>=0&&n<32));
 const hit=fx.scene(source,target,.68);assert.equal(hit.frame,20);assert.equal(hit.x+dir*90,target.x);assert.equal(hit.y,target.y+8);
 assert.equal(fx.scene(source,target,.43).x,500-dir*100);assert.equal(fx.scene(source,target,.54).x,500-dir*100);assert.equal(fx.scene(source,target,.43).spinning,true);assert.ok(fx.scene(source,target,.54).angle-fx.scene(source,target,.43).angle>Math.PI*4);assert.ok(fx.scene(source,target,.64).angle>fx.scene(source,target,.55).angle);assert.ok((fx.scene(source,target,.64).x-(500-dir*100))*dir>0);assert.equal(fx.scene(source,target,1).alpha,0);
 const calls=[],g=new Proxy({globalAlpha:1,createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
 fx.draw(g,hit);assert.equal(calls.filter(a=>a[0]==='drawImage').length,1);
 calls.length=0;const spin=fx.scene(source,target,.50);fx.draw(g,spin);assert.ok(calls.some(a=>a[0]==='rotate'&&a[1]===spin.angle));assert.ok(calls.some(a=>a[0]==='clip'));assert.equal(calls.filter(a=>a[0]==='drawImage').length,1);
 calls.length=0;fx.trail(g,spin);assert.ok(calls.filter(a=>a[0]==='fill').length>=70);
 calls.length=0;fx.impact(g,hit,target);assert.ok(calls.filter(a=>a[0]==='fill').length>=60);
 assert.ok(fx.shake(.68,dir).x*dir>0);assert.equal(fx.shake(.67).x,0);
}
const a=fs.readFileSync('arena.js','utf8');assert.ok(a.includes('id:"giantarmadillo",name:"Giant Armadillo",school:"earth",cost:3,target:"enemy",kind:"damage",damage:350,accuracy:.90'));
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["giantarmadillo"'));
console.log('Giant Armadillo: all 32 frames, mirrored collision, impact timing and opening hand.');
