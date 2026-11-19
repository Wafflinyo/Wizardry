(() => {
  const atlas=new Image();
  atlas.src="./assets/dark-sorcerer.webp";
  const clamp=n=>Math.max(0,Math.min(1,n));
  function sprite(ctx,frame,x,y,size){
    if(atlas.naturalWidth)ctx.drawImage(atlas,frame%4*256,Math.floor(frame/4)*256,256,256,x-size/2,y-size*.88,size,size);
  }
  function actor(ctx,p,dir){
    const fade=clamp(p/.09)*clamp((.98-p)/.055);
    const frame=p<.22?Math.floor(p/.055):p<.48?[4,5,6,7,6,5][Math.floor((p-.22)*23)%6]:
      p<.73?8+Math.min(3,Math.floor((p-.48)*16)):p<.92?12+Math.floor(p*29)%3:15;
    ctx.save();
    ctx.translate(500,510);ctx.scale(dir,1);ctx.globalAlpha*=fade;
    sprite(ctx,frame,0,0,246);
    const buildup=clamp((p-.08)/.35),burst=clamp((p-.48)/.11);
    const shroud=clamp((p-.27)/.21)*(1-burst);
    if(shroud>0){
      ctx.save();ctx.globalAlpha*=shroud*.94;
      const ink=ctx.createRadialGradient(0,-108,22,0,-108,101);
      ink.addColorStop(0,"#15071e");ink.addColorStop(.7,"#37114ddd");ink.addColorStop(1,"#4b1c6600");
      ctx.fillStyle=ink;ctx.fillRect(-101,-209,202,202);ctx.restore();
    }
    ctx.globalAlpha*=.85;
    for(let i=0;i<22;i++){
      const t=(p*3+i*.618)%1;
      const angle=i*2.399+p*23;
      const r=p<.48?25+(1-t)*140:22+burst*155;
      const opacity=p<.48?buildup*Math.sin(Math.PI*t):(1-burst)*buildup;
      const x=Math.cos(angle)*r,y=-110+Math.sin(angle)*r*.67;
      ctx.fillStyle=i%3?"#37124f":"#bf77f2";
      ctx.save();ctx.globalAlpha*=opacity;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*31,y+Math.sin(angle)*22);
      ctx.lineTo(x-7,y+13);ctx.closePath();ctx.fill();ctx.restore();
    }
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
      ctx.beginPath();ctx.moveTo(-65,22);ctx.quadraticCurveTo(18,25,49,-40);
      ctx.quadraticCurveTo(36,43,-65,22);ctx.fillStyle="#6b259a";ctx.fill();
      ctx.beginPath();ctx.moveTo(-45,23);ctx.quadraticCurveTo(24,20,49,-40);
      ctx.strokeStyle="#e3a4ff";ctx.lineWidth=2.5;ctx.stroke();
      ctx.restore();
    }
  }
  window.DarkSorcerer={actor,slashes,portrait(ctx,w,h){sprite(ctx,8,w/2,h*.87,Math.min(w,h));},
    onReady(fn){if(atlas.naturalWidth)fn();else atlas.addEventListener("load",fn,{once:true});}};
})();
