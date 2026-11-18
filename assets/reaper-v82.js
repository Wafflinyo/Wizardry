/* Reaper: shadow portal, rising hooded figure, lunging scythe strike. */
(function(root){
'use strict';const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,TAU=Math.PI*2;
const image=new Image();image.src='./assets/reaper-v82.webp';
function pose(o){const p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450},dir=t.x>=500?1:-1;let x=500,y=516,frame=3,alpha=1;
 if(s==='reaper-circle')alpha=0;
 if(s==='reaper-rise'){frame=Math.min(3,Math.floor(p*4));y=L(600,516,p);alpha=C(p*3);}
 if(s==='reaper-windup')frame=p<.6?4:5;
 if(s==='reaper-lunge'){frame=6;x=L(500,t.x-dir*65,1-(1-p)*(1-p));y=L(516,t.y+6,p);}
 if(['reaper-slash','reaper-dissolve','reaper-close'].includes(s)){x=t.x-dir*65;y=t.y+6;}
 if(s==='reaper-slash')frame=p<.55?7:8;
 if(s==='reaper-dissolve'){frame=p<.3?9:p<.7?10:11;alpha=1-p;}
 if(s==='reaper-close')alpha=0;
 return{x,y,dir,frame,alpha,groundY:s==='reaper-circle'||s==='reaper-rise'||s==='reaper-windup'?510:s==='reaper-lunge'?L(510,t.y,p):t.y};}
function portal(c,p,alpha){c.save();c.globalAlpha*=alpha;c.fillStyle='#070912d9';c.beginPath();c.ellipse(500,510,62*p,17*p,0,0,TAU);c.fill();c.strokeStyle='#704578';c.lineWidth=2;c.stroke();
 for(let j=0;j<9;j++){const a=j*TAU/9+p*2,x=500+Math.cos(a)*49*p,y=510+Math.sin(a)*13*p;c.strokeStyle=j%2?'#9d526d88':'#4f385fc0';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.sin(a)*9,y-13,x+Math.cos(a)*5,y-24*p);c.stroke();}c.restore();}
function draw(c,o){const b=pose(o),p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450};
 if(o.layer==='ground'){portal(c,s==='reaper-circle'?p:1,s==='reaper-close'?1-p:1);c.save();c.globalAlpha*=b.alpha*.35;c.fillStyle='#090b18';c.beginPath();c.ellipse(b.x,b.groundY,30,8,0,0,TAU);c.fill();c.restore();}
 if(o.layer==='actor'&&b.alpha>0&&image.complete&&image.naturalWidth){const w=image.naturalWidth/4,h=image.naturalHeight/3;
  c.save();c.globalAlpha*=b.alpha;if(s==='reaper-rise'){c.beginPath();c.rect(0,0,1000,510);c.clip();}
  if(s==='reaper-lunge')for(let i=3;i>0;i--){c.save();c.globalAlpha*=.12/i;c.translate(b.x-b.dir*i*15,b.y);c.scale(b.dir,1);c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-100,-194,200,200);c.restore();}
  c.translate(b.x,b.y);c.scale(b.dir,1);c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-100,-194,200,200);c.restore();
 }
 if(o.layer==='slash'&&s==='reaper-slash'){
  c.save();c.translate(t.x,t.y-94);c.rotate(-b.dir*.6);c.scale(b.dir,1);
  // An advancing cloud of shadow follows the scythe sweep; no solid crescent rim.
  for(let i=0;i<32;i++){
   const u=i/31,age=p-u*.55;if(age<0||age>.55)continue;
   const a=-1.4+u*2.8,x=-14+Math.cos(a)*43+Math.sin(i*4.7+p*13)*age*16,y=Math.sin(a)*62-age*18;
   const r=8+age*24+(i%3)*2,haze=c.createRadialGradient(x,y,0,x,y,r);
   haze.addColorStop(0,'#0b0b17b0');haze.addColorStop(.5,'#23172d70');haze.addColorStop(1,'#30203a00');
   c.save();c.globalAlpha*=Math.sin(Math.PI*C(age/.55))*.85;c.fillStyle=haze;c.beginPath();c.ellipse(x,y,r,r*.8,i*.2,0,TAU);c.fill();c.restore();
  }
  c.save();c.globalAlpha*=Math.sin(Math.PI*p)*.38;c.strokeStyle='#855373';c.lineWidth=1.2;c.setLineDash([8,13]);c.lineDashOffset=-p*35;c.beginPath();c.ellipse(-14,0,43,62,0,-1.4,-1.4+2.8*C(p*1.8));c.stroke();c.restore();c.restore();
 }

}
root.WIZARDRY_REAPER_V82={draw,pose,depthFor:(o,layer)=>layer==='slash'?(o.target?.y||450)+.1:pose(o).groundY-.1};
})(window);
