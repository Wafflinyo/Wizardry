(() => {
  "use strict";
  const TAU=Math.PI*2;
  const formation={x:500,y:323};
  const clamp=n=>Math.min(1,Math.max(0,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t*t*(3-2*t);
  const point=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});

  function facet(g,fill,points){
    g.fillStyle=fill;
    g.beginPath();
    points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();
    g.fill();
  }
  function spear(g,frame,charge){
    const flicker=Math.sin(frame*.73)*2;
    const tail=-126*charge;
    facet(g,"#6949e9",[[tail,0],[-76*charge,-7],[-25*charge,-6],[0,-16],[9,-15],[43,0],[6,14],[-2,10],[-32*charge,5]]);
    facet(g,"#8b9aff",[[tail,0],[-79*charge,-8],[-65*charge,-4],[-25*charge,-8],[2,-13],[43,0],[-2,2],[-49*charge,-1]]);
    facet(g,"#ddf7ff",[[tail,0],[-76*charge,-2],[-39*charge,-5],[-17,-3],[6,-9],[43,0],[4,4],[-27,2],[-51*charge,4]]);
    facet(g,"#fff5dd",[[4,-4],[43,0],[3,2],[-18,0]]);
    facet(g,"#a66cff",[[tail,1],[-87*charge,8+flicker],[-64*charge,6],[-51*charge,11],[-13,3],[-56*charge,5],[-81*charge,3]]);
  }
  function arc(g,from,to,frame,seed,width,tint){
    const dx=to.x-from.x,dy=to.y-from.y,d=Math.hypot(dx,dy)||1;
    g.beginPath();
    g.moveTo(from.x,from.y);
    for(let i=1;i<8;i++){
      const t=i/8,wave=Math.sin(i*16.4+seed+frame*.69)*width*(.45+.55*Math.sin(Math.PI*t));
      g.lineTo(from.x+dx*t-dy/d*wave,from.y+dy*t+dx/d*wave);
    }
    g.lineTo(to.x,to.y);
    g.strokeStyle=tint;
    g.lineWidth=1.5;
    g.stroke();
  }
  function scene(source,target,p,cast){
    const {hit,siphonAt}=cast.card;
    const hand={x:source.x+(target.x>source.x?24:-24),y:source.y-108};
    const chest={x:target.x,y:target.y-91};
    const angle=Math.atan2(chest.y-formation.y,chest.x-formation.x);
    const dx=Math.cos(angle),dy=Math.sin(angle);
    const release=hit-.052;
    const flight=ease(clamp((p-release)/(hit-release)));
    const pierce=cast.javelinLanded?ease(clamp((p-hit)/.045)):0;
    const forming=clamp(p/release);
    const chargeShape=ease(forming),widthScale=.28+.72*chargeShape;
    const distance=Math.hypot(chest.x-formation.x,chest.y-formation.y);
    const halfLength=(43+126*chargeShape)*widthScale/2;
    const lead=Math.min(halfLength,distance*.6);
    const start={x:formation.x+dx*lead,y:formation.y+dy*lead};
    const seat=point(start,chest,flight);
    const tip={x:seat.x+dx*pierce*64,y:seat.y+dy*pierce*64};
    return {hand,chest,tip,angle,release,hit,siphonAt,p,flight,pierce,forming,chargeShape,widthScale,
      blocked:cast.applied&&!cast.javelinLanded,charge:cast.javelinCharge??0,
      depth:mix(formation.y+91,target.y,flight),frame:Math.floor(p*222)};
  }
  function drawSpear(g,s,layer){
    if(s.p<s.hit&&layer==="back")return;
    if(s.blocked&&layer==="back")return;
    g.save();
    g.translate(s.tip.x,s.tip.y);
    g.rotate(s.angle);
    g.scale(s.widthScale,.38+.62*s.forming);
    g.translate(-43,0);
    if(s.p>=s.hit&&!s.blocked){
      const cut=43-s.pierce*64;
      // The wizard covers the exit segment while the shaft remains visible in front.
      g.beginPath();
      if(layer==="back")g.rect(cut,-28,46-cut,56);
      else g.rect(-175,-28,175+cut,56);
      g.clip();
    }
    const opacity=s.blocked?1-clamp((s.p-s.hit)/.08):1-clamp((s.p-.91)/.09);
    g.globalAlpha=opacity*clamp(s.p/.06);
    spear(g,s.frame,s.chargeShape);
    g.restore();
  }
  function drawDischarge(g,s){
    const {p,hit,release,frame,chest,tip}=s;
    if(p<hit){
      const origin=p<release?formation:tip;
      const reach=p<release?24+62*p/release:90;
      for(let i=0;i<5;i++){
        const a=i*TAU/5+frame*.13;
        const end=p<release?{x:origin.x+Math.cos(a)*reach,y:origin.y+Math.sin(a)*reach*.57}:
          {x:tip.x-Math.cos(s.angle)*(reach+19*i),y:tip.y-Math.sin(s.angle)*(reach+19*i)+Math.sin(a)*24};
        arc(g,origin,end,frame,i,7,i%2?"#a175f4":"#a7e7ff");
      }
      return;
    }
    const impact=clamp((p-hit)/.18);
    for(let i=0;i<14&&impact<1;i++){
      const a=i*TAU/14+Math.sin(i*23)*.15,r=(24+(i%4)*8)*impact+4;
      const x=chest.x+Math.cos(a)*r,y=chest.y+Math.sin(a)*r;
      g.globalAlpha=1-impact;
      facet(g,i%3?"#b7d9ff":"#fff5ce",[[x,y],[x+Math.cos(a)*17,y+Math.sin(a)*17],[x-4,y+4]]);
    }
    g.globalAlpha=1;
  }
  function drawChain(g,s){
    const {p,frame,hand,chest,charge,siphonAt}=s;
    const start=s.hit+.065,connect=s.hit+.26,end=.975;
    if(s.blocked||p<start||p>end)return;
    const anchor={x:chest.x-Math.cos(s.angle)*34,y:chest.y-Math.sin(s.angle)*34};
    const at=t=>{
      const q=point(anchor,hand,t);
      q.y+=Math.sin(Math.PI*t)*(28+4*Math.sin(frame*.16+t*9));
      return q;
    };
    g.globalAlpha=1-clamp((p-.91)/(end-.91));
    const progress=ease(clamp((p-start)/(connect-start)));
    const links=Math.max(5,Math.round(Math.hypot(hand.x-anchor.x,hand.y-anchor.y)/15));
    for(let i=0;i<links*progress;i++){
      const t=(i+.5)/links,q=at(t),n=at(Math.min(1,t+.03));
      g.save();
      g.translate(q.x,q.y);
      g.rotate(Math.atan2(n.y-q.y,n.x-q.x));
      const h=(i%2?3.4:6.5)+Math.sin(frame*.24-i*.57);
      const w=Math.max(7,Math.hypot(hand.x-anchor.x,hand.y-anchor.y)/links*.63);
      g.beginPath();
      for(const [j,[x,y]] of [[-w,0],[-w*.6,-h],[w*.59,-h],[w,0],[w*.59,h],[-w*.6,h]].entries())
        j?g.lineTo(x,y):g.moveTo(x,y);
      g.closePath();
      g.strokeStyle="#7450f3";g.lineWidth=4;g.stroke();
      g.strokeStyle=i%2?"#a2c9ff":"#deeaff";g.lineWidth=1.5;g.stroke();
      g.restore();
    }
    arc(g,anchor,at(progress),frame,3,7,"#b5a3ff");
    for(let i=0;i<charge;i++){
      const departure=connect+.02+i*.045;
      if(p<departure||p>siphonAt)continue;
      const t=clamp((p-departure)/(siphonAt-departure)),q=at(t);
      facet(g,"#a787ff",[[q.x-14,q.y],[q.x,q.y-10],[q.x+14,q.y],[q.x,q.y+10]]);
      facet(g,"#fff7dd",[[q.x-8,q.y],[q.x,q.y-5],[q.x+8,q.y],[q.x,q.y+5]]);
    }
    g.globalAlpha=1;
  }
  function draw(g,s,layer){
    g.save();
    drawSpear(g,s,layer);
    if(layer==="front"){
      drawDischarge(g,s);
      drawChain(g,s);
    }
    g.restore();
  }
  function portrait(g,w,h){
    g.save();
    const sky=g.createLinearGradient(0,0,w,h);
    sky.addColorStop(0,"#131337");sky.addColorStop(.55,"#342664");sky.addColorStop(1,"#080b27");
    g.fillStyle=sky;g.fillRect(0,0,w,h);
    for(let i=0;i<10;i++){
      const x=w*i/8;
      facet(g,i%2?"#423275":"#292151",[[x,0],[x-w*.31,h],[x+w*.14,h*.68]]);
    }
    for(let i=0;i<5;i++)arc(g,{x:w*.68,y:h*.38},{x:w*(i+1)/6,y:h*.97},12,i,8,"#7764c9");
    g.translate(w*.61,h*.45);
    g.rotate(-.57);
    g.scale(w/175,w/175);
    spear(g,7,1);
    g.restore();
  }
  window.ChainedJavelin={scene,draw,portrait};
})();
