(()=>{
  const atlas=new Image(),ready=[];
  atlas.onload=()=>ready.splice(0).forEach(fn=>fn());
  atlas.src='./assets/meteor-shower.webp?v=0.224.0';

  const clamp=x=>Math.max(0,Math.min(1,x));
  const fallMs=760,impactMs=720;

  function tile(g,index,x,y,size){
    if(!atlas.naturalWidth)return;
    const cell=atlas.naturalWidth/4;
    g.drawImage(atlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,x,y,size,size);
  }

  function polygon(g,points,color){
    g.fillStyle=color;
    g.beginPath();
    g.moveTo(...points[0]);
    for(const point of points.slice(1))g.lineTo(...point);
    g.closePath();g.fill();
  }

  function trail(g,x,y,ux,uy,time,seed,length,width){
    const normalX=-uy,normalY=ux;
    const palette=['#7d231b','#b34323','#ff672d','#ffb749','#fff6b5'];
    const point=(i,edge)=>{
      const f=i/18;
      const pulse=Math.sin(time*.023+f*21+seed)*.26+Math.sin(time*.043+f*40)*.09;
      const sway=(Math.sin(f*8-time*.011+seed)+.55*Math.cos(f*17-time*.021))*13*f;
      const taper=width*(1-f)**.82*(1+pulse);
      const side=sway+edge*taper;
      return [x-ux*f*length+normalX*side,y-uy*f*length+normalY*side];
    };
    for(let i=17;i>=0;i--){
      g.globalAlpha=.92*(1-i/19)**.56;
      const center=point(i,0),next=point(i+1,0);
      for(const side of [-1,1]){
        const edge=point(i,side),outer=point(i+1,side);
        const ridge=point(i,side*.36),ridgeNext=point(i+1,side*.36);
        polygon(g,[edge,ridge,outer],palette[(i+seed+(side>0?1:0))%3]);
        polygon(g,[outer,ridge,ridgeNext],palette[1+(i+seed)%2]);
        polygon(g,[center,ridge,ridgeNext,next],palette[3+(i<5&&i%2===0?1:0)]);
      }
    }
    for(let i=0;i<26;i++){
      const life=(time*.0018+i*.618+seed*.14)%1;
      const side=Math.sin(i*3.9+seed)*(8+life*49);
      const a=x-ux*life*length+normalX*side;
      const b=y-uy*life*length+normalY*side;
      const streak=6+(i%6)*5*(1-life);
      g.globalAlpha=(1-life)*(.55+i%4*.13);
      polygon(g,[[a,b],[a-ux*streak+normalX*2,b-uy*streak+normalY*2],
        [a-ux*(streak+4),b-uy*(streak+4)]],palette[2+i%3]);
    }
    g.globalAlpha=1;
  }

  function falling(g,entry,index,age){
    const q=clamp(1+age/fallMs);
    const progress=q*(.62+.38*q);
    const drift=(entry.x<500?-1:1)*(218+(index%2)*58);
    const height=entry.y+56;
    const x=entry.x-drift*(1-progress);
    const y=entry.y-44-height*(1-progress);
    const distance=Math.hypot(drift,height);
    const size=114+q*34;
    trail(g,x,y,drift/distance,height/distance,age+fallMs,index,155+q*102,16+q*13);
    g.save();
    g.translate(x,y);
    g.scale(Math.sign(drift),1);
    tile(g,Math.min(7,Math.floor(q*8)),-size/2,-size/2,size);
    g.restore();
  }


  function impact(g,entry,index,age){
    const q=clamp(age/impactMs),size=218+53*q;
    const x=entry.x,y=entry.y-9;
    g.globalAlpha=clamp((1-q)*4);
    tile(g,8+Math.min(7,Math.floor(q*8)),x-size/2,y-size*.88,size);
    for(let i=0;i<27;i++){
      const angle=i*2.39996+index*.77;
      const r=(25+i%7*14)*q**.63;
      const px=x+Math.cos(angle)*r;
      const py=y-13+Math.sin(angle)*r*.42-(35+i%5*14)*Math.sin(q*Math.PI);
      const spin=angle+q*8,s=2+(i%5)*1.7;
      g.globalAlpha=(1-q)*(.48+i%4*.15);
      polygon(g,[[px+Math.cos(spin)*s,py+Math.sin(spin)*s],[px-s,py-2],[px+2,py+s]],
        ['#ffd68a','#fb8350','#786252','#c7a079'][i%4]);
    }
  }

  function draw(g,{entry,index,age}){
    if(age< -fallMs||age>=impactMs)return;
    g.save();
    if(age<0)falling(g,entry,index,age);
    else impact(g,entry,index,age);
    g.restore();
  }

  window.MeteorShower={
    draw,onReady(fn){if(atlas.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){
      const s=Math.min(w,h)*.72;
      g.save();
      const x=w*.57,y=h*.66;
      trail(g,x,y,.50,.866,272,1,s*.77,s*.10);
      tile(g,4,x-s/2,y-s/2,s);
      g.restore();
    }
  };
})();
