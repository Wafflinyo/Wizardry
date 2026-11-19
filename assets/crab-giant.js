(()=>{
  const atlas=new Image(),ready=[];
  atlas.onload=()=>ready.splice(0).forEach(fn=>fn());
  atlas.src='./assets/crab-giant.webp?v=0.222.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  const frames=[0,.084,.15,.22,.29,.37,.46,.53,.59,.635,.685,.72,.756,.81,.875,.935];
  const size=258;
  function tile(g,index,x,y,width){
    if(!atlas.naturalWidth)return;
    const cell=atlas.naturalWidth/4;
    g.drawImage(atlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,x,y,width,width);
  }
  function draw(g,{target,progress:p}){
    const dir=target.x>=500?1:-1;
    const step=smooth(clamp((p-.53)/.19));
    const recoil=smooth(clamp((p-.775)/.17));
    const x=target.x-dir*mix(197,91,step*(1-recoil*.44));
    const index=frames.findLastIndex(t=>p>=t);
    g.save();
    g.globalAlpha=Math.min(clamp(p/.07),clamp((1-p)/.065));
    g.translate(x,target.y+8);
    g.scale(dir,1);
    tile(g,index,-size/2,-size,size);
    g.restore();
  }
  function impact(g,{target,progress:p,hit}){
    if(p<hit)return;
    const q=clamp((p-hit)/.22);
    if(q===1)return;
    const x=target.x,y=target.y-86;
    g.save();
    for(let i=0;i<24;i++){
      const angle=i*2.39996;
      const radius=(18+i%7*13)*Math.sqrt(q+.015);
      const px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius*.75+55*q*q;
      const d=3+i%5*1.7;
      g.globalAlpha=(1-q)*(.6+i%3*.18);
      g.fillStyle=['#bafcff','#52cfee','#2778bd'][i%3];
      g.beginPath();
      g.moveTo(px,py-d*1.8);g.lineTo(px+d,py);g.lineTo(px-d*.7,py+d*.5);g.closePath();g.fill();
    }
    g.restore();
  }
  window.CrabGiant={
    draw,impact,onReady(fn){if(atlas.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){const side=Math.min(w,h);tile(g,4,(w-side)/2,(h-side)/2,side);}
  };
})();
