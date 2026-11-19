const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const node = {getContext:()=>({})};
const rolls = [.10,.20,.05,.05];
const math = Object.create(Math);
math.random = () => rolls.shift();
const context = {window:{},Math:math,Image:class {},document:{getElementById:()=>node},requestAnimationFrame(){}};
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  paintUI=()=>{};window.stoneTest={set:s=>state=s,sticksAndStonesTargets,updateCastSequence};'
),context);
const api = context.window.WIZARDRY_ARENA_TEST;
const {set,sticksAndStonesTargets,updateCastSequence} = context.window.stoneTest;
const card = api.cards.find(c=>c.id==='sticksandstones');
assert.equal(card.target,'all_enemies');

const unit = (id,team) => ({id,name:id,team,x:team?760:240,y:450,hp:1000,maxHp:1000,statuses:[]});
const caster = unit('caster',0);
const ally = unit('ally',0);
const enemies = Array.from({length:4},(_,i)=>unit('enemy'+i,1));
const state = {phase:'resolving',round:1,units:[caster,ally,...enemies],auras:[null,null],log:[],flashes:[]};
set(state);
for(let living=1;living<=4;living++){
  enemies.forEach((enemy,i)=>{enemy.hp=i<living?1000:0;});
  assert.equal(sticksAndStonesTargets(caster).length,living);
}
assert.equal(sticksAndStonesTargets(enemies[0]).length,2);
const targets = sticksAndStonesTargets(caster);
const animation = {card,source:caster.id,stage:'summon',runeResult:'success',elapsed:0,duration:4500,stoneTargets:targets};
state.animation=animation;
enemies[3].statuses.push({kind:'wind_dome',value:1});
for(const [index,entry] of targets.entries()){
  updateCastSequence(entry.hitAt-animation.elapsed-1);
  assert.equal(enemies[index].hp,1000);
  updateCastSequence(1);
  assert.equal(enemies[index].hp,index===3?1000:680);
  updateCastSequence(1);
  assert.equal(enemies[index].hp,index===3?1000:680);
}
assert.equal(enemies[0].statuses[0].school,'wind');
assert.equal(enemies[0].statuses[0].kind,'decay_mark');
assert.equal(enemies[0].statuses[0].value,.20);
assert.equal(enemies[1].statuses.length,0);
assert.equal(enemies[2].statuses[0].kind,'decay_mark');
assert.equal(enemies[3].statuses.length,0);
assert.equal(ally.hp,1000);
assert.equal(rolls.length,1,'Wind Dome prevents the on-hit roll');

const effects = {window:{},Image:class {naturalWidth=1024}};
vm.runInNewContext(fs.readFileSync('assets/sticks-and-stones.js','utf8'),effects);
const {actor,stone} = effects.window.SticksAndStones;
for(const dir of [-1,1]){
  const calls=[],positions=[];
  const canvas=new Proxy({globalAlpha:1,translate(x,y){positions.push([x,y]);},drawImage(...args){calls.push(args)}},{get:(o,k)=>o[k]??(()=>{})});
  const opts={x:500-dir*104,y:510,dir,duration:4300,entries:targets,elapsed:600};
  actor(canvas,opts);
  assert.equal(calls.length,2,'cloud and rider use separate sprites');
  opts.elapsed=targets[0].swingAt-100;
  positions.length=0;
  targets.forEach((entry,index)=>stone(canvas,{...opts,entry,index}));
  const lowestY=positions[0][1];
  positions.forEach(([x,y],index)=>{
    assert.equal(x,opts.x+dir*94,'stones share a vertical column');
    assert.ok(Math.abs(lowestY-y-index*62)<.001,'the falling column keeps even gaps');
  });
  opts.elapsed=targets[0].swingAt;
  actor(canvas,opts);
  assert.equal(calls.at(-1)[1],2*256,'uses the contact pose');
  stone(canvas,{...opts,entry:targets[0],index:0});
  assert.equal(calls.at(-1)[2],4*256,'boulder draws from the effects row');
  assert.deepEqual(positions.at(-1),[opts.x+dir*94,opts.y-106],'the stone meets the bat at contact');
}
console.log('Sticks and Stones: 1–4 targets, staggered 320 damage, independent Wind runes, Wind Dome, and mirrored sprite cues passed.');
