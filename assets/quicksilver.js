/* Quicksilver: authored liquid surge, then a pose-fitted metal shell.
   The original spear and horizontal impact tiles are deliberately never drawn. */
(()=>{
"use strict";
const atlas=new Image(),W=192,H=192,C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p;
const smooth=p=>{p=C(p);return p*p*(3-2*p);};
let pending,lastError="",scratch=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===1536&&atlas.naturalHeight===768;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/quicksilver-frames.webp?v=1";}).then(ok=>{lastError=ok?"":"Quicksilver frames unavailable";if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function tile(g,n,x,y,w,h){if(ready()&&n>=0&&n<12)g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function coverage(p,hit=.73){
 p=C(p);const arrival=hit*.56,full=hit*.92,release=hit+(1-hit)*.32;
 const frame=Math.min(47,Math.floor(p*48)),q=p===1?1:frame/48;
 const rise=smooth((q-arrival)/(full-arrival)),breakup=smooth((q-release)/(1-release));
 const hard=smooth((q-full+.08)/.08);
 return {active:p>=arrival&&p<1,rise,hard,breakup,frame,p,arrival,hit};
}
function scene(source,target,p,hit=.73,factor=1){
 p=C(p);const dir=source.team===0?1:-1,arrival=hit*.56,start=.13;
 const origin={x:500-dir*76,y:510},travel=smooth((p-start)/(arrival-start));
 const endX=target.x,endY=target.y+4;
 const frame=p<arrival?Math.min(11,Math.floor(p/arrival*12)):Math.max(0,Math.floor(3*(1-smooth((p-arrival)/(1-arrival)))));
 return {p,hit,arrival,dir,x:L(origin.x,endX,travel),y:L(origin.y,endY,travel),endX,endY,targetX:target.x,targetY:target.y,frame,factor};
}
function draw(g,s){
 const q=coverage(s.p,s.hit),approach=s.p<s.arrival;
 const size=approach?L(182,180*s.factor,smooth(s.p/s.arrival)):185*s.factor;
 g.save();g.translate(s.x,s.y);
 if(approach)g.scale(s.dir,1);
 g.globalAlpha*=approach?1:1-q.breakup;
 // Keep the liquid planted on the floor, not the character's torso.
 tile(g,s.frame,-size*.5,-size*.92,size,size);g.restore();
}
function silhouette(data,w,h){
 let top=h,bottom=-1,left=w,right=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>96){top=Math.min(top,y);bottom=y;left=Math.min(left,x);right=Math.max(right,x);}
 return bottom<top?null:{top,bottom,left,right};
}
function metalPixels(data,w,h,phase,bounds=silhouette(data,w,h)){
 if(!bounds||!phase.rise)return bounds;
 const {top,bottom,left,right}=bounds,H=Math.max(1,bottom-top),B=Math.max(1,right-left),cell=Math.max(5,H*.075);
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
  const j=(y*w+x)*4;if(!data[j+3])continue;
  const nx=(x-left)/B,ny=(y-top)/H;
  const edge=1-phase.rise+.025*Math.sin(nx*13+phase.frame*.28);
  const wet=phase.rise>=1?1:smooth((ny-edge+.035)/.055);
  const cx=Math.floor(x/cell),cy=Math.floor(y/cell),hash=((Math.sin(cx*127.1+cy*311.7)*43758.5453)%1+1)%1;
  const tri=((x/cell)%1+(y/cell)%1)>1?1:-1;
  const detach=smooth((phase.breakup-hash*.78)/.22);
  const alpha=wet*(1-detach);if(alpha<=0)continue;
  const lum=data[j]*.299+data[j+1]*.587+data[j+2]*.114;
  const reflection=32*Math.cos(nx*11+ny*3)+22*Math.sin(nx*24-ny*6);
  const facet=phase.hard*(hash*42-21+tri*15);
  const rim=phase.rise<1?45*Math.max(0,1-Math.abs(ny-edge)/.04):0;
  const v=105+lum*.42+reflection+facet+rim;
  data[j]=L(data[j],Math.max(0,Math.min(255,v-7)),alpha);
  data[j+1]=L(data[j+1],Math.max(0,Math.min(255,v+2)),alpha);
  data[j+2]=L(data[j+2],Math.max(0,Math.min(255,v+10)),alpha);
 }
 return bounds;
}
function polygon(g,pts,fill){g.beginPath();for(let i=0;i<pts.length;i++)i?g.lineTo(...pts[i]):g.moveTo(...pts[i]);g.closePath();g.fillStyle=fill;g.fill();}
function spikes(g,p,b,data,w,x,y){
 if(!b||p.hard<=0||p.rise<.80||p.breakup>=1)return;
 const H=Math.max(1,b.bottom-b.top),B=Math.max(1,b.right-b.left),a=p.hard*(1-p.breakup);
 g.save();g.translate(x,y);g.globalAlpha*=a;
 for(let i=0;i<8;i++){
  const row=Math.round(b.top+H*(.16+i*.095)),side=i%2?1:-1;
  let edge=side<0?b.left:b.right;
  while(edge>=b.left&&edge<=b.right&&data[(row*w+edge)*4+3]<128)edge-=side;
  if(edge<b.left||edge>b.right)continue;
  const length=Math.min(H*.14,B*.24)*(1+i%3*.17)*p.hard,base=Math.max(2,H*.026);
  const drift=p.breakup*H*.16,dx=side*drift,dy=drift*.5;
  const root=[edge+dx,row+dy],upper=[root[0]-side*base,root[1]-base],lower=[root[0]-side*base,root[1]+base],tip=[root[0]+side*length,root[1]-length*.38];
  polygon(g,[upper,tip,root],"#d6e1e8");polygon(g,[root,tip,lower],"#697882");
 }
 g.restore();
}
function coat(g,phase,paint,rect){
 if(!phase?.active||phase.rise<=0)return paint(g);
 const {x,y,w,h}=rect,cw=Math.ceil(w),ch=Math.ceil(h);
 if(!scratch)scratch=document.createElement("canvas");
 if(scratch.width!==cw)scratch.width=cw;if(scratch.height!==ch)scratch.height=ch;
 const ctx=scratch.getContext("2d",{willReadFrequently:true});ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cw,ch);
 ctx.save();ctx.translate(-x,-y);const result=paint(ctx);ctx.restore();
 if(result===false)return false;
 const im=ctx.getImageData(0,0,cw,ch),bounds=metalPixels(im.data,cw,ch,phase);
 ctx.putImageData(im,0,0);
 // The mask comes from the current, dressed target pose, so every body,
 // cape, staff and creature has the correct outline without a dummy asset.
 g.drawImage(scratch,x,y,cw,ch);
 spikes(g,phase,bounds,im.data,cw,x,y);
 return result===undefined?true:result;
}
function shake(p,hit=.73){const q=(p-hit)/.085;if(q<0||q>=1)return{x:0,y:0};const f=(1-q)**2;return{x:Math.sin(q*35)*7*f,y:Math.cos(q*31)*4*f};}
function portrait(g,w,h){const size=Math.min(w,h)*1.13;tile(g,9,(w-size)/2,(h-size)/2,size,size);}
window.Quicksilver={ensure,ready,error:()=>lastError,scene,draw,coverage,coat,metalPixels,silhouette,shake,portrait};ensure();
})();