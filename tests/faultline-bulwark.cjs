const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('assets/faultline-bulwark.js','utf8'),ctx);
const fx=ctx.window.FaultlineBulwark;
function record(){const calls=[];const g=new Proxy({globalAlpha:1,createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});return {calls,g};}
for(const team of [0,1]){
 const {g,calls}=record(),u={x:500,y:500,team};
 fx.draw(g,u,1,null,'back',1);const back=calls.filter(a=>a[0]==='fill').length;
 calls.length=0;fx.draw(g,u,1,null,'front',1);const front=calls.filter(a=>a[0]==='fill').length;
 assert.ok(back>80&&front>80,'both original depth layers contain masonry');
 assert.ok(calls.some(a=>a[0]==='scale'&&a[1]===(team?-1:1)));
 calls.length=0;fx.draw(g,u,.45,null,'all',1);assert.ok(calls.some(a=>a[0]==='fill'));
 calls.length=0;fx.draw(g,u,1,{age:.14,stress:1,broken:true,attacker:{x:750,y:500}},'all',1);assert.ok(calls.some(a=>a[0]==='stroke'));
}
const {g,calls}=record();fx.portrait(g,160,160);assert.ok(calls.filter(a=>a[0]==='fill').length>160,'portrait uses the same masonry wall');
const arena=fs.readFileSync('arena.js','utf8');assert.ok(arena.includes('"shieldHp":400,"retaliation":150'));assert.ok(/RECENTLY_UPDATED_CARDS=\[[^\]]*"faultlinebulwark"/.test(arena));
console.log('Faultline Bulwark: masonry on both depth layers, mirrored growth and shatter, matching card art.');

const backend=JSON.parse(fs.readFileSync('backend/cards.json','utf8')).find(c=>c.id==='faultlinebulwark');assert.equal(backend.shieldHp,400);assert.equal(backend.retaliation,150);

// Both V branches must expose a thick top and an end face.
{const u={x:0,y:0,team:0};for(const layer of ['back','front']){const {g,calls}=record();fx.draw(g,u,1,null,layer,1);const points=calls.filter(a=>a[0]==='lineTo');assert.ok(points.length>100);const xs=points.map(a=>a[1]);assert.ok(Math.max(...xs)>130,'outward depth visible in '+layer);}}

{const u={x:500,y:500,team:0},{g,calls}=record();fx.riseFx(g,u,.25,'front');assert.ok(calls.some(a=>a[0]==='ellipse'));assert.ok(calls.some(a=>a[0]==='rotate'));calls.length=0;fx.riseFx(g,u,1.3,'front');assert.equal(calls.length,0);assert.ok(Math.hypot(fx.shake(.35).x,fx.shake(.35).y)>0);assert.equal(fx.shake(1.2).x,0);}

// Exercise the real combat pipeline with a persistent wall and stackable Petrify.
{const source=arena.replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  window.test={set:s=>state=s,damage,applySpell,barrierConflict,absorbBarrierDamage};paintUI=()=>{};');
 const node={getContext:()=>({})},context={Image:class{},window:{},document:{getElementById:()=>node},requestAnimationFrame:()=>{},console,performance:{now:()=>0}};
 vm.runInNewContext(source,context);const api=context.window.test,all=context.window.WIZARDRY_ARENA_TEST,card=id=>[...all.cards,...all.testCards].find(c=>c.id===id);
 const unit=(id,team)=>({id,team,index:0,name:id,hp:2000,maxHp:2000,mana:10,hand:[],drawPile:[],discardPile:[],statuses:[],x:team?800:200,y:450});
 const x=unit('x',0),y=unit('y',1),s={units:[x,y],mode:'tester',round:1,phase:'resolving',plans:{},sequence:[],queueAt:0,auras:{},log:[],flashes:[]};api.set(s);
 const cast=(id)=>{const c=card(id);api.applySpell({card:c,source:'y',target:'y',action:{casterId:'y',targetId:'y'},runeResult:'success'});};
 const hit=n=>api.damage(x,y,n,{school:'water',id:'test'},{damageVariant:1,runeResult:'success'});
 const wall=()=>y.statuses.find(st=>st.kind==='faultline_bulwark');
 cast('faultlinebulwark');hit(70);assert.equal(wall().value,330);assert.equal(y.hp,2000);assert.equal(x.hp,2000);
 cast('petrify');assert.equal(api.barrierConflict(y,'bubble_shield'),undefined);cast('bubbleshield');assert.ok(y.statuses.some(st=>st.kind==='bubble_shield'));assert.equal(api.barrierConflict(y,'reflective_ice').kind,'bubble_shield');
 hit(100);assert.equal(wall().value,230);assert.equal(y.statuses.find(st=>st.kind==='bubble_shield').value,360);assert.equal(y.hp,2000);
 hit(700);assert.equal(wall(),undefined);assert.equal(x.hp,1850);assert.equal(y.hp,2000);assert.ok(!y.statuses.some(st=>st.kind==='bubble_shield'));assert.ok(y.statuses.some(st=>st.kind==='petrify'));
 hit(70);assert.equal(x.hp,1850);assert.equal(y.hp,2000);
}
