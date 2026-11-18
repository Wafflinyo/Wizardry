(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/yeti-poses.webp?v=0.208.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,q)=>a+(b-a)*q;
  const size=241;
  function direction(target){return target.x>=500?1:-1;}
  function position(target,p){
    const dir=direction(target);
    const q=clamp((p-.42)/.25),travel=q*q*(3-2*q);
    return {x:mix(500-dir*52,target.x-dir*62,travel),floor:mix(510,target.y+4,travel),q};
  }
  function frame(g,index,x,y,width){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/4;
    g.drawImage(atlas,index%4*tile,Math.floor(index/4)*tile,tile,tile,x,y,width,width);
  }
  function crystal(g,x,y,r,angle,color){
    g.save();g.translate(x,y);g.rotate(angle);
    g.fillStyle=color;
    g.beginPath();g.moveTo(r,0);g.lineTo(-r*.35,-r*.52);g.lineTo(-r*.82,r*.12);g.lineTo(-r*.20,r*.46);
    g.closePath();g.fill();g.restore();
  }
  function breath(g,p){
    const exhale=clamp((p-.16)/.19);
    const fade=clamp((p-.16)/.04)*clamp((.43-p)/.08);
    g.save();g.translate(49,-size*.69);
    for(let i=0;i<24;i++){
      const t=(i*.618+p*8)%1;
      const length=115*exhale*t;
      const y=Math.sin(i*2.4+p*6)*(5+22*t)-10*t;
      g.globalAlpha=fade*(1-t)*(.23+i%4*.14);
      crystal(g,length,y,5+t*17,i*.7+p*16,['#e7fbff','#a5e8ff','#74c6ed'][i%3]);
    }
    g.restore();
  }
  function draw(g,{target,progress:p,hit}){
    const {x,floor,q}=position(target,p);
    let pose=0;
    if(p>=.42&&p<.67)pose=q>.82?7:4+Math.floor(q*7)%3;
    else if(p>=.67)pose=p>=.91?11:p>=hit?10:p>=hit-.033?9:8;
    else if(p>=.35)pose=3;
    else if(p>=.16)pose=2;
    else if(p>=.09)pose=1;
    g.save();g.translate(x,floor);g.scale(direction(target),1);
    g.globalAlpha=clamp(p/.085)*clamp((1-p)/.09);
    frame(g,pose,-size/2,-size-(pose===5?12:0),size);
    if(p>=.16&&p<.43)breath(g,p);
    g.restore();
  }
  function impact(g,{target,progress:p,hit}){
    if(p<hit)return;
    const q=clamp((p-hit)/(1-hit)),spread=1-(1-q)**3;
    g.save();g.translate(target.x,target.y-49);
    const light=g.createRadialGradient(0,0,0,0,0,33+55*spread);
    light.addColorStop(0,'#f5feffc7');light.addColorStop(.34,'#a1eaff78');light.addColorStop(1,'#83cbff00');
    g.globalAlpha=(1-q)**2;g.fillStyle=light;g.fillRect(-90,-90,180,180);
    for(let i=0;i<24;i++){
      const a=i*2.39996,r=(24+i%8*13)*spread;
      g.globalAlpha=(1-q)**1.2;
      crystal(g,Math.cos(a)*r,Math.sin(a)*r*.73-42*q+50*q*q,
        (4+i%6*2)*(1-q*.66),a+q*4,['#e1f9ff','#9ce5ff','#68abd0'][i%3]);
    }
    g.globalAlpha=(1-q)**1.8;g.strokeStyle='#aee9ff';g.lineWidth=3;
    g.beginPath();g.ellipse(0,46,10+spread*96,4+spread*20,0,0,Math.PI*2);g.stroke();
    g.restore();
  }
  window.IceYeti={
    draw,impact,depth:({target,progress})=>position(target,progress).floor,
    onReady(fn){if(atlas.naturalWidth)fn();else listeners.push(fn);},
    portrait(g,w,h){const side=Math.min(w,h);frame(g,8,(w-side)/2,(h-side)/2,side);}
  };
})();
