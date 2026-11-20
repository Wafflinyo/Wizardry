(() => {
  const tau=Math.PI*2;
  const clamp=n=>Math.max(0,Math.min(1,n));
  function shell(ctx,time,strength,layer){
    ctx.save();
    const back=layer==="back";
    const film=ctx.createRadialGradient(-.32,-.46,.08,0,0,1);
    film.addColorStop(0,back?"#63c6ee55":"#c4efff15");
    film.addColorStop(.72,back?"#21488677":"#2aa4e211");
    film.addColorStop(.94,back?"#39c8fb9c":"#52daf769");
    film.addColorStop(1,back?"#d1fbffd0":"#a4f5ffc7");
    ctx.fillStyle=film;
    ctx.beginPath();ctx.arc(0,0,1,0,tau);ctx.fill();
    if(!back){
      ctx.lineCap="round";
      for(let i=0;i<4;i++){
        const angle=-2.74+i*1.32+Math.sin(time*.0017+i)*.14;
        ctx.strokeStyle=["#e2ffff","#a1eeff","#d9ccff","#70f3df"][i];
        ctx.globalAlpha*=.94;
        ctx.lineWidth=(i===0?.038:.018)*(.65+strength*.35);
        ctx.beginPath();ctx.arc(0,0,.957-i*.017,angle,angle+(i===0?.62:.37));ctx.stroke();
      }
      for(let i=0;i<8;i++){
        const age=(time*.00036+i*.173)%1;
        const x=Math.sin(i*2.4+age*4)*.81,y=.62-age*1.35;
        if(x*x+y*y>.87)continue;
        ctx.strokeStyle="#bff9ff94";ctx.lineWidth=.012;
        ctx.beginPath();ctx.arc(x,y,.025+i%3*.011,0,tau);ctx.stroke();
      }
    }
    ctx.restore();
  }
  function draw(ctx,{target,time,growth,hp,maxHp},layer){
    if(growth<=0)return;
    const scale=.60+.30*clamp((target.y-288)/235);
    const swell=1-(1-growth)**3;
    ctx.save();
    ctx.translate(target.x,target.y-109*scale*swell);
    ctx.scale(108*scale*swell,124*scale*swell);
    ctx.globalAlpha*=clamp(growth*3);
    shell(ctx,time,hp/maxHp,layer);
    ctx.restore();
  }
  function ripple(ctx,target,{age,popped}){
    const p=clamp(age/.62);
    if(p>=1)return;
    const scale=.60+.30*clamp((target.y-288)/235);
    ctx.save();ctx.translate(target.x,target.y-109*scale);
    ctx.globalAlpha*=1-p;
    ctx.strokeStyle="#b9f7ff";ctx.lineWidth=2.4*(1-p);
    const reach=scale*(1+p*(popped?.62:.12));
    ctx.beginPath();ctx.ellipse(0,0,108*reach,124*reach,0,popped?0:-2.85,popped?tau:1.38);ctx.stroke();
    if(popped)for(let i=0;i<16;i++){
      const angle=i*2.399;
      const x=Math.cos(angle)*108*reach,y=Math.sin(angle)*124*reach+33*p*p;
      ctx.beginPath();ctx.ellipse(x,y,2.5+i%4,4+i%3,angle,0,tau);ctx.stroke();
    }
    ctx.restore();
  }
  window.BubbleShield={draw,ripple,portrait(ctx,w,h){
    const size=Math.min(w,h)*.38;
    ctx.save();ctx.translate(w/2,h/2);ctx.scale(size,size);
    shell(ctx,2400,1,"back");shell(ctx,2400,1,"front");ctx.restore();
  }};
})();
