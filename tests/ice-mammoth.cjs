const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const arena=fs.readFileSync("arena.js","utf8");
assert.ok(arena.includes('id:"mammothiceshard",name:"Mammoth Ice Shard",school:"ice",cost:6,target:"enemy",kind:"damage",damage:630,frostChance:.25,frostDamage:50,frostTurns:3,accuracy:.85'));
assert.ok(arena.includes('testCards:[TEST_MAMMOTH'));
assert.ok(/const TEST_MAMMOTH=\{[^\n]*duration:3100,hit:\.72/.test(arena));
assert.ok(!arena.includes('type:"mammoth-foot-kickup"'));
assert.ok(arena.includes('applyPeriodicStatus(t,"frostbite",card)'));
const ctx={window:{},Image:class{constructor(){this.complete=true;}set src(s){assert.ok(s.includes("ice-mammoth-charge-v22.webp"));this.naturalWidth=2112;this.naturalHeight=704;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync("assets/ice-mammoth-charge.js","utf8"),ctx);
(async()=>{const art=ctx.window.IceMammoth;assert.ok(await art.ensure());assert.equal(art.frameCount,32);
for(const team of [0,1]){
 const target={x:team===0?780:220,y:420},seen=new Set();
 for(let i=0;i<=3100;i++){
  const s=art.scene({team},target,i/3100);assert.ok(s.frame>=0&&s.frame<32);seen.add(s.frame);assert.equal(s.dir,team===0?1:-1);
  let draws=0;const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},drawImage(im,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=2112&&y+h<=704);draws++;}};
  art.draw(g,s);art.impact(g,s);assert.equal(draws,i<3100?1:0);
 }
 assert.equal(seen.size,32);const hit=art.scene({team},target,.72);assert.equal(hit.x,hit.contact.x);assert.equal(hit.y,hit.contact.y);assert.equal(hit.frame,20);assert.equal(hit.y,target.y+28);
}
console.log("Ice mammoth: all 32 frames, mirrored charge and collision timing.");})().catch(e=>{console.error(e);process.exitCode=1;});
