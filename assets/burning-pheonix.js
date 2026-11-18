(()=>{
  const portraitSheet=new Image(),riseSheet=new Image(),diveSheet=new Image(),ready=[];
  portraitSheet.onload=()=>ready.splice(0).forEach(fn=>fn());
  portraitSheet.src='./assets/burning-pheonix.webp';
  riseSheet.src='./assets/pheonix-rise.webp';
  diveSheet.src='./assets/pheonix-dive.webp';
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
  const smooth=x=>x*x*(3-2*x),tau=Math.PI*2;
  function frame(g,sheet,i,size,anchor=.5){
    if(!sheet.naturalWidth)return;
    const w=sheet.naturalWidth/4,h=sheet.naturalHeight/2;
    g.drawImage(sheet,i%4*w,Math.floor(i/4)*h,w,h,-size*anchor,-size/2,size,size);
  }
  function spark(g,x,y,r,color){
    g.fillStyle=color;g.beginPath();g.moveTo(x,y-r*1.7);g.lineTo(x+r,y);
    g.lineTo(x,y+r);g.lineTo(x-r,y);g.closePath();g.fill();
  }
  function draw(g,target,p){
    const dir=target.x>=500?1:-1;
    const x=target.x,y=target.y-72,impact=clamp((p-.88)/.12);
    g.save();
    if(p<.34){
      const q=clamp(p/.34);
      g.translate(500,491-210*smooth(q));g.scale(dir,1);
      frame(g,riseSheet,Math.min(3,Math.floor(q*4)),mix(48,214,smooth(q)));
    }else if(p<.75){
      const q=(p-.34)/.41,cycle=q*2;
      const poses=[4,5,6,7];
      g.translate(500+dir*40*q,281-16*Math.sin(q*Math.PI)-8*Math.sin(cycle*tau));
      g.scale(dir,1);frame(g,riseSheet,poses[Math.floor(cycle*poses.length)%poses.length],214);
    }else if(p<.88){
      const q=clamp((p-.75)/.13),startX=500+dir*40,startY=281;
      const dx=Math.abs(x-startX),dy=y-startY,length=Math.hypot(dx,dy);
      const ux=dx/length,uy=dy/length;
      // Orient the whole flight path once. The longitudinal roll and flare wraps are drawn poses.
      const travel=.32*q+.68*q*q;
      const beakStart=78;
      const nose=mix(beakStart,length,travel);
      g.transform(dir*ux,uy,-dir*uy,ux,startX+dir*ux*nose,startY+uy*nose);
      frame(g,diveSheet,Math.floor(q*24)%8,206,.98);
    }else{
      const q=impact;g.globalAlpha=1-q;
      for(let i=0;i<38;i++){
        const a=i*2.4,r=(28+i%8*12)*Math.sqrt(q);
        spark(g,x+Math.cos(a)*r,y+Math.sin(a)*r*.78+28*q*q,(3+i%6)*(1-q),['#fff59e','#ffac27','#f64611'][i%3]);
      }
      g.lineWidth=6*(1-q)+1;g.strokeStyle='#ffc34f';g.beginPath();
      g.ellipse(x,y,3+63*q,3+44*q,0,0,tau);g.stroke();
    }
    g.restore();
  }
  window.BurningPheonix={draw,onReady(fn){if(portraitSheet.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){g.save();g.translate(w/2,h*.52);frame(g,portraitSheet,0,Math.min(w,h)*1.22);g.restore();}};
})();
