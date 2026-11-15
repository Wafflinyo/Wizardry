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
assert.equal(context.window.WIZARDRY_ARENA_TEST.featuredCard,'shark');
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
const opening=unit('test',0);context.window.WIZARDRY_ARENA_TEST.startHand(opening,true);assert.equal(opening.hand.length,5);assert.ok(opening.hand.includes('shark'));
function sharkBattle(statuses=[]){const result=battle();result.auras={};result.units[0].statuses=statuses;result.phase='resolving';result.animation={source:'human',target:'cpu',action:{casterId:'human',targetId:'cpu'},card:shark,stage:'shark-fin',elapsed:0,duration:1100,runeResult:'success'};api.set(result);return result;}
s=sharkBattle();
for(const [stage,ms] of [['shark-fin',1100],['shark-swim',1500],['shark-submerge',350],['shark-rise',650],['shark-flop',500],['shark-arch',550]]){
 assert.equal(s.animation.stage,stage);assert.equal(s.units[1].hp,1000);api.updateCastSequence(ms);
}
assert.equal(s.animation.stage,'shark-chomp');api.updateCastSequence(179);assert.equal(s.units[1].hp,1000);api.updateCastSequence(1);assert.equal(s.units[1].hp,520);assert.equal(s.units[2].hp,1000);
api.updateCastSequence(520);api.updateCastSequence(450);assert.equal(s.units[1].hp,520);assert.equal(s.animation.stage,'lowering');
s=sharkBattle();s.animation.stage='rune-fail';s.animation.duration=100;s.animation.runeResult='failed';api.updateCastSequence(100);assert.equal(s.units[1].hp,1000);assert.equal(s.animation.stage,'lowering');
vm.runInNewContext(fs.readFileSync('assets/reef-rush-v77.js','utf8'),context);const reef=context.window.WIZARDRY_REEF_RUSH_V77;
for(const target of [{x:175,y:340},{x:831,y:488}]){
 for(const p of [0,.25,.5,.75,1])assert.equal(reef.pose({stage:'shark-rise',progress:p,target}).x,500,'jump rises vertically before targeting');
 const apex=reef.pose({stage:'shark-flop',progress:1,target}),landing=reef.pose({stage:'shark-arch',progress:1,target});
 assert.ok(landing.y>apex.y,'shark arches down from apex');assert.ok(Math.abs(landing.x-500)>20);
 assert.equal(reef.pose({stage:'shark-splash',progress:1,target}).alpha,0);
 const dipped=reef.pose({stage:'shark-submerge',progress:1,target});assert.ok(dipped.y-238*.71+238*.4>dipped.groundY,'fin fully below surface before jump');
}
console.log('Reef Rush: removed cards, opening hand, vertical jump/flop/downward arc, 480-damage chomp, splash disappearance and miss checks passed.');
