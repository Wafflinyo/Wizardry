(() => {
  "use strict";

  const clamp = p => Math.max(0, Math.min(1, p));
  const smooth = p => { const t = clamp(p); return t * t * (3 - 2 * t); };
  const steel = ["#e0b9f7","#9570b6","#563d76","#312343","#22172f","#3d2a54","#77568f","#bd92d9"];
  const rim = [[-16,-5],[-10,-11],[8,-11],[16,-5],[16,5],[9,11],[-9,11],[-16,5]];
  const hole = [[-9,-3],[-5,-6],[5,-6],[9,-3],[9,3],[5,6],[-5,6],[-9,3]];
  const facets = ["#271634","#69448e","#ac73db","#edc9ff"];

  function shape(ctx, points, color, outline) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function chainLink(ctx, x, y, angle, scale, narrow, charge) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.scale(scale,scale*(narrow ? .44 : 1));
    const lower = rim.map(([x,y])=>[x+2,y+3]);
    for (let i=0;i<rim.length;i++) {
      const j=(i+1)%rim.length;
      shape(ctx,[rim[i],rim[j],lower[j],lower[i]],"#1d1328","#160f21");
      shape(ctx,[rim[i],rim[j],hole[j],hole[i]],steel[i],"#35224b");
    }
    if (charge>.03) {
      ctx.globalAlpha *= charge;
      shape(ctx,[[-10,-11],[8,-11],[5,-8],[-6,-8]],"#f0cbff");
    }
    ctx.restore();
  }

  function crystal(ctx,x,y,size,charge) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(size,size);
    shape(ctx,[[0,-19],[14,-8],[11,11],[0,19],[-11,11],[-14,-8]],facets[1],"#251630");
    shape(ctx,[[0,-19],[14,-8],[0,0],[-14,-8]],facets[2]);
    shape(ctx,[[0,0],[11,11],[0,19],[-11,11]],facets[0]);
    shape(ctx,[[0,-11],[6,-5],[4,6],[0,10],[-4,6],[-6,-5]],facets[3]);
    if(charge>.03){
      ctx.globalAlpha *= charge;
      shape(ctx,[[0,-19],[14,-8],[0,0],[-14,-8]],"#fff0ff");
    }
    ctx.restore();
  }

  function shards(ctx,x,y,age,count,radius) {
    ctx.save();
    ctx.translate(x,y);
    ctx.globalAlpha *= (1-age)**1.4;
    for (let i=0;i<count;i++) {
      const a=i*2.39996,dx=Math.cos(a),dy=Math.sin(a);
      const spread=radius*(.22+age*(.62+(i%4)*.23));
      const px=dx*spread,py=dy*spread*.67-13*age;
      shape(ctx,[[px-dy*3,py+dx*3],[px+dx*(7+i%4*3),py+dy*(7+i%4*3)],[px+dy*2,py-dx*2]],facets[1+i%3]);
    }
    ctx.restore();
  }

  function seal(ctx,unit,amount,charge) {
    const n=12;
    ctx.save();
    ctx.translate(unit.x,unit.y+2);
    ctx.globalAlpha *= amount;
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;
      const point=(t,r)=>[Math.cos(t)*r,Math.sin(t)*r*.27];
      shape(ctx,[point(a,72),point(b,72),point(b,57),point(a,57)],facets[1+i%2]);
      if(i%2===0)shape(ctx,[point(a+.1,53),point(a+.2,42),point(a+.33,53)],facets[3]);
    }
    ctx.restore();
    if(charge>0)shards(ctx,unit.x,unit.y-5,1-charge,16,77);
  }

  // The two bands tighten around the body and stop moving once the clasps snap shut.
  function bind(ctx, unit, progress, time, front) {
    const casting=progress!==null;
    const frame=casting?Math.min(35,Math.floor(clamp(progress)*36)):35;
    const p=frame/35;
    const tension=smooth((p-.13)/.53);
    const visible=smooth((p-.04)/.38);
    const pulse=casting?clamp(1-Math.abs(p-.66)*8):.15+.12*Math.cos(time*2.8);
    const scale=.80+clamp((unit.y-390)/205)*.16;
    if(!front)seal(ctx,unit,(casting?.82:.23)*visible,casting?pulse:0);
    ctx.save();
    ctx.globalAlpha *= casting ? visible : .72;
    for(let band=0;band<2;band++){
      const count=16;
      const width=(54+(1-tension)*45+(band?3:0))*scale;
      for(let i=0;i<count;i++){
        const angle=i*2*Math.PI/count+(1-tension)*(band?-3.2:3.2);
        const z=Math.sin(angle);
        if((z>=0)!==front||i>=Math.ceil(visible*count))continue;
        const x=unit.x+Math.cos(angle)*width;
        const y=unit.y+(-89+band*44+z*18+Math.cos(angle)*(band?10:-10))*scale;
        const heading=Math.atan2((18*Math.cos(angle)+(band?-10:10)*Math.sin(angle))*scale,-Math.sin(angle)*width);
        chainLink(ctx,x,y,heading,.88*scale,i%2===1,pulse);
      }
      if(front&&tension>.72)crystal(ctx,unit.x,unit.y+(-71+band*44)*scale,.71*scale,pulse);
    }
    ctx.restore();
  }

  function rebound(ctx, from, to, age) {
    if(age>=.85)return;
    const frame=Math.floor(age*32),p=frame/32;
    const reach=smooth((p+.035)/.20);
    const fade=clamp((.85-p)/.55);
    const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy)||1;
    const count=Math.max(7,Math.ceil(distance/16));
    ctx.save();
    ctx.globalAlpha *= fade;
    for(let i=0;i<=Math.floor(count*reach);i++){
      const t=i/count;
      const wave=Math.sin(t*Math.PI)*(Math.sin(t*11-frame*.43)*23-56*(1-reach));
      const x=from.x+dx*t-dy/distance*wave,y=from.y+dy*t+dx/distance*wave;
      chainLink(ctx,x,y,Math.atan2(dy,dx)+Math.cos(t*11-frame*.43)*.32,.79,i%2===1,fade*.65);
    }
    const tip={x:from.x+dx*reach,y:from.y+dy*reach};
    if(reach<1)crystal(ctx,tip.x,tip.y,.70,fade);
    if(p<.25)shards(ctx,from.x,from.y,clamp(p/.25),12,43);
    if(reach===1)shards(ctx,to.x,to.y,clamp((p-.18)/.64),19,73);
    ctx.restore();
  }

  const cardArt=new Image(),listeners=[];
  const ready=()=>cardArt.complete&&cardArt.naturalWidth>0;
  cardArt.onload=()=>listeners.splice(0).forEach(fn=>fn());
  cardArt.src="./assets/cursed-hold-card.webp?v=0.304.0";

  function portrait(ctx,width,height) {
    if(!ready())return;
    const size=Math.max(width,height);
    ctx.drawImage(cardArt,(width-size)/2,(height-size)*.39,size,size);
  }

  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.CursedHold={bind,rebound,portrait,onReady};
})();
