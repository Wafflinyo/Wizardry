const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  window.test={set:s=>state=s,damage};paintUI=()=>{};');
const node={getContext:()=>({})},ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{},console};
vm.runInNewContext(source,ctx);const api=ctx.window.WIZARDRY_ARENA_TEST,test=ctx.window.test;
const unit=(id,team)=>({id,team,index:0,name:id,hp:5000,maxHp:5000,mana:10,statuses:[],x:team?800:200,y:450});
let s;function battle(){s={units:[unit('a',0),unit('b',1),unit('c',1)],round:1,phase:'resolving',auras:{},log:[],flashes:[],humanByTeam:{0:'a'}};test.set(s);}
const action=id=>({card:api.cards.find(c=>c.id===id),source:'a',target:'b',runeResult:'success'});
const numbers=()=>s.flashes.filter(f=>/^-\d+$/.test(f.text));
for(const [id,count,hit] of [['windfist',10,(a,i)=>api.applyWindFistHit(a,i)],['penguins',3,(a,i)=>api.applyPenguinHit(a,i,1)],['ronin',3,(a,i)=>api.applyRoninHit(a,i)]]){
 battle();const a=action(id),perHit=a.card.hitDamage||a.card.damage;
 for(let i=0;i<count;i++){
  hit(a,i);assert.equal(numbers().length,1,id+' uses one damage number');
  assert.equal(numbers()[0].text,'-'+perHit*(i+1));
  numbers()[0].age=.4;hit(a,i);assert.equal(numbers()[0].text,'-'+perHit*(i+1),'duplicate hit ignored');
 }
 assert.equal(s.units[1].hp,5000-perHit*count);
}
// Totals persist across gaps longer than a floating label's lifetime.
battle();let a=action('windfist');api.applyWindFistHit(a,0);s.flashes=[];api.applyWindFistHit(a,1);assert.equal(numbers()[0].text,'-100');assert.equal(numbers()[0].age,0);
// Every target and every new cast has its own total; reductions use resolved damage.
battle();a=action('windfist');s.units[1].statuses.push({kind:'solidity',value:.25});
test.damage(s.units[0],s.units[1],100,a.card,a);test.damage(s.units[0],s.units[2],50,a.card,a);test.damage(s.units[0],s.units[1],100,a.card,a);
assert.equal(a.damageDisplays.b.message.text,'-150');assert.equal(a.damageDisplays.c.message.text,'-50');
const b=action('windfist');test.damage(s.units[0],s.units[1],50,b.card,b);assert.equal(b.damageDisplays.b.message.text,'-50');
// Full-spell blocks never create or increase a damage total.
battle();a=action('windfist');s.units[1].statuses.push({kind:'wind_dome',value:1});for(let i=0;i<10;i++)api.applyWindFistHit(a,i);assert.equal(numbers().length,0);assert.equal(s.units[1].hp,5000);
console.log('Multi-hit damage: cumulative labels for Wind Fist, Penguins and Wind Slashes; duplicate hits, expired labels, target/cast isolation, mitigation and full-spell blocks passed.');
