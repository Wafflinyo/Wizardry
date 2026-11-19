(()=>{
  const atlas=new Image(),runAtlas=new Image();
  atlas.src='./assets/yeti-poses.webp?v=0.208.0';
  runAtlas.src='./assets/yeti-run-v237.webp';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,q)=>a+(b-a)*q;
  const size=241;
  const runStart=.42,runEnd=.64;
  // The six full-body frames are ordered by support leg: near plant,
  // near recovery, far plant, far recovery, near knee and near reach.
  const runFrames=6;
  const contacts=[runStart,runStart+(runEnd-runStart)*2/runFrames];
  function direction(target){return target.x>=500?1:-1;}
  function position(target,p){
    const dir=direction(target);
    const q=clamp((p-.42)/.25),travel=q*q*(3-2*q);
    return {x:mix(500-dir*52,target.x-dir*62,travel),floor:mix(510,target.y+4,travel),q};
  }
  function frame(g,index,x,y,width,image=atlas){
    if(!image.naturalWidth)return;
    const tile=image.naturalWidth/4;
    g.drawImage(image,index%4*tile,Math.floor(index/4)*tile,tile,tile,x,y,width,width);
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
  function stepSnow(g,target,p){
    const dir=direction(target);
    g.save();
    for(const [step,at] of contacts.entries()){
      const age=(p-at)/.104;
      if(age<0||age>=1)continue;
      const {x,floor}=position(target,at);
      const foot=x+dir*(step%2?64:54);
      for(let i=0;i<8;i++){
        const drift=(12+i*6)*age;
        const lift=(7+i%4*7)*Math.sin(age*Math.PI);
        const px=foot-dir*drift,py=floor-(step%2?9:2)-lift-i%3*3;
        g.globalAlpha=(1-age)**1.35*(.36+i%3*.17);
        crystal(g,px,py,4+i%3*3+age*10,-dir*.35+i*.48,i%2?'#eefaff':'#b8e6fa');
      }
    }
    g.restore();
  }
  function draw(g,{target,progress:p,hit}){
    const {x,floor}=position(target,p);
    const running=p>=runStart&&p<runEnd;
    let pose=0;
    if(running)pose=Math.floor((p-runStart)/(runEnd-runStart)*runFrames);
    else if(p>=runEnd&&p<.67)pose=7;
    else if(p>=.67)pose=p>=.91?11:p>=hit?10:p>=hit-.033?9:8;
    else if(p>=.35)pose=3;
    else if(p>=.16)pose=2;
    else if(p>=.09)pose=1;
    stepSnow(g,target,p);
    g.save();g.translate(x,floor);g.scale(direction(target),1);
    g.globalAlpha=clamp(p/.085)*clamp((1-p)/.09);
    frame(g,pose,-size/2,-size,size,running?runAtlas:atlas);
    if(p>=.16&&p<.43)breath(g,p);
    g.restore();
  }
  function shake(p,dir,hit){
    const age=(p-hit)/.103;
    if(age<0||age>=1)return null;
    const force=(1-age)**2;
    return {x:dir*11*Math.sin(age*27)*force,y:-16*Math.cos(age*23)*force};
  }
  function ground(g,{target,progress:p,hit}){
    if(p<hit)return;
    const q=clamp((p-hit)/(1-hit)),growth=clamp(q/.29),spread=1-(1-growth)**3;
    g.save();g.translate(target.x,target.y-2);
    g.globalAlpha=clamp((1-q)/.24);
    g.beginPath();
    for(let ray=0;ray<8;ray++){
      const angle=ray*2.39996,dx=Math.cos(angle),dy=Math.sin(angle);
      const distance=(45+ray%5*17)*spread;
      let prevX=0,prevY=0;
      g.moveTo(0,0);
      for(let segment=1;segment<=5;segment++){
        const along=segment/5;
        const offset=Math.sin(ray*5+segment*7.2)*12*along*spread;
        const x=dx*distance*along-dy*offset,y=(dy*distance*along+dx*offset)*.32;
        g.lineTo(x,y);
        if(segment===3){
          const fork=(ray%2?1:-1)*19*spread;
          g.lineTo(x+dx*distance*.24-dy*fork,y+(dy*distance*.24+dx*fork)*.32);
          g.moveTo(prevX,prevY);g.lineTo(x,y);
        }
        prevX=x;prevY=y;
      }
    }
    g.strokeStyle='#9ce6ff';g.lineWidth=5;g.stroke();
    g.strokeStyle='#162b3e';g.lineWidth=2.7;g.stroke();
    g.restore();
  }
  function impact(g,{target,progress:p,hit}){
    if(p<hit)return;
    const q=clamp((p-hit)/(1-hit)),spread=1-(1-q)**3;
    g.save();g.translate(target.x,target.y-49);
    const flash=1-clamp(q/.27);
    const light=g.createRadialGradient(0,0,0,0,0,42+spread*74);
    light.addColorStop(0,'#ffffffef');light.addColorStop(.34,'#c6f3ffc0');light.addColorStop(1,'#83cbff00');
    g.globalAlpha=flash;g.fillStyle=light;g.fillRect(-120,-120,240,240);
    for(let i=0;i<17;i++){
      const a=i*2.39996,r=(25+i%7*14)*spread;
      g.globalAlpha=(1-q)**1.25*(.45+i%3*.16);
      crystal(g,Math.cos(a)*r,Math.sin(a)*r*.62-42*q,
        (15+i%5*5)*(1+q*.40),a+q,['#f4fdff','#d7f2ff','#abd9f0'][i%3]);
    }
    for(let i=0;i<13;i++){
      const a=i*2.39996,r=(22+i%6*11)*spread;
      const x=Math.cos(a)*r,y=42+Math.sin(a)*r*.27-137*q+86*q*q;
      g.globalAlpha=(1-q)**1.25*.73;
      crystal(g,x,y,(13+i%4*5)*(1+q*.35),-Math.PI/2+a*.11,'#f5fcff');
    }
    // Large crystals split into smaller facets on the way out.
    for(let i=0;i<10;i++){
      const a=i*2.39996,r=(37+i%5*18)*spread;
      const x=Math.cos(a)*r,y=Math.sin(a)*r*.61-95*q+69*q*q;
      const split=clamp((q-.15)*3);
      for(let j=0;j<3;j++){
        g.globalAlpha=(1-q)**1.1;
        crystal(g,x+split*(j-1)*24,y-split*j*14,
          (15-j*3)*(1-q*.65),a+q*(j+2),['#8fd7ff','#c6f2ff','#f3fdff'][j]);
      }
    }
    for(let i=0;i<32;i++){
      const a=i*2.39996,r=(31+i%9*15)*spread;
      const x=Math.cos(a)*r,y=Math.sin(a)*r*.69-71*q+82*q*q;
      g.globalAlpha=(1-q)**.9;
      const radius=(5+i%6*3)*(1-q*.54);
      crystal(g,x,y,radius,a+q*6,['#ebfcff','#9ce5ff','#5ca5d2'][i%3]);
      if(i%3===0)crystal(g,x,y-2,radius*.62,a+q*6,'#ffffff');
    }
    for(let ring=0;ring<2;ring++){
      const wave=clamp((q-ring*.12)/(1-ring*.12));
      if(q<ring*.12)continue;
      const width=12+(1-(1-wave)**2)*(ring?110:140);
      g.globalAlpha=(1-wave)**2*(ring?.62:.93);g.strokeStyle=ring?'#80d5fd':'#e4f8ff';
      g.lineWidth=5*(1-wave)+1;
      g.beginPath();g.ellipse(0,47,width,width*.23,0,0,Math.PI*2);g.stroke();
    }
    g.restore();
  }
  window.IceYeti={
    draw,impact,ground,shake,depth:({target,progress})=>position(target,progress).floor,
    onReady(fn){
      if(atlas.naturalWidth)fn();
      else atlas.addEventListener('load',fn,{once:true});
    },
    portrait(g,w,h){const side=Math.min(w,h);frame(g,8,(w-side)/2,(h-side)/2,side);}
  };
})();
