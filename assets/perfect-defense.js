(() => {
  const clamp = n => Math.max(0, Math.min(1, n));
  const lerp = (a,b,t) => a+(b-a)*t;
  const ease = n => {const t=clamp(n);return t*t*(3-2*t);};
  const scaleFor = target => .60+.30*clamp((target.y-288)/235);
  const sand = ["#ae7440","#c78d4b","#dbab65","#eed098","#b78045","#f1d9a1"];
  const sections = [
    [-228,13],[-214,43],[-190,65],[-155,79],[-115,89],[-76,95],[-35,98],[4,96]
  ];

  function path(ctx,points){
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();
  }
  function polygon(ctx,points,color){
    ctx.fillStyle=color;
    ctx.beginPath();
    path(ctx,points);
    ctx.fill();
  }

  // Bake sixteen rising silhouettes as faceted local-space meshes. The
  // wizard's eye opening is clipped separately to fit each target model.
  const frames=Array.from({length:16},(_,index)=>{
    const height=(index+1)/16;
    const rows=sections.map(([y,radius],j)=>Array.from({length:8},(_,i)=>{
      const angle=Math.PI*i/7;
      const ripple=(i===0||i===7)?0:Math.sin(j*3.4+i*3.8)*4;
      return [-Math.cos(angle)*radius*(.76+.24*height),4+(y-4)*height+ripple];
    }));
    const outline=[...rows.map(row=>row[0]),...rows.at(-1).slice(1),
      ...rows.slice(0,-1).reverse().map(row=>row.at(-1)),...rows[0].slice(1,-1).reverse()];
    const facets=[];
    for(let j=0;j<rows.length-1;j++)for(let i=0;i<7;i++){
      const a=rows[j][i],b=rows[j][i+1],c=rows[j+1][i],d=rows[j+1][i+1];
      const tone=i>4?(j+i)%2:2+(j*3+i)%4;
      facets.push([[a,b,c],sand[tone]],[[b,d,c],sand[(tone+4)%sand.length]]);
    }
    return {outline,facets};
  });

  function shell(ctx,frame,eyeX,eyeY,layer){
    const {outline,facets}=frames[frame];
    if(layer==="back"){
      polygon(ctx,outline,"#66472f");
      return;
    }
    const slit=[
      [eyeX-34,eyeY-6],[eyeX-10,eyeY-12],[eyeX+30,eyeY-11],[eyeX+46,eyeY-4],
      [eyeX+42,eyeY+10],[eyeX-12,eyeY+11],[eyeX-34,eyeY+7]
    ];
    ctx.save();
    ctx.beginPath();
    path(ctx,outline);
    if(frame>=11)path(ctx,slit);
    ctx.clip("evenodd");
    polygon(ctx,outline,"#b9824a");
    for(const [triangle,color] of facets)polygon(ctx,triangle,color);
    if(frame>=11){
      ctx.beginPath();path(ctx,slit);
      ctx.lineWidth=5;ctx.strokeStyle="#785234";ctx.stroke();
    }
    ctx.restore();
  }

  function dome(ctx,target,growth,layer){
    if(growth<=0)return;
    const frame=Math.min(15,Math.floor(growth*16));
    const scale=scaleFor(target),side=target.team?-1:1;
    const isWood=target.dummy&&!target.wizardDummy;
    const sprite=target.hat==="pointed"&&target.robe==="classic";
    ctx.save();
    ctx.translate(target.x,target.y);
    ctx.scale(side*scale,scale);
    shell(ctx,frame,isWood?0:sprite?25:14,isWood?-174:sprite?-123:-140,layer);
    ctx.restore();
  }

  function grain(ctx,x,y,angle,size,color){
    polygon(ctx,[[x-Math.cos(angle)*size*2.1,y-Math.sin(angle)*size*2.1],
      [x+size,y-size*.55],[x+size*.7,y+size],[x-size*.7,y+size*.45]],color);
  }

  function travel(ctx,target,p){
    if(p>=.84)return;
    const scale=scaleFor(target);
    ctx.save();
    for(let i=0;i<88;i++){
      const delay=(i*19%89)/89*.19;
      const life=(p-delay)/.47;
      if(life<0||life>=1.31)continue;
      const t=ease(life),phase=i*2.39996;
      const spread=(12+18*Math.sin(Math.PI*t))*scale;
      const curl=phase+t*12,landing=ease((life-.72)/.52);
      const x=lerp(500,target.x,t)+Math.cos(curl)*spread+Math.cos(phase)*landing*89*scale;
      const y=lerp(510,target.y,t)-Math.sin(t*Math.PI)*(45+i%11*5)+
        Math.sin(curl)*spread*.42-landing*(26+i%9*13)*scale;
      ctx.globalAlpha=clamp(life*8)*clamp((1.30-life)*5)*(.62+i%4*.12);
      grain(ctx,x,y,Math.atan2(target.y-510,target.x-500),1.5+i%5*.9,sand[i%sand.length]);
    }
    ctx.restore();
  }

  function shatter(ctx,target,{age,popped}){
    const t=age/.62;
    if(t>=1)return;
    const scale=scaleFor(target);
    ctx.save();ctx.translate(target.x,target.y);ctx.scale(scale,scale);
    for(let i=0;i<(popped?40:16);i++){
      const angle=i*2.39996;
      const reach=(popped?74:28)*t;
      const x=Math.cos(angle)*(58+reach);
      const y=-112+Math.sin(angle)*(62+reach*.66)+64*t*t;
      ctx.globalAlpha=1-t;
      grain(ctx,x,y,angle+t*5,(popped?4:2)+i%5,sand[i%sand.length]);
    }
    ctx.restore();
  }

  window.PerfectDefense={dome,travel,shatter,portrait(ctx,width,height){
    const scale=Math.min(width/210,height/247);
    ctx.save();ctx.translate(width/2,height*.97);ctx.scale(scale,scale);
    shell(ctx,15,14,-138,"back");
    shell(ctx,15,14,-138,"front");
    ctx.restore();
  }};
})();
