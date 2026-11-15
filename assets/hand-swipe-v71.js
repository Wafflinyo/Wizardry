/* Browse the overlapping hand without confusing horizontal drags with taps. */
(function(root){
'use strict';
function attach(hand){
 let gesture=null,suppressUntil=0,browseId=null;
 const cards=()=>[...hand.children].filter(b=>!b.hidden&&b.dataset.card)
   .sort((a,b)=>Number(a.style.order)-Number(b.style.order));
 function focus(index){
  const held=cards();if(!held.length)return;
  index=Math.max(0,Math.min(held.length-1,index));browseId=held[index].dataset.card;
  for(const b of hand.children)b.classList.toggle('browsed',b===held[index]);
 }
 function focusCard(id){const index=cards().findIndex(b=>b.dataset.card===id);if(index>=0)focus(index);}
 function reset(){browseId=null;hand.classList.remove('is-browsing');for(const b of hand.children)b.classList.remove('browsed');}
 hand.addEventListener('pointerdown',event=>{
  if(event.isPrimary===false||event.button!==0)return;
  const held=cards();if(!held.length||held.every(b=>b.disabled))return;
  // A fresh deliberate tap is valid immediately after the last swipe.
  suppressUntil=0;
  // Cache the actual fan geometry once. Browsing follows the card under
  // the finger, rather than inverted fixed jumps from the middle card.
  const centers=held.map(b=>{const r=b.getBoundingClientRect();return r.left+r.width/2;});
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY,swiping:false,centers};
 });
 hand.addEventListener('pointermove',event=>{
  if(!gesture||event.pointerId!==gesture.id)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(!gesture.swiping){
   if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
   if(Math.abs(dx)<7||Math.abs(dx)<Math.abs(dy)*1.15)return;
   gesture.swiping=true;hand.classList.add('is-browsing');hand.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
  let index=0,distance=Infinity;
  for(let i=0;i<gesture.centers.length;i++){
   const d=Math.abs(event.clientX-gesture.centers[i]);
   if(d<distance){distance=d;index=i;}
  }
  focus(index);
 },{passive:false});
 function finish(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  if(gesture.swiping)suppressUntil=Date.now()+500;
  hand.classList.remove('is-browsing');
  if(hand.hasPointerCapture(event.pointerId))hand.releasePointerCapture(event.pointerId);
  gesture=null;
 }
 hand.addEventListener('pointerup',finish);
 hand.addEventListener('pointercancel',finish);
 hand.addEventListener('click',event=>{
  if(Date.now()<suppressUntil&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 hand.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  const held=cards(),index=held.findIndex(b=>b.dataset.card===browseId);
  event.preventDefault();focus((index<0?Math.floor((held.length-1)/2):index)+(event.key==='ArrowRight'?1:-1));
 });
 return {reset,focusCard};
}
root.WIZARDRY_HAND_SWIPE_V71={attach};
})(window);
