/* Registered low-poly actor frames, with independent smoke and flame atlases. */
(function(root){
  'use strict';
  const CENTER_X=500,FLOOR_Y=510,TILE=256,ACTOR_SCALE=.79,RELEASE=.53,HIT=.60;
  const actor=new Image(),effects=new Image();
  actor.src='./assets/grill-master-poses-v151.webp';
  effects.src='./assets/grill-master-effects-v151.webp';
  const starts=[0,.048,.097,.153,.216,.287,.369,.454,.494,.528,.566,.647,.735,.802,.865,.918];
  const mouth=[[178,171],[177,147],[179,133],[185,108],[183,120],[180,117],[181,118],[186,112],
    [185,116],[190,114],[187,113],[188,111],[186,128],[178,126],[180,151],[180,176]];
  const clamp=p=>Math.max(0,Math.min(1,p));
  const ease=p=>{p=clamp(p);return p*p*(3-2*p);};
  const lerp=(a,b,p)=>a+(b-a)*p;

  function pose(progress,target){
    const dir=target.x>=CENTER_X?1:-1,frame=starts.findLastIndex(start=>progress>=start);
    const heat=ease((progress-.12)/.41),planted=ease(progress/.17);
    const recoil=Math.sin(Math.PI*clamp((progress-.53)/.22));
    const shake=progress<RELEASE?Math.sin(progress*153)*heat*2.6:0;
    const x=CENTER_X+dir*(shake-recoil*13),y=FLOOR_Y-84*(1-planted)**2;
    const [mx,my]=mouth[frame];
    const muzzle={x:x+dir*(mx-128)*ACTOR_SCALE,y:y+(my-240)*ACTOR_SCALE};
    return {dir,x,y,frame,heat,muzzle,alpha:planted*(1-ease((progress-.90)/.10))};
  }

  function flamePath(progress,target,body=pose(progress,target)){
    const reach=ease((progress-RELEASE)/(HIT-RELEASE))*(1-ease((progress-.69)/.095));
    const end={x:target.x,y:target.y-79};
    return {origin:body.muzzle,end,reach};
  }

  function sprite(c,image,frame,x,y,w,h){
    if(!image.naturalWidth)return;
    c.drawImage(image,frame%4*TILE,Math.floor(frame/4)*TILE,TILE,TILE,x,y,w,h);
  }
  function glow(c,x,y,r,color){
    const light=c.createRadialGradient(x,y,0,x,y,r);
    light.addColorStop(0,color);light.addColorStop(1,'#ff5b1500');
    c.fillStyle=light;c.fillRect(x-r,y-r,r*2,r*2);
  }
  function model(c,frame,x,y,scale){
    sprite(c,actor,frame,x-128*scale,y-240*scale,TILE*scale,TILE*scale);
  }
  function smoke(c,b,p){
    const density=b.heat*(1-ease((p-.67)/.25));
    if(density<=0)return;
    const width=128+density*64;
    const animation=lerp(8,13,ease((p-.12)/.42))+2*ease((p-.66)/.23);
    const frame=Math.floor(animation),mix=animation-frame;
    const x=lerp(b.x-b.dir*18,b.muzzle.x,density*.61);
    const y=lerp(b.y-95,b.muzzle.y,density*.6);
    const opacity=c.globalAlpha*b.alpha*density*.87;
    c.save();
    c.globalAlpha=opacity*(1-mix);
    sprite(c,effects,frame,x-width/2,y-width*.90,width,width);
    if(mix>0){
      c.globalAlpha=opacity*mix;
      sprite(c,effects,frame+1,x-width/2,y-width*.90,width,width);
    }
    c.restore();
  }

  function flame(c,p,b,target){
    const {origin,end,reach}=flamePath(p,target,b);
    if(reach<=0)return;
    const angle=Math.atan2(end.y-origin.y,end.x-origin.x);
    const length=Math.hypot(end.x-origin.x,end.y-origin.y)*reach;
    const height=(85+Math.sin(p*65)*12)*(.42+.58*reach);
    const frame=p<HIT?Math.floor(7*clamp((p-RELEASE)/(HIT-RELEASE))):4+Math.floor((p-HIT)*52)%4;
    c.save();c.translate(origin.x,origin.y);c.rotate(angle);
    c.globalAlpha*=.84+.16*reach;
    sprite(c,effects,frame,0,-height/2,length,height);
    c.restore();
  }

  function draw(c,{progress:p,target,layer}){
    if(!target)return;
    const b=pose(p,target);
    if(layer==='stream'){flame(c,p,b,target);return;}
    if(layer==='impact'){
      const age=(p-HIT)/.17;
      if(age<0||age>=1)return;
      const {end}=flamePath(p,target,b),width=52+age*75;
      c.save();
      c.globalAlpha*=(1-age)**2;
      glow(c,end.x,end.y,28+age*61,'#ff8d30df');
      const frame=Math.min(15,8+Math.floor(age*8));
      sprite(c,effects,frame,end.x-width/2,end.y-width*.75,width,width);
      c.restore();return;
    }
    if(layer==='ground'){
      c.save();c.globalAlpha*=b.alpha*.45;c.fillStyle='#221722';
      c.beginPath();c.ellipse(b.x,FLOOR_Y,72,17,0,0,Math.PI*2);c.fill();c.restore();return;
    }
    c.save();c.globalAlpha*=b.alpha;
    c.translate(b.x,b.y);c.scale(b.dir,1);
    model(c,b.frame,0,0,ACTOR_SCALE);
    c.restore();
    smoke(c,b,p);
  }
  function depthFor({target},layer){
    if(layer==='ground')return FLOOR_Y-.2;
    if(layer==='actor')return FLOOR_Y;
    return target.y+(layer==='impact'?.2:.1);
  }
  function portrait(c,w,h){
    const scale=Math.min(w/230,h/238);
    glow(c,w*.5,h*.55,w*.51,'#e558177e');
    model(c,10,w*.5,h*.95,scale);
  }
  function onReady(fn){
    if(actor.naturalWidth)fn();
    else actor.addEventListener('load',fn,{once:true});
  }
  root.WIZARDRY_GRILL_MASTER={draw,portrait,pose,flamePath,depthFor,HIT,onReady};
})(window);
