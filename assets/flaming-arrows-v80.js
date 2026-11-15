/* Low-poly fire rune portal and a cosmetic barrage: one combat hit per enemy. */
(function(root){
'use strict';
const TAU=Math.PI*2,C=v=>Math.max(0,Math.min(1,v)),L=(a,b,t)=>a+(b-a)*t;
const hitAt=i=>440+i*55;
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function circle(c,dir,p,alpha=1){
 c.save();c.globalAlpha*=alpha;c.translate(500,155);c.rotate(-dir*.52);c.scale(1,.43);const scale=.5+.5*C(p);c.scale(scale,scale);
 c.shadowColor='#ff6c20';c.shadowBlur=17;c.strokeStyle='#ffb65e';c.lineWidth=4;
 for(const r of [107,94,68]){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}c.shadowBlur=0;
 c.strokeStyle='#ffe3a0';c.lineWidth=2.4;
 for(let i=0;i<12;i++){const a=i*TAU/12+p*.15;c.save();c.rotate(a);c.translate(0,-81);
  c.beginPath();c.moveTo(-5,7);c.lineTo(0,-8);c.lineTo(5,7);c.moveTo(-4,2);c.lineTo(5,-3);if(i%2){c.moveTo(0,-8);c.lineTo(7,-12);}c.stroke();c.restore();
 }
 c.rotate(p*.18);c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;c.moveTo(Math.cos(a)*67,Math.sin(a)*67);c.lineTo(Math.cos(a+TAU/3)*67,Math.sin(a+TAU/3)*67);}c.stroke();
 poly(c,[[-10,22],[-21,3],[-9,-13],[-4,-34],[13,-15],[9,-3],[22,10],[9,25]],'#ff9b34');poly(c,[[-5,20],[-10,7],[0,-11],[8,9],[5,20]],'#ffe9a5');c.restore();
}
function arrow(c,start,end,q,seed){
 const x=L(start.x,end.x,q),y=L(start.y,end.y,q),angle=Math.atan2(end.y-start.y,end.x-start.x);
 c.save();c.translate(x,y);c.rotate(angle);
 // Streaming flame ribbons curl behind the arrowhead, never an ice-like solid bolt.
 for(let j=2;j>=0;j--){c.globalAlpha=.25+j*.12;c.strokeStyle=j===2?'#f66b24':'#ffb837';c.lineWidth=4+j*2;c.beginPath();
  for(let k=0;k<13;k++){const u=k/12,xx=-u*(43+seed%4*7),yy=Math.sin(u*9+q*24+seed)*u*(3+j*1.5);k?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}
 c.globalAlpha=1;c.strokeStyle='#8b4927';c.lineWidth=3;c.beginPath();c.moveTo(-31,0);c.lineTo(8,0);c.stroke();
 poly(c,[[-30,0],[-39,-6],[-35,0],[-39,6]],'#ffc16b');poly(c,[[13,0],[-1,-6],[1,0],[-1,6]],'#fff2bc');
 poly(c,[[20,0],[5,-10],[-6,-6],[-16,-8],[-8,3],[0,10],[11,7]],'#ff6c20');poly(c,[[17,0],[5,-5],[-4,0],[4,5]],'#ffe9a0');
 for(let k=0;k<3;k++){const xx=-20-k*12,yy=Math.sin(q*33+seed+k)*9;c.fillStyle=k%2?'#ffdc72':'#fb7a28';c.fillRect(xx,yy,2.5,2.5);}c.restore();
}
function impacts(c,target,age,seed){if(age<0||age>300)return;const p=age/300;c.save();c.globalAlpha*=1-p;
 c.strokeStyle='#ffad4f';c.lineWidth=2;c.beginPath();c.ellipse(target.x,target.y,9+p*30,3+p*9,0,0,TAU);c.stroke();
 for(let i=0;i<8;i++){const a=i*2.399+seed,r=8+33*p,x=target.x+Math.cos(a)*r,y=target.y-Math.abs(Math.sin(a))*36*Math.sin(p*Math.PI)+12*p*p;poly(c,[[x,y-4],[x+2,y],[x,y+4],[x-2,y]],i%3?'#ff993b':'#ffe1a1');}c.restore();}
function items(o){
 const targets=o.targets||[],elapsed=o.stage==='rain-barrage'?C(o.progress)*1800:o.stage==='rain-fade'?1800+C(o.progress)*450:-1;
 const result=[];if(elapsed<0)return result;
 targets.forEach((t,i)=>{for(let j=0;j<8;j++){
  const delay=i*55+j*130,age=elapsed-delay,q=age/440,offset=j===0?0:Math.sin(j*5.7+i)*37;
  const end={x:t.x+offset,y:t.y-30+(j%3)*9},start={x:500+Math.sin(j*2.4+i)*64,y:155+Math.cos(j*2.4+i)*24};
  if(q>=0&&q<=1)result.push({type:'arrow',start,end,q,seed:j+i*9,depthY:t.y-1});
  if(age>=440&&age<740)result.push({type:'impact',target:end,age:age-440,seed:j+i*9,depthY:t.y+.1});
 }});return result;
}
function drawItem(c,item){if(item.type==='arrow')arrow(c,item.start,item.end,item.q,item.seed);else impacts(c,item.target,item.age,item.seed);}
function drawCircle(c,o){const p=C(o.progress),dir=(o.targets?.[0]?.x||750)>=500?1:-1,alpha=o.stage==='rain-form'?C(p*2):o.stage==='rain-fade'?1-p:1;
 circle(c,dir,o.stage==='rain-form'?p:1,alpha);}
function drawPortrait(c,w,h){c.save();const scale=Math.min((w-16)/290,(h-16)/335);c.translate(w/2,h/2);c.scale(scale,scale);c.translate(-500,-258);circle(c,1,1);for(let i=0;i<4;i++)arrow(c,{x:455+i*25,y:162},{x:590+i*17,y:405-i*13},.40+i*.13,i);c.restore();}
root.WIZARDRY_FLAMING_ARROWS_V80={hitAt,items,drawItem,drawCircle,drawPortrait};
})(window);
