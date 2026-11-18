(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/cyclops.webp';
  const clamp=x=>Math.max(0,Math.min(1,x)),tau=Math.PI*2;
  const release=.635,hit=.80,flight=p=>clamp((p-release)/(hit-release));
  const times=[0,.13,.215,.275,.34,.45,.53,.605,release,.72,.84];
  function frame(g,i,x,y,w,h){
    if(atlas.naturalWidth)g.drawImage(atlas,i%4*256,Math.floor(i/4)*256,256,256,x,y,w,h);
  }
  function debris(g,x,y,q,radius){
    if(q<=0||q>=1)return;
    g.save();g.globalAlpha*=1-q;
    for(let i=0;i<23;i++){
      const a=i*2.4,r=radius*q*(.45+i%7*.09);
      const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.46-60*q*(1-q),s=2+i%5;
      g.fillStyle=['#aa8155','#dec59a','#685041'][i%3];g.beginPath();
      g.moveTo(px-s,py);g.lineTo(px+1,py-s);g.lineTo(px+s,py+1);g.lineTo(px,py+s*.5);g.fill();
    }g.restore();
  }
  function draw(g,p,target,layer){
    const d=target.x>=500?1:-1;
    g.save();
    if(layer==='actor'){
      const i=times.filter(start=>p>=start).length-1,arrival=clamp(p/.12),exit=clamp((p-.90)/.10);
      g.globalAlpha*=1-exit;
      g.fillStyle='rgba(41,30,24,.26)';g.beginPath();g.ellipse(500,510,68*arrival,14*arrival,0,0,tau);g.fill();
      g.translate(500,510);g.scale(d,1);
      g.save();g.beginPath();g.rect(-170,-330,340,331);g.clip();
      frame(g,i,-128,-244+180*(1-arrival)**2+exit*45,256,256);g.restore();
      debris(g,0,0,arrival,100);debris(g,0,0,exit,90);
      if(p>.29&&p<.43){
        const q=(p-.29)/.14;g.globalAlpha*=Math.sin(Math.PI*q)*.55;g.strokeStyle='#eed6a2';g.lineWidth=2;
        for(let n=0;n<2;n++){g.beginPath();g.ellipse(39+q*12,-205,12+n*13+q*36,11+n*8+q*20,-.17,-1,1);g.stroke();}
      }
    }else if(p>=release&&p<hit){
      const u=flight(p),start=500+100*d;
      g.translate(start+(target.x-start)*u,327+(target.y-85-327)*u-18*Math.sin(Math.PI*u));
      const angle=u*tau*2.5,dx=Math.cos(angle)*d,dy=Math.sin(angle)*.27;
      g.rotate(Math.atan2(dy,dx));const width=107*Math.hypot(dx,dy);
      frame(g,11,-width/2,-15,width,30);
    }else if(p>=hit){
      debris(g,target.x,target.y-85,(p-hit)/.16,99);
    }
    g.restore();
  }
  window.Cyclops={draw,flight,portrait:(g,w,h)=>{const size=Math.min(w,h*1.09);frame(g,4,(w-size)/2,h-size,size,size);},onReady:fn=>atlas.naturalWidth?fn():listeners.push(fn)};
})();
