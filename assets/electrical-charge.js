/* Electric arcs converge on the caster and seal into a charged rune. */
(function(root){
  'use strict';
  const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));

  function emblem(c,x,y,size){
    c.save();
    c.translate(x,y);
    c.scale(size/50,size/50);
    c.fillStyle='#102644';
    c.strokeStyle='#77ceff';
    c.lineWidth=2;
    c.beginPath();
    c.moveTo(0,-22);
    c.lineTo(20,-10);
    c.lineTo(20,10);
    c.lineTo(0,22);
    c.lineTo(-20,10);
    c.lineTo(-20,-10);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle='#e4fbff';
    c.beginPath();
    c.moveTo(4,-16);
    c.lineTo(-10,3);
    c.lineTo(-2,3);
    c.lineTo(-5,16);
    c.lineTo(11,-5);
    c.lineTo(3,-5);
    c.closePath();
    c.fill();
    c.restore();
  }

  function arcs(c,x,y,rx,ry,phase,alpha){
    c.save();
    c.translate(x,y);
    c.globalAlpha*=alpha;
    for(let i=0;i<7;i++){
      const angle=i*TAU/7+phase;
      const dx=Math.cos(angle)*rx,dy=Math.sin(angle)*ry;
      const bend=Math.sin(i*9+phase*4)*15;
      c.beginPath();
      c.moveTo(dx,dy);
      c.lineTo(dx*.73+bend,dy*.72);
      c.lineTo(dx*.48-bend,dy*.50);
      c.lineTo(dx*.24+bend*.4,dy*.28);
      c.lineTo(0,0);
      c.strokeStyle='#2581ff';
      c.lineWidth=5;
      c.stroke();
      c.strokeStyle='#c2f8ff';
      c.lineWidth=1.6;
      c.stroke();
    }
    c.restore();
  }

  function draw(c,{target,progress:p,time}){
    const x=target.x,y=target.y-76;
    const gather=clamp(p/.72),fade=1-clamp((p-.76)/.24);
    c.save();
    c.globalAlpha*=fade;
    const halo=c.createRadialGradient(x,y,0,x,y,90);
    halo.addColorStop(0,'#6ce9ff80');
    halo.addColorStop(1,'#153ba800');
    c.fillStyle=halo;
    c.fillRect(x-90,y-90,180,180);
    arcs(c,x,y,91-59*gather,116-82*gather,time/305,clamp(p/.15));
    if(p>.55){
      c.globalAlpha*=clamp((p-.55)/.18);
      emblem(c,x,y,48);
    }
    c.restore();
  }

  function portrait(c,w,h){
    c.save();
    c.translate(w/2,h/2);
    c.scale(w/240,h/196);
    const halo=c.createRadialGradient(0,0,8,0,0,118);
    halo.addColorStop(0,'#367bd7');
    halo.addColorStop(1,'#091626');
    c.fillStyle=halo;
    c.fillRect(-120,-98,240,196);
    arcs(c,0,0,114,91,.5,1);
    emblem(c,0,0,90);
    c.restore();
  }
  root.WIZARDRY_ELECTRICAL_CHARGE={draw,emblem,portrait};
})(window);
