const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const node={getContext:()=>({})},ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  paintUI=()=>{};'),ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST,ids=api.testFireCards.map(c=>c.id);
assert.equal(api.cards.length,120);assert.ok(ids.every(id=>!api.cards.some(c=>c.id===id)));
api.startCardTester(2);let s=api.getState(),c=s.units[0],t=s.units.find(u=>u.id==='e0'),n=s.units.find(u=>u.id==='e1');
assert.deepEqual(c.hand,ids);c.skills={};c.hp=c.maxHp;t.hp=t.maxHp=10000;n.hp=n.maxHp=10000;
const cast=(id)=>{const card=api.testFireCards.find(c=>c.id===id);return {card,source:c.id,target:t.id,action:{casterId:c.id,targetId:t.id},runeResult:'success',damageVariant:1}};
let a=cast('hellhound');for(let i=0;i<3;i++){assert.ok(api.applyHellhoundHit(a,i,.99));assert.equal(t.hp,10000-(i+1)*160);assert.equal(api.applyHellhoundHit(a,i,.99),false);}
a=cast('ringoffire');api.applySpell(a);assert.ok(t.statuses.some(st=>st.kind==='ring_of_fire'));const hp=t.hp;api.restoreHp(t,t,200);assert.equal(t.hp,hp+100);
t.statuses.push({kind:'burn',value:100,remaining:2,extreme:true,school:'fire',sourceId:c.id});a=cast('backdraft');api.applySpell(a);const spread=n.statuses.find(st=>st.kind==='burn');assert.equal(spread.remaining,2);assert.equal(spread.value,100);assert.equal(spread.extreme,true);
api.addStatus(t,'wind_dome',null,1,'wind');api.addStatus(t,'bubble_shield',null,360,'water');const before=t.hp;a=cast('infernaltitan');api.applySpell(a);assert.equal(t.hp,before-440);assert.ok(!t.statuses.some(st=>st.kind==='wind_dome'||st.kind==='bubble_shield'));
a=cast('furnace');api.applySpell(a);assert.equal(s.environment.id,'furnace');assert.equal(s.environment.expiresRound,s.round+5);assert.equal(api.fireBurnChance(api.testFireCards[0]),.25);
api.startPractice(4);s=api.getState();assert.ok(s.units.every(u=>[...u.hand,...u.drawPile].every(id=>!ids.includes(id))));console.log('Five test-only Fire spells: opening hand, three timed hits, healing punishment, exact Burn spread, barrier priority and Furnace passed.');