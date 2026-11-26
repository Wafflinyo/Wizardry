/* Giant Armadillo: 32 authored transparent frames, with independently rendered collision FX. */
(()=>{
"use strict";
const atlas=new Image(),W=272,H=181,TAU=Math.PI*2;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>{p=C(p);return p*p*(3-2*p);};
let pending=null,lastError="";
const ready=()=>atlas.complete&&atlas.naturalWidth===2176&&atlas.naturalHeight===724;
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 pending=new Promise(resolve=>{
  const timer=setTimeout(()=>resolve(false),12000);
  atlas.onload=()=>{clearTimeout(timer);resolve(ready());};
  atlas.onerror=()=>{clearTimeout(timer);resolve(false);};
  atlas.src="./assets/giant-armadillo-frames.webp?v=1";
 }).then(ok=>{lastError=ok?"":"Giant Armadillo artwork failed to load";if(ok)try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}return ok;}).finally(()=>pending=null);
 return pending;
}
function tile(g,n,x,y,scale){if(ready())g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,W*scale,H*scale);}
function scene(source,target,p,hit=.68){
 p=C(p);
 const dir=source.team===0?1:-1,scale=1.22,origin={x:500-dir*100,y:510};
 const spinStart=.39,dashStart=.55;
 const u=C((p-dashStart)/(hit-dashStart)),run=u*u*(2-u);
 const spinTime=Math.max(0,(p-spinStart)*4),ramp=Math.min(spinTime,.12);
 // Continuous clockwise rotation in local right-facing space; mirror for left.
 const angle=TAU*(3*ramp+((7-3)/.24)*ramp*ramp+7*Math.max(0,spinTime-.12));
 const contactX=target.x-dir*90;
 let frame;
 if(p<.29)frame=Math.min(7,Math.floor(p/.29*8));
 else if(p<spinStart)frame=8+Math.min(5,Math.floor((p-.29)/(spinStart-.29)*6));
 else if(p<hit)frame=14+Math.min(5,Math.floor((p-spinStart)/(hit-spinStart)*6));
 else if(p<.80)frame=20+Math.floor((p-hit)/(.80-hit)*4);
 else frame=Math.min(31,24+Math.floor((p-.80)/.20*8));
 const x=L(origin.x,contactX,run),y=L(origin.y,target.y+8,E(u));
 // Last eight frames are the authored rock-and-dust aftermath, not a repeated hit.
 return {x,y,dir,frame,p,hit,scale,origin,contactX,contactY:target.y+8,spinStart,dashStart,spinning:p>=spinStart&&p<hit,angle,spinStrength:C(spinTime/.12),speed:C(u*3.2),alpha:1-E((p-.93)/.07)};
}
function polygon(g,pts,color){g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function draw(g,s){
 g.save();g.globalAlpha*=s.alpha;g.translate(s.x,s.y);g.scale(s.dir,1);
 // Rotate only the cropped armored ball, not the painted dust or motion trail.
 if(s.spinning&&ready()){
  const r=78*s.scale,opacity=g.globalAlpha;
  g.translate(0,-r);
  // Angular shutter samples blend the actual shell texture, not its dust.
  // Draw the sharpest sample last; preserve the armored silhouette and
  // avoid a hard on/off jump as the blur builds with angular velocity.
  g.beginPath();g.arc(0,0,r,0,TAU);g.clip();
  const shutter=.48+1.05*s.spinStrength;
  for(let i=8;i>=0;i--){
    g.save();g.rotate(s.angle-shutter*i/8);
    g.globalAlpha=opacity*(i===8?1:i===0?.46:.18+.10*(1-i/8));
    g.drawImage(atlas,5*W+75,H+18,156,156,-r,-r,r*2,r*2);
    g.restore();
  }
  // Curved highlights give a continuous rotational smear between poses.
  g.lineCap="round";
  for(let i=0;i<5;i++){
    const a=s.angle*.28+i*TAU/5;
    g.globalAlpha=opacity*(.18+.20*s.spinStrength);
    g.strokeStyle=i%2?'#f6d593':'#b69b75';g.lineWidth=(i%2?3:7)*s.scale;
    g.beginPath();g.arc(0,0,r*(.67+i%3*.11),a,a+.72+s.spinStrength*.46);g.stroke();
  }
 }else tile(g,s.frame,-155*s.scale,-169*s.scale,s.scale);
 g.restore();
}
// Sample the shell's earlier ground position so dust remains in the
// arena instead of sticking to the moving ball. Deterministic per-frame
// particles are safe for seeking, both team directions and every target.
function groundAt(s,p){
 const u=C((p-s.dashStart)/(s.hit-s.dashStart)),run=u*u*(2-u);
 return {x:L(s.origin.x,s.contactX,run),y:L(s.origin.y,s.contactY,E(u))};
}
function trail(g,s,layer="back"){
 if(s.p<s.spinStart||s.p>=s.hit+.095)return;
 const front=layer==="front",t=(s.p-s.spinStart)*4,tail=1-E((s.p-s.hit)/.095);
 const intensity=(.78+.22*s.spinStrength)*tail;
 g.save();
 // Continuous backward-ejected dust. The age of each puff determines its
 // actual world position, so the burnout flows even while the shell is still.
 for(let i=0;i<60;i++){
  if((i%3===0)!==front)continue;
  const q=(t*(1.55+i%4*.13)+i*.137)%1,age=q*.145;
  const birth=Math.min(s.hit,Math.max(s.spinStart,s.p-age));
  const o=groundAt(s,birth),a=i*2.399;
  const drift=12+q*(140+i%6*17);
  const x=o.x-s.dir*drift+Math.cos(a)*24*(1-q*.5);
  const y=o.y-9-q*(34+i%5*10)+Math.sin(a+t*2.1)*13;
  const r=(27+i%5*7)*(.68+.66*q);
  const glow=g.createRadialGradient(0,0,0,0,0,r);
  glow.addColorStop(0,i%2?'rgba(192,159,111,.78)':'rgba(128,99,66,.73)');
  glow.addColorStop(.5,'rgba(178,146,103,.42)');
  glow.addColorStop(1,'rgba(159,128,92,0)');
  g.save();g.translate(x,y);g.scale(1.35+.40*q,.72+.16*q);
  g.globalAlpha=intensity*(1-q)* (front?.43:.72);
  g.fillStyle=glow;g.beginPath();g.ellipse(0,0,r,r,0,0,TAU);g.fill();
  g.restore();
  g.globalAlpha=intensity*(1-q)* (front?.085:.13);
  polygon(g,[[x-r*.85,y],[x-r*.44,y-r*.41],[x+r*.15,y-r*.48],[x+r*.75,y-r*.12],[x+r*.50,y+r*.23],[x-r*.36,y+r*.28]],i%2?'#c5a87f':'#917453');
 }
 // Soft overlapping wisps drift up and back, never forming an opaque
 // blanket over the armor. Most of their volume stays behind the ball.
 for(let i=0;i<(front?5:10);i++){
  const q=(t*1.35+i*.173)%1,a=i*2.399+t*2;
  const o=groundAt(s,Math.min(s.hit,Math.max(s.spinStart,s.p-q*.13)));
  const x=o.x-s.dir*(20+q*160)+Math.cos(a)*17;
  const y=o.y-22-q*(front?53:90)+Math.sin(a)*10;
  const r=36+q*25;
  const glow=g.createRadialGradient(0,0,0,0,0,r);
  glow.addColorStop(0,'rgba(185,153,110,.62)');
  glow.addColorStop(.48,'rgba(180,150,112,.39)');
  glow.addColorStop(1,'rgba(167,139,103,0)');
  g.save();g.translate(x,y);g.scale(1.55,.78);
  g.globalAlpha=tail*(.68+.32*s.spinStrength)*(1-q*.65)*(front?.28:.48);
  g.fillStyle=glow;g.beginPath();g.ellipse(0,0,r,r,0,0,TAU);g.fill();g.restore();
 }
 // The spinning shell throws rock chips primarily backward, with
 // a smaller sideways spread, until the existing contact burst takes over.
 for(let i=0;i<36;i++){
  if((i%3===0)!==front)continue;
  const q=(t*(1.75+i%3*.14)+i*.173)%1;
  const o=groundAt(s,Math.min(s.hit,Math.max(s.spinStart,s.p-q*.14)));
  const x=o.x-s.dir*(17+q*(85+i%5*18))+Math.cos(i*2.399)*30;
  const y=o.y+(front?8:-4)-4*q*(1-q)*(40+i%6*16),r=(4+i%5*2)*(1-q*.42);
  const a=i*1.7+t*(4+i%3);
  g.save();g.translate(x,y);g.rotate(a);
  g.globalAlpha=intensity*(1-q)*.86;
  polygon(g,[[-r,0],[-r*.4,-r*1.35],[r,-r*.35],[r*.55,r*.7]],i%2?'#a17b53':'#76583c');
  polygon(g,[[-r,0],[-r*.4,-r*1.35],[r,-r*.35]],'#d6b387');g.restore();
 }
 if(!front){
  g.translate(s.x,s.y);g.scale(s.dir,1);
  for(let i=0;i<4;i++){
   const q=(t*2.2+i*.25)%1;g.globalAlpha=intensity*(1-q)*.48;
   g.strokeStyle='#d4aa70';g.lineWidth=2+3*(1-q);g.beginPath();g.ellipse(0,0,39+q*72,7+q*13,0,.1,Math.PI-.1);g.stroke();
  }
  for(let i=0;i<5;i++){
   const y=-24-i*23,len=95+i*19;
   g.globalAlpha=s.speed*tail*.68;
   const grad=g.createLinearGradient(-len-65,y,-24,y);grad.addColorStop(0,'rgba(226,167,64,0)');grad.addColorStop(1,'rgba(255,220,129,.9)');
   polygon(g,[[-len-65,y+3],[-35,y-5],[-12,y],[-35,y+5]],grad);
  }
 }
 g.restore();
}
function impact(g,s,t){
 const q=(s.p-s.hit)/.24;if(q<0||q>=1)return;
 g.save();g.translate(t.x,t.y);
 const fade=1-E((q-.45)/.55);
 if(q<.22){
  g.globalAlpha=(1-q/.22)*.95;
  const r=42+q*100,star=Array.from({length:16},(_,i)=>{const a=i*TAU/16,k=i%2?.22:1;return [Math.cos(a)*r*k,-54+Math.sin(a)*r*k];});
  polygon(g,star,'#ffd67e');polygon(g,star.map(([x,y])=>[x*.5,-54+(y+54)*.5]),'#fff5cc');
 }
 for(let j=0;j<3;j++){
  const u=(q-j*.085)/.85;if(u<0||u>=1)continue;
  const r=20+u*145;g.globalAlpha=(1-u)*.86;g.strokeStyle=j%2?'#bb9558':'#ffe4a4';g.lineWidth=2+6*(1-u);
  g.beginPath();g.ellipse(0,0,r,r*.23,0,0,TAU);g.stroke();
 }
 for(let i=0;i<32;i++){
  const a=i*2.399,r=15+q*(75+i%7*14),x=Math.cos(a)*r+s.dir*q*35,y=Math.sin(a)*r*.24-4*q*(1-q)*(45+i%5*17),d=(4+i%5*2)*(1-q*.5);
  g.globalAlpha=fade*(1-q*.5);
  polygon(g,[[x-d,y],[x-d*.2,y-d*1.4],[x+d,y-d*.3],[x+d*.4,y+d*.65]],['#94714a','#c2a27a','#72563c'][i%3]);
  polygon(g,[[x-d,y],[x-d*.2,y-d*1.4],[x+d,y-d*.3]],'#e0be8d');
 }
 g.restore();
}
function shake(p,dir=1,hit=.68,duration=4000){
 const dt=(p-hit)*duration;if(dt<0||dt>=220)return {x:0,y:0};
 const a=(1-dt/220)**2;return {x:dir*Math.cos(dt*.12)*9*a,y:Math.cos(dt*.09)*6*a};
}
function portrait(g,w,h){const k=Math.min(w/W,h/H)*1.08;tile(g,6,(w-W*k)/2,(h-H*k)/2,k);}
window.GiantArmadillo={ensure,ready,error:()=>lastError,scene,draw,trail,impact,shake,portrait};ensure();
})();
