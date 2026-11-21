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
