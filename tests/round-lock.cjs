const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let source=fs.readFileSync('arena.js','utf8');
source=source.replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  window.test={set:s=>state=s,runResolution,startNextAction,updateCastSequence}; paintUI=()=>{}; finishRound=()=>{state.phase="finished";};');
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

const bear=cards.find(c=>c.id==='bear');assert.equal(bear.damage,600);
assert.equal(context.window.WIZARDRY_ARENA_TEST.featuredCard,'ronin');
s=battle();s.auras={};s.phase='resolving';s.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:bear,stage:'bear-appear',elapsed:0,duration:650,runeResult:'success'};api.set(s);
for(const [stage,duration] of [['bear-appear',650],['bear-roar',950],['bear-ready',260],['bear-charge',800]]){
 assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,1000);api.updateCastSequence(duration);
}
assert.equal(s.animation.stage,'bear-claw');api.updateCastSequence(240);assert.equal(s.units[1].hp,1000);
api.updateCastSequence(20);assert.equal(s.units[1].hp,400);api.updateCastSequence(290);
assert.equal(s.animation.stage,'bear-disperse');assert.equal(s.units[1].hp,400);
api.updateCastSequence(650);assert.equal(s.animation.stage,'lowering');assert.equal(s.units[1].hp,400);
console.log('Ice bear sequence, opening hand and single 600-damage contact passed.');

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
const opening=unit('test',0);context.window.WIZARDRY_ARENA_TEST.startHand(opening,true);assert.equal(opening.hand.length,5);assert.ok(opening.hand.includes('ronin'));
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
