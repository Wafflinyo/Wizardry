const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const arena=fs.readFileSync("arena.js","utf8");
assert.ok(arena.includes('id:"mammothiceshard",name:"Mammoth Ice Shard",school:"ice",cost:6,target:"enemy",kind:"damage",damage:630,frostChance:.25,frostDamage:50,frostTurns:3,accuracy:.85'));
assert.ok(arena.includes('testCards:[TEST_MAMMOTH'));
assert.ok(/const TEST_MAMMOTH=\{[^\n]*duration:2700,hit:\.68/.test(arena));
assert.ok(arena.includes('art.trail(g,s,true)'));assert.ok(arena.includes('applyPeriodicStatus(t,"frostbite",card)'));
const ctx={window:{},Image:class{constructor(){this.complete=true;}set src(s){this.path=s;this.naturalWidth=1760;this.naturalHeight=880;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync("assets/ice-mammoth-charge.js","utf8"),ctx);
(async()=>{const art=ctx.window.IceMammoth;assert.ok(await art.ensure());assert.equal(art.frameCount,32);assert.equal(art.effectFrameCount,32);
for(const team of [0,1]){
 const target={x:team===0?780:220,y:420},seen=new Set(),effects=new Set();
 for(let i=0;i<=2700;i++){
  const s=art.scene({team},target,i/2700);seen.add(s.frame);assert.equal(s.dir,team===0?1:-1);
  const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},drawImage(im,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=1760&&y+h<=880);if(im.path.includes("-fx-"))effects.add(y/220*8+x/220);}};
  let trailDraws=0;const track={...g,drawImage(...args){trailDraws++;g.drawImage(...args);}};
  art.trail(track,s,false);art.trail(track,s,true);assert.equal(trailDraws,s.p>=s.dash&&s.p<s.hit?2:0);art.draw(g,s);art.impact(g,s);
 }
 assert.equal(seen.size,32);assert.equal(effects.size,32);assert.ok((art.hit-.30)*2700<(.72-.28)*3100);const hit=art.scene({team},target,.68);assert.equal(hit.x,hit.contact.x);assert.equal(hit.y,hit.contact.y);assert.equal(hit.y,target.y+28);
}
console.log("Mammoth body and independent effects, mirrored ground contact and timing passed.");})().catch(e=>{console.error(e);process.exitCode=1;});
