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
  // Hand-hewn courses on the existing six wall panels. All coordinates
  // stay inside the original silhouette, including during ground emergence.
  const stone=["#94745e","#a7886c","#b59a7b","#876b59","#bca080","#9f8168","#aa8b70"];
  const sideStone=["#634d44","#745b4c","#846756","#695247","#8b6e5a"];
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const noise=n=>{const f=Math.sin(n*127.1+311.7)*43758.5453;return f-Math.floor(f);};
  function stoneFace(g,quad,rows,seed,side=false){
    const [tl,tr,br,bl]=quad,point=(u,v)=>mix(mix(tl,tr,u),mix(bl,br,u),v);
    poly(g,side?"#453a35":"#514239",quad);
    for(let row=0;row<rows;row++){
      const v0=row/rows,v1=(row+1)/rows;
      // Stagger horizontal joints; keep broad rectangular ashlar blocks.
      const split=row%2===0?.62:.36;
      const cuts=side?[0,1]:[0,split,1];
      for(let k=0;k<cuts.length-1;k++){
        const n=seed*73+row*11+k*5,rand=noise(n),gap=side?.035:.025;
        const u0=cuts[k]+gap,u1=cuts[k+1]-gap;
        const top=v0+.024,bottom=v1-.017;
        if(bottom<=top||u1<=u0)continue;
        const corner=.09*(u1-u0),chamfer=Math.min(.014,(bottom-top)*.11);
        const p=(x,y)=>point(x,y);
        const block=[p(u0+corner,top),p(u1-corner*.6,top),p(u1,top+chamfer),p(u1,bottom-chamfer),p(u1-corner,bottom),p(u0+corner*.55,bottom),p(u0,bottom-chamfer),p(u0,top+chamfer)];
        const colors=side?sideStone:stone;
        poly(g,colors[Math.floor(rand*colors.length)],block);
        // Recessed mortar, chipped edges and a shallow bevel on each stone.
        const inset=(u1-u0)*.11,bevel=Math.min(.025,(bottom-top)*.22);
        poly(g,side?"#a18569":"#d4b791",[block[0],block[1],block[2],p(u1-inset,top+bevel),p(u0+inset,top+bevel)]);
        poly(g,side?"#4d3b34":"#735847",[block[2],block[3],block[4],block[5],p(u0+inset,bottom-bevel),p(u1-inset,bottom-bevel),p(u1-inset,top+bevel)]);
        // Subtle flat planes and small weathered chips, rather than large
        // triangular facets crossing the entire wall.
        if(!side&&rand>.28){
          const mid=(u0+u1)/2,cy=(top+bottom)/2;
          poly(g,rand>.68?"#c3a483":"#8c705a",[p(u0+inset,top+bevel),p(mid,top+bevel),p(mid+(u1-u0)*.12,cy),p(u0+inset,cy+(bottom-top)*.15)]);
        }
      }
    }
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
    // Identical panel dimensions, apex, thickness, and growth animation.
    const rows=Math.max(3,Math.round(h/23));
    const seed=Math.round(a[0]*3+a[1]*7);
    stoneFace(g,[tip,peak,b,a],rows,seed);
    stoneFace(g,[peak,cap,foot,b],rows,seed+19,true);
    // A continuous dressed coping course follows each panel's original cap.
    poly(g,"#d1b18b",[tip,shoulders,cap,peak]);
    const capMid=mix(shoulders,cap,.55),faceMid=mix(tip,peak,.55);
    poly(g,"#9b7b5d",[faceMid,capMid,mix(shoulders,cap,.59),mix(tip,peak,.59)]);
    poly(g,"#ead0a8",[tip,shoulders,mix(shoulders,cap,.32),mix(tip,peak,.32)]);
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
    bg.addColorStop(0,"#342b30");bg.addColorStop(.57,"#7d6654");bg.addColorStop(1,"#514137");
    g.fillStyle=bg;g.fillRect(0,0,w,h);
    // Show the same six masonry panels in the same V formation as combat.
    // Frame the complete wall, not unrelated background spikes.
    const scale=Math.min(w/132,h/211);
    g.save();g.translate(w*.5-82*scale,h*.5+36*scale);g.scale(scale,scale);
    g.globalAlpha=.42;poly(g,"#2e2523",[[12,-48],[93,-14],[141,7],[53,84],[10,81],[79,0]]);g.globalAlpha=1;
    wall(g,1,null,"all");
    g.restore();
  }
  window.FaultlineBulwark={draw,portrait};
})();
