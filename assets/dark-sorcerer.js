(() => {
  const atlas=new Image();
  atlas.src="./assets/dark-sorcerer.webp";
  const clamp=n=>Math.max(0,Math.min(1,n));
  function sprite(ctx,frame,x,y,size){
    if(atlas.naturalWidth)ctx.drawImage(atlas,frame%4*256,Math.floor(frame/4)*256,256,256,x-size/2,y-size*.88,size,size);
  }
  function tendrils(ctx,p,front){
    const charge=clamp((p-.06)/.26),release=clamp((p-.48)/.115);
    if(!charge||release===1)return;
    ctx.save();
    for(let i=0;i<9;i++){
      const flow=(p*4.2+i*.618)%1;
      const angle=i*2.4+p*27;
      if((Math.sin(angle)>0)!==front)continue;
      const points=Array.from({length:17},(_,j)=>{
        const t=j/16;
        const r=p<.48?23+((1-flow)*.55+t*.45)*155*(1-charge*.33):23+release*195+t*65;
        const theta=angle+t*1.4;
        const y=-109+Math.sin(theta)*r*.57+(i%3-1)*33;
        return [Math.cos(theta)*r,y];
      });
      ctx.globalAlpha=(front?.9:.6)*charge*(1-release)**2*Math.sin(flow*Math.PI);
      ctx.strokeStyle=i%3?"#2b123c":"#603789";
      ctx.lineCap="round";
      for(let j=1;j<points.length;j++){
        const width=Math.sin(Math.PI*j/points.length);
        ctx.lineWidth=2+width*17;
        ctx.beginPath();ctx.moveTo(...points[j-1]);ctx.lineTo(...points[j]);ctx.stroke();
      }
      ctx.strokeStyle=i%3?"#8b4eb7":"#ca8deb";ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(...points[2]);
      for(const point of points.slice(3,-2))ctx.lineTo(...point);
      ctx.stroke();
    }
    ctx.restore();
  }
  function actor(ctx,p,dir){
    const fade=clamp(p/.09)*clamp((.98-p)/.055);
    const frame=p<.22?Math.floor(p/.055):p<.48?[4,5,6,7,6,5][Math.floor((p-.22)*23)%6]:
      p<.73?8+Math.min(3,Math.floor((p-.48)*16)):p<.92?12+Math.floor(p*29)%3:15;
    ctx.save();
    ctx.translate(500,510);ctx.scale(dir,1);ctx.globalAlpha*=fade;
    tendrils(ctx,p,false);
    sprite(ctx,frame,0,0,246);
    const shroud=clamp((p-.28)/.20)*(1-clamp((p-.48)/.09));
    if(shroud>0){
      ctx.save();ctx.globalAlpha*=shroud*.9;
      const ink=ctx.createRadialGradient(0,-111,12,0,-111,100);
      ink.addColorStop(0,"#14091d");ink.addColorStop(.53,"#251032dd");ink.addColorStop(1,"#25103200");
      ctx.scale(.85,1.1);ctx.fillStyle=ink;ctx.fillRect(-100,-211,200,200);ctx.restore();
    }
    tendrils(ctx,p,true);
    rupture(ctx,p);
    if(p>.88){
      const q=clamp((p-.88)/.12);
      ctx.strokeStyle="#d6a0ff";ctx.lineWidth=3;
      for(let i=0;i<4;i++){
        ctx.beginPath();ctx.ellipse(0,-14-(q*155+i*36)%155,45*(1-q)+9,12,0,0,Math.PI*2);ctx.stroke();
      }
    }
    ctx.restore();
  }
  const tau=Math.PI*2;
  const smokeFrames=[];
  // Build a rolling, faceted cross-section. The bright seam curls around
  // a dark interior as successive lobes overtake one another.
  function billow(ctx,x,y,r,phase,stretch=1){
    const frame=((Math.floor(phase*24)%24)+24)%24;
    if(!smokeFrames[frame]){
      const tile=document.createElement("canvas");
      tile.width=tile.height=96;
      const c=tile.getContext("2d"),t=tau*frame/24;
      const rings=[[ [43+5*Math.cos(t),47+5*Math.sin(t)] ]];
      for(let ring=1;ring<=4;ring++){
        const points=[];
        for(let i=0;i<18;i++){
          const a=i*tau/18+.15*Math.sin(t+ring*.83)+ring*.09;
          const rad=ring*(9+.95*Math.sin(3*a-t)+.75*Math.cos(5*a+t));
          points.push([48+rad*Math.cos(a),48+rad*Math.sin(a)]);
        }
        rings.push(points);
      }
      const colors=["#140d22","#21102f","#351646","#54205e","#792876","#aa3c97","#de65bc","#ffb0de"];
      function facet(a,b,d,light){
        c.fillStyle=colors[Math.max(0,Math.min(7,Math.floor(light)))];
        c.strokeStyle=c.fillStyle;c.lineWidth=.65;
        c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(...d);c.closePath();c.fill();c.stroke();
      }
      for(let j=1;j<=4;j++)for(let i=0;i<18;i++){
        const k=(i+1)%18,inner=rings[j-1],outer=rings[j];
        const a=inner[i%inner.length],b=inner[k%inner.length];
        const curl=Math.cos(i*tau/18-t+j*1.27);
        const light=.8+j*.45+Math.max(0,curl)**3*(j===4?4:3);
        facet(a,outer[i],outer[k],light);
        if(j>1)facet(a,outer[k],b,light-.7);
      }
      smokeFrames[frame]=tile;
    }
    ctx.drawImage(smokeFrames[frame],x-r*stretch,y-r,2*r*stretch,2*r);
  }
  function rupture(ctx,p){
    if(p<.46||p>=.67)return;
    const q=clamp((p-.48)/.19);
    ctx.save();ctx.translate(0,-116);
    ctx.globalAlpha*=clamp((p-.46)/.02)*(1-q)**1.4;
    // Splinters outrun the cloud for a sharp leading edge at detonation.
    for(let i=0;i<22;i++){
      const a=i*2.39996,reach=(48+174*Math.sqrt(q))*(.68+.32*Math.cos(i*4));
      ctx.save();ctx.rotate(a);
      ctx.fillStyle=i%3?"#963c9e":"#ffc5eb";
      ctx.beginPath();ctx.moveTo(reach,0);ctx.lineTo(reach*.60,4*(1-q));
      ctx.lineTo(reach*.42,0);ctx.lineTo(reach*.71,-2);ctx.closePath();ctx.fill();ctx.restore();
    }
    for(let i=0;i<19;i++){
      const a=i*2.39996,r=(22+154*q**.66)*(.75+.25*Math.sin(i*11));
      billow(ctx,Math.cos(a)*r,Math.sin(a)*r*.8,12+q*32,i*.37+q*.85);
    }
    ctx.restore();
  }
  function slashes(ctx,p,target,hit){
    const launch=.485;
    if(p<=launch||p>=hit+.19)return;
    const dx=target.x-500,dy=target.y-78-394;
    const distance=Math.hypot(dx,dy);
    ctx.save();ctx.translate(500,394);ctx.rotate(Math.atan2(dy,dx));
    // A continuous surge. Its rear collapses into the front as the wave lands.
    const head=clamp((p-launch)/(hit-launch))**1.32;
    const tail=clamp((p-launch-.067)/(hit-launch))**1.35;
    ctx.globalAlpha*=clamp((p-launch)/.016)*(1-clamp((p-hit)/.07));
    if(p<hit+.07)for(let i=0;i<18;i++){
      const f=i/17,u=tail+(head-tail)*f;
      const curl=u*7-p*17;
      const width=(17+20*Math.sin(f*Math.PI*.8))*Math.min(1,distance/140);
      for(let l=-1;l<=1;l++){
        const y=Math.sin(curl+l*.8)*14*Math.sin(u*Math.PI)+l*width*.48;
        billow(ctx,u*distance,y,width*(1-.27*Math.abs(l)),p*4+i*.13+l*.31,1.36);
      }
    }
    ctx.restore();
    if(p<hit)return;
    const q=clamp((p-hit)/.19);
    ctx.save();ctx.translate(target.x,target.y-78);
    ctx.globalAlpha*=1-q*q;
    for(let i=0;i<15;i++){
      const a=i*2.39996,r=(13+76*q**.65)*(.75+.25*Math.cos(i*8));
      billow(ctx,Math.cos(a)*r,Math.sin(a)*r-q*q*32,
        (24+9*Math.sin(i))*(1-.73*q),q+i*.19);
    }
    ctx.restore();
  }
  window.DarkSorcerer={actor,slashes,portrait(ctx,w,h){sprite(ctx,8,w/2,h*.87,Math.min(w,h));},
    onReady(fn){if(atlas.naturalWidth)fn();else atlas.addEventListener("load",fn,{once:true});}};
})();
