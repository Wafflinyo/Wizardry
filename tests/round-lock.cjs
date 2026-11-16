const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let source=fs.readFileSync('arena.js','utf8');
source=source.replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  window.test={set:s=>state=s,runResolution,startNextAction,updateCastSequence,resolveAutoRune}; paintUI=()=>{}; finishRound=()=>{state.phase="finished";};');
const node={getContext:()=>({})};
const context={Image:class {},window:{},document:{getElementById:()=>node},requestAnimationFrame:()=>{},console};
vm.runInNewContext(source,context);
const api=context.window.test,cards=context.window.WIZARDRY_ARENA_TEST.cards;
const card=cards.find(c=>c.target==='enemy');assert.ok(card);
function unit(id,team,hp=1000){return {id,team,hp,maxHp:1000,mana:10,hand:[card.id],drawPile:[],discardPile:[],statuses:[],speed:10,x:0,y:0};}
function battle(){return {units:[unit('human',0),unit('cpu',1),unit('other',1)],humanByTeam:{0:'human'},plans:{},phase:'planning',round:1,log:[],flashes:[],mode:'story'};}
let s=battle();api.set(s);api.runResolution();assert.equal(s.phase,'planning','wait for human lock');
s=battle();s.plans.human={casterId:'human',cardId:card.id,targetId:'cpu',team:0};api.set(s);api.runResolution();
assert.equal(s.phase,'resolving');assert.equal(Object.keys(s.plans).length,3,'all CPU choices exist before first cast');assert.ok(Object.isFrozen(s.sequence));assert.ok(s.sequence.every(Object.isFrozen));
const locked=s.sequence.map(p=>p.targetId);s.units[1].hp=0;assert.deepEqual(s.sequence.map(p=>p.targetId),locked);
s=battle();s.units[1].hp=0;s.phase='resolving';s.sequence=[{casterId:'human',cardId:card.id,targetId:'cpu'}];s.queueAt=0;api.set(s);api.startNextAction();assert.equal(s.animation,undefined,'no cast against another foe');assert.equal(s.units[2].hp,1000);assert.equal(s.units[0].mana,10-card.cost);assert.match(s.log[0],/fails/);
console.log('Round lock-in and defeated-target regression checks passed.');

const bear=cards.find(c=>c.id==='bear');assert.equal(bear.damage,460);
assert.equal(context.window.WIZARDRY_ARENA_TEST.featuredCard,'rod');
s=battle();s.auras={};s.phase='resolving';s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:bear,stage:'bear-appear',elapsed:0,duration:650,runeResult:'success'};api.set(s);
for(const [stage,duration] of [['bear-appear',650],['bear-roar',950],['bear-ready',260],['bear-charge',800]]){
 assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,1000);api.updateCastSequence(duration);
}
assert.equal(s.animation.stage,'bear-claw');api.updateCastSequence(240);assert.equal(s.units[1].hp,1000);
api.updateCastSequence(20);assert.equal(s.units[1].hp,540);api.updateCastSequence(290);
assert.equal(s.animation.stage,'bear-disperse');assert.equal(s.units[1].hp,540);
api.updateCastSequence(650);assert.equal(s.animation.stage,'lowering');assert.equal(s.units[1].hp,540);
console.log('Ice bear sequence, opening hand and single 460-damage contact passed.');

vm.runInNewContext(fs.readFileSync('assets/polar-bear-v67.js','utf8'),context);
const polar=context.window.WIZARDRY_POLAR_BEAR_V67;
for(const target of [{x:175,y:340},{x:341,y:508},{x:667,y:315},{x:831,y:488}]){
 const opts={stage:'bear-claw',progress:.5,target};
 assert.equal(polar.depthFor(opts,'actor'),target.y,'body sorts behind target at same depth');
 assert.ok(polar.depthFor(opts,'claw')>target.y,'claw contact overlays target');
 assert.ok(polar.depthFor(opts,'claw')<target.y+1,'contact does not overlay nearer fighters');
 const start=polar.pose({...opts,stage:'bear-charge',progress:0});
 const end=polar.pose({...opts,stage:'bear-charge',progress:1});
 assert.equal(start.y,425);assert.equal(end.y,target.y+8);
}
console.log('Bear layering checks passed for both sides and front/back targets.');



assert.equal(cards.some(c=>c.id==='pistol'||c.id==='cobra'),false,'removed spells cannot enter any deck');
const shark=cards.find(c=>c.id==='shark');assert.equal(shark.damage,480);assert.equal(shark.accuracy,.90);
const opening=unit('test',0);context.window.WIZARDRY_ARENA_TEST.startHand(opening,true);assert.equal(opening.hand.length,5);assert.ok(opening.hand.includes('rod'));
function sharkBattle(statuses=[]){const result=battle();result.auras={};result.units[0].statuses=statuses;result.phase='resolving';result.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:shark,stage:'shark-fin',elapsed:0,duration:1100,runeResult:'success'};api.set(result);return result;}
s=sharkBattle();
for(const [stage,ms] of [['shark-fin',1100],['shark-swim',1500],['shark-submerge',350],['shark-rise',650],['shark-flop',500],['shark-arch',550]]){
 assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,1000);api.updateCastSequence(ms);
}
assert.equal(s.animation.stage,'shark-chomp');api.updateCastSequence(179);assert.equal(s.units[1].hp,1000);api.updateCastSequence(1);assert.equal(s.units[1].hp,520);assert.equal(s.units[2].hp,1000);
api.updateCastSequence(520);api.updateCastSequence(450);assert.equal(s.units[1].hp,520);assert.equal(s.animation.stage,'lowering');
s=sharkBattle();s.animation.stage='rune-fail';s.animation.duration=100;s.animation.runeResult='failed';api.updateCastSequence(100);assert.equal(s.units[1].hp,1000);assert.equal(s.animation.stage,'lowering');
vm.runInNewContext(fs.readFileSync('assets/reef-rush-v77.js','utf8'),context);const reef=context.window.WIZARDRY_REEF_RUSH_V77;
for(const target of [{x:175,y:340},{x:341,y:508},{x:667,y:315},{x:831,y:488}]){
 const opts={target};
 const start=reef.pose({...opts,stage:'shark-rise',progress:0}),rise=reef.pose({...opts,stage:'shark-rise',progress:1});
 assert.ok(start.y-rise.y>Math.abs(start.x-rise.x),'breach travels predominantly upward');
 for(const [a,b] of [['shark-rise','shark-flop'],['shark-flop','shark-arch'],['shark-arch','shark-chomp'],['shark-chomp','shark-dive']]){
  const end=reef.pose({...opts,stage:a,progress:1}),next=reef.pose({...opts,stage:b,progress:0});
  for(const key of ['x','y','angle'])assert.ok(Math.abs(end[key]-next[key])<.00001,`${a} connects continuously to ${b}: ${key}`);
 }
 const apex=reef.pose({...opts,stage:'shark-flop',progress:.5}),landing=reef.pose({...opts,stage:'shark-arch',progress:1});
 assert.ok(landing.y>apex.y,'shark arches down from apex');
 assert.equal(reef.pose({...opts,stage:'shark-splash',progress:1}).alpha,0);
 assert.equal(reef.pose({...opts,stage:'shark-submerge',progress:1}).height,0,'fin disappears before breach');
 assert.ok(reef.pose({...opts,stage:'shark-dive',progress:1}).y>target.y+120,'body dives below floor');
}
console.log('Reef Rush: continuous angled breach, mirrored targets, 480-damage chomp, splash disappearance and miss checks passed.');


// Swim path and heading mirror toward the chosen side before breaching.
for(const p of [0,.25,.5,.75,1]){
 const right=reef.pose({stage:'shark-swim',progress:p,target:{x:831,y:488}});
 const left=reef.pose({stage:'shark-swim',progress:p,target:{x:169,y:488}});
 assert.ok(Math.abs(right.x+left.x-1000)<1e-9,'circular paths mirror horizontally');
 assert.ok(Math.abs(right.y-left.y)<1e-9,'mirrored swim keeps the same floor depth');
}
for(const x of [169,831]){
 const target={x,y:488},swim=reef.pose({stage:'shark-swim',progress:1,target}),dip=reef.pose({stage:'shark-submerge',progress:0,target});
 assert.ok((-Math.sin(swim.theta)*swim.dir)*swim.dir>.99,'fin finishes pointing toward target side');
 for(const key of ['x','y','theta'])assert.ok(Math.abs(swim[key]-dip[key])<1e-9,'submerge preserves final heading');
 assert.equal(reef.pose({stage:'shark-rise',progress:0,target}).dir,swim.dir,'breach faces the same side as fin');
}
console.log('Enemy shark reverse swim, trailing wake and target-facing breach checks passed.');

const thunder=cards.find(c=>c.id==='thunder');assert.equal(thunder.damage,550);assert.equal(thunder.accuracy,.75);
s=battle();s.auras={};s.phase='resolving';s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:thunder,stage:'thunder-form',elapsed:0,duration:700,runeResult:'success'};api.set(s);
for(const [stage,ms] of [['thunder-form',700],['thunder-spread',650],['thunder-clap',140]]){
 assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,1000);api.updateCastSequence(ms);
}
assert.equal(s.animation.stage,'thunder-bolt');api.updateCastSequence(319);assert.equal(s.units[1].hp,1000);
api.updateCastSequence(1);assert.equal(s.units[1].hp,450);assert.equal(s.units[2].hp,1000);
api.updateCastSequence(650);api.updateCastSequence(600);assert.equal(s.units[1].hp,450);assert.equal(s.animation.stage,'lowering');
s=battle();s.auras={};s.phase='resolving';s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:thunder,stage:'rune-fail',elapsed:0,duration:100,runeResult:'failed'};api.set(s);api.updateCastSequence(100);assert.equal(s.units[1].hp,1000);assert.equal(s.animation.stage,'lowering');
vm.runInNewContext(fs.readFileSync('assets/thunderclap-v79.js','utf8'),context);
const cloud=context.window.WIZARDRY_THUNDERCLAP_V79;
for(const target of [{x:175,y:340},{x:831,y:488}]){
 const opts={stage:'thunder-bolt',progress:.5,target},b=cloud.pose(opts);
 assert.ok(Math.abs(b.x-500)<=9,'clap thrust stays centered');assert.equal(cloud.pose({...opts,stage:'thunder-form'}).x,500);assert.equal(b.y,425);assert.equal(b.dir,target.x>500?1:-1);
 assert.deepEqual(cloud.path(opts,0),b.source);
 assert.ok(Math.abs(cloud.crescent(opts,1,.5).x-target.x)<1e-9);assert.ok(Math.abs(cloud.crescent(opts,1,.5).y-(target.y-105))<1e-9);
 assert.equal(cloud.pose({...opts,stage:'thunder-bolt',progress:1}).frame,7,'holds closed clap while wave travels');assert.equal(cloud.pose({...opts,stage:'thunder-impact',progress:1}).frame,7,'holds closed clap through impact');
 const top=cloud.crescent(opts,.5,0),mid=cloud.crescent(opts,.5,.5),bottom=cloud.crescent(opts,.5,1);assert.ok((mid.x-top.x)*b.dir>30);assert.ok(Math.abs(top.x-bottom.x)<1e-9);assert.ok(bottom.y-top.y>140,'parenthesis has broad vertical sweep');
 assert.equal(cloud.pose({...opts,stage:'thunder-dissolve',progress:1}).alpha,0);
}
console.log('Thunderclap: featured opening card, 550 damage once on bolt arrival, 75% accuracy, miss, mirrored arc and dissolve passed.');

const hold={stage:'thunder-impact',progress:.5,target:{x:831,y:488}};
assert.notDeepEqual(cloud.lowerWarp({...hold,time:1900},.5),cloud.lowerWarp({...hold,time:2150},.5),'lower cloud moves while hands remain held');
assert.equal(cloud.pose({...hold,time:1900}).frame,cloud.pose({...hold,time:2150}).frame,'held upper-body pose stays fixed');
assert.equal(cloud.clock({stage:'thunder-clap',progress:1}),cloud.clock({stage:'thunder-bolt',progress:0}),'swirl clock continuous across clap and bolt');
assert.equal(cloud.clock({stage:'thunder-bolt',progress:1}),cloud.clock({stage:'thunder-impact',progress:0}),'swirl clock continuous across bolt and impact');
console.log('Continuous cloud swirl and stationary held hands passed.');

const arrows=cards.find(c=>c.id==='arrows');assert.equal(arrows.damage,150);assert.equal(arrows.burnChance,.10);assert.equal(arrows.target,'all_enemies');
s=battle();s.auras={};s.phase='resolving';const victims=s.units.filter(u=>u.team===1).map(u=>({id:u.id,x:u.x,y:u.y,hit:false}));
s.animation={source:'human',target:null,action:{casterId:'human',targetId:null},card:arrows,runeResult:'success',stage:'rain-form',elapsed:0,duration:650,rainTargets:victims};api.set(s);
api.updateCastSequence(650);assert.equal(s.animation.stage,'rain-barrage');api.updateCastSequence(439);assert.equal(s.units[1].hp,1000);api.updateCastSequence(1);assert.equal(s.units[1].hp,850);assert.equal(s.units[2].hp,1000);
api.updateCastSequence(55);assert.equal(s.units[2].hp,850);api.updateCastSequence(1305);assert.equal(s.animation.stage,'rain-fade');assert.equal(s.units[1].hp,850);assert.equal(s.units[2].hp,850);assert.equal(s.units[0].hp,1000);assert.equal(s.units[0].statuses.some(st=>st.kind==='tailwind'),false);
api.updateCastSequence(450);assert.equal(s.animation.stage,'lowering');
s=battle();s.auras={};api.set(s);const rainAnim={source:'human',card:arrows,runeResult:'success'};const hit1={id:'cpu',hit:false},hit2={id:'other',hit:false};
const rainHit=context.window.WIZARDRY_ARENA_TEST.applyRainHit;
assert.equal(rainHit(rainAnim,hit1,.099),true);assert.equal(rainHit(rainAnim,hit2,.10),true);assert.equal(s.units[1].hp,850);assert.equal(s.units[2].hp,850);
assert.ok(s.units[1].statuses.some(st=>st.kind==='burn'&&st.remaining===3));assert.equal(s.units[2].statuses.some(st=>st.kind==='burn'),false);
assert.equal(rainHit(rainAnim,hit1,0),false);assert.equal(s.units[1].hp,850,'extra arrows cannot repeat damage');
s.units[2].hp=0;assert.equal(rainHit(rainAnim,{id:'other'},0),false,'defeated targets fail without retargeting');
assert.equal(rainHit({...rainAnim,runeResult:'failed'},{id:'cpu'},0),false,'failed cast causes no damage or burn');assert.equal(s.units[1].hp,850);
vm.runInNewContext(fs.readFileSync('assets/flaming-arrows-v80.js','utf8'),context);const rainFx=context.window.WIZARDRY_FLAMING_ARROWS_V80;
const streams=rainFx.items({stage:'rain-barrage',progress:.4,targets:[{x:650,y:340},{x:820,y:470}]});assert.ok(streams.filter(x=>x.type==='arrow').length>2,'multiple arrows cover each wizard');
assert.ok(streams.filter(x=>x.type==='arrow').every(x=>x.end.y>x.start.y),'arrows rain diagonally downward');
console.log('Flaming Arrows: one 150 hit per enemy, independent 10% burn, no friendly fire/tailwind, defeated-target failure and multi-arrow barrage passed.');

const ronin=cards.find(c=>c.id==='ronin');assert.equal(ronin.damage,150);assert.equal(ronin.accuracy,.8);
s=battle();s.auras={};s.phase='resolving';s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:ronin,runeResult:'success',stage:'ronin-drop',elapsed:0,duration:450,slashHits:[]};api.set(s);
for(const [stage,d] of [['ronin-drop',450],['ronin-land',300],['ronin-reach',1000],['ronin-draw',120]]){assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,1000);api.updateCastSequence(d);}
api.updateCastSequence(259);assert.equal(s.units[1].hp,1000);api.updateCastSequence(1);assert.equal(s.units[1].hp,850);api.updateCastSequence(135);assert.equal(s.units[1].hp,700);api.updateCastSequence(135);assert.equal(s.units[1].hp,550);api.updateCastSequence(230);assert.equal(s.units[1].hp,550);assert.equal(s.units[2].hp,1000);assert.equal(s.animation.stage,'ronin-finish');
const roninHit=context.window.WIZARDRY_ARENA_TEST.applyRoninHit;
s=battle();s.auras={};s.units[1].hp=200;api.set(s);const sword={source:'human',target:'cpu',card:ronin,runeResult:'success',slashHits:[]};assert.equal(roninHit(sword,0),true);assert.equal(s.units[1].hp,50);assert.equal(roninHit(sword,1),true);assert.equal(s.units[1].hp,0);assert.equal(roninHit(sword,2),false);assert.equal(s.units[2].hp,1000,'no retarget after defeat');assert.equal(roninHit(sword,0),false,'cannot repeat a slash');
s=battle();s.auras={};api.set(s);assert.equal(roninHit({...sword,runeResult:'failed',slashHits:[]},0),false);assert.equal(s.units[1].hp,1000);
console.log('Wind Slashes: featured hand, deliberate draw, three timed 150 hits, 80% accuracy, no duplicate damage or retarget after defeat passed.');

const reaperCard=cards.find(c=>c.id==='reaper');assert.equal(reaperCard.damage,950);
s=battle();s.auras={};s.phase='resolving';s.units[1].hp=2000;s.units[1].maxHp=2000;s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:reaperCard,runeResult:'success',stage:'reaper-circle',elapsed:0,duration:650};api.set(s);
for(const [stage,d] of [['reaper-circle',650],['reaper-rise',850],['reaper-windup',550],['reaper-lunge',320]]){assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,2000);api.updateCastSequence(d);}
api.updateCastSequence(167);assert.equal(s.units[1].hp,2000);api.updateCastSequence(1);assert.equal(s.units[1].hp,1050);assert.ok(s.units[1].statuses.some(st=>st.kind==='decaying_strength'&&st.value===.2));api.updateCastSequence(252);assert.equal(s.units[1].hp,1050,'scythe hits once');
const marked=s.units[1],slashCast={source:'human',target:'cpu',card:ronin,runeResult:'success',slashHits:[]};
for(let i=0;i<3;i++)roninHit(slashCast,i);assert.equal(marked.hp,510,'all three hits get +20%: 1050 - 540');assert.equal(marked.statuses.some(st=>st.kind==='decaying_strength'),false);
const nextSlash={source:'human',target:'cpu',card:ronin,runeResult:'success',slashHits:[]};roninHit(nextSlash,0);assert.equal(marked.hp,360,'following spell has no old bonus');
const reaperHit=context.window.WIZARDRY_ARENA_TEST.applyReaperStrike;
s=battle();s.auras={};s.units[1].hp=5000;s.units[1].maxHp=5000;api.set(s);const reap=()=>({source:'human',target:'cpu',card:reaperCard,runeResult:'success'});
assert.equal(reaperHit(reap()),true);assert.equal(s.units[1].hp,4050);assert.equal(reaperHit(reap()),true);assert.equal(s.units[1].hp,2910);assert.equal(s.units[1].statuses.filter(st=>st.kind==='decaying_strength').length,1,'refreshes, never stacks');
assert.equal(reaperHit({...reap(),runeResult:'failed'}),false);assert.ok(s.units[1].statuses.some(st=>st.kind==='decaying_strength'),'miss leaves debuff');
context.window.WIZARDRY_ARENA_TEST.applySpell({action:{casterId:'cpu',targetId:'cpu'},card:cards.find(c=>c.id==='estel')});assert.ok(s.units[1].statuses.some(st=>st.kind==='decaying_strength'),'healing leaves debuff');
s.units[1].statuses.push({kind:'burn',value:50,remaining:3,appliedRound:0,lastTickRound:0});s.round=1;context.window.WIZARDRY_ARENA_TEST.tickBurnsForRound();assert.ok(s.units[1].statuses.some(st=>st.kind==='decaying_strength'),'burn tick leaves debuff');
const area={source:'human',card:arrows,runeResult:'success'};const before=s.units[1].hp;rainHit(area,{id:'cpu'},1);rainHit(area,{id:'other'},1);assert.equal(s.units[1].hp,before-180);assert.equal(s.units[2].hp,850,'other AOE victim receives no decay bonus');
s.units[1].hp=0;assert.equal(reaperHit(reap()),false);assert.equal(s.units[2].hp,850,'Reaper never retargets a defeated foe');
console.log('Reaper: 950 once, next-spell +20% across all hits, non-stacking refresh, misses/heals/burn preservation and target isolation passed.');

const benderCard=cards.find(c=>c.id==='bender');assert.equal(benderCard.damage,540);
s=battle();s.auras={};s.phase='resolving';s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:benderCard,runeResult:'success',stage:'bender-appear',elapsed:0,duration:550};api.set(s);
for(const [stage,d] of [['bender-appear',550],['bender-stance',500],['bender-stomp',850],['bender-wall',650],['bender-punch',250]]){assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,1000);api.updateCastSequence(d);}
assert.equal(s.animation.stage,'bender-barrage');api.updateCastSequence(89);assert.equal(s.units[1].hp,1000);api.updateCastSequence(1);assert.equal(s.units[1].hp,460);api.updateCastSequence(460);assert.equal(s.units[1].hp,460);assert.equal(s.units[2].hp,1000,'stone barrage is single-target');assert.equal(s.animation.stage,'bender-exit');
const benderHit=context.window.WIZARDRY_ARENA_TEST.applyBenderStrike;
assert.equal(benderHit(s.animation),false,'cosmetic debris cannot repeat damage');
s=battle();s.auras={};api.set(s);s.units[1].hp=0;assert.equal(benderHit({source:'human',target:'cpu',card:benderCard,runeResult:'success'}),false);assert.equal(s.units[2].hp,1000,'no retargeting');
s.units[1].hp=1000;assert.equal(benderHit({source:'human',target:'cpu',card:benderCard,runeResult:'failed'}),false);assert.equal(s.units[1].hp,1000);
s.units[1].statuses.push({kind:'decaying_strength',value:.2});assert.equal(benderHit({source:'human',target:'cpu',card:benderCard,runeResult:'success'}),true);assert.equal(s.units[1].hp,352,'Decaying Strength boosts entire barrage to 648 once');
vm.runInNewContext(fs.readFileSync('assets/stone-bender-v83.js','utf8'),context);const stoneFx=context.window.WIZARDRY_STONE_BENDER_V83;
assert.equal(stoneFx.pose({stage:'bender-appear',progress:1}).frame,0,'starts arms crossed');assert.equal(stoneFx.pose({stage:'bender-stomp',progress:.5}).frame,3,'stomp uses the original forward-leg stance without swapping legs');assert.equal(stoneFx.stompFrame({stage:'bender-stomp',progress:.5}),3,'dedicated high bent-knee pose');assert.equal(stoneFx.stompFrame({stage:'bender-stomp',progress:.7}),5,'dedicated grounded impact pose');assert.equal(stoneFx.pose({stage:'bender-wall',progress:1}).wall,1,'full rectangular wall before punch');
assert.ok(stoneFx.items({stage:'bender-barrage',progress:.15,target:{x:800,y:450}}).filter(i=>i.type==='rock').length>20,'wall breaks into many rocks');
console.log('Stone Bender: crossed arms, raised-foot stomp, wall then punch, one 540 barrage, decay interaction and no miss/KO retarget damage passed.');

assert.ok(stoneFx.weightTransfer({stage:'bender-stomp',progress:.5}).lean< -15,'leans back over rear support leg');
assert.ok(stoneFx.weightTransfer({stage:'bender-stomp',progress:.7}).lean>8,'drives weight forward on impact');
assert.deepEqual(JSON.parse(JSON.stringify(stoneFx.cameraShake({stage:'bender-stomp',progress:.5}))),{x:0,y:0},'no rumble before contact');
assert.ok(Math.abs(stoneFx.cameraShake({stage:'bender-stomp',progress:.7}).x)>0,'impact shakes arena');
assert.deepEqual(JSON.parse(JSON.stringify(stoneFx.cameraShake({stage:'bender-wall',progress:1}))),{x:0,y:0},'quake settles');
console.log('Weight transfer and impact-only camera rumble checks passed.');

vm.runInNewContext('Math.random=()=>0',context);
const frosty=cards.find(c=>c.id==='frosty');assert.equal(frosty.damage,750);assert.equal(frosty.frostDamage,50);assert.equal(frosty.frostTurns,3);
s=battle();s.auras={};s.phase='resolving';s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:frosty,runeResult:'success',stage:'frost-gust',elapsed:0,duration:800};api.set(s);
for(const [stage,d] of [['frost-gust',800],['frost-appear',650],['frost-happy',700],['frost-angry',500],['frost-transform',1000],['frost-pause',900],['frost-lift',650],['frost-windup',600],['frost-throw',150]]){assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,1000);api.updateCastSequence(d);}
assert.equal(s.animation.stage,'frost-flight');api.updateCastSequence(322);assert.equal(s.units[1].hp,1000);api.updateCastSequence(.5);assert.equal(s.units[1].hp,250);assert.ok(s.units[1].statuses.some(st=>st.kind==='frostbite'&&st.remaining===3));assert.ok(context.window.WIZARDRY_ARENA_TEST.unitStatuses(s.units[1]).some(st=>st.kind==='frostbite'),'persistent frostbite rune visible');
const frostyHit=context.window.WIZARDRY_ARENA_TEST.applyFrostyImpact;assert.equal(frostyHit(s.animation),false);api.updateCastSequence(350);assert.equal(s.animation.stage,'frost-melt');api.updateCastSequence(1200);assert.equal(s.animation.stage,'lowering');assert.equal(s.units[1].hp,250);
const tickDots=context.window.WIZARDRY_ARENA_TEST.tickBurnsForRound;tickDots();assert.equal(s.units[1].hp,250,'no instant tick in application turn');for(const [round,hp] of [[2,200],[3,150],[4,100]]){s.round=round;tickDots();assert.equal(s.units[1].hp,hp);tickDots();assert.equal(s.units[1].hp,hp,'only once per turn');}assert.equal(s.units[1].statuses.some(st=>st.kind==='frostbite'),false);s.round=5;tickDots();assert.equal(s.units[1].hp,100,'exactly 150 total frostbite');assert.equal(s.units[2].hp,1000);
s=battle();s.auras={};s.units[1].hp=4000;s.units[1].maxHp=4000;api.set(s);const snowCast=()=>({source:'human',target:'cpu',card:frosty,runeResult:'success'});frostyHit(snowCast());s.units[1].statuses.find(st=>st.kind==='frostbite').remaining=1;frostyHit(snowCast());assert.equal(s.units[1].statuses.filter(st=>st.kind==='frostbite').length,1);assert.equal(s.units[1].statuses.find(st=>st.kind==='frostbite').remaining,3,'refreshes duration without stacking');
s=battle();s.auras={};api.set(s);assert.equal(frostyHit({...snowCast(),runeResult:'failed'}),false);assert.equal(s.units[1].hp,1000);assert.equal(s.units[1].statuses.length,0);s.units[1].hp=0;assert.equal(frostyHit(snowCast()),false);assert.equal(s.units[2].hp,1000,'never retargets defeated foe');
s=battle();s.auras={};s.round=2;api.set(s);s.units[1].statuses=[{kind:'burn',value:50,remaining:3,appliedRound:1,lastTickRound:1},{kind:'frostbite',value:50,remaining:3,appliedRound:1,lastTickRound:1},{kind:'decaying_strength',value:.2}];tickDots();assert.equal(s.units[1].hp,900,'burn and frostbite tick separately for 50 each');assert.ok(s.units[1].statuses.some(st=>st.kind==='decaying_strength'),'frostbite never consumes next-spell debuff');
console.log('Frosty: happy/angry transformation, 750 on snowball arrival, exactly three 50-damage Frostbite turns, refresh, coexistence and miss/defeat checks passed.');

vm.runInNewContext(fs.readFileSync('assets/frosty-v85.js','utf8'),context);const frostFx=context.window.WIZARDRY_FROSTY_V85;

for(const stage of ['frost-transform','frost-lift','frost-windup','frost-throw','frost-flight'])for(const p of [0,.25,.5,.75,1]){
 const pose=frostFx.motion({stage,progress:p});assert.equal(pose.alpha,1,'poses remain fully opaque');assert.ok(Number.isInteger(pose.frame),'only real sprite frames, no pose crossfades');
}
for(const stage of ['frost-lift','frost-windup','frost-throw','frost-flight','frost-impact'])assert.equal(frostFx.motion({stage,progress:.5}).atlas,'throw','same-arm pickup/windup/release atlas');
assert.equal(frostFx.projectile({stage:'frost-throw',progress:.74,target:{x:800,y:450}}),null,'ball stays in throwing hand before release');
assert.ok(frostFx.projectile({stage:'frost-throw',progress:.76,target:{x:800,y:450}}),'ball begins flight at release pose');
assert.equal(frostFx.pose({stage:'frost-gust',progress:1}).alpha,0,'hidden during gust');
console.log('Frosty: fully opaque in-betweens and consistent same-arm throw/release checks passed.');

assert.equal(frostFx.motion({stage:'frost-transform',progress:1}).height,frostFx.motion({stage:'frost-lift',progress:0}).height,'growth continues into bend without a size pop');
assert.equal(frostFx.motion({stage:'frost-windup',progress:1}).frame,frostFx.motion({stage:'frost-throw',progress:0}).frame,'windup carries directly into same-arm throw');

assert.equal(frostFx.formScale({stage:'frost-happy',progress:1}),1,'happy snowman size unchanged');
assert.equal(frostFx.formScale({stage:'frost-transform',progress:1}),.9,'giant reduced ten percent');
assert.equal(frostFx.formScale({stage:'frost-throw',progress:.5}),.9,'giant scale stays consistent');
assert.ok(frostFx.forcePose({stage:'frost-windup',progress:1}).lean< -20,'loads weight backward');
assert.ok(frostFx.forcePose({stage:'frost-throw',progress:.8}).lean>20,'drives torso forward');
assert.deepEqual(JSON.parse(JSON.stringify(frostFx.forcePose({stage:'frost-throw',progress:1}))),JSON.parse(JSON.stringify(frostFx.forcePose({stage:'frost-flight',progress:0}))),'continuous forceful follow-through');
console.log('Frosty reduced giant scale and backward-coil/forward-drive checks passed.');

assert.equal(frostFx.idleBreath({stage:'frost-pause',progress:0}),0,'single breath starts settled');
assert.equal(frostFx.idleBreath({stage:'frost-pause',progress:.5}),1,'single inhale peak');
assert.ok(Math.abs(frostFx.idleBreath({stage:'frost-pause',progress:1}))<1e-9,'single breath ends settled');
assert.equal(frostFx.idleBreath({stage:'frost-lift',progress:.5}),0,'breathing stops when pickup begins');
assert.equal(frostFx.motion({stage:'frost-pause',progress:.5}).frame,15,'holds transformed giant for one breath');
console.log('Frosty one-breath pause before pickup passed.');

// Solidity protects one complete spell, including every rapid hit.
const solidity=cards.find(c=>c.id==='solidity'),combat=context.window.WIZARDRY_ARENA_TEST;
assert.equal(solidity.target,'ally');assert.equal(solidity.reduction,.25);
s=battle();s.auras={};api.set(s);
const ward=()=>combat.applySpell({action:{casterId:'cpu',targetId:'cpu'},card:solidity});
ward();ward();assert.equal(s.units[1].statuses.filter(x=>x.kind==='solidity').length,1,'refresh, not stack');
const volley={source:'human',target:'cpu',card:cards.find(c=>c.id==='ronin'),runeResult:'success',slashHits:[]};
combat.applyRoninHit(volley,0);combat.applyRoninHit(volley,1);combat.applyRoninHit(volley,2);
assert.equal(s.units[1].hp,661,'three 150 hits become three rounded 113 hits');
assert.equal(s.units[1].statuses.some(x=>x.kind==='solidity'),false);
combat.applySpell({action:{casterId:'human',targetId:'cpu'},card:bear});assert.equal(s.units[1].hp,201,'next spell receives no protection');
s=battle();s.auras={};api.set(s);ward();
combat.applyRoninHit({...volley,runeResult:'failed',slashHits:[]},0);assert.ok(s.units[1].statuses.some(x=>x.kind==='solidity'),'miss preserves ward');
s.units[1].statuses.push({kind:'frostbite',value:50,remaining:3,appliedRound:0,lastTickRound:0});combat.tickBurnsForRound();assert.ok(s.units[1].statuses.some(x=>x.kind==='solidity'),'damage over time preserves ward');
console.log('Solidity self targeting, refresh, multi-hit protection, consumption and miss/DOT checks passed.');

const calming=cards.find(c=>c.id==='calming');s=battle();s.auras={};s.units[1].hp=100;api.set(s);
const bless=()=>combat.applySpell({action:{casterId:'cpu',targetId:'cpu'},card:calming});
bless();combat.tickBurnsForRound();assert.equal(s.units[1].hp,100,'no instant tick');
for(let round=2;round<=4;round++){s.round=round;combat.tickBurnsForRound();combat.tickBurnsForRound();assert.equal(s.units[1].hp,100+(round-1)*125);}
assert.equal(s.units[1].statuses.some(x=>x.kind==='calming_waters'),false);
bless();s.units[1].statuses.find(x=>x.kind==='calming_waters').remaining=1;bless();assert.equal(s.units[1].statuses.filter(x=>x.kind==='calming_waters').length,1);assert.equal(s.units[1].statuses.find(x=>x.kind==='calming_waters').remaining,3);
s.units[1].hp=990;s.round++;combat.tickBurnsForRound();assert.equal(s.units[1].hp,1000,'capped at maximum');s.units[1].hp=0;s.round++;combat.tickBurnsForRound();assert.equal(s.units[1].hp,0,'never revives');
console.log('Calming Waters: three 125 HP ticks, no duplicate ticks, refresh, HP cap and no revival passed.');

const staticCard=cards.find(c=>c.id==='static');s=battle();s.auras={};api.set(s);
const curse=()=>combat.applySpell({action:{casterId:'human',targetId:'cpu'},card:staticCard});curse();curse();
assert.equal(s.units[1].statuses.filter(x=>x.kind==='static_shock').length,1);
assert.ok(Math.abs(combat.getEffectiveAccuracy('cpu','bear')-.55)<1e-9);
s.units[1].statuses.push({kind:'tailwind',value:.1});assert.ok(Math.abs(combat.getEffectiveAccuracy('cpu','bear')-.65)<1e-9);
vm.runInNewContext('Math.random=()=>.99',context);s.animation={source:'cpu',card:bear,stage:'tracing-auto',traceMs:0};api.resolveAutoRune();assert.equal(s.units[1].hp,900);assert.equal(s.units[1].statuses.some(x=>x.kind==='static_shock'),false);api.resolveAutoRune();assert.equal(s.units[1].hp,900,'no duplicate discharge');
curse();vm.runInNewContext('Math.random=()=>0',context);s.animation={source:'cpu',card:bear,stage:'tracing-auto',traceMs:0};api.resolveAutoRune();assert.ok(s.units[1].statuses.some(x=>x.kind==='static_shock'),'success retains curse');
s.round=4;combat.tickBurnsForRound();assert.equal(s.units[1].statuses.some(x=>x.kind==='static_shock'),false,'expires after 3 rounds');assert.equal(s.units[1].hp,900,'expiry does no damage');
console.log('Static Shock accuracy stacking, single miss discharge, success preservation, refresh and expiry passed.');

const rageCard=cards.find(c=>c.id==='rage');s=battle();s.auras={};api.set(s);
const enrage=()=>combat.applySpell({action:{casterId:'human',targetId:'human'},card:rageCard});enrage();enrage();assert.equal(s.units[0].statuses.filter(x=>x.kind==='blazing_rage').length,1);
const empowered={source:'human',target:'cpu',card:cards.find(c=>c.id==='ronin'),runeResult:'success'};for(let i=0;i<3;i++)combat.applyRoninHit(empowered,i);assert.equal(s.units[1].hp,460,'all three hits boosted to 180');assert.equal(s.units[0].statuses.some(x=>x.kind==='blazing_rage'),false);
s=battle();s.auras={};api.set(s);enrage();combat.applyRoninHit({...empowered,runeResult:'failed',slashHits:[]},0);assert.ok(s.units[0].statuses.some(x=>x.kind==='blazing_rage'),'miss preserves boost');combat.applySpell({action:{casterId:'human',targetId:'human'},card:calming});assert.ok(s.units[0].statuses.some(x=>x.kind==='blazing_rage'),'support preserves boost');
s=battle();s.auras={};api.set(s);frostyHit(snowCast(),.30);assert.equal(s.units[1].hp,250);assert.equal(s.units[1].statuses.some(x=>x.kind==='frostbite'),false,'30% boundary excludes frostbite');s=battle();s.auras={};api.set(s);frostyHit(snowCast(),.299);assert.ok(s.units[1].statuses.some(x=>x.kind==='frostbite'),'under 30% applies frostbite');
console.log('Blazing Rage multi-hit boost, consumption, miss/support preservation and Frostbite 30% boundary passed.');

const turbulenceCard=cards.find(c=>c.id==='turbulence');s=battle();s.auras={};api.set(s);
const gustCurse=()=>combat.applySpell({action:{casterId:'human',targetId:'cpu'},card:turbulenceCard});gustCurse();gustCurse();assert.equal(s.units[1].statuses.filter(x=>x.kind==='turbulence').length,1);assert.ok(Math.abs(combat.getEffectiveAccuracy('cpu','ronin')-.3)<1e-9);
vm.runInNewContext('Math.random=()=>.30',context);s.animation={source:'cpu',card:cards.find(c=>c.id==='ronin'),stage:'tracing-auto',traceMs:0};assert.equal(api.resolveAutoRune(),false,'30% success boundary fails');assert.equal(s.units[1].statuses.some(x=>x.kind==='turbulence'),false);
gustCurse();vm.runInNewContext('Math.random=()=>.299',context);s.animation={source:'cpu',card:cards.find(c=>c.id==='ronin'),stage:'tracing-auto',traceMs:0};assert.equal(api.resolveAutoRune(),true,'below 30% succeeds');
for(const order of [0,1]){s=battle();s.auras={};api.set(s);if(order){gustCurse();curse();}else{curse();gustCurse();}assert.equal(combat.getEffectiveAccuracy('cpu','ronin'),0,'both penalties apply regardless of receipt order');vm.runInNewContext('Math.random=()=>0',context);s.animation={source:'cpu',card:cards.find(c=>c.id==='ronin'),stage:'tracing-auto',traceMs:0};api.resolveAutoRune();assert.equal(s.units[1].hp,900,'combined failure triggers Static Shock');assert.equal(s.units[1].statuses.some(x=>x.kind==='static_shock'||x.kind==='turbulence'),false);}
s=battle();s.auras={};api.set(s);curse();gustCurse();s.units[1].statuses.push({kind:'tailwind',value:.1});assert.ok(Math.abs(combat.getEffectiveAccuracy('cpu','ronin')-.1)<1e-9,'accuracy buffs combine with both debuffs before clamping');
console.log('Turbulence −50 accuracy, 30% success boundary, simultaneous stacking in either order, consumption and Static Shock discharge passed.');

const soulCard=cards.find(c=>c.id==='soul');s=battle();s.auras={};s.units[0].hp=500;api.set(s);
const soulCurse=()=>combat.applySpell({action:{casterId:'human',targetId:'cpu'},card:soulCard});soulCurse();combat.tickBurnsForRound();assert.equal(s.units[1].hp,1000,'no immediate drain');
for(let r=2;r<=4;r++){s.round=r;combat.tickBurnsForRound();combat.tickBurnsForRound();assert.equal(s.units[1].hp,1000-100*(r-1));assert.equal(s.units[0].hp,500+100*(r-1));}assert.equal(s.units[1].statuses.some(x=>x.kind==='soul_drain'),false);
soulCurse();soulCurse();assert.equal(s.units[1].statuses.filter(x=>x.kind==='soul_drain').length,1);s.units[1].hp=40;s.units[0].hp=990;s.round++;combat.tickBurnsForRound();assert.equal(s.units[1].hp,0);assert.equal(s.units[0].hp,1000,'healing capped at max');assert.equal(s.units[1].statuses.some(x=>x.kind==='soul_drain'),false);
s=battle();s.auras={};s.units[0].hp=100;api.set(s);s.units[1].hp=40;soulCurse();s.round++;combat.tickBurnsForRound();assert.equal(s.units[0].hp,140,'heals only actual 40 HP drained');
s=battle();s.auras={};api.set(s);soulCurse();s.units[0].hp=0;s.round++;combat.tickBurnsForRound();assert.equal(s.units[0].hp,0,'never revives caster');assert.equal(s.units[1].hp,900,'curse still drains');
console.log('Soul Drain three ticks, no duplicate ticks, actual HP transfer, cap, refresh, target KO and defeated-caster checks passed.');

const healingAura=cards.find(c=>c.id==='healingaura');s=battle();s.auras={};s.units.push(unit('ally',0,100),unit('ko',0,0));s.units[0].hp=200;api.set(s);
const teamBless=()=>combat.applySpell({action:{casterId:'human'},card:healingAura});teamBless();assert.equal(s.units[0].hp,200);assert.ok(s.units[3].statuses.some(x=>x.kind==='healing_aura'));assert.equal(s.units[1].statuses.length,0);assert.equal(s.units[4].statuses.length,0,'no revival');
for(let r=2;r<=4;r++){s.round=r;combat.tickBurnsForRound();combat.tickBurnsForRound();assert.equal(s.units[0].hp,200+(r-1)*200);assert.equal(s.units[3].hp,100+(r-1)*200);}assert.equal(s.units[0].hp,800);assert.equal(s.units[3].hp,700);
teamBless();teamBless();assert.equal(s.units[0].statuses.filter(x=>x.kind==='healing_aura').length,1);combat.applySpell({action:{casterId:'human',targetId:'human'},card:calming});s.units[0].hp=500;s.round++;combat.tickBurnsForRound();assert.equal(s.units[0].hp,825,'aura and Calming Waters both heal');s.round++;combat.tickBurnsForRound();assert.equal(s.units[0].hp,1000,'HP cap');
console.log('Healing Aura entire-team targeting, 200 × 3 each, single ticks, no KO healing, refresh and coexistence passed.');

const freezingCard=cards.find(c=>c.id==='freezing');s=battle();s.auras={};api.set(s);const markIce=()=>combat.applySpell({action:{casterId:'human',targetId:'cpu'},card:freezingCard});markIce();assert.equal(combat.attemptMarkedFreeze(s.units[1],benderCard,{},0),false);assert.ok(s.units[1].statuses.some(x=>x.kind==='freezing_temps'));
assert.equal(combat.attemptMarkedFreeze(s.units[1],bear,{},.5),false);assert.equal(s.units[1].statuses.length,0,'failed 50% roll consumes mark');markIce();const iceSpell={};assert.equal(combat.attemptMarkedFreeze(s.units[1],bear,iceSpell,.499),true);assert.equal(combat.attemptMarkedFreeze(s.units[1],bear,iceSpell,0),false,'one roll per spell');
assert.equal(combat.isFrozen(s.units[1],.99),false,'already acted: freeze begins next round');for(let r=2;r<=4;r++){s.round=r;assert.equal(combat.isFrozen(s.units[1],.99),true);assert.equal(combat.isFrozen(s.units[1],0),true,'no duplicate thaw roll');}s.round=5;assert.equal(combat.isFrozen(s.units[1],.99),false,'auto thaw after three missed turns');
for(const [turn,roll] of [[1,.199],[2,.399],[3,.599]]){s=battle();s.auras={};api.set(s);markIce();combat.attemptMarkedFreeze(s.units[1],bear,{},0);for(let i=1;i<=turn;i++){s.round=i+1;assert.equal(combat.isFrozen(s.units[1],i===turn?roll:.99),i!==turn);}}
s=battle();s.auras={};s.phase='resolving';s.sequence=[{casterId:'cpu',cardId:bear.id,targetId:'human'}];s.queueAt=0;api.set(s);markIce();combat.attemptMarkedFreeze(s.units[1],bear,{},0);assert.equal(s.units[1].statuses.find(x=>x.kind==='frozen').startRound,1,'pending action affected immediately');vm.runInNewContext('Math.random=()=>.99',context);api.startNextAction();assert.equal(s.animation,undefined,'frozen wizard cannot cast');
console.log('Freezing Temps: Ice-only mark, one 50% roll, three skipped turns, rising thaw chance, no rerolls, immediate pending skip and auto thaw passed.');

const scorpionCard=cards.find(c=>c.id==='scorpion');s=battle();s.auras={};api.set(s);const sting=(roll)=>combat.applySpell({action:{casterId:'human',targetId:'cpu'},card:scorpionCard,poisonRoll:roll});sting(.299);assert.equal(s.units[1].hp,660);assert.ok(s.units[1].statuses.some(x=>x.kind==='poison'));combat.tickBurnsForRound();assert.equal(s.units[1].hp,660);for(let r=2;r<=4;r++){s.round=r;combat.tickBurnsForRound();combat.tickBurnsForRound();assert.equal(s.units[1].hp,660-(r-1)*50);}assert.equal(s.units[1].statuses.some(x=>x.kind==='poison'),false);
s=battle();s.auras={};api.set(s);sting(.30);assert.equal(s.units[1].hp,660);assert.equal(s.units[1].statuses.length,0,'30% boundary');
vm.runInNewContext(fs.readFileSync('assets/scorpion-sting-v94.js','utf8'),context);const scorpionFx=context.window.WIZARDRY_SCORPION_V94;for(const t of [{x:800,y:450},{x:200,y:350}]){const b=scorpionFx.pose(.74,t);assert.ok(Math.abs(500+b.tip.x*b.dir-t.x)<1e-8);assert.ok(Math.abs(425+b.tip.y-(t.y-95))<1e-8);}assert.ok(scorpionFx.pose(0).y<0);assert.equal(scorpionFx.pose(.3).y,425);
console.log('Scorpion Sting 340 damage, 30% poison, three 50 ticks, no duplicate ticks and mirrored tail contact passed.');

assert.equal(scorpionFx.pose(.08).frame,0,'compact armored roll frame');assert.equal(scorpionFx.pose(.20).frame,2,'unfold before standing');assert.equal(scorpionFx.pose(.6).frame,8,'tail windup');assert.ok(scorpionFx.pose(.96).burrow>0);assert.equal(scorpionFx.pose(1).alpha,0,'fully underground at end');

for(const target of [{x:800,y:450},{x:200,y:350}]){const a=scorpionFx.pose(.03,target),b=scorpionFx.pose(.12,target),land=scorpionFx.pose(.17,target),dir=target.x>500?1:-1;assert.ok((b.x-a.x)*dir>0,'roll approaches toward target');assert.ok(b.y>a.y,'diagonal descent');assert.ok(b.roll>a.roll,'local clockwise rotation mirrors with facing');assert.equal(land.x,500,'unfolds at arena center');}
console.log('Scorpion angled approach and target-directed rolling passed for both sides.');

for(const y of [315,350,450,508]){const depth=scorpionFx.depthFor({progress:3150/4700,target:{x:800,y}});assert.ok(depth>y,'sting appears in front of target');assert.ok(depth<y+1,'closer fighters still overlay scorpion');}
console.log('Scorpion sting depth sorts ahead of target and behind nearer fighters.');

s=battle();s.auras={};s.phase='resolving';s.sequence=[];s.queueAt=0;s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:scorpionCard,stage:'summon',duration:scorpionCard.duration,elapsed:0,runeResult:'success'};api.set(s);api.updateCastSequence(scorpionCard.duration);assert.equal(s.animation.stage,'lowering','scorpion completes after burrowing');api.updateCastSequence(s.animation.duration);assert.equal(s.animation,null,'finished scorpion releases sequence');
console.log('Scorpion full summon completes and hands off to next action.');

assert.equal(scorpionFx.pose(scorpionFx.timeline(3900/4700)).burrow,0,'holds for half a second before digging');assert.ok(scorpionFx.pose(scorpionFx.timeline(4300/4700)).burrow>0);assert.equal(scorpionFx.timeline(1),1);

const octoAPI=context.window.WIZARDRY_ARENA_TEST;
s=battle();s.phase='resolving';s.sequence=[{casterId:'human',cardId:'octo',targetId:'cpu'},{casterId:'cpu',cardId:card.id,targetId:'human'}];s.queueAt=1;api.set(s);
assert.equal(octoAPI.attemptOctoFlinch(s.units[1],.149),true);
api.startNextAction();assert.equal(s.units[1].mana,10,'flinch skips pending action without spending mana');assert.equal(s.units[1].flinchRound,null);
s=battle();s.phase='resolving';s.sequence=[{casterId:'cpu'}];s.queueAt=1;api.set(s);
assert.equal(octoAPI.attemptOctoFlinch(s.units[1],0),false,'already acted cannot flinch');assert.equal(s.units[1].flinchRound,undefined);
s.queueAt=0;assert.equal(octoAPI.attemptOctoFlinch(s.units[1],.15),false,'15 percent boundary');
s.units[1].hp=0;assert.equal(octoAPI.attemptOctoFlinch(s.units[1],0),false,'defeated target cannot flinch');
const octo=cards.find(c=>c.id==='octo');assert.equal(octo.damage,400);assert.equal(octo.school,'water');
console.log('Octo Whip: 400 damage, pending-action flinch, no carryover and chance boundary passed.');
s=battle();s.auras={};s.phase='resolving';s.sequence=[{casterId:'cpu',cardId:card.id,targetId:'human'}];s.queueAt=0;api.set(s);
octoAPI.applySpell({action:{casterId:'human',targetId:'cpu'},card:octo,flinchRoll:0});assert.equal(s.units[1].hp,600);assert.equal(s.units[1].flinchRound,1);
vm.runInNewContext(fs.readFileSync('assets/octo-whip-v95.js','utf8'),context);
const canvasMock=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
for(const target of [{x:175,y:340},{x:831,y:488}])for(let step=0;step<=100;step++)for(const layer of ['body','whip'])context.window.WIZARDRY_OCTO_V95.draw(canvasMock,{progress:step/100,target,layer});
console.log('Octo impact applies 400 damage and flinch; animation completes for both team directions.');
const devilCard=cards.find(c=>c.id==='devil');assert.equal(devilCard.damage,250);assert.equal(devilCard.school,'fire');
s=battle();s.auras={};s.phase='resolving';s.sequence=[];s.queueAt=0;s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:devilCard,stage:'summon',duration:devilCard.duration,elapsed:0,runeResult:'success'};api.set(s);
api.updateCastSequence(devilCard.duration*devilCard.hit-1);assert.equal(s.units[1].hp,1000,'no damage before rock contact');api.updateCastSequence(1);assert.equal(s.units[1].hp,750,'one 250 damage impact');api.updateCastSequence(300);assert.equal(s.units[1].hp,750,'no duplicate hit');api.updateCastSequence(devilCard.duration);assert.equal(s.animation.stage,'lowering');api.updateCastSequence(s.animation.duration);assert.equal(s.animation,null,'flame exit releases next action');
console.log('Devil Boy: featured hand, 250 damage once at rock contact and cast completion passed.');
const bloomCard=cards.find(c=>c.id==='bloom');assert.equal(bloomCard.damage,100);assert.equal(bloomCard.poisonTurns,5);assert.equal(bloomCard.target,'all_enemies');
s=battle();s.auras={};api.set(s);const bloomCast={action:{casterId:'human',targetId:null},card:bloomCard,poisonRolls:{cpu:.299,other:.30}};
combat.applySpell(bloomCast);combat.applySpell(bloomCast);assert.equal(s.units[0].hp,1000,'no friendly damage');assert.equal(s.units[1].hp,900);assert.equal(s.units[2].hp,900,'all enemies take exactly 100');assert.equal(s.units[1].statuses.find(x=>x.kind==='poison').remaining,5);assert.equal(s.units[2].statuses.some(x=>x.kind==='poison'),false,'independent 30 percent boundary');assert.equal(s.units[0].statuses.some(x=>x.kind==='tailwind'),false,'no wind spell bonus');
combat.tickBurnsForRound();assert.equal(s.units[1].hp,900,'no poison tick on application turn');for(let r=2;r<=6;r++){s.round=r;combat.tickBurnsForRound();combat.tickBurnsForRound();assert.equal(s.units[1].hp,900-(r-1)*50);assert.equal(s.units[2].hp,900);}assert.equal(s.units[1].statuses.some(x=>x.kind==='poison'),false,'expires after exactly five ticks');
s=battle();s.auras={};s.units[1].hp=100;api.set(s);combat.applySpell({action:{casterId:'human',targetId:null},card:bloomCard,poisonRolls:{cpu:0,other:0}});assert.equal(s.units[1].hp,0);assert.equal(s.units[1].statuses.length,0,'no poison on defeated enemy');const again={action:{casterId:'human',targetId:null},card:bloomCard,poisonRolls:{other:0}};combat.applySpell(again);assert.equal(s.units[2].statuses.filter(x=>x.kind==='poison').length,1,'refresh without stacking');assert.equal(s.units[2].statuses.find(x=>x.kind==='poison').remaining,5);
s=battle();s.auras={};s.phase='resolving';s.sequence=[];s.queueAt=0;s.animation={source:'human',target:null,action:{casterId:'human',targetId:null},card:bloomCard,stage:'summon',duration:bloomCard.duration,elapsed:0,runeResult:'success',poisonRolls:{cpu:1,other:1}};api.set(s);api.updateCastSequence(bloomCard.duration*bloomCard.hit-1);assert.equal(s.units[1].hp,1000);api.updateCastSequence(1);assert.equal(s.units[1].hp,900);assert.equal(s.units[2].hp,900);api.updateCastSequence(bloomCard.duration);assert.equal(s.animation.stage,'lowering');
console.log('Blooming Spores: 100 to all enemies, independent 30 percent poison, five 50-damage turns, refresh, KO safety and impact timing passed.');
