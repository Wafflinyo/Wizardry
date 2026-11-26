/* Octo Whip: 32 individually illustrated transparent submerged poses.
   Stable head/waterline anchor; no old walking or full-body octopus frames. */
(function(root){'use strict';
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2;
const smooth=p=>{p=C(p);return p*p*(3-2*p);};
const W=200,H=264,S=1.65,AX=70,AY=224,CONTACT_X=189;
const image=new Image(),listeners=[];let ready=false;
image.onload=()=>{ready=image.naturalWidth===1600&&image.naturalHeight===1056;if(ready)listeners.forEach(fn=>fn());};
image.src='./assets/octo-submerged-v99.webp';
function pose(p,target){
 p=C(p);
 const dir=target.x>=500?1:-1;
 // The pool approaches before the long tentacle rises. Contact is aligned
 // to the far side of the authored splash, not to the submerged head.
 // Swim for 35% of the cast, then stop farther from the victim.
 const reach=smooth((p-.08)/.35),floor=L(510,target.y+26,reach);
 const contactX=target.x-dir*(CONTACT_X-AX)*S;
 let frame;
 if(p<.43)frame=Math.min(2,Math.floor(p/.43*3));
 else if(p<.53)frame=3+Math.floor((p-.43)/.10*5);
 else if(p<.66)frame=8+Math.floor((p-.53)/.13*8);
 // Fast downward snap, keeping the existing damage contact at 70%.
 else if(p<.70)frame=16+Math.floor((p-.66)/.04*4);
 else if(p<.90)frame=20+Math.floor((p-.70)/.20*10);
 else frame=Math.min(31,30+Math.floor((p-.90)/.05));
 const exit=smooth((p-.90)/.10);
 return {dir,frame,x:L(500,contactX,reach),y:floor,groundY:floor,exit,alpha:smooth(p/.12)*(1-exit),tip:{x:target.x,y:target.y}};
}
function sprite(c,frame,x,y,scale=S){
 if(!ready)return;
 c.drawImage(image,frame%8*W,Math.floor(frame/8)*H,W,H,x-AX*scale,y-AY*scale,W*scale,H*scale);
}
function polygon(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
// Separate target-centered low-poly impact: fast whitewater crown,
// outward pressure rings, and heavy angular spray that falls back down.
function splash(c,x,y,q){
 if(q<0||q>1)return;
 const burst=1-smooth(q),spread=smooth(q/.68);
 c.save();c.globalAlpha*=1-smooth((q-.58)/.42);
 // Two staggered ground shockwaves, brightest just after contact.
 for(let j=0;j<3;j++){
  const t=(q-j*.075)/.85;if(t<0||t>1)continue;
  c.save();c.globalAlpha*=1-t;c.strokeStyle=j===0?'#d9fcff':'#61d9ff';c.lineWidth=2+6*(1-t);
  c.beginPath();c.ellipse(x,y,18+155*t,5+36*t,0,0,T);c.stroke();c.restore();
 }
 // The initial impact flashes at the target rather than at the octopus.
 if(q<.18){c.save();c.globalAlpha*=(1-q/.18)*.85;c.fillStyle='#e5fdff';c.beginPath();c.ellipse(x,y-4,38+q*90,10+q*36,0,0,T);c.fill();c.restore();}
 const rise=Math.sin(Math.PI*Math.min(1,.16+q*1.35));
 for(let i=0;i<13;i++){
  const a=i*2.399,dx=Math.cos(a),dy=Math.sin(a);
  const r=12+spread*(62+i%4*13),xx=x+dx*r,yy=y+dy*r*.23;
  const height=(82+i%5*17)*rise,wide=(8+i%4*3)*(1-q*.55);
  polygon(c,[[xx-wide,yy],[xx+dx*height*.48,yy-height],[xx+wide,yy-5],[xx+wide*.36,yy+4]],i%3?'#299fd9':'#75dcf9');
  polygon(c,[[xx-wide*.25,yy-2],[xx+dx*height*.48,yy-height],[xx+wide*.4,yy-7]],i%2?'#a8eeff':'#ebffff');
 }
 for(let i=0;i<48;i++){
  const a=i*2.399,r=18+q*(92+i%7*15),xx=x+Math.cos(a)*r;
  const yy=y+Math.sin(a)*r*.24-Math.max(0,4*q*(1-q))*(55+i%7*19);
  const s=(3+i%4)*(1-q*.7);
  polygon(c,[[xx-s,yy+s],[xx-s*.8,yy-s*2.3],[xx,yy-s*3.7],[xx+s,yy]],i%3?'#56b9e8':'#e1fcff');
 }
 c.restore();
}
function shake(p,dir=1,duration=4400){
 const dt=(p-.70)*duration;
 if(dt<0||dt>=240)return {x:0,y:0};
 const a=(1-dt/240)**2;
 return {x:dir*Math.sin(dt*.115)*7*a,y:Math.cos(dt*.09)*10*a};
}
function draw(c,{progress:p,target,layer='body'}){
 if(!target)return;const b=pose(p,target);
 if(layer==='ground')return; // Water is already part of the authored transparent poses.
 if(layer==='whip'){splash(c,target.x,target.y-8,(p-.70)/.20);return;}
 c.save();c.globalAlpha*=b.alpha;c.translate(b.x,b.y);c.scale(b.dir,1);
 sprite(c,b.frame,0,0);c.restore();
}
function portrait(c,w,h){
 const k=Math.min(w/W,h/H);
 c.save();c.translate(w*.36,h*.93);sprite(c,11,0,0,k);c.restore();
}
// Maintain the normal depth sort for unrelated effects. Reorder only the
// fighter models and Octo's body/whip slots as enemy -> Octo -> ally.
function orderRenderables(entries,casterTeam){
 const rank=e=>e.type==="wizard"?(e.unitTeam===casterTeam?2:0):1;
 const selected=e=>e.type==="wizard"||e.type==="octo-body"||e.type==="octo-whip";
 const ordered=entries.filter(selected).sort((a,b)=>rank(a)-rank(b));
 let i=0;
 return entries.map(e=>selected(e)?ordered[i++]:e);
}

root.WIZARDRY_OCTO_V95={draw,portrait,pose,shake,orderRenderables,onReady:fn=>listeners.push(fn)};
})(window);
