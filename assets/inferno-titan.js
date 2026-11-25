/* Inferno Titan: 48 illustrated frames: opaque knight, traveling crack and lava geyser; direct WebP atlas. */
(()=>{
"use strict";
const CELL=256,atlas=new Image(),clamp=x=>Math.max(0,Math.min(1,x));
let pending=null,loaded=false,lastError="";
function ready(){return loaded&&atlas.naturalWidth===1024&&atlas.naturalHeight===3072;}
function ensure(){
 if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{
  const timer=setTimeout(()=>{lastError="Titan sprite load timed out";resolve(false);},12000);
  atlas.onload=()=>{clearTimeout(timer);loaded=atlas.naturalWidth===1024&&atlas.naturalHeight===3072;lastError=loaded?"":"Unexpected Titan sprite dimensions";resolve(loaded);if(loaded){try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){console.warn(e);}}};
  atlas.onerror=()=>{clearTimeout(timer);lastError="Could not load Titan sprite atlas";resolve(false);};
  atlas.src="./assets/inferno-titan-vfx-v2.webp?v=1";
 }).finally(()=>{pending=null;});return pending;
}
function tile(g,n,x,y,w,h,sx=0,sy=0,sw=CELL,sh=CELL){
 if(ready())g.drawImage(atlas,n%4*CELL+sx,Math.floor(n/4)*CELL+sy,sw,sh,x,y,w,h);
}
function frame(g,n,x,y,scale,dir){
 if(!ready())return;
 n=Math.max(0,Math.min(23,n|0));g.save();g.translate(x,y);g.scale(dir*scale,scale);
 g.imageSmoothingEnabled=true;tile(g,n,-128,-240,CELL,CELL);g.restore();
}
const DURATION=5400,STAB=.43,ARRIVE=.58,HIT=.61;
const poseTimes=[0,.045,.09,.135,.18,.215,.25,.275,.30,.324,.348,.373,.415,.43,.45,.48,.51,.55,.59,.63,.68,.76,.85,.91];
function scene(source,target,p){
 const dir=target.x>=source.x?1:-1,scale=1.53,x=500,y=510;
 let n=0;while(n<23&&p>=poseTimes[n+1])n++;
 const sx=x+dir*(156-128)*scale,sy=y-5;
 return {x,y,dir,scale,n,p,sx,sy,tx:target.x,ty:target.y,crack:clamp((p-STAB)/(ARRIVE-STAB)),eruption:clamp((p-ARRIVE)/(.97-ARRIVE))};
}
function draw(g,s){
 if(!ready())return;
 const sink=clamp((s.p-.92)/.08);
 g.save();g.beginPath();g.rect(s.x-230,s.y-435,460,439);g.clip();
 frame(g,s.n,s.x,s.y+sink*sink*365,s.scale,s.dir);g.restore();
}
function fissure(g,s){
 if(!ready()||s.p<STAB||s.p>=.97)return;
 const dx=s.tx-s.sx,dy=s.ty-s.sy,len=Math.hypot(dx,dy);
 if(len<1)return;
 const idx=Math.min(7,Math.floor(s.crack*8));
 g.save();g.translate(s.sx,s.sy);g.rotate(Math.atan2(dy,dx));
 g.imageSmoothingEnabled=true;g.globalAlpha*=1-clamp((s.p-.89)/.08);
 const height=104,width=len*228/222;
 tile(g,24+idx,0,-height*.52,width,height,15,110,228,104);g.restore();
}
function geyser(g,s){
 if(!ready()||s.p<ARRIVE||s.p>=.98)return;
 const n=Math.min(15,Math.floor(s.eruption*16)),size=365;
 g.save();g.imageSmoothingEnabled=true;g.globalAlpha*=1-clamp((s.p-.95)/.03);
 tile(g,32+n,s.tx-size*.5,s.ty-size*222/256,size,size);g.restore();
}
function shake(p,dir){
 const ms=p*DURATION;
 const kick=(at,strength,life)=>{const age=ms-at*DURATION;return age<0||age>life?0:strength*Math.exp(-age/(life*.30));};
 const force=kick(STAB,22,380)+kick(HIT,16,410);
 return {x:dir*Math.sin(ms*.072)*force*.58,y:Math.cos(ms*.086)*force*.80};
}
function portrait(g,w,h){if(!ready()){ensure();return;}const scale=Math.min(w/218,h/225);frame(g,7,w*.5,h*.96,scale,1);}
window.InfernoTitan={ensure,ready,error:()=>lastError,scene,draw,fissure,geyser,portrait,shake};ensure();
})();