const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"colossalgolem",name:"Colossal Golem",school:"earth",cost:7,target:"enemy",kind:"damage",damage:900,accuracy:.80,boulderChance:.25'));
assert.ok(a.includes('testCards:[TEST_COLOSSAL_GOLEM'));
assert.ok(a.includes('card.id==="colossalgolem"&&dealt>0&&t.hp>0'));
assert.ok(a.includes('duration:7200,hit:59/80'));
assert.ok(a.includes('depthY:scene.backDepth')&&a.includes('depthY:scene.frontDepth'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('assets/colossal-golem.js','utf8'),ctx);
const art=ctx.window.ColossalGolem;
assert.equal(art.frameCount,80);assert.ok(art.ready());
for(let n=0;n<80;n++)assert.equal(art.frameAt((n+.01)/80),n);
assert.equal(art.frameAt(1),79);assert.equal(art.frameAt(59/80),59);
assert.ok(art.poseAt(21).near.x!==art.poseAt(25).near.x,"alternating leg position");
assert.ok(art.poseAt(23).far.lift>0,"far foot lift");
assert.ok(art.poseAt(29).near.lift>0,"near foot lift");
assert.equal(art.poseAt(55).clamp,0);assert.equal(art.poseAt(59).clamp,1);
for(const team of [0,1]){
 const s={team},t={x:team?200:800,y:450};
 for(const factor of [1,1.4,2]){
  const f=art.scene(s,t,59/80,factor);
  assert.ok(Math.abs(f.x+f.dir*f.reachX*f.k-t.x)<.00001,"contact x");
  assert.ok(Math.abs(f.y+f.contactLocal*f.k-f.contactY)<.00001,"contact y");
  assert.ok(f.backDepth<t.y&&f.frontDepth>t.y,"split depth");
  assert.equal(f.frame,59);
  const walk=art.scene(s,t,32/80,factor);assert.ok(walk.pose.walking);
  assert.ok(walk.x!==art.scene(s,t,20/80,factor).x);
 }
}
assert.equal(art.shake(.2).x,0);assert.ok(art.shake(59/80).y>0);
const noop=()=>{};let draws=0;const g={globalAlpha:1,save:noop,restore:noop,translate:(...v)=>assert.ok(v.every(Number.isFinite)),scale:(...v)=>assert.ok(v.every(Number.isFinite)),rotate:(v)=>assert.ok(Number.isFinite(v)),beginPath:noop,moveTo:(...v)=>assert.ok(v.every(Number.isFinite)),lineTo:(...v)=>assert.ok(v.every(Number.isFinite)),closePath:noop,fill:()=>draws++,stroke:noop,rect:noop,clip:noop};
for(let n=0;n<80;n++){const s=art.scene({team:0},{x:790,y:460},(n+.01)/80,1);art.draw(g,s,"back");art.draw(g,s,"front");art.debris(g,s,"front");g.globalAlpha=1;}
assert.ok(draws>1000);
const u={hp:100,statuses:[],id:'enemy'};
const c={BY_ID:{boulderweight:{penalty:.3,school:'earth',turns:3}},state:{round:3,sequence:[],queueAt:0},canReceiveDebuff:()=>true,addStatus:(t,kind,_i,value)=>{t.statuses=[{kind,value}];return true;},flash:()=>{}};
const start=a.indexOf('  function applyColossalBoulder('),end=a.indexOf('\n  }',start)+4;
vm.runInNewContext(a.slice(start,end),c);
assert.equal(c.applyColossalBoulder(u,.25),false);assert.equal(c.applyColossalBoulder(u,.249),true);assert.equal(u.statuses[0].expiresRound,7);assert.equal(u.statuses[0].value,.3);
c.state.sequence=[{casterId:'enemy'}];assert.equal(c.applyColossalBoulder(u,0),true);assert.equal(u.statuses[0].expiresRound,6);
console.log('Colossal Golem: 80 transparent articulated frames, separate layers, alternating footfalls, target alignment and Boulder Weight.');
