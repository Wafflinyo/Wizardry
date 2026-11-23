(() => {
  "use strict";
  const cell=224,atlas=new Image(),listeners=[];
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/sand-warrior-frames.webp?v=0.303.0";
  const clamp=n=>Math.max(0,Math.min(1,n));

  function sprite(ctx,index,size){
    ctx.drawImage(atlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,-size/2,-size*.89,size,size);
  }

  function sand(ctx,age){
    ctx.save();
    ctx.globalAlpha*=1-clamp(age/.87);
    for(let i=0;i<16;i++){
      const spread=(i%2?1:-1)*age*(19+i%7*16);
      const y=-8-Math.sin(clamp(age/.9)*Math.PI)*(14+i%5*18);
      ctx.fillStyle=["#a87339","#d2a362","#f1ce89"][i%3];
      ctx.beginPath();
      ctx.moveTo(spread-3,y);
      ctx.lineTo(spread+1,y-6);
      ctx.lineTo(spread+5,y+2);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx,target,{growth,age,broken}){
    if(!ready()||(broken&&age>=.94))return;
    const dir=target.team===0?1:-1;
    const size=175+clamp((target.y-400)/200)*20;
    const index=broken?(age<.17?5:age<.44?6:7):
      growth<.90?Math.min(2,Math.floor(growth*3.5)):age!=null&&age<.24?4:3;
    ctx.save();
    ctx.translate(target.x+dir*55,target.y+6);
    ctx.scale(dir,1);
    if(broken)ctx.globalAlpha*=1-clamp((age-.61)/.33);
    else if(growth<.20)ctx.globalAlpha*=clamp(growth/.20);
    sprite(ctx,index,size);
    if(broken)sand(ctx,age);
    ctx.restore();
  }

  function portrait(ctx,width,height){
    if(!ready())return;
    ctx.save();ctx.translate(width/2,height*.95);
    sprite(ctx,3,Math.min(width*1.24,height*1.13));
    ctx.restore();
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.SandWarrior={draw,portrait,onReady};
})();
