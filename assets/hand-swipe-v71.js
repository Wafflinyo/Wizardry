/* Browse the overlapping hand without confusing horizontal drags with taps. */
(function(root){
'use strict';
function attach(hand){
 let gesture=null,suppressUntil=0,browseId=null,lastTap=null;
 const cards=()=>[...hand.children].filter(b=>!b.hidden&&b.dataset.card)
   .sort((a,b)=>Number(a.style.order)-Number(b.style.order));
 function focus(index){
  const held=cards();if(!held.length)return;
  index=Math.max(0,Math.min(held.length-1,index));browseId=held[index];
  for(const b of hand.children)b.classList.toggle('browsed',b===held[index]);
 }
 function focusCard(id,copy=0){const index=cards().findIndex(b=>b.dataset.card===id&&(Number(b.dataset.copy)||0)===copy);if(index>=0)focus(index);}
 function reset(){browseId=null;lastTap=null;hand.classList.remove('is-browsing');for(const b of hand.children)b.classList.remove('browsed');}
 hand.addEventListener('pointerdown',event=>{
  if(event.isPrimary===false||event.button!==0)return;
  const held=cards();if(!held.length||held.every(b=>b.disabled))return;
  // A fresh deliberate tap is valid immediately after the last swipe.
  suppressUntil=0;
  // Enlarged cards share a visual center. Navigate by hand order instead.
  const current=held.indexOf(browseId);
  const pressed=held.indexOf(event.target?.closest?.('button[data-card]'));
  const index=current>=0?current:pressed>=0?pressed:Math.floor((held.length-1)/2);
  const step=Math.max(32,Math.min(88,(hand.clientWidth||360)*.12));
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY,swiping:false,index,step};
 });
 hand.addEventListener('pointermove',event=>{
  if(!gesture||event.pointerId!==gesture.id)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(!gesture.swiping){
   if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
   if(Math.abs(dx)<7||Math.abs(dx)<Math.abs(dy)*1.15)return;
   gesture.swiping=true;lastTap=null;hand.classList.add('is-browsing');hand.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
  const distance=Math.abs(dx);
  const steps=distance<7?0:Math.sign(dx)*Math.max(1,Math.round(distance/gesture.step));
  focus(gesture.index+steps);
 },{passive:false});
 function finish(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  if(gesture.swiping)suppressUntil=Date.now()+500;
  hand.classList.remove('is-browsing');
  gesture=null;
  if(hand.hasPointerCapture(event.pointerId))hand.releasePointerCapture(event.pointerId);
 }
 hand.addEventListener('pointerup',finish);
 hand.addEventListener('pointercancel',finish);
 hand.addEventListener('lostpointercapture',finish);
 hand.addEventListener('click',event=>{
  if(event.detail===0)return;
  const now=Date.now();
  if(now<suppressUntil){event.preventDefault();event.stopImmediatePropagation();return;}
  const card=event.target?.closest?.('button[data-card]');
  if(!card||card.hidden||card.disabled)return;
  if(card===browseId&&card===lastTap?.card&&now-lastTap.time<=350){
   event.preventDefault();
   event.stopImmediatePropagation();
   reset();
   return;
  }
  lastTap={card,time:now};
 },true);
 hand.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  const held=cards(),index=held.indexOf(browseId??event.target);
  event.preventDefault();
  focus((index<0?Math.floor((held.length-1)/2):index)+(event.key==='ArrowRight'?1:-1));
  browseId?.focus({preventScroll:true});
 });
 return {reset,focusCard};
}
root.WIZARDRY_HAND_SWIPE_V71={attach};
})(window);
