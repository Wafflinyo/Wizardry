const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const arena=fs.readFileSync("arena.js","utf8");
assert.ok(arena.includes('id:"mammothiceshard",name:"Mammoth Ice Shard",school:"ice",cost:6,target:"enemy",kind:"damage",damage:630,frostChance:.25,frostDamage:50,frostTurns:3,accuracy:.85'));
assert.ok(arena.includes('testCards:[TEST_MAMMOTH'));
assert.ok(arena.includes('applyPeriodicStatus(t,"frostbite",card)'));
const ctx={window:{},Image:class{constructor(){this.complete=true;}set src(s){this.naturalWidth=1760;this.naturalHeight=880;this.onload?.();}}};vm.runInNewContext(fs.readFileSync("assets/ice-mammoth-charge.js","utf8"),ctx);
(async()=>{const art=ctx.window.IceMammoth;assert.ok(await art.ensure());assert.equal(art.frameCount,32);for(const team of [0,1]){const target={x:team===0?780:220,y:420};for(let i=0;i<=400;i++){const s=art.scene({team},target,i/400);assert.ok(s.frame>=0&&s.frame<32);assert.equal(s.dir,team===0?1:-1);art.draw({globalAlpha:1,save(){},restore(){},translate(){},scale(){},drawImage(im,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=1760&&y+h<=880);}},s);}const hit=art.scene({team},target,.72);assert.equal(hit.x,hit.contact.x);assert.equal(hit.y,hit.contact.y);}console.log("Ice mammoth frame bounds and mirrored collision positions passed.");})().catch(e=>{console.error(e);process.exitCode=1;});
