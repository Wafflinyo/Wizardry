(()=>{
  const atlas=new Image();
  atlas.src="./assets/volcanic-eruption.webp";
  const clamp=x=>Math.max(0,Math.min(1,x));
  const flight=860;
  const flightProgress=age=>clamp(1+age/flight);
  const coneSize=410;
  const vent={x:500,y:513-coneSize*.43};
  const chunkAtlas=new Image();
  chunkAtlas.src="./assets/volcanic-chunks.webp";
  function tile(g,frame,x,y,size){
    if(!atlas.naturalWidth)return;
    const cell=atlas.naturalWidth/4;
    g.drawImage(atlas,frame%4*cell,Math.floor(frame/4)*cell,cell,cell,x-size/2,y-size,size,size);
  }
  function cone(g,time,duration){
    const fade=clamp((duration-time)/420);
    const rise=clamp(time/950);
    const pressure=clamp((time-1000)/920);
    const tremor=rise*(time<1920?2+5*pressure:time<2060?.4:3.3);
    const x=500+Math.sin(time*.054)*tremor;
    const frame=time<1000?Math.min(3,Math.floor(time/250)):
      time<2060?4+Math.min(3,Math.floor((time-1000)/265)):
      time<duration-540?8+Math.floor((time-2060)/115)%4:
      12+Math.min(3,Math.floor((time-duration+540)/135));
    g.save();
    g.globalAlpha*=clamp(time/110)*fade;
    const burst=time-2060;
    if(burst>=0&&burst<700){
      const t=burst/700;
      g.save();
      g.globalAlpha*=(1-t)**2;
      g.beginPath();g.ellipse(500,505,48+230*t,10+47*t,0,0,Math.PI*2);
      g.strokeStyle="#ffac4d";g.lineWidth=7*(1-t)+1;g.stroke();g.restore();
    }
    g.beginPath();g.rect(270,68,460,445);g.clip();
    tile(g,frame,x,513+78*(1-rise)+65*(1-fade),coneSize);
    if(time>1450){
      const flash=burst<0?pressure*.33:Math.max(0,1-burst/390)*.85;
      const radius=58+flash*95;
      const glow=g.createRadialGradient(x,vent.y,1,x,vent.y,radius);
      glow.addColorStop(0,"rgba(255,235,131,"+flash+")");
      glow.addColorStop(.36,"rgba(255,105,21,"+flash*.64+")");
      glow.addColorStop(1,"rgba(255,75,12,0)");
      g.fillStyle=glow;g.fillRect(x-radius,vent.y-radius,2*radius,2*radius);
    }
    if(burst>=0){
      for(let i=0;i<32;i++){
        const t=(burst-i%6*32)/1000;
        if(t<0||t>.98)continue;
        const vx=Math.sin(i*2.39996)*(65+i%8*21),vy=185+(i*47)%260;
        const px=x+vx*t,py=vent.y-vy*t+340*t*t;
        if(py>vent.y+10)continue;
        const r=(3+i%5)*(1-t*.5);
        face(g,[[px-r,py],[px,py-r*1.7],[px+r,py],[px,py+r*1.8]],
          ["#ffb637","#ffeb91","#e45219","#9c3722"][i%4]);
      }
    }
    g.restore();
  }
  function face(g,points,color){
    g.fillStyle=color;g.beginPath();g.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)g.lineTo(...points[i]);
    g.closePath();g.fill();
  }
  function molten(g,x,y,r,phase){
    if(!chunkAtlas.naturalWidth)return;
    const frame=Math.floor(phase*16)%16,cell=chunkAtlas.naturalWidth/4;
    g.drawImage(chunkAtlas,frame%4*cell,Math.floor(frame/4)*cell,cell,cell,x-r,y-r,2*r,2*r);
  }
  function blob(g,entry,index,age){
    if(age < -flight||age>=620)return;
    const side=entry.x<500?-1:1;
    const endX=entry.x+(entry.lands?0:-side*82),endY=entry.y-(entry.lands?69:2);
    const arch=124+index%3*16;
    function point(q){
      return [vent.x+(endX-vent.x)*q,vent.y+(endY-vent.y)*q-4*arch*q*(1-q)];
    }
    g.save();
    if(age<0){
      const q=flightProgress(age);
      const [x,y]=point(q);
      // Detached spatters shed from the main mass along its ballistic wake.
      for(let i=1;i<=6;i++){
        const lag=.039+i*.021;
        if(q<lag)continue;
        const [tx,ty]=point(q-lag);
        molten(g,tx+Math.sin(i*8+index)*i*1.6,ty+i*i*.48,5+(7-i)*1.1,q+i*.21);
      }
      const size=43+4*Math.sin(Math.PI*q);
      molten(g,x,y,size,q*1.45+index*.31);
    }else{
      const q=age/620;
      if(q<.27){
        const splash=q/.27;
        g.save();g.translate(endX,endY);g.scale(1+splash*.75,1-splash*.56);
        g.globalAlpha*=1-splash;molten(g,0,0,48,1.45+index*.31);g.restore();
      }
      g.globalAlpha*=1-q*q;
      for(let i=0;i<17;i++){
        const a=i*2.39996+index,spread=48+i%6*14;
        const x=endX+Math.cos(a)*q*spread;
        const y=endY+Math.sin(a)*q*spread*.42-(28+i%5*12)*Math.sin(Math.PI*q)+38*q*q;
        molten(g,x,y,(8+i%5*3)*(1-q*.7),q+i*.13);
      }
    }
    g.restore();
  }
  window.VolcanicEruption={cone,blob,flightProgress,portrait(g,w,h){tile(g,10,w/2,h,Math.min(w,h));},
    onReady(fn){if(atlas.naturalWidth)fn();else atlas.addEventListener("load",fn,{once:true});}};
})();
