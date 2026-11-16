/* Octo Whip: rendered low-poly atlas, grounded poses and mirrored contact. */
(function(root){'use strict';
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2;
const image=new Image(),listeners=[];let ready=false;const feet=[235, 269, 289, 291, 285, 284, 285, 285, 281, 281, 282, 285, 287, 285, 286, 286];
image.onload=()=>{ready=true;listeners.forEach(fn=>fn());};image.src='./assets/octo-whip-v96.webp';
function pose(p,target){
 const dir=target.x>=500?1:-1,land=C(p/.20),reach=C((p-.62)/.08)*(1-C((p-.77)/.09)),exit=C((p-.90)/.10);
 let frame=p<.20?Math.min(3,Math.floor(p/.20*4)):p<.48?4+Math.floor((p-.20)/.28*4):p<.62?8+Math.min(1,Math.floor((p-.48)/.14*2)):p<.70?10+Math.min(1,Math.floor((p-.62)/.08*2)):p<.77?12:p<.86?13+Math.min(1,Math.floor((p-.77)/.09*2)):15;
 return {dir,frame,reach,exit,x:L(500,target.x-dir*110,reach),y:L(425,target.y,reach)-470*(1-land)*(1-land),alpha:1-exit};
}
function sprite(c,frame,x,y,size=280){if(!ready)return;const w=image.naturalWidth/4,h=image.naturalHeight/4;c.drawImage(image,frame%4*w,Math.floor(frame/4)*h,w,h,x-size/2,y-feet[frame]*size/w,size,size*h/w);}
function draw(c,{progress:p,target,layer='body'}){if(!target)return;const b=pose(p,target),attack=p>=.62&&p<.86;
 // Use a single full-body atlas pose, depth-sorted at the target during contact.
 if((layer==='body'&&attack)||(layer==='whip'&&!attack))return;
 c.save();c.globalAlpha*=b.alpha;
 c.save();c.globalAlpha*=.23*C(p/.20);c.fillStyle='#0b2236';c.beginPath();c.ellipse(b.x,L(428,target.y+3,b.reach),100,22,0,0,T);c.fill();c.restore();
 if(p>.18&&p<.33){const q=(p-.18)/.15;c.save();c.globalAlpha*=1-q;c.strokeStyle='#92e2fa';c.lineWidth=6*(1-q);c.beginPath();c.ellipse(500,429,70+q*130,15+q*24,0,0,T);c.stroke();for(let i=0;i<20;i++){const a=i*2.399;c.fillStyle='#6cc8e9';c.beginPath();c.arc(500+Math.cos(a)*(65+q*95),429+Math.sin(a)*20-Math.sin(q*Math.PI)*(20+i%4*9),2+i%3,0,T);c.fill();}c.restore();}
 c.translate(b.x,b.y+b.exit*55);c.scale(b.dir,1);sprite(c,b.frame,0,0);c.restore();
 if(p>=.70&&p<.78){const q=(p-.70)/.08;c.save();c.globalAlpha=(1-q)*.8;c.strokeStyle='#b9efff';c.lineWidth=4;c.beginPath();c.ellipse(target.x,target.y-75,12+q*35,8+q*20,0,0,T);c.stroke();c.restore();}
}
function portrait(c,w,h){c.save();const k=Math.min(w/280,h/280);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,5,0,0);c.restore();}
root.WIZARDRY_OCTO_V95={draw,portrait,pose,onReady:fn=>listeners.push(fn)};
})(window);
