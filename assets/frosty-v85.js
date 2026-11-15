/* Frosty: winter gust, cheerful snowman, angry giant, snowball and melting. */
(function(root){
'use strict';const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,TAU=Math.PI*2;
const image=new Image();image.src='./assets/frosty-v85.webp';
function pose(o){const p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450};let frame=1,alpha=1,squash=1;
 if(s==='frost-gust')alpha=0;
 if(s==='frost-appear'){frame=0;alpha=1;}
 if(s==='frost-angry')frame=2;
 if(s==='frost-transform')frame=p<.28?2:p<.68?3:4;
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
 if(s==='frost-lift'){if(p<.2){const i=Math.min(2,Math.floor(p/.2*3));return{atlas:'prep',frame:9+i,height:[228,212,194][i],alpha:1};}const q=(p-.2)/.8;return{atlas:'throw',frame:Math.min(4,Math.floor(q*5)),height:L(194,228,q),alpha:1};}
 if(s==='frost-windup')return{atlas:'throw',frame:4+Math.min(5,Math.floor(p*6)),height:228,alpha:1};
 if(s==='frost-throw')return{atlas:'throw',frame:9+Math.min(3,Math.floor(p*4)),height:228,alpha:1};
 if(s==='frost-flight')return{atlas:'throw',frame:13+Math.min(2,Math.floor(p*3)),height:228,alpha:1};
 if(s==='frost-impact')return{atlas:'throw',frame:15,height:228,alpha:1};
 if(s==='frost-melt'){
  if(p<.40)return{atlas:'throw',frame:15,height:L(213.75,125,p/.4),alpha:1};
  if(p<.85)return{atlas:'base',frame:10,height:L(125,45,(p-.4)/.45),alpha:1};
  return{atlas:'base',frame:11,height:L(45,20,(p-.85)/.15),alpha:1-(p-.85)/.15};
 }return null;
}
function solidActor(c,o,b){const m=motion(o);if(!m)return false;const src=m.atlas==='growth'?growth:m.atlas==='throw'?throwing:m.atlas==='prep'?prep:image,rows=m.atlas==='base'?3:4,info=prepareAtlas(src,rows);if(!info)return false;
 const r=info[m.frame],scale=m.atlas==='throw'&&o.stage!=='frost-melt'?228/info[4].h:m.height/r.h;c.save();c.globalAlpha*=m.alpha;c.translate(500,425);c.scale(b.dir,1);c.drawImage(src,m.frame%4*r.w,Math.floor(m.frame/4)*r.cellH,r.w,r.cellH,-r.w*scale/2,-(r.bottom+1)*scale,r.w*scale,r.cellH*scale);c.restore();return true;
}
function drawVeil(c,o){const p=C(o.progress),s=o.stage;if(s!=='frost-gust'&&s!=='frost-appear')return;
 const fade=s==='frost-gust'?C(p*3.4):1-p*p*(3-2*p);if(fade<=0)return;
 c.save();c.globalAlpha*=fade;
 for(let i=0;i<19;i++){const a=i*2.399,drift=Math.sin(p*5+i)*15,x=500+Math.cos(a)*(i%3*30)+drift,y=294+Math.sin(a)*(i%4*29),r=76+i%4*11;
  const fog=c.createRadialGradient(x,y,0,x,y,r);fog.addColorStop(0,'#f2faffff');fog.addColorStop(.50,'#deeff7f5');fog.addColorStop(.78,'#c9e1eeaa');fog.addColorStop(1,'#d8edf500');c.fillStyle=fog;c.beginPath();c.ellipse(x,y,r,r*.88,a*.1,0,TAU);c.fill();
 }
 for(let i=0;i<65;i++){const q=(p*1.7+i/65)%1,x=500-180+q*360,y=170+(i*47%260)+Math.sin(q*TAU+i)*12;flake(c,x,y,2+i%3,.8);}c.restore();
}
function flake(c,x,y,r,alpha){c.save();c.globalAlpha*=alpha;c.translate(x,y);c.strokeStyle='#e1faff';c.lineWidth=1;for(let i=0;i<3;i++){const a=i*Math.PI/3;c.beginPath();c.moveTo(-Math.cos(a)*r,-Math.sin(a)*r);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke();}c.restore();}
function gust(c,o){const p=C(o.progress),dir=pose(o).dir,fade=o.stage==='frost-gust'?Math.sin(p*Math.PI):1-p;
 c.save();c.globalAlpha*=fade;
 for(let j=0;j<11;j++){const y=245+j*15,phase=p*14+j*1.7;c.strokeStyle=j%3?'#a4d4df66':'#d9f6fa99';c.lineWidth=1+j%3;c.beginPath();c.moveTo(500-dir*160,y);c.bezierCurveTo(500-dir*70,y-20*Math.sin(phase),500+dir*50,y+18*Math.cos(phase),500+dir*160,y-10*Math.sin(phase));c.stroke();}
 for(let i=0;i<46;i++){const q=(p*1.8+i/46)%1,x=500+dir*(-180+q*360),y=220+(i*37%180)+Math.sin(q*TAU+i)*12;flake(c,x,y,2+i%3,.35+q*.45);}c.restore();}
function draw(c,o){const p=C(o.progress),s=o.stage,b=pose(o);
 if(o.layer==='ground'){
  c.save();c.globalAlpha*=s==='frost-gust'?p*.25:b.alpha*.3;c.fillStyle='#a8d3e0';c.beginPath();c.ellipse(500,425,45,13,0,0,TAU);c.fill();c.restore();
  if(s==='frost-gust'||s==='frost-appear')gust(c,o);
  if(s==='frost-melt'){c.save();c.globalAlpha*=Math.sin(Math.PI*p)*.7;c.fillStyle='#85bdcc70';c.beginPath();c.ellipse(500,426,30+p*65,7+p*15,0,0,TAU);c.fill();c.strokeStyle='#b2e4eb';c.lineWidth=1;c.stroke();c.restore();}
 }
 if(o.layer==='actor'&&b.alpha>0&&image.complete&&image.naturalWidth){if(solidActor(c,o,b))return;const w=image.naturalWidth/4,h=image.naturalHeight/3;c.save();c.globalAlpha*=b.alpha;c.translate(500,431);c.scale(b.dir,b.squash);c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-120,-231,240,240);c.restore();}
}
function projectile(o){const p=C(o.progress),s=o.stage,b=pose(o),target=o.target||{x:800,y:450};let ms=-1;
 if(s==='frost-throw'&&p>=.75)ms=p*150-112.5;if(s==='frost-flight')ms=37.5+p*442.5;
 if(ms<0)return null;const q=C(ms/480),start={x:500+b.dir*90,y:228},end={x:target.x,y:target.y-95};return{x:L(start.x,end.x,q),y:L(start.y,end.y,q)-Math.sin(Math.PI*q)*65,r:L(42,36,q),p:q,dir:b.dir,depthY:L(425,target.y,q)-.1};}
function drawBall(c,b){if(!b)return;c.save();c.translate(b.x,b.y);
 for(let i=0;i<12;i++){const q=i/12,x=-b.dir*q*72,y=Math.sin(q*10+b.p*18)*q*13,r=5+q*12;const haze=c.createRadialGradient(x,y,0,x,y,r);haze.addColorStop(0,'#e4faff70');haze.addColorStop(1,'#d0eef800');c.fillStyle=haze;c.beginPath();c.ellipse(x,y,r,r*.65,0,0,TAU);c.fill();}
 c.rotate(b.p*2.4*b.dir);const r=b.r;c.fillStyle='#e9f2ef';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
 const triangles=[[[0,0],[-.7,-.7],[.2,-.95],'#fbfff9'],[[0,0],[.2,-.95],[.85,-.4],'#e3efef'],[[0,0],[.85,-.4],[.8,.55],'#b9d1dd'],[[0,0],[.8,.55],[-.2,.94],'#cddfe4'],[[0,0],[-.2,.94],[-.9,.4],'#dce9e8'],[[0,0],[-.9,.4],[-.7,-.7],'#edf7f0']];
 for(const [a,d,e,color] of triangles){c.fillStyle=color;c.beginPath();c.moveTo(a[0]*r,a[1]*r);c.lineTo(d[0]*r,d[1]*r);c.lineTo(e[0]*r,e[1]*r);c.closePath();c.fill();}
 c.fillStyle='#ffffffa0';for(let i=0;i<9;i++){const a=i*2.399,rr=(.2+i%3*.19)*r;c.beginPath();c.arc(Math.cos(a)*rr,Math.sin(a)*rr,1.5+i%2,0,TAU);c.fill();}c.restore();}
function drawImpact(c,o){if(o.stage!=='frost-impact')return;const p=C(o.progress),t=o.target||{x:800,y:450};c.save();c.globalAlpha*=1-p;
 for(let i=0;i<30;i++){const a=i*2.399,rr=12+p*(45+i%5*9),x=t.x+Math.cos(a)*rr,y=t.y-95+Math.sin(a)*rr*.8+40*p*p,r=5+i%3*4;const haze=c.createRadialGradient(x,y,0,x,y,r);haze.addColorStop(0,'#f6fff7d0');haze.addColorStop(1,'#c5e5ee00');c.fillStyle=haze;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();if(i%3===0)flake(c,x,y,3,1);}c.restore();}
root.WIZARDRY_FROSTY_V85={pose,draw,projectile,drawBall,drawImpact,drawVeil,motion};
})(window);
