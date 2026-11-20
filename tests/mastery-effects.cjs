const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const node={getContext:()=>({})},ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  paintUI=()=>{};'),ctx);const api=ctx.window.WIZARDRY_ARENA_TEST,B=ctx.window.WizardryBuilds;
function setup(){api.startPractice(2);const s=api.getState(),u=s.units[0],ally=s.units[1],enemy=s.units[2];u.skills={nature:20,water:20,earth:20,ice:20,fire:20,lightning:20,dark:20};for(const t of s.units){t.hp=100;t.maxHp=10000;t.statuses=[];}s.phase='resolving';return {s,u,ally,enemy};}
function cast(id,u,t,variant){const card=api.cards.find(c=>c.id===id),a={card,source:u.id,target:t.id,action:{casterId:u.id,targetId:t.id},runeResult:'success',damageVariant:variant,poisonRoll:0};api.applySpell(a);return a;}
for(const variant of [.9,1,1.1]){let {u,ally}=setup();const card=api.cards.find(c=>c.id==='estel');cast('estel',u,ally,variant);assert.equal(ally.hp,100+Math.round(card.heal*1.4));assert.equal(B.healing(card,u),Math.round(card.heal*1.4));({u,ally}=setup());cast('healingaura',u,ally,variant);assert.equal(ally.statuses.find(s=>s.kind==='healing_aura').value,280);({u,ally}=setup());cast('calming',u,ally,variant);assert.equal(ally.statuses.find(s=>s.kind==='calming_waters').value,175);}
{const {u,enemy}=setup();enemy.hp=10000;cast('scorpion',u,enemy,1.1);const poison=enemy.statuses.find(s=>s.kind==='poison');assert.equal(poison.value,50);const before=JSON.stringify(poison);cast('scorpion',u,enemy,.9);assert.equal(JSON.stringify(poison),before,'no poison refresh or overwrite');api.addStatus(enemy,'burn','',99);api.addStatus(enemy,'stun','',1);cast('gunpowderkiss',u,enemy,1);assert.deepEqual(Array.from(enemy.statuses,st=>st.kind),['poison','burn','stun','gunpowder_coat']);const shot={source:u.id,target:enemy.id,card:api.cards.find(c=>c.id==='gunpowderkiss'),stage:'tracing-auto'};api.getState().animation=shot;assert.equal(api.resolveAutoRune(),false);assert.equal(shot.stage,'rune-fail');assert.equal(api.addStatus(enemy,'static_shock','',1),false);api.consumeStatus(enemy,'poison');cast('static',u,enemy,1);assert.equal(enemy.statuses.length,4);}
{const {u,ally,enemy}=setup();cast('solidity',u,ally,1.1);assert.equal(ally.statuses.find(s=>s.kind==='solidity').value,.25);cast('static',u,enemy,1.1);assert.equal(enemy.statuses.find(s=>s.kind==='static_shock').value,.30);}
for(const variant of [.9,1,1.1]){const {u,enemy}=setup();enemy.hp=10000;const a={card:api.cards.find(c=>c.id==='vampire'),source:u.id,target:enemy.id,runeResult:'success',damageVariant:variant};api.applyVampDamage(a);api.applyVampHeal(a);assert.equal(u.hp,485,'Vampire healing scales with mastery, without damage variance');}
console.log('Mastery effects: fixed boosted direct/periodic healing, boosted poison with captured damage variant, no debuff refresh/coexistence, reapply after expiry, unchanged percentage effects passed.');
{
  const {s,u,enemy}=setup();
  u.skills.dark=20;
  enemy.hp=450;
  cast('soul',u,enemy,1.1);
  api.addStatus(enemy,'decay_mark',null,.20);
  s.round++;
  api.tickBurnsForRound();
  assert.equal(enemy.hp,350,'Soul Drain deals flat damage through Decay of Strength');
  assert.equal(u.hp,200,'Soul Drain heals by the actual HP drained');
  assert.ok(enemy.statuses.some(st=>st.kind==='decay_mark'));
}
{
  const {u,ally,enemy}=setup();
  u.hp=ally.hp=enemy.hp=5000;
  cast('frozentouch',u,ally,1);
  cast('frozentouch',enemy,u,1);
  assert.ok(!u.statuses.some(st=>st.kind==='frozen_touch'),'enemies cannot receive the shield');
  cast('devil',enemy,ally,1);
  assert.ok(ally.hp<5000,'Fire bypasses Frozen Touch');
  const afterFire=ally.hp;
  cast('volt',enemy,ally,1);
  assert.ok(ally.hp<afterFire,'Lightning bypasses Frozen Touch');
  assert.ok(ally.statuses.some(st=>st.kind==='frozen_touch'));
  const hp=ally.hp;
  cast('darksorcerer',enemy,ally,1);
  assert.equal(ally.hp,hp,'the shield protects the recipient');
  assert.ok(u.hp<5000,'unshielded allies take damage from the same cast');
  assert.ok(!ally.statuses.some(st=>st.kind==='frozen_touch'));
  cast('scorpion',enemy,ally,1);
  assert.ok(ally.hp<hp,'subsequent spells deal damage');
  cast('frozentouch',u,u,1);
  assert.ok(u.statuses.some(st=>st.kind==='frozen_touch'),'self casting applies the shield');
}
