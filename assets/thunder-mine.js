/* Thunder Mine: sixteen isolated mine poses and eight separate electrical
   effect tiles. World-space motion, attachment and detonation are independent. */
(()=>{
"use strict";
const C=192,body=new Image(),fx=new Image();
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
let pending=null,err="";
const ready=()=>body.complete&&body.naturalWidth===768&&body.naturalHeight===768&&fx.complete&&fx.naturalWidth===768&&fx.naturalHeight===384;
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 pending=Promise.all([[body,"./assets/thunder-mine-body.webp?v=1"],[fx,"./assets/thunder-mine-fx.webp?v=1"]].map(([im,url])=>new Promise(resolve=>{
   if(im.complete&&im.naturalWidth){resolve(true);return;}
   const timer=setTimeout(()=>resolve(false),12000);
   im.onload=()=>{clearTimeout(timer);resolve(true);};
   im.onerror=()=>{clearTimeout(timer);resolve(false);};im.src=url;
 }))).then(()=>{err=ready()?"":"Thunder Mine art failed to load";if(ready())try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}return ready();}).finally(()=>pending=null);
 return pending;
}
function tile(g,img,n,x,y,size,alpha=1,dir=1){
 if(!ready()||alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.translate(x,y);g.scale(dir,1);
 g.drawImage(img,(n%4)*C,Math.floor(n/4)*C,C,C,-size/2,-size/2,size,size);g.restore();
}
// Torso-level anchor (well below the face and hat) in local model space.
// [fallback rear edge, torso height, compact mounted mine size].
const BACK={
 wizard:[35,70,48],dummy:[36,91,49],
 scribe:[39,63,46],acolyte:[40,65,47],pageguard:[55,37,49],
 magistrate:[47,76,55],inkbinder:[46,79,54],warden:[58,57,55]
};
// Lower leg anchors use local boot/shin coordinates, never cape edges.
// [leg center X in the unmirrored atlas, height above sole, mine size,
// outward side of the leg]. Grelus uses the exposed forward leg.
const LEGS={
 abyssal:[28,32,55,1],gale:[24,28,51,1],briar:[33,34,56,1],
 glacial:[36,36,60,1],grelus:[-22,25,47,-1]
};
const poses=new WeakMap(),silhouettes=new WeakMap();
function modelId(u){return u.bossId||u.minionId||(u.dummy&&!u.wizardDummy?"dummy":"wizard");}
// Read the same source cell that drawUnit renders. Use the thick
// connected torso span, not the bounding box of the hat, weapon or arms.
function torsoEdge(pixels,cell,row,dir){
 const edges=[];
 for(let yy=Math.max(0,row-3);yy<=Math.min(cell-1,row+3);yy++){
   const runs=[];let start=-1;
   for(let xx=0;xx<=cell;xx++){
     const solid=xx<cell&&pixels[(yy*cell+xx)*4+3]>=170;
     if(solid&&start<0)start=xx;
     if(!solid&&start>=0){if(xx-start>=Math.max(3,cell*.06))runs.push([start,xx-1]);start=-1;}
   }
   // Prefer a substantial central body segment to disconnected props.
   runs.sort((a,b)=>((b[1]-b[0])-Math.abs((b[0]+b[1])/2-cell/2)*.55)-((a[1]-a[0])-Math.abs((a[0]+a[1])/2-cell/2)*.55));
   if(runs.length)edges.push(dir>0?runs[0][1]:runs[0][0]);
 }
 edges.sort((a,b)=>a-b);
 return edges.length?edges[Math.floor(edges.length/2)]:null;
}
// Select a solid part of the shin near its authored center; do not
// search to the outer edge of the entire lower silhouette (cape).
function legCenter(pixels,cell,row,wanted){
 const samples=[];
 const range=Math.max(4,Math.round(cell*.095));
 for(let yy=Math.max(0,row-3);yy<=Math.min(cell-1,row+3);yy++){
   let best=-1,dist=Infinity;
   for(let xx=Math.max(1,wanted-range);xx<=Math.min(cell-2,wanted+range);xx++){
     if(pixels[(yy*cell+xx)*4+3]<190||pixels[(yy*cell+xx-1)*4+3]<150||pixels[(yy*cell+xx+1)*4+3]<150)continue;
     const d=Math.abs(xx-wanted);if(d<dist){best=xx;dist=d;}
   }
   if(best>=0)samples.push(best);
 }
 samples.sort((a,b)=>a-b);
 return samples.length?samples[Math.floor(samples.length/2)]:null;
}
function registerPose(u,img,col,row,cell,rect,flip=1){
 if(!u||!Number.isFinite(u.x)||!Number.isFinite(u.y)||!img||!img.width||!rect||!Number.isFinite(rect.y)||rect.h<=0||!u.hp)return;
 const id=modelId(u),leg=LEGS[id],profile=leg||BACK[id]||BACK.wizard;
 const [center,height,size]=profile;
 // Ordinary wizards are mirrored by drawUnit. Authored tower creature
 // atlases are not mirrored; their visible front faces the left.
 const rear=leg?leg[3]:id==="wizard"?(u.team===1?1:-1):id==="dummy"?(u.team===1?1:-1):1;
 const localDir=rear*flip;
 const wanted=Math.round(clamp((center/flip-rect.x)/rect.w)*(cell-1));
 const sampleRow=Math.round(clamp((-height-rect.y)/rect.h)*(cell-1));
 let cached=silhouettes.get(img);
 if(!cached){cached=new Map();silhouettes.set(img,cached);}
 const key=[col,row,cell,sampleRow,localDir,leg?wanted:"back"].join("/");
 let edge=cached.get(key);
 if(edge===undefined){
   try{
     const canvas=document.createElement("canvas");canvas.width=cell;canvas.height=cell;
     const ctx=canvas.getContext("2d",{willReadFrequently:true});
     ctx.drawImage(img,col*cell,row*cell,cell,cell,0,0,cell,cell);
     const pixels=ctx.getImageData(0,0,cell,cell).data;
     edge=leg?legCenter(pixels,cell,sampleRow,wanted):torsoEdge(pixels,cell,sampleRow,localDir);
   }catch(e){edge=null;}
   cached.set(key,edge);
 }
 if(edge!==null){
   const localX=(rect.x+(edge+.5)/cell*rect.w)*flip;
   // The edge of the mine intersects the body, while its core sits
   // outside the rear silhouette and cannot cover eyes or the face.
   poses.set(u,{x:localX+rear*size*(leg?.18:.26),y:-height,size,dir:rear});
 }
}
function mount(u,scale=1){
 const depth=.60+.30*clamp((u.y-288)/235);
 const id=modelId(u);
 const leg=LEGS[id];
 const [edge,height,size]=leg||BACK[id]||BACK.wizard;
 const rear=leg?leg[3]:u.team===1?1:-1;
 const pose=poses.get(u)||{x:leg?edge+rear*size*.18:rear*(edge+size*.26),y:-height,size,dir:rear};
 const sand=u.statuses?.find(st=>st.kind==="quick_sand");
 const sink=(sand?.sinks||0)*45*depth;
 return {x:u.x+pose.x*depth,y:u.y+pose.y*depth+sink,
   size:pose.size*depth,scale:pose.size/75*depth,dir:pose.dir,
   depth:u.y+(leg?.11:-.035),model:id,kind:leg?"leg":"back",
   angle:pose.dir*Math.PI/2};
}
function scene(source,target,p,scale=1){
 const m=mount(target,scale),rear=m.dir;
 // Travel around the far side of the enemy and jump inward onto their
 // back, rather than jumping straight across the enemy's chest.
 const stopX=m.x+rear*(m.size*.65+9),stopY=target.y-13;
 const runDir=stopX>=500?1:-1;
 let x=500,y=510-39,frame=0,depth=510,alpha=1,size=138,dir=runDir;
 if(p<.16){const t=ease(p/.16);y-=155*(1-t);alpha=clamp(p/.035);frame=0;}
 else if(p<.31){frame=Math.min(3,1+Math.floor((p-.16)/.15*3));}
 else if(p<.63){
   const t=ease((p-.31)/.32);
   x=500+(stopX-500)*t;depth=510+(stopY-510)*t-Math.sin(Math.PI*t)*53;
   y=depth-36-3*Math.sin(t*8*Math.PI);
   frame=4+Math.floor((p-.31)*28)%5;
 }
 else if(p<.78){
   const t=clamp((p-.63)/.15);x=stopX+(m.x-stopX)*t;
   y=stopY-36+(m.y-(stopY-36))*t-45*Math.sin(Math.PI*t);
   depth=m.depth;dir=-rear;frame=9+Math.min(2,Math.floor(t*3));
   size=138+(m.size-138)*ease(t);
 }
 else alpha=0;
 return {x,y,depth,frame,dir,size,alpha,p,m};
}
// Turn the mount onto its side and narrow the face so it reads as a
// device clamped to the side surface, not a front-facing medallion.
function sideMount(g,frame,x,y,size,dir,angle,amount=1,alpha=1){
 g.save();g.translate(x,y);g.scale(1-.30*amount,1);g.rotate(angle*amount);
 tile(g,body,frame,0,0,size,alpha,dir);g.restore();
}
function draw(g,s){
 if(s.p>=.63&&s.p<.78){
   const t=ease((s.p-.63)/.15);
   sideMount(g,t>.82?12:s.frame,s.x,s.y,s.size,s.dir,s.m.angle,t,s.alpha);
 }else tile(g,body,s.frame,s.x,s.y,s.size,s.alpha,s.dir);
}
function castFx(g,s){
 if(s.p>=.13&&s.p<.32){const t=(s.p-.13)/.19;tile(g,fx,Math.min(2,Math.floor(t*3)),500,493,172,1-ease(t));}
 if(s.p>=.78&&s.p<.96){const t=(s.p-.78)/.18;tile(g,fx,Math.min(7,3+Math.floor(t*5)),s.m.x,s.m.y,135*s.m.scale,1-ease(t));}
}
function attached(g,u,time,scale=1){
 const m=mount(u,scale),frame=12+Math.floor((Number(time)||0)/170)%4;
 // The same mounted pose is mirrored for each team; the depth pass
 // lets the shoulder/robe cover the inner edge of the mine.
 sideMount(g,frame,m.x,m.y,m.size,-m.dir,m.angle);
}
function explode(g,u,ms,scale=1){
 const m=mount(u,scale);
 if(ms<240){
   // Persistent attached art remains visible during the electrical wind-up.
   const t=clamp(ms/240);
   tile(g,fx,Math.min(2,Math.floor(t*3)),m.x,m.y,100*m.scale,t*.9);
   return;
 }
 const t=clamp((ms-240)/720);
 tile(g,fx,3+Math.min(4,Math.floor(t*5)),m.x,m.y,(185+35*t)*m.scale,1-ease((t-.7)/.3));
}
function shake(ms){
 const t=ms-240;if(t<0||t>=160)return null;
 const a=(1-t/160)**1.5;return {x:Math.sin(t*.13)*8*a,y:Math.cos(t*.17)*5*a};
}
function portrait(g,w,h){tile(g,body,6,w/2,h/2,Math.min(w,h)*1.12);}
window.ThunderMine={ensure,ready,error:()=>err,registerPose,torsoEdge,legCenter,mount,scene,draw,castFx,attached,explode,shake,portrait};ensure();
})();
