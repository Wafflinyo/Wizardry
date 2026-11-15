/* Frosty: winter gust, cheerful snowman, angry giant, snowball and melting. */
(function(root){
'use strict';const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,TAU=Math.PI*2;
const image=new Image();image.src='./assets/frosty-v85.webp';
function pose(o){const p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450};let frame=1,alpha=1,squash=1;
 if(s==='frost-gust')alpha=0;
 if(s==='frost-appear'){frame=0;alpha=1;}
 if(s==='frost-angry')frame=2;
 if(s==='frost-transform')frame=p<.28?2:p<.68?3:4;
 if(s==='frost-pause')frame=4;
 if(s==='frost-lift')frame=p<.48?5:6;
 if(s==='frost-windup')frame=7;
 if(s==='frost-throw')frame=p<.4?7:8;
 if(s==='frost-flight'||s==='frost-impact')frame=9;
 if(s==='frost-melt'){frame=p<.38?9:p<.76?10:11;squash=p<.38?L(1,.6,p/.38):p<.76?L(1,.65,(p-.38)/.38):1;alpha=1-C((p-.76)/.24);}
 return{x:500,y:431,frame,alpha,squash,dir:t.x>=500?1:-1};}
// Crisp, registered in-between poses: one fully opaque character at a time.
const growth=new Image();growth.src='./assets/frosty-growth-v87.webp';
const throwing=new Image();throwing.src='./assets/frosty-throw-v87.webp';
const prep=new Image();prep.src='./assets/frosty-transitions-v86.webp';
const atlasCache=new Map();
function prepareAtlas(im,rows){
 if(atlasCache.has(im))return atlasCache.get(im);if(!im.complete||!im.naturalWidth)return null;
 const w=Math.round(im.naturalWidth/4),h=Math.round(im.naturalHeight/rows),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d'),out=[];
 for(let f=0;f<rows*4;f++){c.clearRect(0,0,w,h);c.drawImage(im,f%4*w,Math.floor(f/4)*h,w,h,0,0,w,h);const pixels=c.getImageData(0,0,w,h).data;let top=h,bottom=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>110){top=Math.min(top,y);bottom=Math.max(bottom,y);}out.push({w,cellH:h,bottom,h:Math.max(1,bottom-top+1)});
 }atlasCache.set(im,out);return out;
}
function motion(o){const p=C(o.progress),s=o.stage;
 if(s==='frost-appear'||s==='frost-happy')return{atlas:'growth',frame:0,height:150,alpha:1};
 if(s==='frost-angry')return{atlas:'growth',frame:Math.min(2,Math.floor(p*3)),height:150,alpha:1};
 if(s==='frost-transform')return{atlas:'growth',frame:2+Math.min(13,Math.floor(p*14)),height:L(150,228,p*p*(3-2*p)),alpha:1};
 if(s==='frost-pause')return{atlas:'growth',frame:15,height:228,alpha:1};
 if(s==='frost-lift'){if(p<.2){const i=Math.min(2,Math.floor(p/.2*3));return{atlas:'prep',frame:9+i,height:[228,212,194][i],alpha:1};}const q=(p-.2)/.8;return{atlas:'throw',frame:Math.min(4,Math.floor(q*5)),height:L(194,228,q),alpha:1};}
 if(s==='frost-windup')return{atlas:'throw',frame:4+Math.min(5,Math.floor(C(p/.8)*6)),height:228,alpha:1};
 if(s==='frost-throw')return{atlas:'throw',frame:9+Math.min(3,Math.floor(p*4)),height:228,alpha:1};
 if(s==='frost-flight')return{atlas:'throw',frame:13+Math.min(2,Math.floor(p*3)),height:228,alpha:1};
 if(s==='frost-impact')return{atlas:'throw',frame:15,height:228,alpha:1};
 if(s==='frost-melt'){
  if(p<.40)return{atlas:'throw',frame:15,height:L(213.75,125,p/.4),alpha:1};
  if(p<.85)return{atlas:'base',frame:10,height:L(125,45,(p-.4)/.45),alpha:1};
  return{atlas:'base',frame:11,height:L(45,20,(p-.85)/.15),alpha:1-(p-.85)/.15};
 }return null;
}
function formScale(o){if(['frost-appear','frost-happy','frost-angry','frost-gust'].includes(o.stage))return 1;if(o.stage==='frost-transform'){const p=C(o.progress);return L(1,.90,p*p*(3-2*p));}return .90;}
function forcePose(o){const p=C(o.progress),s=o.stage;
 if(s==='frost-windup'){const q=p*p*(3-2*p);return{lean:-24*q,drop:-3*q};}
 if(s==='frost-throw'){const q=C((p-.10)/.65),drive=q*q;return{lean:p<.75?L(-24,24,drive):L(24,30,(p-.75)/.25),drop:L(-3,6,drive)};}
 if(s==='frost-flight')return{lean:L(30,10.5,p),drop:L(6,2,p)};
 if(s==='frost-impact')return{lean:10.5*(1-p),drop:2*(1-p)};
 return{lean:0,drop:0};
}
function throwPowder(c,o){const p=C(o.progress),s=o.stage,dir=pose(o).dir,age=s==='frost-throw'&&p>.60?(p-.60)*150:s==='frost-flight'?60+p*322.5:-1;if(age<0||age>300)return;const q=age/300;
 c.save();c.globalAlpha*=1-q;for(let i=0;i<16;i++){const x=500-dir*(20+q*(20+i%5*8)),y=424-Math.sin(q*Math.PI)*(8+i%4*5)+Math.sin(i*3)*4,r=3+i%3*2;const haze=c.createRadialGradient(x,y,0,x,y,r);haze.addColorStop(0,'#f1ffffa0');haze.addColorStop(1,'#d7edf000');c.fillStyle=haze;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}c.restore();
}
function idleBreath(o){return o.stage==='frost-pause'?Math.sin(C(o.progress)*Math.PI):0;}
function solidActor(c,o,b){const m=motion(o);if(!m)return false;const src=m.atlas==='growth'?growth:m.atlas==='throw'?throwing:m.atlas==='prep'?prep:image,rows=m.atlas==='base'?3:4,info=prepareAtlas(src,rows);if(!info)return false;
 const r=info[m.frame],scale=m.atlas==='throw'&&o.stage!=='frost-melt'?228/info[4].h:m.height/r.h,ratio=m.atlas==='throw'?.81:m.atlas==='prep'?.94:1,k=formScale(o),force=forcePose(o);c.save();c.globalAlpha*=m.alpha;c.translate(500,425);const breath=idleBreath(o);c.scale(b.dir*k*(1+breath*.018),k*(1+breath*.025));c.transform(1,0,-force.lean/210,1-force.drop/210,0,0);c.drawImage(src,m.frame%4*r.w,Math.floor(m.frame/4)*r.cellH,r.w,r.cellH,-r.w*scale*ratio/2,-(r.bottom+1)*scale,r.w*scale*ratio,r.cellH*scale);c.restore();return true;
}
function swirlClock(o){return (o.stage==='frost-gust'?C(o.progress)*800:800+C(o.progress)*650)*.007*pose(o).dir;}
function drawVeil(c,o){const p=C(o.progress),s=o.stage;if(s!=='frost-gust'&&s!=='frost-appear')return;
 const fade=s==='frost-gust'?C(p*3.4):1-p*p*(3-2*p);if(fade<=0)return;const spin=swirlClock(o);
 c.save();c.globalAlpha*=fade;
 function bands(front){
  for(let ring=0;ring<5;ring++){
   const cy=404-ring*30,rx=116+(ring%2)*9,phase=spin+ring*.85,steps=23;
   for(let j=0;j<steps;j++){
    const u=j/steps,v=(j+1)/steps,a=phase+u*4.85,b=phase+v*4.85,isFront=Math.sin((a+b)/2)>0;if(isFront!==front)continue;
    const x1=500+Math.cos(a)*rx,y1=cy+Math.sin(a)*rx*.21-u*10,x2=500+Math.cos(b)*rx,y2=cy+Math.sin(b)*rx*.21-v*10,thick=10+(ring%2)*4;
    c.save();c.globalAlpha*=front?.64:.26;c.fillStyle=j%3?'#9dd4e7':'#cdebf4';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.lineTo(x2+2,y2+thick);c.lineTo(x1+2,y1+thick);c.closePath();c.fill();
    c.strokeStyle='#e5fbff';c.lineWidth=1.2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();
   }
  }
 }
 // A short, broad swirl, with no pointed funnel or tall tornado column.
 bands(false);
 for(let i=0;i<12;i++){const a=i*2.399,x=500+Math.cos(a)*37+Math.sin(spin+i)*8,y=346+Math.sin(a)*34,r=57+i%3*7;
  const fog=c.createRadialGradient(x,y,0,x,y,r);fog.addColorStop(0,'#eefafffa');fog.addColorStop(.52,'#d5edf5ed');fog.addColorStop(.8,'#bcdfeab0');fog.addColorStop(1,'#cce9f000');c.fillStyle=fog;c.beginPath();c.ellipse(x,y,r,r*.76,a*.08,0,TAU);c.fill();
 }
 bands(true);
 for(let i=0;i<45;i++){const u=i/45,a=spin*1.35+i*2.399,r=112+(i%4)*10,x=500+Math.cos(a)*r,y=416-u*155+Math.sin(a)*r*.22;flake(c,x,y,2+i%3,.55+.3*Math.sin(a)**2);}c.restore();
}
function flake(c,x,y,r,alpha){c.save();c.globalAlpha*=alpha;c.translate(x,y);c.strokeStyle='#e1faff';c.lineWidth=1;for(let i=0;i<3;i++){const a=i*Math.PI/3;c.beginPath();c.moveTo(-Math.cos(a)*r,-Math.sin(a)*r);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke();}c.restore();}
function gust(c,o){const p=C(o.progress),fade=o.stage==='frost-gust'?Math.sin(p*Math.PI):1-p,spin=swirlClock(o);
 c.save();c.globalAlpha*=fade*.65;
 for(let j=0;j<7;j++){const r=105+j*7,y=420-j*17;c.strokeStyle=j%2?'#b6e7f080':'#e3fbff90';c.lineWidth=1.1+j%2;c.beginPath();c.ellipse(500,y,r,r*.22,0,spin+j*.7,spin+j*.7+4.5);c.stroke();}
 for(let i=0;i<25;i++){const a=spin+i*2.399,r=125+i%3*13,x=500+Math.cos(a)*r,y=420-(i%7)*21+Math.sin(a)*r*.2;flake(c,x,y,2+i%3,.7);}c.restore();}
function draw(c,o){const p=C(o.progress),s=o.stage,b=pose(o);
 if(o.layer==='ground'){
  throwPowder(c,o);
  c.save();c.globalAlpha*=s==='frost-gust'?p*.25:b.alpha*.3;c.fillStyle='#a8d3e0';c.beginPath();c.ellipse(500,425,45,13,0,0,TAU);c.fill();c.restore();
  if(s==='frost-gust'||s==='frost-appear')gust(c,o);
  if(s==='frost-melt'){c.save();c.globalAlpha*=Math.sin(Math.PI*p)*.7;c.fillStyle='#85bdcc70';c.beginPath();c.ellipse(500,426,30+p*65,7+p*15,0,0,TAU);c.fill();c.strokeStyle='#b2e4eb';c.lineWidth=1;c.stroke();c.restore();}
 }
 if(o.layer==='actor'&&b.alpha>0&&image.complete&&image.naturalWidth){if(solidActor(c,o,b))return;const w=image.naturalWidth/4,h=image.naturalHeight/3;c.save();c.globalAlpha*=b.alpha;c.translate(500,431);c.scale(b.dir,b.squash);c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-120,-231,240,240);c.restore();}
}
function projectile(o){const p=C(o.progress),s=o.stage,b=pose(o),target=o.target||{x:800,y:450};let ms=-1;
 if(s==='frost-throw'&&p>=.75)ms=p*150-112.5;if(s==='frost-flight')ms=37.5+p*322.5;
 if(ms<0)return null;const q=C(ms/360),release=forcePose({stage:'frost-throw',progress:.75}),start={x:500+b.dir*.9*(90*.81+197*release.lean/210),y:425-197*.9*(1-release.drop/210)},end={x:target.x,y:target.y-95};return{x:L(start.x,end.x,q),y:L(start.y,end.y,q)-Math.sin(Math.PI*q)*65,r:L(38,34,q),p:q,dir:b.dir,depthY:L(425,target.y,q)-.1};}
function drawBall(c,b){if(!b)return;c.save();c.translate(b.x,b.y);
 for(let i=0;i<22;i++){const q=i/22,x=-b.dir*q*125,y=Math.sin(q*10+b.p*18)*q*19,r=6+q*15;const haze=c.createRadialGradient(x,y,0,x,y,r);haze.addColorStop(0,'#e4faff70');haze.addColorStop(1,'#d0eef800');c.fillStyle=haze;c.beginPath();c.ellipse(x,y,r,r*.65,0,0,TAU);c.fill();}
 for(let i=0;i<25;i++){const q=(b.p*2+i/25)%1,x=-b.dir*(15+q*125),y=Math.sin(i*2.399+b.p*12)*(7+q*24);flake(c,x,y,1+i%3,(1-q)*.8);if(i%3===0){c.fillStyle='#efffffd0';c.beginPath();c.arc(x,y,2.5,0,TAU);c.fill();}}
 c.rotate(b.p*2.4*b.dir);const r=b.r;c.fillStyle='#e9f2ef';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
 const triangles=[[[0,0],[-.7,-.7],[.2,-.95],'#fbfff9'],[[0,0],[.2,-.95],[.85,-.4],'#e3efef'],[[0,0],[.85,-.4],[.8,.55],'#b9d1dd'],[[0,0],[.8,.55],[-.2,.94],'#cddfe4'],[[0,0],[-.2,.94],[-.9,.4],'#dce9e8'],[[0,0],[-.9,.4],[-.7,-.7],'#edf7f0']];
 for(const [a,d,e,color] of triangles){c.fillStyle=color;c.beginPath();c.moveTo(a[0]*r,a[1]*r);c.lineTo(d[0]*r,d[1]*r);c.lineTo(e[0]*r,e[1]*r);c.closePath();c.fill();}
 c.fillStyle='#ffffffa0';for(let i=0;i<9;i++){const a=i*2.399,rr=(.2+i%3*.19)*r;c.beginPath();c.arc(Math.cos(a)*rr,Math.sin(a)*rr,1.5+i%2,0,TAU);c.fill();}c.restore();}
function drawImpact(c,o){if(o.stage!=='frost-impact')return;const p=C(o.progress),t=o.target||{x:800,y:450};c.save();c.globalAlpha*=1-p;
 // A dense powder core expands into a wide burst of soft snow clumps and flakes.
 const core=18+p*62,glow=c.createRadialGradient(t.x,t.y-95,0,t.x,t.y-95,core);glow.addColorStop(0,'#f9ffffed');glow.addColorStop(.45,'#e9f9ffc0');glow.addColorStop(1,'#d0eaf000');c.fillStyle=glow;c.beginPath();c.arc(t.x,t.y-95,core,0,TAU);c.fill();
 for(let i=0;i<58;i++){const a=i*2.399,rr=10+p*(55+i%7*12),x=t.x+Math.cos(a)*rr,y=t.y-95+Math.sin(a)*rr*.78+48*p*p,r=5+i%4*3;const haze=c.createRadialGradient(x,y,0,x,y,r);haze.addColorStop(0,'#f6fff7de');haze.addColorStop(1,'#c5e5ee00');c.fillStyle=haze;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();if(i%3===0)flake(c,x,y,3+i%2,1);if(i%4===0){c.fillStyle='#f5ffff';c.beginPath();c.arc(x,y,2.5+i%3,0,TAU);c.fill();}}
 c.strokeStyle='#c5f0f594';c.lineWidth=2;c.beginPath();c.ellipse(t.x,t.y-93,12+p*91,8+p*48,0,0,TAU);c.stroke();c.restore();}
root.WIZARDRY_FROSTY_V85={pose,draw,projectile,drawBall,drawImpact,drawVeil,motion,formScale,forcePose,idleBreath};
})(window);
