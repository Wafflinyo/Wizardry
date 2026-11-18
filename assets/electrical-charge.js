/* Frame-animated electrical cage. The caster remains visible inside the arcs. */
(function(root){
  'use strict';
  const TILE=256;
  const atlas=new Image();
  atlas.src='./assets/electrical-charge-v151.webp';
  const starts=[0,.049,.103,.158,.217,.280,.342,.403,.468,.525,.587,.649,.713,.771,.838,.916];
  const clamp=n=>Math.max(0,Math.min(1,n));

  function frame(p){
    return starts.findLastIndex(time=>p>=time);
  }
  function sprite(c,number,x,y,w,h){
    if(!atlas.naturalWidth)return;
    c.drawImage(atlas,number%4*TILE,Math.floor(number/4)*TILE,TILE,TILE,x,y,w,h);
  }
  function emblem(c,x,y,size){
    if(!atlas.naturalWidth)return;
    // Sample just the large faceted rune, leaving edge fragments in the cast.
    c.drawImage(atlas,256+85,3*256+42,90,135,x-size*.35,y-size*.46,size*.70,size*.92);
  }
  function draw(c,{target,progress:p}){
    if(!target)return;
    const scale=.60+.30*clamp((target.y-288)/235);
    const width=266*scale,height=285*scale;
    c.save();
    c.globalAlpha*=Math.min(1,p/.025,(1-p)/.075);
    sprite(c,frame(p),target.x-width/2,target.y-height*.91,width,height);
    c.restore();
  }
  function portrait(c,w,h){
    const size=Math.min(w,h)*.97;
    const corona=c.createRadialGradient(w/2,h/2,0,w/2,h/2,size*.6);
    corona.addColorStop(0,'#3756b4cc');
    corona.addColorStop(1,'#12143e00');
    c.fillStyle=corona;c.fillRect(0,0,w,h);
    sprite(c,11,(w-size)/2,(h-size)/2,size,size);
  }
  function onReady(fn){
    if(atlas.naturalWidth)fn();
    else atlas.addEventListener('load',fn,{once:true});
  }
  root.WIZARDRY_ELECTRICAL_CHARGE={draw,emblem,portrait,frame,onReady};
})(window);
