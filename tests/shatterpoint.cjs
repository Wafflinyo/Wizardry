const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const a=fs.readFileSync("arena.js","utf8");
assert.ok(a.includes('id:"shatterpoint",name:"Shatterpoint",school:"ice",cost:3,target:"enemy",kind:"damage",damage:320,barrierBonus:.50,accuracy:.90'));
assert.ok(a.includes('testCards:[TEST_MAMMOTH,TEST_PERMAFROST,TEST_SHATTERPOINT'));
const start=a.indexOf("  function barrierDamagePortion("),end=a.indexOf("\n  }",start)+4;
const ctx={window:{}};vm.runInNewContext(a.slice(start,end),ctx);
assert.equal(ctx.barrierDamagePortion(320,500,.5).shieldDamage,480);
assert.equal(ctx.barrierDamagePortion(320,360,.5).spent,240);
vm.runInNewContext(fs.readFileSync("assets/shatterpoint.js","utf8"),ctx);
const art=ctx.window.Shatterpoint,seen=new Set();
const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},ellipse(){}};
for(const team of [0,1])for(let i=0;i<=320;i++){const s=art.scene({team},{x:500,y:400},i/320);seen.add(s.frame);art.summon(g,s);art.actor(g,s);art.impact(g,s);}
assert.equal(seen.size,32);assert.equal(art.scene({team:0},{x:500,y:400},.64).headY,370);
console.log("Shatterpoint: test card, shield bonus, separate hammer and impact, mirrored 32-pose sequence.");
