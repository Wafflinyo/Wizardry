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

  function flow(ctx,time,size,front){
    const seconds=time/1000;
    const drift=(seconds*.72)%1;
    ctx.save();
    ctx.scale(size/190,size/190);
    if(!front){
      // Wind shears sand off the shoulders into two moving ribbons.
      for(let i=0;i<2;i++){
        const phase=seconds*5+i*1.6;
        const wave=Math.sin(phase)*7;
        ctx.globalAlpha=.22+i*.07;
        ctx.fillStyle=i?"#d6a45e":"#b58248";
        ctx.beginPath();
        ctx.moveTo(-19,-133+i*31);
        ctx.quadraticCurveTo(-43,-140+i*31+wave,-64,-124+i*31-wave);
        ctx.quadraticCurveTo(-79,-113+i*31-wave,-91,-119+i*31+wave);
        ctx.quadraticCurveTo(-72,-112+i*31+wave,-59,-118+i*31-wave);
        ctx.quadraticCurveTo(-39,-131+i*31+wave,-19,-128+i*31);
        ctx.closePath();
        ctx.fill();
      }
    }
    for(let i=0;i<12;i++){
      const age=(drift+i*.181+(front?.35:0))%1;
      const x=front?23+(i%4)*5+age*9:-22-age*(44+i%4*7);
      const y=front?-97+(i%3)*13+age*62:-137+(i%4)*12+age*24+Math.sin(seconds*5+i)*5;
      ctx.globalAlpha=Math.sin(Math.PI*age)*(front?.46:.61);
      ctx.fillStyle=["#f2d096","#bb8648","#e4b776"][i%3];
      ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+1,y-2.5);ctx.lineTo(x+4,y+1);
      ctx.lineTo(x,y+3);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx,target,{growth,age,broken,time=0}){
    if(!ready()||(broken&&age>=.94))return;
    const dir=target.team===0?1:-1;
    const size=175+clamp((target.y-400)/200)*20;
    const index=broken?(age<.17?5:age<.44?6:7):
      growth<.90?Math.min(2,Math.floor(growth*3.5)):age!=null&&age<.24?4:3;
    ctx.save();
    ctx.translate(target.x+dir*84,target.y+6);
    const standing=!broken&&growth>=.90;
    ctx.scale(dir,1.23+(standing?Math.sin(time*.004)*.012:0));
    if(broken)ctx.globalAlpha*=1-clamp((age-.61)/.33);
    else if(growth<.20)ctx.globalAlpha*=clamp(growth/.20);
    if(standing)flow(ctx,time,size,false);
    sprite(ctx,index,size);
    if(standing)flow(ctx,time,size,true);
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
