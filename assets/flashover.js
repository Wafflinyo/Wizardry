(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=256;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/flashover-frames.webp?v=0.305.0";

  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const t=clamp(p);return t*t*(3-2*t);};

  function scene(target,p,hit,burning,blocked){
    const windup=clamp(p/hit),collapse=smooth((windup-.42)/.58);
    const burst=clamp((p-hit)/(1-hit));
    const frame=windup<1?Math.min(4,Math.floor(windup*5)):blocked||burst>.63?7:burst<.20?5:6;
    const size=1+clamp((target.y-390)/235)*.15;
    return {x:target.x,y:target.y,size,frame,burst,p,burning,blocked,
      width:(232-89*collapse)*(windup<1?1:1+burst*(burning?1.02:.80)),
      height:126+collapse*29+(windup===1&&burning?20:0),
      alpha:smooth(p/.09)*(1-smooth((burst-.50)/.50))};
  }

  function sparks(ctx,s){
    if(s.blocked||s.frame<5)return;
    const count=s.burning?30:17;
    for(let i=0;i<count;i++){
      const a=i*2.39996,d=(14+s.burst*(72+i%6*10))*s.size;
      const x=Math.cos(a)*d,y=Math.sin(a)*d*.45-25-s.burst*(16+i%4*12);
      const tail=5+i%4*2;
      ctx.fillStyle=["#fff09d","#ff9c38","#f3541f","#bc2c19"][i%4];
      ctx.beginPath();
      ctx.moveTo(x-tail,y+2);
      ctx.lineTo(x+Math.cos(a)*tail,y+Math.sin(a)*tail-5);
      ctx.lineTo(x+3,y+5);
      ctx.closePath();
      ctx.fill();
    }
  }

  function draw(ctx,s,layer){
    if(!ready()||s.alpha<=0)return;
    ctx.save();
    ctx.translate(s.x,s.y+9);
    ctx.scale(s.size,s.size);
    ctx.globalAlpha*=s.alpha;
    const sx=s.frame%4*tile,sy=Math.floor(s.frame/4)*tile;
    const top=-s.height*.93,split=Math.round(tile*.72);
    if(layer==="back"){
      ctx.drawImage(atlas,sx,sy,tile,split,-s.width/2,top,s.width,s.height*split/tile);
    }else{
      ctx.drawImage(atlas,sx,sy+split,tile,tile-split,-s.width/2,
        top+s.height*split/tile,s.width,s.height*(tile-split)/tile);
      sparks(ctx,s);
    }
    ctx.restore();
  }

  function portrait(ctx,width,height){
    if(!ready())return;
    const size=Math.min(width*1.18,height*1.28);
    ctx.drawImage(atlas,2*tile,tile,tile,tile,(width-size)/2,(height-size)/2,size,size);
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.Flashover={scene,draw,portrait,onReady};
})();
