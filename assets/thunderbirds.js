/* Authored, transparent falcons and separate lightning beam/impact frames. */
(()=>{
"use strict";
const C=256,R=224,atlas=new Image(),clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>{p=clamp(p);return p*p*(3-2*p);},mix=(a,b,t)=>a+(b-a)*t;
let pending=null,lastError="";
const ready=()=>atlas.complete&&atlas.naturalWidth===1792&&atlas.naturalHeight===896;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{
 const timer=setTimeout(()=>{lastError="Thunderbirds artwork timed out";resolve(false);},12000);
 atlas.onload=()=>{clearTimeout(timer);lastError=ready()?"":"Unexpected Thunderbird atlas size";resolve(ready());try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}};
 atlas.onerror=()=>{clearTimeout(timer);lastError="Unable to load Thunderbird frames";resolve(false);};
 atlas.src="./assets/thunderbirds-frames.webp?v=1";
 }).finally(()=>pending=null);return pending;
}
function tile(g,n,x,y,w,h){if(ready())g.drawImage(atlas,n%7*C,Math.floor(n/7)*R,C,R,x,y,w,h);}
const beamAtlas=new Image();
beamAtlas.src="./assets/thunderbirds-electric-beams.webp?v=2";
const beamReady=()=>beamAtlas.complete&&beamAtlas.naturalWidth===128&&beamAtlas.naturalHeight===136;
const FLAP=[0,1,2,3,4,5,6,5,4,3,2,1];
function scene(target,p){
 const dir=target.x>=500?1:-1;
 // Keep the two beaks roughly aligned vertically on the casting side,
 // with a modest horizontal stagger. Aim at a point well before the enemy.
 const hit={x:target.x,y:target.y-105};
 const joint={x:hit.x-dir*190,y:Math.max(125,Math.min(320,hit.y-18))};
 const beakOffsetY=14*235/256;
 const beakOffsetX=83*235/256;
 // Keep the birds on-screen even for inner slots in larger battles.
 const rearBeakX=Math.max(155,Math.min(845,joint.x-dir*165));
 const frontBeakX=rearBeakX+dir*20;
 const hover=[
   {x:rearBeakX-dir*beakOffsetX,y:joint.y-65-beakOffsetY},
   {x:frontBeakX-dir*beakOffsetX,y:joint.y+65-beakOffsetY}
 ];
 const birds=hover.map((h,i)=>{
   const angle=p/.46*Math.PI*4+i*Math.PI;
   const flying={x:500+Math.cos(angle)*285,y:200+Math.sin(angle)*86};
   const arrive=ease(p/.09),settle=ease((p-.36)/.12),leave=ease((p-.89)/.11);
   let x=mix(flying.x,h.x,settle),y=mix(flying.y,h.y,settle);
   y-= (1-arrive)*205+leave*240;
   x+=leave*(i===0?-75:75);
   const face=p<.36?(Math.sin(angle)>0?-1:1):dir;
   const size=235,scale=size/C;
   const pose=FLAP[(Math.floor(p*64)+i*3)%FLAP.length]+i*7;
   return {x,y,face,pose,size,bx:x+face*(211-128)*scale,by:y+(126-112)*scale};
 });
 // All three segments share the exact same convergence point.
 return {p,birds,hit,joint,alpha:Math.min(ease(p/.05),1-ease((p-.97)/.03))};
}
function bird(g,b){const h=b.size*R/C;g.save();g.translate(b.x,b.y);g.scale(b.face,1);tile(g,b.pose,-b.size/2,-h/2,b.size,h);g.restore();}
function beam(g,from,to,n,thickness,progress=1,phase=0,mergedBeam=false){
 const dx=(to.x-from.x)*progress,dy=(to.y-from.y)*progress,len=Math.hypot(dx,dy);
 if(len<1)return;
 const width=thickness*(.72+.28*ease(progress)),t=phase*95;
 g.save();g.translate(from.x,from.y);g.rotate(Math.atan2(dy,dx));
 // Continuous round-ended energy underneath the sprite. The transparent
 // margins of the atlas can no longer interrupt the beam at either endpoint.
 g.lineCap="round";g.lineJoin="round";
 function energyStroke(color,w){
   g.beginPath();g.moveTo(0,0);g.lineTo(len,0);
   g.strokeStyle=color;g.lineWidth=w;g.stroke();
 }
 energyStroke("rgba(29,110,255,.26)",width*.62);
 energyStroke("rgba(41,171,255,.78)",width*.39);
 energyStroke("rgba(111,218,255,.96)",width*.24);
 // Four separate authored transparent electricity frames; cycle while firing.
 // The full-length beam stays anchored to both ends.
 if(beamReady()){
   const seq=[0,1,2,3,2,1],frame=seq[Math.floor(t)%seq.length];
   // The outgoing stream uses the interior of the texture so the
   // separate circular launch flare doesn't appear again at the junction.
   const crop=mergedBeam?14:0;
   g.drawImage(beamAtlas,crop,frame*34,128-crop,34,0,-width/2,len,width);
 }else{
   g.drawImage(atlas,(n%7)*C+4,Math.floor(n/7)*R+76,248,72,0,-width/2,len,width);
 }
 // An unbroken luminous core goes over the artwork, with a subtle
 // moving electric ripple that returns exactly to the center at the join.
 g.beginPath();
 const coreSteps=Math.max(8,Math.ceil(len/7));
 for(let j=0;j<=coreSteps;j++){
   const u=j/coreSteps;
   const ripple=Math.sin(u*Math.PI*2*Math.max(1,len/95)-t*.7)
     *width*.036*Math.sin(Math.PI*u);
   if(j===0)g.moveTo(0,0);else g.lineTo(len*u,j===coreSteps?0:ripple);
 }
 g.strokeStyle="rgba(124,227,255,.95)";g.lineWidth=width*.17;g.stroke();
 g.strokeStyle="rgba(238,254,255,.98)";g.lineWidth=width*.085;g.stroke();
 // Crisp animated electrical filaments travel around the illustrated beam,
 // rather than a stationary outline. Keep both endpoints anchored.
 const waves=Math.max(1.2,len/100),steps=Math.max(12,Math.ceil(len/8));
 for(let strand=0;strand<3;strand++){
   g.beginPath();
   for(let j=0;j<=steps;j++){
     const u=j/steps,envelope=Math.pow(Math.sin(Math.PI*u),.45);
     const turn=u*waves*Math.PI*2-t*.65+strand*Math.PI*2/3;
     const jag=(Math.sin(j*4.73+Math.floor(t)*1.93+strand)*.07)*width;
     const y=(Math.sin(turn)*width*(strand===2?.25:.34)+jag)*envelope;
     if(j===0)g.moveTo(0,y);else g.lineTo(len*u,y);
   }
   g.lineJoin="round";g.lineCap="round";
   g.strokeStyle="rgba(30,139,255,.45)";g.lineWidth=width*.085;g.stroke();
   g.strokeStyle=strand===2?"rgba(117,225,255,.92)":"rgba(213,250,255,.86)";
   g.lineWidth=Math.max(1.5,width*.023);g.stroke();
 }
 // Small angular electric sparks stream toward the point of convergence.
 for(let i=0;i<10;i++){
   const u=(phase*9+i/10)%1,side=i%2?1:-1;
   const x=len*u,y=side*width*(.30+.13*Math.sin(i*7+t*.4))*Math.sin(Math.PI*u);
   const a=Math.sin(Math.PI*u),tail=Math.min(x,Math.max(3,width*.12));
   g.fillStyle="rgba(154,235,255,"+(.8*a)+")";
   g.beginPath();g.moveTo(x,y);g.lineTo(x-tail,y+side*width*.035);
   g.lineTo(x-tail*.35,y-side*width*.035);g.closePath();g.fill();
 }
 g.restore();
}
function draw(g,s){
 if(!ready())return;
 g.save();g.globalAlpha*=s.alpha;
 const p=s.p,beat=14+Math.floor(p*100)%5;
 if(p>=.58&&p<.87){
   const extend=ease((p-.58)/.09);
   const fade=1-ease((p-.84)/.03);
   const ordered=s.birds.slice().sort((a,b)=>
     Math.hypot(a.bx-s.hit.x,a.by-s.hit.y)-Math.hypot(b.bx-s.hit.x,b.by-s.hit.y));
   const [near,far]=ordered;
   // Preserve the requested layering: the distant bird's beam is in
   // front of the nearer bird, including its wings.
   g.save();g.globalAlpha*=fade;
   beam(g,{x:near.bx,y:near.by},s.joint,beat,82,extend,p);
   g.restore();
   bird(g,near);
   g.save();g.globalAlpha*=fade;
   beam(g,{x:far.bx,y:far.by},s.joint,beat,82,extend,p);
   // Both branches arrive together before the combined beam advances.
   // Round caps and overlapping bright cores make the three paths one
   // connected Y rather than three disconnected images or a circular dot.
   if(p>=.67){
     const merged=ease((p-.67)/.06);
     beam(g,s.joint,s.hit,beat,128,merged,p,true);
     // Keep the merge luminous without a separate round orb. The
     // overlapping round-ended electrical cores make the junction continuous.
   }
   g.restore();
   bird(g,far);
 }else{
   for(const b of s.birds)bird(g,b);
 }
 g.restore();
}
function impact(g,s){
 if(!ready()||s.p<.73||s.p>=.94)return;
 const t=clamp((s.p-.73)/.21),n=19+Math.min(7,Math.floor(t*8)),size=240;
 g.save();g.globalAlpha*=1-ease((t-.8)/.2);tile(g,n,s.hit.x-size/2,s.hit.y-size*R/C/2,size,size*R/C);g.restore();
}
function sky(g,{x,y,width,height,time,p}){
 const strength=.58*Math.min(ease(p/.12),1-ease((p-.88)/.12));
 if(strength>0)window.LightningField?.draw(g,{x,y,width,height,time,strength});
}
function portrait(g,w,h){
 if(!ready())return;
 const size=Math.min(w*.78,h*1.02);
 for(let i=0;i<2;i++){const x=w*(i?.70:.30),y=h*(i?.60:.36);g.save();g.translate(x,y);g.scale(i?-1:1,1);tile(g,i*7,-size/2,-size*R/C/2,size,size*R/C);g.restore();}
}
window.Thunderbirds={ensure,ready,error:()=>lastError,scene,draw,impact,sky,portrait};ensure();
})();