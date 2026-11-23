(() => {
  "use strict";

  const hit=.79, tau=Math.PI*2;
  const clamp=p=>Math.max(0,Math.min(1,p));
  const arc=(p,a,b)=>p>a&&p<b?Math.sin(Math.PI*(p-a)/(b-a)):0;
  const point=(angle,r,offset=0)=>[Math.cos(angle)*r+offset,Math.sin(angle)*r];
  const tread=["#41404b","#5c5054","#352a33","#66524e"];
  const fire=["#a92b27","#f45924","#ff982d","#ffd35c","#ffed9a"];

  function poly(ctx,points,color){
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for(const p of points.slice(1))ctx.lineTo(...p);
    ctx.closePath();
    ctx.fillStyle=color;
    ctx.fill();
  }

  function rim(ctx,spin){
    const count=14;
    for(let i=0;i<count;i++){
      const a=i*tau/count,b=(i+1)*tau/count;
      poly(ctx,[point(a,48,-26),point(b,48,-26),point(b,48),point(a,48)],"#211c26");
    }
    for(let i=0;i<count;i++){
      const a=spin+i*tau/count,b=a+tau/count*.78;
      poly(ctx,[point(a,49,-24),point(b,49,-24),point(b+.12,50,2),point(a+.12,50,2)],tread[i%4]);
      poly(ctx,[point(a,49,-24),point(a+.13,52,-20),point(a+.29,51,0),point(a+.12,50,2)],"#71605a");
    }
    for(let i=0;i<count;i++){
      const a=i*tau/count,b=(i+1)*tau/count;
      poly(ctx,[point(a,50),point(b,50),point(b,27),point(a,27)],tread[(i+1)%4]);
      poly(ctx,[point(a,42),point(b,42),point(b,35),point(a,35)],"#2c222b");
      poly(ctx,[point(a,27),point(b,27),point(b,17),[0,0],point(a,17)],i%2?"#a29aa4":"#5e5365");
    }
    for(let i=0;i<6;i++){
      const a=spin+i*tau/6;
      poly(ctx,[point(a-.16,25),point(a+.18,25),point(a+.39,9),point(a-.21,9)],"#d4b59d");
      poly(ctx,[point(a+.18,25),point(a+.39,9),point(a+.68,9),point(a+.34,23)],"#605262");
    }
    poly(ctx,Array.from({length:6},(_,i)=>point(spin+i*tau/6,10)),"#ffe0a7");
  }

  function flames(ctx,frame,front){
    for(let i=0;i<12;i++){
      const a=i*tau/12,wrap=Math.sin(a+frame*.23);
      if(front!==(i%3===0))continue;
      const length=11+(i*17+frame*7)%22;
      const root=point(a,43,-8),base=point(a+.26,50,-8),end=point(a+.22+wrap*.14,52+length,-16);
      poly(ctx,[root,point(a-.16,57,-20),end,point(a+.22,56,-13),base],fire[(i+frame)%3]);
      poly(ctx,[root,point(a-.07,53,-12),point(a+.18,54+length*.56,-13),base],fire[3+(i+frame)%2]);
    }
  }

  function pose(target,team,p){
    const dir=team===0?1:-1, start=500-dir*145;
    const q=clamp(p/hit);
    const x=start+(target.x-dir*31-start)*q;
    const floor=540+(target.y-540)*q;
    const lift=(arc(q,0,.34)*98+arc(q,.34,.64)*62+arc(q,.64,.88)*31);
    return {x,floor,lift,dir,p,q,target};
  }

  function draw(ctx,{x,floor,lift,dir,p,q}){
    if(p>=hit)return;
    const f=Math.floor(q*64),scale=.98;
    ctx.save();
    ctx.translate(x,floor);
    ctx.globalAlpha*=clamp(p/.095);
    ctx.fillStyle="#24152467";
    ctx.beginPath();ctx.ellipse(0,1,38-lift*.12,8-lift*.035,0,0,tau);ctx.fill();
    ctx.translate(0,-50-lift);
    ctx.scale(dir*scale,scale);
    for(let i=0;i<8;i++){
      const age=(f+i*3)%17/17,dx=-24-age*(57+i*6),dy=10-age*(22+i*4);
      poly(ctx,[[dx-5,dy],[dx+3,dy-6],[dx+8,dy],[dx+1,dy+3]],fire[(i+f)%fire.length]);
    }
    flames(ctx,f,false);
    rim(ctx,f*.27);
    flames(ctx,f,true);
    ctx.restore();
  }

  function impact(ctx,target,p){
    if(p<hit||p>hit+.18)return;
    const q=(p-hit)/.18;
    ctx.save();
    ctx.translate(target.x,target.y-53);
    ctx.globalAlpha*=(1-q)**1.35;
    for(let i=0;i<17;i++){
      const a=i*2.39996, r=15+q*(42+i%5*15);
      poly(ctx,[point(a-.12,r),point(a,r+13+i%4*7),point(a+.12,r),point(a,r*.69)],fire[i%5]);
    }
    ctx.restore();
  }

  function portrait(ctx,w,h){
    const size=Math.min(w,h)/156;
    ctx.save();ctx.translate(w*.53,h*.53);ctx.scale(size,size);
    flames(ctx,3,false);rim(ctx,.8);flames(ctx,3,true);
    ctx.restore();
  }

  window.FlameWheel={pose,draw,impact,portrait};
})();
