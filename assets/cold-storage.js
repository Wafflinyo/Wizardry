(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=224;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/cold-storage-frames.webp?v=0.309.0";
  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const n=clamp(p);return n*n*(3-2*n);};
  const lerp=(a,b,p)=>a+(b-a)*p;

  function sprite(ctx,index,x,y,size){
    ctx.drawImage(atlas,index%4*tile,Math.floor(index/4)*tile,tile,tile,x-size/2,y-size/2,size,size);
  }

  function facet(ctx,x,y,size,color,lean){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(x-lean,y-size);
    ctx.lineTo(x+size*.74,y-size*.15);
    ctx.lineTo(x+lean,y+size);
    ctx.lineTo(x-size*.49,y+size*.2);
    ctx.closePath();
    ctx.fill();
  }

  function unseal(ctx,x,y,unit,p){
    const peel=smooth((p-.17)/.74);
    ctx.save();
    ctx.globalAlpha*=1-smooth((p-.68)/.32);
    for(let i=0;i<19;i++){
      const angle=i*2.39996,travel=peel*(31+i%5*14);
      const px=x+Math.cos(angle)*travel,py=y+Math.sin(angle)*travel*.69+peel*peel*12;
      facet(ctx,px,py,(3+i%5)*(1-peel*.50),["#247cb5","#77e5ff","#edfaff"][i%3],Math.sin(angle)*3);
    }
    ctx.restore();

    if(p<.27)return;
    const catchup=smooth((p-.27)/.56);
    const reach={x:unit.x,y:unit.y-70};
    ctx.save();
    ctx.globalAlpha*=1-smooth((p-.80)/.20);
    ctx.shadowColor="#ffe67b";ctx.shadowBlur=14;
    for(const side of [-1,1]){
      const curve=Math.sin(Math.PI*catchup);
      const px=lerp(x+side*13,reach.x,catchup)+side*curve*21;
      const py=lerp(y,reach.y,catchup)-curve*(34+side*8);
      facet(ctx,px,py,7,"#ffd777",side*2);
      facet(ctx,px,py-1,3,"#fff4c1",side);
    }
    ctx.restore();
  }

  function draw(ctx,unit,time,forming,age){
    if(!ready())return;
    const popping=age!=null;
    const p=popping?clamp(age/.90):0;
    const growth=forming==null?1:smooth(forming/.39);
    const index=popping?(p<.17?4:p<.35?5:p<.61?6:7):
      forming==null?3:Math.min(3,Math.floor(forming*5));
    const dir=unit.team===0?1:-1;
    const x=unit.x+dir*63;
    const y=unit.y-62+Math.sin(time*.003+(unit.index||0))*4+(1-growth)*20;
    const size=popping?133+53*p:77+34*growth;
    ctx.save();
    ctx.globalAlpha*=popping?1-smooth((p-.61)/.39):growth;
    sprite(ctx,index,x,y,size);
    ctx.restore();
    if(popping)unseal(ctx,x,y,unit,p);
  }

  function portrait(ctx,w,h){
    if(!ready())return;
    sprite(ctx,3,w/2,h*.5,Math.min(w*1.26,h*1.23));
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.ColdStorage={draw,portrait,onReady};
})();
