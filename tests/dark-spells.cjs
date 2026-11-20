const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const node = {getContext: () => ({})};
const ctx = {window: {}, Image: class {}, document: {getElementById: () => node}, requestAnimationFrame() {}};
const src = name => fs.readFileSync(name, 'utf8');
vm.runInNewContext(src('assets/wizard-system-v135.js'), ctx);
vm.runInNewContext(src('arena.js').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  paintUI=()=>{};'
), ctx);
const api = ctx.window.WIZARDRY_ARENA_TEST;
const backend = JSON.parse(src('backend/cards.json'));
const opening = {grimoire: ['soulharvest', 'manascourge', 'reaper', 'jack', 'wickedwitch']};
api.startHand(opening, true);
assert.ok(opening.hand.includes('soulharvest'));
assert.ok(opening.hand.includes('manascourge'));

function battle() {
  api.startPractice(1);
  const state = api.getState();
  const [caster, target] = state.units;
  caster.skills.dark = 0;
  target.hp = target.maxHp = 2000;
  return {state, caster, target};
}

function cast(id, caster, target, runeResult = 'success') {
  const card = api.cards.find(card => card.id === id);
  assert.deepEqual(JSON.parse(JSON.stringify(card)), backend.find(card => card.id === id));
  const spell = {card, source: caster.id, target: target.id, damageVariant: 1, runeResult,
    action: {casterId: caster.id, targetId: target.id}};
  api.applySpell(spell);
  api.applySpell(spell);
  return spell;
}

{
  const {state, caster, target} = battle();
  target.mana = 0;
  target.passedRound = state.round;
  target.passStreak = 2;
  api.addStatus(target, 'flow_state', null, 1, 'water');
  const flow = target.statuses[0];
  Object.assign(flow, {appliedRound: state.round, remaining: 3});
  cast('manascourge', caster, target);
  assert.equal(target.statuses.at(-1).school, 'dark');
  assert.equal(target.hp, 2000);
  api.finishRound();
  assert.equal(target.mana, 0, 'blocks normal, pass and Flow State regeneration');
  assert.equal(target.passStreak, 3);
  assert.equal(flow.remaining, 2, 'Flow State still uses up the round');
  assert(!target.statuses.some(st => st.kind === 'mana_scourge'));
  api.grantTurnMana();
  assert.equal(target.mana, 0, 'the same round cannot award mana on a second call');
  api.finishRound();
  assert.equal(target.mana, 2, 'mana regeneration resumes on the next round end');
}

{
  const {caster, target} = battle();
  target.mana = target.maxMana;
  cast('manascourge', caster, target);
  api.finishRound();
  api.finishRound();
  assert(target.statuses.some(st => st.kind === 'mana_scourge'), 'the rune survives full-mana rounds');
  target.mana -= 3;
  api.finishRound();
  assert.equal(target.mana, target.maxMana - 3, 'the first real mana gain is blocked');
  assert(!target.statuses.some(st => st.kind === 'mana_scourge'));
  api.finishRound();
  assert.equal(target.mana, target.maxMana - 2, 'the rune only blocks one gain');
}

{
  const {caster, target} = battle();
  const spell = cast('soulharvest', caster, target);
  assert.equal(target.hp, 1460);
  assert.equal(spell.soulHooked, true);
  assert.equal(target.statuses[0].school, 'dark');
  for (let round = 0; round < 2; round++) {
    api.finishRound();
    assert.equal(target.hp, 1460, 'Soulless has no partial ticks');
  }
  api.finishRound();
  assert.equal(target.hp, 1210);
  assert.equal(target.statuses.length, 0);
  api.tickBurnsForRound();
  assert.equal(target.hp, 1210, 'Soulless hits only once');
}

for (const protection of ['miss', 'wind_dome', 'cleanse', 'full slots']) {
  const {caster, target} = battle();
  if (protection === 'wind_dome') api.addStatus(target, 'wind_dome', null, 1);
  if (protection === 'full slots') {
    for (const kind of ['burn', 'poison', 'fear', 'static_shock']) api.addStatus(target, kind, null, 1);
  }
  cast('soulharvest', caster, target, protection === 'miss' ? 'failed' : 'success');
  if (protection === 'cleanse') {
    api.applySpell({card: api.cards.find(card => card.id === 'zen'), runeResult: 'success',
      action: {casterId: target.id, targetId: target.id, runeKind: 'soulless'}});
  }
  assert(!target.statuses.some(st => st.kind === 'soulless'), protection);
}

api.startCardTester();
const tester = api.getState();
const [wizard, dummy] = tester.units;
wizard.skills.dark = 0;
const dummyHP = dummy.hp;
for(const id of ["drowzyflowers","bubbleshield","darksorcerer","sticksandstones","growth","electriceel","crystalicemirrors"]){api.chooseCard(id);assert.ok(api.discardSelected());}
api.chooseCard('soulharvest');
api.confirmTarget();
while (tester.animation && tester.animation.stage !== 'summon') api.advanceBackground(40);
const swing = tester.animation;
assert.equal(swing?.stage, 'summon');
swing.damageVariant = 1;
const contactMs = Math.ceil(swing.duration * swing.card.hit);
api.advanceBackground(contactMs - swing.elapsed - 1);
assert.equal(dummy.hp, dummyHP);
api.advanceBackground(1);
assert.equal(dummy.hp, dummyHP - 540, 'the chain deals damage at the contact frame');
api.advanceBackground(20000);
api.chooseCard('manascourge');
api.confirmTarget();
api.advanceBackground(20000);
assert.equal(tester.round, 3);
assert.equal(dummy.hp, dummyHP - 540, 'Soul Harvest waits for the third full round');
assert(dummy.statuses.some(st => st.kind === 'mana_scourge'), 'the wooden dummy never attempts mana regeneration');
api.finishRound();
assert.equal(dummy.hp, dummyHP - 790);

ctx.Image = class { naturalWidth = 1024; };
vm.runInNewContext(src('assets/dark-spells.js'), ctx);
const art = ctx.window.DarkSpells;
const noop = new Proxy({globalAlpha: 1, createRadialGradient: () => ({addColorStop() {}})}, {get: (obj, key) => key in obj ? obj[key] : () => {}});
for (const target of [{x: 260, y: 330}, {x: 750, y: 540}]) {
  const impact = art.harvestScene(target, .56, true);
  assert.equal(impact.blade.x, impact.contact.x, 'the chain lands on either side');
  assert.equal(impact.blade.y, impact.contact.y);
  assert.ok(impact.chainDepth > impact.y, "the chain stays in front of the reaper in every lane");
  const hold = art.harvestScene(target, .69, true);
  assert.deepEqual(hold.blade, hold.contact, 'the hook stays planted before the soul pull');
  assert.ok(art.harvestScene(target, .76, true).extension < 1, 'the chain retracts during the soul pull');
  assert.ok(art.harvestScene(target, .69, false).extension < 1, 'a blocked hook returns without the hold');
  for (let frame = 0; frame <= 100; frame++) {
    const scene = art.harvestScene(target, frame / 100, true);
    for (const layer of ['portal', 'actor', 'chain', 'impact']) art.drawHarvest(noop, scene, layer);
    art.drawScourge(noop, target, frame / 100);
  }
}

const tiles = [];
for(let frame=0; frame<16; frame++){
  art.drawScourge({drawImage(image, x, y){tiles.push([image.src, x, y]);}}, {x: 750, y: 500}, frame/16);
}
assert.deepEqual(tiles, Array.from({length:16}, (_,i)=>[
  './assets/mana-scourge.webp', (i%4)*256, Math.floor(i/4)*256
]));
console.log('Dark spells: mana denial, Soulless timing, mirrored chain contact, and all sixteen Mana Scourge atlas frames passed.');
