/* Hydro Serpent v2: 32 illustrated body frames, 16 pool, 16 impact. */
(()=>{
'use strict';
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const HIT=.67,LAUNCH=.56,EXIT=.84,W=240,H=144,S=1.5;
const body=new Image(),poolImage=new Image(),impactImage=new Image();
const assets=[[body,576,'body'],[poolImage,288,'pool'],[impactImage,288,'impact']];
const valid=(im,h)=>im.complete&&im.naturalWidth===1920&&im.naturalHeight===h;
const ready=()=>assets.every(([im,h])=>valid(im,h));
let pending=null;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=Promise.all(assets.map(([im,h,name])=>valid(im,h)?Promise.resolve(true):new Promise(resolve=>{im.onload=()=>resolve(valid(im,h));im.onerror=()=>resolve(false);im.src='./assets/hydro-serpent-v2-'+name+'.webp?v=0.354.95';}))).then(v=>v.every(Boolean)).finally(()=>pending=null);return pending;}
function scene(source,target,p,factor=1,blocked=false){p=C(p);const x=500,y=510,dir=target.x>=x?1:-1,k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor),end={x:target.x,y:target.y-83*k},start={x:x+dir*(218-120)*S,y:y+(55-136)*S};const distance=Math.hypot(end.x-start.x,end.y-start.y);const q=p<=HIT?E((p-LAUNCH)/(HIT-LAUNCH)):1+E((p-HIT)/(EXIT-HIT))*((200+35)/Math.max(1,distance));const travelQ=blocked?Math.min(1,q):q;const head={x:L(start.x,end.x,travelQ),y:L(start.y,end.y,travelQ)};return{x,y,dir,p,k,end,start,head,blocked};}
function tile(g,im,n,x,y,w,h,alpha=1,dir=1){if(alpha<=0)return;g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';if(dir<0){g.translate(x+w,y);g.scale(-1,1);x=0;y=0;}g.drawImage(im,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);g.restore();}
function pool(g,s){if(!ready()||s.p>=.69)return;const n=s.p<.23?Math.min(9,Math.floor(s.p/.23*10)):s.p<LAUNCH?8+Math.floor((s.p-.23)*24)%4:12+Math.min(3,Math.floor((s.p-LAUNCH)/(.69-LAUNCH)*4));const scale=1.05;tile(g,poolImage,n,s.x-W*scale/2,s.y-136*scale,W*scale,H*scale,C(s.p/.025)*C((.69-s.p)/.06));}
function actor(g,s){if(!ready()||s.p<.06||s.p>=LAUNCH)return;const n=Math.min(19,Math.floor((s.p-.06)/(LAUNCH-.06)*20));tile(g,body,n,s.x-W*S/2,s.y-136*S,W*S,H*S,C((s.p-.06)/.025),s.dir);}
const anchors=[[222,51],[224,53],[223,52],[215,46],[225,60],[218,63],[211,66],[203,81]];
function travel(g,s){if(!ready()||s.p<LAUNCH||s.p>=.94)return;if(s.p>=EXIT){if(s.blocked)return;const n=28+Math.min(3,Math.floor((s.p-EXIT)/(.94-EXIT)*4));tile(g,body,n,s.head.x-W*S/2,s.head.y-100*S,W*S,H*S,C((.94-s.p)/.04),s.dir);return;}const n=s.p<HIT?Math.min(4,Math.floor((s.p-LAUNCH)/(HIT-LAUNCH)*5)):5+Math.min(2,Math.floor((s.p-HIT)/(EXIT-HIT)*3));const [ax,ay]=anchors[n],scale=S;const opacity=s.blocked?C((HIT+.065-s.p)/.065):1;const x=s.head.x-(s.dir>0?ax:W-ax)*scale,y=s.head.y-ay*scale;tile(g,body,20+n,x,y,W*scale,H*scale,opacity,s.dir);}
function impact(g,s){if(!ready()||s.blocked||s.p<HIT||s.p>=.99)return;const n=Math.min(15,Math.floor((s.p-HIT)/(.99-HIT)*16)),scale=1.25*s.k;tile(g,impactImage,n,s.end.x-W*scale/2,s.end.y-105*scale,W*scale,H*scale,C((.99-s.p)/.035),s.dir);}
function portrait(g,w,h){if(!ready())return;const scale=Math.min(w/W,h/110)*1.13;tile(g,body,10,(w-W*scale)/2,h-136*scale,W*scale,H*scale);}
const art={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:64,bodyFrameCount:32,effectFrameCount:32};
ensure().then(ok=>{if(ok){window.HydroSerpent=art;window.WIZARDRY_ARENA_TEST?.drawCardArts?.();}});
})();
