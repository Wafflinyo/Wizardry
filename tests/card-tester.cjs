const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

(async function(){
  const nodes = new Map();
  const element = id => {
    if(!nodes.has(id)){
      nodes.set(id,{ getContext:()=>({}), close(){this.open=false;}, showModal(){this.open=true;}, addEventListener(name,fn){this[name]=fn;} });
    }
    return nodes.get(id);
  };
  const math = Object.create(Math);
  math.random = () => .99;
  const ctx = {
    window:{}, Math:math, crypto:require("node:crypto").webcrypto, Image:class{}, document:{body:{dataset:{}},getElementById:element},
    requestAnimationFrame:()=>1, cancelAnimationFrame(){}, URLSearchParams, location:{search:''},
    performance:{now:()=>0}, localStorage:{getItem:()=>null,setItem(){throw Error('tester should never save a wizard');}}
  };
  const read = name => fs.readFileSync(name,'utf8');
  vm.runInNewContext(read('assets/wizard-system-v135.js'),ctx);
  vm.runInNewContext(read('arena.js').replace(
    '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
    '  paintUI=()=>{};'
  ),ctx);
  vm.runInNewContext(read('assets/wizard-home-v135.js'),ctx);
  const api = ctx.window.WIZARDRY_ARENA_TEST;
  const getOrder = () => Array.from(api.cards,card=>card.id).reverse();
  assert.equal(ctx.document.body.dataset.screen,'home');
  await element('portal').click({target:{closest:()=>({hasAttribute:()=>false,dataset:{action:'tests'}})}});
  assert.match(element('portal').innerHTML,/data-action="cardTester">New Card Tester/);
  await element('portal').click({target:{closest:()=>({hasAttribute:()=>false,dataset:{action:'cardTester'}})}});

  let state = api.getState(), [wizard, dummy] = state.units;
  assert.equal(ctx.document.body.dataset.screen,'battle');
  assert.equal(state.mode,'tester');
  assert.equal(state.size,1);
  assert.equal(dummy.name,'Training Dummy');
  assert.equal(dummy.dummy,true);
  assert.equal(dummy.hand.length,0);
  assert.equal(wizard.hand[0],getOrder()[0]);
  assert.equal(wizard.hand[1],getOrder()[1]);
  assert.deepEqual([...wizard.hand,...wizard.drawPile],getOrder());
  assert.ok(!wizard.masteries.includes('fire'),'tester can use Fire even without Fire mastery');
  assert.ok(wizard.hp<wizard.maxHp,'healing can be tested on the caster');
  api.autoFill(1);
  assert.equal(Object.keys(state.plans).length,0);

  const opening=[...wizard.hand];
  element('testerTarget').onchange({target:{value:'wizard'}});
  assert.equal(dummy.wizardDummy,true);assert.notEqual(dummy.name,'Training Dummy');
  assert.deepEqual([...wizard.hand],opening);
  for (const id of getOrder().slice(0,getOrder().indexOf('zen'))) {
    api.chooseCard(id);
    assert.ok(api.discardSelected(), 'discard '+id);
  }
  assert.equal(wizard.statuses.length,0,'the player starts without preloaded runes');
  api.chooseCard('zen');
  assert.equal(state.selectedTarget,null,'no eligible target without a negative rune');
  api.addStatus(wizard,'decay_mark',null,.2);
  api.addStatus(wizard,'decaying_strength',null,.2);
  api.chooseCard('zen');
  assert.equal(state.selectedTarget,wizard.id);
  api.confirmTarget();
  assert.equal(state.phase,'planning','Zen requires a rune choice');
  api.selectZenRune('decay_mark');
  assert.equal(element('statusPopup').hidden,false);
  assert.match(element('statusName').textContent,/decay/i);
  api.confirmTarget();
  assert.equal(element('statusPopup').hidden,true);
  assert.equal(state.animation.action.runeKind,'decay_mark');
  api.advanceBackground(20000);
  assert.deepEqual(Array.from(wizard.statuses,st=>st.kind),['decaying_strength'],'only the selected rune is removed');
  api.chooseCard('electrodisc');
  assert.equal(state.selectedTarget,dummy.id);
  api.confirmTarget();
  assert.equal(state.animation.card.id,'electrodisc');
  assert.equal(state.sequence.length,1,'the dummy never casts');
  for(let i=0;i<50&&state.animation.stage!=='summon';i++) api.advanceBackground(100);
  assert.equal(state.animation.stage,'summon');
  const cast=state.animation;
  const startingHp=dummy.hp;
  cast.damageVariant=1;
  wizard.skills.lightning=0;
  for(const [index,arrival] of [.615,.745,.865].entries()){
    api.advanceBackground(Math.ceil(cast.duration*arrival)-cast.elapsed-1);
    assert.equal(dummy.hp,startingHp-120*index,'damage waits for contact');
    api.advanceBackground(1);
    assert.equal(dummy.hp,startingHp-120*(index+1),'each disc deals 120');
  }
  api.advanceBackground(20000);
  assert.equal(dummy.hp,startingHp-360,'the summon never repeats a hit');
  assert.equal(wizard.mana,wizard.maxMana);
  assert.equal(state.phase,'planning');
  assert.deepEqual([...wizard.hand],getOrder().slice(getOrder().indexOf('burningpheonix'),getOrder().indexOf('burningpheonix')+5));

  api.chooseCard('burningpheonix');assert.ok(api.discardSelected());
  api.chooseCard('decaystrength');assert.ok(api.discardSelected());
  api.chooseCard('venustrap');assert.ok(api.discardSelected());
  api.chooseCard('grillmaster');assert.ok(api.discardSelected());
  api.chooseCard('electricalcharge');
  assert.equal(state.selectedTarget,wizard.id,'the buff can still target the wizard');
  const next = wizard.drawPile[0];
  assert.ok(api.discardSelected());
  assert.equal(wizard.hand.at(-1),next);
  const seen = new Set([...wizard.discardPile,...wizard.hand]);
  while(wizard.drawPile.length){
    seen.add(wizard.hand[0]);
    api.chooseCard(wizard.hand[0]);
    assert.ok(api.discardSelected());
  }
  for(const id of wizard.hand)seen.add(id);
  assert.equal(seen.size,getOrder().length,'every spell is reachable without casting or passing');
  const spent = new Set([...wizard.discardPile,wizard.hand[0]]);
  api.chooseCard(wizard.hand[0]);
  assert.ok(api.discardSelected());
  const recycled = getOrder().filter(id=>spent.has(id));
  assert.equal(wizard.hand.at(-1),recycled[0]);
  assert.deepEqual([...wizard.drawPile],recycled.slice(1));

  element('testerTarget').onchange({target:{value:'wood'}});
  assert.equal(dummy.name,'Training Dummy');
  const firstName = wizard.name;
  math.random = () => .01;
  element('resetTester').onclick();
  state = api.getState();
  [wizard,dummy] = state.units;
  assert.notEqual(wizard.name,firstName,'reset rerolls the wizard');
  assert.equal(wizard.hand[0],getOrder()[0]);
  dummy.hp=1;
  for (const id of getOrder().slice(0,getOrder().indexOf('kamikaze'))) {
    api.chooseCard(id);
    assert.ok(api.discardSelected(), 'discard '+id);
  }
  api.chooseCard('kamikaze');
  api.confirmTarget();
  api.advanceBackground(20000);
  assert.equal(state.phase,'planning','tester continues after a knockout');
  assert.equal(dummy.hp,dummy.maxHp);

  element('battleHome').onclick();
  assert.equal(ctx.document.body.dataset.screen,'home');
  assert.doesNotMatch(element('portal').innerHTML,/data-action="cardTester4"/);
  await element('portal').click({target:{closest:()=>({hasAttribute:()=>false,dataset:{action:'cardTester'}})}});
  for(const size of [2,3,4]){
    element('testerSize').onchange({target:{value:String(size)}});
    assert.equal(api.getState().units.length,size*2);
  }
  let teamTest=api.getState();
  assert.equal(teamTest.size,4);
  assert.equal(teamTest.units.length,8);
  const dummies=teamTest.units.filter(unit=>unit.dummy);
  assert.equal(dummies.length,4);
  element('testerTarget').onchange({target:{value:'wizard'}});
  assert.ok(dummies.every(unit=>unit.wizardDummy));
  const frostIndex = getOrder().indexOf('frozentouch');
  const discardedForFrost = Math.max(0,frostIndex-teamTest.units[0].hand.length+1);
  for (const id of getOrder().slice(0,discardedForFrost)) {
    api.chooseCard(id);
    assert.ok(api.discardSelected(), 'discard '+id);
  }
  api.chooseCard('frozentouch');
  const protectedWizard=teamTest.units.find(unit=>unit.team===0&&unit.id!==teamTest.selectedCaster);
  api.selectTarget(protectedWizard.id);
  assert.notEqual(teamTest.selectedTarget,protectedWizard.id,'Frozen Touch rejects allies');
  api.selectTarget(dummies[0].id);
  assert.equal(teamTest.selectedTarget,dummies[0].id,'Frozen Touch accepts an enemy');
  api.selectTarget(teamTest.selectedCaster);
  assert.equal(teamTest.selectedTarget,dummies[0].id,'Frozen Touch rejects self');
  teamTest.units[0].skills.wind=0;
  dummies.forEach(unit=>{unit.hp=1;});
  for (const id of getOrder().slice(discardedForFrost,getOrder().indexOf('sticksandstones'))) {
    api.chooseCard(id);
    assert.ok(api.discardSelected(), 'discard '+id);
  }
  api.chooseCard('sticksandstones');
  api.confirmTarget();
  assert.equal(teamTest.sequence.length,1,'all seven other slots are passive');
  while(teamTest.animation?.stage!=='summon')api.advanceBackground(40);
  assert.equal(teamTest.animation.stoneTargets.length,4);
  api.advanceBackground(20000);
  assert.equal(teamTest.phase,'planning');
  assert.ok(dummies.every(unit=>unit.hp===unit.maxHp),'all knocked-out targets reset');
  element('resetTester').onclick();
  teamTest=api.getState();
  assert.equal(teamTest.size,4,'4v4 reset preserves the formation');
  for(const [kind,school,attack] of [
    ['scribe',null,'iceblast'],['acolyte',null,'iceblast'],['pageguard',null,'iceblast'],
    ['magistrate','fire','blazingembers'],['inkbinder','nature','solarblast'],['warden','earth','rockblast']
  ]){
    api.startCardTester(2);
    api.switchTesterTarget(kind);
    assert.ok(api.switchTesterOpponentMode('battle'));
    const battle=api.getState();
    const foes=battle.units.filter(u=>u.team===1);
    assert.ok(battle.testerBattle);
    for(const foe of foes){
      assert.equal(foe.minionId,kind);
      assert.equal(foe.dummy,undefined);
      assert.equal(foe.hand.length,5);
      assert.equal(new Set(foe.masteries).size,2);
      if(school)assert.equal(foe.masteries[0],school);
      assert.ok([...foe.hand,...foe.drawPile].every(id=>foe.masteries.includes(api.cards.find(c=>c.id===id).school)));
      foe.hand=[attack];
    }
    const hero=battle.units[0],hp=hero.hp;
    hero.hand=['waterblast'];
    battle.units[1].hand=['waterblast'];
    api.chooseCard('waterblast');
    api.confirmTarget();
    assert.equal(battle.sequence.filter(plan=>plan.team===1&&plan.cardId===attack).length,2);
    assert.equal(Array.from(battle.sequence,p=>p.casterId).join(','),'a0,e0,a1,e1');
    assert.equal(Array.from(api.turnOrder(2),u=>u.id).join(','),'e0,a1,e1,a0');
    for(let step=0;step<400;step++){
      if(battle.animation?.source===foes[0].id&&battle.animation.stage==='tracing-auto')break;
      api.advanceBackground(40);
    }
    assert.equal(battle.animation.source,foes[0].id);
    assert.equal(battle.animation.stage,'tracing-auto');
    assert.equal(battle.animation.duration,api.runeTiming().trace,'minions and wizards use the same rune timing');
    api.advanceBackground(28000);
    assert.equal(battle.phase,'planning');
    assert.ok(battle.units.slice(0,2).some((u,i)=>u.hp<(i===0?hp:u.maxHp)));
    assert.ok(foes.every(u=>u.hand.length>0));
    assert.ok(api.switchTesterOpponentMode('passive'));
    assert.ok(api.getState().units.filter(u=>u.team===1).every(u=>u.dummy&&u.hand.length===0));
  }
  element('battleHome').onclick();
  const masteries=['water','wind'];
  api.configureProfile({name:'Saved Wizard',level:20,masteries,skills:{},deck:ctx.window.WizardryBuilds.makeDeck(api.cards,masteries)});
  api.startCardTester();
  assert.notEqual(api.getState().units[0].name,'Saved Wizard');
  api.startPractice(1);
  const practice = api.getState();
  assert.equal(practice.units[0].name,'Saved Wizard');
  assert.ok(practice.units[0].hand.every(id=>masteries.includes(api.cards.find(card=>card.id===id).school)));
  assert.equal(practice.units[1].dummy,undefined);

  const towerPlayer={profile:ctx.window.WizardryBuilds.cpu(api.cards,0,math.random,10)};
  for(const [floor,first,primary] of [
    [1,'scribe',null],[2,'acolyte',null],[3,'pageguard',null],
    [5,'abyssal','water'],[6,'inkbinder','nature'],[7,'warden','earth'],[8,'magistrate','fire'],
    [10,'gale','wind'],[15,'briar','nature'],[20,'glacial','ice'],[21,'grelus','dark']
  ]){
    api.startTower([towerPlayer,towerPlayer],floor);
    const foes=api.getState().units.filter(u=>u.team===1);
    assert.equal(foes[0].bossId||foes[0].minionId,first);
    if(primary)assert.equal(foes[0].masteries[0],primary);
    if(floor===21)assert.deepEqual(Array.from(foes[0].masteries),['dark','lightning']);
    assert.ok(foes.filter(u=>u.bossId).length<=1);
    for(const foe of foes){
      assert.equal(new Set(foe.masteries).size,2);
      const B=ctx.window.WizardryBuilds;
      const unlocked=B.unlockedSpells(api.cards,foe.masteries,foe.level);
      const deck=[...foe.hand,...foe.drawPile];
      assert.equal(deck.length,B.deckSize(unlocked));
      assert.ok(deck.every(id=>unlocked.some(c=>c.id===id)));
      assert.ok(deck.every(id=>deck.filter(other=>id===other).length<=B.MAX_COPIES));
      assert.equal(new Set(deck.map(id=>api.cards.find(c=>c.id===id).school)).size,2);
      assert.ok([...foe.hand,...foe.drawPile].every(id=>foe.masteries.includes(api.cards.find(c=>c.id===id).school)));
    }
  }
  console.log('Card Tester: home entry without a saved wizard, Electro Disc cast, ordered full catalog and recycling, passive dummy with knockout recovery, reset and practice isolation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
