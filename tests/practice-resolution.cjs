const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const node={getContext:()=>({})},ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  paintUI=()=>{};'),ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST,B=ctx.window.WizardryBuilds;
assert.equal(B.range({damage:650,school:'nature'},{skills:{nature:3}}).low,620);
assert.equal(B.range({damage:650,school:'nature'},{skills:{nature:3}}).high,757);
const tree=api.cards.find(c=>c.id==='tree');
for(const [roll,blocked] of [[.299,false],[.30,false],[.10,true]]){
 api.startPractice(1);
 const state=api.getState(),[caster,target]=state.units;
 caster.skills.nature=0;
 caster.hp=caster.maxHp-400;
 if(blocked)api.addStatus(target,'wind_dome',null,1);
 const cast={card:tree,action:{casterId:caster.id,targetId:target.id},
   runeResult:'success',damageVariant:1,seedRoll:roll};
 api.applySpell(cast);
 assert.equal(target.hp,target.maxHp-(blocked?0:720));
 const seeded=!blocked&&roll<.30;
 assert.equal(target.statuses.some(st=>st.kind==='healing_seed'),seeded);
 const startingHp=caster.hp;
 for(let round=2;round<=5;round++){
   state.round=round;
   api.tickBurnsForRound();
   api.tickBurnsForRound();
 }
 assert.equal(caster.hp,startingHp+(seeded?225:0));
 assert.equal(target.hp,target.maxHp-(blocked?0:720)-(seeded?225:0));
 assert(!target.statuses.some(st=>st.kind==='healing_seed'));
}
api.startPractice(1);
{
 const [caster,target]=api.getState().units;
 caster.skills.nature=0;
 api.addStatus(target,'trap',null,.255);
 api.applySpell({card:tree,action:{casterId:caster.id,targetId:target.id},
   runeResult:'success',damageVariant:1,seedRoll:1});
 assert.equal(target.hp,target.maxHp-903,'903.6 damage rounds down');
}
for(const lethal of [false,true]){
 api.startPractice(2);const s=api.getState(),u=s.units[1],enemy=s.units.find(x=>x.team!==u.team);
 u.hp=lethal?100:2000;u.mana=16;u.statuses=[{kind:'thorny_wrap',expiresRound:4,attemptDamage:198}];
 s.phase='resolving';s.sequence=[{casterId:u.id,cardId:'devil',targetId:enemy.id}];s.queueAt=0;
 assert.doesNotThrow(()=>api.startNextAction());assert.equal(u.hp,lethal?0:1802);
 if(!lethal)assert.equal(s.animation.stage,'raising');
 api.advanceBackground(30000);assert.notEqual(s.phase,'resolving');
}
for(const size of [1,2,3,4]){api.startPractice(size);const units=api.getState().units;for(const u of units){assert.ok(u.y>=335&&u.y<=605,'all seats remain on the arena floor');const p=api.unitPlateRect(u);assert.ok(p.x>=0&&p.x+p.w<=1000);for(const v of units.filter(v=>v.team===u.team&&v!==u)){assert.ok(Math.abs(v.y-u.y)>=55);}}}
console.log('Practice: Thorny Wrap cast attempts survive or defeat correctly, resolution continues, mastery example 620–757, and spaced formations pass.');
