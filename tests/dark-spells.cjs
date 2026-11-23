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
const harvestIndex = wizard.drawPile.indexOf('soulharvest');
if (!wizard.hand.includes('soulharvest')) {
  assert.ok(harvestIndex >= 0, 'Soul Harvest is available in the tester deck');
  for (let draw = 0; draw <= harvestIndex; draw++) {
    api.chooseCard(wizard.hand[0]);
    assert.ok(api.discardSelected());
  }
}
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

const ghoul = api.cards.find(card => card.id === 'soulghoul');
assert.equal(ghoul.damage, 320);
assert.equal(ghoul.cost, 4);
assert.equal(ghoul.accuracy, .8);
assert.equal(ghoul.school, 'dark');
api.startCardTester();
assert.ok(api.getState().units[0].hand.includes(ghoul.id));
for (const {hp, shield, lost, gain} of [
  {hp: 2000, lost: 320, gain: 160},
  {hp: 2000, shield: ['sand_warrior', 250], lost: 70, gain: 35},
  {hp: 2000, shield: ['wind_dome', 1], lost: 0, gain: 0},
  {hp: 101, lost: 101, gain: 50},
  {hp: 2000, lost: 320, gain: 11}
]) {
  const {state, caster, target} = battle();
  target.hp = hp;
  caster.hp = caster.maxHp - (gain === 11 ? 11 : 500);
  const startingHp = caster.hp;
  if (shield) api.addStatus(target, shield[0], null, shield[1]);
  const spell = cast(ghoul.id, caster, target);
  assert.equal(target.hp, hp - lost);
  assert.equal(caster.hp, startingHp, 'life is delivered later');
  Object.assign(spell, {stage: 'summon', duration: ghoul.duration, elapsed: 0});
  state.animation = spell;
  state.phase = 'resolving';
  api.advanceAction(ghoul.duration * ghoul.healAt - 1);
  assert.equal(caster.hp, startingHp);
  api.advanceAction(1);
  assert.equal(caster.hp, startingHp + gain, 'heals for half the HP lost, capped by missing HP');
  api.advanceAction(1);
  assert.equal(caster.hp, startingHp + gain, 'the same soul heals once');
}
{
  const {caster, target} = battle();
  const spell = cast(ghoul.id, caster, target, 'failed');
  assert.equal(spell.ghoulDrained, undefined);
  assert.equal(target.hp, 2000);
}

vm.runInNewContext(src('assets/soul-ghoul.js'), {
  window: ctx.window,
  Image: class { complete = true; naturalWidth = 1024; }
});
const ghoulArt = ctx.window.SoulGhoul;
{
  const {caster, target} = battle();
  const frames = new Set();
  const canvas = new Proxy({}, {get: (_target, key) => key === 'createRadialGradient'
    ? () => ({addColorStop() {}})
    : key === 'drawImage' ? (_image, x, y) => frames.add(x / 256 + y / 64)
    : () => {}});
  for (let i = 0; i < 100; i++) {
    const p = i / 100;
    const scene = ghoulArt.scene(target, caster, p, ghoul, p < ghoul.hit ? undefined : 320);
    if (scene) ghoulArt.draw(canvas, scene);
  }
  assert.equal(frames.size, 8);
  assert.equal(ghoulArt.scene(target, caster, .63, ghoul, 320), null, 'vanishes between portals');
  const outward = ghoulArt.scene(target, caster, .27, ghoul, undefined);
  const returnTrip = ghoulArt.scene(target, caster, .85, ghoul, 320);
  assert.equal(outward.unit, target);
  assert.equal(returnTrip.unit, caster);
  assert.equal(outward.dir, -returnTrip.dir, 'both appearances face the receiving wizard');
}
for (const {roll, pending, blocked, missed, feared} of [
  {roll: .249, pending: true, feared: true},
  {roll: .25, pending: true, feared: false},
  {roll: 0, pending: false, feared: false},
  {roll: 0, pending: true, blocked: true, feared: false},
  {roll: 0, pending: true, missed: true, feared: false}
]) {
  const {state, caster, target} = battle();
  const plan = {casterId: target.id, cardId: 'devil', targetId: caster.id};
  state.phase = 'resolving';
  state.sequence = [plan];
  state.queueAt = pending ? 0 : 1;
  if (blocked) api.addStatus(target, 'wind_dome', null, 1);
  api.applySpell({
    card: ghoul, source: caster.id, target: target.id, fearRoll: roll,
    action: {casterId: caster.id, targetId: target.id},
    runeResult: missed ? 'failed' : 'success', damageVariant: 1
  });
  assert.equal(target.fearRound === state.round, feared);
  assert.equal(target.statuses.some(rune => rune.kind === 'fear_turn'), feared);
  if (feared) {
    assert.equal(target.fearSource, 'Soul Ghoul');
    api.startNextAction();
    assert.ok(state.log.some(line => /loses this round's action to Soul Ghoul/.test(line)));
    assert.equal(target.statuses.some(rune => rune.kind === 'fear_turn'), false);
  }
}
console.log('Soul Ghoul: starter hand, actual HP drained, two-stage timing, barriers, overkill, misses, and all eight mirrored sprite poses passed.');
