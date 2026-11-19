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
    const frame=p<.41?Math.floor(p*17)%4:
      p<.59?4+Math.floor(lunge*4):
      p<hit?8+Math.min(3,Math.floor((p-.59)/(hit-.59)*4)):
      p>.94?15:12+Math.floor((p-hit)*29)%3;
    return {x,y,dir,p,hit,frame,connected};
  }

  function sparks(ctx,p,shocking){
    const opacity=ctx.globalAlpha;
    const count=shocking?9:2;
    for(let i=0;i<count;i++){
      const clock=p*(shocking?33:13)+i*.618;
      const age=clock%1;
      if(!shocking&&age>.36)continue;
      const seed=Math.floor(clock)*2.4+i*2.4;
      const pulse=Math.sin(Math.PI*(shocking?age:age/.36));
      const x=Math.cos(seed)*(shocking?62:79);
      const y=(shocking?-94:-28)+Math.sin(seed)*(shocking?66:10);
      const reach=(shocking?31:16)+Math.sin(seed*3)*8;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(seed+Math.sin(age*6)*.19);
      ctx.globalAlpha=opacity*pulse;
      ctx.beginPath();
      ctx.moveTo(0,0);ctx.lineTo(reach*.24,-6);
      ctx.lineTo(reach*.39,2+Math.sin(age*14)*4);ctx.lineTo(reach*.67,-3);
      ctx.lineTo(reach,.8);
      ctx.lineWidth=shocking?5:3;ctx.strokeStyle="#efaa16";ctx.stroke();
      ctx.lineWidth=shocking?2:1.4;ctx.strokeStyle="#ffed61";ctx.stroke();
      ctx.restore();
    }
  }

  // Trace the near coil across the torso. The complementary mask
  // sends the head, upper loop and returning tail behind the wizard.
  function clipCoil(ctx,size,frame,layer){
    const y=frame>=12?.02:0;
    const outline=[
      [.02,.47],[.16,.49],[.36,.55],[.59,.60],[.83,.64],[.98,.72],
      [.98,.83],[.76,.80],[.55,.74],[.31,.69],[.12,.62],[.02,.56]
    ];
    ctx.beginPath();
    if(layer==="back")ctx.rect(-size/2,-size*.88,size,size);
    outline.forEach(([u,v],i)=>{
      const x=(u-.5)*size, py=(v-.88+y)*size;
      if(i===0)ctx.moveTo(x,py);
      else ctx.lineTo(x,py);
    });
    ctx.closePath();
    ctx.clip("evenodd");
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
      if(wrapped)clipCoil(ctx,size,frame,layer);
      sprite(ctx,frame,0,0,size);
      ctx.restore();
      if(layer==="front"&&(p<hit||connected))sparks(ctx,p,wrapped&&p>=hit);
      ctx.restore();
    }
  };
})();
