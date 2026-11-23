const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const math=Object.create(Math),node={getContext:()=>({})},ctx={window:{},Math:math,Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  paintUI=()=>{};'),ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST;
function battle(){api.startPractice(2);return api.getState();}
// Failed accuracy and dead targets preserve mana and never heal through a rod.
for(const success of [false,true]){const s=battle(),u=s.units[0],ally=s.units[1],enemy=s.units[2];u.mana=16;ally.hp=50;api.applyLightningRod(ally);s.phase='resolving';s.sequence=[{casterId:u.id,cardId:'volt',targetId:enemy.id}];s.queueAt=0;api.startNextAction();assert.equal(u.mana,16);s.animation.stage='tracing-auto';math.random=()=>success?0:.999;api.resolveAutoRune();assert.equal(u.mana,success?13:16);assert.equal(ally.hp,50);}
{const s=battle(),u=s.units[0],ally=s.units[1],enemy=s.units[2];u.mana=16;enemy.hp=0;ally.hp=50;api.applyLightningRod(ally);s.phase='resolving';s.sequence=[{casterId:u.id,cardId:'volt',targetId:enemy.id}];s.queueAt=0;api.startNextAction();assert.equal(ally.hp,50);assert.equal(u.mana,17);}
// Discard is optional, once per round, goes to draw-pile bottom, no immediate draw.
{const s=battle(),u=s.units[0];u.hand=['croc','shark','winddome','ronin','calming'];u.drawPile=['poseidon','wind'];u.discardPile=[];assert.equal(api.discardFromHand(u,'croc'),true);assert.equal(u.hand.length,4);assert.deepEqual(Array.from(u.drawPile),['poseidon','wind','croc']);assert.equal(api.discardFromHand(u,'shark'),false);api.drawCard(u);assert.equal(u.hand.length,5);assert.equal(u.hand[4],'poseidon');api.drawCard(u);assert.equal(u.hand.length,5);s.round++;assert.equal(api.discardFromHand(u,'shark'),true);}
// Consecutive voluntary passes award 2,3,4; casting resets; cap/idempotence.
{const s=battle(),u=s.units[0];u.mana=0;u.maxMana=16;for(let r=2;r<=4;r++){u.passedRound=r-1;s.round=r;const before=u.mana;api.grantTurnMana();assert.equal(u.mana-before,r);api.grantTurnMana();assert.equal(u.mana-before,r);}s.round=5;let before=u.mana;api.grantTurnMana();assert.equal(u.mana-before,1);assert.equal(u.passStreak,0);s.round=6;u.passedRound=5;before=u.mana;api.grantTurnMana();assert.equal(u.mana-before,2);u.mana=15;u.passedRound=6;s.round=7;api.grantTurnMana();assert.equal(u.mana,16);}
// A guest can combine discard + pass or discard + cast; forged double discard rejects.
ctx.window.WizardrySession={active:true,isHost:true,peerId:'host'};
const B=ctx.window.WizardryBuilds,p=B.cpu(api.cards,4);p.masteries=['water','wind'];p.deck=B.makeDeck(api.cards,p.masteries);
for(const pass of [true,false]){api.startLobby([{peerId:'host',profile:p,team:0,slot:0},{peerId:'guest',profile:p,team:1,slot:0}],1);const s=api.getState(),u=s.units[1],target=s.units[0];u.hand=['croc','shark'];u.mana=16;const bottom=u.drawPile.length;assert.equal(api.submitRemotePlan('guest',{round:1,discardId:'shark',...(pass?{pass:true}:{cardId:'croc',targetId:target.id})}),true);assert.equal(u.drawPile[bottom],'shark');assert.equal(u.hand.includes('shark'),false);assert.equal(u.hand.includes('croc'),pass);}
console.log('Turn economy: successful-cast mana and hit-timed Rod healing, misses/dead targets, discard placement/limit, single draw, pass streak/reset/cap and online discard+action passed.');

ctx.window.WizardrySession=null;
{
 const s=battle(),u=s.units[0],enemy=s.units[2];
 u.mana=8;enemy.statuses=['burn','frostbite','turbulence','static_shock'].map(kind=>({kind,value:1}));
 s.phase='resolving';s.sequence=[{casterId:u.id,cardId:'turbulence',targetId:enemy.id}];s.queueAt=0;
 api.startNextAction();s.animation.stage='tracing-auto';math.random=()=>0;
 assert.equal(api.resolveAutoRune(),false,'a debuff cast fizzles against four runes');
 assert.match(s.log[0],/four debuff runes/);
 assert.equal(u.mana,8);assert.equal(u.passedRound,s.round);
 api.advanceBackground(3000);
 assert.equal(u.mana,10,'a fizzle earns the skip mana bonus');
}
{
 const s=battle(),u=s.units[0],enemy=s.units[2];
 s.phase='resolving';s.sequence=[{casterId:u.id,pass:true},{casterId:enemy.id,cardId:'volt',targetId:u.id}];s.queueAt=0;
 api.startNextAction();assert.equal(s.skipCue.source,u.id);assert.equal(s.animation,null);
 api.advanceBackground(800);assert.equal(s.skipCue.source,u.id);
 api.advanceBackground(120);assert.equal(s.skipCue,null);assert.equal(s.animation.source,enemy.id);
}
{
 const u=battle().units[0];
 u.hand=['croc','calming'];u.drawPile=['poseidon'];u.discardPile=['shark','winddome','ronin'];
 api.drawCard(u);
 assert.deepEqual([...u.hand],['croc','calming','poseidon']);
 assert.deepEqual([...u.drawPile].sort(),['ronin','shark','winddome']);
 assert.equal(u.discardPile.length,0);
}
{
 const s=battle(),u=s.units[0],enemy=s.units[2];
 const spell=(id,source,target)=>({card:api.cards.find(card=>card.id===id),source:source.id,target:target.id,action:{casterId:source.id,targetId:target.id},runeResult:'success',damageVariant:1,burnRoll:0});
 api.applySpell(spell('bubbleshield',enemy,enemy));
 api.applySpell(spell('winddome',enemy,enemy));
 const bubble=enemy.statuses.find(rune=>rune.kind==='bubble_shield');
 assert.ok(bubble&&enemy.statuses.some(rune=>rune.kind==='wind_dome'));
 const hp=enemy.hp,shieldHp=bubble.value;
 api.applySpell(spell('scaldingair',u,enemy));
 assert.equal(enemy.hp,hp);assert.equal(bubble.value,shieldHp);
 assert.ok(!enemy.statuses.some(rune=>rune.kind==='wind_dome'));
 api.applySpell(spell('scaldingair',u,enemy));assert.ok(bubble.value<shieldHp);
 enemy.statuses=['poison','frostbite','turbulence','static_shock'].map(kind=>({kind,value:1}));
 assert.equal(api.addStatus(enemy,'wind_dome',null,1),false);
 assert.equal(api.addStatus(enemy,'bubble_shield',null,360),false);
 api.applySpell(spell('scaldingair',u,enemy));
 assert.ok(enemy.hp<hp);assert.ok(!enemy.statuses.some(rune=>rune.kind==='burn'));
}
for(const [first,second,priority] of [
 ['winddome','sandwarrior',1],['sandwarrior','winddome',1],
 ['bubbleshield','reflectiveice',2],['reflectiveice','bubbleshield',2]
]){
 const s=battle(),caster=s.units[0],ally=s.units[1];
 const existing=api.cards.find(card=>card.id===first);
 const incoming=api.cards.find(card=>card.id===second);
 const cast=card=>({card,source:caster.id,target:ally.id,action:{casterId:caster.id,targetId:ally.id},runeResult:'success'});
 api.applySpell(cast(existing));
 caster.hand=[second];
 api.chooseCard(second);
 api.selectTarget(ally.id);
 assert.equal(s.selectedTarget,null);
 assert.ok(s.barrierNotice.includes(existing.name));
 assert.ok(s.barrierNotice.includes(incoming.name));
 assert.ok(s.barrierNotice.includes('priority '+priority));
 api.selectTarget(caster.id);
 assert.equal(s.selectedTarget,caster.id);
 assert.equal(s.barrierNotice,null);
 s.phase='resolving';
 s.animation={...cast(incoming),stage:'tracing-auto'};
 assert.equal(api.resolveAutoRune(),false);
 assert.match(s.log[0],/priority [12] shields/);
 api.applySpell(cast(incoming));
 assert.equal(ally.statuses.length,1);
}
for(const [first,second] of [['bubbleshield','sandwarrior'],['reflectiveice','sandwarrior'],['reflectiveice','winddome']]){
 const s=battle(),attacker=s.units[0],defender=s.units[2];
 const cast=(id,source)=>api.applySpell({
   card:api.cards.find(card=>card.id===id),source:source.id,target:defender.id,
   action:{casterId:source.id,targetId:defender.id},runeResult:'success',damageVariant:1
 });
 cast(first,defender);
 cast(second,defender);
 assert.equal(defender.statuses.length,2);
 const hp=defender.hp;
 const shield=defender.statuses[0],value=shield.value;
 cast('devil',attacker);
 assert.equal(defender.hp,hp);
 assert.equal(defender.statuses.length,1);
 assert.equal(defender.statuses[0],shield);
 assert.equal(shield.value,value);
 if(second==='sandwarrior'){
   cast(second,defender);
   cast('croc',attacker);
   assert.equal(defender.hp,hp-(first==='bubbleshield'?190:275));
   assert.equal(defender.statuses.length,0);
 }
}
console.log('Battle updates: skip timing, fizzle regeneration, immediate deck recycling, four-debuff cap, and stacked barrier priority passed.');
