/* Hydro Serpent — 64 newly illustrated transparent low-poly poses + 48 separate FX frames. */
(()=>{
"use strict";
const W=320,H=256,S=1.04,HIT=.67,LAUNCH=.46,EXIT=.84,END=.96;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const anchors=[[193.2,174.7],[194.7,172.3],[198.1,165.9],[202.1,156.6],[206.1,145.8],[209.9,134.9],[213.1,125.7],[215.5,119.8],[217.1,117.8],[218.8,114.3],[220.7,108.3],[222.6,100.6],[224.3,91.6],[225.7,82.2],[226.8,73],[227.5,64.8],[227.8,58.5],[228,54.7],[228,54],[228.3,53.9],[228.9,53.9],[229.6,53.8],[230.4,53.7],[231.2,53.6],[232,53.5],[232.7,53.4],[233.1,53.4],[233.3,53.4],[233.5,55],[234,59.8],[234.8,66.9],[235.7,75.5],[236.7,84.6],[237.6,93.3],[238.4,100.6],[238.9,105.5],[239,107.2],[241.1,107.7],[246,108.9],[252.7,110.6],[260.3,112.4],[268,114.1],[274.7,115.5],[279.5,116.5],[281.6,116.9],[281.9,117.1],[282.7,117.5],[284,118.2],[285.4,118.9],[286.8,119.7],[288,120.3],[288.7,120.7],[288.9,120.7],[288.4,120.6],[286.8,120.5],[284.4,120.5],[281.2,120.7],[277.7,121],[274.1,121.6],[270.6,122.3],[267.4,123.1],[264.9,123.8],[263.2,124.4],[262.6,124.6]];
const body=new Image(),poolImage=new Image(),impactImage=new Image();
const assets=[[body,2048,"body"],[poolImage,768,"pool"],[impactImage,768,"impact"]];
const valid=(im,h)=>im.complete&&im.naturalWidth===2560&&im.naturalHeight===h;
const ready=()=>assets.every(([im,h])=>valid(im,h));
let pending=null;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=Promise.all(assets.map(([im,h,name])=>valid(im,h)?Promise.resolve(true):new Promise(resolve=>{im.onload=()=>resolve(valid(im,h));im.onerror=()=>resolve(false);im.src="./assets/hydro-serpent-v3-"+name+".svg?v=0.354.97";}))).then(v=>{const ok=v.every(Boolean);if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function frameAt(p){return p<LAUNCH?29*C(p/LAUNCH):p<=HIT?29+17*C((p-LAUNCH)/(HIT-LAUNCH)):46+17*C((p-HIT)/(END-HIT));}
function aAt(f){const i=Math.floor(f),j=Math.min(63,i+1),q=f-i;return [L(anchors[i][0],anchors[j][0],q),L(anchors[i][1],anchors[j][1],q)];}
function scene(source,target,p,factor=1,blocked=false){p=C(p);const x=500,y=510,dir=target.x>=x?1:-1,k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor),end={x:target.x,y:target.y-83*k};const [ax,ay]=anchors[29],start={x:x+dir*(ax-160)*S,y:y+(ay-226)*S};const d=Math.hypot(end.x-start.x,end.y-start.y),q=p<=HIT?E((p-LAUNCH)/(HIT-LAUNCH)):1+E((p-HIT)/(EXIT-HIT))*Math.min(.65,100/Math.max(1,d)),travelQ=blocked?Math.min(1,q):q;const pose=frameAt(p),[px,py]=aAt(pose),head=p<LAUNCH?{x:x+dir*(px-160)*S,y:y+(py-226)*S}:{x:L(start.x,end.x,travelQ),y:L(start.y,end.y,travelQ)};return{x,y,dir,p,k,end,start,head,pose,blocked};}
function tile(g,im,n,x,y,w,h,alpha=1,dir=1){if(alpha<=0)return;g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";if(dir<0){g.translate(x+w,y);g.scale(-1,1);x=0;y=0;}g.drawImage(im,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);g.restore();}
function pool(g,s){if(!ready()||s.p>=.70)return;const n=Math.min(23,Math.floor(s.p/.70*24)),scale=1.02;tile(g,poolImage,n,s.x-W*scale/2,s.y-207*scale,W*scale,H*scale,C(s.p/.025)*C((.70-s.p)/.08));}
function actor(){}
function travel(g,s){if(!ready()||s.p>=END)return;const n=Math.min(63,Math.round(s.pose)),[ax,ay]=anchors[n];const opacity=C(s.p/.025)*(s.blocked?C((HIT+.12-s.p)/.12):C((END-s.p)/.035));tile(g,body,n,s.head.x-(s.dir>0?ax:W-ax)*S,s.head.y-ay*S,W*S,H*S,opacity,s.dir);}
function impact(g,s){if(!ready()||s.blocked||s.p<HIT||s.p>=.99)return;const n=Math.min(23,Math.floor((s.p-HIT)/(.99-HIT)*24)),scale=1.10*s.k;tile(g,impactImage,n,s.end.x-W*scale/2,s.end.y-170*scale,W*scale,H*scale,C((.99-s.p)/.035),s.dir);}
function portrait(g,w,h){if(!ready())return;const scale=Math.min(w/210,h/190)*1.06;tile(g,body,22,w/2-160*scale,h-226*scale,W*scale,H*scale);}
window.HydroSerpent={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:112,bodyFrameCount:64,effectFrameCount:48};ensure();
})();