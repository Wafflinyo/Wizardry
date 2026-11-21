const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const node = {getContext:()=>({})};
const context = {window:{},Image:class {},document:{getElementById:()=>node},requestAnimationFrame(){}};
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  paintUI=()=>{};window.ballTest={set:s=>state=s,updateCastSequence};'
),context);
const {set,updateCastSequence} = context.window.ballTest;
const card = context.window.WIZARDRY_ARENA_TEST.cards.find(c=>c.id==='lightningball');
const unit = (id,team,x) => ({id,name:id,team,x,y:450,hp:1000,statuses:[]});

for(const [rolls,expected] of [[[.9],1],[[.1,.9],2],[[.1,.1],3]]){
  const caster=unit('caster',0,240);
  const enemies=[unit('first',1,670),unit('second',1,760),unit('third',1,850)];
  const animation={card,source:caster.id,target:enemies[0].id,stage:'summon',runeResult:'success',
    elapsed:0,duration:card.duration,bounceRolls:rolls};
  set({phase:'resolving',round:1,units:[caster,...enemies],auras:[null,null],log:[],flashes:[],animation});
  for(let index=0;index<expected;index++){
    const arrive=Math.ceil((card.hit+index*.145)*card.duration);
    updateCastSequence(arrive-animation.elapsed-1);
    assert.equal(enemies[index].hp,1000,'no damage in flight');
    updateCastSequence(1);
    assert.equal(enemies[index].hp,1000-[315,283,254][index],'damage lands on arrival');
    assert.equal(animation.lightningBallHits.filter(entry=>entry.done).length,index+1);
  }
  updateCastSequence(600);
  assert.equal(animation.lightningBallHits.length,expected,'a failed bounce adds no leg');
  assert.equal(animation.lightningBallHits.at(-1).id,enemies[expected-1].id);
  assert.ok(enemies.slice(expected).every(enemy=>enemy.hp===1000));
}
console.log('Lightning Ball: each bounce hits on arrival and failed bounces stop at the last target.');
