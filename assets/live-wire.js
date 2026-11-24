(() => {
  "use strict";
  const clamp=t=>Math.max(0,Math.min(1,t));
  const mix=(a,b,t)=>a+(b-a)*t;
  const tau=Math.PI*2;
  function facet(g,color,pts){
    g.beginPath();
    pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();g.fillStyle=color;g.fill();
  }
  function bolt(g,points,width){
    for(const [color,weight,alpha] of [["#527efa",3.4,.27],["#8178ff",1.9,.86],["#bff5ff",.92,.95],["#f9ffff",.44,1]]){
      g.save();
      g.globalAlpha*=alpha;
      g.strokeStyle=color;
      g.lineWidth=width*weight;
      g.lineJoin="miter";
      g.miterLimit=2.3;
      g.beginPath();
      points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
      g.stroke();
      g.restore();
    }
  }
  function fork(g,origin,angle,length,tick){
    const [x,y]=origin,dx=Math.cos(angle),dy=Math.sin(angle);
    const points=[[x,y]];
    for(let i=1;i<=5;i++){
      const t=i/5;
      const jump=(i%2?1:-1)*length*(.11+.06*Math.sin(tick+i*9))*(1-t*t);
      points.push([x+dx*length*t-dy*jump,y+dy*length*t+dx*jump]);
    }
    bolt(g,points,1.8);
  }
  const center=[500,282];
  function discharge(g,destination,head,tail,tick,width){
    if(head<=tail)return;
    const [x,y]=center,[tx,ty]=destination;
    const points=[];
    for(let i=0;i<=14;i++){
      const t=mix(tail,head,i/14);
      const jag=(i%2?1:-1)*(6+12*Math.abs(Math.sin(i*9.4+tick)))*Math.sin(Math.PI*t);
      points.push([mix(x,tx,t),mix(y,ty,t)-Math.sin(t*Math.PI)*35+jag]);
    }
    const [px,py]=points.at(-1);
    for(let i=2;i<points.length-2;i+=3)
      fork(g,points[i],tick*1.3+i*2.45,25+i%5*10,tick+i);
    bolt(g,points,width);
    if(head<1)facet(g,"#f3ffff",[[px-8,py],[px,py-7],[px+10,py],[px,py+7]]);
  }
  function storm(g,p){
    const tick=Math.floor(p*44),radius=mix(64,24,clamp(p));
    for(let i=0;i<9;i++){
      const angle=i*tau/9+p*6;
      const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*.62;
      fork(g,[x,y],angle+Math.PI+.4,radius*.85,tick+i);
      facet(g,i%2?"#9f8aff":"#d4ffff",[[x-5,y],[x+3,y-7],[x+8,y+2],[x+2,y+5]]);
    }
    const pulse=clamp(p*2);
    facet(g,"#7565e5",[[0,-20*pulse],[18*pulse,0],[0,21*pulse],[-18*pulse,0]]);
    facet(g,"#f1ffff",[[0,-12*pulse],[10*pulse,1],[0,11*pulse],[-9*pulse,0]]);
  }
  function coils(g,p,spread){
    const reach=clamp(p/.63);
    const tick=Math.floor(p*38);
    for(let layer=0;layer<3;layer++){
      const points=[];
      for(let i=0;i<=15;i++){
        const t=i/15;
        const a=t*12-p*27+layer*tau/3;
        const zig=(i%2?1:-1)*(3+4*Math.sin(tick*2+i*5+layer));
        const r=(mix(10,32,t)+zig)*spread;
        points.push([Math.cos(a)*r,-t*90*reach+Math.sin(a)*r*.38]);
      }
      bolt(g,points,3.4-layer*.52);
      for(let i=4;i<=13;i+=3){
        const angle=tick*1.73+i*.66+layer*2;
        fork(g,points[i],angle,(18+10*layer)*reach,tick+i);
      }
    }
    const burst=clamp((p-.55)/.08)*(1-clamp((p-.73)/.13));
    if(burst){
      g.save();
      g.translate(0,-92*reach);
      g.globalAlpha*=burst;
      facet(g,"#e3f9ff",[[0,-25],[7,-6],[29,0],[7,6],[0,24],[-6,6],[-24,0],[-6,-5]]);
      for(let i=0;i<8;i++)fork(g,[0,0],i*tau/8+.22,25+i%3*11,tick+i);
      g.restore();
    }
  }
  function charge(g,u,p){
    const destination=[u.x,u.y-96];
    const release=.46,arrival=.73;
    g.save();
    g.globalAlpha=clamp(p/.12)*(1-clamp((p-release)/.24));
    g.save();g.translate(...center);
    storm(g,clamp(p/release));
    g.restore();
    g.globalAlpha=1-clamp((p-arrival)/.22);
    discharge(g,destination,clamp((p-release)/(arrival-release)),clamp((p-.65)/.28),Math.floor(p*55),6);
    if(p>=arrival){
      const flash=clamp((p-arrival)/.15);
      g.save();g.translate(...destination);g.scale(.7+flash*.55,.7+flash*.55);
      g.globalAlpha=1-flash;
      storm(g,.76+flash*.24);
      g.restore();
    }
    g.restore();
  }
  function surge(g,target,age){
    if(age>=.48)return;
    const tx=target.x,ty=target.y-88;
    const head=clamp(age/.12),tail=clamp((age-.12)/.27);
    g.save();
    g.globalAlpha=1-clamp((age-.24)/.24);
    discharge(g,[tx,ty],head,tail,Math.floor(age*80),8);
    const burst=clamp((age-.12)/.28);
    if(burst>0&&burst<.58){
      g.save();
      g.globalAlpha*=1-burst/.58;
      for(let i=0;i<9;i++)fork(g,[tx,ty],i*tau/9,25+i%3*11+burst*35,i);
      g.restore();
    }
    if(burst>0)for(let i=0;i<12;i++){
      const a=i*tau/12,dx=Math.cos(a),dy=Math.sin(a);
      const radius=9+burst*(29+i%4*6);
      const px=tx+dx*radius,py=ty+dy*radius;
      facet(g,i%2?"#9d8cf0":"#e6f6ff",[[px-dy*4,py+dx*4],[px+dx*16,py+dy*16],[px+dy*4,py-dx*4]]);
    }
    g.restore();
  }
  function portrait(g,w,h){
    const bg=g.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,"#17172e");bg.addColorStop(1,"#423882");
    g.fillStyle=bg;g.fillRect(0,0,w,h);
    g.save();
    g.translate(w*.5,h*.79);
    g.scale(w/106,h/135);
    g.rotate(.32);
    facet(g,"#ccac83",[[-5,20],[2,19],[4,-87],[-2,-88]]);
    facet(g,"#a697f9",[[-12,-89],[0,-111],[13,-91],[3,-82]]);
    facet(g,"#e5dfff",[[0,-111],[13,-91],[1,-92]]);
    coils(g,.64,1.3);
    g.restore();
  }
  window.LiveWire={charge,surge,portrait};
})();
