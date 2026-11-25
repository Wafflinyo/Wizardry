/* Inferno Titan: direct 4×6 WebP pose atlas; ground fissure and target geyser are separate world-space effects. */
(()=>{
"use strict";
const CELL=256,atlas=new Image(),clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
let pending=null,loaded=false,lastError="";
function ready(){return loaded&&atlas.naturalWidth===1024&&atlas.naturalHeight===1536;}
function ensure(){
 if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{
  const timer=setTimeout(()=>{lastError="Titan sprite load timed out";resolve(false);},12000);
  atlas.onload=()=>{clearTimeout(timer);loaded=atlas.naturalWidth===1024&&atlas.naturalHeight===1536;lastError=loaded?"":"Unexpected Titan sprite dimensions";resolve(loaded);if(loaded){try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){console.warn(e);}}};
  atlas.onerror=()=>{clearTimeout(timer);lastError="Could not load Titan sprite atlas";resolve(false);};
  atlas.src="./assets/inferno-titan-frames.webp?v=1";
 }).finally(()=>{pending=null;});return pending;
}
function frame(g,n,x,y,scale,dir){
 if(!ready())return;
 n=Math.max(0,Math.min(23,n|0));g.save();g.translate(x,y);g.scale(dir*scale,scale);
 g.imageSmoothingEnabled=true;g.drawImage(atlas,n%4*CELL,Math.floor(n/4)*CELL,CELL,CELL,-128,-237,CELL,CELL);g.restore();
}
const DURATION=5400,STAB=.43,ARRIVE=.58,HIT=.61;
const chunks=new Image();chunks.src="./assets/volcanic-chunks.webp";
const hash=n=>{const x=Math.sin(n*91.413+6.7)*43758.5453;return x-Math.floor(x);};
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const poseTimes=[0,.045,.09,.135,.18,.215,.25,.275,.30,.324,.348,.373,.415,.43,.45,.48,.51,.55,.59,.63,.68,.76,.85,.91];
function scene(source,target,p){
 const dir=target.x>=source.x?1:-1,scale=1.53,x=500,y=510;
 let n=0;while(n<23&&p>=poseTimes[n+1])n++;
 // The anticipation is deliberately slower than the final 81 ms sword plunge.
 const sx=x+dir*(155-128)*scale,sy=y+(230-237)*scale;
 return {x,y,dir,scale,n,p,sx,sy,tx:target.x,ty:target.y,crack:clamp((p-STAB)/(ARRIVE-STAB)),eruption:clamp((p-ARRIVE)/.32)};
}
function draw(g,s){
 g.save();g.globalAlpha*=clamp((1-s.p)/.07);
 frame(g,s.n,s.x,s.y,s.scale,s.dir);g.restore();
}
function poly(g,pts,color){g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function rock(g,x,y,size,angle,hot=0){
 g.save();g.translate(x,y);g.rotate(angle);
 const pts=[[-.51,-.22],[-.25,-.52],[.26,-.48],[.53,-.12],[.38,.38],[-.18,.52],[-.51,.22]].map(([a,b])=>[a*size,b*size]);
 const m=[-size*.08,-size*.06];
 poly(g,pts,"#332926");poly(g,[pts[0],pts[1],pts[2],m],"#75605a");
 poly(g,[pts[0],m,pts[5],pts[6]],"#52403b");poly(g,[m,pts[2],pts[3],pts[4]],"#947369");poly(g,[m,pts[4],pts[5]],"#45342e");
 if(hot)poly(g,[pts[0],m,pts[4],[m[0]+size*.08,m[1]-size*.035]],hot>.6?"#ffc24d":"#da5422");
 g.restore();
}
function molten(g,x,y,size,phase){
 if(!chunks.naturalWidth){rock(g,x,y,size,phase,1);return;}
 const cell=chunks.naturalWidth/4,n=((Math.floor(phase*16)%16)+16)%16;
 g.drawImage(chunks,n%4*cell,Math.floor(n/4)*cell,cell,cell,x-size/2,y-size/2,size,size);
}
function glow(g,x,y,r,strength,flatten=1){
 if(strength<=0)return;
 g.save();g.translate(x,y);g.scale(1,flatten);
 const grad=g.createRadialGradient(0,0,0,0,0,r);
 grad.addColorStop(0,"rgba(255,191,65,"+strength+")");
 grad.addColorStop(.35,"rgba(255,105,27,"+strength*.55+")");grad.addColorStop(1,"rgba(255,69,12,0)");
 g.fillStyle=grad;g.fillRect(-r,-r,r*2,r*2);g.restore();
}
function fissure(g,s){
 if(s.p<STAB)return;
 const q=s.crack,age=(s.p-STAB)*DURATION,dx=s.tx-s.sx,dy=s.ty-s.sy,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,nx=-uy,ny=ux;
 const count=Math.max(9,Math.min(18,Math.ceil(d/23)));
 const pts=Array.from({length:count+1},(_,i)=>{
  const t=i/count,zig=i===0||i===count?0:(hash(i*13+3)-.5)*34;
  return {x:mix(s.sx,s.tx,t)+nx*zig,y:mix(s.sy,s.ty,t)+ny*zig*.56,w:i===count?17:7+hash(i+12)*13};
 });
 const k=Math.min(count-1,Math.floor(q*count)),r=q*count-k;
 const tip={x:mix(pts[k].x,pts[k+1].x,r),y:mix(pts[k].y,pts[k+1].y,r),w:mix(pts[k].w,pts[k+1].w,r)};
 const part=[...pts.slice(0,k+1),tip];
 const offset=(p,w)=>[p.x+nx*w,p.y+ny*w*.56];
 const fade=1-smooth((s.p-.88)/.12);
 g.save();g.globalAlpha*=fade;
 // Ground-plane lighting follows the opening fissure, not the entire arena.
 for(let i=0;i<part.length;i+=2)glow(g,part[i].x,part[i].y,38,.14,.38);
 for(let i=1;i<part.length;i++){
  const a=part[i-1],b=part[i],open=smooth((q-(i-1)/count)*count*1.25),wa=a.w*open,wb=b.w*open;
  const left=offset(a,-wa),right=offset(a,wa),bl=offset(b,-wb),br=offset(b,wb);
  // Torn top slabs, visible dark sidewalls, and an irregular molten channel below.
  poly(g,[offset(a,-wa-8),offset(b,-wb-7),bl,left],"#655047");
  poly(g,[right,br,offset(b,wb+8),offset(a,wa+7)],"#372c2d");
  poly(g,[left,bl,br,right],"#20191b");
  poly(g,[offset(a,-wa*.65),offset(b,-wb*.72),offset(b,wb*.53),offset(a,wa*.6)],"#ae3b1d");
  poly(g,[offset(a,-wa*.38),offset(b,-wb*.46),offset(b,wb*.35),offset(a,wa*.32)],i%3?"#f17122":"#ff9a2d");
  const shift=(hash(i+42)-.5)*.32;
  poly(g,[offset(a,wa*(shift-.13)),offset(b,wb*(shift-.23)),offset(b,wb*(shift+.10)),offset(a,wa*(shift+.19))],"#ffd36b");
  if(i<part.length-1&&i%2){
   const sign=hash(i+99)>.5?1:-1,reach=17+hash(i+30)*26;
   const base=offset(b,sign*wb*.7),mid=[b.x+nx*sign*reach*.65+ux*8,b.y+ny*sign*reach*.36+uy*8],end=[b.x+nx*sign*reach+ux*19,b.y+ny*sign*reach*.55+uy*19];
   poly(g,[base,[mid[0]-3,mid[1]-2],end,[mid[0]+3,mid[1]+2]],"#211a1b");
   poly(g,[base,mid,end,[mid[0]+1.5,mid[1]+1.2]],"#f07926");
  }
  // Slabs and sparks are thrown up just behind the advancing split.
  const local=(q-(i-1)/count)*count*0.11;
  if(local>0&&local<.70){
   const t=local/.70;
   for(let j=0;j<3;j++){
    const sign=j%2?1:-1,travel=10+hash(i*10+j)*32,px=b.x+nx*sign*travel*t,py=b.y+ny*sign*travel*.42*t-4*(16+hash(i+j+15)*35)*t*(1-t);
    g.save();g.globalAlpha*=1-t;rock(g,px,py,7+hash(i*7+j)*12,j+t*3,.7);g.restore();
   }
  }
 }
 if(q<1)glow(g,tip.x,tip.y,48,.55,.55);
 // Sharp impact flash and outward fragments from the blade, with no extra damage event.
 const impact=age/480;
 if(impact<1){
  glow(g,s.sx,s.sy,102*(.55+impact*.6),.55*(1-impact),.4);
  for(let i=0;i<18;i++){
   const a=i*2.399,reach=impact*(24+hash(i+5)*89);
   g.save();g.globalAlpha*=1-impact;
   rock(g,s.sx+Math.cos(a)*reach,s.sy+Math.sin(a)*reach*.36-4*(22+hash(i+60)*72)*impact*(1-impact),5+hash(i+13)*13,a+impact*4,.7);g.restore();
  }
 }
 g.restore();
}
// A continuous molten fountain, built as irregular faceted streams rather than
// repeated spikes. All streams remain anchored to the target's ground point.
function ribbon(g,x,y,height,width,bend,phase,colors){
 const N=10,ls=[],rs=[],centers=[];
 for(let i=0;i<=N;i++){
  const t=i/N,flow=Math.sin(t*8-phase)*width*.13*Math.sin(Math.PI*t),
    cx=x+bend*t*t+flow,cy=y-height*t,wide=width*(.72+.48*Math.sin(t*Math.PI))*(1-t*.78);
  const a=wide*(.83+hash(i+Math.floor(phase*2))* .3),b=wide*(.85+hash(i+32)*.3);
  ls.push([cx-a,cy]);rs.push([cx+b,cy]);centers.push([cx+wide*.08*Math.sin(t*12),cy]);
 }
 for(let i=0;i<N;i++){
  poly(g,[ls[i],ls[i+1],centers[i+1],centers[i]],colors[(i+1)%2]);
  poly(g,[centers[i],centers[i+1],rs[i+1],rs[i]],colors[2+i%2]);
 }
}
function geyser(g,s){
 if(s.p<ARRIVE||s.p>=.94)return;
 const age=(s.p-ARRIVE)*DURATION,q=s.eruption,x=s.tx,y=s.ty;
 const grow=1-Math.pow(1-clamp(age/260),3),fall=1-smooth((age-700)/1150),amp=grow*fall;
 const height=325*amp,width=52*(.55+.45*amp),phase=age*.020;
 g.save();g.globalAlpha*=1-smooth((age-1300)/650);
 glow(g,x,y,115,.48*fall,.36);
 // Jagged vent and glowing lava pool, kept in the floor plane.
 const rim=Array.from({length:14},(_,i)=>{const a=i*Math.PI/7,r=width*(1.05+hash(i+80)*.34);return [x+Math.cos(a)*r,y+Math.sin(a)*r*.34];});
 poly(g,rim,"#382627");
 poly(g,rim.map(([px,py])=>[mix(x,px,.83),mix(y,py,.83)]),"#b83a1e");
 poly(g,rim.map(([px,py])=>[mix(x,px,.65),mix(y,py,.65)]),"#f88b2a");
 if(height>2){
  ribbon(g,x-width*.29,y,height*.85,width*.43,-width*.96,phase+.6,["#b13b1e","#ed5a22","#d8491d","#ff8e2e"]);
  ribbon(g,x+width*.29,y,height*.80,width*.43,width*1.15,phase+1.7,["#dc4b20","#ff902c","#a82f18","#ef5c1f"]);
  ribbon(g,x,y,height,width*.50,width*.12*Math.sin(phase),phase,["#ff8b24","#ffb337","#ff9c2d","#ffd56c"]);
  ribbon(g,x-width*.04,y,height*.84,width*.22,-width*.12,phase+2,["#ffdf73","#fff2b3","#ffc24a","#ffe28b"]);
 }
 // Ballistic streams of rendered molten chunks. Staggered releases keep the
 // plume flowing upwards, spreading at its crest, and raining back down.
 for(let i=0;i<38;i++){
  const launch=(i%8)*43+Math.floor(i/8)*105,t=(age-launch)/1050;
  if(t<0||t>1.06)continue;
  const speed=210+hash(i+12)*235,spread=(hash(i+100)-.5)*218,
    px=x+spread*t+(hash(i+19)-.5)*21,
    py=y-speed*t+speed*.84*t*t;
  if(py>y+5)continue;
  const size=(8+hash(i+6)*26)*(1-t*.48);
  g.save();g.globalAlpha*=Math.min(1,(1.06-t)*5);
  if(i%5===0)rock(g,px,py,size*.82,phase*.15+i,.8);else molten(g,px,py,size,t+i*.23);
  g.restore();
 }
 // Fast low expanding flash of molten droplets across the floor.
 const shock=age/390;if(shock<1){glow(g,x,y,82+shock*80,.40*(1-shock),.35);
  for(let i=0;i<15;i++){
   const a=i*2.399,r=(35+hash(i+67)*90)*shock;
   g.save();g.globalAlpha*=1-shock;molten(g,x+Math.cos(a)*r,y+Math.sin(a)*r*.32-4*shock*(1-shock)*22,8+hash(i+5)*13,shock+i*.11);g.restore();
  }
 }
 g.restore();
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