const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const node = { getContext: () => ({}) }, math = Object.create(Math);
math.random = () => .5;
const ctx = { window: {}, Math: math, Image: class { naturalWidth=1024; naturalHeight=1024; }, document: { getElementById: () => node }, requestAnimationFrame() {} };
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js', 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync('assets/grill-master.js', 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync('arena.js', 'utf8').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  paintUI=()=>{};window.stepCast=updateCastSequence;'
), ctx);

const api = ctx.window.WIZARDRY_ARENA_TEST, fx = ctx.window.WIZARDRY_GRILL_MASTER;
const card = api.cards.find(c => c.id === 'grillmaster');
const builds = ctx.window.WizardryBuilds;
assert.equal(card.damage, 440);
assert.equal(card.burnChance, .20);
assert.equal(card.hit, fx.HIT);
const masteries = ['fire', 'lightning'];
const deck = builds.makeDeck(api.cards, masteries, () => .99);
const profile = { name: 'Grill Tester', level: 20, masteries, skills: {}, deck };
assert.equal(builds.normalize(profile, JSON.parse(fs.readFileSync('backend/cards.json', 'utf8'))).deck.length, 24);
api.configureProfile(profile);

function setup(){
  api.startPractice(2);
  const state = api.getState(), [caster, ally, target, neighbor] = state.units;
  return {state, caster, ally, target, neighbor};
}

for (const [roll, expected] of [[.199, true], [.20, false]]){
  const { state, caster, target, neighbor } = setup();
  const cast = { card, action: { casterId: caster.id, targetId: target.id }, runeResult: 'success', damageVariant: 1, burnRoll: roll };
  api.applySpell(cast);
  api.applySpell(cast);
  assert.equal(target.hp, target.maxHp - 440, 'one damage event per flamethrower');
  assert.equal(neighbor.hp, neighbor.maxHp, 'single target');
  assert.equal(target.statuses.some(st => st.kind === 'burn'), expected);
  for(let round=2;round<=5;round++){
    state.round=round;
    api.tickBurnsForRound();
  }
  assert.equal(target.hp, target.maxHp - 440 - (expected ? 150 : 0));
  assert.equal(target.statuses.some(st => st.kind === 'burn'), false);
}

const scalding=api.cards.find(c=>c.id==='scaldingair');
for(const [roll,expected] of [[.399,true],[.40,false]]){
  const {state,caster,target,neighbor}=setup();
  const cast={card:scalding,action:{casterId:caster.id,targetId:target.id},
    runeResult:'success',damageVariant:1,burnRoll:roll};
  api.applySpell(cast);
  api.applySpell(cast);
  assert.equal(target.hp,target.maxHp-140);
  assert.equal(neighbor.hp,neighbor.maxHp);
  assert.equal(target.statuses.find(st=>st.kind==='burn')?.extreme,expected?true:undefined);
  for(let round=2;round<=6;round++){
    state.round=round;
    api.tickBurnsForRound();
  }
  assert.equal(target.hp,target.maxHp-140-(expected?500:0));
  assert.equal(target.statuses.some(st=>st.kind==='burn'),false);
}

for(const activeExtreme of [false,true]){
  const {state,caster,target}=setup();
  target.hp=10000;
  const effect={kind:'burn',extreme:activeExtreme,remaining:1,value:73};
  target.statuses=[effect,{kind:'stun'},{kind:'static_shock'},{kind:'boulder_weight'}];
  for(const incomingExtreme of [!activeExtreme,activeExtreme]){
    state.flashes=[];
    const turns=incomingExtreme?5:3;
    api.applySpell({card:{...card,burnTurns:turns,burnDamage:incomingExtreme?100:50},
      action:{casterId:caster.id,targetId:target.id},runeResult:'success',damageVariant:1,burnRoll:0});
    const matches=incomingExtreme===activeExtreme;
    assert.equal(effect.remaining,matches?turns:1);
    assert.equal(effect.value,73);
    assert.equal(target.statuses.length,4);
    assert.equal(state.flashes.some(f=>f.text==='Burn reset • '+turns+' Rounds'),matches);
  }
}

for (const defense of ['wind_dome','poison','miss','ally','lethal']){
  const { caster, ally, target } = setup();
  if(defense==='wind_dome'||defense==='poison')api.addStatus(target,defense,'',1);
  if(defense==='lethal')target.hp=150;
  const victim = defense==='ally' ? ally : target;
  api.applySpell({card,action:{casterId:caster.id,targetId:victim.id},runeResult:defense==='miss'?'failed':'success',damageVariant:1,burnRoll:0});
  assert.equal(victim.statuses.some(st=>st.kind==='burn'),defense==='poison');
  assert.equal(victim.hp,defense==='lethal'?0:defense==='poison'?victim.maxHp-440:victim.maxHp);
}

{
  const {state,caster,target}=setup();
  const anim={stage:'summon',elapsed:0,duration:card.duration,card,runeResult:'success',
    source:caster.id,target:target.id,action:{casterId:caster.id,targetId:target.id},damageVariant:1,burnRoll:0};
  state.phase='resolving';
  state.animation=anim;
  const impact=card.duration*card.hit;
  for(let elapsed=0;elapsed<impact-1;elapsed+=20)ctx.window.stepCast(Math.min(20,impact-1-elapsed));
  assert.equal(target.hp,target.maxHp,'heating and initial fire travel do not damage');
  ctx.window.stepCast(2);
  assert.equal(target.hp,target.maxHp-440,'the regular resolver hits when the fire reaches the target');
}

const frames=[];
const canvas = new Proxy({ globalAlpha:1, drawImage:(...args)=>frames.push(args), createRadialGradient:()=>({addColorStop(){}}) }, {
  get:(o,k)=>k in o?o[k]:(()=>{})
});
for(const target of [{x:180,y:350},{x:820,y:590}]){
  assert.ok(fx.pose(.30,target).frame<8,"lid stays closed while warming");
  assert.equal(fx.pose(.30,target).y,510);
  assert.equal(fx.pose(.58,target).frame,10,"lid is fully open during the stream");
  assert.equal(fx.flamePath(.52,target).reach,0);
  assert.equal(fx.flamePath(fx.HIT,target).reach,1);
  assert.equal(fx.flamePath(.74,target).reach,1,'the stream remains extended as it fades');
  assert.ok(fx.flamePath(.74,target).opacity>0&&fx.flamePath(.74,target).opacity<1);
  assert.equal(fx.flamePath(.785,target).opacity,0,'the stream disappears at the cutoff');
  assert.equal(fx.flamePath(fx.HIT,target).end.y,target.y-79);
  assert.equal(fx.flamePath(fx.HIT,target).origin.x,fx.pose(fx.HIT,target).muzzle.x);
  assert.equal(fx.pose(.94,target).frame,15,"closed recovery frame");
  for(let i=0;i<=100;i++)for(const layer of ['ground','actor','stream','impact']){
    const opts={progress:i/100,target,layer};
    assert.ok(Number.isFinite(fx.depthFor(opts,layer)));
    fx.draw(canvas,opts);
  }
}
fx.portrait(canvas,240,196);
const actorFrames=frames.filter(([image])=>image.src.endsWith('grill-master-poses-v151.webp'));
assert.equal(new Set(actorFrames.map(([,sx,sy])=>sx+','+sy)).size,16,'all actor poses play');
assert.ok(actorFrames.every(([,sx,sy,sw,sh])=>sx+sw<=1024&&sy+sh<=1024));
assert.ok(frames.some(([image])=>image.src.endsWith('grill-master-effects-v151.webp')),'fire uses the effects atlas');
const sample = {x:820,y:590};
frames.length=0;
fx.draw(canvas,{progress:.50,target:sample,layer:'actor'});
const vapor=frames.filter(([image])=>image.src.endsWith('grill-master-effects-v151.webp'));
assert.ok(vapor.length>=3,'an overheated grill vents smoke and steam from both sides');
assert.ok(vapor.some(([, , , , , , ,width,height])=>width>=295&&height>=325),'a fully heated plume builds well above the lid');
frames.length=0;
fx.draw(canvas,{progress:fx.HIT,target:sample,layer:'stream'});
assert.equal(frames.length,3,'two side tongues fan out from the core flame');
assert.ok(frames.every(([, , , , ,x])=>x===0),'all three tongues start from the mouth origin');
assert.ok(frames.at(-1)[8]>=130,'the core reaches full visual width at impact');

console.log('Grill Master: flame contact timing, single 440 base hit, exact Burn roll and ticks, blocked or invalid targets, and mirrored summon animation passed.');
