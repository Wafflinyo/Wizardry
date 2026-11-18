(()=>{
  const atlas=new Image(),log=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/tree-monster.webp?v=0.201.0';
  log.src='./assets/tree-projectile.webp?v=0.201.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const release=.65;
  const poses=[0,.18,.30,.41,.56,release,.72,.89];
  const size=254;
  function frame(g,index,x,y,w,h){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/4;
    g.drawImage(atlas,index%4*tile,Math.floor(index/4)*tile,tile,tile,x,y,w,h);
  }
  function actor(g,{target,progress}){
    const dir=target.x>=500?1:-1;
    const pose=poses.findLastIndex(time=>progress>=time);
    const push=12*Math.sin(Math.PI*clamp((progress-.55)/.35));
    g.save();
    g.translate(500+dir*push,510);
    g.scale(dir,1);
    g.globalAlpha=clamp(progress/.10)*clamp((1-progress)/.085);
    frame(g,pose,-size/2,-size,size,size);
    g.restore();
  }
  function position(target,q){
    const direction=target.x>=500?1:-1;
    return {
      x:mix(500+direction*90,target.x,q),
      y:mix(365,target.y-71,q)-22*Math.sin(Math.PI*q)
    };
  }
  function shard(g,x,y,angle,size,color){
    g.save();
    g.translate(x,y);g.rotate(angle);
    g.fillStyle=color;
    g.beginPath();
    g.moveTo(size,0);g.lineTo(-size*.48,-size*.48);
    g.lineTo(-size*.75,size*.38);g.closePath();g.fill();
    g.restore();
  }
  function impact(g,{target,progress,hit,seed}){
    const q=clamp((progress-hit)/(1-hit));
    const spread=1-(1-q)**3;
    g.save();
    g.translate(target.x,target.y-71);
    g.globalAlpha=(1-q)**1.3;
    const glow=g.createRadialGradient(0,0,0,0,0,20+spread*67);
    glow.addColorStop(0,'#faffbdba');glow.addColorStop(.35,'#b3e46165');glow.addColorStop(1,'#c5e67d00');
    g.fillStyle=glow;g.fillRect(-95,-95,190,190);
    for(let i=0;i<23;i++){
      const a=i*2.39996,r=(18+i%8*9)*spread;
      shard(g,Math.cos(a)*r,Math.sin(a)*r-19*q+36*q*q,a+q*4,
        (3+i%5*2)*(1-q*.68),['#d2f080','#75ab45','#a77b50','#f5d89a'][i%4]);
    }
    if(seed){
      const settle=clamp((q-.35)/.65);
      g.globalAlpha=Math.sin(Math.PI*q)*.95;
      g.shadowColor='#a5ff56';g.shadowBlur=17;
      shard(g,20*(1-settle),-10-40*(1-settle),-1.1,17-4*settle,'#b9ff64');
      g.shadowBlur=0;
      shard(g,20*(1-settle),-10-40*(1-settle),-1.1,7,'#f3ffd4');
    }
    g.restore();
  }
  function thrown(g,opts){
    const {target,progress:p,hit}=opts;
    if(p<release)return;
    if(p>=hit){impact(g,opts);return;}
    const q=clamp((p-release)/(hit-release));
    const point=position(target,q),dir=target.x>=500?1:-1;
    const height=log.naturalWidth?Math.min(98,192*log.naturalHeight/log.naturalWidth):0;
    g.save();
    for(let i=0;i<12;i++){
      const t=clamp(q-(i+1)*.036);
      if(!t)continue;
      const trail=position(target,t);
      g.globalAlpha=(1-i/12)*.78;
      shard(g,trail.x-dir*(30+i*2),trail.y+(i%5-2)*8,q*8+i,4+i%4,['#b8e85a','#79b85b','#c1a376'][i%3]);
    }
    if(height){
      g.globalAlpha=1;
      g.translate(point.x,point.y);g.scale(dir,1);g.rotate(-.16+q*.38);
      g.scale(-1,1);
      g.drawImage(log,0,-height/2,192,height);
    }
    g.restore();
  }
  window.TreeSpell={
    actor,thrown,
    depth({target,progress,hit}){return mix(510,target.y,clamp((progress-release)/(hit-release)))+.14;},
    onReady(fn){if(atlas.naturalWidth)fn();else listeners.push(fn);},
    portrait(g,w,h){
      const side=Math.min(w,h);
      frame(g,3,(w-side)/2,(h-side)/2,side,side);
    }
  };
})();
