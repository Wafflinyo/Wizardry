(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=224;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/pressure-drop-frames.webp?v=0.312.0";
  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const t=clamp(p);return t*t*(3-2*t);};

  function scene(target,p,hit,blocked){
    const pull=smooth((p-.24)/(hit-.24));
    const after=clamp((p-hit)/(1-hit));
    return {x:target.x,y:target.y-83,p,hit,blocked,after,
      frame:p<hit?Math.min(4,Math.floor(p/hit*5)):Math.min(7,5+Math.floor(after*3)),
      radius:119-95*pull,alpha:smooth(p/.12)*(1-smooth((after-.45)/.55))};
  }

  function ribbons(ctx,s,front){
    const strength=s.p<s.hit?1:1-smooth(s.after/.58);
    for(let i=0;i<18;i++){
      const a=i*2.39996+s.p*10;
      if((Math.sin(a)>0)!==front)continue;
      const radius=s.radius*(.79+i%4*.08);
      const tail=radius+15+i%4*6;
      const points=[
        [Math.cos(a)*radius,Math.sin(a)*radius*.74],
        [Math.cos(a-.30)*tail,Math.sin(a-.30)*tail*.74],
        [Math.cos(a-.13)*(tail+10),Math.sin(a-.13)*(tail+10)*.74]
      ];
      ctx.save();
      ctx.globalAlpha*=strength*(.48+(i%3)*.17);
      ctx.fillStyle=["#489f9d","#96ebd7","#e9fff7"][i%3];
      ctx.beginPath();
      points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.closePath();ctx.fill();
      ctx.restore();
    }
  }

  function draw(ctx,s,layer){
    if(!ready()||s.alpha<=0)return;
    const front=layer==="front",size=224;
    const sx=s.frame%4*tile,sy=Math.floor(s.frame/4)*tile;
    ctx.save();
    ctx.translate(s.x,s.y);
    ctx.globalAlpha*=s.alpha;
    ribbons(ctx,s,front);
    if(front){
      ctx.drawImage(atlas,sx,sy,tile,tile,-size/2,-size/2,size,size);
      if(!s.blocked&&s.p>=s.hit&&s.after<.18){
        ctx.globalAlpha*=1-s.after/.18;
        ctx.fillStyle="#effff6";
        ctx.beginPath();ctx.ellipse(0,0,15,10,0,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
  }
  function portrait(ctx,w,h){
    if(!ready())return;
    const size=Math.min(w*1.2,h*1.35);
    ctx.drawImage(atlas,2*tile,0,tile,tile,(w-size)/2,(h-size)/2,size,size);
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.PressureDrop={scene,draw,portrait,onReady};
})();
