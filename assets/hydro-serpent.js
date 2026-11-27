/* Hydro Serpent — 40 original illustrated, alpha-cleaned frames. One track:
   whirlpool, emergence, roar, head-first dive, then trailing body and water
   fragments disappearing at the contact point. No procedural stand-in art. */
(()=>{
"use strict";
const W=224,H=224,GROUND=211,CENTER=112,LAUNCH=.47,HIT=.67,END=.97;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const anchors=[[112,191],[112,190],[112,187],[112,180],[112,172],[112,159],[181,112],[185,93],[181,111],[181,110],[183,109],[184,110],[183,110],[182,109],[183,109],[178,79],[173,138],[175,66],[177,56],[178,57],[180,52],[181,50],[186,65],[206,125],[201,137],[208,130],[209,135],[208,139],[214,149],[214,158],[210,164],[207,167],[205,183],[207,180],[205,191],[200,190],[201,196],[194,197],[173,198],[158,193]];
const sheet=new Image();
const ready=()=>sheet.complete&&sheet.naturalWidth===1792&&sheet.naturalHeight===1120;
let pending=null;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{sheet.onload=()=>{const ok=ready();if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();resolve(ok);};sheet.onerror=()=>resolve(false);sheet.src="./assets/hydro-serpent-v4.webp?v=0.354.98";}).finally(()=>pending=null);return pending;}
function frameAt(p,blocked){
 if(p<=.30)return Math.min(15,Math.floor(16*p/.30));
 if(p<LAUNCH)return Math.min(22,16+Math.floor(7*(p-.30)/(LAUNCH-.30)));
 if(p<=HIT)return Math.min(29,22+Math.floor(8*(p-LAUNCH)/(HIT-LAUNCH)));
 // The first post-hit frame has no face; the illustrated fragments follow.
 if(blocked)return Math.min(31,30+Math.floor((p-HIT)/.045));
 return Math.min(39,30+Math.floor(10*(p-HIT)/(END-HIT)));
}
function scene(source,target,p,factor=1,blocked=false){
 p=C(p);const x=500,y=510,dir=target.x>=x?1:-1,k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor);
 const scale=Math.min(1.35,Math.max(.85,(Math.abs(target.x-x)-10)/74));
 const end={x:target.x,y:target.y-83*k},[sx,sy]=anchors[22],start={x:x+dir*(sx-CENTER)*scale,y:y+(sy-GROUND)*scale};
 const n=frameAt(p,blocked),[ax,ay]=anchors[n];let head,angle=0;
 const dx=(end.x-start.x)*dir,dy=end.y-start.y,aim=Math.max(-.5,Math.min(.38,Math.atan2(dy,Math.max(24,dx))-.20));
 if(p<LAUNCH){head={x:x+dir*(ax-CENTER)*scale,y:y+(ay-GROUND)*scale};}
 else if(p<=HIT){const u=C((p-LAUNCH)/(HIT-LAUNCH)),q=u*u*(2-u),lift=Math.sin(Math.PI*q)*Math.min(25,Math.hypot(dx,dy)*.09);head={x:L(start.x,end.x,q),y:L(start.y,end.y,q)-lift};angle=aim*E(u/.8);}
 else{head={...end};angle=aim*(1-E((p-HIT)/.11));}
 const alpha=p<LAUNCH?C(p/.018):blocked?C((HIT+.10-p)/.10):C((END-p)/.045);
 return{x,y,dir,p,k,end,start,head,n,angle,scale,alpha,blocked};
}
function tile(g,n,ax,ay,x,y,scale,dir=1,angle=0,alpha=1){
 if(!ready()||alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.translate(x,y);g.scale(dir,1);g.rotate(angle);
 g.drawImage(sheet,n%8*W,Math.floor(n/8)*H,W,H,-ax*scale,-ay*scale,W*scale,H*scale);g.restore();
}
// All water, roar, dive, and splash are in the same original art sequence.
// Keep the arena's compatibility hooks but never spawn an overlapping FX sprite.
function pool(){}
function actor(){}
function travel(g,s){if(s.p>=END||s.alpha<=0)return;const [ax,ay]=anchors[s.n];tile(g,s.n,ax,ay,s.head.x,s.head.y,s.scale,s.dir,s.angle,s.alpha);}
function impact(){}
function portrait(g,w,h){const scale=Math.min(w/174,h/183)*1.04;tile(g,13,CENTER,GROUND,w/2,h-2,scale);}
window.HydroSerpent={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:40,bodyFrameCount:40,effectFrameCount:0};ensure();
})();
