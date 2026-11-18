/* Low-poly Venus flytrap, registered to its root through every pose. */
(function(root){
  'use strict';
  const TILE=256,COLUMNS=4,ROOT_X=86,ROOT_Y=238,CENTER_X=500,FLOOR_Y=510,ROAR=.31,STRIKE=.594,HIT=.655,RELEASE=.735,RETURN=.826;
  const starts=[0,.052,.103,.154,.211,.262,ROAR,.375,.458,STRIKE,.634,HIT,RETURN,.873,.918,.957];
  // The opening and closing jaws lead the target-facing side of the sprite.
  const jaws=[[97,180],[127,150],[134,104],[161,73],[154,71],[134,88],[143,84],[142,91],
    [152,98],[168,117],[174,120],[178,116],[155,110],[134,126],[123,181],[93,198]];
  const atlas=new Image(),lunge=new Image();
  atlas.src='./assets/venus-trap-v154.webp';
  lunge.src='./assets/venus-trap-lunge-v156.webp';
  const clamp=t=>Math.max(0,Math.min(1,t));
  const ease=t=>{const q=clamp(t);return q*q*(3-2*q);};

  const lerp=(a,b,t)=>a+(b-a)*t;

  function pose({progress:p,target}){
    const dir=target.x>=CENTER_X?1:-1;
    const frame=starts.findLastIndex(start=>p>=start);
    const [jawX,jawY]=jaws[frame];
    const scale=1.25;
    const q=clamp((p-STRIKE)/(HIT-STRIKE));
    const reach=q*q*(1-ease((p-RELEASE)/(RETURN-RELEASE)));
    const offsetX=((target.x-CENTER_X)*dir-(jawX-ROOT_X)*scale)*reach;
    const offsetY=(target.y-92-FLOOR_Y-(jawY-ROOT_Y)*scale)*reach;
    const sink=66*ease((p-.957)/.043);
    const jaw={x:CENTER_X+dir*((jawX-ROOT_X)*scale+offsetX),y:FLOOR_Y+(jawY-ROOT_Y)*scale+offsetY};
    return {dir,frame,scale,rootX:CENTER_X,rootY:FLOOR_Y,offsetX,offsetY,reach,sink,jaw};
  }

  function sprite(c,frame,x,y,scale){
    if(!atlas.naturalWidth)return;
    c.drawImage(atlas,frame%COLUMNS*TILE,Math.floor(frame/COLUMNS)*TILE,TILE,TILE,
      x-ROOT_X*scale,y-ROOT_Y*scale,TILE*scale,TILE*scale);
  }

  function extendedStem(c,x,y,reach){
    const baseY=-41,controlX=lerp(-58,36,reach),neckControl=x-lerp(36,67,reach);
    const controlY=lerp(y+12,y-42,reach);
    const center=t=>{
      const v=1-t;
      return {x:3*v*v*t*controlX+3*v*t*t*neckControl+t**3*x,
        y:v**3*baseY-3*v*v*t*117+3*v*t*t*controlY+t**3*y};
    };
    c.save();
    c.strokeStyle='#49582a';
    c.lineWidth=31;
    c.lineCap='round';
    c.beginPath();c.moveTo(0,baseY);
    c.bezierCurveTo(controlX,-117,neckControl,controlY,x,y);
    c.stroke();
    // Lay the original painted stem along the curve in overlapping bands.
    const strips=24,band=192/strips;
    for(let i=0;i<strips;i++){
      const t=i/strips,a=center(t),b=center((i+1)/strips);
      const length=Math.hypot(a.x-b.x,a.y-b.y),angle=Math.atan2(a.y-b.y,a.x-b.x)-Math.PI/2;
      const width=lerp(49,40,t);
      c.save();
      c.translate((a.x+b.x)/2,(a.y+b.y)/2);c.rotate(angle);
      c.drawImage(lunge,0,256+192-(i+1)*band,64,band,
        -width/2,-length/2-1.5,width,length+3);
      c.restore();
    }
    c.restore();
  }

  function plant(c,b){
    if(!atlas.naturalWidth)return;
    if(b.frame<9||b.frame>11||!lunge.naturalWidth){
      if(b.sink>0){
        c.beginPath();c.rect(-320,-350,640,357);c.clip();
      }
      sprite(c,b.frame,0,b.sink,b.scale);
      return;
    }
    const left=-ROOT_X*b.scale,top=-ROOT_Y*b.scale,size=TILE*b.scale;
    const neckX=left+80*b.scale+b.offsetX,neckY=top+119*b.scale+b.offsetY;
    extendedStem(c,neckX,neckY,b.reach);
    c.drawImage(lunge,3*TILE,0,TILE,TILE,left,top,size,size);
    c.drawImage(lunge,(b.frame-9)*TILE,0,TILE,TILE,left+b.offsetX,top+b.offsetY,size,size);
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
    if(p<ROAR||p>=STRIKE)return;
    c.save();c.translate(b.jaw.x,b.jaw.y);c.scale(b.dir,1);
    for(let i=0;i<3;i++){
      const q=clamp((p-ROAR-i*.047)/.17);
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
      c.save();c.globalAlpha*=.48*(1-ease(b.sink/66));
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
    c.save();
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
    sprite(c,7,w*.39,h*.94,scale);
  }
  function onReady(fn){
    if(atlas.naturalWidth)fn();
    else atlas.addEventListener('load',fn,{once:true});
  }
  root.WIZARDRY_VENUS_TRAP={draw,portrait,pose,depthFor,ROAR,STRIKE,HIT,onReady};
})(window);
