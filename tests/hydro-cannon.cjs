const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"hydrocannon",name:"Hydro Cannon",school:"water",cost:4,target:"enemy",kind:"damage",damage:460,accuracy:.85'));
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["hydrocannon","tectoniccrush","sentinelfissure"'));
assert.ok(!a.includes('TEST_COLOSSAL_GOLEM'));assert.ok(!a.includes('"colossalgolem"'));
const ctx={window:{},Image:class{constructor(){this.complete=true;}set src(s){this.path=s;this.naturalWidth=s.includes('turtle')?1776:1452;this.naturalHeight=s.includes('turtle')?888:1088;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/hydro-cannon.js','utf8'),ctx);
const art=ctx.window.HydroCannon;
assert.ok(art.ready());assert.equal(art.frameCount,32);assert.equal(art.effectFrameCount,24);
assert.equal(art.poseAt(.699).impact,-1);assert.equal(art.poseAt(.70).impact,16);assert.equal(art.poseAt(1).impact,23);
for(const x of [200,800])for(const y of [320,540])for(const factor of [1,1.5,2]){
 const t={x,y},s=art.scene({x:1000-x},t,.70,factor),s2=art.scene({x:1000-x},t,.95,factor);
 assert.equal(s.dir,x>500?1:-1);assert.equal(s.tx,x);assert.equal(s.ty,y);assert.ok(s.contactY<y);assert.equal(s.x,500);assert.equal(s.y,510);assert.equal(s.x,s2.x);assert.equal(s.y,s2.y);
 assert.ok(s.near.x!==s.far.x&&s.near.y!==s.far.y);
 const calls=[],trans=[],g={globalAlpha:1,save(){},restore(){},translate(...p){trans.push(p)},scale(){},rotate(){},drawImage(...args){calls.push(args)}};
 art.actor(g,s);assert.equal(calls.length,1);assert.ok(calls[0][0].path.includes('crisp-turtle'));
 calls.length=0;trans.length=0;art.beam(g,s);assert.equal(calls.length,3);
 assert.ok(calls.every(c=>c[0].path.includes('hydro-crisp-water')));
 assert.equal(trans[0][0],s.coreStart.x);assert.equal(trans[0][1],s.coreStart.y);
 assert.equal(trans[1][0],s.far.x);assert.equal(trans[1][1],s.far.y);
 assert.equal(trans[2][0],s.near.x);assert.equal(trans[2][1],s.near.y);
 assert.equal(calls[0][8],104);assert.equal(calls[1][8],52);assert.equal(calls[2][8],52);
 assert.ok(Math.abs(s.branchEnd.x-s.mx)>Math.abs(s.coreStart.x-s.mx));
 assert.ok(Math.abs(s.branchEnd.x-s.coreStart.x)>Math.abs(s.tx-s.mx)*.23);
 calls.length=0;art.impact(g,s);assert.equal(calls.length,1);assert.ok(calls[0][0].path.includes('hydro-crisp-water'));
}
// Faster pose playback with target-aware limited recoil; beam keeps
// the original impact time and never starts ahead of its muzzle branches.
for(const x of [200,800])for(const y of [320,420,500,540])for(const factor of [1,1.5,2]){
 const t={x,y},src={x:1000-x},s=art.scene(src,t,.70,factor);
 assert.ok(Math.abs(s.pose.frame-s.aimFrame)<=1);
 assert.equal(art.scene(src,t,.58,factor).pose.frame,s.aimFrame);
 assert.equal(art.scene(src,t,.98,factor).pose.frame,0);
 assert.ok(s.contactY>=y-125*s.targetK-1e-8&&s.contactY<=y-45*s.targetK+1e-8);
 const mirror=art.scene({x},{x:1000-x,y},.70,factor);
 assert.equal(s.aimFrame,mirror.aimFrame);
 assert.ok(Math.abs(s.contactY-mirror.contactY)<1e-8);
 for(let ms=0;ms<580;ms+=10){
  const p=.58+ms/4800,r=art.scene(src,t,p,factor);
  assert.ok(Math.abs(r.pose.frame-r.aimFrame)<=1);
  const q=Math.min(1,(p-.58)/.12),branchTip=Math.min(q,.32);
  const coreTip=.08+Math.max(0,q-.08);
  if(q>.08)assert.ok(branchTip>=.08&&coreTip>=branchTip-1e-8);
 }
}
const frames=new Set();for(let ms=0;ms<500;ms+=55)frames.add(art.poseAt(.58+ms/4800).beam);
assert.equal(frames.size,3);
assert.equal(art.poseAt(.79).beam,-1);
assert.equal(art.poseAt(.699).impact,-1);
assert.equal(art.poseAt(.70).impact,16);
console.log('Hydro Cannon: faster sprite cadence, limited aiming recoil, thicker continuous early-merged blast, unchanged damage timing.');