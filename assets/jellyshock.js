/* Jellyshock: 48 illustrated jellyfish poses, 24 tentacle, 24 water
 * impact and 24 dissolve poses. Independent alpha atlases. */
(()=>{
"use strict";
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const body=new Image(),fx=new Image();
const valid=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>valid(body,1448,1086)&&valid(fx,1446,3252);
let pending=null;
function ensure(){
 if(ready())return Promise.resolve(true);if(pending)return pending;
 const load=(im,w,h,src)=>valid(im,w,h)?Promise.resolve(true):new Promise(resolve=>{im.onload=()=>resolve(valid(im,w,h));im.onerror=()=>resolve(false);im.src=src;});
 pending=Promise.all([load(body,1448,1086,"./assets/jellyshock-body.webp?v=0.354.93"),load(fx,1446,3252,"./assets/jellyshock-fx.webp?v=0.354.93")]).then(r=>{const ok=r.every(Boolean);if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;
}
const bounds=[[25,91,135,198],[16,84,154,203],[9,78,185,204],[8,75,218,203],[8,66,227,204],[7,52,233,206],[7,45,238,210],[3,38,238,210],[3,25,238,210],[3,22,238,224],[3,16,238,230],[3,7,238,243],[4,19,238,223],[3,30,238,217],[3,42,238,211],[3,53,227,206],[10,64,219,206],[12,72,199,204],[8,70,197,210],[10,75,178,204],[11,79,149,200],[11,81,134,200],[12,85,122,198],[13,92,110,190]];
const HIT=.62,START=.42,RETRACT=.78;
function scene(source,target,p,factor=1){
 p=C(p);const x=500,y=510,dir=target.x>=x?1:-1;
 const k=(.60+.30*C((target.y-288)/235))*Math.max(1,factor);
 const lift=70*E(p/.24),bob=Math.sin(p*4800/180)*3*E(p/.24);
 const size=220,top=y-size-lift+bob+28;
 const n=Math.min(47,Math.floor(p/.80*48));
 const root={x:x+dir*22,y:top+size*.43};
 const end={x:target.x,y:target.y-83*k};
 return {x,y,dir,p,k,size,top,n,root,end,target};
}
function tile(g,im,n,cols,cw,ch,x,y,w,h,alpha=1){
 if(alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(im,n%cols*cw,Math.floor(n/cols)*ch,cw,ch,x,y,w,h);g.restore();
}
function pool(g,s){
 if(!ready()||s.p>=.22)return;
 const q=C(s.p/.22),n=24+Math.min(5,Math.floor(q*6));
 tile(g,fx,n,6,241,271,s.x-95,s.y-38,190,65,Math.sin(Math.PI*q)*.68);
}
function actor(g,s){
 if(!ready())return;
 if(s.p<.80){
  const alpha=C(s.p/.10);
  tile(g,body,s.n,8,181,181,s.x-s.size/2,s.top,s.size,s.size,alpha);
 }else{
  const q=C((s.p-.80)/.20),n=48+Math.min(23,Math.floor(q*24)),w=222,h=251;
  tile(g,fx,n,6,241,271,s.x-w/2,s.top-15,w,h,C((1-s.p)/.04));
 }
}
function lashPath(s){
 if(s.p<START||s.p>=RETRACT)return null;
 const q=s.p<=HIT?C((s.p-START)/(HIT-START)):1-C((s.p-HIT)/(RETRACT-HIT));
 const n=s.p<=HIT?Math.min(11,Math.floor(q*12)):12+Math.min(11,Math.floor((s.p-HIT)/(RETRACT-HIT)*12));
 const reach=E(q),dx=s.end.x-s.root.x,dy=s.end.y-s.root.y,d=Math.hypot(dx,dy);
 return {n,from:s.root,to:{x:L(s.root.x,s.end.x,reach),y:L(s.root.y,s.end.y,reach)},length:d*reach,angle:Math.atan2(dy,dx),height:Math.min(128,36+76*reach),alpha:C(q*8)};
}
function lash(g,s){
 if(!ready())return;const r=lashPath(s);if(!r||r.length<1||r.alpha<=0)return;
 const [x0,y0,x1,y1]=bounds[r.n],w=x1-x0,h=y1-y0;
 g.save();g.globalAlpha*=r.alpha;g.translate(r.from.x,r.from.y);g.rotate(r.angle);if(s.dir<0)g.scale(1,-1);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(fx,r.n%6*241+x0,Math.floor(r.n/6)*271+y0,w,h,-3,-r.height*.52,r.length+3,r.height);
 g.restore();
}
function impact(g,s){
 if(!ready()||s.p<HIT||s.p>.94)return;
 const q=C((s.p-HIT)/.32),n=24+Math.min(23,Math.floor(q*24)),w=205*s.k,h=230*s.k;
 tile(g,fx,n,6,241,271,s.end.x-w/2,s.end.y-h*.52,w,h,C((.94-s.p)/.06));
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w,h)*.96;tile(g,body,20,8,181,181,(w-k)/2,h-k,k,k);}
window.Jellyshock={ensure,ready,scene,lashPath,actor,pool,lash,impact,portrait,hit:HIT,frameCount:48,effectFrameCount:72};ensure();
})();