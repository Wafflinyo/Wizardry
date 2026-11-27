const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const arena=fs.readFileSync("arena.js","utf8");
assert.ok(arena.includes('id:"hydroserpent",name:"Hydro Serpent",school:"water",cost:5,target:"enemy",kind:"damage",damage:480,protectionBonus:.25,accuracy:.85'));
assert.ok(arena.includes('RECENTLY_UPDATED_CARDS=["hydroserpent","fountainofyouth"'));
assert.ok(arena.includes('raw*=1+card.protectionBonus'));
assert.ok(arena.includes('testCards:[TEST_HYDRO_SERPENT,TEST_FOUNTAIN_YOUTH'));
const context={};vm.runInNewContext(arena.slice(arena.indexOf("  function hydroSerpentProtection("),arena.indexOf("  function damage(")),context);
const isProtected=(kind,value,expiresRound,round=2)=>context.hydroSerpentProtection({statuses:[{kind,value,expiresRound}]},round);
for(const kind of ["sand_warrior","faultline_bulwark","bubble_shield"]){assert.equal(isProtected(kind,1),true);assert.equal(isProtected(kind,0),false);}
assert.equal(isProtected("wind_dome"),true);assert.equal(isProtected("reflective_ice",1,3),true);assert.equal(isProtected("reflective_ice",1,2),false);
assert.equal(isProtected("petrify",1,2),true);assert.equal(isProtected("petrify",1,1),false);assert.equal(isProtected("burn",1,3),false);
const visual={window:{},Image:class{constructor(){this.complete=true;}set src(s){const sizes=s.includes("-body")?[1344,896]:s.includes("-pool")?[1000,400]:[1200,480];[this.naturalWidth,this.naturalHeight]=sizes;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync("assets/hydro-serpent.js","utf8"),visual);
const art=visual.window.HydroSerpent;assert.equal(art.hit,.67);assert.equal(art.frameCount,41);assert.ok(art.ready());
for(const x of [200,300,700,800])for(const y of [320,420,540])for(const f of [1,1.5,2]){
 const target={x,y},source={x:1000-x};const hit=art.scene(source,target,.67,f);
 assert.equal(hit.x,500);assert.equal(hit.y,510);assert.equal(hit.dir,x>500?1:-1);assert.equal(hit.head.x,x);assert.ok(Math.abs(hit.head.y-hit.end.y)<1e-8);
 const exit=art.scene(source,target,.84,f);assert.ok((exit.head.x-x)*hit.dir>0);
 const blocked=art.scene(source,target,.8,f,true);assert.equal(blocked.head.x,x);
 for(let i=0;i<=100;i++){
  const s=art.scene(source,target,i/100,f),calls=[],g={globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(...args){calls.push(args);}};
  art.pool(g,s);art.actor(g,s);art.travel(g,s);art.impact(g,s);
  for(const c of calls)assert.ok(c[1]>=0&&c[2]>=0&&c[1]+c[3]<=c[0].naturalWidth&&c[2]+c[4]<=c[0].naturalHeight);
 }
}
console.log("Hydro Serpent: protection eligibility, original 41-frame assets, directional impact and tester isolation.");