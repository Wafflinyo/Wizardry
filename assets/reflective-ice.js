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

  function shatter(ctx, origin, time) {
    if(time>.56)return;
    const power=1-clamp(time/.56);
    ctx.save();
    ctx.translate(origin.x,origin.y);
    ctx.globalAlpha *= power;
    if(time<.12){
      ctx.save();
      ctx.scale(87,96);
      ctx.globalAlpha *= 1-clamp((time-.035)/.085);
      ctx.lineWidth=.014;
      faces(ctx,1,2,"front");
      ctx.restore();
      const cracks=clamp(time/.075);
      ctx.lineWidth=2;
      for(let i=0;i<7;i++){
        const angle=i*tau/7+.18,dx=Math.cos(angle),dy=Math.sin(angle);
        const r=31+cracks*66;
        polygon(ctx,[[0,0],[dx*24-dy*10,dy*24+dx*10],[dx*r,dy*r],
          [dx*30+dy*9,dy*30-dx*9]],i%2?"#dcfbff":"#96e8ff");
      }
    }
    const burst=clamp((time-.065)/.35);
    if(burst>0){
      const reach=1-(1-burst)**2;
      for(let i=0;i<16;i++){
        const angle=i*tau/16+.12,dx=Math.cos(angle),dy=Math.sin(angle);
        const radius=64+reach*(53+i%4*16);
        const x=dx*radius,y=dy*radius+60*burst*burst;
        const size=(i%3===0?23:11+i%4*3)*(1-burst*.45);
        crystal(ctx,x,y,size,angle+time*(i%2?7:-5));
      }
    }
    ctx.restore();
  }

  function deflect(ctx, from, to, age) {
    if(age>=.84)return;
    const t=Math.floor(Math.max(0,age)*48)/48;
    const launch=.085,arrival=.25;
    shatter(ctx,from,t);
    if(t<launch)return;
    const travel=clamp((t-launch)/(arrival-launch));
    const fade=(1-clamp((t-arrival)/.36))**1.3;
    const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
    ctx.save();
    ctx.translate(from.x,from.y);
    ctx.rotate(Math.atan2(dy,dx));
    const reach=length*travel;
    const width=(16+13*Math.sin(travel*Math.PI))*Math.max(.24,fade);
    ctx.globalAlpha *= fade;
    polygon(ctx,[[0,-5],[reach*.25,-width*.82],[reach*.63,-width*1.3],
      [reach+10,0],[reach*.73,width*.92],[reach*.22,width*.64],[0,5]],"#496efe99");
    polygon(ctx,[[0,-4],[reach*.31,-width*.37],[reach*.68,-width*.82],
      [reach+10,0],[reach*.54,width*.48],[0,4]],"#79efffdc");
    polygon(ctx,[[0,-2],[reach*.40,-width*.16],[reach*.75,-width*.35],
      [reach+11,0],[reach*.55,width*.22],[0,2]],"#e8ffff");
    for(let i=0;i<5;i++){
      const x=reach*(.19+i*.145),side=i%2?1:-1;
      polygon(ctx,[[x,0],[x+reach*.09,side*width*.25],[x+reach*.19,side*width*(.89+i%3*.18)],
        [x+reach*.07,side*width*.54]],i%2?"#a0faffb8":"#aeb3ffac");
    }
    if(travel<1)crystal(ctx,reach,0,13+width*.2,Math.PI/2);
    ctx.restore();

    if(travel===1){
      const impact=clamp((t-arrival)/.57);
      ctx.save();
      ctx.translate(to.x,to.y);
      ctx.globalAlpha *= (1-impact)**1.55;
      const ring=Array.from({length:12},(_,i)=>{
        const angle=i*tau/12,r=12+impact*76;
        return [Math.cos(angle)*r,Math.sin(angle)*r*.74];
      });
      ctx.lineWidth=2.6*(1-impact);
      polygon(ctx,ring,"#70d9ff30","#baf5ff");
      for(let i=0;i<12;i++){
        const angle=i*2.39996,r=13+impact*(62+i%3*19);
        crystal(ctx,Math.cos(angle)*r,Math.sin(angle)*r*.78,5+i%4*2,angle+impact*2);
      }
      ctx.restore();
    }
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
