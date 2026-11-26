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
 return {x,y,dir,frame,p,hit,scale,origin,spinStart,dashStart,spinning:p>=spinStart&&p<hit,angle,spinStrength:C(spinTime/.12),speed:C(u*3.2),alpha:1-E((p-.93)/.07)};
}
function polygon(g,pts,color){g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function draw(g,s){
 g.save();g.globalAlpha*=s.alpha;g.translate(s.x,s.y);g.scale(s.dir,1);
 // Rotate only the cropped armored ball, not the painted dust or motion trail.
 if(s.spinning&&ready()){
  const r=78*s.scale;
  g.translate(0,-r);g.rotate(s.angle);
  g.beginPath();g.arc(0,0,r,0,TAU);g.clip();
  g.drawImage(atlas,5*W+75,H+18,156,156,-r,-r,r*2,r*2);
 }else tile(g,s.frame,-155*s.scale,-169*s.scale,s.scale);
 g.restore();
}
function trail(g,s){
 if(!s.spinning)return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);
 const k=s.spinStrength,travel=s.speed,t=(s.p-s.spinStart)*4;
 // Continuous ground-level dust spray: a burnout before the dash.
 for(let i=0;i<34;i++){
  const q=(t*(2.3+i%3*.21)+i*.139)%1,a=i*2.399;
  const side=Math.cos(a),spread=24+q*(78+i%5*12);
  const x=side*spread-travel*q*175,y=-4-Math.sin(q*Math.PI)*(22+i%6*12)+Math.sin(a)*13;
  const r=(6+i%5*3)*(1-q);
  g.globalAlpha=k*(1-q)*.58;
  polygon(g,[[x-r,y],[x-r*.5,y-r],[x+r*.7,y-r*.65],[x+r,y+3]],i%2?'#c0a17a':'#80664d');
 }
 // Distinct heavy stone chips kicked upward and outward by the shell.
 for(let i=0;i<24;i++){
  const q=(t*1.8+i*.177)%1,side=i%2?1:-1;
  const x=side*(30+q*(60+i%5*15))-travel*q*145;
  const y=-5-4*q*(1-q)*(37+i%6*14),r=(4+i%4*2)*(1-q*.45);
  g.globalAlpha=k*(1-q)*.92;
  polygon(g,[[x-r,y],[x-r*.35,y-r*1.6],[x+r,y-r*.4],[x+r*.5,y+r*.6]],i%2?'#ac8860':'#70563f');
  polygon(g,[[x-r,y],[x-r*.35,y-r*1.6],[x+r,y-r*.4]],'#ddbb8a');
 }
 // Short grounded skid crescents while spinning in place.
 for(let i=0;i<3;i++){
  const q=(t*2+i*.33)%1;g.globalAlpha=k*(1-q)*.52*(1-travel*.65);
  g.strokeStyle='#d4aa70';g.lineWidth=2+3*(1-q);g.beginPath();g.ellipse(0,0,40+q*60,7+q*13,0,.1,Math.PI-.1);g.stroke();
 }
 // Long directional golden streaks only once the ball launches.
 for(let i=0;i<5;i++){
  const y=-24-i*23,len=95+i*19;
  g.globalAlpha=travel*.72;
  const grad=g.createLinearGradient(-len-65,y,-24,y);grad.addColorStop(0,'rgba(226,167,64,0)');grad.addColorStop(1,'rgba(255,220,129,.9)');
  polygon(g,[[-len-65,y+3],[-35,y-5],[-12,y],[-35,y+5]],grad);
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
