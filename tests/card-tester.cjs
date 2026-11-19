const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

(async function(){
  const nodes = new Map();
  const element = id => {
    if(!nodes.has(id)){
      nodes.set(id,{ getContext:()=>({}), addEventListener(name,fn){this[name]=fn;} });
    }
    return nodes.get(id);
  };
  const math = Object.create(Math);
  math.random = () => .99;
  const ctx = {
    window:{}, Math:math, Image:class{}, document:{body:{dataset:{}},getElementById:element},
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
  assert.match(element('portal').innerHTML,/data-action="cardTester">New Card Tester/);
  await element('portal').click({target:{closest:()=>({dataset:{action:'cardTester'}})}});

  let state = api.getState(), [wizard, dummy] = state.units;
  assert.equal(ctx.document.body.dataset.screen,'battle');
  assert.equal(state.mode,'tester');
  assert.equal(state.size,1);
  assert.equal(dummy.name,'Training Dummy');
  assert.equal(dummy.dummy,true);
  assert.equal(dummy.hand.length,0);
  assert.equal(wizard.hand[0],'wickedwitch');
  assert.equal(wizard.hand[1],'lightningball');
  assert.deepEqual([...wizard.hand,...wizard.drawPile],getOrder());
  assert.ok(!wizard.masteries.includes('fire'),'tester can use Fire even without Fire mastery');
  assert.ok(wizard.hp<wizard.maxHp,'healing can be tested on the caster');
  api.autoFill(1);
  assert.equal(Object.keys(state.plans).length,0);

  const opening=[...wizard.hand];
  element('testerTarget').onchange({target:{value:'wizard'}});
  assert.equal(dummy.wizardDummy,true);assert.notEqual(dummy.name,'Training Dummy');
  assert.deepEqual([...wizard.hand],opening);
  api.chooseCard('wickedwitch');
  assert.ok(api.discardSelected());
  api.chooseCard('lightningball');
  assert.ok(api.discardSelected());
  api.chooseCard('totallyrad');
  assert.ok(api.discardSelected());
  api.chooseCard('yeti');
  assert.ok(api.discardSelected());
  api.chooseCard('bulletseed');
  assert.ok(api.discardSelected());
  api.chooseCard('tree');
  assert.ok(api.discardSelected());
  api.chooseCard('scaldingair');
  assert.ok(api.discardSelected());
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
  assert.deepEqual([...wizard.hand],getOrder().slice(9,14));

  api.chooseCard('burningpheonix');assert.ok(api.discardSelected());
  api.chooseCard('decaystrength');assert.ok(api.discardSelected());
  api.chooseCard('venustrap');assert.ok(api.discardSelected());
  api.chooseCard('grillmaster');assert.ok(api.discardSelected());
  api.chooseCard('electricalcharge');
  assert.equal(state.selectedTarget,wizard.id,'self spells target the random wizard');
  const next = wizard.drawPile[0];
  assert.ok(api.discardSelected());
  assert.equal(wizard.hand.at(-1),next);
  const seen = new Set(['wickedwitch','lightningball','totallyrad','yeti','bulletseed','tree','scaldingair','zen','decaystrength','electrodisc','burningpheonix','electricalcharge','grillmaster','venustrap']);
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
  assert.equal(wizard.hand[0],'wickedwitch');
  dummy.hp=1;
  api.chooseCard('wickedwitch');
  api.confirmTarget();
  api.advanceBackground(20000);
  assert.equal(state.phase,'planning','tester continues after a knockout');
  assert.equal(dummy.hp,dummy.maxHp);

  element('battleHome').onclick();
  assert.equal(ctx.document.body.dataset.screen,'home');
  const masteries=['water','wind'];
  api.configureProfile({name:'Saved Wizard',level:20,masteries,skills:{},deck:ctx.window.WizardryBuilds.makeDeck(api.cards,masteries)});
  api.startCardTester();
  assert.notEqual(api.getState().units[0].name,'Saved Wizard');
  api.startPractice(1);
  const practice = api.getState();
  assert.equal(practice.units[0].name,'Saved Wizard');
  assert.ok(practice.units[0].hand.every(id=>masteries.includes(api.cards.find(card=>card.id===id).school)));
  assert.equal(practice.units[1].dummy,undefined);

  console.log('Card Tester: home entry without a saved wizard, Electro Disc cast, ordered full catalog and recycling, passive dummy with knockout recovery, reset and practice isolation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
