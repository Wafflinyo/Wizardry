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
const visual={window:{},Image:class{constructor(){this.complete=true;}set src(s){assert.ok(s.includes("hydro-serpent-v5.webp"));this.naturalWidth=3584;this.naturalHeight=2880;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync("assets/hydro-serpent.js","utf8"),visual);
const art=visual.window.HydroSerpent;assert.equal(art.hit,.67);assert.equal(art.frameCount,63);assert.ok(art.ready());
const reached=new Set();
for(const x of [200,300,400,450,550,600,700,800])for(const y of [320,420,540])for(const f of [1,1.5,2])for(const blocked of [false,true]){
 const target={x,y},source={x:1000-x},hit=art.scene(source,target,.67,f,blocked);
 assert.equal(hit.n,38);assert.equal(hit.head.x,x);assert.equal(hit.head.y,hit.end.y);
 assert.ok(Math.abs(hit.x+hit.dir*hit.sx*310-x)<1e-8);
 assert.ok(Math.abs(hit.y+310*hit.shear-90*hit.sy-hit.end.y)<1e-8);
 const tail=art.scene(source,target,.67001,f,blocked);assert.equal(tail.n,39);
 for(let i=0;i<=1000;i++){const s=art.scene(source,target,i/1000,f,blocked),calls=[],g={globalAlpha:1,save(){},restore(){},translate(){},transform(){},drawImage(...args){calls.push(args);}};
 art.pool(g,s);art.actor(g,s);art.travel(g,s);art.impact(g,s);
 assert.ok(calls.length<=1);
 if(calls.length){const c=calls[0];assert.ok(c[1]>=0&&c[2]>=0&&c[1]+c[3]<=c[0].naturalWidth&&c[2]+c[4]<=c[0].naturalHeight);assert.equal(s.n,c[1]/512+c[2]/320*7);if(!blocked)reached.add(s.n);}
 if(i>670)assert.equal(s.head.x,x);
 }
}
assert.equal(reached.size,63);
const asset=fs.readFileSync("assets/hydro-serpent-v5.webp");assert.equal(asset.subarray(0,4).toString(),"RIFF");assert.equal(asset.subarray(8,12).toString(),"WEBP");assert.equal(asset.length,624242);
const pkg=JSON.parse(fs.readFileSync("package.json","utf8")),html=fs.readFileSync("arena.html","utf8"),index=fs.readFileSync("index.html","utf8");assert.ok(html.includes('aria-label="Game version '+pkg.version+'">v'+pkg.version));assert.ok(html.includes("hydro-serpent.js?v="+pkg.version));assert.ok(index.includes("arena.html?v="+pkg.version));
console.log("Hydro Serpent: 63 original raster frames, fixed pool and contact anchors, uninterrupted tail follow-through, verified release label.");
