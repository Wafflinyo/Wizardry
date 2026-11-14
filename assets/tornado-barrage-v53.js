/* Wizardry v0.53 — low-poly Tornado Barrage.
   Drawn directly in the original 1000×620 camera; no flat placeholder.
   A faceted rotating cyclone forms on the arena, then rocky volleys arc
   toward EVERY living enemy independently. Damage is handled by arena.js. */
(function(root){
"use strict";
const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t, smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const rand=n=>{const s=Math.sin(n*83.33+19.37)*43758.545312;return s-Math.floor(s)};
function path(c,points,fill,stroke="",w=1){
 c.beginPath();c.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
 c.closePath();if(fill){c.fillStyle=fill;c.fill();}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
}
function ellipse(c,x,y,rx,ry,fill,stroke="",width=1){
 c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);
 if(fill){c.fillStyle=fill;c.fill();}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function rock(c,x,y,r,angle,tint=0){
  c.save();c.translate(x,y);c.rotate(angle);
  const a=tint%3;
  const facets=a===0?["#8b9295","#5b7075","#a6ada4"]:
    a===1?["#a18d76","#666c67","#d2c6a7"]:
    ["#647b79","#475a63","#b1b9a6"];
  c.shadowColor="#041e2c";c.shadowBlur=r*.22;
  path(c,[[-r,-r*.22],[-r*.41,-r*.91],[r*.36,-r*.74],
    [r,r*.14],[r*.57,r*.89],[-r*.57,r*.67]],facets[0],"#314956",1.3);
  c.shadowBlur=0;
  path(c,[[-r,-r*.22],[-r*.41,-r*.91],[r*.36,-r*.74],
    [r*.13,r*.15]],facets[2]);
  path(c,[[-r,-r*.22],[r*.13,r*.15],[r*.57,r*.89],
    [-r*.57,r*.67]],facets[1]);
  c.restore();
}
function vortex(c,cx,base,p,time,scale=1){
  const appear=smooth(p/.17),rot=time*.0035,top=base-222*scale*appear;
  c.save();c.globalAlpha=.90*appear;
  const shadow=c.createRadialGradient(cx,base,4,cx,base,132*scale);
  shadow.addColorStop(0,"#061e2ab0");shadow.addColorStop(1,"#061e2a00");
  c.fillStyle=shadow;ellipse(c,cx,base+10,124*scale,33*scale,"#061e2a46");
  ellipse(c,cx,base+9,83*scale,22*scale,null,"#80cec8a1",2);
  // Coarse layered polygon spirals curve around a narrow base and broad
  // whirling crown; never a smoothed photograph-like tornado.
  for(let row=0;row<11;row++){
    const z=row/10,ry=base-z*(base-top);
    const r=(16+z*82)*scale*appear;
    const swirl=rot*(1+z*.65)+z*4.7;
    const dx=Math.sin(swirl)*r*.28;
    const cy=ry+Math.sin(swirl*2.1)*3.2*scale;
    const left=[cx+dx-r,cy],right=[cx+dx+r,cy],
      next=[cx+Math.sin(swirl+.7)*r*.4+r*.79,cy+7*scale],
      low=[cx+Math.sin(swirl+.7)*r*.4-r*.87,cy+10*scale];
    path(c,[left,[cx+dx-r*.34,cy-12*scale],right,next,low],
      row%3===0?"#bed8d7c8":row%3===1?"#638e96bd":"#8fb9bac3",
      "#d9eeee63",1.2);
    path(c,[[cx+dx-r*.82,cy+2],[cx+dx-r*.28,cy-12],
      [cx+dx+r*.28,cy-7],[cx+dx+r*.66,cy+4]],
      row%2?"#b2e6df91":"#4b76829c");
    if(row>2&&row%2===0){
      const ang=swirl*2.4;
      rock(c,cx+Math.cos(ang)*r*.88,cy+Math.sin(ang)*8,
        (5+z*9)*scale,ang,z*12+row);
    }
  }
  for(let i=0;i<24;i++){
    const z=(i+.5)/24;
    const a=rot*(1.4+z*.6)+i*1.65;
    const r=(19+z*90)*scale*appear;
    const x=cx+Math.cos(a)*r,y=base-z*222*scale+Math.sin(a)*r*.15;
    if(i%3===0)rock(c,x,y,(4+7*z)*scale,a,i);
    else {
      c.globalAlpha=appear*(.18+.5*z);
      path(c,[[x-6,y],[x+4,y-5],[x+10,y+3],[x-2,y+7]],
        i%2?"#d6e4dc":"#88c0bf");
      c.globalAlpha=.90*appear;
    }
  }
  ellipse(c,cx+Math.sin(rot*1.7)*12*scale,top+4,
    101*scale*appear,18*scale*appear,
    "#a2c7c777","#d7f2e4a9",3);
  ellipse(c,cx,base-4,39*scale,12*scale,null,"#b3e2d4b0",2);
  c.restore();
}
function volley(c,targets,progress,time,cx=500,base=468){
  const p=smooth(progress);
  for(let i=0;i<targets.length;i++){
    const target=targets[i],tx=target.x,ty=target.y-84;
    const offset=i*.07;
    const local=clamp((p-offset)/(1-offset));
    for(let k=0;k<5;k++){
      const delay=k*.055;
      const t=clamp((local-delay)/(1-delay));
      if(t<=0||t>=1)continue;
      const angle=rand(i*79+k*13)*TAU;
      const origin={x:cx+Math.cos(angle)*(35+k*12),
        y:base-114-Math.sin(angle)*(31+k*8)};
      const x=mix(origin.x,tx+(k-2)*11,smooth(t));
      const y=mix(origin.y,ty+(k%3-1)*10,smooth(t))-79*Math.sin(t*Math.PI);
      rock(c,x,y,8+rand(i*11+k*7)*7,angle+time*.004,i+k);
      if(t>.25){
        c.globalAlpha=.36*(1-t);
        ellipse(c,x-14*(tx>=cx?1:-1),y+6,5,3,"#cbe7d4");
        c.globalAlpha=1;
      }
    }
  }
}
function impact(c,targets,p,time,front=false){
  const fade=1-smooth((p-.63)/.37);
  c.save();c.globalAlpha=fade;
  for(let i=0;i<targets.length;i++){
    const t=targets[i],x=t.x,y=t.y-85;
    if(!front){
      const r=17+65*smooth(p);
      ellipse(c,x,y,r,r*.69,null,"#dfd3af",Math.max(1,3.8*(1-p)));
      for(let n=0;n<8;n++){
        const a=TAU*n/8+time*.0004;
        const dist=r*(.7+rand(i*67+n*7)*.4);
        rock(c,x+Math.cos(a)*dist,y+Math.sin(a)*dist*.72,
          3.5+7*(1-p),a,n);
      }
    }else{
      // Foreground debris glints are tiny and stay below health bars.
      for(let n=0;n<6;n++){
        const a=TAU*n/6+time*.0002;
        const r=15+39*smooth(p);
        const bx=x+Math.cos(a)*r,by=y+Math.sin(a)*r*.6;
        c.strokeStyle=n%2?"#e9e1c5":"#9ac8c1";c.lineWidth=1.5;
        c.beginPath();c.moveTo(bx-4,by);c.lineTo(bx+4,by);c.stroke();
      }
    }
  }
  c.restore();
}
function draw(ctx,options){
 if(!ctx||!options)return false;
 const stage=options.stage||"wind-summon";
 if(!["wind-summon","wind-volley","wind-impact","wind-dissolve"].includes(stage))return false;
 const p=clamp(Number(options.progress)||0),time=Number(options.time)||0;
 const targets=Array.isArray(options.targets)?options.targets:[];
 ctx.save();
 if(stage==="wind-summon")vortex(ctx,500,467,p,time);
 else if(stage==="wind-volley"){
   vortex(ctx,500,467,1,time);
   volley(ctx,targets,p,time);
 }else if(stage==="wind-impact"){
   vortex(ctx,500,467,1-p*.36,time);
   impact(ctx,targets,p,time,false);
 }else {
   vortex(ctx,500,467,1-p,time);
 }
 ctx.restore();return true;
}
function drawForeground(ctx,options){
 if(options?.stage!=="wind-impact")return false;
 impact(ctx,Array.isArray(options.targets)?options.targets:[],
   clamp(Number(options.progress)||0),Number(options.time)||0,true);
 return true;
}
function drawCardArt(ctx,w,h){
 if(!ctx)return false;
 const a=ctx.save();
 // Draw the EXACT same live tornado at thumbnail scale, with different
 // rock placements in the upper portion; not unrelated generic clip-art.
 ctx.translate(w*.50,h*.94);ctx.scale(.69,.63);
 ctx.translate(-500,-468);
 vortex(ctx,500,468,1,1240,.85);
 for(let i=0;i<8;i++){
   const ang=i*TAU/8;
   const x=500+Math.cos(ang)*(80+i%3*20);
   const y=358+Math.sin(ang)*60;
   rock(ctx,x,y,7+(i%3)*3,ang,i);
 }
 ctx.restore();return true;
}
root.WIZARDRY_TORNADO_V53={draw,drawForeground,drawCardArt};
})(window);