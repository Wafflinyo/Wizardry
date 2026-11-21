/* Sentinel Fissure: fixed low-poly poses and staggered arena debris. */
(()=>{
  const stomp=2700;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
  const hash=n=>{const x=Math.sin(n*91.413+6.7)*43758.5453;return x-Math.floor(x);};
  const stone=["#403829","#5d5240","#827056","#a18d6b","#c6ae7f"];
  function poly(g,points,fill){
    g.fillStyle=fill;g.beginPath();g.moveTo(...points[0]);
    for(const point of points.slice(1))g.lineTo(...point);
    g.closePath();g.fill();
  }
  function slab(g,x,y,w,h,angle=0,palette=stone){
    const a=[-.51*w,-.28*h],b=[-.27*w,-.51*h],c=[.25*w,-.53*h],d=[.51*w,-.29*h];
    const e=[.46*w,.32*h],f=[.18*w,.53*h],j=[-.31*w,.47*h],k=[-.50*w,.19*h],m=[-.09*w,-.09*h];
    g.save();g.translate(x,y);g.rotate(angle);
    poly(g,[a,b,c,d,e,f,j,k],palette[1]);
    poly(g,[a,b,c,m],palette[4]);poly(g,[a,m,j,k],palette[2]);
    poly(g,[m,c,d,e,f],palette[3]);poly(g,[m,f,j],palette[1]);
    poly(g,[d,e,f,[.27*w,.19*h]],palette[0]);
    g.restore();
  }
  const atlas=new Image(),ready=[];
  atlas.onload=()=>ready.splice(0).forEach(callback=>callback());
  atlas.src="./assets/sentinel-fissure-frames.webp";
  const cell=256,scale=1.16;
  // Rear-foot coordinates keep the supporting leg locked as the lead leg moves.
  const rearX=[67,66,66,66,67,67,68,69,70,71,69,68,66,63,63,62];
  const rearY=[233,233,233,233,233,233,233,233,234,234,234,234,234,234,234,234];
  const poses=[0,330,635,930,1240,1510,1710,1950,2160,2310,2410,2560,stomp,2820,2990,3200];

  function drawPose(g,index){
    g.drawImage(atlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,
      -61-rearX[index]*scale,-rearY[index]*scale,cell*scale,cell*scale);
  }
  function actor(g,{x,y,dir,elapsed}){
    if(!atlas.naturalWidth)return;
    let index=0;
    while(index+1<poses.length&&elapsed>=poses[index+1])index++;
    const emerge=(1-ease(elapsed/1150))*113;
    const sink=ease((elapsed-4770)/610)*300;
    g.save();g.translate(x,y);g.scale(dir,1);
    g.beginPath();g.rect(-320,-410,640,412);g.clip();
    g.translate(0,emerge+sink);
    drawPose(g,index);
    g.restore();
  }
  function fissures(g,{x,y,dir,elapsed}){
    const age=elapsed-stomp;
    if(age<0)return;
    const originX=x+dir*100,q=clamp(age/480),fade=1-clamp((age-1920)/770);
    g.save();g.globalAlpha=fade;
    for(let branch=0;branch<9;branch++){
      const angle=(branch+.32)*Math.PI*2/9;
      const points=Array.from({length:7},(_,i)=>{
        const radius=i*(16+hash(branch)*27)*q,zig=i?(hash(branch*17+i)-.5)*23*q:0;
        return [originX+Math.cos(angle)*radius+zig,y+Math.sin(angle)*radius*.34-zig*.35];
      });
      for(let i=1;i<points.length;i++){
        const [ax,ay]=points[i-1],[bx,by]=points[i],width=(8-i)*.87;
        poly(g,[[ax,ay-width],[bx,by-1],[bx+4,by+2],[ax-2,ay+width]],"#32281e");
        poly(g,[[ax,ay+width],[bx+4,by+2],[bx,by+4],[ax,ay+width+2]],"#c5a173");
      }
    }
    for(let i=0;i<3;i++){
      const q=(age-i*98)/620;
      if(q<=0||q>=1)continue;
      g.globalAlpha=(1-q)*.64;
      g.strokeStyle="#dec193";g.lineWidth=3*(1-q)+1;g.beginPath();
      g.ellipse(originX,y,20+q*295,8+q*92,0,0,Math.PI*2);g.stroke();
    }
    g.restore();
  }
  const rubble=Array.from({length:16},(_,i)=>({
    x:130+hash(i+10)*740,y:320+hash(i+50)*242,at:3130+i*99+hash(i+80)*148,
    size:13+hash(i+110)*34,spire:i%3!==1
  }));
  function debris(g,entry,elapsed,dir){
    const age=elapsed-entry.at,fall=entry.big?680:390;
    if(age< -fall||age>570)return;
    const {x,y,size}=entry;
    g.save();
    if(age<0){
      const q=clamp(1+age/fall),px=x-dir*(1-q)*(entry.big?82:40),py=y-(1-q*q)*(entry.big?610:380);
      g.globalAlpha=clamp(q*6);
      g.translate(px,py);g.rotate(dir*(1-q)*.42);
      for(let i=0;i<6;i++){
        const shift=(i+1)*(4+size*.14);
        g.globalAlpha=clamp(q*6)*(.30-i*.039);
        slab(g,-dir*shift*.34,-shift,size*(.56-i*.065),size*(.42-i*.039),i*.32);
      }
      g.globalAlpha=clamp(q*6);
      if(entry.spire){
        poly(g,[[-size*.52,-size*.47],[size*.25,-size*.62],[size*.48,-size*.31],[size*.08,size*.61]],stone[2]);
        poly(g,[[-size*.52,-size*.47],[-size*.12,-size*.27],[size*.08,size*.61]],stone[4]);
        poly(g,[[size*.25,-size*.62],[size*.48,-size*.31],[size*.08,size*.61],[-size*.12,-size*.27]],stone[1]);
      }else slab(g,0,0,size,size*.90,q*.7);
    }else{
      const q=clamp(age/570);
      g.globalAlpha=(1-q)*.57;g.fillStyle="#b5946e";g.beginPath();
      g.ellipse(x,y,8+size*q*1.29,4+size*q*.34,0,0,Math.PI*2);g.fill();
      for(let i=0;i<(entry.big?22:7);i++){
        const angle=i*2.39996,r=(12+hash(i+size)*size*2)*q;
        g.globalAlpha=(1-q)*.89;
        slab(g,x+Math.cos(angle)*r,y+Math.sin(angle)*r*.33-Math.sin(q*Math.PI)*(9+hash(i)*size),
          (3+hash(i+2)*size*.19)*(1-q*.54),4+hash(i+17)*size*.14,angle+q*4);
      }
    }
    g.restore();
  }
  function entries(target,dir,hitAt){
    return [...rubble.map(entry=>({...entry,x:500+dir*(entry.x-500)})),
      {x:target.x,y:target.y,at:hitAt,size:107,spire:true,big:true}];
  }
  function portrait(g,w,h){
    if(!atlas.naturalWidth)return;
    const zoom=Math.min(w/315,h/275)*.91;
    g.save();g.translate(w*.47,h*.94);g.scale(zoom,zoom);
    drawPose(g,6);
    g.restore();
  }
  function onReady(callback){
    if(atlas.naturalWidth)callback();
    else ready.push(callback);
  }
  function shake(progress,dir,hit){
    const elapsed=progress*5440;
    const stompAge=elapsed-stomp,hitAge=(progress-hit)*5440;
    const strength=(stompAge>=0?11*Math.exp(-stompAge/215):0)+(hitAge>=0?7*Math.exp(-hitAge/165):0);
    return {x:dir*Math.sin(elapsed*.047)*strength,y:Math.cos(elapsed*.059)*strength*.67};
  }
  window.SentinelFissure={actor,fissures,debris,entries,portrait,shake,onReady};
})();
