(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=224;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/lifevine-frames.webp?v=0.307.0";
  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const t=clamp(p);return t*t*(3-2*t);};
  const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
  const feet=unit=>({x:unit.x,y:unit.y+21});

  // Intersect each candidate path with the padded silhouette, excluding edge touches.
  function crosses(a,b,box){
    let enter=0,exit=1;
    for(const [from,to,min,max] of [[a.x,b.x,box.left,box.right],[a.y,b.y,box.top,box.bottom]]){
      const delta=to-from;
      if(!delta){
        if(from<=min||from>=max)return false;
        continue;
      }
      const near=(min-from)/delta,far=(max-from)/delta;
      enter=Math.max(enter,Math.min(near,far));
      exit=Math.min(exit,Math.max(near,far));
      if(enter>=exit)return false;
    }
    return true;
  }

  function route(source,target,units){
    const start=feet(source),end=feet(target);
    const obstacles=units.filter(u=>u!==source&&u!==target&&u.hp>0).map(u=>({
      left:u.x-72,right:u.x+72,top:u.y-153,bottom:u.y+29
    }));
    const clear=(a,b)=>!obstacles.some(box=>crosses(a,b,box));
    if(clear(start,end))return [start,end];
    const points=[start,end,...obstacles.flatMap(b=>[
      {x:b.left,y:b.bottom},{x:b.right,y:b.bottom},
      {x:b.left,y:b.top},{x:b.right,y:b.top}
    ])];
    const best=points.map((_,i)=>i===0?0:Infinity),previous=[],visited=new Set();
    for(let i=0;i<points.length;i++){
      let next=-1;
      for(let j=0;j<points.length;j++)if(!visited.has(j)&&best[j]<(best[next]??Infinity))next=j;
      if(next<0||next===1)break;
      visited.add(next);
      for(let j=0;j<points.length;j++){
        if(visited.has(j)||!clear(points[next],points[j]))continue;
        const cost=best[next]+distance(points[next],points[j]);
        if(cost<best[j]){best[j]=cost;previous[j]=next;}
      }
    }
    if(!Number.isFinite(best[1]))return [];
    const path=[];
    for(let at=1;at!==undefined;at=previous[at])path.unshift(points[at]);
    return path;
  }

  function scene({source,target,active,progress=1},units,time,pulse){
    const p=clamp(progress);
    return {path:route(source,target,units),source,target,p,active,clock:time*.001,
      pulse:pulse?{id:pulse.lifevineTarget,age:pulse.age}:null};
  }

  function polygon(ctx,pts,fill){
    ctx.fillStyle=fill;
    ctx.beginPath();
    pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();ctx.fill();
  }

  function drawRoute(ctx,s){
    const total=s.path.slice(1).reduce((len,p,i)=>len+distance(s.path[i],p),0);
    if(total<=0)return;
    const limit=s.active?total:total*smooth((s.p-.16)/.53);
    const healing=s.pulse&&s.pulse.age<.8;
    const towards=s.pulse?.id===s.target.id?1:-1;
    const charge=healing?total*(towards>0?s.pulse.age/.8:1-s.pulse.age/.8):-999;
    let used=0;
    ctx.save();
    for(let i=1;i<s.path.length&&used<limit;i++){
      const a=s.path[i-1],b=s.path[i],length=distance(a,b);
      if(!length)continue;
      const reach=Math.min(length,limit-used);
      ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));
      for(let x=0;x<reach;x+=11){
        const end=Math.min(x+11,reach),lit=Math.abs(used+x-charge)<25;
        const green=lit?"#c9ff77":Math.floor((used+x)/11)%2?"#658948":"#3a6944";
        polygon(ctx,[[x,-4],[end,-3],[end,4],[x,4]],"#1e452d");
        polygon(ctx,[[x,-3],[end,-3],[x+3,2]],green);
        polygon(ctx,[[x,0],[end,-2],[end,3]],lit?"#f0ffaf":"#809851");
        if(x+7<reach&&Math.floor((used+x)/11)%3===0){
          const direction=Math.floor((used+x)/11)%2?1:-1;
          polygon(ctx,[[x,1],[x+3,10*direction],[x+12,6*direction],[x+7,0]],lit?"#eaff99":"#759d4a");
        }
      }
      ctx.restore();used+=length;
    }
    ctx.restore();
  }

  function drawCoil(ctx,s,unit,layer){
    const front=layer==="front";
    const growth=s.active?1:unit===s.source?smooth((s.p-.04)/.33):smooth((s.p-.37)/.36);
    if(!ready()||growth<=0)return;
    const glowing=s.pulse?.id===unit.id&&s.pulse.age<.8;
    const pose=glowing?6:growth<1?Math.min(5,Math.floor(growth*6)):
      Math.sin(s.clock*3.6+unit.y*.02)>.15?7:5;
    const size=170+clamp((unit.y-390)/235)*31;
    const sx=pose%4*tile,sy=Math.floor(pose/4)*tile,split=Math.round(tile*.69);
    ctx.save();
    ctx.translate(unit.x,unit.y+14);
    ctx.globalAlpha*=Math.min(1,growth*2)*(glowing?1:s.active?.78:1);
    if(!front)ctx.drawImage(atlas,sx,sy,tile,split,-size/2,-size*.92,size,size*split/tile);
    else ctx.drawImage(atlas,sx,sy+split,tile,tile-split,-size/2,-size*.92+size*split/tile,size,size*(tile-split)/tile);
    ctx.restore();
  }

  function portrait(ctx,w,h){
    if(!ready())return;
    const size=Math.min(w*1.35,h*1.25);
    ctx.drawImage(atlas,tile,tile,tile,tile,(w-size)/2,(h-size)/2,size,size);
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.Lifevine={route,scene,drawRoute,drawCoil,portrait,onReady};
})();
