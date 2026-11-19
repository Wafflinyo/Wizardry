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
    if(p>.88){
      const q=clamp((p-.88)/.12);
      ctx.strokeStyle="#d6a0ff";ctx.lineWidth=3;
      for(let i=0;i<4;i++){
        ctx.beginPath();ctx.ellipse(0,-14-(q*155+i*36)%155,45*(1-q)+9,12,0,0,Math.PI*2);ctx.stroke();
      }
    }
    ctx.restore();
  }
  function slashes(ctx,p,target,hit){
    for(let i=0;i<3;i++){
      const launch=.49+i*.028;
      if(p<launch||p>hit+.1)continue;
      const q=clamp((p-launch)/(hit-launch));
      const x=500+(target.x-500)*q,y=394+(target.y-78-394)*q;
      const fade=1-clamp((p-hit)/.1);
      ctx.save();ctx.translate(x,y);
      ctx.rotate((i-1)*.77+(target.x<500?Math.PI:0));
      ctx.globalAlpha*=fade;
      ctx.shadowColor="#a04de2";ctx.shadowBlur=16*fade;
      ctx.beginPath();ctx.moveTo(-65,22);ctx.quadraticCurveTo(18,25,49,-40);
      ctx.quadraticCurveTo(36,43,-65,22);ctx.fillStyle="#3c174f";ctx.fill();
      ctx.beginPath();ctx.moveTo(-45,23);ctx.quadraticCurveTo(24,20,49,-40);
      ctx.strokeStyle="#c27df3";ctx.lineWidth=3;ctx.stroke();
      ctx.shadowBlur=0;
      for(let j=0;j<3;j++){
        const trail=(q*92+j*24)%73;
        ctx.globalAlpha=fade*.47*(1-trail/82);
        ctx.strokeStyle="#9c58ca";ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(-18-trail,24+j*9);
        ctx.quadraticCurveTo(-61-trail,36+j*8,-88-trail,25+j*12);ctx.stroke();
      }
      ctx.restore();
    }
  }
  window.DarkSorcerer={actor,slashes,portrait(ctx,w,h){sprite(ctx,8,w/2,h*.87,Math.min(w,h));},
    onReady(fn){if(atlas.naturalWidth)fn();else atlas.addEventListener("load",fn,{once:true});}};
})();
