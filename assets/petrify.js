/* Petrify: separated plates extracted from the approved low-poly artwork.
   The live character pose remains the source of truth, never a replacement wizard. */
(()=>{
"use strict";
const atlas=new Image();let pending;
const C=x=>Math.max(0,Math.min(1,x)),E=x=>{x=C(x);return x*x*(3-2*x);},TAU=Math.PI*2;
const ready=()=>atlas.complete&&atlas.naturalWidth===256&&atlas.naturalHeight===64;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/petrify-plates.webp?v=1";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function piece(g,i,x,y,w,h,p=1,angle=0){
 if(p<=0||!ready())return;
 const v=E(p);
 g.save();g.translate(x+(1-v)*14,y+(1-v)*27);g.rotate(angle+(1-v)*.5);g.globalAlpha*=C(p*2);
 g.drawImage(atlas,i*64,0,64,64,-w/2,-h/2,w,h);g.restore();
}
const idleY=[0,-1,-1,-3,-4,-3,-1,1,1,1,2,2];
const arm=[[57,65,62,76,71,74],[57,65,62,76,71,74],[57,65,63,76,73,74],[56,65,66,75,82,67],[57,66,71,76,85,72],[57,66,72,74,86,66],[57,66,69,69,82,58],[57,65,69,65,79,52],[58,65,70,63,81,48],[58,65,70,65,79,53],[57,66,69,70,81,60],[57,66,71,76,85,70],[56,66,68,76,80,74],[57,65,63,76,73,74],[57,65,62,76,71,74],[57,65,62,76,71,74]];
const phase=(p,d)=>C((Math.floor(p*32)/32-d)/.30);
function wizard(g,p,i){
 const y=idleY[i]||0,pose=i<12?[66,64+y,73,75+y,84,72+y]:arm[i-12]||arm[0];
 const [sx,sy,ex,ey,wx,wy]=pose;
 // Keep face, hat, staff, hands and lower robe visible; small fitted plates.
 piece(g,2,49,87+y,28,28,phase(p,.10),-.1);
 piece(g,1,53,74+y,27,25,phase(p,.28),.12);
 piece(g,0,sx-4,sy-1,23,20,phase(p,.52),.12);
 piece(g,3,ex+(wx-ex)*.32,ey+(wy-ey)*.32,16,19,phase(p,.67),Math.atan2(wy-ey,wx-ex)-Math.PI/2);
}
function rig(g,p,side,sh,el,hand){
 if(!p)return;
 piece(g,2,0,-66,46,48,phase(p,.1));
 piece(g,1,0,-94,50,43,phase(p,.28));
 piece(g,0,sh[0],sh[1],38,31,phase(p,.52),side*.15);
 piece(g,3,el[0]+(hand[0]-el[0])*.32,el[1]+(hand[1]-el[1])*.32,24,30,phase(p,.67),Math.atan2(hand[1]-el[1],hand[0]-el[0])-Math.PI/2);
}
function creature(g,p,x,y,w,h){
 if(!p)return;
 piece(g,2,x+w*.48,y+h*.69,w*.20,h*.23,phase(p,.1));
 piece(g,1,x+w*.48,y+h*.50,w*.25,h*.22,phase(p,.28));
 piece(g,0,x+w*.37,y+h*.44,w*.16,h*.15,phase(p,.52));
}
function cast(g,u,p,f,layer){
 if(p<=0||p>.9)return;
 const q=Math.floor(p*32)/32,fade=1-E((q-.62)/.28);
 g.save();g.translate(u.x,u.y);g.scale(f,f);g.globalAlpha*=fade;
 for(let i=0;i<16;i++){
  const angle=i*2.399+q*TAU*2,front=Math.sin(angle)>0;
  if(front!==(layer==="front"))continue;
  const v=C(q*1.65-i*.018),r=72*(1-v*.64),x=Math.cos(angle)*r,y=-Math.sin(v*Math.PI*.68)*145+Math.sin(angle)*r*.22;
  piece(g,i%4,x,y,14+i%4*4,14+i%4*4,C(q*8),angle);
 }
 g.restore();
}
function chips(g,u,age,f,expired=false){
 const p=age/(expired?.85:.55);if(p<0||p>=1)return;
 g.save();g.translate(u.x,u.y);g.scale(f,f);g.globalAlpha*=1-p;
 for(let i=0;i<(expired?15:8);i++){
  const a=i*2.399,x=Math.cos(a)*(20+p*70),y=-95+i%4*20-4*p*(1-p)*35+p*55;
  piece(g,i%4,x,y,9+i%4*3,10+i%3*3,1,a+p*7);
 }
 g.restore();
}
function portrait(g,w,h){const k=Math.min(w/128,h/128);g.save();g.translate(w/2-64*k,h/2-64*k);g.scale(k,k);piece(g,2,63,87,65,62);piece(g,1,62,56,71,58);piece(g,0,34,40,47,44);piece(g,0,94,40,45,43);g.restore();}
window.Petrify={ensure,ready,wizard,rig,creature,cast,chips,portrait};ensure();
})();