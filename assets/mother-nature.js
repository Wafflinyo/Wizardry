/* Mother Nature: separate transparent authored 32-frame tree, pollen
 and healing atlases, plus independent 32-pose spreading root geometry. */
(()=>{
"use strict";
const C=192,N=32,clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>{p=clamp(p);return p*p*(3-2*p);},mix=(a,b,t)=>a+(b-a)*t;
const sheets=Object.fromEntries(["tree","pollen","healing"].map(name=>[name,new Image()]));
const valid=img=>img.complete&&img.naturalWidth===C*4&&img.naturalHeight===C*8;
const ready=()=>Object.values(sheets).every(valid);
let pending=null,lastError="";
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 lastError="";
 pending=Promise.all(Object.entries(sheets).map(([name,img])=>valid(img)?Promise.resolve(true):new Promise(resolve=>{
  const timer=setTimeout(()=>{lastError=name+" artwork timed out";resolve(false);},12000);
  img.onload=()=>{clearTimeout(timer);if(!valid(img))lastError=name+" artwork dimensions invalid";resolve(valid(img));};
  img.onerror=()=>{clearTimeout(timer);lastError=name+" artwork failed to load";resolve(false);};
  img.src="./assets/mother-nature-"+name+".webp?v=1";
 }))).then(r=>{if(r.every(Boolean)){lastError="";try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}}return r.every(Boolean);}).finally(()=>pending=null);
 return pending;
}
function tile(g,name,n,x,y,w,h,alpha=1){
 const img=sheets[name];if(!valid(img)||alpha<=0)return;
 n=Math.max(0,Math.min(N-1,Math.floor(n)));
 g.save();g.globalAlpha*=alpha;
 g.drawImage(img,n%4*C,Math.floor(n/4)*C,C,C,x-w/2,y-h,w,h);g.restore();
}
function frame(t){return Math.min(N-1,Math.floor(clamp(t)*N));}
function scene(source,allies,p){
 p=clamp(p);const x=500,y=405;
 // Hold mature tree for the team healing, then play all retreat frames.
 const treePose=p<.44?mix(0,15,ease(p/.44)):p<.74?15+Math.floor((p-.44)/.30*5):mix(20,31,ease((p-.74)/.26));
 return {p,x,y,treePose,allies};
}
function polygon(g,points,fill){
 g.beginPath();g.moveTo(...points[0]);for(const pt of points.slice(1))g.lineTo(...pt);g.closePath();g.fillStyle=fill;g.fill();
}
function roots(g,s){
 const p=s.p,step=Math.round(31*Math.min(ease(p/.27),1-ease((p-.77)/.23)))/31;
 if(step<=0)return;
 g.save();g.translate(s.x,s.y-5);
 // Individually growing angular wooden roots remain on the arena floor.
 for(let i=0;i<9;i++){
  const a=i*Math.PI*2/9+.22,len= (105+(i*47)%100)*step;
  const points=Array.from({length:6},(_,j)=>{
   const t=j/5,r=t*len,turn=a+Math.sin(j*1.1+i)*.19*t;
   return [Math.cos(turn)*r,Math.sin(turn)*r*.40-5*Math.sin(t*Math.PI)];
  });
  for(let j=0;j<5;j++){
   const [x,y]=points[j],[x2,y2]=points[j+1],w=(1-j/5)*11*step+1;
   const angle=Math.atan2(y2-y,x2-x),dx=Math.sin(angle)*w,dy=-Math.cos(angle)*w*.66;
   polygon(g,[[x-dx,y-dy],[x+dx,y+dy],[x2+dx*.55,y2+dy*.55],[x2-dx*.55,y2-dy*.55]],"#654224");
   polygon(g,[[x,y-3],[x+dx,y+dy],[x2+dx*.55,y2+dy*.55],[x2,y2-1]],i%3===0?"#877343":"#987044");
  }
 }
 g.restore();
}
function tree(g,s){if(s.p>=1)return;tile(g,"tree",s.treePose,s.x,s.y+15,465,465);}
function pollen(g,s){
 if(s.p<.30||s.p>.95)return;
 const t=(s.p-.30)/.65;
 // Authored pollen layer remains subtle behind the canopy; moving leaves
 // and golden pollen travel independently from its branches to each ally.
 tile(g,"pollen",frame(t),s.x,s.y+4,330,330,.32);
}
function travel(g,s,u){
 if(s.p<.40||s.p>.79)return;
 const t=clamp((s.p-.40)/.39);
 for(let i=0;i<18;i++){
  const q=clamp(t*1.45-i*.025),a=i*2.399;
  if(q<=0||q>=1)continue;
  const x=mix(s.x+Math.cos(a)*145,u.x,q)+Math.sin(q*10+a)*14*(1-q);
  const y=mix(s.y-240+(i%5)*18,u.y-85,q)+Math.sin(q*Math.PI)*-38;
  const k=2+(i%4)*1.3;
  g.save();g.globalAlpha=Math.sin(Math.PI*q)*.9;
  if(i%3===0){
   g.translate(x,y);g.rotate(q*8+a);
   polygon(g,[[-k*2,0],[0,-k],[k*2,0],[0,k]],"#79a73b");
   polygon(g,[[-k*2,0],[0,-k],[k*2,0]],"#b7ce61");
  }else{
   polygon(g,[[x-k,y],[x,y-k],[x+k,y],[x,y+k]],i%2?"#e5c34e":"#a3c553");
  }
  g.restore();
 }
}
function heal(g,s,u,factor=1){
 if(s.p<.49||s.p>.98)return;
 const t=(s.p-.49)/.49,size=235*Math.max(.7,Math.min(2.3,factor));
 tile(g,"healing",frame(t),u.x,u.y+12*factor,size,size,.84);
}
function portrait(g,w,h){const size=Math.min(w*1.12,h*1.13);tile(g,"tree",15,w*.5,h*.98,size,size);}
window.MotherNature={ensure,ready,error:()=>lastError,scene,roots,tree,pollen,travel,heal,portrait};
ensure();
})();
