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
const visual={window:{},Image:class{constructor(){this.complete=true;}set src(s){assert.ok(s.includes("hydro-serpent-v7.webp"));this.naturalWidth=1792;this.naturalHeight=2048;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync("assets/hydro-serpent.js","utf8"),visual);
const art=visual.window.HydroSerpent;assert.equal(art.hit,.67);assert.equal(art.frameCount,64);assert.ok(art.ready());
const reached=new Set();
for(const x of [200,300,400,450,550,600,700,800])for(const y of [320,420,540])for(const f of [1,1.5,2])for(const blocked of [false,true]){
 const target={x,y},source={x:1000-x},hit=art.scene(source,target,.67,f,blocked);
 assert.equal(hit.n,33);assert.ok(Math.abs(hit.drawX+hit.dir*66*hit.scale-x)<1e-8);assert.ok(Math.abs(hit.drawY-15*hit.scale-hit.end.y)<1e-8);
 let previous=null;
 for(let i=0;i<=1000;i++){const s=art.scene(source,target,i/1000,f,blocked),calls=[],g={globalAlpha:1,save(){},restore(){},translate(){},scale(x,y){assert.equal(Math.abs(x),y);},drawImage(...args){calls.push(args);}};
 art.pool(g,s);art.actor(g,s);art.travel(g,s);art.impact(g,s);
 assert.ok(calls.length<=1);if(previous){assert.ok(Math.hypot(s.drawX-previous.drawX,s.drawY-previous.drawY)<12);assert.ok(s.n>=previous.n);assert.equal(s.scale,previous.scale);}previous=s;
 if(calls.length){const c=calls[0];assert.ok(c[1]>=0&&c[2]>=0&&c[1]+c[3]<=c[0].naturalWidth&&c[2]+c[4]<=c[0].naturalHeight);assert.equal(s.n,c[1]/224+c[2]/256*8);if(!blocked)reached.add(s.n);}
 }
}
assert.equal(reached.size,64);
const asset=fs.readFileSync("assets/hydro-serpent-v7.webp");assert.equal(asset.subarray(0,4).toString(),"RIFF");assert.equal(asset.subarray(8,12).toString(),"WEBP");assert.equal(asset.length,534368);
const pkg=JSON.parse(fs.readFileSync("package.json","utf8")),html=fs.readFileSync("arena.html","utf8"),index=fs.readFileSync("index.html","utf8");assert.ok(html.includes('aria-label="Game version '+pkg.version+'">v'+pkg.version));assert.ok(html.includes("hydro-serpent.js?v="+pkg.version));assert.ok(index.includes("arena.html?v="+pkg.version));
console.log("Hydro Serpent: 64 illustrated frames, fixed proportions, one sprite per tick, continuous positioning, verified version.");
