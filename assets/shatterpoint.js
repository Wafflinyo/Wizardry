/* Shatterpoint: new isolated illustrated hammer + separately authored ice.
 * Each padded cell is sampled independently; feather cropped FX edges once.
 * The hammer rises from the floor, winds up, then swings once onto the head. */
(()=>{
"use strict";
const W=224,H=224,body=new Image(),fx=new Image(),C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,E=x=>{x=C(x);return x*x*(3-2*x);};
let pending=null,softFX=null;
const loaded=(im,rows)=>im.complete&&im.naturalWidth===1792&&im.naturalHeight===rows*H;
const ready=()=>loaded(body,4)&&loaded(fx,5);
function load(im,path,rows){if(loaded(im,rows))return Promise.resolve(true);return new Promise(resolve=>{im.onload=()=>resolve(loaded(im,rows));im.onerror=()=>resolve(false);im.src=path;});}
function featherFX(){
 if(softFX)return softFX;
 if(typeof document==="undefined"||!loaded(fx,5))return fx;
 const out=document.createElement("canvas"),cell=document.createElement("canvas");out.width=1792;out.height=1120;cell.width=W;cell.height=H;
 const dst=out.getContext("2d"),g=cell.getContext("2d");
 if(!dst||!g)return fx;
 for(let n=0;n<40;n++){
  const x=n%8*W,y=Math.floor(n/8)*H;
  g.clearRect(0,0,W,H);g.globalCompositeOperation="source-over";g.drawImage(fx,x,y,W,H,0,0,W,H);
  g.globalCompositeOperation="destination-in";
  const side=g.createLinearGradient(0,0,W,0);side.addColorStop(0,"transparent");side.addColorStop(.06,"transparent");side.addColorStop(.16,"black");side.addColorStop(.84,"black");side.addColorStop(.94,"transparent");side.addColorStop(1,"transparent");g.fillStyle=side;g.fillRect(0,0,W,H);
  const vertical=g.createLinearGradient(0,0,0,H);vertical.addColorStop(0,"transparent");vertical.addColorStop(.12,"black");vertical.addColorStop(.84,"black");vertical.addColorStop(.95,"transparent");vertical.addColorStop(1,"transparent");g.fillStyle=vertical;g.fillRect(0,0,W,H);
  g.globalCompositeOperation="source-over";dst.drawImage(cell,x,y);
 }
 softFX=out;return out;
}
function ensure(){if(ready()){featherFX();return Promise.resolve(true);}if(pending)return pending;
 pending=Promise.all([load(body,"./assets/shatterpoint-hammer-v33.webp?v=0.355.33",4),load(fx,"./assets/shatterpoint-impact-v33.webp?v=0.355.33",5)]).then(v=>{const ok=v.every(Boolean);if(ok){featherFX();window.WIZARDRY_ARENA_TEST?.drawCardArts?.();}return ok;}).finally(()=>pending=null);return pending;
}
function tile(g,im,n,x,y,w,h){g.drawImage(im,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function scene(source,target,p,hit=.64,factor=1){
 p=C(p);const dir=source.team===0?1:-1,k=Math.max(.85,Math.min(2,factor)),q=C((p-hit)/(1-hit));
 const liftEnd=hit*.52,windEnd=hit*.79;
 const rise=E(p/liftEnd),wind=E((p-liftEnd)/(windEnd-liftEnd)),swing=C((p-windEnd)/(hit-windEnd)),drop=swing*swing;
 const floorX=target.x-dir*112*k,floorY=target.y+8*k;
 const highX=target.x-dir*32*k,highY=target.y-245*k;
 const windX=highX-dir*45*k,windY=highY-20*k;
 const headX=target.x,headY=target.y-118*k;
 const x=p<liftEnd?L(floorX,highX,rise):p<windEnd?L(highX,windX,wind):L(windX,headX,drop);
 // Head pivot sits above the handle. Keep the handle at floor level
 // at summon, and the lower striking face at head height on contact.
 const y=p<liftEnd?L(floorY-136*k,highY,rise):p<windEnd?L(highY,windY,wind):L(windY,headY-34*k,drop);
 const frame=p<liftEnd?Math.min(13,Math.floor(p/liftEnd*14)):p<windEnd?14+Math.min(9,Math.floor((p-liftEnd)/(windEnd-liftEnd)*10)):24+Math.min(7,Math.floor(swing*8));
 return{p,hit,q,frame,effectFrame:Math.min(31,Math.floor(q*32)),dir,k,x,y,floorX,floorY,headX,headY,rise,liftEnd,windEnd,targetX:target.x,targetY:target.y};
}
function actor(g,s){
 if(!ready()||s.p>=s.hit)return;
 const k=s.k*1.60;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=E(s.p/.075);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,body,s.frame,-112*k,-112*k,W*k,H*k);g.restore();
}
function summon(g,s){
 if(!ready()||s.p>=s.liftEnd)return;
 const u=C(s.p/s.liftEnd),n=32+Math.min(7,Math.floor(u*8)),k=s.k*1.26;
 g.save();g.translate(s.floorX,s.floorY);g.scale(s.dir,1);g.globalAlpha*=E(u/.13)*(1-E((u-.55)/.45));
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,featherFX(),n,-112*k,-207*k,W*k,H*k);g.restore();
}
function impact(g,s){
 if(!ready()||s.p<s.hit||s.p>=1)return;
 const n=s.effectFrame,k=s.k*1.68,settle=E((s.q-.20)/.80);
 g.save();g.translate(s.headX,L(s.headY,s.targetY+8*s.k,settle));g.scale(s.dir,1);
 g.globalAlpha*=1-E((s.q-.76)/.24);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,featherFX(),n,-112*k,-200*k,W*k,H*k);g.restore();
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/144,h/154);tile(g,18,w/2-112*k,h/2-144*k,W*k,H*k);}
window.Shatterpoint={ensure,ready,scene,actor,summon,impact,portrait,frameCount:32,effectFrameCount:32,hit:.64};ensure();
})();
