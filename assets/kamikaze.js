(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/gremlin-poses.webp?v=0.218.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,q)=>a+(b-a)*q;
  const ease=x=>x*x*(3-2*x);
  const poses=[0,.092,.113,.133,.168,.202,.235,.278,.323,.344,.392,.435,.459,.497,.58,.632,.667,.70,.746,.776,.803,.826,.853,.867];
  const setDown=.323,fuseOut=.554,pickup=.826,size=117;
  const tau=Math.PI*2;
  function position(target,p){
    const dir=target.x>=500?1:-1;
    const close=target.x-dir*73,far=target.x-dir*230,start=500-dir*50;
    const a=ease(clamp((p-.155)/.123)),b=ease(clamp((p-.35)/.095)),c=ease(clamp((p-.65)/.096));
    const x=p<.35?mix(start,close,a):p<.65?mix(close,far,b):mix(far,close,c);
    return {x,y:mix(510,target.y+3,a),dir};
  }
  function frame(g,i,x,y,width){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/6;
    g.drawImage(atlas,i%6*tile,Math.floor(i/6)*tile,tile,tile,x,y,width,width);
  }
  function shape(g,points,fill){
    g.fillStyle=fill;g.beginPath();g.moveTo(...points[0]);
    for(const point of points.slice(1))g.lineTo(...point);
    g.closePath();g.fill();
  }
  function spark(g,x,y,p){
    g.save();
    for(let i=0;i<10;i++){
      const a=i*2.39996+p*71,r=5+(i%4)*2+Math.sin(p*170+i)*3;
      g.globalAlpha=.5+i%3*.23;
      shape(g,[[x,y],[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a+.35)*5,y+Math.sin(a+.35)*5]],
        i%2?'#ff9a2d':'#fff4bc');
    }
    g.restore();
  }
  function actor(g,{target,progress:p,hit}){
    if(p>=hit)return;
    const point=position(target,p);
    let pose=poses.findLastIndex(time=>p>=time);
    let direction=point.dir;
    if(p>=.155&&p<.278){
      pose=24+Math.floor((p-.155)/.0155)%4;
    }else if(p>=.35&&p<.445){
      pose=28+Math.floor((p-.35)/.012)%4;
      direction=-direction;
    }else if(p>=.65&&p<.746){
      pose=32+Math.floor((p-.65)/.012)%4;
    }
    g.save();g.translate(point.x,point.y);g.scale(direction,1);
    g.globalAlpha=clamp(p/.047);
    frame(g,pose,-size/2,-size,size);
    g.restore();
  }
  function plantedBomb(g,x,y,p){
    const r=19;
    const ball=g.createRadialGradient(x-6,y-8,1,x,y,r);
    ball.addColorStop(0,'#687078');ball.addColorStop(.50,'#333740');ball.addColorStop(1,'#151822');
    g.fillStyle=ball;g.beginPath();g.arc(x,y,r,0,tau);g.fill();
    g.fillStyle='#67604c';g.fillRect(x-4,y-21,8,4);
    if(p<fuseOut){
      const length=(1-clamp((p-setDown)/(fuseOut-setDown)))*19;
      g.strokeStyle='#b59b6d';g.lineWidth=2.2;
      g.beginPath();g.moveTo(x,y-21);g.quadraticCurveTo(x+length*.22,y-21-length,x+length*.55,y-22-length);g.stroke();
      spark(g,x+length*.55,y-22-length,p);
    }
  }
  function blast(g,x,y,q){
    const flash=1-clamp(q/.24),spread=1-(1-q)**3;
    g.save();
    for(let i=0;i<18;i++){
      const a=i*2.39996,r=(20+i%7*13)*spread;
      const cx=x+Math.cos(a)*r,cy=y+Math.sin(a)*r*.70-44*q;
      const size=(24+i%5*9)*(1+q*.55);
      const points=Array.from({length:8},(_,j)=>{
        const angle=j*tau/8+i*.33,R=size*(.77+(i+j)%4*.08);
        return [cx+Math.cos(angle)*R,cy+Math.sin(angle)*R*.85];
      });
      g.globalAlpha=(1-q)**1.05*(.46+i%4*.11);
      shape(g,points,flash>.5?['#ff9a32','#e34a23','#724338'][i%3]:['#655558','#8e7771','#af9385'][i%3]);
    }
    if(flash>0){
      const light=g.createRadialGradient(x,y,0,x,y,50+85*spread);
      light.addColorStop(0,'#fffbd8');light.addColorStop(.34,'#ffb13ddf');light.addColorStop(1,'#ff451200');
      g.globalAlpha=flash;g.fillStyle=light;g.fillRect(x-138,y-138,276,276);
      const rays=Array.from({length:22},(_,i)=>{
        const a=i*tau/22,r=(i%2===0?34+i%7*7:15)*(1+spread);
        return [x+Math.cos(a)*r,y+Math.sin(a)*r];
      });
      shape(g,rays,'#fff4b0');
    }
    for(let i=0;i<30;i++){
      const a=i*2.39996,r=(27+i%8*15)*spread;
      const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r-38*q+60*q*q;
      g.globalAlpha=(1-q)**1.4;
      shape(g,[[px+5,py],[px-4,py-4],[px-6,py+3]],i%2?'#ffc85a':'#f95c26');
    }
    g.restore();
  }
  function bomb(g,{target,progress:p,hit}){
    const {dir}=position(target,p);
    const x=target.x-dir*50;
    if(p>=hit){
      blast(g,x,target.y-63,clamp((p-hit)/(1-hit)));
    }else if(p>=setDown&&p<pickup){
      plantedBomb(g,x,target.y-18,p);
    }
  }
  window.Kamikaze={
    actor,bomb,depth:({target,progress})=>position(target,progress).y+.08,
    onReady(fn){if(atlas.naturalWidth)fn();else listeners.push(fn);},
    portrait(g,w,h){const side=Math.min(w,h);frame(g,3,(w-side)/2,(h-side)/2,side);}
  };
})();
