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
function mount(u,scale=1){
 scale=Math.max(.75,Math.min(1.8,scale||1));
 return {x:u.x+(u.team===0?15:-15)*scale,y:u.y-91*scale,size:75*scale,scale};
}
function scene(source,target,p,scale=1){
 const dir=target.x>=source.x?1:-1,m=mount(target,scale),size=138;
 const stopX=target.x-dir*62,stopY=target.y+3;
 let x=500,y=510-39,frame=0,depth=510,alpha=1;
 if(p<.16){const t=ease(p/.16);y-=155*(1-t);alpha=clamp(p/.035);frame=0;}
 else if(p<.31){frame=Math.min(3,1+Math.floor((p-.16)/.15*3));}
 else if(p<.63){const t=ease((p-.31)/.32);x=500+(stopX-500)*t;depth=510+(stopY-510)*t;y=depth-36-3*Math.sin(t*8*Math.PI);frame=4+Math.floor((p-.31)*28)%5;}
 else if(p<.78){const t=clamp((p-.63)/.15);x=stopX+(m.x-stopX)*t;y=stopY-36+(m.y-(stopY-36))*t-55*Math.sin(Math.PI*t);depth=stopY;frame=9+Math.min(2,Math.floor(t*3));}
 else alpha=0;
 return {x,y,depth,frame,dir,size,alpha,p,m};
}
function draw(g,s){tile(g,body,s.frame,s.x,s.y,s.size,s.alpha,s.dir);}
function castFx(g,s){
 if(s.p>=.13&&s.p<.32){const t=(s.p-.13)/.19;tile(g,fx,Math.min(2,Math.floor(t*3)),500,493,172,1-ease(t));}
 if(s.p>=.78&&s.p<.96){const t=(s.p-.78)/.18;tile(g,fx,Math.min(7,3+Math.floor(t*5)),s.m.x,s.m.y,135*s.m.scale,1-ease(t));}
}
function attached(g,u,time,scale=1){
 const m=mount(u,scale),frame=12+Math.floor((Number(time)||0)/170)%4;
 tile(g,body,frame,m.x,m.y,m.size);
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
window.ThunderMine={ensure,ready,error:()=>err,scene,draw,castFx,attached,explode,shake,portrait};ensure();
})();
