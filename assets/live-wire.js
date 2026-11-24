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
  function bolt(g,points,width,phase){
    for(let i=1;i<points.length;i++){
      const [ax,ay]=points[i-1],[bx,by]=points[i];
      const length=Math.hypot(bx-ax,by-ay)||1;
      const nx=(by-ay)/length*width,ny=(ax-bx)/length*width;
      const mx=(ax+bx)*.5,my=(ay+by)*.5;
      facet(g,(i+phase)%2?"#7b65e4":"#577ecc",[[ax+nx,ay-ny],[bx+nx,by-ny],[bx-nx,by+ny],[ax-nx,ay+ny]]);
      facet(g,"#e8f6ff",[[ax,ay],[mx+nx*.48,my-ny*.48],[bx,by],[mx-nx*.35,my+ny*.35]]);
    }
  }
  function staff(u){
    const scale=mix(.60,.90,clamp((u.y-288)/235));
    return [u.x+(u.team?-1:1)*48*scale,u.y-143*scale,scale];
  }
  function coils(g,p,spread){
    const reach=clamp(p/.63);
    for(let layer=0;layer<3;layer++){
      const points=[];
      for(let i=0;i<=18;i++){
        const t=i/18;
        const a=t*11-p*28+layer*tau/3;
        const r=mix(10,28,t)*spread;
        points.push([Math.cos(a)*r,-t*93*reach+Math.sin(a)*r*.36]);
      }
      bolt(g,points,3.4-layer*.6,layer);
    }
    const flare=Math.sin(p*34)*.28+.72;
    for(let i=0;i<9;i++){
      const a=i*tau/9+p*8;
      const x=Math.cos(a)*32*reach,y=-93*reach+Math.sin(a)*24*reach;
      facet(g,i%2?"#b7aeff":"#edfaff",[[x,y],[x+5*flare,y-11],[x+10*flare,y-1]]);
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
    bolt(g,points,5,Math.floor(age*38));
    const burst=clamp((age-.12)/.28);
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
