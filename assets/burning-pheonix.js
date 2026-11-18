(()=>{
  const atlas=new Image(),ready=[];
  atlas.onload=()=>ready.splice(0).forEach(fn=>fn());
  atlas.src='./assets/burning-pheonix.webp';
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
  const smooth=x=>x*x*(3-2*x),tau=Math.PI*2;
  function bird(g,i,size){
    if(!atlas.naturalWidth)return;
    const w=atlas.naturalWidth/4,h=atlas.naturalHeight/2;
    g.drawImage(atlas,i%4*w,Math.floor(i/4)*h,w,h,-size/2,-size/2,size,size);
  }
  function spark(g,x,y,r,color){
    g.fillStyle=color;g.beginPath();g.moveTo(x,y-r*1.7);g.lineTo(x+r,y);
    g.lineTo(x,y+r);g.lineTo(x-r,y);g.closePath();g.fill();
  }
  function draw(g,target,p){
    const dir=target.x>=500?1:-1,rise=smooth(clamp((p-.13)/.31)),flight=clamp((p-.44)/.33);
    const dive=clamp((p-.77)/.11)**1.6,impact=clamp((p-.88)/.12);
    const airX=500+dir*(46*Math.sin(flight*tau*.8)+25*flight);
    const airY=505-243*rise-20*Math.sin(flight*Math.PI);
    const x=mix(airX,target.x,dive),y=mix(airY,target.y-72,dive);
    g.save();
    if(p<.44){
      g.globalAlpha=1-rise;g.fillStyle='#ff701f';g.beginPath();
      g.ellipse(500,510,6+18*rise,3+4*rise,0,0,tau);g.fill();
      spark(g,500,505,4+5*Math.sin(p*35)**2,'#ffcd57');g.globalAlpha=1;
    }
    if(p<.88){
      const size=204*rise;
      for(let i=0;i<18;i++){
        const q=(p*3+i/18)%1;
        const trail=rise*(14+98*dive);
        g.globalAlpha=(1-q)*.9;
        spark(g,x-dir*(q*trail+Math.sin(i*2.4+q*4)*12*rise),y+q*(40*(1-dive)-85*dive),(.9+3*(1-q))*rise,i%3?'#ff8e26':'#ffe374');
      }
      g.globalAlpha=1;g.translate(x,y);g.scale(dir,1);
      g.rotate(-.33*(1-flight)+Math.atan2(target.y-72-airY,Math.abs(target.x-airX))*smooth(clamp((p-.72)/.09)));
      bird(g,Math.floor(p*19)%8,size*(1-.32*dive));
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
  window.BurningPheonix={draw,onReady(fn){if(atlas.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){g.save();g.translate(w/2,h*.52);bird(g,0,Math.min(w,h)*1.22);g.restore();}};
})();
