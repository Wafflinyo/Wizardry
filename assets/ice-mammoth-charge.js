/* Mammoth Ice Shard: 32 illustrated charge poses; granular snow spray with ground-contact emission. */
(()=>{
"use strict";
const W=220,H=220,GROUND_DROP=22,atlas=new Image(),C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>{p=C(p);return p*p*(3-2*p);};
let pending=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===1760&&atlas.naturalHeight===880;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/ice-mammoth-charge-32.webp?v=0.355.17";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function scene(source,target,p,hit=.72,factor=1){
 p=C(p);const dir=source.team===0?1:-1,scale=1.48,origin={x:500-dir*120,y:510+GROUND_DROP},contact={x:target.x-dir*(125+26*factor),y:target.y+6+GROUND_DROP},dash=.34;
 const u=C((p-dash)/(hit-dash)),run=u*u*(2-u);
 let frame=p<.23?Math.min(7,Math.floor(p/.23*8)):p<dash?8+Math.min(3,Math.floor((p-.23)/(dash-.23)*4)):p<hit?12+Math.min(11,Math.floor(u*12)):24+Math.min(7,Math.floor((p-hit)/(1-hit)*8));
 return{x:L(origin.x,contact.x,run),y:L(origin.y,contact.y,E(u)),dir,scale,origin,contact,target:{x:target.x,y:target.y},factor,frame,p,hit,dash,alpha:1-E((p-hit-.04)/.20)};
}
function tile(g,n,x,y,w,h){g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function draw(g,s){if(!ready()||s.alpha<=0)return;g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";tile(g,s.frame,-W*s.scale/2,-H*s.scale*.91,W*s.scale,H*s.scale);g.restore();}
function poly(g,pts,fill){g.fillStyle=fill;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function shard(g,x,y,r,a){g.save();g.translate(x,y);g.rotate(a);poly(g,[[-r,0],[-r*.2,-r*.48],[r,0],[-r*.2,r*.48]],"#58b9e8");poly(g,[[-r,0],[-r*.2,-r*.48],[r,0]],"#d8f6ff");poly(g,[[-r,0],[r,0],[-r*.2,r*.48]],"#3483bb");g.restore();}
function footAt(s,p){
 const u=C((p-s.dash)/(s.hit-s.dash));return{x:L(s.origin.x,s.contact.x,u*u*(2-u)),y:L(s.origin.y,s.contact.y,E(u))};
}
// A granular powder wake: every plume comes from an actual ground
// contact and remains in world space. No solid wall or luminous cloud.
const TAU=Math.PI*2;
function noise(i){const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);}
function grain(g,x,y,r,a,color,alpha){
 g.globalAlpha=alpha;g.fillStyle=color;
 const dx=Math.cos(a)*r,dy=Math.sin(a)*r;
 g.beginPath();g.moveTo(x-dx,y-dy);g.lineTo(x-dy*.55,y+dx*.55);g.lineTo(x+dx,y+dy);g.lineTo(x+dy*.45,y-dx*.45);g.closePath();g.fill();
}
function powder(g,x,y,rx,ry,opacity){
 if(opacity<=0)return;
 g.save();g.translate(x,y);g.scale(rx,ry);
 const grad=g.createRadialGradient(0,0,0,0,0,1);
 grad.addColorStop(0,"rgba(206,225,232,.78)");
 grad.addColorStop(.36,"rgba(213,232,239,.58)");
 grad.addColorStop(.70,"rgba(174,206,221,.23)");
 grad.addColorStop(1,"rgba(174,206,221,0)");
 g.globalAlpha=opacity;g.fillStyle=grad;
 g.beginPath();g.ellipse(0,0,1,1,0,0,TAU);g.fill();g.restore();
}
function fragment(g,x,y,r,a,alpha){
 g.globalAlpha=alpha;g.save();g.translate(x,y);g.rotate(a);
 const v=[[-r*.7,r*.25],[-r*.25,-r*.70],[r*.46,-r*.42],[r*.82,r*.16],[r*.15,r*.63]];
 poly(g,v,"#72a9c4");
 poly(g,[v[0],v[1],v[2],[0,0]],"#d1ecf5");
 poly(g,[[0,0],v[2],v[3],v[4]],"#5192b2");
 poly(g,[v[0],[0,0],v[4]],"#a4d2e6");g.restore();
}
function trail(g,s,front=false){
 const p=s.p;if(p<.035||p>s.hit+.25)return;
 const k=s.scale/1.48,fade=1-E((p-s.hit-.04)/.21),run=E((p-s.dash)/.06),rise=E((p-.035)/.14);
 const strength=fade*rise;
 g.save();
 if(!front){
  g.globalAlpha=strength*.25;g.fillStyle="#203749";g.beginPath();g.ellipse(s.x,s.y+15*k,126*k,20*k,0,0,TAU);g.fill();
 }
 // Young, overlapping powder puffs originate at four foot contacts.
 // They grow and disperse backward, with an uneven silhouette and
 // no single hard edge across the mammoth's legs.
 for(let i=0;i<(front?40:30);i++){
  const rate=5+noise(i+12)*2.5,phase=(p*rate+noise(i+40))%1;
  const age=phase*.155,birth=Math.min(s.hit,p-age);
  if(birth<.035)continue;
  const o=footAt(s,birth),foot=i%4,local=(-96+foot*59+((noise(i+80)-.5)*32))*k;
  const drift=(12+run*116)*phase*k;
  const x=o.x+s.dir*(local-drift),y=o.y+(front?15:-6)*k-(8+44*Math.sin(phase*Math.PI*.80))*k;
  const r=(20+noise(i+100)*19+phase*20)*k,life=Math.sin(Math.PI*Math.min(.995,phase+.13));
  powder(g,x,y,r*1.50,r*.72,strength*life*(front?.95:.56));
 }
 // Dense contact spray gives reliable lower-leg concealment while
 // remaining textured. Each fleck follows a ballistic, backward arc.
 for(let i=0;i<(front?160:96);i++){
  const q=(p*(5.8+noise(i+220)*5)+noise(i+420))%1;
  const born=Math.min(s.hit,p-q*.145);if(born<.035)continue;
  const o=footAt(s,born),foot=i%4,local=-96+foot*59+(noise(i+640)-.5)*56;
  const dx=local-s.dir*0;const x=o.x+s.dir*(dx-q*(30+run*(80+noise(i+800)*90)))*k;
  const y=o.y+(front?14:-7)*k-4*q*(1-q)*(17+noise(i+1010)*51)*k;
  const r=(1.4+noise(i+1180)*4.2)*(1-q*.45)*k;
  grain(g,x,y,r,noise(i+1300)*TAU+q*2,["#e9f6f8","#b9dce9","#d4e9ee","#8fb9ce"][i%4],strength*(1-q)*.83);
 }
 // Distinct ice chunks tumble and settle; the snow is the main
 // effect, so the crystals do not look like a spray of diamonds.
 for(let i=0;i<(front?20:16);i++){
  const q=(p*(5+noise(i+1600)*3)+noise(i+1700))%1,born=Math.min(s.hit,p-q*.19);if(born<.035)continue;
  const o=footAt(s,born),local=(noise(i+1800)-.5)*205;
  const x=o.x+s.dir*(local-q*(25+run*140))*k;
  const y=o.y+(front?16:-5)*k-4*q*(1-q)*(24+noise(i+1900)*65)*k;
  fragment(g,x,y,(4+noise(i+2000)*8)*k*(1-q*.30),noise(i+2100)*TAU+s.dir*q*4,strength*(1-q)*.88);
 }
 g.restore();
}
function impact(g,s){
 const q=(s.p-s.hit)/.28;if(q<0||q>=1)return;
 const k=Math.max(.8,s.factor),fade=1-E((q-.20)/.80),floor=s.target.y+10*k;
 g.save();
 // Heavy contact at ground level, with a short directional powder burst.
 for(let i=0;i<26;i++){
  const a=i*2.399,dist=(12+q*(55+noise(i+2300)*100))*k;
  const x=s.target.x+Math.cos(a)*dist+s.dir*q*38*k;
  const y=floor+Math.sin(a)*dist*.24-4*q*(1-q)*(10+noise(i+2400)*43)*k;
  powder(g,x,y,(24+q*36)*k,(14+q*20)*k,fade*.88);
 }
 for(let i=0;i<100;i++){
  const a=i*2.399,dist=(5+q*(50+noise(i+2500)*160))*k;
  const x=s.target.x+Math.cos(a)*dist+s.dir*q*42*k;
  const y=floor+Math.sin(a)*dist*.31-4*q*(1-q)*(20+noise(i+2700)*112)*k;
  grain(g,x,y,(1.7+noise(i+2900)*4)*k,a+q*3,i%2?"#e8f7fc":"#abd3e6",fade*.88);
 }
 for(let i=0;i<29;i++){
  const a=i*2.399,dist=(12+q*(65+noise(i+3100)*145))*k;
  const x=s.target.x+Math.cos(a)*dist+s.dir*q*42*k;
  const y=floor+Math.sin(a)*dist*.28-4*q*(1-q)*(30+noise(i+3300)*115)*k;
  fragment(g,x,y,(7+noise(i+3500)*13)*k*(1-q*.45),a+q*4,fade*.95);
 }
 if(q<.13){
  const r=(26+q*235)*k;
  g.globalAlpha=(1-q/.13)*.75;g.fillStyle="#e5f7ff";
  g.beginPath();g.ellipse(s.target.x,floor-32*k,r,r*.68,0,0,TAU);g.fill();
 }
 g.restore();
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.1;tile(g,4,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.IceMammoth={ensure,ready,scene,draw,trail,impact,portrait,frameCount:32,hit:.72};ensure();
})();
