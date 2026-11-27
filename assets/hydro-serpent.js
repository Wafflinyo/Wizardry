/* Hydro Serpent: stationary illustrated summon and roar, charged water
   projectile, then a sharp water-pellet shower across the opposing team.
   All artwork is reused from the existing transparent raster assets. */
(()=>{
"use strict";
const W=224,H=256,ROOT={x:500,y:510},K=1.55,CHARGE=.27,FIRE=.46,BURST=.59,HIT=.72,END=.995;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const body=new Image(),water=new Image();let pending=null,cleanWater=null;
const ok=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
function clean(){
 if(cleanWater)return true;
 if(typeof document==="undefined")return false;
 try{
  const c=document.createElement("canvas");c.width=768;c.height=768;
  const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(water,0,0);
  const px=ctx.getImageData(0,0,768,768),d=px.data;
  for(let y=0;y<768;y++)for(let x=0;x<768;x++){
   const i=(y*768+x)*4,r=d[i],g=d[i+1],b=d[i+2],hi=Math.max(r,g,b),lo=Math.min(r,g,b);
   const margin=Math.min(x%192,y%192,191-x%192,191-y%192);
   if((hi-lo<12&&hi<220)||(b-r<7&&hi<185))d[i+3]=0;
   else d[i+3]=Math.round(d[i+3]*C(margin/5));
  }
  ctx.putImageData(px,0,0);cleanWater=c;return true;
 }catch(e){return false;}
}
const ready=()=>ok(body,1792,2048)&&ok(water,768,768);
function ensure(){
 if(ready()){clean();return Promise.resolve(true);}
 if(pending)return pending;
 const load=(im,w,h,path)=>ok(im,w,h)?Promise.resolve(true):new Promise(resolve=>{im.onload=()=>resolve(ok(im,w,h));im.onerror=()=>resolve(false);im.src=path;});
 pending=Promise.all([load(body,1792,2048,"./assets/hydro-serpent-v7.webp?v=0.355.5"),load(water,768,768,"./assets/water-blast-frames.webp?v=0.355.5")]).then(v=>{const good=v.every(Boolean);if(good){clean();window.WIZARDRY_ARENA_TEST?.drawCardArts?.();}return good;}).finally(()=>pending=null);
 return pending;
}
function shotAt(p,count){
 const start=.24,end=.55,span=(end-start)/Math.max(1,count);
 if(p<start||p>=end)return null;
 const i=Math.min(count-1,Math.floor((p-start)/span));
 return {i,q:C((p-start-i*span)/span)};
}
function frameAt(p,count){
 if(p<.24)return Math.min(19,Math.floor(20*p/.24));
 const shot=shotAt(p,count);
 if(shot)return 20+Math.min(5,Math.floor(shot.q*6));
 if(p<.59)return 25;
 if(p<.91)return Math.max(0,19-Math.floor(20*(p-.59)/.32));
 return 0;
}
function oldFrameAt(p){
 if(p<CHARGE)return Math.min(19,Math.floor(20*p/CHARGE));
 if(p<FIRE)return 20+Math.min(5,Math.floor(6*(p-CHARGE)/(FIRE-CHARGE)));
 if(p<.58)return 24+Math.floor((p-FIRE)*34)%3;
 if(p<.91)return Math.max(0,19-Math.floor(20*(p-.58)/.33));
 return 0;
}
function scene(source,targets,p){
 p=C(p);const dir=source.team===1?-1:1,arr=targets.map((u,i)=>({...u,index:i,k:Math.max(.65,Math.min(1.8,(u.factor||1)*.85)),contact:{x:u.x,y:u.y-83*(u.factor||1)}}));
 const cx=arr.length?arr.reduce((v,u)=>v+u.x,0)/arr.length:ROOT.x+dir*270;
 const mouth={x:ROOT.x+dir*59*K,y:ROOT.y-153*K};
 const sky={x:cx+dir*40,y:-150};
 return{x:ROOT.x,y:ROOT.y,dir,p,targets:arr,mouth,sky,n:frameAt(p,Math.max(1,arr.length)),shot:shotAt(p,Math.max(1,arr.length)),alpha:C(p/.025)*C((.94-p)/.04)};
}
function tile(g,im,n,cols,w,h,x,y,dw,dh){g.drawImage(im,n%cols*w,Math.floor(n/cols)*h,w,h,x,y,dw,dh);}
function actor(g,s){if(!ready()||s.alpha<=0)return;g.save();g.globalAlpha*=s.alpha;g.translate(s.x,s.y);g.scale(s.dir*K,K);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";tile(g,body,s.n,8,W,H,-112,-240,W,H);g.restore();}
function orb(g,x,y,r,n,opacity=1){if(opacity<=0)return;g.save();g.globalAlpha*=opacity;tile(g,cleanWater||water,n,4,192,192,x-r,y-r,2*r,2*r);g.restore();}
function blast(g,s){
 if(!ready()||!s.shot)return;
 const q=s.shot.q;
 if(q<.43){const f=C(q/.43);orb(g,s.mouth.x,s.mouth.y,18+60*E(f),3+Math.min(8,Math.floor(f*9)));return;}
 const f=C((q-.43)/.57),x=L(s.mouth.x,s.sky.x,f),y=L(s.mouth.y,s.sky.y,f);
 for(let j=3;j>=1;j--){const t=Math.max(0,f-j*.06);orb(g,L(s.mouth.x,s.sky.x,t),L(s.mouth.y,s.sky.y,t),42-j*8,5+j,.13*(4-j));}
 orb(g,x,y,78+12*f,7+Math.min(4,Math.floor(f*5)));
}
function pellet(g,x,y,scale,angle,alpha){
 if(alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.translate(x,y);g.rotate(angle);
 // Isolated pointed droplet from the first illustrated Water Blast cell.
 g.drawImage(cleanWater||water,103,22,21,32,-8*scale,-18*scale,16*scale,36*scale);
 g.restore();
}
function rain(g,s,u){
 if(!ready()||s.p<BURST||s.p>=END)return;
 // The first pellet of each target's volley reaches the target on HIT.
 // Remaining pellets are visual only, so damage never multiplies per drop.
 for(let j=0;j<16;j++){
  const spread=j===0?0:(((j*53+u.index*17)%117)-58)*u.k;
  const land=HIT+j*.012,fall=.13+((j*7)%5)*.008,start=land-fall;
  const q=(s.p-start)/fall;
  if(q>=0&&q<=1){
   const endX=u.contact.x+spread,endY=u.contact.y+(j===0?0:((j*19)%37)-12);
   const fromX=endX-s.dir*(65+(j%4)*12),fromY=-170;
   pellet(g,L(fromX,endX,q),L(fromY,endY,q*q),u.k*(1.0+(j%3)*.18),-s.dir*.18,C(q*10));
  }
  const age=s.p-land;
  if(age>=0&&age<.075&&!u.blocked){
   const q=C(age/.075),n=12+Math.min(3,Math.floor(q*4)),r=(j===0?45:20)*u.k;
   g.save();g.globalAlpha*=C((1-q)*2);tile(g,cleanWater||water,n,4,192,192,u.contact.x+spread-r,u.contact.y-r*.70,r*2,r*1.35);g.restore();
  }
 }
}
function portrait(g,w,h){if(!ready())return;const scale=Math.min(w/160,h/215)*1.03;tile(g,body,23,8,W,H,(w-W*scale)/2,h-240*scale,W*scale,H*scale);}
window.HydroSerpent={ensure,ready,scene,actor,blast,rain,portrait,hit:HIT,frameCount:64};ensure();
})();
