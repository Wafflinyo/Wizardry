/* Illustrated target effects and a fully opaque Furnace environment with separate authored flame sprites. */
(()=>{
"use strict";
const clamp=p=>Math.max(0,Math.min(1,p));
function make(name,C,R,peak){
 const atlas=new Image();let pending=null,error="";
 const ready=()=>atlas.complete&&atlas.naturalWidth===C*8&&atlas.naturalHeight===R*4;
 function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{
 const timer=setTimeout(()=>{error="Artwork load timed out";resolve(false);},12000);
 atlas.onload=()=>{clearTimeout(timer);error=ready()?"":"Unexpected atlas dimensions";resolve(ready());try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}};
 atlas.onerror=()=>{clearTimeout(timer);error="Unable to load "+name+" frames";resolve(false);};
 atlas.src="./assets/fire-"+name+"-v2.webp?v=1";
 }).finally(()=>{pending=null;});return pending;}
 function tile(g,n,x,y,w,h){if(!ready())return;n=Math.max(0,Math.min(31,Math.floor(n)));g.drawImage(atlas,n%8*C,Math.floor(n/8)*R,C,R,x,y,w,h);}
 function targetFrame(g,u,n,factor,layer,opacity){
   const w=(name==="backdraft"?300:240)*factor,h=w*R/C;
   const x=u.x-w/2,y=u.y-h*.77;
   g.save();g.globalAlpha*=opacity;
   if(name==="ring"&&layer){
     // The lower arc sits in front of the wizard's feet, the upper flames behind the wizard.
     const seam=y+h*.76;
     g.beginPath();
     if(layer==="back")g.rect(x,y,w,seam-y);else g.rect(x,seam,w,y+h-seam);
     g.clip();
   }
   tile(g,n,x,y,w,h);g.restore();
 }
 function draw(g,u,p,factor=1,layer){
   const n=name==="backdraft"?(p<.45?Math.floor(p/.45*16):16+Math.floor((p-.45)/.55*16)):Math.floor(clamp(p)*32);
   targetFrame(g,u,n,factor,layer,Math.min(1,clamp((1-p)/.07)));
 }
 function idle(g,u,time,factor=1,layer){
   const beat=Math.floor(time/105)%12,n=8+(beat<=6?beat:12-beat);
   targetFrame(g,u,n,factor,layer,.92);
 }
 function portrait(g,w,h){const width=Math.min(w*.99,h*C/R),height=width*R/C;tile(g,peak,(w-width)/2,(h-height)/2,width,height);}
 ensure();return {ensure,ready,error:()=>error,draw,idle,portrait};
}
// Full opaque environment artwork, with the same authored flame atlas used by Flashover.
function makeFurnace(){
 const ground=new Image(),flames=new Image(),original=new Image(),smoke=new Image();let pending=null,error="",landscapeArt=null,smokeArt=null;
 const imagesReady=()=>original.complete&&original.naturalWidth===1000&&original.naturalHeight===620&&ground.complete&&ground.naturalWidth===1000&&ground.naturalHeight===620&&flames.complete&&flames.naturalWidth===512&&flames.naturalHeight===256;
 const ready=()=>!!landscapeArt&&imagesReady();
 // Paint the exact approved arena first. The volcanic texture is clipped to the
 // inner stone floor, excluding the original central crystal medallion and gold rim.
 // All original architecture, banners, braziers and exterior pixels remain untouched.
 // The recessed floor is drawn entirely inside the existing platform. Neither the
 // original arena nor its center medallion is shifted or scaled.
 function floorPath(ctx){
   ctx.moveTo(500,302);
   ctx.bezierCurveTo(672,299,804,315,894,357);
   ctx.bezierCurveTo(937,377,965,409,967,439);
   ctx.bezierCurveTo(970,478,924,520,849,544);
   ctx.bezierCurveTo(756,573,625,583,500,583);
   ctx.bezierCurveTo(375,583,244,573,151,544);
   ctx.bezierCurveTo(76,520,30,478,33,439);
   ctx.bezierCurveTo(35,409,63,377,106,357);
   ctx.bezierCurveTo(196,315,328,299,500,302);ctx.closePath();
 }
 function medallionPath(ctx){
   ctx.moveTo(500,355);ctx.lineTo(513,370);
   ctx.bezierCurveTo(575,370,629,390,632,414);
   ctx.bezierCurveTo(636,439,578,461,514,465);
   ctx.lineTo(501,486);ctx.lineTo(486,465);
   ctx.bezierCurveTo(421,461,364,439,369,414);
   ctx.bezierCurveTo(373,390,425,370,487,370);
   ctx.lineTo(500,355);ctx.closePath();
 }
 function compose(){
   const surface=document.createElement("canvas");surface.width=1000;surface.height=620;
   const ctx=surface.getContext("2d");
   ctx.drawImage(original,0,0);
   ctx.save();ctx.beginPath();floorPath(ctx);medallionPath(ctx);ctx.clip("evenodd");
   // Visible inner wall: dark heated stone, with the existing gold lip in front.
   // A larger rear inset implies a lower floor in the arena's viewing angle.
   const wall=ctx.createLinearGradient(0,302,0,583);
   wall.addColorStop(0,"#302325");wall.addColorStop(.38,"#4a2c29");
   wall.addColorStop(.75,"#3b292a");wall.addColorStop(1,"#231c20");
   ctx.fillStyle=wall;ctx.fillRect(0,300,1000,286);
   ctx.save();ctx.beginPath();
   ctx.translate(500,442);ctx.scale(.976,.925);ctx.translate(-500,-442);ctx.translate(0,3);
   floorPath(ctx);ctx.clip();
   // The magma is lowered within the recessed surface, not the entire arena.
   ctx.drawImage(ground,-40,43,1080,645);
   ctx.restore();
   // Shade the inner edge of the floor without changing the original outer rim.
   ctx.save();ctx.beginPath();ctx.translate(500,442);ctx.scale(.976,.925);ctx.translate(-500,-442);ctx.translate(0,3);
   floorPath(ctx);ctx.clip();
   const shade=ctx.createLinearGradient(0,302,0,583);
   shade.addColorStop(0,"rgba(17,12,17,.55)");shade.addColorStop(.14,"rgba(25,13,15,0)");
   shade.addColorStop(.83,"rgba(25,13,15,0)");shade.addColorStop(1,"rgba(16,12,16,.42)");
   ctx.fillStyle=shade;ctx.fillRect(0,300,1000,286);ctx.restore();
   ctx.restore();
   landscapeArt=surface;
 }
 // Recolor the existing illustrated Dark Grounds smoke poses once, offscreen.
 // The original authored alpha and faceted shapes are retained, without purple.
 function prepareSmoke(){
   if(!smoke.complete||smoke.naturalWidth!==1152||smoke.naturalHeight!==448)return;
   const canvas=document.createElement("canvas");canvas.width=1152;canvas.height=448;
   const c=canvas.getContext("2d");c.drawImage(smoke,0,0);
   const data=c.getImageData(0,0,canvas.width,canvas.height),p=data.data;
   for(let j=0;j<p.length;j+=4){
     const l=.299*p[j]+.587*p[j+1]+.114*p[j+2];
     p[j]=Math.min(255,35+l*.72);p[j+1]=Math.min(255,29+l*.70);p[j+2]=Math.min(255,27+l*.67);
   }
   c.putImageData(data,0,0);smokeArt=canvas;
 }
 smoke.onload=()=>{try{prepareSmoke();}catch(e){console.warn("Furnace smoke unavailable",e);}};
 smoke.src="./assets/dark-grounds-frames.webp?v=0.291.0";
 function ensure(){
   if(ready())return Promise.resolve(true);if(pending)return pending;
   pending=new Promise(resolve=>{
     let done=false;
     const finish=ok=>{if(done)return;done=true;clearTimeout(timer);error=ok?"":"Unable to load Furnace landscape or flame artwork";resolve(ok);if(ok){try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}}};
     const check=()=>{if(imagesReady()){try{if(!landscapeArt)compose();finish(ready());}catch(e){console.warn("Furnace landscape composition failed",e);finish(false);}}};
     const timer=setTimeout(()=>finish(false),12000);
     ground.onload=flames.onload=original.onload=check;
     ground.onerror=flames.onerror=original.onerror=()=>finish(false);
     original.src="./assets/arena-concept-approved-v48.webp?v=0.48.0";
     ground.src="./assets/furnace-arena-v3.webp?v=1";
     flames.src="./assets/flashover-flames.webp?v=0.305.2";
     check();
   }).finally(()=>{pending=null;});
   return pending;
 }
 // Fractional positions on the entire painted floor, behind the live fighter layer.
 // Small, staggered vents leave the middle and the unit silhouettes readable.
 const vents=[[.16,.62,.070],[.32,.54,.049],[.51,.53,.047],[.70,.55,.058],[.85,.62,.073],
              [.12,.73,.072],[.29,.79,.072],[.48,.86,.055],[.72,.80,.084],[.88,.72,.065],[.64,.88,.065]];
 const sequence=[0,1,2,3,4,5,6,7,6,5,4,3,2,1];
 function flame(g,index,x,y,w,h){
   g.drawImage(flames,index%4*128,Math.floor(index/4)*128,128,128,x-w/2,y-h*.91,w,h);
 }
 function drawSmoke(g,x,y,width,height,time){
   if(!smokeArt)return;
   const poses=[4,5,6,7,6,5];
   // Low ash clouds and drifting smoke along the back and sides; avoid the
   // central crystal, and keep all clouds behind live fighters and HP plates.
   const banks=[[.12,.60,.29,.24],[.38,.50,.24,.20],[.66,.51,.25,.19],[.89,.61,.28,.24],
                [.21,.77,.25,.20],[.79,.78,.25,.20]];
   for(const [i,[u,v,size,opacity]] of banks.entries()){
     const phase=(time/5400+i*.173)%1;
     const drift=Math.sin(phase*Math.PI*2+i)*width*.025;
     const rise=(.5+.5*Math.sin(phase*Math.PI*2))*height*.028;
     const pose=poses[(Math.floor(time/180)+i*2)%poses.length];
     const w=width*size,h=w*224/288;
     g.save();g.globalAlpha*=opacity;
     g.drawImage(smokeArt,pose%4*288,Math.floor(pose/4)*224,288,224,
       x+u*width-w/2+drift,y+v*height-h*.88-rise,w,h);
     g.restore();
   }
 }
 function landscape(g,{x,y,width,height,time,strength=1}){
   if(!ready())return;
   const intensity=clamp(strength);
   if(intensity<=0)return;
   g.save();g.globalAlpha*=intensity;
   // The active field replaces the background completely, just as Groveland does.
   // No alpha mask on the volcanic ground; no floor from the previous arena leaks through.
   g.drawImage(landscapeArt,x,y,width,height);
   drawSmoke(g,x,y,width,height,time);
   const beat=Math.floor(time/105);
   for(const [i,[u,v,size]] of vents.entries()){
     const pose=sequence[(beat+i*5)%sequence.length],w=width*size,h=w*(1.06+(i%3)*.12);
     flame(g,pose,x+u*width,y+v*height,w,h);
   }
   g.restore();
 }
 function portrait(g,w,h){
   if(!ready())return;
   g.drawImage(landscapeArt,35,292,930,290,0,0,w,h);
   const size=Math.min(w*.28,h*.44);
   for(let i=0;i<3;i++)flame(g,[3,5,7][i],w*(.24+.26*i),h*(.69+.06*(i%2)),size,size*1.1);
 }
 ensure();return {ensure,ready,error:()=>error,landscape,portrait};
}
window.FireTestArt={ringoffire:make("ring",224,224,14),backdraft:make("backdraft",224,224,19),furnace:makeFurnace()};
})();