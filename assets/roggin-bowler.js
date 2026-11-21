/* Roggin' Bowler. Ogre poses are stored in a 4 by 4 sprite atlas. */
(()=>{
  const atlas=new Image(),callbacks=[];
  atlas.onload=()=>callbacks.splice(0).forEach(callback=>callback());
  atlas.src="./assets/roggin-bowler-frames.webp?v=2";
  const rollSprite=new Image();
  rollSprite.src="./assets/roggin-bowler-ball.webp";
  const cell=192,scale=1.46,release=2920;
  const poseTimes=[0,235,470,715,1000,1200,1360,1510,1960,2220,2490,2760,2870,release,3090,3360];
  const ground=[183,183,183,183,183,183,183,183,183,183,183,183,182,182,182,182];
  const clamp=n=>Math.max(0,Math.min(1,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  function poly(ctx,points,color){
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);
    for(const point of points.slice(1))ctx.lineTo(...point);
    ctx.closePath();ctx.fill();
  }
  function pose(ctx,index){
    ctx.drawImage(atlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,
      -cell*scale*.5,-ground[index]*scale,cell*scale,cell*scale);
  }
  function actor(ctx,{x,y,dir,elapsed}){
    if(!atlas.naturalWidth)return;
    let index=0;
    while(index+1<poseTimes.length&&elapsed>=poseTimes[index+1])index++;
    const fade=clamp(elapsed/180)*clamp((4490-elapsed)/330);
    ctx.save();ctx.globalAlpha=fade;ctx.translate(x,y);ctx.scale(dir,1);
    pose(ctx,index);ctx.restore();
  }
  function projectile(ctx,opts){
    const {x,y,dir,target,elapsed,hitAt}=opts;
    if(elapsed<release||elapsed>hitAt+620)return;
    const q=clamp((elapsed-release)/(hitAt-release)),age=elapsed-hitAt;
    const travel=1-(1-q)**1.35;
    const px=mix(x+dir*82,target.x,travel),py=mix(y-45,target.y-40,travel)-Math.sin(q*Math.PI)*3;
    ctx.save();
    if(age<0){
      for(let i=0;i<8;i++){
        const off=i*10+(elapsed/7)%10;
        ctx.globalAlpha=(1-i/8)*.34;
        const tx=px-dir*(17+off),ty=py+21-Math.sin(i+1)*8;
        poly(ctx,[[tx,ty-3],[tx-dir*(24+i*3),ty],[tx,ty+5]],i%2?"#bfa37a":"#dac19b");
      }
      ctx.globalAlpha=.28;ctx.fillStyle="#24211c";ctx.beginPath();
      ctx.ellipse(px,py+40,37,8,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.translate(px,py);
      ctx.rotate(dir*Math.hypot(px-(x+dir*82),py-(y-45))/40);
      if(rollSprite.naturalWidth)ctx.drawImage(rollSprite,-46.7,-46.7,93.4,93.4);
    }else{
      const p=clamp(age/620),r=1-p;
      ctx.globalAlpha=r*.65;ctx.fillStyle="#b89972";ctx.beginPath();
      ctx.ellipse(target.x,target.y,25+p*116,8+p*29,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=clamp(1-age/119);
      poly(ctx,[[target.x-68,target.y-5],[target.x-19,target.y-45],[target.x-8,target.y-85],
        [target.x+9,target.y-46],[target.x+55,target.y-64],[target.x+38,target.y-23],[target.x+75,target.y-13],
        [target.x+13,target.y+8]],"#ffe2a6");
      for(let i=0;i<19;i++){
        const angle=i*2.39996,radius=p*(49+i%5*15);
        const dx=target.x+Math.cos(angle)*radius,dy=target.y+Math.sin(angle)*radius*.36-Math.sin(p*Math.PI)*(26+i%6*8);
        ctx.globalAlpha=r*.85;
        poly(ctx,[[dx-4,dy+2],[dx+2,dy-7],[dx+7,dy+3]],[ "#997650","#d8b588","#675548"][i%3]);
      }
    }
    ctx.restore();
  }
  function depth(opts){
    return mix(opts.y,opts.target.y,clamp((opts.elapsed-release)/(opts.hitAt-release)));
  }
  function portrait(ctx,w,h){
    if(!atlas.naturalWidth)return;
    const zoom=Math.min(w/295,h/267)*.94;
    ctx.save();ctx.translate(w*.48,h*.94);ctx.scale(zoom,zoom);pose(ctx,7);ctx.restore();
  }
  function onReady(callback){if(atlas.naturalWidth)callback();else callbacks.push(callback);}
  window.RogginBowler={actor,projectile,depth,portrait,onReady};
})();
