(()=>{
  const atlas=new Image(),ready=[];
  atlas.onload=()=>ready.splice(0).forEach(fn=>fn());
  atlas.src='./assets/meteor-shower.webp?v=0.224.0';

  const clamp=x=>Math.max(0,Math.min(1,x));
  const fallMs=760,impactMs=720;
  const flybys=[
    {start:30, duration:790, x:390, y:-45, dx:735, dy:360, size:46},
    {start:180,duration:970, x:-90, y:-75, dx:1130,dy:590, size:81},
    {start:380,duration:920, x:630, y:-90, dx:800, dy:440, size:34},
    {start:510,duration:980, x:185, y:-105,dx:970, dy:530, size:61},
    {start:780,duration:900, x:610, y:-82, dx:690, dy:360, size:53},
    {start:950,duration:840, x:-50, y:-45, dx:1130,dy:540, size:73}
  ];
  const groundStrikes=[
    {at:835,x:468,y:346,scale:.60},
    {at:1080,x:528,y:557,scale:.79},
    {at:1375,x:407,y:450,scale:.52}
  ];

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

  function trail(g,x,y,ux,uy,time,seed,length,width,opacity=1){
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
      g.globalAlpha=opacity*.92*(1-i/19)**.56;
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
      g.globalAlpha=opacity*(1-life)*(.55+i%4*.13);
      polygon(g,[[a,b],[a-ux*streak+normalX*2,b-uy*streak+normalY*2],
        [a-ux*(streak+4),b-uy*(streak+4)]],palette[2+i%3]);
    }
    g.globalAlpha=opacity;
  }

  function falling(g,entry,index,age,scale=1){
    const q=clamp(1+age/fallMs);
    const progress=q*(.62+.38*q);
    const height=entry.y+56;
    const dir=entry.dir??(entry.x<500?-1:1);
    const drift=dir*height*(1.24+index%3*.10);
    const x=entry.x-drift*(1-progress);
    const y=entry.y-44-height*(1-progress);
    const distance=Math.hypot(drift,height);
    const size=(114+q*34)*scale;
    trail(g,x,y,drift/distance,height/distance,age+fallMs,index,(155+q*102)*scale,(16+q*13)*scale);
    g.save();
    g.translate(x,y);
    g.scale(Math.sign(drift),1);
    tile(g,Math.min(7,Math.floor(q*8)),-size/2,-size/2,size);
    g.restore();
  }


  function impact(g,entry,index,age,scale=1,opacity=1){
    const q=clamp(age/impactMs),size=(218+53*q)*scale;
    const x=entry.x,y=entry.y-9;
    g.globalAlpha=opacity*clamp((1-q)*4);
    tile(g,8+Math.min(7,Math.floor(q*8)),x-size/2,y-size*.88,size);
    for(let i=0;i<27;i++){
      const angle=i*2.39996+index*.77;
      const r=(25+i%7*14)*q**.63*scale;
      const px=x+Math.cos(angle)*r;
      const py=y-13+Math.sin(angle)*r*.42-(35+i%5*14)*Math.sin(q*Math.PI)*scale;
      const spin=angle+q*8,s=(2+(i%5)*1.7)*scale;
      g.globalAlpha=opacity*(1-q)*(.48+i%4*.15);
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

  function drawShower(g,{elapsed,duration,dir}){
    const fade=clamp((duration-elapsed)/180);
    g.save();
    for(const [i,pass] of flybys.entries()){
      const q=(elapsed-pass.start)/pass.duration;
      if(q<0||q>=1)continue;
      const x=500+dir*(pass.x+pass.dx*q-500),y=pass.y+pass.dy*q;
      const distance=Math.hypot(pass.dx,pass.dy);
      const opacity=fade*clamp(q*11)*clamp((1-q)*8)*.63;
      trail(g,x,y,dir*pass.dx/distance,pass.dy/distance,elapsed-pass.start,i+4,pass.size*2.45,pass.size*.19,opacity);
      g.save();
      g.translate(x,y);g.scale(dir,1);
      tile(g,Math.floor(q*8),-pass.size/2,-pass.size/2,pass.size);
      g.restore();
    }
    for(const [i,strike] of groundStrikes.entries()){
      const age=elapsed-strike.at;
      if(age< -fallMs||age>=impactMs)continue;
      const entry={x:500+dir*(strike.x-500),y:strike.y,dir};
      if(age<0)falling(g,entry,i+10,age,strike.scale);
      else impact(g,entry,i+10,age,strike.scale,fade);
    }
    g.restore();
  }

  window.MeteorShower={
    draw,drawShower,onReady(fn){if(atlas.naturalWidth)fn();else ready.push(fn);},
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
