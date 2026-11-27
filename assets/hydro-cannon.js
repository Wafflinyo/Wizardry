/* Hydro Cannon: original remade 32 dry turtle and 24 separate water frames.
 * Native-size alpha atlases, target-aware rendered poses, two independent water blasts. */
(()=>{
"use strict";
const CW=222,CH=222,FW=256,FH=256,HIT=.62,FIRE=.55,BEAM_END=.70,DURATION=4800;
const turtle=new Image(),water=new Image();
const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,t)=>a+(b-a)*t;
const good=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>good(turtle,1776,888)&&good(water,1536,1024);
let pending=null,lastError="";
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 const load=(im,w,h,path)=>good(im,w,h)?Promise.resolve(true):new Promise(resolve=>{
  im.onload=()=>resolve(good(im,w,h));im.onerror=()=>resolve(false);im.src=path;
 });
 pending=Promise.all([
  load(turtle,1776,888,"./assets/hydro-remake-turtle.webp?v=0.354.86"),
  load(water,1536,1024,"./assets/hydro-remake-water.webp?v=0.354.86")
 ]).then(r=>{const ok=r.every(Boolean);lastError=ok?"":"Hydro Cannon artwork failed to load";if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);
 return pending;
}
const bases=[190,190,190,189,189,189,189,189,187,187,187,187,187,187,187,187,188,188,188,188,188,188,188,188,189,189,189,189,189,189,189,189];
// Muzzle positions in native source cell coordinates, near then far.
// These are measured against this atlas, not the previous model.
const muzzles=[
 [171,123,187,124],[171,122,188,124],[161,120,180,120],[154,80,182,108],
 [143,70,159,70],[139,59,157,58],[130,46,149,46],[125,40,144,39],
 [125,30,144,32],[130,43,148,43],[139,61,155,61],[146,70,163,69],
 [151,77,171,77],[157,81,175,82],[157,88,177,89],[158,94,177,93],
 [157,97,177,97],[158,97,178,97],[158,97,177,97],[157,96,177,97],
 [157,97,176,98],[159,96,178,97],[161,98,178,98],[161,100,180,100],
 [160,102,181,102],[160,105,181,105],[162,106,181,106],[165,107,185,108],
 [164,111,184,111],[165,112,184,112],[165,112,185,112],[164,113,183,113]
];
const pitch=[.30,.28,.22,-.18,-.20,-.34,-.50,-.64,-.70,-.50,-.24,-.10,-.03,.04,.08,.13,.15,.14,.15,.15,.16,.17,.19,.20,.22,.24,.25,.28,.30,.30,.31,.31];
const aimOrder=[8,7,6,9,5,10,4,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,2,27,28,29,0,1,30,31];
function anchors(n,dir,k){
 const m=muzzles[n],base=bases[n];
 const point=(px,py)=>({x:500+dir*(px-CW/2)*k,y:510+(py-base)*k});
 // Refine the opening centers using the actual raster rims. The old
 // anchors sat slightly above/behind the holes in the firing poses.
 const ox=n<=3?1:n<=10?2:5,oy=n<=3?1:n<=10?2:5;
 const near=point(m[0]+ox,m[1]+oy),far=point(m[2]+(n<=10?1:4),m[3]+oy);
 return {near,far,mx:(near.x+far.x)/2,my:(near.y+far.y)/2};
}
function aimFor(target,dir,k,targetK){
 const desired=target.y-85*targetK,top=target.y-125*targetK,bottom=target.y-45*targetK;
 let best=null;
 for(const n of aimOrder){
  const m=anchors(n,dir,k),reach=Math.max(1,(target.x-m.mx)*dir);
  const projected=m.my+reach*pitch[n];
  const outside=Math.max(0,top-projected,projected-bottom);
  const score=Math.abs(projected-desired)+outside*4+Math.abs(pitch[n])*.7;
  if(!best||score<best.score)best={frame:n,score,projected};
 }
 return best;
}
function poseAt(p){
 p=C(p);const elapsed=p*DURATION;
 return {frame:0,alpha:p<.10?C(p/.075):p>.94?C((1-p)/.06):1,
  beam:p<FIRE||p>=BEAM_END?-1:Math.floor((elapsed-FIRE*DURATION)/34)%3,
  impact:p<HIT?-1:Math.min(23,16+Math.floor((elapsed-HIT*DURATION)/90))};
}
function scene(source,target,p,factor=1){
 p=C(p);const dir=target.x===500?(source.team===1?-1:1):target.x>500?1:-1,x=500,y=510,k=1.22,pose=poseAt(p);
 const targetK=(.60+.30*C((target.y-288)/235))*Math.max(1,factor);
 const aim=aimFor(target,dir,k,targetK);
 const top=target.y-125*targetK,bottom=target.y-45*targetK;
 const contactY=Math.max(top,Math.min(bottom,aim.projected));
 const elapsed=p*DURATION;
 // Follow the original rise sequence at 55ms/frame. During the aiming
 // phase move through the atlas in order of barrel pitch, not blindly
 // through the deepest crouch. Recoil uses neighboring matched poses.
 const idx=aimOrder.indexOf(aim.frame),neutral=aimOrder.indexOf(12);
 if(p<.16)pose.frame=Math.min(8,Math.floor(elapsed/65));
 else if(p<.28)pose.frame=Math.min(12,9+Math.floor((elapsed-.16*DURATION)/65));
 else if(p<FIRE){
  const steps=Math.abs(idx-neutral),step=Math.min(steps,Math.floor((elapsed-.28*DURATION)/48));
  pose.frame=aimOrder[neutral+Math.sign(idx-neutral)*step];
 }else if(p<BEAM_END){
  const candidates=[aim.frame];
  for(const n of [aimOrder[idx-1],aimOrder[idx+1]]){
   if(n===undefined)continue;const m=anchors(n,dir,k);
   if(Math.abs(m.my+Math.max(1,(target.x-m.mx)*dir)*pitch[n]-contactY)<=18*targetK&&Math.abs(n-aim.frame)<=3)candidates.push(n);
  }
  const recoil=Math.floor((elapsed-FIRE*DURATION)/55)%5;
  pose.frame=recoil===1&&candidates.length>1?candidates[1]:recoil===2&&candidates.length>2?candidates[2]:aim.frame;
 }else{
  const steps=Math.abs(idx-neutral),step=Math.min(steps,Math.floor((elapsed-BEAM_END*DURATION)/48));
  pose.frame=aimOrder[idx+Math.sign(neutral-idx)*step];
  if(p>.94)pose.frame=12;
 }
 const {near,far,mx,my}=anchors(pose.frame,dir,k);
 // Separate upper and lower contact points, both on the selected enemy.
 // The two shots have no common junction, branch, or merged beam.
 const halfGap=Math.min(28,30*targetK);
 const center=Math.max(top+halfGap,Math.min(bottom-halfGap,contactY));
 const farTarget={x:target.x,y:center-halfGap};
 const nearTarget={x:target.x,y:center+halfGap};
 return {x,y,k,dir,p,pose,near,far,nearTarget,farTarget,mx,my,tx:target.x,ty:target.y,contactY,targetK,aimFrame:aim.frame,barrelSlope:pitch[pose.frame]};
}
function tile(g,im,n,cols,w,h,dx,dy,dw,dh){g.drawImage(im,n%cols*w,Math.floor(n/cols)*h,w,h,dx,dy,dw,dh);}
function actor(g,s){
 if(!ready()||s.pose.alpha<=0)return;
 const n=s.pose.frame;g.save();g.globalAlpha*=s.pose.alpha;g.translate(s.x,s.y);g.scale(s.dir*s.k,s.k);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,turtle,n,8,CW,CH,-CW/2,-bases[n],CW,CH);g.restore();
}
function summon(g,s){
 if(!ready()||s.p>=.16)return;
 const q=C(s.p/.16),n=23-Math.min(4,Math.floor(q*5));
 g.save();g.globalAlpha*=Math.sin(Math.PI*q)*.85;
 const w=270,h=250;tile(g,water,n,6,FW,FH,s.x-w/2,s.y-h*.74,w,h);g.restore();
}
// Separate upper and lower projectile sprites from the original atlas.
// These are the four unmerged pairs: no portion of a merged-beam frame
// is drawn. Each individual sprite is anchored on its own travel axis.
const jetCrops=[
 [[14,101,112,66],[15,161,112,64]],
 [[9,101,153,66],[10,161,158,64]],
 [[5,101,201,66],[6,161,208,64]],
 [[3,101,231,66],[4,161,237,64]]
];
const NEAR_DELAY=38/DURATION;
function blastPath(s,lower){
 const from=lower?s.near:s.far,to=lower?s.nearTarget:s.farTarget;
 // A tiny stagger lets both distinct cannon discharges read clearly.
 // Both water bolts still reach the target at the original hit time.
 const start=FIRE+(lower?NEAR_DELAY:0);
 if(s.p<=start||s.p>=BEAM_END)return null;
 const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);
 if(len<1)return null;
 const q=C((s.p-start)/(HIT-start));
 const tip=len*q;
 const body=Math.min(112,len*.62);
 const drain=C((s.p-HIT)/(BEAM_END-HIT));
 const tail=Math.min(tip,Math.max(0,tip-body)+body*drain);
 if(tip-tail<.5)return null;
 const ux=dx/len,uy=dy/len;
 const n=q<.28?Math.min(1,Math.floor(q/.14)):2+Math.floor((s.p-start)*DURATION/46)%2;
 return {x:from.x+ux*tail,y:from.y+uy*tail,tipX:from.x+ux*tip,tipY:from.y+uy*tip,
  length:tip-tail,angle:Math.atan2(dy,dx),height:46,alpha:1-drain,frame:n,lower};
}
function drawBlast(g,b){
 if(!b)return;
 const crop=jetCrops[b.frame][b.lower?1:0];
 g.save();g.globalAlpha*=b.alpha;g.translate(b.x,b.y);g.rotate(b.angle);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(water,(b.frame+2)*FW+crop[0],crop[1],crop[2],crop[3],0,-b.height/2,b.length,b.height);
 g.restore();
}
function beam(g,s){
 if(!ready())return;const p=s.p;
 if(p>=.28&&p<FIRE){
  const q=C((p-.28)/(FIRE-.28)),size=13+13*q,n=Math.floor((p-.28)*DURATION/42)%2;
  // Center the luminous nucleus itself, not the asymmetric sprite
  // bounding box. Measured centers: (73,135) and (70,137).
  const cx=n?70:73,cy=n?137:135;
  for(const m of [s.far,s.near]){
   g.save();g.globalAlpha*=.55+.4*q;
   g.translate(m.x,m.y);g.scale(s.dir,1);
   g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
   g.drawImage(water,n*FW+cx-34,cy-34,68,68,-size/2,-size/2,size,size);g.restore();
  }return;
 }
 if(s.pose.beam<0)return;
 // Far cannon first; the nearer cannon has its own independent shot.
 drawBlast(g,blastPath(s,false));
 drawBlast(g,blastPath(s,true));
}
const splashBases=[193,194,195,192,192,191,187,185];
function impact(g,s){
 const n=s.pose.impact;if(!ready()||n<0)return;
 const w=218*s.targetK,h=245*s.targetK;
 const q=C((s.p-HIT)/.10),y=L(Math.min(s.ty,s.contactY+65*s.targetK),s.ty,q);
 g.save();g.globalAlpha*=s.p>.94?C((1-s.p)/.06):1;
 tile(g,water,n,6,FW,FH,s.tx-w/2,y-h*splashBases[n-16]/FH,w,h);g.restore();
}
function portrait(g,w,h){
 if(!ready())return;const k=Math.min(w/222,h/190)*.95;
 g.save();g.translate(w/2,h*.95);g.scale(k,k);
 tile(g,turtle,12,8,CW,CH,-CW/2,-bases[12],CW,CH);g.restore();
}
window.HydroCannon={frameCount:32,effectFrameCount:24,hit:HIT,aimFor,blastPath,ensure,ready,error:()=>lastError,poseAt,scene,actor,summon,beam,impact,portrait};
ensure();
})();