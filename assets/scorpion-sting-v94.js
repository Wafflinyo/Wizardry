/* Articulated low-poly scorpion: rolling arrival, tail coil and fast sting. */
(function(root){'use strict';const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2;
function poly(c,pts,color,edge){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=1.2;c.stroke();}}
function pose(p,target={x:800,y:450}){const d=target.x>=500?1:-1,drop=C(p/.22),wind=C((p-.4)/.28),strike=C((p-.68)/.06),retract=C((p-.82)/.08),reach=strike*(1-retract);return {dir:d,y:425-(1-drop)*(1-drop)*450,roll:p<.22?(1-drop)*T*1.6:0,wind,reach,alpha:p>.91?1-C((p-.91)/.09):Math.min(1,p/.035),tip:{x:L(35-wind*75,(target.x-500)*d,reach),y:L(-128-wind*22,target.y-425-95,reach)}};}
function body(c,p,target){const b=pose(p,target);c.save();c.translate(500,b.y);c.scale(b.dir,1);c.rotate(b.roll);c.globalAlpha*=b.alpha;
 // Four jointed walking legs on each side, braced during the tail snap.
 for(const side of [-1,1])for(let i=0;i<4;i++){const x=-50+i*28,wobble=p<.22?0:Math.sin(p*20+i)*2;poly(c,[[x,-30],[x-18,side<0?-52:-9],[x-34,side<0?-30:10+wobble],[x-26,side<0?-25:12+wobble],[x-10,side<0?-42:-15],[x+7,-25]],side<0?'#a34b20':'#d36e26','#783c20');}
 // Segmented abdomen with angular lit armor plates.
 for(let i=0;i<5;i++){const x=-70+i*23;poly(c,[[x,-43],[x+17,-55],[x+35,-42],[x+33,-18],[x+13,-9],[x-3,-22]],i%2?'#e4862e':'#d97726','#7f431e');poly(c,[[x,-43],[x+17,-55],[x+35,-42],[x+14,-32]],'#f9aa49');}
 poly(c,[[25,-47],[52,-48],[68,-34],[58,-12],[29,-13],[18,-29]],'#e98c32','#86451f');
 // Two large pincers: elbows and forked orange jaws.
 for(const side of [-1,1]){const y=side<0?-55:-2;poly(c,[[42,-33],[66,y],[86,y-4],[91,y+4],[65,y+10],[43,-21]],'#d97828','#81421f');poly(c,[[83,y-8],[103,y-13],[120,y-3],[105,y-1],[98,y+4],[116,y+12],[99,y+18],[81,y+7]],'#f39b3b','#8d4921');poly(c,[[85,y-6],[101,y-10],[110,y-4],[96,y+1]],'#ffb853');}
 c.fillStyle='#211518';for(const y of [-36,-25]){c.beginPath();c.arc(56,y,3,0,T);c.fill();c.fillStyle='#ffdd75';c.fillRect(55,y-1,1.5,1.5);c.fillStyle='#211518';}
 // Thick articulated tail follows a smooth arch; the pointed stinger leads the snap.
 const base={x:-65,y:-31},tip=b.tip,control={x:-145+b.reach*65-b.wind*25,y:-190-b.wind*45};
 let prev=base;for(let i=1;i<=9;i++){const u=i/9,v=1-u,point={x:v*v*base.x+2*v*u*control.x+u*u*tip.x,y:v*v*base.y+2*v*u*control.y+u*u*tip.y},a=Math.atan2(point.y-prev.y,point.x-prev.x),r=12-u*5;c.save();c.translate((point.x+prev.x)/2,(point.y+prev.y)/2);c.rotate(a);const len=Math.hypot(point.x-prev.x,point.y-prev.y)/2;poly(c,[[-len,-r],[len-2,-r*.8],[len+2,0],[len-2,r*.8],[-len,r],[-len-3,0]],i%2?'#dc7827':'#ed9235','#743b20');poly(c,[[-len,-r],[len-2,-r*.8],[len+2,0],[-len,0]],'#ffb24d');c.restore();prev=point;}
 const a=Math.atan2(tip.y-control.y,tip.x-control.x);c.save();c.translate(tip.x,tip.y);c.rotate(a);poly(c,[[-7,-8],[6,-7],[15,1],[24,13],[10,8],[-5,7]],'#692e27','#e0a048');c.restore();c.restore();}
function draw(c,{progress:p,target}){const b=pose(p,target);c.save();c.globalAlpha=b.alpha*.3;c.fillStyle='#251c13';c.beginPath();c.ellipse(500,427,103,24,0,0,T);c.fill();c.restore();body(c,p,target);
 const dust=C((p-.20)/.12);if(p>.2&&p<.33){c.save();c.globalAlpha=1-dust;for(let i=0;i<20;i++){const a=i*2.399,r=20+dust*(45+i%4*10);poly(c,[[500+Math.cos(a)*r,425+Math.sin(a)*r*.23],[507+Math.cos(a)*r,421+Math.sin(a)*r*.23],[510+Math.cos(a)*r,428+Math.sin(a)*r*.23]],'#c5a16c');}c.restore();}
 if(p>=.74&&p<.84&&target){const q=(p-.74)/.1;c.save();c.globalAlpha=1-q;c.strokeStyle='#ffc76f';c.lineWidth=3;c.beginPath();c.arc(target.x,target.y-95,8+q*25,0,T);c.stroke();c.restore();}}
function portrait(c,w,h){c.save();const k=Math.min(w/280,h/230);c.translate(w/2-500*k,h/2-335*k);c.scale(k,k);body(c,.58,{x:800,y:450});c.restore();}
root.WIZARDRY_SCORPION_V94={draw,pose,portrait};})(window);
