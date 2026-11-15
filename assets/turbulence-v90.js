/* Wind curse: restless spiral currents. */
(function(root){'use strict';const T=Math.PI*2;
function emblem(c,x,y,size,alpha=1,time=0){c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha*=alpha;c.strokeStyle='#bcf2df';c.shadowColor='#71d6c0';c.shadowBlur=6;c.lineWidth=2;c.beginPath();c.arc(0,0,49,0,T);c.stroke();
 for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<=65;i++){const u=i/65,a=u*T*1.5+time+j*T/3,r=3+u*33,xx=Math.cos(a)*r,yy=Math.sin(a)*r*.8;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}for(let i=0;i<12;i++){const a=i*T/12-time;c.beginPath();c.arc(0,0,43,a,a+.17);c.stroke();}c.restore();}
function draw(c,{progress:p,target}){if(!target)return;const t=Math.max(0,Math.min(1,(p-.2)/.45)),q=t*t*(3-2*t),x=500+(target.x-500)*q,y=335+(target.y-95-335)*q,fade=Math.min(1,p/.15,(1-p)/.22);emblem(c,x,y,85,fade,p*7);
 c.save();c.globalAlpha=fade*.65;c.strokeStyle='#a5e6d5';for(let j=0;j<6;j++){c.lineWidth=1.5+j%2;c.beginPath();const a=p*17+j*.9;c.ellipse(x,y-40+j*15,52+Math.sin(p*20+j)*9,14,Math.sin(p*4)*.2,a,a+4.3);c.stroke();}c.restore();}root.WIZARDRY_TURBULENCE_V90={emblem,draw};})(window);
