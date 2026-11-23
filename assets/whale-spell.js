(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/whale-spell-frames.webp?v=0.301.0";

  const body=new Image();
  const bodyReady=()=>body.complete&&body.naturalWidth>0;
  body.onload=()=>listeners.splice(0).forEach(fn=>fn());
  body.src="./assets/whale-airborne.webp?v=0.301.1";
  const hit=.70, cell=256;
  const clamp=p=>Math.min(1,Math.max(0,p));
  const ease=p=>{p=clamp(p);return p*p*(3-2*p);};
  const mix=(a,b,p)=>a+(b-a)*p;

  function sprite(ctx,frame,width,anchor){
    const left=frame%3*cell,top=Math.floor(frame/3)*cell;
    ctx.drawImage(atlas,left,top,cell,cell,-width/2,-anchor*width,width,width);
  }

  function scene(targets,team,p){
    const dir=team===0?1:-1, startX=500-dir*80,startY=505;
    const xs=targets.map(u=>u.x),ys=targets.map(u=>u.y);
    const endX=(Math.min(...xs)+Math.max(...xs))/2;
    const endY=(Math.min(...ys)+Math.max(...ys))/2;
    const size=Math.max(340,Math.max(...xs)-Math.min(...xs)+205);
    return {targets,dir,startX,startY,endX,endY,size,p};
  }

  function pool(ctx,{startX,startY,endX,endY,dir,p,size}){
    ctx.save();
    const swell=ease(p/.19), flood=ease((p-.52)/.18),fade=1-ease((p-.82)/.18);
    const rings=(x,y,extra,alpha)=>{
      ctx.save();
      ctx.translate(x,y);
      ctx.globalAlpha*=alpha;
      ctx.fillStyle="#157d9d65";
      ctx.beginPath();ctx.ellipse(0,0,107+extra,28+extra*.19,0,0,Math.PI*2);ctx.fill();
      for(let i=0;i<3;i++){
        const ripple=(p*3+i/3)%1;
        ctx.save();
        ctx.globalAlpha*=(1-ripple)*.65;
        ctx.lineWidth=2.5;
        ctx.strokeStyle="#a3e7ed";
        ctx.beginPath();
        ctx.ellipse(0,0,54+ripple*(104+extra),12+ripple*(26+extra*.19),0,0,Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };
    rings(startX,startY,0,swell*(1-ease((p-.44)/.35)));
    if(ready()&&p>.13&&p<.53){
      ctx.save();
      ctx.translate(startX,startY+5);
      ctx.scale(dir,.65);
      ctx.globalAlpha*=ease((p-.13)/.075)*(1-ease((p-.24)/.29));
      sprite(ctx,5,205+ease((p-.18)/.35)*33,.82);
      ctx.restore();
    }
    if(p>=hit)rings(endX,endY,size*.36,flood*fade);
    ctx.restore();
  }

  function draw(ctx,{targets,dir,startX,startY,endX,endY,size,p}){
    if(!ready()||p<.125)return;
    ctx.save();
    if(p<hit){
      const flight=clamp((p-.14)/(hit-.14));
      const advance=ease((flight-.13)/.87);
      const lift=flight<.52?255*(1-(1-flight/.52)**2):255*(1-((flight-.52)/.48)**2);
      const frame=Math.min(11,Math.floor(flight*12));
      const waterline=mix(startY,endY,advance);
      ctx.beginPath();
      ctx.rect(-400,-600,1800,600+waterline+7);
      ctx.clip();
      ctx.translate(mix(startX,endX,advance),waterline-lift);
      ctx.scale(dir,1);
      if(bodyReady()){
        const anchor=mix(.32,.59,ease((flight-.04)/.87));
        ctx.drawImage(body,frame%4*cell,Math.floor(frame/4)*cell,cell,cell,
          -size/2,-anchor*size,size,size);
      }

    }else{
      const age=(p-hit)/(1-hit);
      ctx.globalAlpha*=1-ease((age-.24)/.76);
      ctx.translate(endX,endY+8);
      ctx.scale(dir,1);
      const spread=1+ease(age/.55)*.29;
      sprite(ctx,5,size*spread,.78);
      for(const target of targets){
        ctx.save();
        ctx.translate((target.x-endX)*dir,target.y-endY);
        ctx.scale(1,.52);
        ctx.globalAlpha*=.60;
        sprite(ctx,5,106+age*49,.69);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function portrait(ctx,w,h){
    if(!ready())return;
    ctx.save();ctx.translate(w/2,h*.70);
    sprite(ctx,3,Math.min(w*1.09,h*1.50),.70);
    ctx.restore();
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.WhaleSpell={scene,pool,draw,portrait,onReady};
})();
