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
  assert.equal(wizard.hand[0],'boulderweight');
  assert.equal(wizard.hand[1],'heizmann');
  assert.deepEqual([...wizard.hand,...wizard.drawPile],getOrder());
  assert.ok(!wizard.masteries.includes('fire'),'tester can use Fire even without Fire mastery');
  assert.ok(wizard.hp<wizard.maxHp,'healing can be tested on the caster');
  api.autoFill(1);
  assert.equal(Object.keys(state.plans).length,0);

  api.chooseCard('boulderweight');
  assert.equal(state.selectedTarget,dummy.id);
  api.confirmTarget();
  assert.equal(state.animation.card.id,'boulderweight');
  assert.equal(state.sequence.length,1,'the dummy never casts');
  api.advanceBackground(20000);
  assert.ok(dummy.statuses.some(st=>st.kind==='boulder_weight'));
  assert.equal(wizard.mana,wizard.maxMana);
  assert.equal(state.phase,'planning');
  assert.deepEqual([...wizard.hand],getOrder().slice(1,6));

  api.chooseCard('electricalcharge');
  assert.equal(state.selectedTarget,wizard.id,'self spells target the random wizard');
  const next = wizard.drawPile[0];
  assert.ok(api.discardSelected());
  assert.equal(wizard.hand.at(-1),next);
  const seen = new Set(['boulderweight','electricalcharge']);
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

  const firstName = wizard.name;
  math.random = () => .01;
  element('resetTester').onclick();
  state = api.getState();
  [wizard,dummy] = state.units;
  assert.notEqual(wizard.name,firstName,'reset rerolls the wizard');
  assert.equal(wizard.hand[0],'boulderweight');
  dummy.hp=1;
  api.chooseCard('heizmann');
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

  console.log('Card Tester: home entry without a saved wizard, Heizmann cast, ordered full catalog and recycling, passive dummy with knockout recovery, reset and practice isolation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
