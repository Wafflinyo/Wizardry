const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');assert.ok(a.includes('id:"petrify",name:"Petrify",school:"earth",cost:4,target:"ally",kind:"petrify",heal:200,rounds:2,accuracy:1'));
const ctx={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=256;this.naturalHeight=64;}}};vm.runInNewContext(fs.readFileSync('assets/petrify.js','utf8'),ctx);
const pix=new Uint8ClampedArray([0,0,0,0,30,90,200,255,200,180,120,128]);ctx.window.Petrify.stonePixels(pix,3,1);assert.equal(pix[3],0);assert.equal(pix[7],255);assert.equal(pix[11],128);assert.ok(Math.abs(pix[4]-pix[6])<=17);
let healed=0;const c={state:{round:1},healingSuppressed:()=>false,getUnit:()=>null,restoreHp:(s,u,n)=>{healed+=n;return n;},flash:()=>({})};
for(const name of ['petrified','tickPetrify']){const start=a.indexOf('  function '+name+'(');const end=name==='petrified'?a.indexOf('\n',start):a.indexOf('\n  }',start)+4;vm.runInNewContext(a.slice(start,end),c);}
const u={hp:100,statuses:[{kind:'petrify',value:200,appliedRound:1,expiresRound:4,lastTickRound:1}]};
assert.equal(c.petrified(u),true);c.tickPetrify(u);assert.equal(healed,0);
for(const round of [2,3]){c.state.round=round;c.tickPetrify(u);c.tickPetrify(u);assert.equal(c.petrified(u),true);}
assert.equal(healed,400);c.state.round=5;assert.equal(c.petrified(u),false);
assert.ok(a.includes('if(amount>0&&petrified(target))'));assert.ok(a.includes('if(petrified(c)){c.passedRound=null'));assert.ok(a.includes('stasis?0:'));assert.ok(a.includes('if(r&&state.round>=r.expiresRound)consumeStatus(u,"petrify")'));
console.log('Petrify: exact alpha silhouette, two healing ticks, immunity and action lock.');