/* Hellhound: 32 newly illustrated poses, compressed as a video only for transport.
   Decoded once into individually alpha-cleaned canvases. No actor rotation or scaling animation. */
(()=>{
"use strict";
const N=32,CELL=192,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
let frames=[],pending=null;
const wait=(v,event,action)=>new Promise((resolve,reject)=>{
 const clear=()=>{clearTimeout(timer);v.removeEventListener(event,ok);v.removeEventListener("error",bad);};
 const ok=()=>{clear();resolve();},bad=()=>{clear();reject(Error("Hellhound animation could not load"));};
 const timer=setTimeout(bad,15000);v.addEventListener(event,ok,{once:true});v.addEventListener("error",bad,{once:true});
 try{action?.();}catch(e){clear();reject(e);}
});
async function ensure(){
 if(frames.length===N)return true;if(pending)return pending;
 pending=(async()=>{
  const v=document.createElement("video");v.muted=true;v.playsInline=true;v.preload="auto";v.setAttribute("playsinline","");
  v.src="./assets/hellhound-poses-v2.mp4";
  try{
   if(v.readyState<1)await wait(v,"loadedmetadata",()=>v.load());
   const next=[];
   for(let n=0;n<N;n++){
    const time=(n+.5)/10;
    await wait(v,"seeked",()=>{v.currentTime=time;});
    const tile=document.createElement("canvas");tile.width=tile.height=CELL;
    const g=tile.getContext("2d",{willReadFrequently:true});g.drawImage(v,0,0,CELL,CELL);
    const pixels=g.getImageData(0,0,CELL,CELL),d=pixels.data;
    for(let i=0;i<d.length;i+=4){
      const x=i/4%CELL,y=Math.floor(i/4/CELL),m=Math.max(d[i],d[i+1],d[i+2]);
      // Black was solely the compression matte. Remove it without whitening dark facets.
      const alpha=clamp((m-11)/24);
      if(alpha===0||x<4||x>=188||y<4||y>=188){d[i]=d[i+1]=d[i+2]=d[i+3]=0;continue;}
      // Remove outward baked jets only outside the head silhouette; the arena draws
      // continuous flames from the mouths to the true target coordinates instead.
      const cutoff=(n===15&&x>126&&y>98&&y<151&&d[i]>135&&d[i+1]>55&&d[i]>d[i+2]*1.8)||
        ((n===18||n===19)&&x<45&&y>71&&y<114)||
        ((n===22||n===23)&&x>164&&y>65&&y<111);
      if(cutoff){d[i]=d[i+1]=d[i+2]=d[i+3]=0;continue;}
      d[i+3]=Math.round(alpha*255);
      if(alpha<1){for(let k=0;k<3;k++)d[i+k]=Math.min(255,d[i+k]/Math.max(alpha,.25));}
    }
    g.putImageData(pixels,0,0);next.push(tile);
   }
   frames=next;window.WIZARDRY_ARENA_TEST?.drawCardArts();return true;
  }catch(e){console.warn(e);return false;}finally{v.removeAttribute("src");v.load();}
 })().finally(()=>{pending=null;});return pending;
}
function frame(g,n,x,y,size,dir){
 const tile=frames[Math.max(0,Math.min(31,n|0))];if(!tile)return;
 g.save();g.translate(x,y);g.scale(dir,1);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(tile,-size*.5,-size*.87,size,size);g.restore();
}
function scene(source,target,entries,p){
 const dir=target.x>=source.x?1:-1,size=270, x=500,y=510;
 const n=Math.min(31,Math.floor(p*32));
 const mouths=[[110,103],[47,82],[162,82]];
 const streams=entries.filter(e=>p>=e.start&&p<e.end).map(e=>{
  const [mx,my]=mouths[e.head],q=clamp((p-e.start)/(e.end-e.start));
  return {sx:x+dir*(mx/CELL-.5)*size,sy:y+(my/CELL-.87)*size,x:e.x,y:e.y,ty:e.y-74,q,phase:p*100};
 });
 return {dir,size,x,y,n,p,streams};
}
function draw(g,s){
 g.save();g.globalAlpha=.23*Math.min(clamp(s.p/.12),clamp((1-s.p)/.13));g.fillStyle="#251c20";
 g.beginPath();g.ellipse(s.x,s.y,83,17,0,0,Math.PI*2);g.fill();g.restore();
 frame(g,s.n,s.x,s.y,s.size,s.dir);
 if(s.p>.86){
  const q=clamp((s.p-.86)/.14);g.save();g.globalAlpha=1-q;
  for(let i=0;i<28;i++){
   const a=i*2.399,r=q*(15+i%6*10),x=s.x+Math.cos(a)*r+(i%7-3)*13,y=s.y-32-(i%5)*16-q*(30+i%5*11);
   g.fillStyle=i%3===0?"#ec8a3d":i%3===1?"#79706c":"#403c3b";g.fillRect(x,y,2+i%4,2+i%3);
  }g.restore();
 }
}
function poly(g,points,color){g.fillStyle=color;g.beginPath();for(let i=0;i<points.length;i++)i?g.lineTo(...points[i]):g.moveTo(...points[i]);g.closePath();g.fill();}
function flame(g,s){
 const dx=s.x-s.sx,dy=s.ty-s.sy,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
 const travel=clamp(s.q/.28),fade=clamp((1-s.q)/.22),reach=travel*len;
 g.save();g.globalAlpha=fade;
 // Staggered moving tongues, expanding as they approach the target; opaque faceted
 // orange outer flame and golden inner flame rather than a neon beam.
 for(let k=0;k<21;k++){
  const t=k/20;if(t>travel)continue;
  const d=t*len,w=(5+25*t)*(.7+.3*Math.sin(s.phase+k*1.7)),j=Math.sin(k*2.41+s.phase*.7)*w*.55;
  const x=s.sx+ux*d+nx*j,y=s.sy+uy*d+ny*j,tip=Math.min(25,reach-d+8);
  const a=[x-ux*8+nx*w,y-uy*8+ny*w],b=[x+ux*tip,y+uy*tip],c=[x-ux*11-nx*w,y-uy*11-ny*w];
  poly(g,[a,b,c,[x-ux*18,y-uy*18]],["#b83b20","#ed5c23","#f68b2c"][k%3]);
  poly(g,[[x+nx*w*.38,y+ny*w*.38],b,[x-nx*w*.38,y-ny*w*.38]],k%3?"#ffc24d":"#ffe593");
 }
 if(s.q>.3){const q=clamp((s.q-.3)/.7);for(let k=0;k<13;k++){const a=k*2.399+s.phase*.06,r=(12+q*40)*(k%4+1)/4,x=s.x+Math.cos(a)*r,y=s.ty+Math.sin(a)*r-q*22;poly(g,[[x-3,y],[x+5,y-8],[x+4,y+3]],k%2?"#ffb646":"#f1682d");}}
 g.restore();
}
function portrait(g,w,h){if(frames.length!==N){ensure();return;}const size=Math.min(w*1.02,h*1.18);frame(g,8,w/2,h*.93,size,1);}
window.HellhoundArt={ensure,scene,draw,flame,portrait,ready:()=>frames.length===N};
})();