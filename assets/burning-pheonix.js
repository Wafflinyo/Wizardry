(()=>{
  const atlas=new Image(),ready=[];
  atlas.onload=()=>ready.splice(0).forEach(fn=>fn());
  atlas.src='./assets/pheonix-sequence.webp?v=0.184.0';
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
  const smooth=x=>x*x*(3-2*x),tau=Math.PI*2;
  function frame(g,i,size,anchor=.5){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/5;
    g.drawImage(atlas,i%5*tile,Math.floor(i/5)*tile,tile,tile,-size*anchor,-size/2,size,size);
  }
  function vortex(g,q,front){
    // Split each winding into front and rear facets so flames pass around the body.
    for(let strand=0;strand<3;strand++){
      for(let i=0;i<40;i++){
        const t=i/40,u=(i+1)/40;
        const angle=t*tau*2.1-q*tau*3+strand*tau/3;
        if((Math.cos(angle)>0)!==front)continue;
        const next=angle+tau*2.1/40;
        const radius=t=>5+44*Math.sin(t*Math.PI*.75);
        const y=Math.sin(angle)*radius(t),endY=Math.sin(next)*radius(u);
        const width=2+9*Math.sin(t*Math.PI);
        g.fillStyle=(front?['#ffdc52','#ff981c','#ffbe35']:['#c4320d','#e65910','#cb3b0e'])[strand];
        g.beginPath();g.moveTo(-10-190*t,y-width);g.lineTo(-10-190*u,endY-width);
        g.lineTo(-10-190*u,endY+width);g.lineTo(-10-190*t,y+width);g.fill();
        if(front&&i%3===0){
          g.fillStyle='#fff1a0';g.beginPath();g.moveTo(-10-190*t,y-width);
          g.lineTo(-10-190*u,endY-width);g.lineTo(-10-190*u,endY);g.fill();
        }
      }
    }
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
      frame(g,Math.min(4,Math.floor(q*5)),mix(128,214,ascent));
    }else if(p<.75){
      const q=(p-.34)/.41,cycle=q*2;
      g.translate(500+dir*40*q,flightY-16*Math.sin(q*Math.PI)-8*Math.sin(cycle*tau));
      g.scale(dir,1);frame(g,5+Math.floor(cycle*10)%10,214);
    }else if(p<.88){
      const q=clamp((p-.75)/.13),startX=500+dir*40,startY=flightY;
      const dx=Math.abs(x-startX),dy=y-startY,length=Math.hypot(dx,dy);
      const ux=dx/length,uy=dy/length;
      // Orient the whole flight path once. The longitudinal roll and flare wraps are drawn poses.
      const travel=.32*q+.68*q*q;
      const beakStart=78;
      const nose=mix(beakStart,length,travel);
      g.transform(dir*ux,uy,-dir*uy,ux,startX+dir*ux*nose,startY+uy*nose);
      vortex(g,q,false);
      frame(g,15+Math.floor(q*15)%5,206,.96);
      vortex(g,q,true);
    }else{
      const q=impact;
      g.save();g.translate(x,y);frame(g,20+Math.min(4,Math.floor(q*5)),mix(105,290,Math.sqrt(q)));g.restore();
      g.globalAlpha=1-q;
      for(let i=0;i<38;i++){
        const a=i*2.4,r=(28+i%8*12)*Math.sqrt(q);
        spark(g,x+Math.cos(a)*r,y+Math.sin(a)*r*.78+28*q*q,(3+i%6)*(1-q),['#fff59e','#ffac27','#f64611'][i%3]);
      }
      g.lineWidth=6*(1-q)+1;g.strokeStyle='#ffc34f';g.beginPath();
      g.ellipse(x,y,3+63*q,3+44*q,0,0,tau);g.stroke();
    }
    g.restore();
  }
  window.BurningPheonix={draw,onReady(fn){if(atlas.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){g.save();g.translate(w/2,h*.52);frame(g,6,Math.min(w,h)*1.22);g.restore();}};
})();
