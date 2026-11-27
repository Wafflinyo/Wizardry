const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const arena=fs.readFileSync("arena.js","utf8");
assert.ok(arena.includes('id:"hydroserpent",name:"Hydro Serpent",school:"water",cost:5,target:"all_enemies",kind:"hydroserpent",damage:430,accuracy:.85'));
assert.ok(arena.includes('card.kind==="hydroserpent"||card.kind==="whale"'));
assert.ok(arena.includes("75*Math.max(0,(anim.hydroTargets?.length??enemies.length)-1)"));
assert.ok(!arena.includes('raw*=1+card.protectionBonus'));
assert.ok(arena.includes('testCards:[TEST_HYDRO_SERPENT,TEST_FOUNTAIN_YOUTH'));
const visual={window:{},Image:class{constructor(){this.complete=true;}set src(s){[this.naturalWidth,this.naturalHeight]=s.includes("sky-v8.webp")?[1792,1024]:[768,768];this.onload?.();}}};
vm.runInNewContext(fs.readFileSync("assets/hydro-serpent.js","utf8"),visual);
const art=visual.window.HydroSerpent;assert.equal(art.hit,.72);assert.equal(art.frameCount,32);
(async()=>{await art.ensure();assert.ok(art.ready());for(const team of [0,1])for(let count=1;count<=4;count++){
 const targets=Array.from({length:count},(_,i)=>({x:500+(team===0?1:-1)*(120+i*36),y:320+i*65,factor:1,id:i}));
 for(let i=0;i<1000;i++){const s=art.scene({team},targets,i/1000);assert.equal(s.x,500);assert.equal(s.y,510);assert.equal(s.targets.length,count);assert.ok(s.n>=0&&s.n<32);let calls=0;const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(im,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=im.naturalWidth&&y+h<=im.naturalHeight);calls++;}};
 art.actor(g,s);art.blast(g,s);for(const u of s.targets)art.rain(g,s,u);assert.ok(calls<=1+4+32*count);}
 }console.log("Hydro Serpent: stationary summon, 430 + 75 per additional enemy AoE damage, water blast and enemy-team rain.");})().catch(e=>{console.error(e);process.exitCode=1;});
