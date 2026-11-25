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
const STAB=.49,ARRIVE=.70;
function scene(source,target,p){
 const dir=target.x>=source.x?1:-1,scale=1.53,x=500,y=510;
 // Advance through individual poses; anticipation retains the point-down blade and both hands.
 let n=p<STAB?Math.min(12,Math.floor(p/STAB*13)):p<ARRIVE?13+Math.min(4,Math.floor((p-STAB)/(ARRIVE-STAB)*5)):18+Math.min(5,Math.floor((p-ARRIVE)/(1-ARRIVE)*6));
 // Frame 13 is the first ground impact; origin is the actual sword tip.
 const sx=x+dir*(155-128)*scale,sy=y+(230-237)*scale;
 return {x,y,dir,scale,n,p,sx,sy,tx:target.x,ty:target.y,crack:clamp((p-STAB)/(ARRIVE-STAB)),eruption:clamp((p-ARRIVE)/.23)};
}
function draw(g,s){
 g.save();g.globalAlpha*=clamp((1-s.p)/.07);
 frame(g,s.n,s.x,s.y,s.scale,s.dir);g.restore();
}
function poly(g,pts,color){g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function line(g,pts,width,color){g.strokeStyle=color;g.lineWidth=width;g.lineJoin="miter";g.lineCap="round";g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
function fissure(g,s){
 if(s.p<STAB)return;
 const q=s.crack,dx=s.tx-s.sx,dy=s.ty-s.sy,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
 const points=Array.from({length:13},(_,i)=>{const t=i/12,off=(i===0||i===12)?0:Math.sin(i*2.7)*12;return [mix(s.sx,s.tx,t)+nx*off,mix(s.sy,s.ty,t)+ny*off*.6];});
 const k=Math.min(11,Math.floor(q*12)),r=q*12-k;
 const part=points.slice(0,k+1);part.push([mix(points[k][0],points[k+1][0],r),mix(points[k][1],points[k+1][1],r)]);
 g.save();g.globalAlpha=clamp((1-s.p)/.10);
 line(g,part,21,"#251b21");line(g,part,12,"#77321c");line(g,part,6,"#f56b20");line(g,part,2.5,"#ffde60");
 for(let i=1;i<part.length-1;i++){const [x,y]=part[i],sign=i%2?1:-1;const branch=[[x,y],[x+nx*sign*15+dx/d*8,y+ny*sign*12+dy/d*8],[x+nx*sign*29+dx/d*14,y+ny*sign*17+dy/d*14]];line(g,branch,5,"#30201d");line(g,branch,2,"#f98b29");}
 if(q<1){const [x,y]=part.at(-1);for(let i=0;i<6;i++){let a=i*2.399+s.p*18,l=8+(i%3)*7;poly(g,[[x,y],[x+Math.cos(a)*l,y+Math.sin(a)*l*.45],[x+Math.cos(a+.35)*l,y+Math.sin(a+.35)*l*.45]],i%2?"#ffb638":"#ffec98");}}
 g.restore();
}
function geyser(g,s){
 if(s.p<ARRIVE||s.p>=.97)return;
 const q=s.eruption,x=s.tx,y=s.ty,amp=Math.min(1,q*7)*Math.pow(Math.max(0,1-q),.55),h=285*amp,w=64*amp+8;
 g.save();g.globalAlpha=clamp((1-q)*5);
 // The eruption is grounded under the victim. Multiple animated angular sheets rise in place.
 g.fillStyle="#8c391f";g.beginPath();g.ellipse(x,y,w*1.18,13+amp*9,0,0,Math.PI*2);g.fill();
 for(let i=0;i<12;i++){
  const a=i*2.399,offset=Math.sin(a)*w*.78,top=h*(.53+.47*Math.abs(Math.sin(a+q*11))),bend=Math.sin(a+q*18)*w*.46;
  poly(g,[[x+offset-w*.28,y],[x+offset*.85-w*.38,y-top*.48],[x+offset+bend,y-top],[x+offset*.65+w*.34,y-top*.36],[x+offset+w*.30,y]],["#a93419","#e6531e","#ff8f24"][i%3]);
  poly(g,[[x+offset-w*.13,y],[x+offset+bend*.8,y-top*.84],[x+offset+w*.14,y-top*.30],[x+offset+w*.16,y]],i%2?"#ffdf55":"#ffb72e");
 }
 for(let i=0;i<25;i++){
  const a=i*2.399,t=clamp(q*1.8-i%5*.06),spread=(20+i%7*11)*t;
  const px=x+Math.cos(a)*spread,py=y-(70+i%8*26)*Math.sin(t*Math.PI*.85),r=3+i%4*2;
  poly(g,[[px-r,py],[px,py-r*1.4],[px+r,py+r*.1],[px+r*.2,py+r]],i%4===0?"#48302b":i%3===0?"#ffe477":"#ff8130");
 }
 g.restore();
}
function portrait(g,w,h){if(!ready()){ensure();return;}const scale=Math.min(w/218,h/225);frame(g,7,w*.5,h*.96,scale,1);}
window.InfernoTitan={ensure,ready,error:()=>lastError,scene,draw,fissure,geyser,portrait};ensure();
})();