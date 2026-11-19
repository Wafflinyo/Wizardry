const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let source=fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  window.test={set:s=>state=s,describeStatus};paintUI=()=>{};finishRound=()=>{state.phase="test-finished";};');
const node={getContext:()=>({})},math=Object.create(Math),ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{},Math:math,console};vm.runInNewContext(source,ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST,test=ctx.window.test,card=api.cards.find(c=>c.id==='jack');
const unit=(id,team)=>({id,team,index:0,name:id,hp:2000,maxHp:2000,mana:10,statuses:[],x:team?800:200,y:450,hand:[],drawPile:[],discardPile:[]});
let s;function battle(pending=true){s={units:[unit('a',0),unit('b',1)],round:1,phase:'resolving',auras:{},log:[],flashes:[],humanByTeam:{0:'a'},sequence:pending?[{casterId:'b',targetId:'a',cardId:'devil'}]:[],queueAt:0,animation:null};test.set(s);return s;}
const action=()=>({card,action:{casterId:'a',targetId:'b'},source:'a',target:'b',runeResult:'success'}),fear=()=>s.units[1].statuses.find(x=>x.kind==='fear');
assert.equal(card.school,'dark');assert.equal(card.damage,280);assert.equal(api.cards.filter(c=>c.school==='dark').length,7);assert.equal(api.cards.length,61);
battle();api.startHand(s.units[0],true);assert.equal(s.units[0].hand.length,5);
let a=action();api.applySpell(a);api.applySpell(a);assert.equal(s.units[1].hp,1720);assert.equal(fear().startRound,1);assert.equal(fear().expiresRound,4);assert.match(test.describeStatus(s.units[1],fear()).detail,/30%/);
assert.equal(api.rollJackFear(s.units[1],.299),true);assert.equal(api.rollJackFear(s.units[1],.99),true,'one cached roll per turn');s.round=2;assert.equal(api.rollJackFear(s.units[1],.30),false);s.round=3;assert.equal(api.rollJackFear(s.units[1],0),true);s.round=4;assert.equal(api.rollJackFear(s.units[1],0),false);assert.equal(fear(),undefined);
battle(false);api.applySpell(action());assert.equal(fear().startRound,2);assert.equal(fear().expiresRound,5);assert.equal(api.rollJackFear(s.units[1],0),false,'does not affect already-spent turn');s.round=2;assert.equal(api.rollJackFear(s.units[1],0),true);s.round=3;api.applySpell(action());assert.equal(s.units[1].statuses.filter(x=>x.kind==='fear').length,1);assert.equal(fear().expiresRound,7,'recast refreshes an active debuff');
battle();s.units[1].statuses.push({kind:'wind_dome',value:1});api.applySpell(action());assert.equal(s.units[1].hp,2000);assert.equal(fear(),undefined,'spell block also prevents Fear');
battle();a=action();a.runeResult='failed';api.applySpell(a);assert.equal(s.units[1].hp,2000);assert.equal(fear(),undefined);
battle();s.units[1].hp=100;api.applySpell(action());assert.equal(s.units[1].hp,0);assert.equal(fear(),undefined,'no curse on defeated target');
// Verify the actual action resolver skips without spending mana on a failed Fear roll.
battle();api.applySpell(action());math.random=()=>0;api.startNextAction();assert.equal(s.animation,null);assert.equal(s.units[1].mana,10);assert.equal(s.phase,'test-finished');
battle();api.applySpell(action());math.random=()=>.99;api.startNextAction();assert.equal(s.animation.source,'b');assert.equal(s.animation.stage,'raising');assert.equal(s.units[1].mana,10,'mana is spent only after a successful rune');
// Every frame renders both directions with exactly three independently positioned birds.
const artctx={window:{},Image:class{complete=true;naturalWidth=1254;naturalHeight=1254;}};vm.runInNewContext(fs.readFileSync('assets/jack-v129.js','utf8'),artctx);const fx=artctx.window.WIZARDRY_JACK_V129;
assert.equal(fx.HIT,card.hit);assert.equal(fx.pose(.1,{x:800}).frame,1);assert.equal(fx.pose(.45,{x:800}).frame,7);assert.ok(fx.pose(.6,{x:800}).frame>=8);
for(const x of [200,800]){const target={x,y:450},positions=[0,1,2].map(i=>fx.crowPose(.2,target,i));assert.equal(new Set(positions.map(b=>b.x)).size,3);for(let p=0;p<1;p+=.005){const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});for(const layer of ['ground','actor','crow0','crow1','crow2','impact']){fx.draw(c,{progress:p,target,layer});assert.ok(Number.isFinite(fx.depthFor({progress:p,target},layer)));}}}
console.log('Jack: 280 damage, guaranteed Fear on unblocked hit, 30% per turn for exactly 3 rounds, pending/acted turn handling, no rerolls, refresh, block, miss, lethal hit, real resolver skip/cast, and full mirrored animation passed.');
