const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"hydrocannon",name:"Hydro Cannon",school:"water",cost:4,target:"enemy",kind:"damage",damage:460,accuracy:.85'));
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["hydroserpent","fountainofyouth","hydrocannon","tectoniccrush","sentinelfissure"'));
const ctx={window:{},Image:class{constructor(){this.complete=true;}set src(s){this.path=s;this.naturalWidth=s.includes('turtle')?1776:1536;this.naturalHeight=s.includes('turtle')?888:1024;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/hydro-cannon.js','utf8'),ctx);
const art=ctx.window.HydroCannon;
assert.ok(art.ready());assert.equal(art.frameCount,32);assert.equal(art.effectFrameCount,24);
assert.equal(art.poseAt(.619).impact,-1);assert.equal(art.poseAt(.62).impact,16);assert.equal(art.poseAt(1).impact,23);
assert.equal(art.poseAt(.70).beam,-1);
assert.equal(art.hit,.62);assert.ok(a.includes('duration:4800,hit:.62,description:"An armored sea turtle'));
assert.equal(art.poseAt(.549).beam,-1);assert.ok(art.poseAt(.551).beam>=0);
for(const x of [200,250,750,800])for(const y of [320,420,500,540])for(const factor of [1,1.5,2]){
 const t={x,y},src={x:1000-x},s=art.scene(src,t,.62,factor);
 assert.equal(s.dir,x>500?1:-1);assert.equal(s.tx,x);assert.equal(s.ty,y);assert.equal(s.x,500);assert.equal(s.y,510);
 assert.ok(s.contactY>=y-125*s.targetK-1e-8&&s.contactY<=y-45*s.targetK+1e-8);
 assert.equal(art.scene(src,t,.55,factor).pose.frame,s.aimFrame);
 const mir=art.scene({x},{x:1000-x,y},.62,factor);assert.equal(mir.aimFrame,s.aimFrame);
 const calls=[],trans=[],g={globalAlpha:1,save(){},restore(){},translate(...v){trans.push(v)},scale(){},rotate(){},drawImage(...v){calls.push(v)}};
 const charge=art.scene(src,t,.48,factor);
 art.beam(g,charge);assert.equal(calls.length,2);
 assert.equal(trans[0][0],charge.far.x);assert.equal(trans[0][1],charge.far.y);
 assert.equal(trans[1][0],charge.near.x);assert.equal(trans[1][1],charge.near.y);
 assert.ok(calls.every(c=>c[3]===68&&c[4]===68&&c[5]===-c[7]/2&&c[6]===-c[8]/2));
 calls.length=0;trans.length=0;
 art.actor(g,s);assert.equal(calls.length,1);assert.ok(calls[0][0].path.includes('remake-turtle'));
 calls.length=0;trans.length=0;art.beam(g,s);
 assert.equal(calls.length,2);assert.ok(calls.every(c=>c[0].path.includes('remake-water')));
 assert.ok(!('coreStart' in s)&&!('branchEnd' in s));
 assert.ok(s.farTarget.y<s.nearTarget.y);
 assert.ok(s.farTarget.y>=y-125*s.targetK-1e-8&&s.nearTarget.y<=y-45*s.targetK+1e-8);
 for(const [j,lower] of [false,true].entries()){
  const path=art.blastPath(s,lower),end=lower?s.nearTarget:s.farTarget;
  assert.ok(path&&path.length>0);
  assert.ok(Math.abs(path.tipX-end.x)<1e-7&&Math.abs(path.tipY-end.y)<1e-7);
  assert.equal(trans[j][0],path.x);assert.equal(trans[j][1],path.y);
  assert.equal(calls[j][7],path.length);assert.equal(calls[j][8],46);
  assert.ok(calls[j][1]>=2*256&&calls[j][1]<6*256);
  assert.ok(Math.abs(path.tipX-(path.x+Math.cos(path.angle)*path.length))<1e-7);
  assert.ok(Math.abs(path.tipY-(path.y+Math.sin(path.angle)*path.length))<1e-7);
 }
 const launch=art.scene(src,t,.555,factor);
 assert.ok(art.blastPath(launch,false));assert.equal(art.blastPath(launch,true),null);
 const early=art.scene(src,t,.565,factor);
 for(const lower of [false,true]){
  const shot=art.blastPath(early,lower),m=lower?early.near:early.far;
  assert.ok(shot);assert.ok(Math.abs(shot.x-m.x)<1e-7&&Math.abs(shot.y-m.y)<1e-7);
 }
 for(let n=0;n<=100;n++){
  const r=art.scene(src,t,n/100,factor);assert.ok(r.pose.frame>=0&&r.pose.frame<32);assert.ok(Number.isFinite(r.mx)&&Number.isFinite(r.my));
 }
 calls.length=0;art.impact(g,art.scene(src,t,.95,factor));assert.equal(calls.length,1);
 const c=calls[0],n=art.poseAt(.95).impact,bases=[193,194,195,192,192,191,187,185];
 assert.ok(Math.abs(c[6]+c[8]*bases[n-16]/256-y)<1e-7);
}
console.log('Hydro Cannon remake: 32 dry and 24 water frames, two independent shots, mirrored targeting and grounded ripple.');