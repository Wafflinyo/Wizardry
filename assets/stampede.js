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
  const start=.19+i*.045,hit=t.hitAt,finish=Math.min(.98,hit+.235);
  if(p<start||p>=finish)continue;
  const u=C((p-start)/(hit-start)),v=C((p-hit)/(finish-hit));
  const w=targets.length>2?250:285,leadOffset=76*w/CELL;
  const hitX=t.x-dir*leadOffset;
  const x=p<hit?L(origin.x,hitX,u):L(hitX,t.x+dir*260,v);
  const y=p<hit?L(origin.y,t.y,E(u)):t.y+v*12;
  const cycle=(p-start)*2.8;
  const frame=Math.floor(cycle*32)%32;
  herds.push({x,y,dir,w,frame,alpha:E((p-start)/.07)*(1-E((p-finish+.065)/.065)),p,phase:cycle,id:t.id});
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
 for(let i=0;i<18;i++){const q=(h.phase*2+i*.173)%1,xx=h.x-h.dir*(45+q*180+i%3*10),yy=h.y-4-q*32+Math.sin(i*2.4)*13,r=(8+i%4*4)*(1-q);
  g.globalAlpha=h.alpha*(1-q)*.48;
  polygon(g,[[xx-r,yy],[xx-r*.4,yy-r],[xx+r*.7,yy-r*.5],[xx+r,yy+3]],i%2?"#9eaa72":"#6b7350");
 }
 for(let i=0;i<14;i++){const q=(h.phase*3+i*.213)%1,xx=h.x-h.dir*(q*175),yy=h.y-28-q*95+Math.sin(i*2.399)*25;g.globalAlpha=h.alpha*(1-q)*.9;polygon(g,[[xx-8,yy],[xx,yy-5],[xx+8,yy+1],[xx,yy+5]],i%2?"#b5f35b":"#6cba37");}
 g.restore();
}
function impact(g,s,t){
 const q=(s.p-t.hitAt)/.16;if(q<0||q>=1)return;
 g.save();g.translate(t.x,t.y);g.globalAlpha*=1-q;
 const r=18+125*q;g.strokeStyle="#b5ee70";g.lineWidth=5*(1-q)+1;g.beginPath();g.ellipse(0,-3,r,r*.25,0,0,TAU);g.stroke();
 for(let i=0;i<16;i++){const a=i*2.399,x=Math.cos(a)*r,y=Math.sin(a)*r*.24,dy=(1-q)*(35+i%5*15);
 polygon(g,[[x-7,y],[x+Math.cos(a)*dy*.4,y-dy],[x+6,y-3]],i%2?"#c9f98a":"#72b83c");}
 for(let i=0;i<22;i++){const a=i*2.399,x=Math.cos(a)*(30+q*130),y=Math.sin(a)*30-4*q*(1-q)*(45+i%6*12);polygon(g,[[x-5,y],[x+2,y-5],[x+8,y],[x+1,y+4]],i%2?"#a4df46":"#568a2d");}
 g.restore();
}
function portrait(g,w,h){const s=Math.min(w*1.08,h*1.15);tile(g,20,(w-s)/2,(h-s)/2,s);}
window.Stampede={ensure,ready,error:()=>lastError,scene,portal,draw,trail,impact,portrait};ensure();
})();
