const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');assert.ok(a.includes('id:"petrify",name:"Petrify",school:"earth",cost:4,target:"ally",kind:"petrify",reduction:.20,rounds:3,accuracy:1'));assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["petrify"'));
const ctx={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=256;this.naturalHeight=64;}}};vm.runInNewContext(fs.readFileSync('assets/petrify.js','utf8'),ctx);
const fx=ctx.window.Petrify,calls=[],g=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
for(let i=0;i<28;i++){calls.length=0;fx.wizard(g,1,i);assert.equal(calls.filter(a=>a[0]==='drawImage').length,4);}
calls.length=0;fx.wizard(g,0,0);assert.equal(calls.length,0);
const extract=a.match(/  function applyPetrifyReduction\(u,amount\)\{[\s\S]*?\n  \}/)[0];
const c={state:{round:1},tally(){},flash(){return {};}};vm.runInNewContext(extract,c);const u={statuses:[{kind:'petrify',value:.2,expiresRound:4}]};assert.equal(c.applyPetrifyReduction(u,500),400);c.state.round=4;assert.equal(c.applyPetrifyReduction(u,500),500);
console.log('Petrify: 28 live wizard poses, armor attachments, direct damage reduction and expiry.');