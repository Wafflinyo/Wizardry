/* Wizardry v0.60 — Baby dragon Fire summon and independent fireball */
(function(root){
"use strict";
const PI=Math.PI,TAU=PI*2,C=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const L=(a,b,t)=>a+(b-a)*t,E=t=>{t=C(t);return t*t*(3-2*t)};
const rand=n=>{const x=Math.sin(n*89.77+12.3)*45718.12;return x-Math.floor(x)};
const img=new Image();img.decoding="async";const callbacks=[];
img.onload=()=>callbacks.splice(0).forEach(fn=>{try{fn()}catch(e){}});
img.src="./assets/baby-dragon-fire-v60.webp?v=0.60.0";
function ready(){return img.complete&&img.naturalWidth===1024&&img.naturalHeight===1024}
function onReady(fn){if(typeof fn==="function"){if(ready())fn();else callbacks.push(fn)}}
const HOME={x:500,groundY:425,size:226};
function sprite(c,index,x,y,size=HOME.size,alpha=1,dir=1){
 if(!ready()||alpha<=0)return false;
 c.save();c.globalAlpha*=C(alpha);c.translate(x,y);c.scale(dir<0?-1:1,1);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 c.drawImage(img,index%4*256,Math.floor(index/4)*256,256,256,-size/2,-size/2,size,size);
 c.restore();return true;
}
function circle(c,x,y,r,col){
 c.beginPath();c.arc(x,y,Math.max(.2,r),0,TAU);
 c.fillStyle=col;c.fill();
}
function ellipse(c,x,y,rx,ry,col){
 c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);
 c.fillStyle=col;c.fill();
}
function shadow(c,opacity){
 c.save();c.globalAlpha*=C(opacity);
 const gradient=c.createRadialGradient(500,425,3,500,425,88);
 gradient.addColorStop(0,"#26121ebc");gradient.addColorStop(1,"#26121e00");
 ellipse(c,500,425,84,21,gradient);c.restore();
}
function smoke(c,p){
 const fade=1-E((p-.1)/.9);c.save();c.globalAlpha*=fade*.85;
 for(let i=0;i<21;i++){
   const a=i*2.39996,r=(12+rand(i*8)*78)*E(p),sz=11+i%4*5+15*E(p);
   circle(c,500+Math.cos(a)*r,417+Math.sin(a)*r*.24-18*E(p),sz,
     i%3===0?"#b3aaa0a8":i%2?"#7d706fba":"#8b8181b0");
 }
 c.restore();
}
const dir=o=>(o.target?.x??760)>=HOME.x?1:-1;
function pose(o){
 const p=C(o.progress||0);
 if(o.stage==="dragon-drop")return p<.29?0:p<.63?1:2;
 if(o.stage==="dragon-land")return p<.54?3:4;
 if(o.stage==="dragon-charge")return 4+Math.min(3,Math.floor(p*4));
 if(o.stage==="dragon-shot")return p<.20?8:p<.56?9:10;
 if(o.stage==="dragon-impact")return 10;
 if(o.stage==="dragon-exit")return 12+Math.min(3,Math.floor(p*4));
 return 4;
}
function position(o){
 const p=C(o.progress||0),base=HOME.groundY-HOME.size*.49;
 if(o.stage==="dragon-drop")return{x:500,y:L(-180,base,E(p))};
 if(o.stage==="dragon-exit")return{x:500+dir(o)*82*E(p),y:base-345*E(p)};
 return{x:500,y:base+Math.sin((o.time||0)*.004)*1.5};
}
function shotAt(o){
 const t=E(C(o.progress||0)),target=o.target||{x:760,y:385},d=dir(o);
 const start={x:500+d*61,y:HOME.groundY-125};
 const end={x:target.x,y:target.y-100};
 return{x:L(start.x,end.x,t),y:L(start.y,end.y,t)-13*Math.sin(PI*t),start,end,t};
}
function fire(c,x,y,time,alpha=1){
 c.save();c.globalAlpha*=C(alpha);
 const grad=c.createRadialGradient(x-3,y-4,2,x,y,62);
 grad.addColorStop(0,"#fffbd4");
 grad.addColorStop(.2,"#ffe678ec");
 grad.addColorStop(.49,"#ff8115b9");
 grad.addColorStop(1,"#d12f1100");
 circle(c,x,y,62,grad);
 c.shadowColor="#ff7e10";c.shadowBlur=13;
 circle(c,x,y,19,"#ff6c19");circle(c,x-4,y-4,9,"#fff1ad");
 c.shadowBlur=0;
 for(let i=0;i<13;i++){
   const a=i*2.4+time*.002,r=18+rand(i*43)*24;
   circle(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.7,2.2+rand(i*7)*4.1,
     i%2?"#ffcf58":"#ff6519");
 }
 c.restore();
}
function drawShot(c,o){
 const at=shotAt(o),p=C(o.progress||0),t=o.time||0;
 c.save();
 for(let i=9;i>=1;i--){
   const q=E(C(p-i*.021));if(q<=0)continue;
   const x=L(at.start.x,at.end.x,q);
   const y=L(at.start.y,at.end.y,q)-13*Math.sin(PI*q);
   circle(c,x,y,4+(9-i)*1.5,i%2?"#ff6c2590":"#ffc23c99");
 }
 fire(c,at.x,at.y,t);
 c.restore();
}
function burst(c,x,y,p,size=1){
 const fade=1-E((p-.53)/.47),spread=E(p/.75),radius=(25+89*spread)*size;
 c.save();c.globalAlpha*=fade;
 const glow=c.createRadialGradient(x,y,2,x,y,radius);
 glow.addColorStop(0,"#fff8b6b9");glow.addColorStop(.32,"#ff9a2b91");
 glow.addColorStop(1,"#ee331400");
 circle(c,x,y,radius,glow);
 c.beginPath();c.ellipse(x,y,radius*.76,radius*.60,0,0,TAU);
 c.strokeStyle="#ffdd8c";c.lineWidth=Math.max(1,5*(1-p));c.stroke();
 for(let i=0;i<18;i++){
   const angle=i*2.399,rr=radius*(.5+rand(i*23)*.46);
   circle(c,x+Math.cos(angle)*rr,y+Math.sin(angle)*rr*.76-17*spread,
      3+rand(i*17)*5,i%3?"#ff8535":"#fff2a2");
 }
 c.restore();
}
function impact(c,o,front=false){
 const target=o.target;if(!target)return false;
 const p=C(o.progress||0),neighbors=Array.isArray(o.splashTargets)?o.splashTargets:[];
 if(!front){
   burst(c,target.x,target.y-100,p,1);
   for(const u of neighbors)burst(c,u.x,u.y-99,C((p-.06)/.94),.58);
 }else{
   c.save();c.globalAlpha*=1-E((p-.49)/.51);
   for(const u of [target,...neighbors]){
      for(let i=0;i<8;i++){
       const a=i*TAU/8+o.time*.001,rr=(18+49*E(p))*(u===target?1:.65);
       circle(c,u.x+Math.cos(a)*rr,u.y-99+Math.sin(a)*rr*.6,
        i%2?2:4,i%2?"#ffdd8b":"#ff994d");
      }
   }
   c.restore();
 }
 return true;
}
function draw(c,o){
 if(!c||!o)return false;
 const s=o.stage,layer=o.layer||"all",p=C(o.progress||0);
 if(!["dragon-drop","dragon-land","dragon-charge","dragon-shot","dragon-impact","dragon-exit"].includes(s))return false;
 c.save();
 if(layer==="actor"||layer==="all"){
   const at=position(o);
   shadow(c,s==="dragon-drop"?E(p):s==="dragon-exit"?1-E(p):1);
   if(s==="dragon-land")smoke(c,p);
   if(s==="dragon-drop"&&p>.70)smoke(c,C((p-.70)/.30)*.50);
   const alpha=s==="dragon-exit"?1-E((p-.79)/.21):1;
   if(!sprite(c,pose(o),at.x,at.y,HOME.size,alpha,dir(o)))
     circle(c,at.x,at.y,47,"#d66b2c");
   if(s==="dragon-charge"&&p>.62){
     circle(c,500+dir(o)*55,HOME.groundY-119,7+13*E((p-.62)/.38),"#ffd35bb6");
   }
 }
 if(layer==="projectile"||layer==="all"){
   if(s==="dragon-shot")drawShot(c,o);
   if(s==="dragon-impact")impact(c,o);
 }
 c.restore();return true;
}
function foreground(c,o){
 return o?.stage==="dragon-impact"?impact(c,o,true):false;
}
function depthFor(o,layer="actor"){
 if(layer==="projectile"){
   return o.stage==="dragon-shot"?
     L(HOME.groundY,(o.target?.y??387)+13,E(C(o.progress||0))):
     (o.target?.y??387)+13;
 }
 return HOME.groundY;
}
function drawCardArt(c,w,h){
 if(!c)return false;
 c.save();
 const size=Math.min(w*.92,h*1.20);
 const ok=sprite(c,7,w*.5,h*.50,size,1,1);
 if(!ok){c.font="bold 75px system-ui";c.textAlign="center";
   c.fillStyle="#ffae52";c.fillText("♨",w/2,h*.60);}
 c.restore();return true;
}
root.WIZARDRY_BABY_DRAGON_V60={
  draw,drawForeground:foreground,drawCardArt,imageReady:ready,onReady,
  fireballAt:shotAt,depthFor,actorPose:pose,actorPosition:position,
  home:HOME,frameCount:16
};
})(window);