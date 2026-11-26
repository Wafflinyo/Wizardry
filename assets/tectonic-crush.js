/* Tectonic Crush: exact generated low-poly raster artwork.
   32 isolated rock sprites (16 matched left/right pairs) plus 16
   independent impact/dust frames. Native source resolution, alpha WebP.
   No baked arena or target, no procedural rock substitute. */
(()=>{
"use strict";
const COUNT=48,HIT=28/48,RW=156,RH=310,FW=310,FH=310;
const rock=new Image(),impactArt=new Image();
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,t)=>a+(b-a)*t,E=p=>{p=C(p);return p*p*(3-2*p);};
const good=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>good(rock,1248,1240)&&good(impactArt,1240,1240);
let pending=null,lastError="";
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 const load=(im,w,h,path)=>good(im,w,h)?Promise.resolve(true):new Promise(resolve=>{
  im.onload=()=>resolve(good(im,w,h));im.onerror=()=>resolve(false);im.src=path;
 });
 pending=Promise.all([
  load(rock,1248,1240,"./assets/tectonic-rocks.webp?v=0.354.78"),
  load(impactArt,1240,1240,"./assets/tectonic-impact.webp?v=0.354.78")
 ]).then(ok=>{const pass=ok.every(Boolean);lastError=pass?"":"Tectonic Crush sprite atlas failed to load";if(pass)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return pass;}).finally(()=>pending=null);
 return pending;
}
// Individually measured lower edges preserve a fixed footing as source
// sprites grow and break apart, rather than normalizing each pose's height.
const bases=[298,298,298,298,298,298,298,298,300,300,300,300,258,261,262,264];
const fxBases=[256,259,262,265,267,266,264,264,266,266,265,265,263,263,263,264];
function frameAt(p){return Math.max(0,Math.min(COUNT-1,Math.floor(C(p)*COUNT+1e-8)));}
function poseAt(n){
 const frame=Math.max(0,Math.min(47,n|0));
 let pair,offset,opacity=1;
 if(frame<18){pair=Math.min(8,Math.floor(frame/2));offset=96;}
 else if(frame<23){pair=8;offset=L(96,108,E((frame-18)/4));}
 else if(frame<29){pair=9+Math.min(2,Math.floor((frame-23)/2));offset=L(108,49,E((frame-23)/5));}
 else if(frame<33){pair=11;offset=49;}
 else if(frame<43){pair=15-Math.min(3,Math.floor((frame-33)/2.5));offset=L(55,77,E((frame-33)/9));opacity=1-E((frame-38)/5);}
 else{pair=12;offset=77;opacity=0;}
 const fx=frame<28?-1:Math.min(15,Math.floor((frame-28)*16/20));
 return {frame,pair,offset,opacity,fx,hit:frame===28,crack:frame<12?Math.min(1,frame/4)*(1-E((frame-7)/5)):0};
}
function scene(target,p,factor=1){
 const f=frameAt(p),pose=poseAt(f);
 const depth=.60+.30*C((target.y-288)/235),k=depth*Math.max(1,factor)*1.13;
 return {x:target.x,y:target.y,k,team:target.team,frame:f,pose,p:C(p),contactX:target.x,contactY:target.y-82*k,
  leftX:target.x-pose.offset*k,rightX:target.x+pose.offset*k};
}
function stoneTile(g,pair,side,x,y,k,alpha){
 if(!ready()||alpha<=0)return;
 const n=pair*2+side;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(rock,(n%8)*RW,Math.floor(n/8)*RH,RW,RH,x-RW*k/2,y-bases[pair]*k,RW*k,RH*k);
 g.restore();
}
function fxTile(g,n,x,y,k,alpha){
 if(!ready()||n<0||alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(impactArt,(n%4)*FW,Math.floor(n/4)*FH,FW,FH,x-FW*k/2,y-fxBases[n]*k,FW*k,FH*k);g.restore();
}
function draw(g,s,layer){
 // Facing the enemy team determines which independent formation is near.
 // The back rock sits just behind the unit; the opposite face closes in front.
 const side=layer==="back"?(s.team===0?0:1):(s.team===0?1:0);
 stoneTile(g,s.pose.pair,side,side===0?s.leftX:s.rightX,s.y+(layer==="back"?-9:8)*s.k,s.k,s.pose.opacity);
}
function fissure(g,s){if(s.pose.crack>0)fxTile(g,0,s.x,s.y+1,s.k*.92,s.pose.crack*.8);}
function impact(g,s){if(s.pose.fx>=0)fxTile(g,s.pose.fx,s.x,s.y-28*s.k,s.k*1.09,1);}
function shake(p){
 const hitAge=(p-HIT)*4320;
 const rise=Math.sin(Math.PI*C(p/(18/48)))*2.8;
 const crash=hitAge>=0?13*Math.exp(-hitAge/225):0;
 return {x:Math.sin(p*260)*(rise+crash),y:Math.cos(p*235)*(rise*.5+crash*.70)};
}
function portrait(g,w,h){
 if(!ready())return;
 const k=Math.min(w/244,h/270),x=w/2,y=h*.96;
 stoneTile(g,10,0,x-51*k,y-5*k,k,1);
 stoneTile(g,10,1,x+51*k,y+2*k,k,1);
 fxTile(g,2,x,y-12*k,k*.72,.82);
}
window.TectonicCrush={frameCount:COUNT,rockFrameCount:32,impactFrameCount:16,hit:HIT,ensure,ready,error:()=>lastError,frameAt,poseAt,scene,draw,fissure,impact,shake,portrait};ensure();
})();