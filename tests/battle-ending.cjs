const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  window.test={set:s=>state=s,updateCastSequence};paintUI=()=>{};');const node={getContext:()=>({})},ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{},console};vm.runInNewContext(code,ctx);const api=ctx.window.WIZARDRY_ARENA_TEST,test=ctx.window.test;
const unit=(id,team,hp)=>({id,team,index:0,name:id,hp,maxHp:2000,mana:10,statuses:[],hand:[],drawPile:[],discardPile:[],x:team?800:200,y:450,armRaise:0});
function battle(id,team=0){const card=api.cards.find(c=>c.id===id),source=unit('a',team,2000),target=unit('b',1-team,50),action={casterId:'a',targetId:'b',cardId:id};const animation={card,action,source:'a',target:'b',stage:id==='ronin'?'ronin-volley':'summon',duration:id==='ronin'?760:card.duration,elapsed:0,runeResult:'success',applied:false};const s={units:[source,target],phase:'resolving',round:1,animation,plans:{},sequence:[{casterId:'b',targetId:'a',cardId:'devil'}],queueAt:0,humanByTeam:{0:team===0?'a':'b'},auras:{},log:[],flashes:[]};test.set(s);return s;}
for(const id of ['ronin','windfist','jack'])for(const team of [0,1]){
 const s=battle(id,team),original=s.animation,stages=new Set();let sawLethal=false;
 for(let i=0;i<300&&s.phase==='resolving';i++){
  stages.add(s.animation?.stage);test.updateCastSequence(40);
  if(s.units[1].hp===0&&s.animation){sawLethal=true;assert.equal(api.checkBattleEnd(),false);assert.equal(s.animation,original);assert.equal(s.phase,'resolving');api.updateBattleEnding(5000);assert.equal(s.phase,'resolving');}
  else api.checkBattleEnd();
 }
 assert.ok(sawLethal);assert.equal(s.phase,'ending');assert.equal(s.winner,team);assert.equal(s.animation,null);assert.equal(s.sequence.length,0,'no later queued spell begins');assert.ok(stages.has('lowering'));
 if(id==='ronin'){assert.ok(stages.has('ronin-finish'));assert.ok(stages.has('ronin-exit'));assert.equal(original.slashHits.length,3,'all three slash events play after the first lethal hit');}
 api.updateBattleEnding(5000);assert.equal(s.phase,'ending','still waits for final defeat pose');s.units[1].defeatElapsedMs=api.defeatHoldMs;api.updateBattleEnding(499);assert.equal(s.phase,'ending');api.updateBattleEnding(1);assert.equal(s.phase,'finished');
}
const s=battle('jack');s.animation=null;s.units[1].hp=0;assert.equal(api.checkBattleEnd(),true,'damage outside an active spell starts ending immediately');s.phase='resolving';s.units[0].hp=0;assert.equal(api.checkBattleEnd(),true);assert.equal(s.winner,'draw');
console.log('Battle ending: lethal first Wind Slash, Wind Fist and Jack hits preserve full animations for either team; all slashes, exit/recovery, no next queued action, defeat completion and 500ms pause passed.');
