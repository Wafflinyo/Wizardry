const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["fountainofyouth","hydrocannon"'));
assert.ok(a.includes('healFraction:.25,rounds:3,accuracy:.90'));
const u={id:'u',team:0,hp:1000,maxHp:2000,statuses:[]},c={id:'c',team:0,hp:2000,statuses:[]},state={round:1};
let suppressed=false,full=false;
const ctx={state,performance:{now:()=>0},getUnit:id=>id==='c'?c:u,flash:()=>{},recordBattleEvent:()=>{},healingSuppressed:()=>suppressed,restoreHp:(_c,t,n)=>{n=Math.min(t.maxHp-t.hp,n);t.hp+=n;return n;},consumeStatus:(t,k)=>{t.statuses=t.statuses.filter(r=>r.kind!==k)},addStatus:(t,k,_i,v,school)=>{let r=t.statuses.find(r=>r.kind===k);if(!r&&full)return false;if(!r)t.statuses.push(r={kind:k});Object.assign(r,{value:v,school});}};
const src=a.slice(a.indexOf('  function applyFountainYouth('),a.indexOf('  function tickBurnsForRound('));
vm.runInNewContext(src,ctx);
const card={healFraction:.25,school:'water',rounds:3};
assert.ok(ctx.applyFountainYouth(c,u,card));ctx.tickFountainYouth(u);assert.equal(u.hp,1000);
state.round=2;ctx.tickFountainYouth(u);assert.equal(u.hp,1250);ctx.tickFountainYouth(u);assert.equal(u.hp,1250);
state.round=3;ctx.tickFountainYouth(u);assert.equal(u.hp,1437);
state.round=4;ctx.tickFountainYouth(u);assert.equal(u.hp,1577);assert.equal(u.statuses.length,0);
full=true;assert.equal(ctx.applyFountainYouth(c,u,card),false);full=false;
assert.ok(ctx.applyFountainYouth(c,u,card));state.round=5;suppressed=true;ctx.tickFountainYouth(u);assert.equal(u.hp,1577);assert.equal(u.statuses[0].remaining,2);
suppressed=false;assert.ok(ctx.applyFountainYouth(c,u,card));assert.equal(u.statuses.length,1);assert.equal(u.statuses[0].remaining,3);
u.hp=0;state.round=6;ctx.tickFountainYouth(u);assert.equal(u.hp,0);assert.equal(u.statuses.length,0);
const visual={window:{},Image:class{constructor(){this.complete=true;}set src(s){this.naturalWidth=s.includes('transfer-v91')?1446:s.includes('effects')?432:784;this.naturalHeight=s.includes('transfer-v91')?1084:s.includes('effects')?336:864;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/fountain-youth.js','utf8'),visual);
const art=visual.window.FountainYouth;assert.ok(art.ready());
for(let n=0;n<=100;n++){let s=art.scene({x:750,y:500},n/100);assert.equal(s.x,500);assert.equal(s.y,510);assert.ok(art.frame(s.p)>=0&&art.frame(s.p)<42);}
// Every sprite places the measured center of the basin on the center
// diamond, not its bottom edge. Reduced scale avoids excessive blur.
const centersX=[59.5,59,60,60.5,59,59.5,61,59,59,59.5,58,57,55.5,55.5,61.5,60,60.5,60.5,60,60.5,60,59.5,58.5,58.5,57,57,56,56,54.5,53.5,52.5,53.5,56.5,58.5,59.5,59,58.5,59,59,56.5,55.5,56];
const centersY=[130,130,130,130,127,127,127,126,126,126,125,126,126,126,127,127,126,126,126,127,127,127,126,126,126,127,127,127,126,126,126,127,126,126,126,126,126,125,125,128,129,129];
for(const x of [200,800])for(const factor of [1,2])for(let n=0;n<=1000;n++){
 const s=art.scene({x,y:540},n/1000,factor),d=art.placement(s);
 assert.ok(Math.abs(d.x+centersX[d.n]*d.w/112-500)<1e-8);
 assert.ok(Math.abs(d.y+centersY[d.n]*d.h/144-510)<1e-8);
 assert.ok(d.w<180&&d.h<225&&d.y>300);
}
console.log('Fountain of Youth: three dynamic ticks, refresh, cap, suppression, no revival, and centered lower sprite placement.');
// New transfer sprite uses a single moving ribbon with no wizard art.
for(const x of [200,800])for(const y of [320,540])for(const factor of [1,2]){
 const u={x,y},s=art.scene(u,.70,factor),r=art.ribbonPath(s);
 assert.ok(Math.abs(r.to.x-x)<1e-7&&Math.abs(r.to.y-(y-70*s.k))<1e-7);
 assert.equal(r.source.x,500);
 assert.equal(art.ribbonPath(art.scene(u,.32,factor)),null);
 assert.equal(art.ribbonPath(art.scene(u,.76,factor)),null);
 for(let n=34;n<76;n++){
  const s=art.scene(u,n/100,factor),r=art.ribbonPath(s);
  assert.ok(r.n>=0&&r.n<24&&r.length>=0);
  const calls=[],g={globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(...a){calls.push(a)}};
  art.transfer(g,s);if(r.length>=1&&r.alpha>0){assert.equal(calls.length,1);assert.ok(calls[0][3]<=241&&calls[0][4]<=271);assert.equal(calls[0][7],r.length);}
 }
}
