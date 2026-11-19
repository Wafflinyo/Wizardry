(()=>{
  const tau=Math.PI*2;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const palette=['#173978','#226da6','#269ec7','#5ed9eb','#c4ffff'];

  function surface(g,points,color){
    g.fillStyle=color;g.beginPath();
    g.moveTo(...points[0]);
    for(const point of points.slice(1))g.lineTo(...point);
    g.closePath();g.fill();
  }

  function currents(g,p){
    for(let arm=0;arm<3;arm++){
      for(let i=0;i<16;i++){
        const point=(index,outer)=>{
          const fraction=index/16;
          const angle=arm*tau/3+fraction*1.76+p*tau*1.65;
          const radius=58-38*fraction+(outer?12*Math.sin(Math.PI*fraction)**.55:0);
          return [Math.cos(angle)*radius,Math.sin(angle)*radius*.54-18*fraction];
        };
        const a=point(i,false),b=point(i,true),c=point(i+1,false),d=point(i+1,true);
        surface(g,[a,b,c],palette[(arm+i)%3]);
        surface(g,[b,d,c],palette[2+(i+arm)%3]);
      }
    }
  }

  function draw(g,{progress,target}){
    g.save();
    g.translate(target.x,target.y-14-77*clamp((progress-.44)/.37));
    const scale=.45+.80*Math.sin(Math.PI*progress);
    g.scale(scale,scale);
    g.globalAlpha=clamp(progress*7)*clamp((1-progress)*7);
    currents(g,progress);
    for(let i=0;i<18;i++){
      const phase=(i*.618+progress*2.8)%1;
      const angle=i*2.4+progress*11,r=29+phase*45;
      const x=Math.cos(angle)*r,y=Math.sin(angle)*r*.45-phase*28;
      surface(g,[[x,y-6],[x+3,y],[x,y+3],[x-2,y]],palette[2+i%3]);
    }
    g.restore();
  }

  function portrait(g,w,h){
    g.save();
    g.translate(w*.5,h*.58);
    const scale=Math.min(w,h)/145;
    g.scale(scale,scale);
    currents(g,.14);
    surface(g,[[0,-47],[15,-22],[12,-13],[0,-5],[-12,-13],[-15,-22]],palette[2]);
    surface(g,[[0,-47],[0,-21],[-12,-13],[-15,-22]],palette[4]);
    surface(g,[[0,-21],[15,-22],[12,-13],[0,-5]],palette[1]);
    g.restore();
  }

  window.RagingWaters={draw,portrait};
})();
