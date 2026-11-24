(() => {
  "use strict";
  const clamp=t=>Math.max(0,Math.min(1,t));
  const slabs=[
    {x:-49,y:8,w:39,h:108,lean:-12},
    {x:4,y:1,w:48,h:137,lean:4},
    {x:51,y:-10,w:34,h:103,lean:14}
  ];
  const tones=["#694c47","#8d6650","#bc9166","#d5af7f","#a67a56"];
  const cracks=[
    [[-16,-128],[-7,-103],[-22,-84],[-12,-62],[-25,-33]],
    [[-12,-62],[11,-57],[34,-77],[56,-70],[65,-47]],
    [[-22,-84],[-39,-75],[-59,-51],[-61,-20]],
    [[11,-57],[17,-31],[2,-15]]
  ];
  function poly(g,color,points){
    g.beginPath();
    points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();
    g.fillStyle=color;
    g.fill();
  }
  function slab(g,{x,y,w,h,lean},lift){
    g.save();
    g.translate(x,y);
    g.beginPath();
    g.rect(-110,-165,220,165);
    g.clip();
    g.translate(0,h*(1-lift));
    const a=[-w*.5,0],b=[w*.48,0],c=[w*.42+lean,-h*.76];
    const d=[w*.03+lean,-h],e=[-w*.33+lean,-h*.87],f=[-w*.53,-h*.32];
    const seam=[-w*.06+lean*.48,-h*.49];
    poly(g,tones[0],[a,b,c,d,e,f]);
    poly(g,tones[3],[e,d,c,seam]);
    poly(g,tones[2],[f,e,seam,a]);
    poly(g,tones[1],[a,seam,c,b]);
    poly(g,tones[4],[seam,[w*.07,-h*.33],b]);
    g.restore();
  }
  function fissure(g,points,progress){
    const extent=clamp(progress)*(points.length-1);
    g.beginPath();
    g.moveTo(...points[0]);
    for(let i=0;i<points.length-1&&i<extent;i++){
      const [x,y]=points[i],[nextX,nextY]=points[i+1],t=clamp(extent-i);
      g.lineTo(x+(nextX-x)*t,y+(nextY-y)*t);
    }
    g.strokeStyle="#37282b";
    g.lineWidth=5;
    g.stroke();
    g.strokeStyle="#ffdb9c";
    g.lineWidth=1.6;
    g.stroke();
  }
  function dust(g,t){
    if(t<=0||t>=1)return;
    g.save();
    g.globalAlpha*=.44*(1-t);
    for(let i=0;i<13;i++){
      const x=(i-6)*(8+t*7),y=-t*(13+i%4*9);
      const size=5+i%3*3+t*7;
      poly(g,tones[i%tones.length],[[x-size,y],[x+2,y-size],[x+size,y-size*.6],[x+size*1.2,y+3]]);
    }
    g.restore();
  }
  function debris(g,x,y,dir,impact){
    const travel=clamp((impact.age-.17)/.49);
    if(travel<=0||travel>=1)return;
    g.save();
    g.globalAlpha*=1-clamp((travel-.76)/.24);
    for(let i=0;i<24;i++){
      const drift=(i%7-3)*7;
      const progress=clamp(travel*(.74+i%5*.07));
      const a=x+dir*drift+(impact.attacker.x-x)*progress;
      const b=y-70+(impact.attacker.y-y+70)*progress-Math.sin(Math.PI*progress)*(28+i%5*11)+drift*.65;
      const size=3+i%5*2;
      g.save();g.translate(a,b);g.rotate(i+travel*(4+i%4));
      poly(g,tones[(i+1)%tones.length],[[-size,-size*.4],[0,-size],[size,0],[size*.36,size*.8]]);
      poly(g,tones[3],[[-size,-size*.4],[0,-size],[size,0],[0,0]]);
      g.restore();
    }
    g.restore();
  }
  function wall(g,growth,impact){
    const age=impact?.age??0;
    if(!impact?.broken||age<.17){
      slabs.forEach((piece,i)=>{
        const t=clamp((growth-i*.17)/.65);
        slab(g,piece,1-(1-t)**3);
      });
      if(growth<1)dust(g,clamp((growth-.06)/.94));
      if(impact){
        for(const [i,points] of cracks.entries()){
          const reach=impact.broken?1:impact.stress;
          fissure(g,points,clamp((age-i*.014)/.11)*reach);
        }
      }
    }else{
      dust(g,clamp((age-.17)/.61));
    }
  }
  function draw(g,target,growth,impact){
    const dir=target.team?-1:1;
    const x=target.x+dir*67,y=target.y+3;
    g.save();
    g.translate(x,y);g.scale(dir,1);
    wall(g,growth,impact);
    g.restore();
    if(impact?.broken)debris(g,x,y,dir,impact);
  }
  function portrait(g,w,h){
    const bg=g.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,"#352e3a");bg.addColorStop(1,"#966448");
    g.fillStyle=bg;g.fillRect(0,0,w,h);
    g.save();
    g.translate(w*.5,h*.85);
    g.scale(w/190,w/190);
    for(let i=0;i<7;i++)poly(g,i%2?"#bf8e69":"#785247",
      [[-110+i*32,5],[-85+i*31,-92+i*4],[-64+i*30,5]]);
    wall(g,1,{age:.12,stress:.83});
    g.restore();
  }
  window.FaultlineBulwark={draw,portrait};
})();
