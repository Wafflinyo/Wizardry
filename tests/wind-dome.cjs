const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let source=fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  window.test={set:s=>state=s,damage,resolveAutoRune,describeStatus,targetsFor,applyVampDamage,applyVampHeal}; paintUI=()=>{}; finishRound=()=>{state.phase="finished";};');
const math=Object.create(Math),node={getContext:()=>({})},context={Image:class{},window:{},document:{getElementById:()=>node},requestAnimationFrame:()=>{},console,Math:math};
vm.runInNewContext(source,context);const api=context.window.WIZARDRY_ARENA_TEST,test=context.window.test,card=id=>api.cards.find(c=>c.id===id);
function unit(id,team){return{id,team,index:0,name:id,hp:2000,maxHp:2000,mana:10,hand:[],drawPile:[],discardPile:[],statuses:[],x:team?800:200,y:450};}
let s;function battle(){s={units:[unit('a',0),unit('b',1),unit('c',1)],humanByTeam:{0:'a'},round:1,phase:'resolving',plans:{},sequence:[],queueAt:0,auras:{},log:[],flashes:[]};test.set(s);return s;}
function action(id,source='a',target='b'){const c=card(id);return{card:c,source,target,action:{casterId:source,targetId:target},stage:'summon',duration:c.duration,elapsed:0,runeResult:'success'};}
function dome(u){api.applySpell(action('winddome',u.id,u.id));}
function has(u,kind='wind_dome'){return u.statuses.some(st=>st.kind===kind);}
assert.equal(card('winddome').school,'wind');assert.equal(card('winddome').selfOnly,true);assert.equal(api.featuredCard,'penguins');assert.equal(api.cards.filter(c=>c.school==='wind').length,4);
battle();api.startHand(s.units[0],true);assert.equal(s.units[0].hand.length,5);assert.ok(s.units[0].hand.includes('penguins'));assert.deepEqual(Array.from(test.targetsFor(card('winddome'),s.units[0]),u=>u.id),['a']);
// Recasting leaves exactly one ward on the caster, regardless of a stale target.
api.applySpell(action('winddome','a','b'));dome(s.units[0]);assert.equal(s.units[0].statuses.filter(st=>st.kind==='wind_dome').length,1);assert.equal(has(s.units[1]),false);
api.applySpell(action('centaur','b','a'));assert.equal(s.units[0].hp,2000,'entire arrow is blocked, including lethal damage');assert.equal(has(s.units[0]),false);api.applySpell(action('devil','b','a'));assert.equal(s.units[0].hp,1750,'next separate spell deals normal damage');
// The charge covers all three independently timed slashes, not just the first hit.
battle();dome(s.units[1]);const slashes=action('ronin');for(let i=0;i<3;i++)api.applyRoninHit(slashes,i);assert.equal(s.units[1].hp,2000);assert.equal(s.windDomeBursts.length,1);api.applySpell(action('centaur'));assert.equal(s.units[1].hp,1350);
// Area damage and on-hit poison resolve independently for each enemy.
battle();dome(s.units[1]);const bloom=action('bloom');bloom.poisonRolls={b:0,c:0};api.applySpell(bloom);assert.equal(s.units[1].hp,2000);assert.equal(has(s.units[1],'poison'),false);assert.equal(s.units[2].hp,1900);assert.equal(has(s.units[2],'poison'),true);
for(const kind of ['burn','frostbite','poison','soul_drain']){battle();dome(s.units[1]);s.units[1].statuses.push({kind,value:50,remaining:3,appliedRound:1,lastTickRound:1,sourceId:'a'});s.round=2;api.tickBurnsForRound();assert.equal(s.units[1].hp,1950,kind+' bypasses');assert.ok(has(s.units[1]),kind+' preserves the shield');}
// Misses do not consume a shield; Static Shock's backlash still hurts its owner.
battle();dome(s.units[0]);s.units[0].statuses.push({kind:'static_shock',value:.30,expiresRound:4});s.animation={...action('centaur'),stage:'tracing-auto',traceMs:100};math.random=()=>.99;test.resolveAutoRune();assert.equal(s.animation.runeResult,'failed');assert.equal(s.units[0].hp,1900);assert.ok(has(s.units[0]));
// A blocked attack cannot apply any on-hit curse or crowd control.
for(const id of ['scorpion','undead','octo','volt']){battle();dome(s.units[1]);s.sequence=[{casterId:'b'}];const a=action(id);a.poisonRoll=0;a.fearRoll=0;a.flinchRoll=0;math.random=()=>0;api.applySpell(a);assert.equal(s.units[1].hp,2000,id);assert.equal(s.units[1].statuses.length,0,id+' has no on-hit status');assert.equal(s.units[1].fearRound,undefined);assert.equal(s.units[1].flinchRound,undefined);assert.equal(s.units[1].stunRound,undefined);}
for(const [id,apply] of [['frosty',a=>api.applyFrostyImpact(a,0)],['arrows',a=>api.applyRainHit(a,{id:'b'},0)],['dragon',a=>api.applyDragonImpact(a,0)],['reaper',a=>api.applyReaperStrike(a)]]){battle();dome(s.units[1]);apply(action(id));assert.equal(s.units[1].hp,2000,id);assert.equal(s.units[1].statuses.length,0,id+' cannot attach a blocked debuff');}
// A protected splash recipient is independent from an unprotected main target.
battle();s.units[1].index=0;s.units[2].index=1;dome(s.units[2]);const dragon=action('dragon');api.applyDragonImpact(dragon,1);api.applyDragonSplashHit(dragon,'c');assert.equal(s.units[1].hp,1350);assert.equal(s.units[2].hp,2000);
// Other defensive marks survive a full evasion; no fake 1 HP minimum damage.
battle();dome(s.units[1]);s.units[1].hp=1;s.units[1].statuses.push({kind:'solidity',value:.25},{kind:'decaying_strength',value:.2},{kind:'freezing_temps',value:.5});api.applySpell(action('bear'));assert.equal(s.units[1].hp,1);for(const kind of ['solidity','decaying_strength','freezing_temps'])assert.ok(has(s.units[1],kind));
// No health drained means no vampire healing.
battle();dome(s.units[1]);s.units[0].hp=1000;const vampire=action('vampire');test.applyVampDamage(vampire);test.applyVampHeal(vampire);assert.equal(s.units[1].hp,2000);assert.equal(s.units[0].hp,1000);
// The real generic cast timeline grants the shield exactly once, then completes.
battle();s.animation=action('winddome','a','a');api.advanceAction(card('winddome').duration*card('winddome').hit-1);assert.equal(has(s.units[0]),false);api.advanceAction(1);assert.ok(has(s.units[0]));api.advanceAction(5000);assert.equal(s.animation,null);assert.match(test.describeStatus(s.units[0],s.units[0].statuses[0]).detail,/debuffs/);
console.log('Wind Dome: self-only, opening hand, one whole spell/multi-hit block, AoE isolation, debuff bypass, misses, on-hit prevention, lifesteal, other wards and cast completion passed.');
