const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const node = {getContext: () => ({})};
const ctx = {window: {}, requestAnimationFrame() {}, Image: class {}, document: {getElementById: () => node}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js', 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync('arena.js', 'utf8').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  window.setupGrowthTest=s=>state=s;window.damageForTest=damage;window.healForTest=restoreHp;window.releaseStorageForTest=releaseColdStorage;paintUI=()=>{};'
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
assert.ok([...api.getState().units[0].hand,...api.getState().units[0].drawPile].includes(briar.id));
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
assert.ok([...testState.units[0].hand,...testState.units[0].drawPile].includes(lifevine.id));
if(!testState.units[0].hand.includes(lifevine.id))testState.units[0].hand[0]=lifevine.id;
api.chooseCard(lifevine.id);
assert.equal(testState.selectedTarget,testState.units[1].id);
console.log('Lifevine: ally-only targeting, actual HP sharing, both directions, missing-HP cap, expiration, relinking and obstacle routing passed.');

const debt=card('blooddebt');
assert.equal(debt.cost,4);
assert.equal(debt.accuracy,.85);
assert.deepEqual(JSON.parse(JSON.stringify(debt)),
  JSON.parse(fs.readFileSync('backend/cards.json','utf8')).find(spell=>spell.id===debt.id));
for(const [heal,creditorMissing,round,expected,stolen,blocked=false] of [
  [100,500,1,50,50],
  [900,500,2,550,200],
  [100,10,2,50,10],
  [100,500,3,100,0],
  [100,500,1,100,0,true]
]){
  const creditor=unit('creditor',0),debtor=unit('debtor',1);
  creditor.hp-=creditorMissing;
  debtor.hp=500;
  if(blocked)debtor.statuses.push({kind:'wind_dome',value:1});
  const s={phase:'resolving',round:1,units:[creditor,debtor],auras:[null,null],log:[],flashes:[]};
  ctx.window.setupGrowthTest(s);
  api.applySpell({card:debt,source:creditor.id,target:debtor.id,runeResult:'success',damageVariant:1,
    action:{casterId:creditor.id,targetId:debtor.id}});
  assert.equal(debtor.hp,blocked?500:250);
  assert.equal(has(debtor,'blood_debt'),!blocked);
  if(!blocked)assert.equal(debtor.statuses.find(st=>st.kind==='blood_debt').expiresRound,3);
  s.round=round;
  assert.equal(ctx.window.healForTest(debtor,debtor,heal),expected);
  assert.equal(creditor.hp,creditor.maxHp-creditorMissing+stolen);
  const before=creditor.hp;
  ctx.window.healForTest(debtor,debtor,100);
  assert.equal(creditor.hp,before,'the mark can steal only once');
}
api.startCardTester();
assert.ok(api.getState().units[0].hand.includes(debt.id));
console.log('Blood Debt: damage, mark, effective recovery, theft cap, missing HP cap, expiration, one trigger and Wind Dome passed.');

const storage=card('coldstorage');
assert.equal(storage.cost,3);
assert.equal(storage.accuracy,1);
assert.deepEqual(JSON.parse(JSON.stringify(storage)),
  JSON.parse(fs.readFileSync('backend/cards.json','utf8')).find(spell=>spell.id===storage.id));
for(const [mode,expectedHp,expectedMana] of [
  ['normal',900,9],['cap',1000,10],['cleansed',750,7],
  ['sealed',750,9],['defeated',0,7],['fullRuneRow',750,7]
]){
  const banker=unit('banker',0),recipient=unit('recipient',0);
  recipient.hp=mode==='cap'?980:750;
  recipient.mana=mode==='cap'?9:7;
  recipient.maxMana=10;
  if(mode==='fullRuneRow')recipient.statuses=['burn','poison','frostbite','curse'].map(kind=>({kind}));
  const s={phase:'resolving',round:1,units:[banker,recipient],log:[],flashes:[],
    environment:mode==='sealed'?{id:'darkgrounds'}:null};
  ctx.window.setupGrowthTest(s);
  api.applySpell({card:storage,runeResult:'success',action:{casterId:banker.id,targetId:recipient.id}});
  assert.equal(has(recipient,'cold_storage'),mode!=='fullRuneRow');
  ctx.window.releaseStorageForTest();
  assert.equal(recipient.mana,mode==='cap'?9:7);
  assert.equal(recipient.hp,mode==='cap'?980:750);
  if(mode==='cleansed')api.consumeStatus(recipient,'cold_storage');
  if(mode==='defeated')recipient.hp=0;
  s.round++;
  ctx.window.releaseStorageForTest();
  ctx.window.releaseStorageForTest();
  assert.equal(recipient.hp,expectedHp);
  assert.equal(recipient.mana,expectedMana);
  assert.ok(!has(recipient,'cold_storage'));
}
api.startCardTester();
const storageState=api.getState();
const storageTester=storageState.units[0];
storageTester.hp=storageTester.maxHp-200;
storageTester.mana=5;
api.applySpell({card:storage,runeResult:'success',action:{casterId:storageTester.id,targetId:storageTester.id}});
assert.ok(storageTester.hand.includes(storage.id));
api.finishRound();
assert.equal(storageTester.hp,storageTester.maxHp-50);
assert.match(storageState.log.join('\n'),/opens for 2 mana and 150 HP/);
assert.ok(!has(storageTester,'cold_storage'));
console.log('Cold Storage: next-round release, start-of-round integration, cap, cleanse, debuff limit, defeated target and healing suppression passed.');

const lance=card('glacierlance');
assert.equal(lance.cost,4);
assert.equal(lance.accuracy,.85);
assert.deepEqual(JSON.parse(JSON.stringify(lance)),
  JSON.parse(fs.readFileSync('backend/cards.json','utf8')).find(spell=>spell.id===lance.id));
for(const [remaining,extreme,blocked,expected] of [
  [undefined,false,false,390],[2,false,false,510],[3,true,false,510],
  [0,false,false,390],[2,false,true,0]
]){
  const caster=unit('ice-caster',0),target=unit('lance-target',1),other=unit('other',1);
  if(remaining!==undefined)target.statuses.push({kind:'frostbite',remaining,extreme});
  if(blocked)target.statuses.push({kind:'wind_dome',value:1});
  ctx.window.setupGrowthTest({phase:'resolving',round:1,units:[caster,target,other],auras:[null,null],log:[],flashes:[]});
  const cast={card:lance,source:caster.id,target:target.id,runeResult:'success',damageVariant:1,
    action:{casterId:caster.id,targetId:target.id}};
  api.applySpell(cast);
  api.applySpell(cast);
  assert.equal(target.hp,1000-expected);
  assert.equal(other.hp,1000);
  assert.equal(target.statuses.find(st=>st.kind==='frostbite')?.remaining,remaining);
}
vm.runInNewContext(fs.readFileSync('assets/glacier-lance.js','utf8'),ctx);
const lanceArt=ctx.window.GlacierLance;
const formation=new Set(Array.from({length:100},(_,i)=>{
  const pose=lanceArt.scene({x:780,y:390},i/100*(lance.hit-.034),lance.hit);
  assert.equal(pose.x,500);
  return pose.frame;
}));
assert.deepEqual([...formation],[0,1,2,3,4,5,6,7,8,9]);
for(const target of [{x:200,y:490},{x:780,y:390}]){
  const start=lanceArt.scene(target,.4,lance.hit);
  assert.equal(start.x,500);
  const contact=lanceArt.scene(target,lance.hit,lance.hit);
  const exit=lanceArt.scene(target,lance.hit+.16,lance.hit);
  assert.ok((exit.ground.x-target.x)*(target.x-500)>0);
  assert.equal(exit.ground.y,target.y+19);
  assert.equal(start.y,323);
  assert.equal(contact.contact.y,target.y-93);
  assert.equal(start.size,contact.size);
  assert.equal(contact.size,exit.size);
  assert.equal(contact.frame,exit.frame);
  assert.ok(contact.hit-contact.release<.035);
  assert.equal(start.split,1);
  const passing=lanceArt.scene(target,lance.hit+.029,lance.hit);
  assert.ok(passing.split>0&&passing.split<1);
  assert.ok(passing.backDepth<target.y&&passing.depthY>target.y);
  assert.equal(exit.split,0);
  const tip=pose=>({x:pose.x+Math.cos(pose.angle)*pose.size*.48,y:pose.y+Math.sin(pose.angle)*pose.size*.48});
  for(const [pose,destination] of [[contact,contact.contact],[exit,exit.ground]]){
    assert.ok(Math.abs(tip(pose).x-destination.x)<1e-6);
    assert.ok(Math.abs(tip(pose).y-destination.y)<1e-6);
  }
  assert.ok((contact.x-target.x)*(target.x-500)<0);
}
api.startCardTester();
assert.ok(api.getState().units[0].hand.includes(lance.id));
console.log('Glacier Lance: center trajectory, opening hand, single target, Frostbite bonus and retention, Extreme Frostbite, expired rune and Wind Dome passed.');

const rip=card('ripcurrent');
assert.equal(rip.cost,4);
assert.equal(rip.accuracy,.90);
assert.deepEqual(JSON.parse(JSON.stringify(rip)),
  JSON.parse(fs.readFileSync('backend/cards.json','utf8')).find(spell=>spell.id===rip.id));
for(const mode of ['ally','self','blocked','sealed','miss']){
  const caster=unit('water-caster',0),target=unit('rip-target',1),ally=unit('wounded',0),knockedOut=unit('out',0);
  caster.hp=mode==='self'?410:950;
  ally.hp=470;knockedOut.hp=0;
  if(mode==='blocked')target.statuses.push({kind:'wind_dome',value:1});
  const s={phase:'resolving',round:1,units:[caster,target,ally,knockedOut],auras:[null,null],log:[],flashes:[],
    environment:mode==='sealed'?{id:'darkgrounds'}:null};
  ctx.window.setupGrowthTest(s);
  const cast={card:rip,source:caster.id,target:target.id,runeResult:mode==='miss'?'failed':'success',damageVariant:1,
    action:{casterId:caster.id,targetId:target.id}};
  api.applySpell(cast);
  assert.equal(target.hp,mode==='blocked'||mode==='miss'?1000:750);
  const recipient=mode==='self'?caster:ally;
  assert.equal(cast.ripAllyId,mode==='blocked'||mode==='miss'?undefined:recipient.id);
  const before=recipient.hp;
  Object.assign(cast,{stage:'summon',duration:rip.duration,elapsed:0});
  s.animation=cast;
  api.advanceAction(rip.duration*rip.healAt-1);
  assert.equal(recipient.hp,before);
  api.advanceAction(1);
  api.advanceAction(1);
  assert.equal(recipient.hp,before+(['ally','self'].includes(mode)?180:0));
  assert.equal(knockedOut.hp,0);
}
vm.runInNewContext(fs.readFileSync('assets/rip-current.js','utf8'),ctx);
const wave=ctx.window.RipCurrent;
const waveCaster={x:200,y:470},waveTarget={x:740,y:480},waveAlly={x:300,y:390};
assert.equal(wave.scene(waveCaster,waveTarget,null,rip.hit,rip).x,waveTarget.x);
assert.equal(wave.scene(waveCaster,waveTarget,waveAlly,rip.healAt,rip).x,waveAlly.x);
assert.equal(wave.scene(waveCaster,waveTarget,waveAlly,rip.healAt,rip).y,waveAlly.y);
assert.equal(new Set(Array.from({length:100},(_,i)=>wave.scene(waveCaster,waveTarget,waveAlly,i/100,rip).frame)).size,8);
const levelAlly={x:300,y:waveTarget.y};
for(let i=0;i<30;i++){
  const p=rip.hit+.10+(rip.healAt-rip.hit-.10)*i/30;
  const pose=wave.scene(waveCaster,waveTarget,levelAlly,p,rip);
  assert.ok(pose.moving);
  assert.equal(pose.y,waveTarget.y,'the returning wave does not bob above the floor');
}
api.startCardTester();
assert.ok(api.getState().units[0].hand.includes(rip.id));
console.log('Rip Current: 250 damage, lowest living teammate, delayed 180 HP, misses, shield blocking, Dark Grounds and eight wave poses passed.');

const pressure=card('pressuredrop');
assert.equal(pressure.damage,310);
assert.equal(pressure.cost,4);
assert.equal(pressure.accuracy,.90);
assert.deepEqual(JSON.parse(JSON.stringify(pressure)),
  JSON.parse(fs.readFileSync('backend/cards.json','utf8')).find(spell=>spell.id===pressure.id));
for(const [plan,queueAt,shield,marked] of [
  ['windfist',0,false,true],['windfist',1,false,true],['calming',0,false,true],
  ['static',0,false,true],['soul',0,false,true],['windfist',0,true,false],[null,0,false,true]
]){
  const caster=unit('wind-caster',0),target=unit('target',1);
  if(shield)target.statuses.push({kind:'wind_dome',value:1});
  ctx.window.setupGrowthTest({phase:'resolving',round:1,units:[caster,target],auras:[null,null],log:[],flashes:[],
    sequence:[{casterId:target.id,cardId:plan,pass:!plan}],queueAt});
  api.applySpell({card:pressure,source:caster.id,target:target.id,runeResult:'success',damageVariant:1,
    action:{casterId:caster.id,targetId:target.id}});
  assert.equal(target.hp,shield?1000:690);
  assert.equal(has(target,'pressure_drop'),marked);
  if(marked){
    const pending=card('windfist'),cast={card:pending};
    api.getState().round++;
    api.applySpell({card:card('calming'),source:target.id,target:target.id,runeResult:'success',
      action:{casterId:target.id,targetId:target.id}});
    assert.ok(has(target,'pressure_drop'),'a support cast retains the rune');
    assert.equal(damage(target,caster,100,pending,cast),75);
    assert.equal(damage(target,caster,100,pending,cast),75);
    assert.equal(damage(target,caster,100,pending,{card:pending}),100);
    assert.ok(!has(target,'pressure_drop'));
  }
}
api.startCardTester();
assert.ok(api.getState().units[0].hand.includes(pressure.id));
console.log('Pressure Drop: damage, whole-spell reduction, support casts, later rounds, shield and opening hand passed.');
