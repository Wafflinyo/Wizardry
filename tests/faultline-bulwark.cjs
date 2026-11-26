const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('assets/faultline-bulwark.js','utf8'),ctx);
const fx=ctx.window.FaultlineBulwark;
function record(){const calls=[];const g=new Proxy({globalAlpha:1,createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});return {calls,g};}
for(const team of [0,1]){
 const {g,calls}=record(),u={x:500,y:500,team};
 fx.draw(g,u,1,null,'back',1);const back=calls.filter(a=>a[0]==='fill').length;
 calls.length=0;fx.draw(g,u,1,null,'front',1);const front=calls.filter(a=>a[0]==='fill').length;
 assert.ok(back>80&&front>80,'both original depth layers contain masonry');
 assert.ok(calls.some(a=>a[0]==='scale'&&a[1]===(team?-1:1)));
 calls.length=0;fx.draw(g,u,.45,null,'all',1);assert.ok(calls.some(a=>a[0]==='fill'));
 calls.length=0;fx.draw(g,u,1,{age:.14,stress:1,broken:true,attacker:{x:750,y:500}},'all',1);assert.ok(calls.some(a=>a[0]==='stroke'));
}
const {g,calls}=record();fx.portrait(g,160,160);assert.ok(calls.filter(a=>a[0]==='fill').length>160,'portrait uses the same masonry wall');
const arena=fs.readFileSync('arena.js','utf8');assert.ok(arena.includes('"shieldHp":350,"retaliation":120'));assert.ok(arena.includes('RECENTLY_UPDATED_CARDS=["faultlinebulwark"'));
console.log('Faultline Bulwark: masonry on both depth layers, mirrored growth and shatter, matching card art.');
