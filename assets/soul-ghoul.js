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
    const returning=p>=.66;
    const unit=returning?caster:target;
    if(!unit||(returning&&(!drained||caster.hp<=0))||(!returning&&p>=.61))return null;
    const inward=unit.team===0?1:-1;
    const growth=returning?smooth((p-.66)/.15)*(1-smooth((p-.95)/.05)):
      smooth(p/.22)*(1-smooth((p-.50)/.11));
    const frame=returning?(p<.715?0:p<.76?4:p<.845?6:p<.956?7:5):
      p<.075?0:p<.16?1:p<.255?2:p<card.hit?3:p<.50&&drained?4:5;
    const fit=window.WizardryUnitVisual?.factor(unit)??1;
    const scale=(1.08+clamp((unit.y-390)/235)*.20)*Math.sqrt(fit);
    const x=unit.x+inward*(123-(!returning?9*smooth((p-.16)/.12):0))*fit;
    const floor=unit.y+11;
    const y=floor+160*(1-growth)-Math.sin(p*26)*5*growth;
    return {unit,dir:-inward,x,y,floor,depthY:unit.y+.13,frame,scale,growth,p,
      returning,drained,impact:card.hit,delivery:card.healAt};
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
    const {dir,p,unit,x,scale}=s;
    const hand={x:x+dir*50*scale,y:s.y-95*scale};
    const chest={x:unit.x,y:window.WizardryUnitVisual?.impactY(unit,80)??unit.y-80};
    const [from,to]=s.returning?[hand,chest]:[chest,hand];
    const start=s.returning?.825:.20;
    const impact=s.returning?s.delivery:s.impact;
    const pulse=clamp((p-impact)/.075);
    if(p<start||pulse>=1)return;
    const progress=clamp((p-start)/(impact-start));
    const intensity=smooth(progress/.22)*(1-pulse);
    const travel=s.returning?smooth((progress-.16)/.84):smooth((progress-.43)/.57);
    const core={x:lerp(from.x,to.x,travel),y:lerp(from.y,to.y-22*Math.sin(Math.PI*travel),travel)};
    ctx.save();
    ctx.globalAlpha=intensity;
    for(let i=0;i<4;i++){
      const wave=Math.sin(p*100+i*1.57)*(16+4*i);
      ctx.strokeStyle=["#321049","#6e30a8","#9d51df","#ddadff"][i];
      ctx.lineWidth=[7,4,2,1][i];
      ctx.beginPath();
      ctx.moveTo(from.x,from.y);
      ctx.bezierCurveTo(lerp(from.x,to.x,.34),from.y+wave-18,
        lerp(from.x,to.x,.76),to.y-wave-13,to.x,to.y);
      ctx.stroke();
    }
    soul(ctx,core.x,core.y,(.6+progress*.85)*(1-pulse*.55),1.3);
    for(let i=0;i<14;i++){
      const phase=(p*4.6+i/14)%1;
      const u=smooth(phase);
      const radius=(s.returning?11:18)*Math.sin(Math.PI*u);
      ctx.globalAlpha=intensity*Math.sin(Math.PI*phase)*.76;
      soul(ctx,lerp(from.x,to.x,u),lerp(from.y,to.y,u)+Math.sin(u*11+i)*radius,.24+i%3*.12,.65);
    }
    if(pulse>0&&(s.returning||s.drained)){
      for(let i=0;i<18;i++){
        const angle=i*2.39996+pulse*.9, radius=8+pulse*(35+i%5*8);
        ctx.globalAlpha=(1-pulse)*.85;
        soul(ctx,to.x+Math.cos(angle)*radius,to.y+Math.sin(angle)*radius*.65-pulse*26,.32+i%3*.14,.85);
      }
      ctx.globalAlpha=(1-pulse)*.8;
      ctx.strokeStyle="#cca1ff";
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.ellipse(to.x,to.y+14,12+pulse*62,5+pulse*24,0,0,Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(ctx,s){
    if(!ready())return;
    ctx.save();
    ctx.globalAlpha*=Math.sin(Math.PI*clamp(s.growth*.80))*.64;
    const shadow=ctx.createRadialGradient(s.x,s.floor,0,s.x,s.floor,69);
    shadow.addColorStop(0,"#ad6fec");shadow.addColorStop(1,"#27123c00");
    ctx.fillStyle=shadow;
    ctx.beginPath();ctx.ellipse(s.x,s.floor,75,18,0,0,Math.PI*2);ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();ctx.rect(s.x-190*s.scale,s.floor-315*s.scale,380*s.scale,315*s.scale+3);ctx.clip();
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
