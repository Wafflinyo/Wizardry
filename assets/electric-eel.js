(() => {
  const atlas = new Image();
  atlas.src = "./assets/electric-eel.webp";
  const tile = 256;
  const clamp = n => Math.max(0,Math.min(1,n));
  const mix = (a,b,t) => a+(b-a)*t;

  function sprite(ctx,frame,x,y,size){
    if(!atlas.naturalWidth)return;
    ctx.drawImage(atlas,(frame%4)*tile,Math.floor(frame/4)*tile,tile,tile,
      x-size/2,y-size*.88,size,size);
  }

  function scene(target,p,hit,connected){
    const dir=target.x>=500?1:-1;
    const approach=clamp(p/.40);
    const lunge=clamp((p-.41)/.18);
    const start=target.x-dir*217;
    const x=mix(start+dir*48*approach,target.x,lunge*lunge);
    const y=mix(510,target.y,clamp(p/.59));
    const frame=p<.41?Math.floor(p*30)%4:
      p<.59?4+Math.floor(lunge*4):
      p<hit?8+Math.min(3,Math.floor((p-.59)/(hit-.59)*4)):
      12+Math.min(3,Math.floor((p-hit)/(1-hit)*4));
    return {x,y,dir,p,hit,frame,connected};
  }

  function sparks(ctx,p,wrapped){
    const tick=Math.floor(p*135);
    const span=wrapped?64:92;
    for(let i=0;i<(wrapped?10:6);i++){
      const theta=i*2.4+tick*.83;
      const x=Math.cos(theta)*span,y=(wrapped?-95:-32)+Math.sin(theta)*(wrapped?72:14);
      const len=12+(tick+i*7)%18;
      ctx.strokeStyle=i%2?"#fff3a4":"#78e9ff";
      ctx.lineWidth=i%2?1.4:2.4;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len*.4,y-9);
      ctx.lineTo(x+len*.3,y+3);ctx.lineTo(x+len,y-12);ctx.stroke();
    }
  }

  window.ElectricEel={
    onReady(fn){
      if(atlas.naturalWidth)fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    portrait(ctx,w,h){
      const size=Math.min(w,h);
      sprite(ctx,10,w/2,(h-size)/2+size*.88,size);
    },
    scene,
    draw(ctx,{x,y,dir,p,hit,frame,connected},layer){
      const wrapped=p>=.59;
      if(!wrapped&&layer==="back")return;
      const size=wrapped?210:220;
      ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
      ctx.globalAlpha*=Math.min(1,p*18,(1-p)*12);
      if(!connected&&p>=hit)ctx.globalAlpha*=clamp(1-(p-hit)*10);
      ctx.save();
      if(wrapped){
        ctx.beginPath();
        if(layer==="back")ctx.rect(-size,-size,2*size,size-69);
        else ctx.rect(-size,-69,2*size,size);
        ctx.clip();
      }
      sprite(ctx,frame,0,0,size);
      ctx.restore();
      if(layer==="front"&&(p<hit||connected))sparks(ctx,p,wrapped);
      ctx.restore();
    }
  };
})();
