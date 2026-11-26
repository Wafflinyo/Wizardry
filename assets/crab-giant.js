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
  function poly(g,points,color){
    g.fillStyle=color;g.beginPath();
    points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();g.fill();
  }
  function impact(g,{target,progress:p,hit=.72}){
    if(p<hit)return;
    const q=(p-hit)/.22;
    if(q>=1)return;
    const x=target.x,y=target.y-86,dir=target.x>=500?1:-1;
    g.save();g.translate(x,y);g.scale(dir,1);
    // Instant sharp white-blue contact flash, then a fast expanding burst.
    if(q<.20){
      g.globalAlpha=(1-q/.20)*.94;
      const r=26+q*150;
      const star=Array.from({length:16},(_,i)=>{
        const a=i*Math.PI/8,k=i%2?.24:1;
        return [Math.cos(a)*r*k,Math.sin(a)*r*k*.8];
      });
      poly(g,star,'#b8f1ff');
      poly(g,star.map(([a,b])=>[a*.56,b*.56]),'#ffffff');
    }
    // Two hard crescent pressure arcs open out from the closing pincer.
    for(let i=0;i<2;i++){
      const t=(q-i*.075)/.54;if(t<0||t>=1)continue;
      g.globalAlpha=(1-t)*.9;g.strokeStyle=i?'#4bbde5':'#d8faff';
      g.lineWidth=2+5*(1-t);g.beginPath();
      g.ellipse(0,0,22+82*t,12+52*t,-.22,-1.2,1.2);g.stroke();
      g.beginPath();g.ellipse(0,0,22+82*t,12+52*t,-.22,Math.PI-1.2,Math.PI+1.2);g.stroke();
    }
    // Faceted, directional impact streaks shoot out from the snap.
    for(let i=0;i<15;i++){
      const a=i*2.39996,dx=Math.cos(a),dy=Math.sin(a);
      const r=12+q*(88+i%4*18),len=(24+i%5*7)*(1-q);
      const px=dx*r,py=dy*r*.76,w=3.5*(1-q);
      g.globalAlpha=(1-q)*.94;
      poly(g,[[px-dy*w,py+dx*w],[px+dx*len,py+dy*len],[px+dy*w,py-dx*w],[px-dx*8,py-dy*8]],i%3?'#56c9ef':'#f0ffff');
    }
    // Independent low-poly water shards arc outward and fall under gravity.
    for(let i=0;i<42;i++){
      const a=i*2.39996,r=(30+i%8*15)*Math.sqrt(q+.012);
      const px=Math.cos(a)*r,py=Math.sin(a)*r*.72-4*q*(1-q)*(24+i%6*10)+70*q*q;
      const d=(3+i%5*1.4)*(1-q*.6);
      g.globalAlpha=(1-q)*(.65+i%3*.16);
      poly(g,[[px,py-d*1.8],[px+d,py],[px-d*.7,py+d*.5]],['#c9fbff','#52cfee','#2778bd'][i%3]);
    }
    g.restore();
  }
  function shake(p,dir=1,hit=.72,duration=3800){
    const dt=(p-hit)*duration;
    if(dt<0||dt>=175)return {x:0,y:0};
    const k=(1-dt/175)**2;
    return {x:dir*Math.cos(dt*.13)*8*k,y:Math.sin(dt*.14)*4*k};
  }
  window.CrabGiant={
    draw,impact,shake,onReady(fn){if(atlas.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){const side=Math.min(w,h);tile(g,4,(w-side)/2,(h-side)/2,side);}
  };
})();
