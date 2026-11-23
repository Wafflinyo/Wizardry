(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=256;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/flashover-frames.webp?v=0.305.0";

  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const t=clamp(p);return t*t*(3-2*t);};

  const segments=32;
  const fireColors=["#812117","#c4381a","#ef541a","#ff8f26","#ffc653","#ffe79b"];
  const ringPoints=Array.from({length:segments},(_,index)=>{
    const a=(index+.5)*2*Math.PI/segments;
    return {x:Math.cos(a),z:Math.sin(a),phase:index*2.39996};
  });

  function scene(target,p,hit,burning,blocked){
    const windup=clamp(p/hit),collapse=smooth((windup-.30)/.70);
    const burst=clamp((p-hit)/(1-hit));
    const frame=blocked||burst>.62?7:burst<.20?5:6;
    const size=1+clamp((target.y-390)/235)*.15;
    return {x:target.x,y:target.y,size,frame,burst,p,burning,blocked,
      closing:p<hit,
      radius:151-119*collapse,
      depth:53-42*collapse,
      rise:smooth(windup/.42),
      collapse,
      width:272+burst*(burning?98:73),
      height:178+(burning?25:0),
      alpha:smooth(p/.09)*(1-smooth((burst-.50)/.50))};
  }

  function facet(ctx,color,ax,ay,bx,by,cx,cy){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(ax,ay);
    ctx.lineTo(bx,by);
    ctx.lineTo(cx,cy);
    ctx.closePath();
    ctx.fill();
  }

  function ring(ctx,s,front){
    const visible=s.closing?1:1-smooth(s.burst/.18);
    if(visible<=0)return;
    ctx.save();
    ctx.globalAlpha*=visible*(front?1:.87);
    for(const point of ringPoints){
      if((point.z>0)!==front)continue;
      const pulse=.5+.5*Math.sin(s.p*41+point.phase);
      const x=point.x*s.radius,y=point.z*s.depth;
      const spread=5+s.radius*.062;
      const height=4+s.rise*(24+27*pulse+39*s.collapse);
      const tipX=x+point.x*(7-16*s.collapse)+Math.sin(s.p*30+point.phase)*5;
      const tipY=y-height;
      const middleX=x+(tipX-x)*.46,middleY=y-height*.46;
      facet(ctx,fireColors[0],x-spread,y+3,x+spread,y+3,middleX,middleY);
      facet(ctx,fireColors[1],x-spread,y+2,tipX,tipY,middleX,middleY);
      facet(ctx,fireColors[2],x+spread,y+2,tipX,tipY,middleX,middleY);
      facet(ctx,fireColors[3],x-spread*.73,y+2,x+spread*.79,y+2,middleX,middleY);
      facet(ctx,fireColors[pulse>.55?5:4],x-spread*.33,y+1,x+spread*.40,y+1,middleX,middleY+6);
    }
    ctx.restore();
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
    if(s.alpha<=0)return;
    const front=layer==="front";
    ctx.save();
    ctx.translate(s.x,s.y+3);
    ctx.scale(s.size,s.size);
    ctx.globalAlpha*=s.alpha;
    ring(ctx,s,front);
    if(front&&!s.closing&&ready()){
      const sx=s.frame%4*tile,sy=Math.floor(s.frame/4)*tile;
      ctx.drawImage(atlas,sx,sy,tile,tile,-s.width/2,-s.height*.93,s.width,s.height);
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
