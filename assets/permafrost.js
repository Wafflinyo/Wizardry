/* Permafrost: 32 growth stages. The original battlefield geometry and
 * floor shading stay intact; crystalline frost spreads across its surface. */
(()=>{
"use strict";
const C=x=>Math.max(0,Math.min(1,x)),E=x=>{x=C(x);return x*x*(3-2*x);},TAU=Math.PI*2;
function rand(i){const r=Math.sin(i*127.1+413.7)*43758.5453;return r-Math.floor(r);}
function poly(g,p,c){g.fillStyle=c;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
let source=null,frozen=null;
function freezeMaterial(bg){
 if(!bg)return null;if(source===bg&&frozen)return frozen;
 const c=document.createElement("canvas");c.width=bg.width;c.height=bg.height;
 const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(bg,0,0);
 const im=g.getImageData(0,0,c.width,c.height),d=im.data;
 for(let i=0;i<d.length;i+=4){
  const x=(i/4%c.width)/c.width,y=Math.floor(i/4/c.width)/c.height;
  const lum=.299*d[i]+.587*d[i+1]+.114*d[i+2];
  const floor=C((y-.40)*5),a=.30+floor*.40;
  const r=lum*.78+24+floor*14,gg=lum*1.06+44+floor*20,bb=lum*1.17+65+floor*25;
  d[i]=d[i]*(1-a)+r*a;d[i+1]=d[i+1]*(1-a)+gg*a;d[i+2]=d[i+2]*(1-a)+bb*a;
 }
 g.putImageData(im,0,0);source=bg;frozen=c;return c;
}
function spike(g,x,y,h,w,lean,alpha){
 const a=[x-w,y-3],b=[x+lean,y-h],c=[x+w,y],d=[x+w*.10,y-h*.29],e=[x+w*.05,y+5];
 g.globalAlpha=alpha;
 poly(g,[a,b,c,e],"#437c9d");poly(g,[a,b,d],"#a8d9ee");poly(g,[b,c,d],"#579fc6");
 poly(g,[a,d,e],"#7fb7d5");poly(g,[d,c,e],"#326a91");
 poly(g,[b,[x+lean*.82-w*.14,y-h*.78],d],"#e1f5ff");
}
const clusters=[[32,290,66],[140,258,43],[247,267,36],[370,247,30],[630,247,30],[753,267,36],[860,258,43],[968,290,66],[12,484,84],[988,484,84],[52,583,70],[172,604,45],[828,604,45],[948,583,70]];
function landscape(g,{x=0,y=0,width=1000,height=620,time=0,strength=1,background=null}={}){
 const s=C(strength);if(s<=0)return;
 g.save();g.translate(x,y);g.scale(width/1000,height/620);
 const m=freezeMaterial(background);
 if(m){g.globalAlpha=s;g.drawImage(m,0,0,1000,620);}
 // Translucent crystalline plates conform to the existing floor. No
 // opaque replacement platform, no change to elevation or arena edges.
 g.save();g.beginPath();g.ellipse(500,408,462,129,0,0,TAU);g.clip();
 const spread=E(s),radius=40+470*spread;
 g.beginPath();g.ellipse(500,408,radius,18+114*spread,0,0,TAU);g.clip();
 for(let j=0;j<9;j++)for(let i=0;i<17;i++){
  const n=j*17+i,xx=12+i*61+(j%2)*28,yy=286+j*33,rx=35+rand(n)*9,ry=15+rand(n+400)*6;
  const pts=[[xx-rx,yy],[xx-7,yy-ry],[xx+rx,yy-4],[xx+7,yy+ry]];
  g.globalAlpha=s*(.12+rand(n+20)*.19);
  poly(g,pts,["#7ac7e7","#c8f1ff","#537f9c"][n%3]);
  g.globalAlpha=s*.18;poly(g,[pts[0],pts[1],pts[2]],"#d9f4ff");
  if(n%3===0){g.globalAlpha=s*.45;g.strokeStyle="#b5e7f8";g.lineWidth=.8;g.beginPath();g.moveTo(...pts[0]);g.lineTo(...pts[1]);g.lineTo(...pts[2]);g.stroke();}
 }
 // Branching hairline frost following the perspective of the floor.
 for(let i=0;i<18;i++){
  const a=i*TAU/18+.16,r=80+rand(i+700)*340;
  let xx=500,yy=414;g.beginPath();g.moveTo(xx,yy);
  for(let j=1;j<=5;j++){xx=500+Math.cos(a)*r*j/5+(rand(i*11+j)-.5)*18;yy=414+Math.sin(a)*r*j/5*.25+(rand(i*11+j+500)-.5)*9;g.lineTo(xx,yy);}
  g.globalAlpha=s*.40;g.strokeStyle="#c7efff";g.lineWidth=1.2;g.stroke();
 }
 g.restore();
 // Coat the near rim and lower foreground as well. Keep the original
 // stone geometry visible beneath a translucent frost finish.
 g.save();
 const near=E((s-.30)/.70);
 const frontFrost=g.createLinearGradient(0,520,0,620);
 frontFrost.addColorStop(0,"rgba(160,218,241,0)");
 frontFrost.addColorStop(.35,"rgba(155,213,237,.24)");
 frontFrost.addColorStop(1,"rgba(167,222,245,.36)");
 g.globalAlpha=near;g.fillStyle=frontFrost;g.fillRect(0,520,1000,100);
 for(let i=0;i<26;i++){
  const xx=i*40-12,yy=564+rand(i+1800)*48,rx=17+rand(i+1900)*20,ry=4+rand(i+2000)*7;
  g.globalAlpha=near*(.11+rand(i+2100)*.16);
  poly(g,[[xx-rx,yy],[xx-4,yy-ry],[xx+rx,yy-2],[xx+5,yy+ry]],"#b5e4f8");
 }
 g.restore();
 // Crystals grow at staggered perimeter anchors, not on the combat slots.
 for(let i=0;i<clusters.length;i++){
  const [cx,cy,size]=clusters[i],phase=E((s-.12-i%5*.055)/.70);
  if(phase<=0)continue;
  const step=Math.max(1,Math.ceil(phase*31))/31;
  for(let j=0;j<3;j++){
   const k=j===1?1:.49+rand(i*3+j)*.18;
   spike(g,cx+(j-1)*size*.27,cy+Math.abs(j-1)*5,size*k*step,size*.17*k,(j-1)*size*.26*step,s*.94);
  }
 }
 g.restore();
}
function draw(g,{width,height,time=0,strength=1}){
 const s=C(strength);if(s<=0)return;
 g.save();
 // Low, subtle moving cold air: no opaque fog circles or hidden characters.
 const mist=g.createLinearGradient(0,height*.55,0,height);
 mist.addColorStop(0,"rgba(191,228,247,0)");
 mist.addColorStop(.55,"rgba(176,218,239,.07)");
 mist.addColorStop(.85,"rgba(189,225,243,.14)");
 mist.addColorStop(1,"rgba(191,228,247,0)");
 g.globalAlpha=s;g.fillStyle=mist;g.fillRect(0,height*.55,width,height*.45);
 for(let i=0;i<72;i++){
  const x=((rand(i+900)*width-time*(.013+rand(i+12)*.018)+Math.sin(time*.001+i)*8)%width+width)%width;
  const y=((rand(i+1100)*height+time*(.009+rand(i+22)*.018))%height+height)%height;
  const r=.65+rand(i+1200)*1.65;g.globalAlpha=s*(.20+rand(i+1400)*.55);
  poly(g,[[x-r,y],[x,y-r*1.3],[x+r,y],[x,y+r*1.3]],"#e0f6ff");
 }
 g.restore();
}
function portrait(g,w,h,bg){g.save();if(bg)g.drawImage(bg,0,0,w,h);else{g.fillStyle="#17374f";g.fillRect(0,0,w,h);}landscape(g,{width:w,height:h,strength:1,background:bg});draw(g,{width:w,height:h,time:0,strength:1});g.restore();}
window.Permafrost={ensure:()=>Promise.resolve(true),ready:()=>true,landscape,draw,portrait,frameCount:32};
})();
