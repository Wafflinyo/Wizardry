const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const node = {getContext: () => ({})};
const ctx = {window: {}, requestAnimationFrame() {}, Image: class {}, document: {getElementById: () => node}};
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
const damage = ctx.window.damageForTest;

for(const [id,rune] of [
  ['growth','growth'],['solidity','solidity'],['rage','blazing_rage'],
  ['winddome','wind_dome'],['electricalcharge','electrical_charge'],
  ['rod','lightning_rod'],['ragingwaters','raging_waters'],['flowstate','flow_state']
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

assert.equal(api.featuredCard,'growth');
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
console.log('Growth: self and ally targeting, one charge, blocked hits preserve it, full next Nature cast boosted.');
