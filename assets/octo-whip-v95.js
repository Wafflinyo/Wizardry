/* Faceted Canvas octopus: landing, angry flail, raised tentacle and contact. */
(function(root){'use strict';
const C=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t,T=Math.PI*2;
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function limb(c,pts,width){for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/d,ny=(b[0]-a[0])/d,w=width*(1-i/pts.length),v=width*(1-(i+1)/pts.length);poly(c,[[a[0]+nx*w,a[1]+ny*w],[b[0]+nx*v,b[1]+ny*v],[b[0]-nx*v,b[1]-ny*v],[a[0]-nx*w,a[1]-ny*w]],i%2?'#287ecc':'#349fe0');poly(c,[[a[0],a[1]],[b[0],b[1]],[b[0]-nx*v,b[1]-ny*v],[a[0]-nx*w,a[1]-ny*w]],'#1957a7');if(i%2===1){c.fillStyle='#8ad8ed';c.beginPath();c.ellipse(a[0],a[1]+5,w*.42,w*.25,0,0,T);c.fill();}}}
function body(c,p){const flail=p>.2&&p<.57?Math.sin(p*100)*13:0;
 for(let i=0;i<8;i++){const a=i*T/8,side=Math.cos(a),back=Math.sin(a);limb(c,[[side*29,-27],[side*65,back*12-8],[side*97,back*24+flail*(i%2?1:-1)],[side*120,back*24-12]],15);}
 poly(c,[[-55,-36],[-65,-95],[-45,-150],[-10,-170],[31,-162],[59,-126],[60,-70],[40,-32],[0,-17]],'#258bd0');
 poly(c,[[-55,-36],[-65,-95],[-45,-150],[-10,-170],[-19,-85],[0,-17]],'#1d61ab');
 poly(c,[[-45,-150],[-10,-170],[31,-162],[59,-126],[15,-132]],'#56c4ed');
 poly(c,[[15,-132],[59,-126],[60,-70],[28,-76]],'#309fdf');
 for(const x of [-20,28]){poly(c,[[x-13,-91],[x+13,-91],[x+10,-69],[x-9,-69]],'#d9f6fc');poly(c,[[x-2,-90],[x+7,-88],[x+6,-72],[x-2,-73]],'#09244f');poly(c,[[x-16,-102],[x+14,-92],[x+15,-84],[x-16,-94]],'#123d7c');}
 poly(c,[[-8,-49],[8,-53],[17,-45],[0,-43]],'#102f65');}
function draw(c,{progress:p,target,layer='body'}){if(!target)return;const dir=target.x>=500?1:-1,land=C(p/.2),exit=C((p-.88)/.12),y=425-520*(1-land)*(1-land)+exit*130;
 c.save();c.globalAlpha*=1-exit;
 if(layer==='body'){
 c.save();c.globalAlpha*=.23*land;c.fillStyle='#07283b';c.beginPath();c.ellipse(500,429,133,33,0,0,T);c.fill();c.restore();
 if(p>.18&&p<.34){const q=(p-.18)/.16;c.save();c.globalAlpha*=1-q;c.strokeStyle='#8fe8ff';c.lineWidth=8*(1-q);c.beginPath();c.ellipse(500,429,100+q*110,20+q*20,0,0,T);c.stroke();for(let i=0;i<16;i++){const a=i*T/16;c.fillStyle='#6cceee';c.beginPath();c.arc(500+Math.cos(a)*(100+q*100),425+Math.sin(a)*24-Math.sin(q*Math.PI)*50,3,0,T);c.fill();}c.restore();}
 c.translate(500,y);c.scale(dir,1);body(c,p);
 }else if(p>.48&&p<.88){
 const wind=C((p-.48)/.16),strike=C((p-.64)/.06),retract=C((p-.76)/.12),reach=strike*(1-retract);
 const tx=(target.x-500)*dir,ty=target.y-425-90;
 c.translate(500,425);c.scale(dir,1);
 limb(c,[[32,-38],[80,-85-wind*50],[mix(110,tx*.6,reach),mix(-125-wind*75,ty-70,reach)],[mix(130,tx,reach),mix(-150-wind*85,ty,reach)]],24);
 if(p>=.70&&p<.77){const q=(p-.70)/.07;c.save();c.globalAlpha*=1-q;c.strokeStyle='#baf5ff';c.lineWidth=5;c.beginPath();c.ellipse(tx,ty,16+q*40,10+q*28,0,0,T);c.stroke();c.restore();}
 }
 c.restore();}
function portrait(c,w,h){c.save();const k=Math.min(w/290,h/205);c.translate(w/2,h*.87);c.scale(k,k);body(c,.32);c.restore();}
root.WIZARDRY_OCTO_V95={draw,portrait};})(window);
