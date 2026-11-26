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
 const u=C((p-.43)/(hit-.43)),run=u*u*(2-u);
 const contactX=target.x-dir*90;
 let frame;
 if(p<.29)frame=Math.min(7,Math.floor(p/.29*8));
 else if(p<.43)frame=8+Math.floor((p-.29)/.14*6);
 else if(p<hit)frame=14+Math.floor((p-.43)/(hit-.43)*6);
 else if(p<.80)frame=20+Math.floor((p-hit)/(.80-hit)*4);
 else frame=Math.min(31,24+Math.floor((p-.80)/.20*8));
 const x=L(origin.x,contactX,run),y=L(origin.y,target.y+8,E(u));
 // Last eight frames are the authored rock-and-dust aftermath, not a repeated hit.
 return {x,y,dir,frame,p,hit,scale,origin,speed:C(u*2.8),alpha:1-E((p-.93)/.07)};
}
function polygon(g,pts,color){g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function draw(g,s){
 g.save();g.globalAlpha*=s.alpha;g.translate(s.x,s.y);g.scale(s.dir,1);
 tile(g,s.frame,-155*s.scale,-169*s.scale,s.scale);g.restore();
}
function trail(g,s){
 if(s.p<.43||s.p>=s.hit)return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);
 for(let i=0;i<22;i++){
  const q=((s.p-.43)*10+i*.139)%1,x=-30-q*165,y=-6-Math.sin(q*Math.PI)*(9+i%5*10),r=(4+i%4*2)*(1-q);
  g.globalAlpha=s.speed*(1-q)*.65;
  polygon(g,[[x-r,y],[x-r*.4,y-r],[x+r*.8,y-r*.6],[x+r,y+3]],i%2?'#b69a72':'#7d674d');
 }
 for(let i=0;i<4;i++){
  const y=-26-i*18,len=85+i*15;
  g.globalAlpha=s.speed*.6;
  const grad=g.createLinearGradient(-len-65,y,-24,y);grad.addColorStop(0,'rgba(226,167,64,0)');grad.addColorStop(1,'rgba(255,220,129,.85)');
  polygon(g,[[-len-65,y+3],[-35,y-4],[-12,y],[-35,y+4]],grad);
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
