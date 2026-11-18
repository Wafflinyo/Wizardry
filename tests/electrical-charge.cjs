const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const node = { getContext: () => ({}) };
const ctx = { window: {}, Image: class { naturalWidth=1024; naturalHeight=1024; }, document: { getElementById: () => node }, requestAnimationFrame() {} };
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js', 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync('arena.js', 'utf8').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  paintUI=()=>{};window.chargeTest={damage,applyZeusImpact,applyZeusChain};'
), ctx);
const api = ctx.window.WIZARDRY_ARENA_TEST;
const { damage, applyZeusImpact, applyZeusChain } = ctx.window.chargeTest;
const card = id => api.cards.find(spell => spell.id === id);
const charge = card('electricalcharge');
const builds = ctx.window.WizardryBuilds;

assert.equal(charge.selfOnly, true);
const deck = builds.makeDeck(api.cards, ['water', 'lightning'], () => .99);
assert.ok(deck.includes(charge.id));
const profile = { name: 'Charge Tester', level: 20, masteries: ['water', 'lightning'], skills: {}, deck };
api.configureProfile(profile);
const backendCards = JSON.parse(fs.readFileSync('backend/cards.json', 'utf8'));
assert.equal(builds.normalize(profile, backendCards).deck.length, 24);
api.startPractice(4);
const s = api.getState();
const [user, ally] = s.units.filter(u => u.team === 0);
const [enemy, otherEnemy] = s.units.filter(u => u.team === 1);
const status = u => u.statuses.find(st => st.kind === 'electrical_charge');
const cast = (caster, target, id, runeResult = 'success') => ({
  source: caster.id, target: target.id, action: { casterId: caster.id, targetId: target.id },
  card: card(id), runeResult, damageVariant: 1
});
if(!user.hand.includes(charge.id)){
  user.drawPile.splice(user.drawPile.indexOf(charge.id),1,user.hand[0]);
  user.hand[0]=charge.id;
}
api.chooseCard(charge.id);
assert.equal(s.selectedTarget, user.id);
api.selectTarget(ally.id);
assert.equal(s.selectedTarget, user.id);

user.mana = 5;
api.applySpell(cast(user, user, charge.id));
assert.equal(user.mana, 5, 'setup does not charge itself');
assert.equal(status(user).expiresRound, 5);
s.round = 2;
api.applySpell(cast(user, user, charge.id));
assert.equal(status(user).expiresRound, 6, 'recast refreshes');
api.applySpell(cast(user, ally, charge.id));
assert.equal(status(ally), undefined);

api.applySpell(cast(enemy, user, 'volt', 'failed'));
assert.equal(user.mana, 5);
api.applySpell(cast(enemy, user, 'static'));
assert.equal(user.mana, 6, 'a successful Lightning curse reaches the charged wizard');
assert.ok(user.statuses.some(st => st.kind === 'static_shock'), 'two distinct debuffs coexist');
api.applySpell(cast(user, user, 'rod'));
assert.equal(user.mana, 7, 'later self-cast Lightning counts');
damage(enemy, user, 1, card('golem'));
assert.equal(user.mana, 7);
const lightning = cast(enemy, user, 'thunder');
damage(enemy, user, 1, lightning.card, lightning);
damage(enemy, user, 1, lightning.card, lightning);
assert.equal(user.mana, 8, 'one mana even across repeated damage from the same spell');

api.applySpell(cast(ally, ally, charge.id));
ally.mana = 5;
const zeus = cast(enemy, user, 'zeus');
assert.equal(applyZeusImpact(zeus, 1), true);
const chain = zeus.zeusChainTargets.find(entry => entry.id === ally.id);
assert.ok(chain && applyZeusChain(zeus, chain, 1));
assert.equal(user.mana, 9);
assert.equal(ally.mana, 6, 'a chain hit grants mana to each charged wizard it reaches');

api.applyLightningRod(otherEnemy);
api.recordLightningRodCast(otherEnemy, card('volt'));
const rod = otherEnemy.statuses.find(st => st.kind === 'lightning_rod');
rod.expiresRound = s.round;
api.expireLightningRods();
assert.equal(user.mana, 10, 'delayed discharge counts as Lightning');

api.applySpell(cast(user, user, 'winddome'));
const hp = user.hp;
damage(enemy, user, 100, card('thunder'), cast(enemy, user, 'thunder'));
assert.equal(user.hp, hp, 'charge does not change damage or shields');
assert.equal(user.mana, 11, 'a blocked spell still reaches the wizard');
user.mana = user.maxMana;
damage(enemy, user, 1, card('thunder'));
assert.equal(user.mana, user.maxMana);
user.mana = 4;
s.round = 4;
damage(enemy, user, 1, card('thunder'));
assert.equal(user.mana, 5, 'active through the third following round');
s.round = 6;
api.tickBurnsForRound();
assert.equal(status(user), undefined);
damage(enemy, user, 1, card('thunder'));
assert.equal(user.mana, 5, 'no mana after expiry');
api.applySpell(cast(user, user, charge.id));
assert.ok(status(user), 'can cast again after expiry');
vm.runInNewContext(fs.readFileSync('assets/electrical-charge.js','utf8'),ctx);
const fx=ctx.window.WIZARDRY_ELECTRICAL_CHARGE,draws=[];
const canvas=new Proxy({globalAlpha:1, drawImage:(...args)=>draws.push(args), createRadialGradient:()=>({addColorStop(){}})},{
  get:(object,key)=>key in object?object[key]:(()=>{})
});
for(let i=0;i<=100;i++)fx.draw(canvas,{target:{x:225,y:520},progress:i/100});
assert.equal(new Set(draws.map(([,sx,sy])=>sx+','+sy)).size,16,'the caster aura plays all sixteen frames');
fx.emblem(canvas,0,0,32);
fx.portrait(canvas,220,160);
assert.ok(draws.every(([asset,sx,sy,sw,sh])=>asset.src.endsWith('electrical-charge-v151.webp')&&sx+sw<=1024&&sy+sh<=1024));
console.log('Electrical Charge: legal starting-hand card, self debuff, non-stacking, spell/chain/discharge reactions, blocks, cap and expiry passed.');
