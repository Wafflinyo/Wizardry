(() => {
  "use strict";

  const clamp = t => Math.min(1,Math.max(0,t));
  const smooth = t => { t=clamp(t); return t*t*(3-2*t); };
  const atlas=new Image(),listeners=[];
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/high-tide-frames.webp?v=0.300.1";
  const sea = ["#0b607c","#0c7b91","#18a1ad","#25b4b8","#318fa2","#0b506c"];

  function poly(ctx, points, color) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for(const point of points.slice(1))ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle=color;
    ctx.fill();
  }

  function volume(ctx,width,height,frame,level) {
    const rows=7,columns=12,unit=width/columns;
    const point=(x,y)=>{
      const depth=y/rows;
      const jitter=Math.sin(x*1.91+y*2.1+frame*.29);
      return [(x+(y%2?.5:0))*unit+jitter*unit*.27,
        level+(height-level)*depth+jitter*(3+depth*12)];
    };
    for(let y=0;y<rows;y++)for(let x=-1;x<=columns;x++){
      const a=point(x,y),b=point(x+1,y),c=point(x,y+1),d=point(x+1,y+1);
      const base=((x+2)*13+y*7+Math.floor(frame/4))%sea.length;
      poly(ctx,[a,b,c],sea[base]);
      poly(ctx,[b,d,c],sea[(base+2)%sea.length]);
    }
  }

  function wave(ctx,frame,x,y,width,height,alpha){
    if(!ready()||alpha<=0)return;
    ctx.save();
    ctx.globalAlpha*=alpha;
    ctx.drawImage(atlas,frame%3*384,Math.floor(frame/3)*192,384,192,x,y-height*.86,width,height);
    ctx.restore();
  }

  function breakers(ctx,width,height,p,floor,front){
    const phases=front?[.14,.31]:[.025,.18];
    for(const offset of phases){
      const local=clamp((p-offset)/.66);
      const fade=smooth(local/.12)*(1-smooth((local-.71)/.29));
      if(fade<=0)continue;
      const breadth=width*(front?.87:.91),heightPx=Math.min(height*(front?.19:.43),width*(front?.24:.45));
      const x=(width+breadth*.58)*smooth(local)-breadth*.64;
      const y=floor+(height-floor)*(front?.76:.37);
      const frame=local<.15?0:local<.28?1:local<.46?2:local<.61?3:local<.76?4:5;
      wave(ctx,frame,x,y,breadth,heightPx,fade*(front?.79:.95));
    }
  }

  function draw(ctx,{width,height,progress:p,dir=1,layer="back",floor=height*.48}) {
    const frame=Math.floor(p*80);
    const rise=smooth((p-.02)/.41);
    const drain=smooth((p-.63)/.36);
    const strength=rise*(1-drain);
    if(strength<=0)return;

    const level=height-(height-floor)*strength;
    const lead=smooth((p-.015)/.43);
    const edge=-45+(width+100)*lead;
    ctx.save();
    if(dir<0){ctx.translate(width,0);ctx.scale(-1,1);}
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-30,level-12);
    ctx.lineTo(edge-width*.12,level-10);
    ctx.lineTo(edge+9,height+12);
    ctx.lineTo(-30,height+12);
    ctx.closePath();
    ctx.clip();

    ctx.globalAlpha *= (layer==="back"?.47:.24)*(1-drain);
    volume(ctx,width,height,frame,layer==="back"?level:level+(height-level)*.44);
    ctx.restore();
    breakers(ctx,width,height,p,floor,layer==="front");
    ctx.restore();
  }

  function portrait(ctx,width,height){
    wave(ctx,2,-width*.09,height*.88,width*1.17,height*.91,1);
  }

  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.HighTide={draw,portrait,onReady};
})();
