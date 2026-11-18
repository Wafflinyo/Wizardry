(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/cyclops.webp';
  const motion=new Image();motion.src='./assets/cyclops-motion.webp';
  const windup=new Image();windup.src='./assets/cyclops-windup.webp';
  const clamp=x=>Math.max(0,Math.min(1,x)),tau=Math.PI*2;
  const release=.74,hit=.80,flight=p=>clamp((p-release)/(hit-release));
  const times=[0,.092,.146,.165,.184,.204,.228,.25,.276,.3,.326,.352,.406,.44,.49,.55,.62,.692,.724,release,.758,.782,.817,.86];
  const poses=[12,13,14,0,15,16,1,17,2,18,3,4,18,19,24,25,26,26,21,22,8,9,10,23];
  function frame(g,i,x,y,w,h){
    const sheet=i>=24?windup:i>=12?motion:atlas;i%=12;
    if(sheet.naturalWidth)g.drawImage(sheet,i%4*256,Math.floor(i/4)*256,256,256,x,y,w,h);
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
      const i=times.filter(start=>p>=start).length-1,arrival=clamp(p/.146),exit=clamp((p-.90)/.10);
      g.globalAlpha*=1-exit;
      g.fillStyle='rgba(41,30,24,.26)';g.beginPath();g.ellipse(500,510,68*arrival,14*arrival,0,0,tau);g.fill();
      g.translate(500,510);g.scale(d,1);
      g.save();
      frame(g,poses[i],-128,-244-650*(1-arrival*arrival)+exit*45,256,256);g.restore();
      debris(g,0,0,(p-.146)/.13,115);debris(g,0,0,exit,90);
      if(p>.29&&p<.43){
        const q=(p-.29)/.14;g.globalAlpha*=Math.sin(Math.PI*q)*.55;g.strokeStyle='#eed6a2';g.lineWidth=2;
        for(let n=0;n<2;n++){g.beginPath();g.ellipse(39+q*12,-205,12+n*13+q*36,11+n*8+q*20,-.17,-1,1);g.stroke();}
      }
    }else if(p>=release&&p<hit){
      const u=flight(p),start=500+149*d;
      g.translate(start+(target.x-start)*u,352+(target.y-85-352)*u-18*Math.sin(Math.PI*u));
      const angle=u*tau*2.5,dx=Math.cos(angle)*d,dy=Math.sin(angle)*.46;
      g.rotate(Math.atan2(dy,dx));const width=142*(.77+.23*Math.abs(Math.cos(angle)));
      frame(g,11,-width/2,-23,width,46);
    }else if(p>=hit){
      const q=clamp((p-hit)/.13);
      g.translate(target.x,target.y-85);g.scale(d,1);
      if(q<1){
        g.globalAlpha*=1-q;
        g.strokeStyle='#ffe0a0';g.lineWidth=5*(1-q)+1;
        g.beginPath();g.ellipse(0,0,7+52*q,10+72*q,-.28,0,tau);g.stroke();
        for(let i=0;i<13;i++){
          const angle=(i/12-.5)*2.7,r=12+q*(62+i%4*13);
          g.fillStyle=i%3?'#c79a62':'#ffdb91';g.beginPath();
          g.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);
          g.lineTo(Math.cos(angle-.12)*r*.54,Math.sin(angle-.12)*r*.54);
          g.lineTo(Math.cos(angle+.12)*r*.57,Math.sin(angle+.12)*r*.57);g.fill();
        }
      }
      debris(g,0,0,(p-hit)/.16,142);
    }
    g.restore();
  }
  function shake(p,d){
    const q=(p-hit)/.058;
    if(q<0||q>=1)return null;
    const strength=(1-q)**2;
    return {x:d*12*strength*Math.cos(q*tau*1.8),y:-5*strength*Math.cos(q*tau*2.2)};
  }
  window.Cyclops={draw,flight,shake,portrait:(g,w,h)=>{const size=Math.min(w,h*1.09);frame(g,4,(w-size)/2,h-size,size,size);},onReady:fn=>atlas.naturalWidth?fn():listeners.push(fn)};
})();
