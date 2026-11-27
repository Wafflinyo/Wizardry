/* Hydro Serpent: original illustrated transparent sprite sheets, 23 body,
 * 9 whirlpool, 9 impact poses. World movement follows the selected target. */
(()=>{
"use strict";
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const HIT=.67,LAUNCH=.56,EXIT=.84;
const body=new Image(),poolImage=new Image(),impactImage=new Image();
const assets=[[body,1344,896,"body"],[poolImage,1000,400,"pool"],[impactImage,1200,480,"impact"]];
const valid=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>assets.every(([im,w,h])=>valid(im,w,h));
let pending=null;
function ensure(){
 if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=Promise.all(assets.map(([im,w,h,name])=>valid(im,w,h)?Promise.resolve(true):new Promise(resolve=>{
  im.onload=()=>resolve(valid(im,w,h));im.onerror=()=>resolve(false);im.src="./assets/hydro-serpent-"+name+".webp?v=0.354.94";
 }))).then(values=>{const ok=values.every(Boolean);if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;
}
function scene(source,target,p,factor=1,blocked=false){
 p=C(p);const x=500,y=510,dir=target.x>=x?1:-1;
 const k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor);
 const end={x:target.x,y:target.y-83*k};
 const start={x:x+dir*63,y:y-156};
 const theta=Math.atan2(end.y-start.y,Math.max(1,Math.abs(end.x-start.x)));
 const distance=Math.hypot(end.x-start.x,end.y-start.y);
 const length=Math.min(320,Math.max(210,distance+66));
 const q=p<=HIT?E((p-LAUNCH)/(HIT-LAUNCH)):1+E((p-HIT)/(EXIT-HIT))*((length+35)/Math.max(1,distance));
 const travelQ=blocked?Math.min(1,q):q;
 const head={x:L(start.x,end.x,travelQ),y:L(start.y,end.y,travelQ)};
 return {x,y,dir,p,k,end,start,theta,length,head,blocked};
}
function tile(g,im,n,cols,cw,ch,x,y,w,h,alpha=1,dir=1){
 if(alpha<=0)return;g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 if(dir<0){g.translate(x+w,y);g.scale(-1,1);x=0;y=0;}
 g.drawImage(im,n%cols*cw,Math.floor(n/cols)*ch,cw,ch,x,y,w,h);g.restore();
}
function pool(g,s){
 if(!ready()||s.p>.69)return;
 const n=s.p<.18?Math.min(8,Math.floor(s.p/.18*9)):5+Math.floor((s.p-.18)*27)%4;
 const w=245,h=124,alpha=C(s.p/.035)*C((.69-s.p)/.17);
 tile(g,poolImage,n,5,200,200,s.x-w/2,s.y-h*.50,w,h,alpha);
}
function actor(g,s){
 if(!ready()||s.p<.12||s.p>=.59)return;
 const n=s.p<.31?Math.min(7,Math.floor((s.p-.12)/.19*8)):s.p<.45?8+Math.min(7,Math.floor((s.p-.31)/.14*8)):16+Math.min(5,Math.floor((s.p-.45)/.14*6));
 const size=292,alpha=C((s.p-.12)/.03)*C((.59-s.p)/.035);
 tile(g,body,n,6,224,224,s.x-size/2,s.y-size+10,size,size,alpha,s.dir);
}
function travel(g,s){
 if(!ready()||s.p<LAUNCH||s.p>=EXIT)return;
 const alpha=C((s.p-LAUNCH)/.025)*(s.blocked?C((HIT+.07-s.p)/.07):C((EXIT-s.p)/.025));
 if(alpha<=0)return;
 const w=s.length,h=w*.34;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.translate(s.head.x,s.head.y);g.rotate(s.theta*s.dir);g.scale(s.dir,1);
 // The full-length profile is the independently illustrated final body cell.
 g.drawImage(body,4*224,3*224+72,224,80,-w*.98,-h*.52,w,h);
 g.restore();
}
function impact(g,s){
 if(!ready()||s.blocked||s.p<HIT||s.p>=.99)return;
 const n=Math.min(8,Math.floor((s.p-HIT)/(.99-HIT)*9)),w=210*s.k,h=240*s.k;
 tile(g,impactImage,n,5,240,240,s.end.x-w/2,s.end.y-h*.50,w,h,C((.99-s.p)/.07),s.dir);
}
function portrait(g,w,h){if(!ready())return;const size=Math.min(w,h)*1.22;tile(g,body,12,6,224,224,(w-size)/2,h-size+2,size,size,1,1);}
window.HydroSerpent={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:41,bodyFrameCount:23,effectFrameCount:18};ensure();
})();