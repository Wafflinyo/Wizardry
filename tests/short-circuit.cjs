const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const node={getContext:()=>({})};
const context={window:{},document:{getElementById:()=>node},Image:class{},requestAnimationFrame(){},console};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),context);
const source=fs.readFileSync('arena.js','utf8').replace(
 '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
 '  window.setShortCircuitState=s=>state=s;paintUI=()=>{};');
vm.runInNewContext(source,context);
const api=context.window.WIZARDRY_ARENA_TEST,card=api.testCards.find(c=>c.id==='shortcircuit');
assert.ok(card.testOnly&&!api.cards.some(c=>c.id===card.id));
for(const [mana,expected] of [[0,350],[5,400],[10,450],[20,550],[30,650],[46,650]]){
 assert.equal(api.shortCircuitBase(card,mana),expected);
 const unit=(id,team)=>({id,name:id,team,index:0,x:team?750:250,y:430,hp:3000,maxHp:3000,mana:10,maxMana:50,statuses:[],masteries:[],skills:{},hand:[]});
 const c=unit('a',0),t=unit('b',1);t.mana=mana;
 const state={mode:'tester',phase:'resolving',round:1,units:[c,t],auras:[null,null],log:[],flashes:[],sequence:[],queueAt:0};
 context.window.setShortCircuitState(state);
 const a={card,action:{casterId:'a',targetId:'b'},source:'a',target:'b',runeResult:'success',damageVariant:1};
 api.applySpell(a);
 assert.equal(a.shortCircuitBase,expected);
 assert.equal(a.shortCircuitMana,mana);
 assert.equal(t.mana,mana);
 const hp=t.hp;api.applySpell(a);assert.equal(t.hp,hp,'no second impact');
}
console.log('Short Circuit: Test Mode isolation, mana-scaled damage, cap, no mana drain and single impact passed.');
