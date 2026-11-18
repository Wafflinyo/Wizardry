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
assert.equal(api.featuredCard,'yeti');
assert.equal(card.school,'nature');
assert.equal(card.damage,400);
assert.equal(card.hit,fx.HIT);
assert.ok((fx.STRIKE-fx.ROAR)*card.duration>1100);
assert.ok((fx.HIT-fx.STRIKE)*card.duration<265);
const catalog=JSON.parse(read('backend/cards.json'));
assert.equal(catalog.find(c=>c.id===card.id).damage,400);
assert.equal(card.duration,4200);
assert.equal(catalog.find(c=>c.id===card.id).duration,card.duration);

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

const frames=[],poses=new Set();
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
  assert.equal(bite.scale,1.25);
  for(const progress of [.10,.36,.43,fx.HIT,.90]){
    const b=fx.pose({...opts,progress});
    assert.deepEqual([b.rootX,b.rootY],[500,510],'the plant roots stay in the middle');
  }
  assert.equal(fx.pose({...opts,progress:.43}).reach,0);
  assert.equal(fx.pose({...opts,progress:.92}).reach,0);
  assert.equal(fx.depthFor({...opts,progress:.4},'plant'),510);
  assert.ok(Math.abs(bite.jaw.x-target.x)<.01);
  assert.ok(Math.abs(bite.jaw.y-(target.y-92))<.01);
  assert.ok(fx.depthFor(opts,'plant')>target.y,'closed jaws render over the target');
  for(let i=0;i<=500;i++){
    const progress=i/500;
    poses.add(fx.pose({...opts,progress}).frame);
    for(const layer of ['ground','plant','bite'])fx.draw(canvas,{...opts,progress,layer});
  }
}
fx.portrait(canvas,240,196);
assert.equal(poses.size,16,'only the sixteen original artwork poses play');
assert.ok(frames.every(([image,sx,sy,sw,sh])=>{
  const lunge=image.src.endsWith('venus-trap-lunge-v156.webp');
  return (lunge||image.src.endsWith('venus-trap-v154.webp'))&&sx+sw<=1024&&sy+sh<=(lunge?512:1024);
}));
assert.ok(frames.some(([image,sx,sy,sw])=>image.src.endsWith('venus-trap-lunge-v156.webp')&&sy>=256&&sw===64),'reach draws the painted stem texture');
console.log('Venus Trap: crisp poses, longer roar, fast reach, centered roots, mirrored jaw alignment, one 400-damage hit at closure, and Wind Dome blocking passed.');
