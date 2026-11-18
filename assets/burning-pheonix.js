(()=>{
  const atlas=new Image(),cardArt=new Image(),ready=[];
  cardArt.onload=()=>ready.splice(0).forEach(fn=>fn());
  cardArt.src='./assets/pheonix-card.webp?v=0.186.0';
  atlas.src='./assets/pheonix-sequence.webp?v=0.186.0';
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
  const smooth=x=>x*x*(3-2*x),tau=Math.PI*2;
  function frame(g,i,size,anchor=.5){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/5;
    g.drawImage(atlas,i%5*tile,Math.floor(i/5)*tile,tile,tile,-size*anchor,-size/2,size,size);
  }
  function flame(g,x,y,tailX,tailY,width,color){
    g.fillStyle=color;
    g.beginPath();
    g.moveTo(x,y-width);
    g.quadraticCurveTo((x+tailX)/2,y-width*1.6,tailX,tailY);
    g.quadraticCurveTo((x+tailX)/2,y+width*.8,x,y+width);
    g.quadraticCurveTo(x+width,y,x,y-width);
    g.fill();
  }
  function vortex(g,q,front){
    const strength=mix(.82,1,smooth(clamp(q/.14)));
    const phase=q*tau*3.4;
    const point=(t,strand)=>{
      const a=t*tau*2.6-phase+strand*tau/4;
      // Cup the beak, wrap the full wingspan, then flare beyond the tail.
      const body=smooth(clamp(t/.20));
      const flare=smooth(clamp((t-.67)/.33));
      const radius=mix(24,120,body)*(1+.07*Math.sin(t*19-phase))+27*flare;
      return {x:44-386*t,y:-14*body+Math.sin(a)*radius,front:Math.cos(a)>=0};
    };
    g.save();
    g.globalAlpha=strength;
    for(let strand=0;strand<4;strand++){
      for(let i=0;i<32;i++){
        const t=i/32,next=t+.045;
        const a=point(t,strand),b=point(next,strand);
        if(a.front!==front)continue;
        const pulse=.65+.35*Math.sin(t*38-phase*1.7+strand);
        const width=(4+16*Math.sin(Math.PI*t))*pulse*(1-t*.66);
        flame(g,a.x,a.y,b.x,b.y,width*1.7,front?'#f13e10':'#9f260d');
        flame(g,a.x+5,a.y,b.x,b.y,width,front?'#ff9b18':'#f96811');
        if(front)flame(g,a.x+8,a.y,b.x+9,b.y,width*.35,'#fff4ad');
      }
    }
    for(let i=0;i<42;i++){
      const t=(i*.618+q*1.25)%1;
      const a=point(t,i%4),b=point(t+.066,i%4);
      if(a.front!==front)continue;
      g.globalAlpha=strength*Math.sin(Math.PI*t);
      flame(g,a.x,a.y,b.x-13,b.y,2+i%4,front?'#ffdf64':'#ed5916');
    }
    g.restore();
  }
  function burst(g,x,y,floor,q){
    const wave=1-(1-q)**3;
    const flash=1-clamp(q/.20);
    g.save();
    g.translate(x,y);
    g.globalAlpha=(1-q)**1.4;
    frame(g,20+Math.min(4,Math.floor(q*5)),mix(178,455,wave));
    if(flash>0){
      const radius=32+135*wave;
      const light=g.createRadialGradient(0,0,0,0,0,radius);
      light.addColorStop(0,'#ffffe8');
      light.addColorStop(.24,'#fff2a4');
      light.addColorStop(.58,'#ff6c2980');
      light.addColorStop(1,'#ff3d0000');
      g.globalAlpha=flash;
      g.fillStyle=light;
      g.fillRect(-radius,-radius,2*radius,2*radius);
    }
    for(let i=0;i<56;i++){
      const angle=i*2.39996;
      const range=64+(i%13)*13;
      const dx=Math.cos(angle)*range,dy=Math.sin(angle)*range*.74;
      const px=dx*wave,py=dy*wave-35*q+65*q*q;
      g.globalAlpha=(1-q)*(i%3===0?.78:1);
      flame(g,px,py,px-dx*.22*(1-q),py-dy*.22*(1-q),
        (2+i%8)*(1-q),['#fff7ae','#ff9a26','#ff4c12'][i%3]);
    }
    g.restore();
    g.save();
    for(let i=0;i<2;i++){
      const age=clamp((q-i*.14)/(1-i*.14));
      if(q<i*.14)continue;
      const radius=8+175*(1-(1-age)**2);
      g.globalAlpha=(1-age)**2;
      g.strokeStyle=i===0?'#ffb136':'#ff5c18';
      g.lineWidth=10*(1-age)+1;
      g.beginPath();
      g.ellipse(x,floor,radius,radius*.25,0,0,tau);
      g.stroke();
    }
    g.restore();
  }
  function draw(g,target,p){
    const dir=target.x>=500?1:-1;
    const x=target.x,y=target.y-72,impact=clamp((p-.88)/.12);
    const flightY=174,flightSize=292;
    g.save();
    if(p<.40){
      const q=clamp(p/.40);
      const ascent=smooth(clamp((q-.63)/.37));
      const size=mix(182,flightSize,smooth(clamp(q/.63)));
      g.translate(500,mix(510-size*.415,flightY,ascent));
      g.scale(dir,1);
      frame(g,Math.min(4,Math.floor(q*5)),size);
    }else if(p<.73){
      const q=(p-.40)/.33,cycle=q*2;
      g.translate(500+dir*26*q,flightY-16*Math.sin(q*Math.PI)-8*Math.sin(cycle*tau));
      g.scale(dir,1);
      frame(g,5+Math.floor(cycle*10)%10,flightSize);
    }else if(p<.88){
      const q=clamp((p-.73)/.15),startX=500+dir*26,startY=flightY;
      const dx=x-startX,dy=y-startY,length=Math.hypot(dx,dy);
      const ux=dx/length,uy=dy/length;
      const nose=mix(108,length,.32*q+.68*q*q);
      g.transform(ux,uy,-dir*uy,dir*ux,startX+ux*nose,startY+uy*nose);
      vortex(g,q,false);
      frame(g,15+Math.floor(q*20)%5,278,.96);
      vortex(g,q,true);
    }else{
      burst(g,x,y,target.y,impact);
    }
    g.restore();
  }
  window.BurningPheonix={draw,onReady(fn){if(cardArt.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){
      if(!cardArt.naturalWidth)return;
      const scale=Math.min(w/cardArt.naturalWidth,h/cardArt.naturalHeight);
      const width=cardArt.naturalWidth*scale,height=cardArt.naturalHeight*scale;
      g.drawImage(cardArt,(w-width)/2,(h-height)/2,width,height);
    }};
})();
