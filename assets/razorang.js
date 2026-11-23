(() => {
  "use strict";
  const clamp=t=>Math.max(0,Math.min(1,t));
  const mix=(a,b,t)=>a+(b-a)*t;
  const offset=(p,x,y)=>({x:p.x+x,y:p.y+y});
  const colors=["#a2e7db","#d8fff0","#67c7be","#418d98","#577caf"];
  const rim=["#f3fff3","#b8ffd4","#e5fff2"];
  const center={x:500,y:315};

  function chest(unit){return {x:unit.x,y:unit.y-85};}
  function cubic(a,b,c,d,t){
    const u=1-t;
    return {
      x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,
      y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y
    };
  }

  function scene(source,target,neighbor,p,card){
    const first=chest(target),second=neighbor?chest(neighbor):null;
    const dir=target.x>=source.x?1:-1;
    const launch=card.hit-.18;
    const bank=card.hit+(card.returnAt-card.hit)*.52;
    const outside=dir*Math.max(dir*first.x,dir*(second?.x??first.x));
    const boundary=dir===1?996:4;
    const turnRadius=Math.min(105,Math.max(57,dir*(boundary-outside)));
    const wing={x:outside+dir*turnRadius,y:Math.max(155,Math.min(first.y,second?.y??first.y)-68)};
    function position(t){
      if(t<=launch)return offset(center,0,9*Math.sin(Math.PI*clamp(t/launch)));
      if(t<=card.hit)return cubic(center,offset(center,dir*43,-29),
        offset(first,-dir*58,0),first,clamp((t-launch)/(card.hit-launch)));
      if(!second)return cubic(first,offset(first,dir*64,0),offset(wing,0,56),
        wing,clamp((t-card.hit)/.26));
      if(t<=bank)return cubic(first,offset(first,dir*63,0),offset(wing,0,35),wing,
        clamp((t-card.hit)/(bank-card.hit)));
      if(t<=card.returnAt)return cubic(wing,offset(wing,0,-39),offset(second,dir*63,0),
        second,clamp((t-bank)/(card.returnAt-bank)));
      return cubic(second,offset(second,-dir*52,0),offset(center,dir*38,25),center,
        clamp((t-card.returnAt)/(1-card.returnAt)));
    }
    const blade=position(p),before=position(p-.002),after=position(p+.002);
    const angle=p<launch?dir===1?-.22:Math.PI+.22:Math.atan2(after.y-before.y,after.x-before.x);
    const strikes=[{unit:target,age:(p-card.hit)/.15,dir}];
    if(neighbor)strikes.push({unit:neighbor,age:(p-card.returnAt)/.14,dir:-dir});
    const fade=neighbor?.91:.62;
    const fadeEnd=neighbor?1:.83;
    return {blade,angle,p,dir,launch,strikes,position,seconds:p*card.duration/1000,depth:blade.y+85+.13,
      alpha:clamp(p/.11)*(1-clamp((p-fade)/(fadeEnd-fade)))};
  }

  function polygon(g,fill,vertices){
    g.fillStyle=fill;
    g.beginPath();
    vertices.forEach(({x,y},i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();
    g.fill();
  }

  function airPoint(t,radius,squash){
    const angle=(t-.5)*Math.PI*1.64;
    return {x:Math.cos(angle)*radius-15,y:Math.sin(angle)*radius*squash};
  }

  function airSlash(g,start,length,radius,thickness,squash,tint){
    const edge=[],inside=[];
    const samples=12;
    for(let i=0;i<=samples;i++){
      const u=i/samples,t=start+u*length;
      const taper=Math.sin(Math.PI*u)**.86*(.52+.48*u);
      edge.push(airPoint(t,radius,squash));
      inside.push(airPoint(t,radius-thickness*taper,squash));
    }
    polygon(g,tint,[...edge,...inside.reverse()]);
  }

  function crescent(g,roll,spin,seconds=.37){
    const squash=Math.cos(roll);
    const opacity=g.globalAlpha;
    const streams=[
      {radius:59,length:.73,width:8,speed:2.05,phase:.07,tint:"#d7ffee"},
      {radius:53,length:.82,width:10,speed:1.47,phase:.59,tint:"#81e9d7"},
      {radius:47,length:.68,width:9,speed:1.82,phase:.26,tint:"#baffef"},
      {radius:41,length:.63,width:8,speed:1.26,phase:.82,tint:"#55c9c6"},
      {radius:34,length:.51,width:6,speed:1.67,phase:.31,tint:"#95ebda"}
    ];
    g.save();
    g.rotate(spin);
    for(const [lane,stream] of streams.entries()){
      for(let i=0;i<4;i++){
        const phase=seconds*stream.speed+stream.phase+i/4;
        const head=phase-Math.floor(phase);
        // Each gust enters from a horn and tapers off at the opposite horn.
        const start=mix(-stream.length,.98,head);
        const from=Math.max(0,start),to=Math.min(1,start+stream.length);
        if(to-from<.01)continue;
        const breadth=clamp((to-from)/.26);
        const drift=Math.sin(head*Math.PI*2+lane)*2.1;
        g.globalAlpha=opacity*breadth*(lane===0?.72:.44);
        airSlash(g,from,to-from,stream.radius+drift,stream.width*breadth,squash,stream.tint);
        const streak=from+(to-from)*.58;
        g.globalAlpha=opacity*breadth*.78;
        airSlash(g,streak,to-streak,stream.radius+drift+1,2.3,squash,"#effff7");
      }
    }
    g.restore();
  }

  function draw(g,s){
    g.save();
    g.globalAlpha=s.alpha;
    const wakeEnd=Math.max(s.launch,s.p-.09);
    if(s.p>s.launch){
      for(let i=14;i>0;i--){
        const time=mix(s.p,wakeEnd,i/15),q=s.position(time),next=s.position(time+.008);
        const tangent=Math.atan2(next.y-q.y,next.x-q.x);
        const size=(1-i/16)*23;
        const x=Math.sin(tangent)*size,y=-Math.cos(tangent)*size;
        const pulse=.63+.37*Math.sin(i*.83-s.seconds*24);
        g.globalAlpha=s.alpha*(1-i/16)*.42*pulse;
        polygon(g,i%3?"#aaf7e1":"#e5fff6",[
          offset(q,x,y),offset(next,x*.68,y*.68),offset(next,-x*.13,-y*.13),offset(q,-x*.46,-y*.46)
        ]);
      }
    }else{
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6+s.p*15,r=mix(105,44,clamp(s.p/s.launch));
        const x=Math.cos(a)*r,y=Math.sin(a)*r*.52;
        g.globalAlpha=s.alpha*(.25+i%3*.14);
        polygon(g,colors[i%colors.length],[offset(s.blade,x,y),offset(s.blade,x+12,y-7),offset(s.blade,x+20,y-3)]);
      }
    }
    g.globalAlpha=s.alpha;
    g.translate(s.blade.x,s.blade.y);
    g.rotate(s.angle);
    const formed=mix(.42,1,clamp(s.p/s.launch));
    g.scale(formed,formed);
    crescent(g,.55*Math.sin(s.p*38),.30*Math.sin(s.p*31),s.seconds);
    g.restore();
  }

  function impact(g,{unit,age,dir}){
    if(age<0||age>=1)return;
    const p=chest(unit);
    g.save();
    g.globalAlpha=(1-age)*.94;
    for(let i=0;i<12;i++){
      const x=dir*(14+age*(45+i*5)),y=(i-5.5)*(2+age*3);
      polygon(g,rim[i%rim.length],[offset(p,x,y),offset(p,x-dir*(13+i%4*5),y-3),offset(p,x+dir*4,y+4)]);
    }
    const cut=age*dir*28;
    polygon(g,"#eafff4",[offset(p,cut-31,18),offset(p,cut-9,-3),offset(p,cut+33,-20),offset(p,cut+10,-2)]);
    g.restore();
  }

  function portrait(g,w,h){
    const gradient=g.createLinearGradient(0,0,w,h);
    gradient.addColorStop(0,"#182f43");gradient.addColorStop(.52,"#33716e");gradient.addColorStop(1,"#132939");
    g.fillStyle=gradient;g.fillRect(0,0,w,h);
    for(let i=0;i<9;i++)polygon(g,i%2?"#488e85":"#286863",
      [{x:0,y:h*i/8},{x:w,y:h*(i-2)/8},{x:w*.38,y:h*(i+.7)/8}]);
    g.save();g.translate(w*.57,h*.51);g.rotate(-.5);g.scale(w/115,w/115);
    crescent(g,.4,0);g.restore();
  }

  window.Razorang={scene,draw,impact,portrait};
})();
