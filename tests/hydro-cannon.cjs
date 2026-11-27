const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"hydrocannon",name:"Hydro Cannon",school:"water",cost:4,target:"enemy",kind:"damage",damage:460,accuracy:.85'));
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["hydrocannon","tectoniccrush","sentinelfissure"'));
assert.ok(!a.includes('TEST_COLOSSAL_GOLEM'));assert.ok(!a.includes('"colossalgolem"'));
const ctx={window:{},Image:class{constructor(){this.complete=true;}set src(s){this.naturalWidth=s.includes('turtle')?1776:1536;this.naturalHeight=s.includes('turtle')?888:1024;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/hydro-cannon.js','utf8'),ctx);
const art=ctx.window.HydroCannon;
assert.ok(art.ready());assert.equal(art.frameCount,32);assert.equal(art.effectFrameCount,24);
assert.equal(art.poseAt(.699).impact,-1);assert.equal(art.poseAt(.70).impact,15);assert.equal(art.poseAt(1).impact,23);
for(const x of [200,800])for(const y of [320,540])for(const factor of [1,1.5,2]){
 const t={x,y},s=art.scene({x:1000-x},t,.70,factor),s2=art.scene({x:1000-x},t,.95,factor);
 assert.equal(s.dir,x>500?1:-1);assert.equal(s.tx,x);assert.equal(s.ty,y);assert.ok(s.contactY<y);assert.equal(s.x,s2.x);assert.equal(s.y,s2.y);
 const calls=[],g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(...args){calls.push(args)}};
 art.actor(g,s);art.beam(g,s);art.impact(g,s);assert.equal(calls.length,3);
}
console.log('Hydro Cannon: 32 turtle + 24 water frames; cast alignment, hit timing, tester order, and Golem removal passed.');