const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"hydrocannon",name:"Hydro Cannon",school:"water",cost:4,target:"enemy",kind:"damage",damage:460,accuracy:.85'));
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["hydrocannon","tectoniccrush","sentinelfissure"'));
assert.ok(!a.includes('TEST_COLOSSAL_GOLEM'));assert.ok(!a.includes('"colossalgolem"'));
const ctx={window:{},Image:class{constructor(){this.complete=true;}set src(s){this.path=s;this.naturalWidth=s.includes('turtle')?1776:s.includes('jets')?1024:1536;this.naturalHeight=s.includes('turtle')?888:s.includes('jets')?1536:1024;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/hydro-cannon.js','utf8'),ctx);
const art=ctx.window.HydroCannon;
assert.ok(art.ready());assert.equal(art.frameCount,32);assert.equal(art.effectFrameCount,24);
assert.equal(art.poseAt(.699).impact,-1);assert.equal(art.poseAt(.70).impact,15);assert.equal(art.poseAt(1).impact,23);
for(const x of [200,800])for(const y of [320,540])for(const factor of [1,1.5,2]){
 const t={x,y},s=art.scene({x:1000-x},t,.70,factor),s2=art.scene({x:1000-x},t,.95,factor);
 assert.equal(s.dir,x>500?1:-1);assert.equal(s.tx,x);assert.equal(s.ty,y);assert.ok(s.contactY<y);assert.equal(s.x,500);assert.equal(s.y,510);assert.equal(s.x,s2.x);assert.equal(s.y,s2.y);
 assert.ok(s.near.x!==s.far.x&&s.near.y!==s.far.y);
 const calls=[],trans=[],g={globalAlpha:1,save(){},restore(){},translate(...p){trans.push(p)},scale(){},rotate(){},drawImage(...args){calls.push(args)}};
 art.actor(g,s);assert.equal(calls.length,1);assert.ok(calls[0][0].path.includes('turtle-clean'));
 calls.length=0;trans.length=0;art.beam(g,s);assert.equal(calls.length,3);
 assert.ok(calls.every(c=>c[0].path.includes('hydro-jets')));
 assert.equal(trans[0][0],s.far.x);assert.equal(trans[0][1],s.far.y);assert.equal(trans[1][0],s.near.x);assert.equal(trans[1][1],s.near.y);
 assert.equal(trans[2][0],s.merge.x);assert.equal(trans[2][1],s.merge.y);
 calls.length=0;art.impact(g,s);assert.equal(calls.length,1);assert.ok(calls[0][0].path.includes('hydro-water'));
}
console.log('Hydro Cannon: dry turtle atlas, center diamond, separate twin muzzle streams and convergence, unchanged hit timing.');