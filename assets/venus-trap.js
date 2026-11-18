/* Low-poly Venus flytrap, registered to its root through every pose. */
(function(root){
  'use strict';
  const TILE=256,COLUMNS=8,ROOT_X=86,ROOT_Y=238,CENTER_X=500,FLOOR_Y=510,HIT=.655;
  const starts=[0,.061,.124,.187,.255,.317,.374,.427,.493,.551,.612,HIT,.737,.801,.867,.931];
  // The opening and closing jaws lead the target-facing side of the sprite.
  const jaws=[[97,180],[127,150],[134,104],[161,73],[154,71],[134,88],[143,84],[142,91],
    [152,98],[168,117],[174,120],[178,116],[155,110],[134,126],[123,181],[93,198]];
  const frames=starts.flatMap((start,i)=>i===starts.length-1?[start]:
    [start,(2*start+starts[i+1])/3,(start+2*starts[i+1])/3]);
  const atlas=new Image();
  atlas.src='./assets/venus-trap-v155.webp';
  const clamp=t=>Math.max(0,Math.min(1,t));
  const ease=t=>{const q=clamp(t);return q*q*(3-2*q);};

  const lerp=(a,b,t)=>a+(b-a)*t;

  function pose({progress:p,target}){
    const dir=target.x>=CENTER_X?1:-1;
    const frame=frames.findLastIndex(start=>p>=start);
    const key=Math.floor(frame/3),blend=(frame%3)/3;
    const next=jaws[Math.min(key+1,jaws.length-1)];
    const jawX=lerp(jaws[key][0],next[0],blend);
    const jawY=lerp(jaws[key][1],next[1],blend);
    const scale=1.25;
    const reach=ease((p-.475)/(HIT-.475))*(1-ease((p-.724)/.15));
    const offsetX=((target.x-CENTER_X)*dir-(jawX-ROOT_X)*scale)*reach;
    const offsetY=(target.y-92-FLOOR_Y-(jawY-ROOT_Y)*scale)*reach;
    const alpha=ease(p/.065)*(1-ease((p-.94)/.06));
    const jaw={x:CENTER_X+dir*((jawX-ROOT_X)*scale+offsetX),y:FLOOR_Y+(jawY-ROOT_Y)*scale+offsetY};
    return {dir,frame,scale,rootX:CENTER_X,rootY:FLOOR_Y,offsetX,offsetY,reach,alpha,jaw};
  }

  function sprite(c,frame,x,y,scale){
    if(!atlas.naturalWidth)return;
    c.drawImage(atlas,frame%COLUMNS*TILE,Math.floor(frame/COLUMNS)*TILE,TILE,TILE,
      x-ROOT_X*scale,y-ROOT_Y*scale,TILE*scale,TILE*scale);
  }

  function extendedStem(c,x,y,amount){
    const a={x:0,y:-31},d={x,y},b={x:5+x*.07,y:-107},
      e={x:x*.75,y:y-55-20*amount};
    const center=t=>{
      const v=1-t;
      return {x:v**3*a.x+3*v*v*t*b.x+3*v*t*t*e.x+t**3*d.x,
        y:v**3*a.y+3*v*v*t*b.y+3*v*t*t*e.y+t**3*d.y};
    };
    const points=[];
    for(let i=0;i<=18;i++){
      const t=i/18,p=center(t),prev=center(Math.max(0,t-.015)),next=center(Math.min(1,t+.015));
      const vx=next.x-prev.x,vy=next.y-prev.y,length=Math.hypot(vx,vy)||1;
      const radius=lerp(22,14,t)*(1+.11*Math.sin(t*8));
      points.push({p,x:-vy/length*radius,y:vx/length*radius});
    }
    const facet=(vertices,fill)=>{
      c.fillStyle=fill;c.beginPath();
      vertices.forEach(([vx,vy],i)=>i?c.lineTo(vx,vy):c.moveTo(vx,vy));
      c.closePath();c.fill();
    };
    const side=(point,f)=>[point.p.x+point.x*f,point.p.y+point.y*f];
    for(let i=1;i<points.length;i++){
      const p=points[i-1],q=points[i];
      facet([side(p,-1),side(q,-1),side(q,1),side(p,1)],i%3?'#3f5024':'#4a5b26');
      facet([side(p,-.63),side(q,-.69),side(q,.31),side(p,.39)],i%3?'#67753b':'#728045');
      facet([side(p,.39),side(q,.31),side(q,.79),side(p,.86)],i%3?'#84904e':'#939f58');
      facet([side(p,-.60),side(q,.29),side(p,.12)],'#526131');
    }
  }

  // The center roots and the jaw sprite keep their proportions. Only the
  // connecting stem grows long enough to cover the distance to the target.
  function plant(c,b){
    if(!atlas.naturalWidth)return;
    if(b.reach===0){sprite(c,b.frame,0,0,b.scale);return;}
    const sx=b.frame%COLUMNS*TILE,sy=Math.floor(b.frame/COLUMNS)*TILE;
    const neck=159,roots=202,baseX=-ROOT_X*b.scale;
    const drawRegion=(top,height,dx,dy)=>c.drawImage(atlas,sx,sy+top,TILE,height,
      baseX+dx,(top-ROOT_Y)*b.scale+dy,TILE*b.scale,height*b.scale);
    const stretch=ease((b.reach-.025)/.19);
    c.save();
    c.globalAlpha*=1-stretch;
    if(stretch<1)drawRegion(neck,roots-neck,b.offsetX*.46,b.offsetY*.46);
    c.restore();
    c.save();
    c.globalAlpha*=stretch;
    if(stretch>0)extendedStem(c,b.offsetX+16,(neck-ROOT_Y)*b.scale+b.offsetY-7,b.reach);
    c.restore();
    drawRegion(roots,TILE-roots,0,0);
    drawRegion(0,neck,b.offsetX,b.offsetY);
  }

  function chips(c,x,y,q,count,spread,height,colors){
    if(q<0||q>=1)return;
    c.save();
    c.globalAlpha*=(1-q)*ease(q/.12);
    for(let i=0;i<count;i++){
      const angle=i*2.399,dist=(.45+(i%7)*.1)*spread,px=x+Math.cos(angle)*dist*q;
      const py=y+Math.sin(angle)*dist*q*.32-Math.sin(q*Math.PI)*height*(.45+(i%5)*.14);
      c.save();c.translate(px,py);c.rotate(angle+q*5);
      c.fillStyle=colors[i%colors.length];
      c.beginPath();c.moveTo(-5,2);c.lineTo(0,-4);c.lineTo(6,-1);c.lineTo(2,4);c.closePath();c.fill();
      c.restore();
    }
    c.restore();
  }
  function roar(c,b,p){
    if(p<.37||p>=.54)return;
    c.save();c.translate(b.jaw.x,b.jaw.y);c.scale(b.dir,1);
    for(let i=0;i<3;i++){
      const q=clamp((p-.37-i*.026)/.085);
      if(q<=0||q>=1)continue;
      c.globalAlpha=Math.sin(q*Math.PI)*.42;
      c.lineWidth=2.5-q;
      c.strokeStyle=i%2?'#c8eaa6':'#8ecb77';
      c.beginPath();c.ellipse(12+q*31,0,7+q*16,10+q*25,0,-1.1,1.1);c.stroke();
    }
    c.restore();
  }

  function draw(c,opts){
    const {progress:p,target,layer}=opts;
    const b=pose(opts);
    if(layer==='ground'){
      c.save();c.globalAlpha*=b.alpha*.48;
      c.fillStyle='#202019';
      c.beginPath();c.ellipse(b.rootX,b.rootY,58*b.scale,13*b.scale,0,0,Math.PI*2);c.fill();
      c.restore();
      chips(c,b.rootX,b.rootY,(p-.026)/.29,16,98,65,['#5e4730','#a0854b','#5f702c']);
      chips(c,b.rootX,b.rootY,(p-.84)/.155,10,50,34,['#786342','#577132']);
      return;
    }
    if(layer==='bite'){
      chips(c,target.x,target.y-92,(p-HIT)/.19,16,83,48,['#b2de72','#6a9b44','#dfeca1','#9eb457']);
      return;
    }
    c.save();c.globalAlpha*=b.alpha;
    c.translate(b.rootX,b.rootY);c.scale(b.dir,1);
    plant(c,b);
    c.restore();
    roar(c,b,p);
  }

  function depthFor(opts,layer){
    if(layer==='ground')return 200;
    if(layer==='bite')return opts.target.y+.24;
    const b=pose(opts);
    return lerp(FLOOR_Y,opts.target.y+.12,b.reach);
  }
  function portrait(c,w,h){
    const scale=Math.min(w/206,h/221);
    const glow=c.createRadialGradient(w*.52,h*.49,0,w*.52,h*.49,Math.min(w,h)*.57);
    glow.addColorStop(0,'#91bd4b70');
    glow.addColorStop(1,'#33591b00');
    c.fillStyle=glow;c.fillRect(0,0,w,h);
    sprite(c,21,w*.39,h*.94,scale);
  }
  function onReady(fn){
    if(atlas.naturalWidth)fn();
    else atlas.addEventListener('load',fn,{once:true});
  }
  root.WIZARDRY_VENUS_TRAP={draw,portrait,pose,depthFor,HIT,onReady};
})(window);
