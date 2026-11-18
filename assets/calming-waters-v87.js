/* Flowing water sigil and healing currents. */
(function(root){'use strict';const T=Math.PI*2;
function emblem(c,x,y,size,alpha=1,time=0){c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha*=alpha;c.shadowColor='#62dfed';c.shadowBlur=6;c.strokeStyle='#b3f5ff';c.lineWidth=1.8;
 for(const r of [46,51]){c.beginPath();c.arc(0,0,r,time,time+T);c.stroke();}
 for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<=36;i++){const x=-31+i*62/36,y=17+j*9+Math.sin(x*.12+time*2+j*.8)*3;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
 c.beginPath();c.moveTo(0,-33);c.bezierCurveTo(-5,-23,-22,-10,-19,1);c.bezierCurveTo(-17,21,18,21,19,1);c.bezierCurveTo(22,-10,5,-23,0,-33);c.fillStyle='#3caacb60';c.fill();c.stroke();c.beginPath();c.moveTo(-10,-4);c.quadraticCurveTo(-15,6,-5,9);c.stroke();
 for(let i=0;i<12;i++){const a=i*T/12+time;c.beginPath();c.moveTo(Math.cos(a)*47,Math.sin(a)*47);c.lineTo(Math.cos(a)*50,Math.sin(a)*50);c.stroke();}c.restore();}
function draw(c,{progress:p,target}){if(!target)return;const t=Math.max(0,Math.min(1,(p-.25)/.45)),q=t*t*(3-2*t),x=500+(target.x-500)*q,y=410+(target.y-95-410)*q-Math.sin(q*Math.PI)*25,alpha=Math.min(1,p/.15,(1-p)/.2);c.save();
 for(let j=0;j<4;j++){c.globalAlpha=alpha*.6;c.strokeStyle=j%2?'#a8eff4':'#439bbc';c.lineWidth=3-j*.4;c.beginPath();for(let i=0;i<=40;i++){const u=i/40,a=u*T*1.4+p*8+j*T/4,r=45+Math.sin(u*Math.PI)*15,xx=x+Math.cos(a)*r,yy=y+35-u*70+Math.sin(a)*12;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}
 c.globalAlpha=1;emblem(c,x,y,85,alpha,p*2);
 if(p>.7){const f=(p-.7)/.3;c.globalAlpha=(1-f)*.8;c.strokeStyle='#b8ffff';c.lineWidth=2;for(let j=0;j<3;j++){c.beginPath();c.ellipse(target.x,target.y-12-f*100-j*18,40+f*18,12,0,0,T);c.stroke();}}
 c.restore();}root.WIZARDRY_CALMING_WATERS_V87={draw,emblem};})(window);
