(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/snowboard-poses.webp?v=0.211.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,q)=>a+(b-a)*q;
  const smooth=q=>q*q*(3-2*q);
  const release=.635;
  const poses=[0,.09,.155,.23,.29,.35,.405,.46,.505,.55,.60,release,.68,.755,.84,.905];
  const size=174;
  function direction(target){return target.x>=500?1:-1;}
  function localX(target){return direction(target)*(target.x-500);}
  function heightAt(t){return 67*t*t;}
  function position(target,p){
    const dir=direction(target),x=localX(target),floor=target.y+11;
    let along,y;
    if(p<.15){
      along=mix(-605,x-328,p/.15);y=floor;
    }else if(p<.25){
      const q=(p-.15)/.10;
      along=mix(x-328,x-213,q);y=floor-heightAt(q);
    }else if(p<.39){
      const q=(p-.25)/.14;
      along=mix(x-213,x-151,q);y=floor-mix(67,232,1-(1-q)**2);
    }else if(p<.665){
      const q=(p-.39)/.275;
      along=mix(x-151,x-118,q);y=floor-232-9*Math.sin(Math.PI*q);
    }else if(p<.84){
      const q=(p-.665)/.175;
      along=mix(x-118,x+94,q);y=floor-232*(1-q*q);
    }else{
      along=mix(x+94,650,clamp((p-.84)/.16));y=floor;
    }
    return {x:500+dir*along,y,floor};
  }
  function polygon(g,points,fill){
    g.fillStyle=fill;g.beginPath();g.moveTo(...points[0]);
    for(const point of points.slice(1))g.lineTo(...point);
    g.closePath();g.fill();
  }
  function ramp(g,{target,progress:p}){
    const dir=direction(target),floor=target.y+11;
    g.save();g.translate(target.x-dir*328,floor);g.scale(dir,1);
    g.globalAlpha=smooth(clamp(p/.12))*clamp((1-p)/.16);
    for(let i=0;i<7;i++){
      const t=i/7,u=(i+1)/7;
      const a=[t*115,-heightAt(t)],b=[u*115,-heightAt(u)];
      polygon(g,[a,b,[b[0]+25,b[1]+10],[a[0]+25,a[1]+10]],i%2?'#dff6ff':'#aad9f0');
      polygon(g,[[a[0]+25,a[1]+10],[b[0]+25,b[1]+10],[b[0]+25,14],[a[0]+25,14]],i%2?'#5d9abe':'#76acc7');
    }
    polygon(g,[[115,-67],[140,-57],[140,14],[115,4]],'#82bad1');
    g.restore();
  }
  function frame(g,pose,x,y,width){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/4;
    g.drawImage(atlas,pose%4*tile,Math.floor(pose/4)*tile,tile,tile,x,y,width,width);
  }
  function powder(g,x,y,dir,p,strength){
    g.save();
    for(let i=0;i<15;i++){
      const t=(i*.618+p*14)%1;
      const px=x-dir*t*(30+i%4*17),py=y-t*(14+i%4*8);
      const r=3+i%5*2+t*6;
      g.globalAlpha=strength*(1-t)**1.4;
      polygon(g,[[px-r,py],[px-r*.4,py-r*.77],[px+r*.55,py-r],[px+r,py],[px+r*.2,py+r*.52]],
        i%2?'#eafaff':'#a1d5ef');
    }
    g.restore();
  }
  function rider(g,{target,progress:p}){
    const point=position(target,p),dir=direction(target);
    if(p<.25||p>=.84)powder(g,point.x-dir*32,point.y,dir,p,p>=.84?.86:.62);
    const pose=poses.findLastIndex(t=>p>=t);
    g.save();g.translate(point.x,point.y);g.scale(dir,1);
    frame(g,pose,-size/2,-size,size);
    g.restore();
  }
  function orb(g,x,y,r,spin){
    const points=Array.from({length:11},(_,i)=>{
      const a=i*2*Math.PI/11+spin,edge=r*(i%3===0?.94:1);
      return [x+Math.cos(a)*edge,y+Math.sin(a)*edge];
    });
    for(const [i,a] of points.entries()){
      const b=points[(i+1)%points.length],mid=[mix(a[0],x,.48),mix(a[1],y-r*.22,.48)];
      polygon(g,[a,b,mid],['#86bfe2','#b3d9f1','#e0f5ff'][i%3]);
      polygon(g,[mid,b,[x-r*.13,y-r*.31]],['#e2f5ff','#f6fcff','#c9e8f7'][i%3]);
    }
  }
  function snowball(g,{target,progress:p,hit}){
    if(p<release)return;
    const dir=direction(target),ty=target.y-61;
    if(p<hit){
      const start=position(target,release);
      const sx=start.x+dir*39,sy=start.y-67;
      const q=clamp((p-release)/(hit-release)),speed=q*q*.35+q*.65;
      const x=mix(sx,target.x,speed),y=mix(sy,ty,speed);
      g.save();
      for(let i=1;i<=15;i++){
        const delay=i*.017;
        if(speed<delay)continue;
        const trail=speed-delay;
        const px=mix(sx,target.x,trail)+(i%5-2)*delay*65;
        const py=mix(sy,ty,trail)-(i%4)*delay*32;
        const r=3+i%4*2;
        g.globalAlpha=.66*(1-i/17);
        polygon(g,[[px-r,py],[px,py-r],[px+r,py],[px+2,py+r*.66]],'#e4f7ff');
      }
      g.globalAlpha=1;orb(g,x,y,30+q*12,q*4);
      g.restore();
      return;
    }
    const q=clamp((p-hit)/.21);
    if(q>=1)return;
    const spread=1-(1-q)**3;
    g.save();
    for(let i=0;i<29;i++){
      const a=i*2.39996,r=(24+i%8*13)*spread;
      const x=target.x+Math.cos(a)*r,y=ty+Math.sin(a)*r*.73-57*q+63*q*q;
      g.globalAlpha=(1-q)**1.25;
      const size=(5+i%6*2)*(1-q*.56);
      polygon(g,[[x-size,y],[x,y-size],[x+size*1.2,y-1],[x+size*.32,y+size*.68]],
        ['#e5f7ff','#aee0fa','#ffffff'][i%3]);
    }
    g.globalAlpha=(1-q)**1.8;g.strokeStyle='#effbff';g.lineWidth=5*(1-q)+1;
    g.beginPath();g.ellipse(target.x,target.y-2,11+spread*115,5+spread*25,0,0,Math.PI*2);g.stroke();
    g.restore();
  }
  window.TotallyRad={
    ramp,rider,snowball,depth:({target})=>target.y+11,
    onReady(fn){if(atlas.naturalWidth)fn();else listeners.push(fn);},
    portrait(g,w,h){const side=Math.min(w,h);frame(g,10,(w-side)/2,(h-side)/2,side);}
  };
})();
