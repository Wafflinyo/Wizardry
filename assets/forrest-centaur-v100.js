/* Forrest Centaur gallops in, plants his hooves, charges a bow and fires a single Nature arrow. */
(function(root){'use strict';const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2,SIZE=200,RELEASE=.70,HIT=.724;
const images={arrival:new Image(),archery:new Image()},ready={arrival:false,archery:false},listeners=[];
for(const [atlas,path] of Object.entries({arrival:'forrest-centaur-arrival-v100.webp',archery:'forrest-centaur-archery-v100.webp'})){images[atlas].onload=()=>{ready[atlas]=true;listeners.forEach(fn=>fn());};images[atlas].src='./assets/'+path;}
const feet={arrival:[286, 286, 284, 283, 285, 285, 285, 286, 279, 288, 289, 288, 298, 298, 298, 299],archery:[302, 302, 302, 302, 305, 304, 304, 304, 308, 308, 308, 307, 311, 311, 311, 311]},ARROW_TIP={x:301,y:88};
function perspective(y){return L(.60,.90,C((y-288)/235));}
function pose(p,target){const dir=target.x>=500?1:-1,entry=C(p/.25),groundY=510,size=SIZE*perspective(groundY)/perspective(425),x=500-dir*520*(1-entry)*(1-entry),bob=p<.22?Math.sin(p*95)**2*4:0,atlas=p<.36?'arrival':'archery';
 const frame=p<.22?Math.floor(p/.22*16)%8:p<.30?8+Math.min(3,Math.floor((p-.22)/.08*4)):p<.36?12+Math.min(3,Math.floor((p-.30)/.06*4)):p<.58?2+Math.min(5,Math.floor((p-.36)/.22*6)):p<.70?8+Math.min(2,Math.floor((p-.58)/.12*3)):p<.72?11:p<.76?12:p<.84?13:p<.90?14:15;
 return{dir,atlas,frame,x,y:groundY-bob,groundY,size,alpha:C(p/.025)*(1-C((p-.91)/.09)),arrowTip:{x:x+dir*(ARROW_TIP.x-160)*size/320,y:groundY+(ARROW_TIP.y-feet.archery[10])*size/320}};}
function arrowPath(target){
 const {arrowTip:origin,groundY}=pose(RELEASE,target),end={x:target.x,y:target.y-100};
 return {origin,end,groundY,angle:Math.atan2(end.y-origin.y,end.x-origin.x)};
}
function shot(p,target){if(!target||p<RELEASE||p>=HIT)return null;
 const {origin,end,groundY,angle}=arrowPath(target),q=C((p-RELEASE)/(HIT-RELEASE));
 return {x:L(origin.x,end.x,q),y:L(origin.y,end.y,q),angle,q,depthY:L(groundY,target.y,q)+.1};
}
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function sprite(c,atlas,f,size=SIZE){if(!ready[atlas])return;const image=images[atlas],w=image.naturalWidth/4,h=image.naturalHeight/4,k=size/w;c.save();if(atlas==='archery'&&f>=9&&f<=11){c.beginPath();c.rect(-size/2+64*k,-feet[atlas][f]*k,256*k,150*k);c.rect(-size/2,(-feet[atlas][f]+150)*k,size,170*k);c.clip();}c.drawImage(image,f%4*w,Math.floor(f/4)*h,w,h,-size/2,-feet[atlas][f]*k,size,h*k);c.restore();}
function leaves(c,x,y,q,scale=1){c.save();c.globalAlpha*=1-q;for(let i=0;i<22;i++){const a=i*2.399+q,r=(8+q*(25+i%6*10))*scale,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.5-q*20,s=(2+i%4)*scale;c.save();c.translate(xx,yy);c.rotate(a+q*4);poly(c,[[-s*2,0],[0,-s],[s*2,0],[0,s]],i%3?'#8fbb65':'#ebd88d');c.restore();}c.restore();}
function glow(c,x,y,r,alpha=1){c.save();c.globalAlpha*=alpha;const g=c.createRadialGradient?.(x,y,0,x,y,r);if(g?.addColorStop){g.addColorStop(0,'#e4ffd9ee');g.addColorStop(.18,'#80ff5caa');g.addColorStop(.5,'#40ed3b44');g.addColorStop(1,'#2dd64000');c.fillStyle=g;}else c.fillStyle='#65ff4b44';c.beginPath();c.arc(x,y,r,0,T);c.fill();c.restore();}
function peakFlash(p){if(p<.686||p>=.706)return 0;return Math.sin((p-.686)/.020*Math.PI);}
function drawArrow(c,x,y,angle,alpha=1){c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.shadowColor='#50ff39';c.shadowBlur=8;c.strokeStyle='#a7ff82';c.lineWidth=3;c.beginPath();c.moveTo(-69,0);c.lineTo(-8,0);c.stroke();c.shadowBlur=0;c.strokeStyle='#efffe6';c.lineWidth=1.2;c.beginPath();c.moveTo(-69,0);c.lineTo(-8,0);c.stroke();poly(c,[[2,0],[-12,-5],[-8,0],[-12,5]],'#edffe0');poly(c,[[-59,0],[-71,-7],[-54,-4],[-48,0]],'#4ab94a');poly(c,[[-59,0],[-71,7],[-54,4],[-48,0]],'#b4f37c');c.restore();}
function helixPoints(phase){return Array.from({length:65},(_,i)=>{const t=i/64,theta=t*T*2.7+phase,r=10*Math.pow(Math.sin(t*Math.PI),.35);return{x:L(-79,-3,t),y:Math.sin(theta)*r,z:Math.cos(theta),t};});}
function spiral(c,x,y,angle,phase,front,alpha=1){c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.strokeStyle=front?'#76ff46':'#25b950';c.shadowColor='#53ff39';c.shadowBlur=front?9:3;c.lineWidth=front?2.6:1.5;
 const pts=helixPoints(phase);let open=false;c.beginPath();for(const point of pts){const visible=(point.z>=0)===front;if(visible){if(!open)c.moveTo(point.x,point.y);else c.lineTo(point.x,point.y);open=true;}else open=false;}c.stroke();
 if(front){c.shadowBlur=0;c.lineWidth=.8;c.strokeStyle='#e1ffd1';open=false;c.beginPath();for(const point of pts){if(point.z>=0){if(!open)c.moveTo(point.x,point.y);else c.lineTo(point.x,point.y);open=true;}else open=false;}c.stroke();}c.restore();}
function impactKick(p){const age=(p-HIT)*5000;if(age<0||age>=135)return{x:0,y:0};const fade=(1-age/135)**2;return{x:Math.sin(age*.19)*2.8*fade,y:Math.cos(age*.23)*2.2*fade};}
function depthFor({progress:p,target},layer){if(layer==='ground')return 200;if(layer==='impact')return(target?.y||425)+.1;if(layer==='arrow')return shot(p,target)?.depthY||target.y+.1;return pose(p,target).groundY;}
function draw(c,{progress:p,target,layer='actor'}){if(!target)return;const b=pose(p,target),scale=b.size/SIZE;
 if(layer==='ground'){c.save();c.globalAlpha=.21*b.alpha;c.fillStyle='#1e2719';c.beginPath();c.ellipse(b.x,b.groundY+3,75*scale,16*scale,0,0,T);c.fill();c.restore();if(p<.28){c.save();c.globalAlpha=C(p/.04)*(1-C((p-.22)/.06))*.45;for(let i=0;i<20;i++){const a=i*2.399,x=b.x-b.dir*(10+i*5)+Math.cos(a)*12,y=b.groundY+Math.sin(a)*5,s=2+i%3;poly(c,[[x-s,y],[x,y-s],[x+s,y],[x+s/2,y+s]],i%2?'#a6a17b':'#727c5f');}c.restore();}return;}
 if(layer==='actor'){c.save();c.globalAlpha*=b.alpha;if(p<.22){c.beginPath();c.rect(0,-1000,1000,1000+b.groundY+4);c.clip();}c.translate(b.x,b.y);c.scale(b.dir,1);sprite(c,b.atlas,b.frame,b.size);c.restore();
 if(p>=.58&&p<RELEASE){const q=C((p-.58)/.12),x=b.arrowTip.x,y=b.arrowTip.y,length=175*b.size/320,{angle}=arrowPath(target),tailX=x-Math.cos(angle)*length,tailY=y-Math.sin(angle)*length;
 glow(c,x,y,21+q*17,.45+q*.55);c.save();c.globalAlpha=.4+q*.6;c.lineCap='round';c.shadowColor='#4dff2d';c.shadowBlur=10+q*12;c.strokeStyle='#46ff28';c.lineWidth=4+q*3;c.beginPath();c.moveTo(tailX,tailY);c.lineTo(x,y);c.stroke();c.shadowBlur=0;c.lineWidth=1.5+q;c.strokeStyle='#eaffdc';c.stroke();
 for(let i=0;i<22;i++){const a=i*2.399-p*42,r=(32-q*22)+(i%4)*4,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.65;c.fillStyle=i%3?'#8cff52':'#efffc8';c.beginPath();c.arc(xx,yy,1+i%3*.5,0,T);c.fill();}c.restore();}
 const flash=peakFlash(p);if(flash>0){const x=b.arrowTip.x,y=b.arrowTip.y;glow(c,x,y,52,flash*.75);c.save();c.globalAlpha=flash;const points=[];for(let i=0;i<16;i++){const a=i*T/16,r=i%2?6:28+flash*15;points.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}poly(c,points,'#eaffcb');c.fillStyle='#ffffff';c.beginPath();c.arc(x,y,5+flash*5,0,T);c.fill();c.restore();}
 if(p>.90)leaves(c,b.x,b.groundY-45,C((p-.90)/.10),scale);return;}
 if(layer==='arrow'){let s=shot(p,target),fade=1;if(!s&&p>=HIT&&p<HIT+.012){const {end,angle}=arrowPath(target);s={...end,angle,q:1,depthY:target.y+.1};fade=1-(p-HIT)/.012;}if(!s)return;const phase=(p-RELEASE)/(HIT-RELEASE)*T*1.5;
 c.save();c.globalAlpha*=fade;const {origin}=arrowPath(target);c.strokeStyle='#56ef39';c.shadowColor='#40ff2c';c.shadowBlur=8;c.lineWidth=2.3;c.globalAlpha*=.5;c.beginPath();c.moveTo(L(s.x,origin.x,.62),L(s.y,origin.y,.62));c.lineTo(s.x,s.y);c.stroke();c.restore();
 spiral(c,s.x,s.y,s.angle,phase,false,fade);if(p<HIT)drawArrow(c,s.x,s.y,s.angle,fade);spiral(c,s.x,s.y,s.angle,phase,true,fade);glow(c,s.x,s.y,16,fade*.6);return;}
 if(layer==='impact'&&p>=HIT&&p<.86){const q=(p-HIT)/(.86-HIT),{end:{x,y},angle}=arrowPath(target);
 drawArrow(c,x,y,angle,1-C(q/.32));glow(c,x,y,42+q*70,(1-C(q/.22))*.95);leaves(c,x,y,q,1.8);
 c.save();c.globalAlpha=1-C(q/.18);c.fillStyle='#f7ffdf';c.beginPath();c.arc(x,y,12+q*95,0,T);c.fill();c.restore();
 c.save();for(let j=0;j<2;j++){c.globalAlpha=(1-q)*(j?.45:.95);c.strokeStyle=j?'#4ce74e':'#c8ff9d';c.lineWidth=(j?7:4)*(1-q)+1;c.beginPath();c.arc(x,y,12+q*(j?105:80),0,T);c.stroke();}
 c.globalAlpha=(1-q)*.8;for(let i=0;i<16;i++){const a=i*2.399,r=12+q*(55+i%4*15),xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r,tip=12+(i%4)*6;poly(c,[[xx-Math.sin(a)*2,yy+Math.cos(a)*2],[xx+Math.cos(a)*tip,yy+Math.sin(a)*tip],[xx+Math.sin(a)*2,yy-Math.cos(a)*2]],i%3?'#84ee57':'#f1ffd1');}c.restore();}

}
function portrait(c,w,h){c.save();const k=Math.min(w/215,h/215);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,'archery',7,200);c.restore();}
root.WIZARDRY_CENTAUR_V100={draw,pose,shot,helixPoints,peakFlash,impactKick,timing:{release:RELEASE,hit:HIT,flightMs:(HIT-RELEASE)*5000},depthFor,portrait,onReady:fn=>listeners.push(fn)};
})(window);
