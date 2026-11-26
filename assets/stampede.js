/* Stampede: 32 transparent authored herd poses. Portal, dust, leaves and
   contact bursts are separate runtime effects; no arena baked into art. */
(()=>{
"use strict";
const atlas=new Image(),CELL=224,TAU=Math.PI*2;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,t)=>a+(b-a)*t,E=t=>{t=C(t);return t*t*(3-2*t);};
let pending=null,lastError="";
const ready=()=>atlas.complete&&atlas.naturalWidth===1792&&atlas.naturalHeight===896;
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 pending=new Promise(resolve=>{
  const timer=setTimeout(()=>resolve(false),12000);
  atlas.onload=()=>{clearTimeout(timer);resolve(ready());};
  atlas.onerror=()=>{clearTimeout(timer);resolve(false);};
  atlas.src="./assets/stampede-frames.webp?v=1";
 }).then(ok=>{lastError=ok?"":"Stampede artwork failed to load";if(ok)try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}return ok;}).finally(()=>pending=null);
 return pending;
}
function tile(g,f,x,y,w){if(ready())g.drawImage(atlas,f%8*CELL,Math.floor(f/8)*CELL,CELL,CELL,x,y,w,w);}
function scene(source,targets,p){
 const dir=source.team===0?1:-1,origin={x:500-dir*105,y:510},herds=[];
 for(const [i,t] of targets.entries()){
  const start=.22+i*.045,hit=t.hitAt,finish=Math.min(.98,hit+.155);
  if(p<start||p>=finish)continue;
  const u=C((p-start)/(hit-start)),v=C((p-hit)/(finish-hit));
  const w=targets.length>2?250:285,leadOffset=76*w/CELL;
  const hitX=t.x-dir*leadOffset;
  const dash=u*u*(2-u);
  const x=p<hit?L(origin.x,hitX,dash):L(hitX,t.x+dir*300,v);
  const y=p<hit?L(origin.y,t.y,E(dash)):t.y+v*12;
  const cycle=(p-start)*4.8;
  const speed=p<hit?C(u*2.7):1;
  const frame=Math.floor(cycle*32)%32;
  herds.push({x,y,dir,w,frame,alpha:E((p-start)/.07)*(1-E((p-finish+.065)/.065)),p,phase:cycle,speed,id:t.id});
 }
 return {dir,origin,targets,herds,p};
}
function polygon(g,points,color){g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function portal(g,s){
 const p=s.p,a=E(p/.16)*(1-E((p-.40)/.23));if(a<=0)return;
 const x=s.origin.x,y=s.origin.y-96;
 g.save();g.translate(x,y);g.globalAlpha*=a;
 const glow=g.createRadialGradient(0,0,5,0,0,112);glow.addColorStop(0,"rgba(67,112,33,.30)");glow.addColorStop(.7,"rgba(104,212,56,.27)");glow.addColorStop(1,"rgba(119,221,64,0)");
 g.save();g.scale(.62,1);g.fillStyle=glow;g.fillRect(-112,-112,224,224);g.restore();
 for(let j=0;j<3;j++){
  g.strokeStyle=["#294e22","#82cb3f","#d4ff91"][j];g.lineWidth=[18,7,2][j];g.beginPath();
  for(let i=0;i<=24;i++){const a=i*TAU/24,r=87+Math.sin(i*2.3+p*14)*4;const xx=Math.cos(a)*r*.60,yy=Math.sin(a)*r;i?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.closePath();g.stroke();
 }
 for(let i=0;i<18;i++){const a=i*2.399+p*5,xx=Math.cos(a)*62,yy=Math.sin(a)*93;polygon(g,[[xx,yy-9],[xx+9,yy-3],[xx+5,yy+8],[xx-5,yy+4]],i%2?"#70ad39":"#c7ec63");}
 g.restore();
}
function draw(g,h){g.save();g.globalAlpha*=h.alpha;g.translate(h.x,h.y);g.scale(h.dir,1);tile(g,h.frame,-h.w*.50,-h.w*170/CELL,h.w);g.restore();}
function trail(g,h){
 g.save();g.globalAlpha*=h.alpha;
 // Separate layered tapered ribbons, drawn behind each moving herd.
 const strength=h.alpha*h.speed;
 for(let i=0;i<6;i++){
  const len=(185+i%3*48)*(.45+.55*h.speed),y=h.y-h.w*(.16+i*.075),x=h.x-h.dir*h.w*.18;
  const wave=Math.sin(h.phase*5+i*1.8)*12,tail=x-h.dir*len;
  const grad=g.createLinearGradient(tail,y,x,y);
  grad.addColorStop(0,'rgba(70,195,37,0)');grad.addColorStop(.5,'rgba(96,225,50,.42)');grad.addColorStop(1,i%2?'rgba(203,255,138,.9)':'rgba(103,242,63,.88)');
  g.globalAlpha=strength*.8;
  polygon(g,[[tail,y+wave],[x-h.dir*len*.52,y-10+i%3*3],[x,y-7],[x+h.dir*18,y],[x,y+5],[x-h.dir*len*.43,y+8]],grad);
  g.globalAlpha=strength*.85;
  polygon(g,[[tail+h.dir*len*.23,y+wave*.65],[x-h.dir*len*.34,y-3],[x+h.dir*8,y],[x-h.dir*len*.36,y+2]],i%2?'#deffae':'#a6ff66');
 }
 for(let i=0;i<18;i++){const q=(h.phase*2+i*.173)%1,xx=h.x-h.dir*(45+q*180+i%3*10),yy=h.y-4-q*32+Math.sin(i*2.4)*13,r=(8+i%4*4)*(1-q);
  g.globalAlpha=h.alpha*(1-q)*.48;
  polygon(g,[[xx-r,yy],[xx-r*.4,yy-r],[xx+r*.7,yy-r*.5],[xx+r,yy+3]],i%2?"#9eaa72":"#6b7350");
 }
 for(let i=0;i<14;i++){const q=(h.phase*3+i*.213)%1,xx=h.x-h.dir*(q*175),yy=h.y-28-q*95+Math.sin(i*2.399)*25;g.globalAlpha=h.alpha*(1-q)*.9;polygon(g,[[xx-8,yy],[xx,yy-5],[xx+8,yy+1],[xx,yy+5]],i%2?"#b5f35b":"#6cba37");}
 g.restore();
}
function impact(g,s,t){
 const q=(s.p-t.hitAt)/.18;if(q<0||q>=1)return;
 const fade=1-E((q-.52)/.48),dir=s.dir;
 g.save();g.translate(t.x,t.y);
 // Immediate faceted contact flash and forward-sweeping impact wedges.
 if(q<.25){
  g.globalAlpha=(1-q/.25)*.95;
  const r=36+q*125;
  const star=Array.from({length:20},(_,i)=>{const a=i*TAU/20,k=i%2?.23:1;return [Math.cos(a)*r*k,-70+Math.sin(a)*r*k];});
  polygon(g,star,'#c7ff78');polygon(g,star.map(([x,y])=>[x*.48,-70+(y+70)*.48]),'#f2ffda');
 }
 for(let j=0;j<3;j++){
  const u=(q-j*.07)/.85;if(u<0||u>=1)continue;
  const r=20+u*155;
  g.globalAlpha=(1-u)*.88;g.strokeStyle=j%2?'#72e43b':'#dcff9e';g.lineWidth=2+7*(1-u);
  g.beginPath();g.ellipse(0,-2,r,r*.26,0,0,TAU);g.stroke();
 }
 g.globalAlpha=fade*.94;
 for(let i=0;i<20;i++){
  const a=i*2.399,r=20+q*(75+i%4*18),x=Math.cos(a)*r+dir*q*24,y=Math.sin(a)*r*.24;
  const h=(55+i%5*17)*Math.sin(Math.PI*Math.min(1,.22+q*1.25));
  polygon(g,[[x-8,y],[x+dir*h*.48,y-h],[x+9,y-3],[x+3,y+5]],i%2?'#a4f45a':'#4baf35');
  polygon(g,[[x-2,y],[x+dir*h*.48,y-h],[x+5,y-3]],'#e0ffac');
 }
 for(let i=0;i<42;i++){
  const a=i*2.399,r=24+q*(95+i%7*15),x=Math.cos(a)*r+dir*q*36,y=Math.sin(a)*r*.25-4*q*(1-q)*(45+i%6*15),d=(4+i%4*2)*(1-q*.6);
  g.globalAlpha=fade*(1-q*.55);
  polygon(g,[[x-d,y],[x+d*.35,y-d*1.5],[x+d,y],[x,y+d*.7]],['#b9f660','#6ab13a','#889367','#e4ffb1'][i%4]);
 }
 g.restore();
}
function shake(ms,duration,targets,dir=1){
 for(const t of targets){
  const dt=ms-t.hitAt*duration;if(dt>=0&&dt<185){const a=(1-dt/185)**2;return {x:dir*Math.cos(dt*.11)*7*a,y:Math.sin(dt*.14)*9*a};}
 }
 return {x:0,y:0};
}
function portrait(g,w,h){const s=Math.min(w*1.08,h*1.15);tile(g,20,(w-s)/2,(h-s)/2,s);}
window.Stampede={ensure,ready,error:()=>lastError,scene,portal,draw,trail,impact,shake,portrait};ensure();
})();
