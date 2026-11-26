/* Octo Whip: 32 individually illustrated transparent submerged poses.
   Stable head/waterline anchor; no old walking or full-body octopus frames. */
(function(root){'use strict';
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2;
const smooth=p=>{p=C(p);return p*p*(3-2*p);};
const W=200,H=264,S=1.65,AX=70,AY=224,CONTACT_X=152;
const image=new Image(),listeners=[];let ready=false;
image.onload=()=>{ready=image.naturalWidth===1600&&image.naturalHeight===1056;if(ready)listeners.forEach(fn=>fn());};
image.src='./assets/octo-submerged-v99.webp';
function pose(p,target){
 p=C(p);
 const dir=target.x>=500?1:-1;
 // The pool approaches before the long tentacle rises. Contact is aligned
 // to the far side of the authored splash, not to the submerged head.
 const reach=smooth((p-.12)/.22),floor=L(510,target.y,reach);
 const contactX=target.x-dir*(CONTACT_X-AX)*S;
 let frame;
 if(p<.24)frame=Math.floor(p/.24*3);
 else if(p<.43)frame=3+Math.floor((p-.24)/.19*5);
 else if(p<.61)frame=8+Math.floor((p-.43)/.18*8);
 else if(p<.70)frame=16+Math.floor((p-.61)/.09*4);
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
function splash(c,x,y,q){
 if(q<0||q>1)return;
 c.save();c.globalAlpha*=Math.sin(Math.PI*Math.min(1,q*1.7))*(1-q*.6);
 c.strokeStyle='#a4edff';c.lineWidth=5*(1-q)+1;
 for(let j=0;j<3;j++){c.beginPath();c.ellipse(x,y,Math.max(1,25+q*110+j*12),Math.max(1,6+q*20+j*4),0,0,T);c.stroke();}
 for(let i=0;i<34;i++){const a=i*2.399,r=25+q*(65+i%6*12),xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.22-Math.sin(q*Math.PI)*(35+i%7*13),s=(3+i%4)*(1-q*.65);
 polygon(c,[[xx-s,yy+s],[xx-s*.7,yy-s*2.3],[xx,yy-s*3.5],[xx+s,yy]],i%3?'#56b9e8':'#d1faff');}
 c.restore();
}
function draw(c,{progress:p,target,layer='body'}){
 if(!target)return;const b=pose(p,target);
 if(layer==='ground')return; // Water is already part of the authored transparent poses.
 if(layer==='whip'){splash(c,target.x,target.y-8,(p-.70)/.16);return;}
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

root.WIZARDRY_OCTO_V95={draw,portrait,pose,orderRenderables,onReady:fn=>listeners.push(fn)};
})(window);
