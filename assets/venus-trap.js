/* Low-poly Venus flytrap, registered to its root through every pose. */
(function(root){
  'use strict';
  const TILE=256,ROOT_X=86,ROOT_Y=238,HIT=.655;
  const starts=[0,.061,.124,.187,.255,.317,.374,.427,.493,.551,.612,HIT,.737,.801,.867,.931];
  // The opening and closing jaws lead the target-facing side of the sprite.
  const jaws=[[97,180],[127,150],[134,104],[161,73],[154,71],[134,88],[143,84],[142,91],
    [152,98],[168,117],[174,120],[178,116],[155,110],[134,126],[123,181],[93,198]];
  const atlas=new Image();
  atlas.src='./assets/venus-trap-v154.webp';
  const clamp=t=>Math.max(0,Math.min(1,t));
  const ease=t=>{const q=clamp(t);return q*q*(3-2*q);};

  function pose({progress:p,target,caster}){
    const dir=target.x>=caster.x?1:-1;
    const frame=starts.findLastIndex(start=>p>=start);
    const scale=.97+.19*clamp((target.y-325)/285);
    const baseX=target.x-dir*(jaws[11][0]-ROOT_X)*scale;
    const baseY=target.y+Math.max(0,(ROOT_Y-jaws[11][1])*scale-92);
    const hold=ease((p-.58)/.05)*(1-ease((p-.718)/.045));
    const [jawX,jawY]=jaws[frame];
    const shake=Math.sin(p*234)*ease((p-.36)/.07)*(1-ease((p-.48)/.07))*2.5;
    const x=baseX+dir*((jaws[11][0]-jawX)*scale*hold+shake);
    const y=baseY+(jaws[11][1]-jawY)*scale*hold;
    const alpha=ease(p/.065)*(1-ease((p-.94)/.06));
    return {dir,frame,scale,x,y,baseX,baseY,alpha,jaw:{x:x+dir*(jawX-ROOT_X)*scale,y:y+(jawY-ROOT_Y)*scale}};
  }

  function sprite(c,frame,x,y,scale){
    if(!atlas.naturalWidth)return;
    c.drawImage(atlas,frame%4*TILE,Math.floor(frame/4)*TILE,TILE,TILE,
      x-ROOT_X*scale,y-ROOT_Y*scale,TILE*scale,TILE*scale);
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
      c.beginPath();c.ellipse(b.baseX,b.baseY,58*b.scale,13*b.scale,0,0,Math.PI*2);c.fill();
      c.restore();
      chips(c,b.baseX,b.baseY,(p-.026)/.29,16,98,65,['#5e4730','#a0854b','#5f702c']);
      chips(c,b.baseX,b.baseY,(p-.84)/.155,10,50,34,['#786342','#577132']);
      return;
    }
    if(layer==='bite'){
      chips(c,target.x,target.y-92,(p-HIT)/.19,16,83,48,['#b2de72','#6a9b44','#dfeca1','#9eb457']);
      return;
    }
    c.save();c.globalAlpha*=b.alpha;
    c.translate(b.x,b.y);c.scale(b.dir,1);
    sprite(c,b.frame,0,0,b.scale);
    c.restore();
    roar(c,b,p);
  }

  function depthFor(opts,layer){
    if(layer==='ground')return 200;
    if(layer==='bite')return opts.target.y+.24;
    const b=pose(opts);
    return Math.max(b.baseY,opts.target.y+.12);
  }
  function portrait(c,w,h){
    const scale=Math.min(w/206,h/221);
    const glow=c.createRadialGradient(w*.52,h*.49,0,w*.52,h*.49,Math.min(w,h)*.57);
    glow.addColorStop(0,'#91bd4b70');
    glow.addColorStop(1,'#33591b00');
    c.fillStyle=glow;c.fillRect(0,0,w,h);
    sprite(c,7,w*.43,h*.94,scale);
  }
  function onReady(fn){
    if(atlas.naturalWidth)fn();
    else atlas.addEventListener('load',fn,{once:true});
  }
  root.WIZARDRY_VENUS_TRAP={draw,portrait,pose,depthFor,HIT,onReady};
})(window);
