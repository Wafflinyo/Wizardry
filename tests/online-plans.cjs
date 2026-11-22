const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const node={getContext:()=>({})},ctx={window:{WizardrySession:{active:true,isHost:true,peerId:'host'}},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{}};vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  paintUI=()=>{}; window.playbackTest={acceptGuestPlayback,guestAnimationAt};'),ctx);const api=ctx.window.WIZARDRY_ARENA_TEST,B=ctx.window.WizardryBuilds;
const profile=B.normalize({name:'Test Wizard',level:20,masteries:['wind','earth'],skills:{dark:20},deck:B.makeDeck([api.cards.find(card=>card.id==="zen"),...api.cards.filter(card=>card.id!=="zen").reverse()],['wind','earth'],()=>.99)},api.cards);
api.startLobby([{peerId:'host',profile,team:1,slot:1},{peerId:'guest',profile:{...profile,name:'Guest'},team:0,slot:0},{peerId:'cpu-1',isCpu:true,profile:B.cpu(api.cards,2),team:0,slot:1},{peerId:'cpu-2',isCpu:true,profile:B.cpu(api.cards,3),team:1,slot:0}],2);let s=api.getState();const host=s.units.find(u=>u.peerId==='host'),guest=s.units.find(u=>u.peerId==='guest');assert.equal(s.size,2);assert.equal(s.units.length,4);assert.equal(s.units.filter(u=>u.isHuman).length,2);assert.equal(s.planningSide,1);for(const wizard of [host,guest]){
  assert.ok(wizard.hand.every(id=>wizard.masteries.includes(api.cards.find(card=>card.id===id).school)));
  if(!wizard.hand.includes('zen')){
    const index=wizard.drawPile.indexOf('zen');
    assert.notEqual(index,-1);
    [wizard.hand[1],wizard.drawPile[index]]=[wizard.drawPile[index],wizard.hand[1]];
  }
}
host.statuses.push({kind:'trap',value:.25});guest.statuses.push({kind:'trap',value:.25});assert.ok(host.hand.includes('zen'));assert.ok(guest.hand.includes('zen'));assert.equal(host.maxHp,2000);assert.equal(host.maxMana,20);
assert.equal(api.submitRemotePlan('spoof',{pass:true,round:1}),false);assert.equal(api.submitRemotePlan('guest',{cardId:'reaper',targetId:guest.id,round:1}),false);assert.equal(api.submitRemotePlan('guest',{pass:true,round:999}),false);
assert.equal(api.submitRemotePlan('host',{cardId:'zen',runeKind:'trap',targetId:guest.id,round:1}),false);
assert.equal(api.submitRemotePlan('host',{cardId:'zen',runeKind:'trap',targetId:host.id,round:1}),true);assert.equal(s.phase,'planning','host waits for remaining human');assert.equal(api.submitRemotePlan('host',{pass:true,round:1}),false);assert.equal(api.submitRemotePlan('guest',{cardId:'zen',runeKind:'trap',targetId:guest.id,round:1}),true);assert.equal(s.phase,'resolving');assert.equal(s.sequence.length,4);assert.ok(s.animation);assert.ok(s.units.every(u=>[...u.hand,...u.drawPile,...u.discardPile].every(id=>u.masteries.includes(api.cards.find(c=>c.id===id).school))));
for(const u of s.units)u.hp=u.maxHp=50000;api.advanceBackground(30000);api.advanceBackground(30000);assert.equal(s.round,2);assert.equal(s.phase,'planning');
console.log('Online host: flexible teams/seats, restricted human/CPU decks, newest test spell, forged/illegal/stale/duplicate plans rejected, wait-for-all-human lock-in and four-unit resolution passed.');

const playback=ctx.window.playbackTest;
const cast={card:{id:'blazingembers'},source:'a0',elapsed:0,duration:400};
const clip=(key,time,duration)=>({key,time,animation:{...cast,stage:key,duration}});
const clips=[clip('raising',0,400),clip('rune-success',400,180),clip('summon',580,1000)];
playback.acceptGuestPlayback({id:'delayed',time:650,clips},1000);
const observed=new Set();
let previous=-1;
for(let now=1000;now<=1700;now+=16){
  // No packet arrived during the short rune-success stage.
  if(now===1320)playback.acceptGuestPlayback({id:'delayed',time:925,clips},now);
  const animation=playback.guestAnimationAt(now,16);
  assert.ok(animation);
  if(observed.has(animation.stage)&&animation.stage==='summon')assert.ok(animation.elapsed>=previous);
  observed.add(animation.stage);
  if(animation.stage==='summon')previous=animation.elapsed;
}
assert.deepEqual([...observed],['raising','rune-success','summon']);
const before=playback.guestAnimationAt(1700,0).elapsed;
playback.acceptGuestPlayback({id:'delayed',time:860,clips},1700);
assert.equal(playback.guestAnimationAt(1700,0).elapsed,before);
console.log('Guest playback preserved an unpolled rune stage and ignored late packets without rewinding.');
