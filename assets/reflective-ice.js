(() => {
  "use strict";

  const clamp = p => Math.max(0, Math.min(1, p));
  const tau = Math.PI * 2;
  const sectors = 12;
  const ice = ["#8eeaff","#71b5ef","#6382c7","#b8f5ff","#c3d7fc"];

  function polygon(ctx, points, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function crystal(ctx,x,y,r,angle) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    polygon(ctx,[[0,-r],[r*.52,-r*.15],[r*.41,r*.58],[0,r],[-r*.51,r*.18]],"#71b8ea","#c1f4ff");
    polygon(ctx,[[0,-r],[r*.52,-r*.15],[0,r],[-r*.09,-r*.12]],"#d0faff");
    polygon(ctx,[[0,-r],[-r*.51,r*.18],[0,r],[-r*.09,-r*.12]],"#597dca");
    ctx.restore();
  }

  function faces(ctx, growth, frame, layer) {
    const back=layer==="back";
    const polar=(index,r,offset=0)=>[Math.cos((index+offset)*tau/sectors)*r,Math.sin((index+offset)*tau/sectors)*r];
    const drawFacet=(points,color,alpha,edge)=>{
      ctx.save();
      ctx.globalAlpha *= alpha;
      polygon(ctx,points,color,edge);
      ctx.restore();
    };

    if(back)drawFacet(Array.from({length:sectors},(_,i)=>polar(i,1)),"#183d70",.30);
    const assembled=Math.ceil(growth*sectors);
    for(let i=0;i<assembled;i++){
      const j=(i+1)%sectors;
      const a=polar(i,1),b=polar(j,1),inner=polar(i,.76,.55),next=polar(j,.76,.55);
      const glint=(frame+i*3)%31<4;
      drawFacet([a,b,inner],ice[i%ice.length],back?.39:glint?.56:.29,back?null:"#c6f4ff");
      drawFacet([b,inner,next],ice[(i+2)%ice.length],back?.16:.21);
      if(!back){
        const center=polar(i,.34,.80),neighbor=polar(j,.34,.80);
        drawFacet([inner,next,center],ice[(i+1)%ice.length],glint?.25:.10);
        drawFacet([next,center,neighbor],ice[(i+3)%ice.length],.08);
      }
    }
    if(!back&&growth>.78){
      drawFacet([[-.82,-.35],[-.58,-.70],[-.25,-.76],[-.55,-.55]],"#ecfdff",.74);
      drawFacet([[.70,.53],[.90,.22],[.85,.50],[.52,.76]],"#8be8ff",.54);
    }
  }

  function shell(ctx, target, growth, time, layer) {
    if(growth<=0)return;
    const perspective=.60+.30*clamp((target.y-288)/235);
    const frame=Math.floor(time*.018);
    const build=Math.min(24,Math.ceil(growth*24))/24;
    const scale=(.52+.48*(1-(1-build)**2))*perspective;
    ctx.save();
    ctx.translate(target.x,target.y-104*perspective);
    ctx.scale(112*scale,123*scale);
    ctx.globalAlpha *= clamp(build*3);
    ctx.lineWidth=.009;
    faces(ctx,build,frame,layer);
    ctx.restore();
  }

  function deflect(ctx, from, to, age) {
    if(age>=.74)return;
    const frame=Math.floor(age*32)/32;
    const fade=clamp((.74-frame)/.57);
    const travel=clamp((frame+.045)/.22);
    const dx=to.x-from.x,dy=to.y-from.y;
    const x=from.x+dx*travel,y=from.y+dy*travel;
    const distance=Math.hypot(dx,dy)||1,nx=-dy/distance,ny=dx/distance;
    ctx.save();
    ctx.globalAlpha *= fade;
    ctx.lineWidth=1.2;
    polygon(ctx,[[from.x,from.y],[x+nx*10,y+ny*10],[x,y],[x-nx*6,y-ny*6]],"#71d7ff91");
    for(let i=0;i<9;i++){
      const angle=i*2.39996;
      const distance=34+frame*(78+i%4*21);
      crystal(ctx,from.x+Math.cos(angle)*distance,from.y+Math.sin(angle)*distance+65*frame*frame,5+i%4,angle+frame*5);
    }
    crystal(ctx,x,y,14,Math.atan2(dy,dx)+Math.PI/2);
    if(travel===1){
      for(let i=0;i<8;i++){
        const angle=i*tau/8;
        const radius=9+(frame-.17)*100;
        crystal(ctx,to.x+Math.cos(angle)*radius,to.y+Math.sin(angle)*radius,4+i%3,angle);
      }
    }
    ctx.restore();
  }

  function melt(ctx,x,y,age) {
    if(age>=.85)return;
    const p=Math.floor(age*24)/20;
    ctx.save();
    ctx.globalAlpha *= 1-p;
    ctx.fillStyle="#7ed9f780";
    ctx.beginPath();
    ctx.ellipse(x,y+2,24+p*48,5+p*4,0,0,tau);
    ctx.fill();
    for(let i=0;i<12;i++){
      const distance=(i-5.5)*11;
      const height=(24+i%4*34)*Math.max(0,1-p*p*1.4);
      crystal(ctx,x+distance,y-height,3+i%3,p+i);
    }
    ctx.restore();
  }

  function portrait(ctx,width,height) {
    const scale=Math.min(width,height)*.42;
    ctx.save();
    ctx.translate(width/2,height/2);
    ctx.scale(scale,scale);
    ctx.lineWidth=.014;
    faces(ctx,1,6,"back");
    faces(ctx,1,6,"front");
    ctx.restore();
  }

  window.ReflectiveIce={shell,deflect,melt,portrait};
})();
