const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const node={getContext:()=>({})},ctx={window:{},document:{getElementById:()=>node},Image:class{},requestAnimationFrame(){},console};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace(
 '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
 '  window.setBeesState=s=>state=s;paintUI=()=>{};'),ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST,card=api.testCards.find(c=>c.id==='killerbees');
assert.ok(card.testOnly&&!api.cards.some(c=>c.id===card.id));
assert.equal(card.cost,3);assert.equal(card.damage,300);assert.equal(card.poisonChance,.35);
assert.equal(card.poisonDamage,50);assert.equal(card.poisonTurns,3);assert.equal(card.accuracy,.90);
const unit=(id,team)=>({id,name:id,team,index:0,x:team?750:250,y:430,hp:3000,maxHp:3000,mana:10,maxMana:20,statuses:[],masteries:[],skills:{},hand:[]});
function setup(mode='tester'){
 const c=unit('a',0),t=unit('b',1),s={mode,phase:'resolving',round:1,units:[c,t],auras:[null,null],log:[],flashes:[],sequence:[],queueAt:0};
 ctx.window.setBeesState(s);return {c,t,s};
}
const cast=(c,t,roll)=>({card,action:{casterId:c.id,targetId:t.id},source:c.id,target:t.id,runeResult:'success',damageVariant:1,poisonRoll:roll});
{
 const {c,t}=setup(),a=cast(c,t,.349);
 api.applySpell(a);assert.equal(t.hp,2700);const poison=t.statuses.find(s=>s.kind==='poison');
 assert.ok(poison);assert.equal(poison.remaining,3);assert.equal(poison.value,50);
 api.applySpell(a);assert.equal(t.hp,2700);
}
{
 const {c,t}=setup();api.applySpell(cast(c,t,.35));assert.equal(t.hp,2700);assert.ok(!t.statuses.some(s=>s.kind==='poison'));
}
{
 const {c,t}=setup('story');api.applySpell(cast(c,t,0));assert.equal(t.hp,3000);assert.equal(t.statuses.length,0);
}
{
 const {c,t}=setup(),a=cast(c,t,0);a.runeResult='failed';api.applySpell(a);assert.equal(t.hp,3000);
}
// Check all authored atlases are real WebP images with their intended dimensions.
for(const name of ['swarm','summon','impact']){
 const buf=fs.readFileSync('assets/killer-bees-'+name+'.webp');
 assert.equal(buf.toString('ascii',0,4),'RIFF');assert.equal(buf.toString('ascii',8,12),'WEBP');
 assert.equal(buf.readUIntLE(24,3)+1,1536);assert.equal(buf.readUIntLE(27,3)+1,512);
}
const artCtx={window:{},Image:class{},setTimeout:()=>0,clearTimeout(){}};
vm.runInNewContext(fs.readFileSync('assets/killer-bees.js','utf8'),artCtx);
const art=artCtx.window.KillerBees;
for(const [c,t] of [[unit('l',0),unit('r',1)],[unit('r',1),unit('l',0)]]){
 const s=art.scene(c,t,.64,1);assert.equal(s.x,t.x);assert.equal(s.y,s.hit.y);
 assert.equal(s.dir,t.team?1:-1);assert.ok(art.scene(c,t,.95,1).alpha<1);
}
console.log('Killer Bees: test-only, damage, poison boundary, failure, atlas sizes and target alignment passed.');
