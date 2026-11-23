(() => {
  "use strict";

  const atlas=new Image(),listeners=[];
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/flame-wheel-frames.webp?v=0.302.1";

  const explosion=new Image();
  explosion.src="./assets/devil-flame-burst-v98.webp";

  const hit=.79, tau=Math.PI*2,cell=256;
  const clamp=p=>Math.max(0,Math.min(1,p));
  const mix=(a,b,p)=>a+(b-a)*p;
  const arc=(p,a,b)=>p>a&&p<b?Math.sin(Math.PI*(p-a)/(b-a)):0;
  const point=(angle,r)=>[Math.cos(angle)*r,Math.sin(angle)*r];
  const fire=["#a92b27","#f45924","#ff982d","#ffd35c","#ffed9a"];

  function poly(ctx,points,color){
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for(const p of points.slice(1))ctx.lineTo(...p);
    ctx.closePath();
    ctx.fillStyle=color;
    ctx.fill();
  }

  function frame(ctx,index,width){
    ctx.drawImage(atlas,index%2*cell,Math.floor(index/2)*cell,cell,cell,-width/2,-width/2,width,width);
  }

  function track(target,dir,q){
    const entry=dir===1?-78:1078;
    const end=target.x-dir*37;
    const x=mix(entry,end,q);
    const floor=mix(447,target.y,q);
    const fall=clamp(q/.41);
    const lift=590*(1-fall**1.63)+arc(q,.41,.70)*108+arc(q,.70,.91)*53;
    return {x,floor,lift,y:floor-58-lift};
  }

  function pose(target,team,p){
    const dir=team===0?1:-1,q=clamp(p/hit);
    return {...track(target,dir,q),dir,p,q,target};
  }

  function trail(ctx,target,dir,q){
    for(let i=10;i>=1;i--){
      const age=i*.010;
      if(q<=age)continue;
      const a=track(target,dir,q-age),b=track(target,dir,q-age-.009);
      const widen=6+12*(1-i/11),jitter=Math.sin(i*2.4+q*61)*8;
      ctx.save();
      ctx.globalAlpha*=.73*(1-i/12);
      const dx=a.x-b.x,dy=a.y-b.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
      poly(ctx,[[a.x+nx*widen,a.y+ny*widen],[a.x-nx*widen,a.y-ny*widen],
        [b.x+nx*jitter,b.y+ny*jitter]],fire[i%3]);
      for(let j=0;j<2;j++){
        const x=a.x+jitter*2*dir,y=a.y+jitter*(j+1);
        poly(ctx,[[x-3,y],[x,y-6],[x+5,y+1]],fire[2+j]);
      }
      ctx.restore();
    }
  }

  function draw(ctx,{x,floor,lift,y,dir,p,q,target}){
    if(!ready()||p>=hit)return;
    ctx.save();
    ctx.globalAlpha*=clamp(p/.07);
    trail(ctx,target,dir,q);
    if(lift<150){
      ctx.save();
      ctx.globalAlpha*=1-lift/150;
      ctx.fillStyle="#24152478";
      ctx.beginPath();ctx.ellipse(x,floor+1,45-lift*.19,9-lift*.038,0,0,tau);ctx.fill();
      ctx.restore();
    }
    for(const bounce of [.41,.70,.91]){
      const age=(q-bounce)/.10;
      if(age<0||age>1)continue;
      const mark=track(target,dir,bounce);
      ctx.save();ctx.translate(mark.x,mark.floor);
      ctx.globalAlpha*=1-age;
      for(let i=0;i<7;i++){
        const dx=(i-3)*(5+age*11),dy=-Math.sin(age*Math.PI)*(14+i%3*12);
        poly(ctx,[[dx-5,dy],[dx+3,dy-7],[dx+5,dy+2]],fire[1+i%4]);
      }
      ctx.restore();
    }
    ctx.translate(x,y);ctx.scale(dir,1);
    frame(ctx,Math.floor(q*43)%4,192);
    ctx.restore();
  }

  function eruption(ctx,x,y,width,age,alpha){
    if(age<0||age>=1||!explosion.complete||!explosion.naturalWidth)return;
    const index=Math.min(7,Math.floor(age*8));
    const cell=explosion.naturalWidth/4;
    ctx.save();
    ctx.globalAlpha*=alpha;
    ctx.drawImage(explosion,index%4*cell,Math.floor(index/4)*cell,cell,cell,
      x-width/2,y-width*.94,width,width);
    ctx.restore();
  }

  function impact(ctx,target,p){
    if(p<hit||p>=1)return;
    const q=(p-hit)/(1-hit);
    ctx.save();
    ctx.translate(target.x,target.y-3);

    // A contact flash breaks into a tall fireball and smaller side eruptions.
    if(q<.32){
      const radius=19+q*170;
      ctx.save();
      ctx.translate(0,-54);
      ctx.globalAlpha*=.76*(1-q/.32);
      poly(ctx,Array.from({length:12},(_,i)=>point(i*tau/12,radius*(i%2?.47:1))),"#fff0ab");
      ctx.restore();
    }
    eruption(ctx,0,0,204,q,.95);
    eruption(ctx,-48-q*26,1,132,q-.08,.77);
    eruption(ctx,52+q*32,4,146,q-.15,.80);

    ctx.save();
    ctx.translate(0,-42);
    ctx.globalAlpha*=(1-q)**1.25;
    for(let i=0;i<24;i++){
      const angle=i*2.39996,r=13+q*(62+i%6*18);
      const [x,y]=point(angle,r);
      const fall=48*q*q;
      poly(ctx,[[x-3,y+fall],[x+7+q*4,y-7+fall],[x+4,y+3+fall]],fire[(i+2)%5]);
    }
    ctx.restore();
    ctx.restore();
  }

  function portrait(ctx,w,h){
    if(!ready())return;
    ctx.save();ctx.translate(w*.50,h*.52);
    frame(ctx,1,Math.min(w,h)*1.10);
    ctx.restore();
  }

  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.FlameWheel={pose,draw,impact,portrait,onReady};
})();
