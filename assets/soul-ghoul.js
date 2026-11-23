(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const cell=256;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/soul-ghoul-frames.webp?v=0.304.0";

  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const t=clamp(p);return t*t*(3-2*t);};
  const lerp=(a,b,p)=>a+(b-a)*p;
  const faces=[[0,-9],[7,-3],[5,6],[0,10],[-6,4],[-7,-3]];

  function scene(target,caster,p,card,drained){
    const returning=p>=.60;
    const unit=returning?caster:target;
    if(!unit||(returning&&(!drained||caster.hp<=0))||(!returning&&p>=.54))return null;
    const inward=unit.team===0?1:-1;
    const growth=returning?smooth((p-.60)/.13)*(1-smooth((p-.90)/.10)):
      smooth(p/.19)*(1-smooth((p-.44)/.10));
    const frame=returning?(p<.65?0:p<.69?4:p<.765?6:p<.91?7:5):
      p<.075?0:p<.165?1:p<.25?2:p<card.hit?3:p<.445&&drained?4:5;
    const scale=.79+clamp((unit.y-390)/235)*.15;
    const x=unit.x+inward*(105+(p<.25&&!returning?-smooth((p-.15)/.10)*10:0));
    const floor=unit.y+11;
    const y=floor+125*(1-growth)-Math.sin(p*48)*4*growth;
    const intensity=returning?Math.sin(Math.PI*clamp((p-.70)/.24)):
      Math.sin(Math.PI*clamp((p-.17)/.29));
    return {unit,dir:-inward,x,y,floor,depthY:unit.y+.13,frame,scale,growth,p,
      returning,intensity,drained,impact:card.hit,delivery:card.healAt};
  }

  function frame(ctx,index,size){
    ctx.drawImage(atlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,
      -118*size/cell,-236*size/cell,size,size);
  }

  function shape(ctx,points,color){
    ctx.fillStyle=color;
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();
    ctx.fill();
  }

  function soul(ctx,x,y,size,glow){
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(size,size);
    ctx.shadowColor="#b869ff";
    ctx.shadowBlur=17*glow;
    shape(ctx,faces,"#a867ef");
    shape(ctx,[[0,-9],[7,-3],[0,1],[-7,-3]],"#e3c6ff");
    shape(ctx,[[0,-9],[0,1],[-6,4],[-7,-3]],"#f9edff");
    shape(ctx,[[0,1],[7,-3],[5,6],[0,10]],"#7c42c5");
    ctx.restore();
  }

  function transfer(ctx,s){
    if(s.intensity<=0)return;
    const {dir,p,unit,x,scale}=s;
    const hand={x:x+dir*50*scale,y:s.y-95*scale};
    const chest={x:unit.x,y:unit.y-77*scale};
    const [from,to]=s.returning?[hand,chest]:[chest,hand];
    const life=s.returning?clamp((p-.765)/(s.delivery-.765)):clamp((p-.22)/(s.impact-.22));
    if(life<=0||life>=1)return;
    ctx.save();
    ctx.globalCompositeOperation="screen";
    for(let i=0;i<12;i++){
      const t=clamp(life-i*.055);
      if(!t)continue;
      const wave=Math.sin(Math.PI*t)*Math.cos(t*8-i*.6);
      const px=lerp(from.x,to.x,t),py=lerp(from.y,to.y,t)+wave*(9+i%4*3);
      ctx.globalAlpha=s.intensity*(1-i/14);
      soul(ctx,px,py,i===0?1.03:.23+i%3*.10,1);
    }
    ctx.restore();
  }

  function draw(ctx,s){
    if(!ready())return;
    ctx.save();
    ctx.globalAlpha*=Math.sin(Math.PI*clamp(s.growth*.80))*.64;
    const shadow=ctx.createRadialGradient(s.x,s.floor,0,s.x,s.floor,54);
    shadow.addColorStop(0,"#ad6fec");shadow.addColorStop(1,"#27123c00");
    ctx.fillStyle=shadow;
    ctx.beginPath();ctx.ellipse(s.x,s.floor,61,15,0,0,Math.PI*2);ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();ctx.rect(s.x-150,s.floor-245,300,248);ctx.clip();
    ctx.globalAlpha*=clamp(s.growth*2.5);
    ctx.translate(s.x,s.y);
    ctx.scale(s.dir*s.scale,s.scale);
    frame(ctx,s.frame,256);
    ctx.restore();
    transfer(ctx,s);
  }

  function portrait(ctx,width,height){
    if(!ready())return;
    ctx.save();
    ctx.translate(width*.48,height*1.08);
    frame(ctx,3,Math.min(width*1.42,height*1.42));
    ctx.restore();
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.SoulGhoul={scene,draw,portrait,onReady};
})();
