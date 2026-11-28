const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('damage:800,reductionPierce:.50,accuracy:.80'));
assert.ok(a.includes('const effectiveSolidity=solidity*(1-incomingPierce)'));
assert.ok(a.includes('const effectiveShield=shield.value*(1-incomingPierce)'));
assert.ok(a.includes('const TEST_ONLY_CARDS=[...ICE_TEST_CARDS,TEST_SKY_SERPENT]'));
assert.ok(!JSON.parse(fs.readFileSync('backend/cards.json','utf8')).some(c=>c.id==='skyserpent'));
const ctx={window:{},setTimeout,clearTimeout,Image:class{constructor(){this.complete=false;}set src(s){this.path=s;this.complete=true;this.naturalWidth=s.includes('sky-serpent-body')?1536:768;this.naturalHeight=768;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/sky-serpent.js','utf8'),ctx);
(async()=>{const art=ctx.window.SkySerpent;assert.ok(await art.ensure());assert.equal(art.frameCount,32);
for(const team of [0,1]){
 const target={x:team?200:800,y:450},seen=new Set(),effects=new Set();
 const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(im,x,y,w,h){assert.ok(x+w<=im.naturalWidth&&y+h<=im.naturalHeight);(im.path.includes('sky-serpent-body')?seen:effects).add(y/192*(im.path.includes('sky-serpent-body')?8:4)+x/192);}};
 for(let i=1;i<4000;i++){const s=art.scene({team},target,i/4000);assert.equal(s.dir,team?-1:1);art.actor(g,s);art.drill(g,s,"back");art.drill(g,s,"front");art.impact(g,s);}
 assert.equal(seen.size,32);assert.equal(effects.size,4);
 let before=0,after=0;const probe={...g,drawImage(){before++;}};
 const windup=art.scene({team},target,.39),diving=art.scene({team},target,.49);
 art.drill(probe,windup,"back");art.drill(probe,windup,"front");assert.equal(before,0);
 art.drill(probe,diving,"back");art.drill(probe,diving,"front");assert.equal(before,6);
 const hit=art.scene({team},target,.59);assert.ok(Math.abs(hit.x-(target.x-hit.dir*335*.30))<1e-6);
 assert.ok(a.includes("duration:4000,hit:.59"));assert.ok(a.includes("sky-serpent-drill-front"));
}
assert.ok(fs.existsSync('assets/sky-serpent-body.webp'));
console.log('Sky Serpent: 32 poses, independent impact, mirrored dive, test-only registration.');
})().catch(e=>{console.error(e);process.exitCode=1;});
