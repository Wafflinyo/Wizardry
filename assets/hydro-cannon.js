/* Hydro Cannon — separate, original 32-frame dry turtle, 24-frame
 * jet atlas and independent splash atlas. True arena-center summon. */
(()=>{
"use strict";
const CW=222,CH=222,FW=242,FH=272,HIT=.70,FIRE=.58;
const turtle=new Image(),water=new Image();
const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,t)=>a+(b-a)*t;
const good=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>good(turtle,1776,888)&&good(water,1452,1088);
let pending=null,lastError="";
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 const load=(im,w,h,path)=>good(im,w,h)?Promise.resolve(true):new Promise(resolve=>{
  im.onload=()=>resolve(good(im,w,h));im.onerror=()=>resolve(false);im.src=path;
 });
 pending=Promise.all([
  load(turtle,1776,888,"./assets/hydro-crisp-turtle.webp?v=0.354.83"),
  load(water,1452,1088,"./assets/hydro-crisp-water.webp?v=0.354.83")
 ]).then(r=>{const ok=r.every(Boolean);lastError=ok?"":"Hydro Cannon artwork failed to load";if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);
 return pending;
}
// Native-resolution cells. Measured front-foot baselines and barrel centers
// in the individually rendered upright, lean, firing and recovery poses.
const bases=[193,192,191,191,191,191,191,191,191,192,191,192,193,193,193,193,192,192,192,192,192,192,191,191,192,192,193,193,193,192,192,192];
const muzzles=[
 [151,53,177,56],[150,54,176,58],[150,63,178,67],[156,67,181,71],
 [161,80,184,82],[167,86,191,89],[172,88,191,94],[169,112,188,109],
 [173,115,194,115],[171,120,192,123],[171,127,192,128],[170,136,193,134],
 [173,134,193,136],[173,142,193,142],[174,145,195,145],[174,145,195,145],
 [176,153,196,152],[177,150,196,151],[175,151,196,150],[180,143,200,144],
 [176,136,196,137],[175,131,194,132],[174,133,193,134],[170,130,190,131],
 [175,122,194,123],[170,114,189,114],[165,99,185,100],[166,88,185,89],
 [159,59,180,62],[157,56,177,58],[151,49,174,52],[151,46,174,50]
];
function poseAt(p){
 p=C(p);let frame,alpha=1;
 if(p<.20){frame=Math.min(7,Math.floor(p/.20*8));alpha=C(p/.12);}
 else if(p<.38)frame=8+Math.min(2,Math.floor((p-.20)/.18*3));
 else if(p<FIRE)frame=11+Math.min(4,Math.floor((p-.38)/(FIRE-.38)*5));
 else if(p<.81)frame=16+Math.min(3,Math.floor((p-FIRE)/(.81-FIRE)*4));
 else if(p<.91)frame=20+Math.min(7,Math.floor((p-.81)/.10*8));
 else{frame=28+Math.min(3,Math.floor((p-.91)/.09*4));alpha=C((1-p)/.065);}
 const beam=p<FIRE||p>.81?-1:Math.min(11,Math.floor((p-FIRE)/(.81-FIRE)*12));
 const impact=p<HIT?-1:16+Math.min(7,Math.floor((p-HIT)/(1-HIT)*8));
 return {frame,alpha,beam,impact};
}
function scene(source,target,p,factor=1){
 const dir=target.x===500?(source.team===1?-1:1):target.x>500?1:-1,x=500,y=510,k=1.22,pose=poseAt(p);
 const targetK=(.60+.30*C((target.y-288)/235))*Math.max(1,factor);
 // Upper-row opponents need a shallower barrel pose. Select a rendered
 // aiming pose, not a rotation of the creature, for those positions.
 const nominalContact=target.y-85*targetK;
 if(p>=.38&&p<=.81&&nominalContact<y-124&&pose.frame>=11)pose.frame=4+Math.min(2,Math.floor((p-.38)/.15));
 const m=muzzles[pose.frame],base=bases[pose.frame];
 const point=(px,py)=>({x:x+dir*(px-CW/2)*k,y:y+(py-base)*k});
 const near=point(m[0],m[1]),far=point(m[2],m[3]);
 const mx=(near.x+far.x)/2,my=(near.y+far.y)/2;
 // Aim along the barrel's downward pitch when possible, landing within
 // the target's torso rather than forcing the stream toward its feet.
 const preferred=my+Math.abs(target.x-mx)*(pose.frame>=11&&pose.frame<=19?.27:.04);
 const contactY=Math.max(target.y-125*targetK,Math.min(target.y-45*targetK,preferred));
 const merge={x:L(mx,target.x,.36),y:L(my,contactY,.36)};
 // Use one continuous thick core which starts BEFORE the visible junction.
 // The individual muzzle jets overlap the core, never meet edge-to-edge.
 const coreStart={x:L(mx,target.x,.18),y:L(my,contactY,.18)};
 const branchEnd={x:L(mx,target.x,.45),y:L(my,contactY,.45)};
 return {x,y,k,dir,p:C(p),pose,near,far,merge,coreStart,branchEnd,mx,my,tx:target.x,ty:target.y,contactY,targetK};
}
function tile(g,im,n,cols,w,h,dx,dy,dw,dh){g.drawImage(im,n%cols*w,Math.floor(n/cols)*h,w,h,dx,dy,dw,dh);}
function actor(g,s){
 if(!ready()||s.pose.alpha<=0)return;
 const n=s.pose.frame;
 g.save();g.globalAlpha*=s.pose.alpha;g.translate(s.x,s.y);g.scale(s.dir*s.k,s.k);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,turtle,n,8,CW,CH,-CW/2,-bases[n],CW,CH);g.restore();
}
function summon(g,s){
 if(!ready()||s.p>=.20)return;
 const q=C(s.p/.20),n=23-Math.min(3,Math.floor(q*4));
 g.save();g.globalAlpha*=Math.sin(Math.PI*q)*.85;
 tile(g,water,n,6,FW,FH,s.x-135,s.y-235,270,290);g.restore();
}
// Tight crops of the existing transparent raster artwork. Each branch
// is cropped inside its opaque core at both ends so the nozzle and
// the merged stream share visible water, not transparent padding.
const jetCrops=[
 [[27,103,93,51],[27,177,91,57]],
 [[29,107,119,48],[29,179,123,54]],
 [[27,102,145,54],[27,176,149,61]]
];
function stream(g,from,to,n,lower,wide,alpha,progress=1){
 if(progress<=0||alpha<=0)return;
 const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy)*progress;
 if(len<.5)return;
 const sx=(n%6)*FW,sy=Math.floor(n/6)*FH;
 const crop=wide?[18,67,221,159]:jetCrops[n][lower?1:0];
 const height=wide?88:44;
 // Extend the water a few pixels into the barrel so no rim gap is visible.
 const inset=wide?0:6;
 g.save();g.globalAlpha*=alpha;g.translate(from.x,from.y);g.rotate(Math.atan2(dy,dx));
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(water,sx+crop[0],sy+crop[1],crop[2],crop[3],-inset,-height/2,len+inset,height);g.restore();
}
function beam(g,s){
 if(!ready())return;
 const p=s.p;
 if(p>=.36&&p<FIRE){
  const q=C((p-.36)/(FIRE-.36)),size=14+15*q;
  for(const m of [s.far,s.near]){
   g.save();g.globalAlpha*=.45+.4*q;
   g.drawImage(water,16,112,57,62,m.x-size*.24,m.y-size/2,size,size);g.restore();
  }
  return;
 }
 if(s.pose.beam<0)return;
 const q=C((p-FIRE)/(HIT-FIRE)),fade=p>.78?C((.81-p)/.03):1;
 const lead=C(q/.45),tail=C((q-.30)/.70);
 const j=Math.min(2,Math.floor((p-FIRE)/.025)%3);
 const n=9+Math.min(2,Math.floor((p-FIRE)/.026)%3);
 // The core begins while the two branches are still growing and overlaps
 // 27% of the full path. Drawing the nozzle streams on top gives a single
 // uninterrupted water silhouette all the way to the enemy.
 stream(g,s.coreStart,{x:s.tx,y:s.contactY},n,false,true,fade,tail);
 stream(g,s.far,s.branchEnd,j,true,false,fade,lead);
 stream(g,s.near,s.branchEnd,j,false,false,fade,lead);
}
function impact(g,s){
 const n=s.pose.impact;if(!ready()||n<0)return;
 const w=205*s.targetK,h=230*s.targetK;
 const q=C((n-16)/4),y=L(s.contactY+36*s.targetK,s.ty,q);
 g.save();g.globalAlpha*=s.p>.96?C((1-s.p)/.04):1;
 tile(g,water,n,6,FW,FH,s.tx-w/2,y-h*(n>=18?222/272:218/272),w,h);g.restore();
}
function portrait(g,w,h){
 if(!ready())return;const k=Math.min(w/222,h/190)*.95;
 g.save();g.translate(w/2,h*.95);g.scale(k,k);
 tile(g,turtle,5,8,CW,CH,-CW/2,-bases[5],CW,CH);g.restore();
}
window.HydroCannon={frameCount:32,effectFrameCount:24,hit:HIT,ensure,ready,error:()=>lastError,poseAt,scene,actor,summon,beam,impact,portrait};
ensure();
})();