const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const node={getContext:()=>({})},ctx={window:{},document:{getElementById:()=>node},Image:class{},requestAnimationFrame(){},console};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace(
 '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
 '  window.setMineState=s=>state=s;paintUI=()=>{};'),ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST,card=api.testCards.find(c=>c.id==='thundermine');
assert.ok(card.testOnly&&!api.cards.some(c=>c.id===card.id));
const unit=(id,team)=>({id,name:id,team,index:0,x:team?750:250,y:430,hp:3000,maxHp:3000,mana:10,maxMana:20,statuses:[],masteries:[],skills:{},hand:[]});
function setup(){const c=unit('a',0),t=unit('b',1),s={mode:'tester',phase:'resolving',round:1,units:[c,t],auras:[null,null],log:[],flashes:[],sequence:[],queueAt:0};ctx.window.setMineState(s);return {c,t,s};}
const cast=(c,t)=>({card,action:{casterId:c.id,targetId:t.id},source:c.id,target:t.id,runeResult:'success',damageVariant:1});
const active=t=>t.statuses.find(st=>st.kind==='thunder_mine');
{
 const {c,t}=setup();const a=cast(c,t);api.applySpell(a);assert.equal(t.hp,2800);assert.equal(active(t).expiresRound,4);
 assert.equal(api.thunderMineTriggerable({card:{target:'ally',heal:200},runeResult:'success'}),false);
 assert.equal(api.thunderMineTriggerable({card:{target:'enemy',damage:200},runeResult:'failed'}),false);
 const reaction={card:{target:'enemy',damage:200},runeResult:'success'};
 assert.ok(api.beginThunderMineDetonation(reaction,t));assert.equal(reaction.stage,'mine-detonation');assert.ok(active(t));
 api.applyThunderMineDetonation(reaction);assert.equal(t.hp,2500);assert.ok(!active(t));api.applyThunderMineDetonation(reaction);assert.equal(t.hp,2500);
}
{
 const {c,t}=setup();t.statuses=['growth','blazing_rage','flow_state','live_wire'].map(kind=>({kind,value:1}));
 api.applySpell(cast(c,t));assert.equal(t.statuses.length,4);assert.ok(!active(t));assert.equal(t.hp,2800);
}
{
 const {c,t}=setup();api.applySpell(cast(c,t));api.consumeStatus(t,'thunder_mine');assert.equal(api.beginThunderMineDetonation({card,runeResult:'success'},t),false);
}
console.log('Thunder Mine: initial damage, four-rune cap, successful-cast reaction, cleanse and single detonation passed.');
