/* Wizardry v0.57: approved vampire sprite, coffin, flight, blood orb. */
(function(root){
"use strict";
const C=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),L=(a,b,t)=>a+(b-a)*t,E=t=>{t=C(t);return t*t*(3-2*t)},T=Math.PI*2;
const art=new Image();art.decoding="async";const callbacks=[];
art.onload=()=>callbacks.forEach(fn=>{try{fn()}catch(e){}});
art.src="./assets/vampire-siphon-v57.webp?v=0.57.0";
function ready(){return art.complete&&art.naturalWidth===1280&&art.naturalHeight===960}
function onReady(fn){if(typeof fn==="function"){if(ready())fn();else callbacks.push(fn)}}
function frame(c,i,x,y,s=255,alpha=1,dir=1){
 if(!ready())return false;
 c.save();c.globalAlpha*=C(alpha);c.translate(x,y);c.scale(dir,1);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 c.drawImage(art,(i%4)*320,Math.floor(i/4)*320,320,320,-s/2,-s/2,s,s);
 c.restore();return true;
}
function ball(c,x,y,r,time,alpha=1){
 c.save();c.globalAlpha*=C(alpha);
 const grd=c.createRadialGradient(x,y,1,x,y,r*2.8);
 grd.addColorStop(0,"#fff1ed");grd.addColorStop(.19,"#ff4d5e");grd.addColorStop(.5,"#c20c3aaa");grd.addColorStop(1,"#b3003600");
 c.fillStyle=grd;c.beginPath();c.arc(x,y,r*2.8,0,T);c.fill();
 c.shadowBlur=12;c.shadowColor="#ff305b";c.fillStyle="#a4002b";
 c.beginPath();c.arc(x,y,r,0,T);c.fill();c.shadowBlur=0;
 c.fillStyle="#ffc8bd";c.beginPath();c.arc(x-r*.24,y-r*.33,r*.25,0,T);c.fill();
 for(let i=0;i<9;i++){
  const a=i*T/9+time*.003,d=r*(1.6+i%3*.2);
  c.globalAlpha*=.7;c.fillStyle=i%2?"#ffb1a2":"#ff4e70";
  c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d*.78,2,0,T);c.fill();
 }
 c.restore();
}
const stages=["vamp-rise","vamp-open","vamp-lunge","vamp-drain","vamp-return","vamp-present","vamp-orb","vamp-vanish"];
function anchors(o){
 const foe=o.target||{x:770,y:385},owner=o.caster||{x:190,y:365};
 const d=foe.x>=500?1:-1,b=owner.x>=500?1:-1;
 return {foe,owner,d,b,origin:{x:500,y:315},
   victim:{x:foe.x-d*100,y:foe.y-112},
   presenter:{x:owner.x-b*122,y:owner.y-135},
   orbFrom:{x:owner.x-b*70,y:owner.y-134},
   orbTo:{x:owner.x,y:owner.y-105}};
}
function position(o){
 const a=anchors(o),p=C(o.progress||0);
 if(o.stage==="vamp-lunge")return{x:L(a.origin.x,a.victim.x,E(p)),y:L(a.origin.y,a.victim.y,E(p))-18*Math.sin(p*Math.PI)};
 if(o.stage==="vamp-drain")return a.victim;
 if(o.stage==="vamp-return")return{x:L(a.victim.x,a.presenter.x,E(p)),y:L(a.victim.y,a.presenter.y,E(p))-35*Math.sin(p*Math.PI)};
 return a.presenter;
}
function drain(c,o){
 const a=anchors(o),p=C(o.progress||0),fade=Math.min(1,p*7)*(1-E((p-.83)/.17));
 c.save();
 for(let i=0;i<19;i++){
  const u=(p*.75+i/19)%1;
  const x=L(a.foe.x,a.victim.x+a.d*58,u),y=L(a.foe.y-90,a.victim.y,u)-26*Math.sin(Math.PI*u+i);
  c.globalAlpha=fade*(.33+.64*(1-u));c.fillStyle=i%2?"#ff9b9b":"#dd174b";
  c.beginPath();c.arc(x,y,2.2+i%3,0,T);c.fill();
 }
 c.restore();
}
function draw(c,o){
 if(!c||!o||!stages.includes(o.stage))return false;
 const s=o.stage,p=C(o.progress||0),time=Number(o.time)||0,a=anchors(o),at=position(o);
 c.save();
 if(s==="vamp-rise")frame(c,p<.25?0:p<.68?1:2,500,467,285,E(p/.2));
 else if(s==="vamp-open")frame(c,p<.37?2:3,500,467,285);
 else frame(c,2,500,467,285,s==="vamp-vanish"?1-E(p):.65);
 if(!["vamp-rise","vamp-open"].includes(s)){
  const returning=["vamp-return","vamp-present","vamp-orb","vamp-vanish"].includes(s);
  const dir=returning?a.b:a.d;
  const pose=s==="vamp-lunge"?(p<.28?5:p<.7?6:7):
     s==="vamp-drain"?7:s==="vamp-return"?(p<.45?8:9):
     s==="vamp-present"?(p<.45?9:10):10;
  frame(c,pose,at.x,at.y,265,s==="vamp-vanish"?1-E(p):1,dir);
  if(s==="vamp-drain"){drain(c,o);ball(c,at.x+dir*53,at.y+9,12+14*E(p),time,E(p/.45));}
  if(s==="vamp-return")ball(c,at.x+dir*53,at.y+9,21,time);
  if(s==="vamp-present")ball(c,at.x+dir*50,at.y+9,21,time,E(p/.25));
  if(s==="vamp-orb"){
   const k=E(p),x=L(a.orbFrom.x,a.orbTo.x,k),
     y=L(a.orbFrom.y,a.orbTo.y,k)-26*Math.sin(Math.PI*k);
   for(let i=1;i<5;i++){
     const v=E(C(p-i*.033));
     if(v>0)ball(c,L(a.orbFrom.x,a.orbTo.x,v),
       L(a.orbFrom.y,a.orbTo.y,v)-26*Math.sin(Math.PI*v),4,time,.28);
   }ball(c,x,y,19,time);
  }
 }
 c.restore();return true;
}
function drawForeground(c,o){
 if(!c||o?.stage!=="vamp-orb"||o.progress<=.82)return false;
 const a=anchors(o),p=C((o.progress-.82)/.18);
 c.save();c.globalAlpha=1-p;c.strokeStyle="#ffd2ca";c.lineWidth=3;
 c.beginPath();c.arc(a.orbTo.x,a.orbTo.y,19+51*p,0,T);c.stroke();c.restore();return true;
}
function drawCardArt(c,w,h){
 if(!c)return false;
 c.save();c.translate(w*.5,h*.95);c.scale(.55,.55);c.translate(-500,-470);
 const ok=frame(c,4,500,470,315);
 if(!ok){c.font="bold 80px Georgia";c.fillStyle="#ecb9c8";c.textAlign="center";c.fillText("☠",500,470)}
 c.restore();return true;
}
root.WIZARDRY_VAMPIRE_V57={draw,drawForeground,drawCardArt,anchors,position,
 onReady,imageReady:ready,stages,frames:12};
})(window);