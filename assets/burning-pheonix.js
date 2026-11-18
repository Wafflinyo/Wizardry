(()=>{
  const portraitSheet=new Image(),riseSheet=new Image(),wingSheet=new Image(),diveSheet=new Image(),ready=[];
  portraitSheet.onload=()=>ready.splice(0).forEach(fn=>fn());
  portraitSheet.src='./assets/burning-pheonix.webp';
  riseSheet.src='./assets/pheonix-flame-rise.webp';
  wingSheet.src='./assets/pheonix-wingbeat.webp';
  diveSheet.src='./assets/pheonix-dive.webp';
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
  const smooth=x=>x*x*(3-2*x),tau=Math.PI*2;
  function frame(g,sheet,i,size,anchor=.5,rows=2){
    if(!sheet.naturalWidth)return;
    const w=sheet.naturalWidth/4,h=sheet.naturalHeight/rows;
    g.drawImage(sheet,i%4*w,Math.floor(i/4)*h,w,h,-size*anchor,-size/2,size,size);
  }
  function spark(g,x,y,r,color){
    g.fillStyle=color;g.beginPath();g.moveTo(x,y-r*1.7);g.lineTo(x+r,y);
    g.lineTo(x,y+r);g.lineTo(x-r,y);g.closePath();g.fill();
  }
  function draw(g,target,p){
    const dir=target.x>=500?1:-1;
    const x=target.x,y=target.y-72,impact=clamp((p-.88)/.12);
    const flightY=164;
    g.save();
    if(p<.34){
      const q=clamp(p/.34);
      const ascent=smooth(clamp((q-.17)/.83));
      g.translate(500,mix(510-128*.45,flightY,ascent));g.scale(dir,1);
      frame(g,riseSheet,Math.min(7,Math.floor(q*8)),mix(128,214,ascent));
    }else if(p<.75){
      const q=(p-.34)/.41,cycle=q*2;
      g.translate(500+dir*40*q,flightY-16*Math.sin(q*Math.PI)-8*Math.sin(cycle*tau));
      g.scale(dir,1);frame(g,wingSheet,(4+Math.floor(cycle*16))%16,214,.5,4);
    }else if(p<.88){
      const q=clamp((p-.75)/.13),startX=500+dir*40,startY=flightY;
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
