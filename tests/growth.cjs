const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const node = {getContext: () => ({})};
const ctx = {window: {}, requestAnimationFrame() {}, Image: class {}, document: {getElementById: () => node}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js', 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync('arena.js', 'utf8').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  window.setupGrowthTest=s=>state=s;window.damageForTest=damage;window.healForTest=restoreHp;paintUI=()=>{};'
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

const lifevine=card('lifevine');
assert.equal(lifevine.cost,5);
assert.equal(lifevine.accuracy,1);
assert.deepEqual(JSON.parse(JSON.stringify(lifevine)),
  JSON.parse(fs.readFileSync('backend/cards.json','utf8')).find(spell=>spell.id===lifevine.id));
{
  const a=unit('a',0),b=unit('b',0),d=unit('d',0),foe=unit('foe',1);
  a.hp=980;
  b.hp=500;
  const s={phase:'resolving',round:1,units:[a,b,d,foe],log:[],flashes:[]};
  ctx.window.setupGrowthTest(s);
  const castLink=(source,target)=>api.applySpell({card:lifevine,runeResult:'success',
    action:{casterId:source.id,targetId:target.id}});
  castLink(a,a);
  castLink(a,foe);
  assert.ok(!has(a,'lifevine'));
  castLink(a,b);
  assert.equal(a.statuses.at(-1).expiresRound,4);
  ctx.window.healForTest(b,a,20);
  assert.equal(a.hp,1000);
  assert.equal(b.hp,506);
  a.hp=999;
  ctx.window.healForTest(a,b,103);
  assert.equal(a.hp,1000);
  assert.equal(b.hp,609,'shared healing does not bounce back');
  castLink(a,d);
  assert.ok(!has(b,'lifevine'));
  a.hp=400;d.hp=200;
  s.round=3;
  ctx.window.healForTest(a,d,100);
  assert.equal(a.hp,430);
  s.round=4;
  ctx.window.healForTest(a,d,100);
  assert.equal(a.hp,430,'expires before round four heals');
  api.consumeStatus(a,'lifevine');
  assert.ok(!has(d,'lifevine'),'the partner rune is removed with the original');
}
vm.runInNewContext(fs.readFileSync('assets/lifevine.js','utf8'),ctx);
const start={x:100,y:460,hp:100},end={x:500,y:280,hp:100};
const blocker={x:300,y:380,hp:100};
const route=ctx.window.Lifevine.route(start,end,[start,blocker,end]);
assert.ok(route.length>2);
for(let i=1;i<route.length;i++)for(let k=0;k<=100;k++){
 const a=route[i-1],b=route[i],t=k/100,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
 assert.ok(!(x>blocker.x-62&&x<blocker.x+62&&y>blocker.y-145&&y<blocker.y+18),'vine stays clear of the intervening wizard');
}
api.startCardTester(2);
const testState=api.getState();
assert.ok(testState.units[0].hand.includes(lifevine.id));
api.chooseCard(lifevine.id);
assert.equal(testState.selectedTarget,testState.units[1].id);
console.log('Lifevine: ally-only targeting, actual HP sharing, both directions, missing-HP cap, expiration, relinking and obstacle routing passed.');
