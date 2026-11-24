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
  function staff(u){
    const scale=mix(.60,.90,clamp((u.y-288)/235));
    return [u.x+(u.team?-1:1)*48*scale,u.y-143*scale,scale];
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
    const [x,y,scale]=staff(u);
    g.save();
    g.translate(x,y+84*scale);
    g.scale(scale,scale);
    g.globalAlpha=clamp(p/.12)*(1-clamp((p-.80)/.20));
    coils(g,p,1);
    g.restore();
  }
  function surge(g,source,target,age){
    if(age>=.48)return;
    const [x,y]=staff(source),tx=target.x,ty=target.y-88;
    const head=clamp(age/.14),tail=clamp((age-.12)/.27);
    const points=[];
    for(let i=0;i<=12;i++){
      const t=mix(tail,head,i/12);
      const jitter=Math.sin(i*18.7+Math.floor(age*75)*1.8)*Math.sin(t*Math.PI);
      points.push([mix(x,tx,t),mix(y,ty,t)-Math.sin(t*Math.PI)*43+jitter*22]);
    }
    g.save();
    g.globalAlpha=1-clamp((age-.24)/.24);
    bolt(g,points,5);
    if(head>tail)for(let i=2;i<12;i+=2){
      const phase=Math.floor(age*76)+i;
      fork(g,points[i],phase*1.78,29+i%4*14,phase);
    }
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
