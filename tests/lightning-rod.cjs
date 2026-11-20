const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');let source=fs.readFileSync('arena.js','utf8');source=source.replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  window.rodTest={set:s=>state=s,finishRound,startNextAction,resolveAutoRune};paintUI=()=>{};');
const node={getContext:()=>({})},math=Object.create(Math);math.random=()=>.999;const context={Image:class{},window:{},document:{getElementById:()=>node},requestAnimationFrame:()=>{},Math:math};vm.runInNewContext(source,context);const api=context.window.WIZARDRY_ARENA_TEST,test=context.window.rodTest,cards=api.cards,rod=cards.find(c=>c.id==='rod'),volt=cards.find(c=>c.id==='volt'),golem=cards.find(c=>c.id==='golem');
function unit(id,team){return{id,name:id,team,hp:1000,maxHp:1000,mana:10,speed:10,statuses:[],hand:['rod','volt'],drawPile:[],discardPile:[],x:team?800:200,y:425,rechargeRound:null,stunRound:null};}
function battle(n=5){return{units:[unit('human',0),unit('ally',0),...Array.from({length:n},(_,i)=>unit('enemy'+i,1))],humanByTeam:{0:'human'},mode:'story',round:1,phase:'planning',planningSide:0,plans:{},sequence:[],queueAt:0,auras:[null,null],flashes:[],log:[]};}
let s=battle();
test.set(s);
const [owner,ally,enemy,otherEnemy]=s.units;
api.chooseCard('rod');
assert.equal(s.selectedTarget,'human','self target is preselected');
api.selectTarget('ally');
assert.equal(s.selectedTarget,'human','allies cannot receive the rune');

function cast(card,source,target){
  api.applySpell({action:{casterId:source.id,targetId:target.id},card,runeResult:'success',damageVariant:1});
}
cast(rod,owner,ally);
assert.equal(ally.statuses.length,0);
assert.equal(owner.statuses.length,0);
cast(rod,owner,owner);
const status=owner.statuses.find(rune=>rune.kind==='lightning_rod');
assert.equal(status.expiresRound,3);
assert.equal(status.value,.2);
owner.hp=300;
cast(volt,ally,enemy);
assert.equal(enemy.hp,640);
assert.equal(owner.hp,390);
cast(volt,enemy,owner);
assert.equal(owner.hp,120,'incoming hit deals 360 and heals 90');
cast(volt,owner,enemy);
assert.equal(owner.hp,210,'own Lightning heals');
assert.equal(enemy.hp,280);
cast(golem,ally,otherEnemy);
assert.equal(otherEnemy.hp,100,'other elements deal full damage');
assert.equal(owner.hp,210);
s.round=2;
api.expireLightningRods();
assert.ok(owner.statuses.includes(status));
s.round=3;
cast(volt,ally,s.units[5]);
assert.equal(s.units[5].hp,640,'active through the end of the third round');
api.expireLightningRods();
assert.equal(owner.statuses.length,0);
cast(volt,ally,s.units[4]);
assert.equal(s.units[4].hp,550,'expiry ends redirection immediately');

s=battle();test.set(s);
{
  const [first,second,target]=s.units;
  first.hp=900;second.hp=700;
  cast(rod,first,first);cast(rod,second,second);
  cast(volt,first,target);
  assert.equal(target.hp,640,'multiple rods still redirect only 20%');
  assert.equal(first.hp,945);
  assert.equal(second.hp,745);
  api.applySpell({action:{casterId:first.id,targetId:first.id,runeKind:'lightning_rod'},card:cards.find(c=>c.id==='zen'),runeResult:'success'});
  assert.ok(!first.statuses.some(rune=>rune.kind==='lightning_rod'),'Zen can remove the self debuff');
}
s=battle();test.set(s);
{
  const [caster,,target]=s.units;
  caster.hp=990;
  cast(rod,caster,caster);
  cast(cards.find(c=>c.id==='winddome'),target,target);
  cast(volt,caster,target);
  assert.equal(caster.hp,990,'fully blocked hits do not heal');
  cast(volt,caster,target);
  assert.equal(target.hp,640,'full-health cap does not undo the reduction');
  assert.equal(caster.hp,1000);
  s.round=2;
  cast(rod,caster,caster);
  assert.equal(caster.statuses.filter(rune=>rune.kind==='lightning_rod').length,1);
  assert.equal(caster.statuses.find(rune=>rune.kind==='lightning_rod').expiresRound,4);
}
vm.runInNewContext(fs.readFileSync('assets/lightning-rod-v118.js','utf8'),context);const fx=context.window.WIZARDRY_ROD_V98;
for(const caster of [{x:175,y:340},{x:341,y:508},{x:667,y:315},{x:831,y:488}]){const start=fx.pose(0,caster),land=fx.pose(.08,caster),hold=fx.pose(.6,caster);assert.equal(land.x,500);assert.equal(land.y,510);assert.equal(hold.cloud.x,land.x);assert.equal(land.angle,hold.angle);assert(caster.x<500?start.x<land.x:start.x>land.x,'entry comes diagonally from caster side');assert(caster.x<500?land.angle<0:land.angle>0);assert(hold.cloud.y<hold.tip.y-60,'cloud remains well above tip');const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});for(let i=0;i<=100;i++)for(const layer of ['rod','arc'])fx.draw(c,{progress:i/100,caster,layer});}
console.log('Lightning Rod: self-only debuff, global Lightning redirection, healing cap, expiry, shared healing, cleanse and mirrored angled entry passed.');
const images=[],renderContext={window:{},Image:class{constructor(){images.push(this);}}};vm.runInNewContext(fs.readFileSync('assets/lightning-rod-v118.js','utf8'),renderContext);images[0].naturalWidth=1280;images[0].naturalHeight=640;images[0].onload();const calls=[],canvas=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});renderContext.window.WIZARDRY_ROD_V98.draw(canvas,{progress:.6,caster:{x:175,y:340},layer:'rod'});assert.equal(calls.filter(x=>x[0]==='drawImage').length,2,'rod and high cloud are separate rigid layers');assert.equal(calls.filter(x=>x[0]==='rotate').length,1,'cloud is not tilted with rod');assert.ok(!calls.some(x=>x[0]==='clip'),'rod foot is fully visible');assert.deepEqual(calls.filter(x=>x[0]==='translate'),[['translate',500,510],['translate',500,510]]);
console.log('Loaded artwork: thicker cylinder tilts separately from the level, elevated cloud.');

const short=fx.pose(.6,{x:175,y:340});assert(Math.hypot(short.tip.x-500,short.tip.y-510)<110,'rod is over a third shorter');
const path=fx.lightningPath(short.cloud,short.tip,2);assert.equal(path.length,8);assert.equal(path[0].x,short.cloud.x);assert.equal(path[0].y,short.cloud.y);assert.equal(path[7].x,short.tip.x);assert.equal(path[7].y,short.tip.y);
assert(fx.cloudStrikeAlpha(.625)>.8);assert(fx.cloudStrikeAlpha(.644)<.05,'main flash has a dark interval');assert(fx.cloudStrikeAlpha(.652)>.8,'restrike flashes again');assert.equal(fx.cloudStrikeAlpha(.70),0);
console.log('Shorter rod, exact bolt endpoints and separated jagged lightning flashes passed.');
