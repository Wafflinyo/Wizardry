(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/witch-poses.webp?v=0.214.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,q)=>a+(b-a)*q;
  const poses=[0,.075,.15,.22,.29,.34,.40,.46,.50,.54,.58,.635,.70,.776,.845,.92];
  const size=198;
  const palette={
    fire:['#ad260e','#ff6321','#fff0a8'],
    ice:['#266fb0','#71dfff','#f2ffff'],
    poison:['#2d6e29','#a3e34b','#efffa3'],
    lightning:['#a47416','#ffe42a','#fffce3']
  };
  function position(target,p){
    const dir=target.x>=500?1:-1;
    const hover=target.x-dir*clamp(Math.abs(target.x-500)/560)*90-dir*201;
    const enter=clamp(p/.30),exit=clamp((p-.795)/.205);
    const x=p<.30?mix(dir>0?-120:1120,hover,1-(1-enter)**2):mix(hover,dir>0?1130:-130,exit**1.7);
    return {dir,x,y:target.y-107-30*Math.sin(enter*Math.PI*.5)+Math.sin(p*28)*4-30*exit};
  }
  function frame(g,index,x,y,width){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/4;
    g.drawImage(atlas,index%4*tile,Math.floor(index/4)*tile,tile,tile,x,y,width,width);
  }
  function particle(g,x,y,r,a,color){
    g.fillStyle=color;g.beginPath();
    g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);
    g.lineTo(x+Math.cos(a+2.65)*r*.75,y+Math.sin(a+2.65)*r*.75);
    g.lineTo(x+Math.cos(a-2.55)*r*.65,y+Math.sin(a-2.55)*r*.65);
    g.closePath();g.fill();
  }
  function rider(g,{target,progress:p}){
    const {dir,x,y}=position(target,p);
    g.save();g.translate(x,y);g.scale(dir,1);
    if(p<.31||p>.795)for(let i=0;i<10;i++){
      const t=(p*19+i*.618)%1;
      g.globalAlpha=(1-t)*.55;
      particle(g,-57-t*91,-11+Math.sin(i+p*39)*t*18,3+i%3,-.4,'#b17cff');
    }
    g.globalAlpha=1;
    frame(g,poses.findLastIndex(t=>p>=t),-size/2,-size,size);
    g.restore();
  }
  function beam(g,{target,progress:p,hit,element}){
    if(!palette[element]||p<hit-.13||p>=hit+.19)return;
    const [edge,bright,core]=palette[element];
    const {dir,x,y}=position(target,p);
    const sx=x+dir*size*(103/220),sy=y-size*(117/220),tx=target.x,ty=target.y-81;
    const dx=tx-sx,dy=ty-sy,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
    const q=clamp((p-hit+.052)/.052);
    const decay=clamp((p-hit-.028)/.105);
    const opacity=(1-decay)**.65;
    g.save();
    if(p<hit){
      const charge=clamp((p-hit+.13)/.078);
      for(let i=0;i<10;i++){
        const a=i*2.39996+p*48,r=(1-charge)*(12+i%4*5)+4;
        g.globalAlpha=charge;
        particle(g,sx+Math.cos(a)*r,sy+Math.sin(a)*r,4+i%3,a,bright);
      }
    }
    if(q>0&&decay<1){
      for(let strand=0;strand<3;strand++){
        g.globalAlpha=opacity*(strand===0?.87:.80);
        g.strokeStyle=[edge,bright,core][strand];
        g.lineWidth=[19,10,3.3][strand];g.lineJoin='bevel';
        g.beginPath();g.moveTo(sx,sy);
        for(let j=1;j<=21;j++){
          const t=q*j/21;
          const wave=Math.sin(j*1.71+p*(element==="lightning"?242:133)+strand*.5);
          const offset=wave*Math.sin(Math.PI*j/21)*(element==="lightning"?12:7);
          g.lineTo(sx+dx*t+nx*offset,sy+dy*t+ny*offset);
        }
        g.stroke();
      }
      for(let i=0;i<26;i++){
        const t=(i*.618+p*9)%1;
        if(t>q)continue;
        const drift=Math.sin(i*5.13+p*35)*(6+i%6*3)*Math.sin(Math.PI*t);
        g.globalAlpha=opacity*(.42+i%3*.17);
        particle(g,sx+dx*t+nx*drift,sy+dy*t+ny*drift,3+i%5*1.5,p*21+i, i%3?bright:core);
      }
    }
    if(p>=hit){
      const age=clamp((p-hit)/.19);
      const spread=1-(1-age)**3;
      g.globalAlpha=(1-age)**2;
      const light=g.createRadialGradient(tx,ty,0,tx,ty,28+spread*53);
      light.addColorStop(0,core);light.addColorStop(.33,bright+'8a');light.addColorStop(1,bright+'00');
      g.fillStyle=light;g.fillRect(tx-85,ty-85,170,170);
      for(let i=0;i<20;i++){
        const a=i*2.39996,r=(22+i%8*8)*spread;
        particle(g,tx+Math.cos(a)*r,ty+Math.sin(a)*r-23*age, (4+i%4*2)*(1-age*.73),a+age*4,i%2?bright:core);
      }
    }
    g.restore();
  }
  window.WickedWitch={
    rider,beam,depth:({target})=>target.y+.12,
    onReady(fn){if(atlas.naturalWidth)fn();else listeners.push(fn);},
    portrait(g,w,h){const side=Math.min(w,h);frame(g,10,(w-side)/2,(h-side)/2,side);}
  };
})();
