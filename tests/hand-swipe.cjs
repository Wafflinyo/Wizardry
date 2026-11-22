const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let now=1000;const handlers={},captures=new Set();
const children=Array.from({length:5},(_,i)=>({hidden:false,disabled:false,dataset:{card:String(i)},style:{order:String(i)},getBoundingClientRect(){throw Error('Browsing must not use enlarged card bounds');},classes:new Set(),classList:{toggle(k,on){on?children[i].classes.add(k):children[i].classes.delete(k)},remove(k){children[i].classes.delete(k)}}}));
const styles=new Map();
const hand={children,clientWidth:360,style:{setProperty(k,v){styles.set(k,v)},removeProperty(k){styles.delete(k)}},classList:{add(){},remove(){}},addEventListener:(name,fn)=>handlers[name]=fn,setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
const ctx={window:{},Date:{now:()=>now}};vm.runInNewContext(fs.readFileSync('assets/hand-swipe-v71.js','utf8'),ctx);const control=ctx.window.WIZARDRY_HAND_SWIPE_V71.attach(hand);
function emit(type,x,y=10){handlers[type]({type,pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y,preventDefault(){}})}
let blocked=false;function click(){blocked=false;handlers.click({detail:1,preventDefault(){blocked=true},stopImmediatePropagation(){}});return blocked}
emit('pointerdown',180);emit('pointermove',130);
assert.equal(styles.get('--fan-drag'),'-50px');
assert.equal(children.some(b=>b.classes.has('browsed')),false,'drag does not cycle previews');
emit('pointerup',130);assert.ok(children[3].classes.has('browsed'));assert.equal(click(),true);
assert.equal(styles.has('--fan-drag'),false);
now+=600;emit('pointerdown',180);emit('pointermove',230);emit('pointerup',230);
assert.ok(children[2].classes.has('browsed'),'reverse drag returns to previous card');
emit('pointerdown',180);emit('pointerup',180);assert.equal(click(),false,'deliberate tap still selects');
emit('pointerdown',180);emit('pointermove',182,50);emit('pointerup',182,50);assert.equal(click(),false,'vertical scroll is left to browser');
control.focusCard('0');
for(let i=1;i<5;i++){
 emit('pointerdown',180);emit('pointermove',150);emit('pointerup',150);
 assert.ok(children[i].classes.has('browsed'),'short repeated slides reach every card');
 assert.equal(children.filter(b=>b.classes.has('browsed')).length,1);
}
emit('pointerdown',20);emit('pointermove',210);emit('pointerup',210);
assert.ok(children[0].classes.has('browsed'),'long slide reaches the opposite end');
control.reset();assert.equal(children.some(b=>b.classes.has('browsed')),false);
console.log('Ordered card browsing, reverse slide, release-click suppression and direct tap checks passed.');
