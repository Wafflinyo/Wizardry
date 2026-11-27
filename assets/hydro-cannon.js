/* Hydro Cannon — separate, original 32-frame dry turtle, 24-frame
 * jet atlas and independent splash atlas. True arena-center summon. */
(()=>{
"use strict";
const CW=222,CH=222,FW=242,FH=272,HIT=.70,FIRE=.58,BEAM_END=.79,DURATION=4800;
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
 p=C(p);
 // Fixed cast duration; sprite and water playback run on independent clocks.
 const elapsed=p*DURATION;
 const alpha=p<.12?C(p/.075):p>.94?C((1-p)/.06):1;
 const beam=p<FIRE||p>=BEAM_END?-1:Math.floor((elapsed-FIRE*DURATION)/55)%3;
 const impact=p<HIT?-1:Math.min(23,16+Math.floor((elapsed-HIT*DURATION)/115));
 return {frame:0,alpha,beam,impact};
}
// Screen-space barrel-axis slopes measured from the existing raster
// poses. Positive means down toward the floor. Use the least-pitched
// pose whose actual barrel ray reaches the opponent's body.
const aimSlopes=[-.15,-.10,.04,.12,.17,.25,.32,.43,.48,.53,.58,.62,.65,.68,.70,.72];
function aimFor(target,dir,k,targetK){
 const desired=target.y-85*targetK,top=target.y-125*targetK,bottom=target.y-45*targetK;
 let best=null;
 for(let n=0;n<aimSlopes.length;n++){
  const m=muzzles[n],base=bases[n];
  const mx=500+dir*((m[0]+m[2])/2-CW/2)*k;
  const my=510+((m[1]+m[3])/2-base)*k;
  const reach=Math.max(1,(target.x-mx)*dir);
  const projected=my+reach*aimSlopes[n];
  // Prefer hitting the center of the body with the shallowest lean.
  const outside=Math.max(0,top-projected,projected-bottom);
  const score=Math.abs(projected-desired)+outside*4+n*2.5;
  if(!best||score<best.score)best={frame:n,score,projected};
 }
 return best;
}
function scene(source,target,p,factor=1){
 p=C(p);
 const dir=target.x===500?(source.team===1?-1:1):target.x>500?1:-1,x=500,y=510,k=1.22,pose=poseAt(p);
 const targetK=(.60+.30*C((target.y-288)/235))*Math.max(1,factor);
 const aim=aimFor(target,dir,k,targetK);
 // Rendered poses only: quickly rise and settle, then lean at about
 // 20 frames/sec. A small recoil step is selected only when it still
 // points toward the enemy, rather than cycling into a deep crouch.
 const elapsed=p*DURATION;
 const idle=Math.min(2,aim.frame);
 const leanStart=.30*DURATION;
 const leanStep=50;
 const recoil=Math.max(0,aim.frame-1);
 const rm=muzzles[recoil],rbase=bases[recoil];
 const rx=x+dir*((rm[0]+rm[2])/2-CW/2)*k;
 const ry=y+((rm[1]+rm[3])/2-rbase)*k;
 const recoilProjected=ry+Math.max(1,(target.x-rx)*dir)*aimSlopes[recoil];
 const contact=Math.max(target.y-125*targetK,Math.min(target.y-45*targetK,aim.projected));
 const recoilOK=recoil!==aim.frame&&Math.abs(recoilProjected-contact)<=24*targetK;
 if(p<.12)pose.frame=Math.min(idle,Math.floor(elapsed/50));
 else if(p<.30){
  const cycle=[idle,Math.max(0,idle-1),idle];
  pose.frame=cycle[Math.floor((elapsed-.12*DURATION)/75)%cycle.length];
 }
 else if(p<FIRE)pose.frame=Math.min(aim.frame,idle+Math.floor((elapsed-leanStart)/leanStep));
 else if(p<BEAM_END){
  const phase=(elapsed-FIRE*DURATION)%270;
  pose.frame=recoilOK&&phase>=55&&phase<115?recoil:aim.frame;
 }
 else pose.frame=Math.max(0,aim.frame-Math.floor((elapsed-BEAM_END*DURATION)/55));
 const m=muzzles[pose.frame],base=bases[pose.frame];
 const point=(px,py)=>({x:x+dir*(px-CW/2)*k,y:y+(py-base)*k});
 const near=point(m[0],m[1]),far=point(m[2],m[3]);
 const mx=(near.x+far.x)/2,my=(near.y+far.y)/2;
 // Keep the water ray within the body; when the pose is aligned, its
 // continuation follows the actual cannon pitch rather than a fixed angle.
 const contactY=Math.max(target.y-125*targetK,Math.min(target.y-45*targetK,aim.projected));
 const merge={x:L(mx,target.x,.20),y:L(my,contactY,.20)};
 const coreStart={x:L(mx,target.x,.08),y:L(my,contactY,.08)};
 const branchEnd={x:L(mx,target.x,.32),y:L(my,contactY,.32)};
 return {x,y,k,dir,p,pose,near,far,merge,coreStart,branchEnd,mx,my,tx:target.x,ty:target.y,contactY,targetK,aimFrame:aim.frame,barrelSlope:aimSlopes[aim.frame]};
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
 if(!ready()||s.p>=.15)return;
 const q=C(s.p/.15),n=23-Math.min(3,Math.floor(q*4));
 g.save();g.globalAlpha*=Math.sin(Math.PI*q)*.85;
 tile(g,water,n,6,FW,FH,s.x-135,s.y-235,270,290);g.restore();
}
// Tight crops of the existing transparent raster artwork. Each branch
// is cropped inside its opaque core at both ends so the nozzle and
// the merged stream share visible water, not transparent padding.
const jetCrops=[
 [[30,101,74,55],[30,175,74,61]],
 [[30,105,110,55],[30,175,110,62]],
 [[29,101,131,58],[29,175,131,65]]
];
function stream(g,from,to,n,lower,wide,alpha,progress=1){
 if(progress<=0||alpha<=0)return;
 const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy)*progress;
 if(len<.5)return;
 const sx=(n%6)*FW,sy=Math.floor(n/6)*FH;
 // Crop only the opaque interior of the raster jets. Full-width core
 // frames 9–11 have substantial alpha coverage right across the tile.
 const crop=wide?[10,65,220,160]:jetCrops[n][lower?1:0];
 const height=wide?104:52,inset=wide?8:8;
 g.save();g.globalAlpha*=alpha;g.translate(from.x,from.y);g.rotate(Math.atan2(dy,dx));
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 // Extend the start under its neighbor, not beyond the moving attack tip.
 g.drawImage(water,sx+crop[0],sy+crop[1],crop[2],crop[3],-inset,-height/2,len+inset,height);g.restore();
}
function beam(g,s){
 if(!ready())return;
 const p=s.p;
 if(p>=.28&&p<FIRE){
  const q=C((p-.28)/(FIRE-.28)),size=14+13*q;
  const n=Math.floor((p-.28)*DURATION/55)%3;
  for(const m of [s.far,s.near]){
   g.save();g.globalAlpha*=.5+.4*q;
   g.drawImage(water,n*FW+25,110,53,45,m.x-size*.24,m.y-size/2,size,size);g.restore();
  }
  return;
 }
 if(s.pose.beam<0)return;
 const q=C((p-FIRE)/(HIT-FIRE)),fade=p>.765?C((BEAM_END-p)/.025):1;
 // Both branches and the long core share the same advancing front.
 // The core begins 8% along the shot, while the branches extend to 32%.
 // Their substantial overlap avoids a detached beam or a long Y shape.
 const lead=C(q/.32),tail=C((q-.08)/.92);
 const j=s.pose.beam,n=9+j;
 stream(g,s.coreStart,{x:s.tx,y:s.contactY},n,false,true,fade,tail);
 stream(g,s.far,s.branchEnd,j,true,false,fade,lead);
 stream(g,s.near,s.branchEnd,j,false,false,fade,lead);
}
function impact(g,s){
 const n=s.pose.impact;if(!ready()||n<0)return;
 const w=205*s.targetK,h=230*s.targetK;
 const q=C((s.p-HIT)/.115),y=L(s.contactY+24*s.targetK,s.ty,q);
 g.save();g.globalAlpha*=s.p>.96?C((1-s.p)/.04):1;
 tile(g,water,n,6,FW,FH,s.tx-w/2,y-h*(n>=18?222/272:218/272),w,h);g.restore();
}
function portrait(g,w,h){
 if(!ready())return;const k=Math.min(w/222,h/190)*.95;
 g.save();g.translate(w/2,h*.95);g.scale(k,k);
 tile(g,turtle,5,8,CW,CH,-CW/2,-bases[5],CW,CH);g.restore();
}
window.HydroCannon={frameCount:32,effectFrameCount:24,hit:HIT,aimFor,ensure,ready,error:()=>lastError,poseAt,scene,actor,summon,beam,impact,portrait};
ensure();
})();