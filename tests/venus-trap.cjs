const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const math=Object.create(Math);
math.random=()=>.5;
const node={getContext:()=>({})};
const ctx={window:{},Math:math,Image:class{naturalWidth=1024;},document:{getElementById:()=>node},requestAnimationFrame(){}};
const read=p=>fs.readFileSync(p,'utf8');
vm.runInNewContext(read('assets/wizard-system-v135.js'),ctx);
vm.runInNewContext(read('assets/venus-trap.js'),ctx);
vm.runInNewContext(read('arena.js').replace(
  '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
  '  paintUI=()=>{};window.step=updateCastSequence;'
),ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST,fx=ctx.window.WIZARDRY_VENUS_TRAP;
const card=api.cards.find(c=>c.id==='venustrap');
assert.equal(api.featuredCard,card.id);
assert.equal(card.school,'nature');
assert.equal(card.damage,400);
assert.equal(card.hit,fx.HIT);
const catalog=JSON.parse(read('backend/cards.json'));
assert.equal(catalog.find(c=>c.id===card.id).damage,400);

for(const blocked of [false,true]){
  api.startPractice(2);
  const state=api.getState(),[caster,,target,neighbor]=state.units;
  caster.skills={};
  if(blocked)api.addStatus(target,'wind_dome','',1);
  const anim={stage:'summon',elapsed:0,duration:card.duration,card,runeResult:'success',source:caster.id,target:target.id,
    action:{casterId:caster.id,targetId:target.id},damageVariant:1};
  state.phase='resolving';
  state.animation=anim;
  ctx.window.step(card.duration*card.hit-1);
  assert.equal(target.hp,target.maxHp,'roar and open jaws do not damage early');
  ctx.window.step(2);
  assert.equal(target.hp,target.maxHp-(blocked?0:400));
  ctx.window.step(200);
  assert.equal(target.hp,target.maxHp-(blocked?0:400),'bite applies once');
  assert.equal(neighbor.hp,neighbor.maxHp,'only the selected enemy is hit');
}

const frames=[];
const canvas=new Proxy({globalAlpha:1,drawImage:(...args)=>frames.push(args),createRadialGradient:()=>({addColorStop(){}})},{
  get:(obj,key)=>key in obj?obj[key]:(()=>{})
});
for(const [caster,target] of [
  [{x:225,y:520},{x:775,y:500}],
  [{x:820,y:535},{x:210,y:390}]
]){
  const opts={progress:fx.HIT,caster,target};
  const bite=fx.pose(opts);
  assert.equal(bite.frame,11);
  assert.ok(Math.abs(bite.jaw.x-target.x)<.01);
  assert.ok(Math.abs(bite.jaw.y-(target.y-92))<.01);
  assert.ok(fx.depthFor(opts,'plant')>target.y,'closed jaws render over the target');
  for(let i=0;i<=100;i++)for(const layer of ['ground','plant','bite'])
    fx.draw(canvas,{...opts,progress:i/100,layer});
}
fx.portrait(canvas,240,196);
assert.equal(new Set(frames.map(([,sx,sy])=>sx+','+sy)).size,16);
assert.ok(frames.every(([image,sx,sy,sw,sh])=>image.src.endsWith('venus-trap-v154.webp')&&sx+sw<=1024&&sy+sh<=1024));
console.log('Venus Trap: all 16 poses, mirrored jaw alignment, one 400-damage hit at closure, and Wind Dome blocking passed.');
