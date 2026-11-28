const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const a=fs.readFileSync("arena.js","utf8");
assert.ok(a.includes('id:"shatterpoint",name:"Shatterpoint",school:"ice",cost:3,target:"enemy",kind:"damage",damage:320,frostChance:.35,frostDamage:50,frostTurns:3,accuracy:.90'));
assert.ok(a.includes('testCards:[TEST_MAMMOTH,TEST_PERMAFROST,TEST_SHATTERPOINT'));
const start=a.indexOf("  function applyShatterpointRune("),end=a.indexOf("  function applyPeriodicStatus(",start);
const ctx={BENEFICIAL_RUNES:new Set(["growth","blade"]),preventsHitEffects:s=>!!s?.blocked,spellFrostChance:n=>n,describeStatus:(_,r)=>({title:r.kind}),consumeStatus:(u,k)=>{u.statuses=u.statuses.filter(s=>s.kind!==k);},applyPeriodicStatus:(u,k,c)=>{u.statuses.push({kind:k,value:c.frostDamage});return true;},flash(){},recordBattleEvent(){},window:{},Image:class{constructor(){this.complete=true;}set src(s){this.naturalWidth=1920;this.naturalHeight=640;this.onload?.();}}};
vm.runInNewContext(a.slice(start,end),ctx);
const card={name:"Shatterpoint",frostChance:.35,frostDamage:50,frostTurns:3};
let u={hp:1000,statuses:[{kind:"growth"},{kind:"blade"},{kind:"trap"},{kind:"fear"}]};
assert.equal(ctx.applyShatterpointRune(u,card,{},.35,0),false);
assert.equal(ctx.applyShatterpointRune(u,card,{blocked:true},.1,0),false);
assert.equal(ctx.applyShatterpointRune(u,card,{},.34,0),true);
assert.deepEqual(u.statuses.map(x=>x.kind),["blade","trap","fear","frostbite"]);
u={hp:1000,statuses:[{kind:"growth"},{kind:"frostbite",extreme:true}]};assert.equal(ctx.applyShatterpointRune(u,card,{},0,0),false);assert.equal(u.statuses.length,2);
u={hp:1000,statuses:[]};assert.equal(ctx.applyShatterpointRune(u,card,{},0,0),false);
vm.runInNewContext(fs.readFileSync("assets/shatterpoint.js","utf8"),ctx);
(async()=>{const art=ctx.window.Shatterpoint;assert.ok(await art.ensure());assert.equal(art.frameCount,32);
for(const team of [0,1]){
 const seen=new Set();
 for(let i=0;i<2600;i++){
  const s=art.scene({team},{x:500,y:400},i/2600);
  let draws=0;const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},drawImage(im,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=1920&&y+h<=640);seen.add(y/160*8+x/240);draws++;}};
  art.summon(g,s);art.actor(g,s);art.impact(g,s);assert.equal(draws,1);
  assert.equal(s.dir,team===0?1:-1);
 }
 assert.equal(seen.size,32);const start=art.scene({team},{x:500,y:400},0),hit=art.scene({team},{x:500,y:400},.64),end=art.scene({team},{x:500,y:400},1);
 assert.equal(hit.frame,15);assert.equal(start.anchorX,500-start.dir*88);assert.equal(hit.anchorX,500-hit.dir*28);assert.equal(hit.anchorY,310);assert.equal(start.anchorY,310);assert.equal(end.anchorY,412);assert.equal(end.anchorX,500);
}
assert.ok(fs.existsSync("assets/shatterpoint-v30.webp"));
console.log("Shatterpoint: all 32 illustrated cells, synchronized impact, rune conversion.");
})().catch(e=>{console.error(e);process.exitCode=1;});
