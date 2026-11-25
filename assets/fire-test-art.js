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
 const flames=new Image(),original=new Image(),smoke=new Image();let pending=null,error="",landscapeArt=null,smokeArt=null;
 const imagesReady=()=>original.complete&&original.naturalWidth===1000&&original.naturalHeight===620&&flames.complete&&flames.naturalWidth===512&&flames.naturalHeight===256;
 const ready=()=>!!landscapeArt&&imagesReady();
 // Modify the original artwork itself, not a separate floor texture.
 // These outlines only delimit the stone pixels that can be heated; they are
 // never rendered as a new floor, rim or wall. Preserve the center emblem.
 function floorPath(ctx){
   ctx.moveTo(500,303);
   ctx.bezierCurveTo(672,300,804,316,894,358);
   ctx.bezierCurveTo(937,378,965,410,966,439);
   ctx.bezierCurveTo(969,478,924,519,849,543);
   ctx.bezierCurveTo(756,572,625,582,500,582);
   ctx.bezierCurveTo(375,582,244,572,151,543);
   ctx.bezierCurveTo(76,519,31,478,34,439);
   ctx.bezierCurveTo(35,410,63,378,106,358);
   ctx.bezierCurveTo(196,316,328,300,500,303);ctx.closePath();
 }
 function medallionPath(ctx){
   ctx.moveTo(500,354);ctx.lineTo(514,369);
   ctx.bezierCurveTo(576,369,631,389,634,414);
   ctx.bezierCurveTo(638,440,579,462,515,466);
   ctx.lineTo(501,487);ctx.lineTo(485,466);
   ctx.bezierCurveTo(420,462,362,440,367,414);
   ctx.bezierCurveTo(371,389,424,369,486,369);
   ctx.lineTo(500,354);ctx.closePath();
 }
 // Guide the heat along the actual original arena tile joints. The final
 // incandescent core is selected from the original dark seam pixels,
 // preserving every stone's existing faceted shading and silhouette.
 const joints=[
   [[38,400],[95,394],[136,407],[220,398],[260,387],[325,389],[375,406]],
   [[96,347],[151,359],[225,343],[293,345],[333,320],[428,331],[438,347]],
   [[151,359],[136,407],[167,443],[251,456],[274,420],[260,387]],
   [[333,320],[350,351],[429,350],[455,369]],
   [[570,303],[581,329],[665,345],[715,321],[800,343],[813,355]],
   [[631,404],[696,386],[742,379],[808,388],[878,382],[926,388],[956,412]],
   [[715,321],[742,379],[723,416],[785,431],[854,414],[878,382]],
   [[38,444],[93,464],[167,443],[251,456],[277,480],[323,488],[392,462]],
   [[277,480],[253,510],[181,511],[117,530]],
   [[93,464],[110,495],[181,511]],
   [[323,488],[354,523],[431,516],[461,540],[535,535],[569,516],[643,529]],
   [[630,451],[696,475],[751,465],[785,431]],
   [[696,475],[685,510],[751,529],[819,510],[854,475],[930,467]],
   [[751,465],[854,475],[898,445],[965,440]],
   [[354,523],[308,551],[350,574]],
   [[431,516],[450,556],[500,582]],
   [[569,516],[580,554],[643,575]],
   [[685,510],[643,529],[580,554]],
   [[819,510],[852,539],[907,518]]
 ];
 function compose(){
   const surface=document.createElement("canvas");surface.width=1000;surface.height=620;
   const ctx=surface.getContext("2d",{willReadFrequently:true});ctx.drawImage(original,0,0);
   const mask=document.createElement("canvas");mask.width=1000;mask.height=620;
   const m=mask.getContext("2d",{willReadFrequently:true});
   m.beginPath();floorPath(m);medallionPath(m);m.fillStyle="#fff";m.fill("evenodd");
   const allowed=m.getImageData(0,0,1000,620).data;
   const seam=document.createElement("canvas");seam.width=1000;seam.height=620;
   const sc=seam.getContext("2d",{willReadFrequently:true});
   sc.lineJoin="round";sc.lineCap="round";sc.strokeStyle="#fff";sc.lineWidth=12;
   for(const points of joints){sc.beginPath();sc.moveTo(...points[0]);for(const p of points.slice(1))sc.lineTo(...p);sc.stroke();}
   const guide=sc.getImageData(0,0,1000,620).data;
   const frame=ctx.getImageData(0,0,1000,620),p=frame.data,src=new Uint8ClampedArray(p);
   const lum=k=>.299*src[k]+.587*src[k+1]+.114*src[k+2];
   for(let y=300;y<584;y++)for(let x=30;x<970;x++){
     const k=(y*1000+x)*4,maskAlpha=allowed[k+3]/255;if(maskAlpha===0)continue;
     const r=src[k],g=src[k+1],b=src[k+2],l=lum(k);
     // Gold details and all bright turquoise ornamentation are protected.
     if(r>g*1.06&&r>b*1.28&&g>72)continue;
     const nearby=Math.max(lum(k-12),lum(k+12),lum(k-12000),lum(k+12000));
     const contrast=nearby-l;
     const dark=clamp((89-l)/36),edge=clamp((contrast-6)/23);
     const heat=guide[k+3]/255*dark*edge;
     const core=clamp((heat-.16)/.65);
     const warm=guide[k+3]/255*clamp((105-l)/60)*.20;
     // Recolor the actual original stone pixels, retaining local light/shadow.
     const baseR=l*.88+22+warm*72,baseG=l*.60+10+warm*21,baseB=l*.55+12;
     const rr=baseR+(255-baseR)*core,gg=baseG+(110+core*100-baseG)*core,bb=baseB+(12-baseB)*core;
     p[k]=Math.round(r+(rr-r)*maskAlpha);
     p[k+1]=Math.round(g+(gg-g)*maskAlpha);
     p[k+2]=Math.round(b+(bb-b)*maskAlpha);
   }
   ctx.putImageData(frame,0,0);
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
     flames.onload=original.onload=check;
     flames.onerror=original.onerror=()=>finish(false);
     original.src="./assets/arena-concept-approved-v48.webp?v=0.48.0";
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
   // The field is the original arena with its own stone pixels heated in place.
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