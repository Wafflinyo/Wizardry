/* Crackling lightning curse. */
(function(root){'use strict';
function emblem(c,x,y,size,alpha=1,time=0){c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha*=alpha;c.strokeStyle='#96dfff';c.shadowColor='#528bff';c.shadowBlur=8;c.lineWidth=2;c.beginPath();c.arc(0,0,47,time,time+Math.PI*2);c.stroke();c.beginPath();c.moveTo(8,-35);c.lineTo(-20,5);c.lineTo(-3,5);c.lineTo(-12,35);c.lineTo(24,-10);c.lineTo(7,-10);c.closePath();c.fillStyle='#dcf8ff';c.fill();
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7+time;c.save();c.rotate(a);c.beginPath();c.moveTo(32,0);c.lineTo(39,-5);c.lineTo(42,4);c.lineTo(52,Math.sin(time*12+i)*7);c.stroke();c.restore();}c.restore();}
function draw(c,{progress:p,target}){if(!target)return;const t=Math.max(0,Math.min(1,(p-.2)/.4)),q=t*t*(3-2*t),x=500+(target.x-500)*q,y=335+(target.y-95-335)*q,alpha=Math.min(1,p/.15,(1-p)/.2);emblem(c,x,y,85,alpha,p*3);
 if(p>.58){c.save();c.globalAlpha=alpha;c.strokeStyle='#b8eeff';c.shadowColor='#698eff';c.shadowBlur=8;c.lineWidth=2;for(let j=0;j<4;j++){c.beginPath();for(let i=0;i<14;i++){const a=i/13*Math.PI*2+j*.6+p*12,r=40+Math.sin(i*2.7+p*90+j)*12,xx=target.x+Math.cos(a)*r,yy=target.y-90+Math.sin(a)*r*1.5;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}c.restore();}}
root.WIZARDRY_STATIC_SHOCK_V88={draw,emblem};})(window);
