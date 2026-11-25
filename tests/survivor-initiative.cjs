const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const node={getContext:()=>({})},ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  paintUI=()=>{};'),ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST,B=ctx.window.WizardryBuilds;
api.startPractice(4);let s=api.getState();s.units.find(u=>u.id==='e1').hp=0;
assert.deepEqual(api.turnOrder(1).map(u=>u.id),['a0','e0','a1','e2','a2','e3','a3']);
assert.deepEqual(api.turnOrder(2).map(u=>u.id),['e0','a1','e2','a2','e3','a3','a0']);
api.startPractice(4);s=api.getState();s.sequence=Object.freeze(api.turnOrder(1).map(u=>Object.freeze({casterId:u.id,team:u.team,targetId:'unchanged-'+u.id})));s.queueAt=3;s.units.find(u=>u.id==='e1').hp=0;
api.rebalanceRemainingActions();assert.deepEqual(s.sequence.map(p=>p.casterId),['a0','e0','a1','e2','a2','e3','a3']);assert.ok(s.sequence.every(p=>p.targetId==='unchanged-'+p.casterId&&Object.isFrozen(p)));assert.ok(Object.isFrozen(s.sequence));
let checks=0;for(let mask=1;mask<256;mask++){api.startPractice(4);s=api.getState();s.units.forEach((u,i)=>{if(!(mask&(1<<i)))u.hp=0;});for(let round=1;round<=8;round++){const order=api.turnOrder(round);assert.equal(order.length,s.units.filter(u=>u.hp>0).length);assert.equal(new Set(order.map(u=>u.id)).size,order.length);for(let i=1;i<order.length;i++)if(order[i].team===order[i-1].team)assert.ok(!order.slice(i).some(u=>u.team!==order[i].team));checks++;}}
const p=B.cpu(api.cards,0,Math.random,1);p.deck=B.progressionDeck(api.cards,p.masteries,1);api.startLobby([{peerId:'a',team:0,slot:0,profile:p},{peerId:'b',team:1,slot:0,profile:B.cpu(api.cards,1)}],1);
assert.equal(api.getState().units[0].level,1);assert.equal(api.getState().units[0].maxHp,B.stats(p).hp);assert.equal(api.getState().units[1].level,20);console.log('Mixed-level lobby and '+checks+' initiative permutations passed.');