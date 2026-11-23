const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const node = {getContext: () => ({})};
const ctx = {window: {}, requestAnimationFrame() {}, Image: class {}, document: {getElementById: () => node}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js', 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync('arena.js', 'utf8').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  window.setupGrowthTest=s=>state=s;window.damageForTest=damage;paintUI=()=>{};'
), ctx);

const api = ctx.window.WIZARDRY_ARENA_TEST;
const card = id => api.cards.find(spell => spell.id === id);
const unit = (id, team) => ({id, name:id, team, hp:1000, maxHp:1000, statuses:[]});
const caster = unit('caster', 0);
const ally = unit('ally', 0);
const enemy = unit('enemy', 1);
const otherEnemy = unit('otherEnemy', 1);
ctx.window.setupGrowthTest({
  phase:'resolving', round:1, units:[caster,ally,enemy,otherEnemy],
  auras:[null,null], log:[], flashes:[]
});
const cast = (id,target=ally,runeResult='success') => api.applySpell({
  action:{casterId:caster.id,targetId:target.id},card:card(id),runeResult
});
const has = (unit,kind) => unit.statuses.some(rune=>rune.kind===kind);
const damage = (source,target,base,card,spell) => {
  spell.damageVariant=1;
  return ctx.window.damageForTest(source,target,base,card,spell);
};

for(const [id,rune] of [
  ['growth','growth'],['solidity','solidity'],['rage','blazing_rage'],
  ['winddome','wind_dome'],['electricalcharge','electrical_charge'],
  ['ragingwaters','raging_waters'],['flowstate','flow_state']
]){
  assert.equal(card(id).target,'ally');
  assert.ok(!card(id).selfOnly);
  cast(id,enemy);
  assert.ok(!has(enemy,rune));
  cast(id);
  assert.ok(has(ally,rune));
  assert.ok(!has(caster,rune));
  ally.statuses.length=0;
}

assert.ok(api.cards.some(spell=>spell.id==='growth'));
cast('growth',ally,'failed');
assert.ok(!has(ally,'growth'));
cast('growth');
cast('growth');
assert.equal(ally.statuses.length,1);
assert.equal(ally.statuses[0].school,'nature');
const nature = card('bloom');
assert.equal(damage(ally,enemy,100,card('golem'),{}),100);
assert.equal(damage(caster,enemy,100,nature,{}),100);
assert.ok(has(ally,'growth'));
enemy.statuses.push({kind:'wind_dome',value:1});
assert.equal(damage(ally,enemy,100,nature,{}),0);
assert.ok(has(ally,'growth'));
const spell = {card:nature};
assert.equal(damage(ally,enemy,100,nature,spell),125);
assert.equal(damage(ally,enemy,100,nature,spell),125);
assert.equal(damage(ally,otherEnemy,100,nature,spell),125);
assert.ok(!has(ally,'growth'));
assert.equal(damage(ally,enemy,100,nature,{}),100);
cast('growth',caster);
assert.ok(has(caster,'growth'));
cast('estel',ally);
assert.ok(has(caster,'growth'),'a full-health target does not spend Growth');
ally.hp=50;
cast('healingaura');
assert.ok(has(caster,'growth'),'healing rune application preserves Growth');
assert.equal(ally.statuses.find(st=>st.kind==='healing_aura').value,200);
cast('estel',ally,'failed');
assert.equal(ally.hp,50);
assert.ok(has(caster,'growth'));
cast('estel',ally);
assert.equal(ally.hp,987,'750 direct Nature healing boosted to 937');
assert.ok(!has(caster,'growth'));
assert.equal(ally.statuses.find(st=>st.kind==='healing_aura').value,200);
console.log('Growth: self and ally targeting, one charge, blocked hits preserve it, full next Nature cast boosted.');

const briar=card('briarremedy');
assert.equal(briar.cost,3);
assert.equal(briar.accuracy,1);
assert.deepEqual(JSON.parse(JSON.stringify(briar)),
  JSON.parse(fs.readFileSync('backend/cards.json','utf8')).find(spell=>spell.id===briar.id));
for(const {effects,missing,expected,sealed=false,targetId='ally'} of [
  {effects:['burn','poison','frostbite'],missing:400,expected:300},
  {effects:['burn','frostbite'],missing:400,expected:200,targetId:'caster'},
  {effects:['poison'],missing:35,expected:35},
  {effects:[],missing:400,expected:0},
  {effects:['burn'],missing:400,expected:0,sealed:true},
  {effects:['burn'],missing:400,expected:0,targetId:'enemy'}
]){
  const target=unit(targetId,targetId==='enemy'?1:0);
  const druid=targetId==='caster'?target:unit('caster',0);
  target.hp-=missing;
  target.statuses=[...effects.map(kind=>({kind,remaining:3,extreme:kind==='burn'})),{kind:'curse',remaining:3}];
  const action={card:briar,source:druid.id,target:target.id,runeResult:'success',stage:'summon',
    duration:briar.duration,elapsed:0,action:{casterId:druid.id,targetId:target.id}};
  ctx.window.setupGrowthTest({phase:'resolving',round:1,units:target===druid?[druid,enemy]:[druid,target],
    log:[],flashes:[],animation:action,environment:sealed?{id:'darkgrounds'}:null});
  api.advanceAction(briar.duration*briar.hit);
  assert.equal(target.hp,target.maxHp-missing);
  assert.equal(target.statuses.length,target.team===0?1:effects.length+1);
  assert.ok(has(target,'curse'));
  api.advanceAction(briar.duration*(briar.healAt-briar.hit)+1);
  api.advanceAction(1);
  assert.equal(target.hp,target.maxHp-missing+expected);
}
api.startCardTester();
assert.ok(api.getState().units[0].hand.includes(briar.id));
console.log('Briar Remedy: targeted cleanse, capped healing, full three-effect combo, self-cast, enemy rejection and Dark Grounds passed.');
