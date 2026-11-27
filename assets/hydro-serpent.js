/* Hydro Serpent: continuous illustrated body track, using the installed assets. */
(function install(window,Image){
"use strict";
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const HIT=.67,LAUNCH=.47,EXIT=.84,S=1.30;
const body=new Image(),poolImage=new Image(),impactImage=new Image();
const assets=[[body,1344,896,"body"],[poolImage,1000,400,"pool"],[impactImage,1200,480,"impact"]];
const valid=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>assets.every(([im,w,h])=>valid(im,w,h));
let pending=null;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=Promise.all(assets.map(([im,w,h,name])=>valid(im,w,h)?Promise.resolve(true):new Promise(resolve=>{im.onload=()=>resolve(valid(im,w,h));im.onerror=()=>resolve(false);im.src="./assets/hydro-serpent-"+name+".webp?v=0.354.96";}))).then(v=>{const ok=v.every(Boolean);if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
// Hand-marked snout positions in the original continuous illustrated poses.
// No isolated horizontal serpent, no scale or pivot switch at launch.
const anchors=[[112,205],[112,205],[153,154],[165,121],[176,96],[178,83],[169,76],[163,68],[155,115],[162,111],[167,110],[179,113],[178,111],[178,106],[176,103],[178,112],[181,149],[193,150],[176,154],[181,151],[194,153],[181,155]];
function anchor(i){const n=Math.min(21,Math.max(0,i)),lo=Math.floor(n),hi=Math.min(21,lo+1),f=n-lo;return [L(anchors[lo][0],anchors[hi][0],f),L(anchors[lo][1],anchors[hi][1],f)];}
function scene(source,target,p,factor=1,blocked=false){
p=C(p);const x=500,y=510,dir=target.x>=x?1:-1,k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor),end={x:target.x,y:target.y-83*k};
const [ax,ay]=anchors[15],start={x:x+dir*(ax-112)*S,y:y+(ay-216)*S};
const d=Math.hypot(end.x-start.x,end.y-start.y),q=p<=HIT?E((p-LAUNCH)/(HIT-LAUNCH)):1+E((p-HIT)/(EXIT-HIT))*Math.min(.65,100/Math.max(1,d)),travelQ=blocked?Math.min(1,q):q;
const pose=p<LAUNCH?15*C((p-.035)/(LAUNCH-.035)):15+6*E((p-LAUNCH)/(HIT-LAUNCH));
const [px,py]=anchor(pose);
const head=p<LAUNCH?{x:x+dir*(px-112)*S,y:y+(py-216)*S}:{x:L(start.x,end.x,travelQ),y:L(start.y,end.y,travelQ)};
return {x,y,dir,p,k,end,start,head,pose,blocked};
}
function tile(g,im,n,cols,cw,ch,x,y,w,h,alpha=1,dir=1){if(alpha<=0)return;g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";if(dir<0){g.translate(x+w,y);g.scale(-1,1);x=0;y=0;}g.drawImage(im,n%cols*cw,Math.floor(n/cols)*ch,cw,ch,x,y,w,h);g.restore();}
// A single body track, with adjacent illustrated frames aligned at the same
// interpolated head position. The same scale is used before and after launch.
function drawBody(g,s){
if(!ready()||s.p<.035||s.p>=EXIT)return;
const fade=s.blocked?C((HIT+.075-s.p)/.075):C((EXIT-s.p)/.13);
const alpha=C((s.p-.035)/.025)*fade;
const n=Math.floor(s.pose),next=Math.min(21,n+1),f=s.pose-n;
const dissolve=s.blocked?C((s.p-HIT)/.075):C((s.p-HIT)/(EXIT-HIT)),scale=S*(1-.22*E(dissolve));
function draw(i,a){const [ax,ay]=anchors[i];const x=s.head.x-(s.dir>0?ax:224-ax)*scale,y=s.head.y-ay*scale;tile(g,body,i,6,224,224,x,y,224*scale,224*scale,a,s.dir);}
if(n===next||f<.10){draw(n,alpha);return;}
if(f>.90){draw(next,alpha);return;}
// Only a short blend between poses; no overlapping summon and travel objects.
const blend=E((f-.10)/.80);
draw(n,alpha*(1-blend));draw(next,alpha*blend);
}
function pool(g,s){if(!ready()||s.p>.64)return;const p=s.p;const n=p<.23?Math.min(8,Math.floor(p/.23*9)):p<LAUNCH?8:Math.max(0,8-Math.floor((p-LAUNCH)/(.64-LAUNCH)*9));const w=224,h=112;tile(g,poolImage,n,5,200,200,s.x-w/2,s.y-h*.52,w,h,C(p/.025)*C((.64-p)/.12));}
// The arena's travel layer renders the entire serpent, including its summon.
function actor(){}
function travel(g,s){drawBody(g,s);}
function impact(g,s){if(!ready()||s.blocked||s.p<HIT||s.p>=.99)return;const n=Math.min(8,Math.floor((s.p-HIT)/(.99-HIT)*9)),w=190*s.k,h=210*s.k;tile(g,impactImage,n,5,240,240,s.end.x-w/2,s.end.y-h*.62,w,h,C((.99-s.p)/.06),s.dir);}
function portrait(g,w,h){if(!ready())return;const size=Math.min(w,h)*1.22;tile(g,body,12,6,224,224,(w-size)/2,h-size+2,size,size,1,1);}
window.HydroSerpent={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:40,bodyFrameCount:22,effectFrameCount:18};ensure();
})(window,Image);
