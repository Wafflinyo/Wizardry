/* Sentinel Fissure: fixed low-poly poses and staggered arena debris. */
(()=>{
  const stomp=2700,step=75,frameCount=73;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
  const hash=n=>{const x=Math.sin(n*91.413+6.7)*43758.5453;return x-Math.floor(x);};
  const stone=["#403829","#5d5240","#827056","#a18d6b","#c6ae7f"];
  const frames=[];
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
  function limb(g,x,y,tx,ty,width){
    slab(g,(x+tx)/2,(y+ty)/2,width,Math.hypot(tx-x,ty-y)*1.27,Math.atan2(x-tx,ty-y));
  }
  function actorFrame(index){
    if(frames[index])return frames[index];
    const frame=document.createElement("canvas");frame.width=440;frame.height=370;
    const g=frame.getContext("2d"),ms=index*step;
    const rise=ease(ms/1450),look=ease((ms-1510)/630);
    const lift=ease((ms-2100)/430)*(1-ease((ms-2530)/170));
    const stride=ease((ms-2150)/550),settle=Math.sin(Math.PI*ease((ms-stomp)/420));
    const exit=ease((ms-4770)/590);
    const hipX=-9+stride*31,hipY=-120+16*(1-rise)+12*settle;
    const shoulderX=hipX+look*8,shoulderY=hipY-93+lift*8;
    const footX=28+stride*80,footY=-10-lift*58;
    g.translate(194,338);
    g.beginPath();g.rect(-194,-338,440,339);g.clip();
    g.translate(0,(1-rise)*295+exit*285);
    const far=["#302b24","#494035","#685946","#8c765d","#a98f6a"];
    limb(g,hipX-24,hipY,-47,-64,50);
    limb(g,-47,-64,-49,-16,45);slab(g,-37,-13,73,25,-.06,far);
    limb(g,shoulderX-30,shoulderY+4,shoulderX-52,shoulderY+45,49);
    limb(g,shoulderX-52,shoulderY+45,shoulderX-29,shoulderY+79,42);
    slab(g,hipX,hipY,108,67,.03);
    const kneeX=mix(hipX+27,footX,.57)+lift*16,kneeY=mix(hipY,footY,.54)-lift*12;
    limb(g,hipX+27,hipY,kneeX,kneeY,55);
    slab(g,kneeX,kneeY,58,42,-.12);
    limb(g,kneeX,kneeY,footX,footY,46);
    slab(g,footX+10,footY,81,31,lift*.21);
    slab(g,shoulderX-3,shoulderY+26,153,118,.10+lift*.08);
    slab(g,shoulderX+11,shoulderY+32,85,66,.12);
    poly(g,[[shoulderX+7,shoulderY+14],[shoulderX+25,shoulderY+34],
      [shoulderX+12,shoulderY+51],[shoulderX+1,shoulderY+32]],"#d8a353");
    poly(g,[[shoulderX+7,shoulderY+14],[shoulderX+12,shoulderY+51],[shoulderX+1,shoulderY+32]],"#f0c982");
    const headX=shoulderX+12+look*17,headY=shoulderY-56+look*12;
    slab(g,headX,headY,78,72,look*.27);
    slab(g,headX+25,headY+6,41,38,look*.24);
    poly(g,[[headX+12,headY-5],[headX+39,headY+3],[headX+29,headY+9],[headX+13,headY+4]],"#352e23");
    poly(g,[[headX+16,headY-2],[headX+34,headY+3],[headX+29,headY+5],[headX+17,headY+2]],"#ffd186");
    const nearX=shoulderX-45,nearY=shoulderY+8,elbowX=nearX-20-lift*13,elbowY=nearY+59;
    limb(g,nearX,nearY,elbowX,elbowY,60);
    slab(g,nearX,nearY,80,58,-.22);
    limb(g,elbowX,elbowY,elbowX+25+stride*18,elbowY+43,57);
    slab(g,elbowX+30+stride*18,elbowY+47,57,46,-.20);
    frames[index]=frame;
    return frame;
  }
  function actor(g,{x,y,dir,elapsed}){
    g.save();g.translate(x,y);g.scale(dir*.96,.96);
    g.drawImage(actorFrame(Math.min(frameCount-1,Math.floor(Math.max(0,elapsed)/step))),-194,-338);
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
    g.save();g.translate(w*.46,h*.91);const scale=h*.88/305;g.scale(scale,scale);
    g.drawImage(actorFrame(25),-194,-338);
    g.restore();
  }
  function shake(progress,dir,hit){
    const elapsed=progress*5440;
    const stompAge=elapsed-stomp,hitAge=(progress-hit)*5440;
    const strength=(stompAge>=0?11*Math.exp(-stompAge/215):0)+(hitAge>=0?7*Math.exp(-hitAge/165):0);
    return {x:dir*Math.sin(elapsed*.047)*strength,y:Math.cos(elapsed*.059)*strength*.67};
  }
  window.SentinelFissure={actor,fissures,debris,entries,portrait,shake};
})();
