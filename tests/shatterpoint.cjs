const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const a=fs.readFileSync("arena.js","utf8");
assert.ok(a.includes('id:"shatterpoint",name:"Shatterpoint",school:"ice",cost:3,target:"enemy",kind:"damage",damage:320,frostChance:.35,frostDamage:50,frostTurns:3,accuracy:.90'));
assert.ok(a.includes('testCards:[TEST_MAMMOTH,TEST_PERMAFROST,TEST_SHATTERPOINT'));
const start=a.indexOf("  function applyShatterpointRune("),end=a.indexOf("  function applyPeriodicStatus(",start);
const ctx={BENEFICIAL_RUNES:new Set(["growth","blade"]),preventsHitEffects:s=>!!s?.blocked,spellFrostChance:n=>n,describeStatus:(_,r)=>({title:r.kind}),consumeStatus:(u,k)=>{u.statuses=u.statuses.filter(s=>s.kind!==k);},applyPeriodicStatus:(u,k,c)=>{u.statuses.push({kind:k,value:c.frostDamage});return true;},flash(){},recordBattleEvent(){},window:{},Image:class{constructor(){this.complete=true;}set src(s){this.path=s;this.naturalWidth=1792;this.naturalHeight=896;this.onload?.();}}};
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
(async()=>{const art=ctx.window.Shatterpoint;assert.ok(await art.ensure());assert.equal(art.frameCount,32);assert.equal(art.effectFrameCount,32);
for(const team of [0,1]){
 const body=new Set(),fx=new Set(),target={x:500,y:400};
 for(let i=0;i<2600;i++){
  const s=art.scene({team},target,i/2600);const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},beginPath(){},rect(){},clip(){},drawImage(im,x,y,w,h,dx,dy,dw,dh){assert.ok(x>=0&&y>=0&&x+w<=1792&&y+h<=im.naturalHeight);const hammer=im.path.includes("-hammer-");(hammer?body:fx).add(y/224*8+x/224);if(!hammer){assert.equal(dx,-dw/2);assert.equal(dy,-dh/2);}}};
  art.summon(g,s);art.actor(g,s);art.impact(g,s);assert.equal(s.dir,team===0?1:-1);
 }
 assert.equal(body.size,32);assert.equal(fx.size,32);
 const start=art.scene({team},target,0),apex=art.scene({team},target,.64*.79),hit=art.scene({team},target,.64);
 assert.equal(start.x,500-start.dir*112);assert.equal(start.y,272);assert.equal(apex.y,135);assert.equal(hit.y,248);assert.equal(hit.x,500);assert.equal(hit.effectFrame,8);
}
assert.ok(fs.existsSync("assets/shatterpoint-hammer-v33.webp"));assert.ok(fs.existsSync("assets/shatterpoint-centered-fx-v34.webp"));
console.log("Shatterpoint: isolated hammer and impact sprites, floor rise, single overhead swing, rune conversion.");
})().catch(e=>{console.error(e);process.exitCode=1;});
