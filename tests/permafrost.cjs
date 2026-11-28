const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const a=fs.readFileSync("arena.js","utf8");
assert.ok(a.includes('TEST_PERMAFROST={id:"permafrost"'));
assert.ok(a.includes('fieldRounds:5,fieldBoost:.10,frostChanceBoost:.15,frostExtraTurns:2'));
assert.ok(JSON.parse(fs.readFileSync("backend/cards.json","utf8")).some(c=>c.id==="permafrost"&&!c.testOnly));
const begin=a.indexOf("  function spellFrostChance("),end=a.indexOf("  function applyPeriodicStatus(",begin);
const c={state:{environment:{id:"permafrost"}},BY_ID:{permafrost:{frostChanceBoost:.15,frostExtraTurns:2}}};
vm.runInNewContext(a.slice(begin,end),c);
for(const [base,expected] of [[.25,.40],[.30,.45],[.15,.30],[.60,.75],[.95,1],[0,0]])assert.ok(Math.abs(c.spellFrostChance(base)-expected)<1e-9);
assert.equal(c.frostbiteDuration(50,3),5);assert.equal(c.frostbiteDuration(100,5),5);
c.state.environment=null;assert.equal(c.frostbiteDuration(50,3),3);assert.equal(c.spellFrostChance(.25),.25);
assert.equal((a.match(/<spellFrostChance\(/g)||[]).length,4);
assert.ok(a.includes('element==="ice"?spellFrostChance(card.stunChance)'));
assert.ok(a.includes('kind==="frostbite"&&state.environment?.id==="permafrost"?1:environmentDamageMultiplier(school)'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync("assets/permafrost.js","utf8"),ctx);
const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},ellipse(){},clip(){},fillRect(){},createLinearGradient(){return{addColorStop(){}};}};
for(let i=0;i<=32;i++){ctx.window.Permafrost.landscape(g,{time:i*100,strength:i/32});ctx.window.Permafrost.draw(g,{width:1000,height:620,time:i*100,strength:i/32});}
const lower=[];const probe={...g,fillRect(x,y,w,h){lower.push([x,y,w,h]);}};ctx.window.Permafrost.landscape(probe,{strength:1});assert.ok(lower.some(([x,y,w,h])=>x===0&&y===520&&w===1000&&y+h===620));
console.log("Permafrost: field registration, chance cap, normal/extreme duration, base tick damage and visual growth.");
