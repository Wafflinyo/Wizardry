(() => {
  "use strict";
  const clamp=t=>Math.max(0,Math.min(1,t));
  // Coordinates follow the ground plane, with the apex toward the opposing team.
  const slabs=[
    {a:[39,-61],b:[69,-38],h:94,delay:.34},
    {a:[66,-40],b:[96,-16],h:119,delay:.17},
    {a:[93,-19],b:[111,0],h:139,delay:0},
    {a:[111,0],b:[92,21],h:135,delay:.05},
    {a:[95,18],b:[67,42],h:114,delay:.23},
    {a:[70,39],b:[39,66],h:94,delay:.40}
  ];
  const tones=["#483638","#74534a","#a0775c","#e0b582","#b68a66"];
  function poly(g,color,points){
    g.beginPath();
    points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();
    g.fillStyle=color;
    g.fill();
  }
  function slab(g,{a,b,h,delay},growth,impact){
    const lift=clamp((growth-delay)/.55);
    if(!lift)return;
    const height=h*(1-(1-lift)**3);
    const tip=[a[0]-5,a[1]-height*.94],peak=[b[0]-5,b[1]-height];
    const shoulders=[tip[0]+12,tip[1]-7],cap=[peak[0]+13,peak[1]-6];
    const foot=[b[0]+13,b[1]-6];
    const seam=[(a[0]+b[0])/2-4,(a[1]+b[1])/2-height*.49];
    const lower=[(a[0]+b[0])/2+3,(a[1]+b[1])/2-height*.16];
    poly(g,tones[1],[a,tip,peak,b]);
    poly(g,tones[2],[a,tip,seam,lower]);
    poly(g,"#c2966d",[tip,peak,seam]);
    poly(g,tones[0],[b,peak,cap,foot]);
    poly(g,tones[3],[tip,shoulders,cap,peak]);
    poly(g,tones[4],[seam,peak,b,lower]);
    if(impact){
      const growth=clamp((impact.age-delay*.09)/.12)*(impact.broken?1:impact.stress);
      fissure(g,[peak,[seam[0]+4,seam[1]-17],seam,[lower[0]-4,lower[1]-5],lower],growth);
    }
    if(lift<1){
      g.save();
      g.translate((a[0]+b[0])/2,(a[1]+b[1])/2);
      g.scale(.50,.56);
      dust(g,lift);
      g.restore();
    }
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
  function wall(g,growth,impact,layer="all"){
    const age=impact?.age??0;
    if(!impact?.broken||age<.17){
      if(layer!=="front"){
        g.save();
        g.globalAlpha*=clamp(growth*4)*.46;
        poly(g,"#241d25",[[29,-58],[110,-8],[130,2],[48,74],[25,74],[98,1],[22,-59]]);
        g.restore();
      }
      slabs.forEach((piece,index)=>{if(layer==="all"||(layer==="back"?index<3:index>=3))slab(g,piece,growth,impact);});
    }else if(layer!=="back"){
      g.save();
      g.translate(84,0);
      dust(g,clamp((age-.17)/.61));
      g.restore();
    }
  }
  function draw(g,target,growth,impact,layer="all",factor=1){
    const dir=target.team?-1:1;
    g.save();
    g.translate(target.x,target.y+3);g.scale(dir*factor,factor);
    wall(g,growth,impact,layer);
    g.restore();
    if(impact?.broken&&layer!=="back")debris(g,target.x+dir*91*factor,target.y+3,dir,impact);
  }
  function portrait(g,w,h){
    const bg=g.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,"#352e3a");bg.addColorStop(1,"#966448");
    g.fillStyle=bg;g.fillRect(0,0,w,h);
    g.save();
    g.translate(w*.09,h*.75);
    const scale=Math.min(w/148,h/215);
    g.scale(scale,scale);
    for(let i=0;i<7;i++)poly(g,i%2?"#bf8e69":"#785247",
      [[i*24,50],[i*23+9,-135+i*4],[i*24+34,50]]);
    wall(g,1,{age:.12,stress:.83});
    g.restore();
  }
  window.FaultlineBulwark={draw,portrait};
})();
