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
    const pull=smooth((p-.13)/(hit-.13));
    const after=clamp((p-hit)/(1-hit));
    return {x:target.x,y:target.y-83,p,hit,blocked,after,
      pose:p<hit?5*clamp(p/hit):5+after*2,
      angle:p<hit?p*1.8+pull*.75:hit*1.8+.75+after*.22,
      radius:119-95*pull,alpha:smooth(p/.12)*(1-smooth((after-.45)/.55))};
  }

  function ribbons(ctx,s,front){
    const strength=s.p<s.hit?1:1-smooth(s.after/.58);
    for(let i=0;i<18;i++){
      const a=i*2.39996+s.p*12+s.angle;
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
    const front=layer==="front";
    ctx.save();
    ctx.translate(s.x,s.y);
    ctx.globalAlpha*=s.alpha;
    ribbons(ctx,s,front);
    if(front){
      const first=Math.floor(s.pose),next=Math.min(7,first+1),mix=s.pose-first;
      ctx.save();
      ctx.rotate(s.angle);
      const opacity=ctx.globalAlpha;
      // Blend the neighboring poses so the wind keeps moving between atlas frames.
      ctx.globalAlpha=opacity*(1-mix);
      ctx.drawImage(atlas,first%4*tile,Math.floor(first/4)*tile,tile,tile,-112,-112,224,224);
      if(mix>0){
        ctx.globalAlpha=opacity*mix;
        ctx.drawImage(atlas,next%4*tile,Math.floor(next/4)*tile,tile,tile,-112,-112,224,224);
      }
      ctx.restore();
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
