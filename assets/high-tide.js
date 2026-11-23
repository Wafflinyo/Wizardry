(() => {
  "use strict";

  const clamp = t => Math.min(1,Math.max(0,t));
  const smooth = t => { t=clamp(t); return t*t*(3-2*t); };
  const sea = ["#0b607c","#0c7b91","#18a1ad","#25b4b8","#318fa2","#0b506c"];
  const foam = ["#e0fcf1","#a6eee9","#70d8db"];

  function poly(ctx, points, color) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for(const point of points.slice(1))ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle=color;
    ctx.fill();
  }

  function volume(ctx,width,height,frame,level) {
    const rows=7,columns=12,unit=width/columns;
    const point=(x,y)=>{
      const depth=y/rows;
      const jitter=Math.sin(x*1.91+y*2.1+frame*.29);
      return [(x+(y%2?.5:0))*unit+jitter*unit*.27,
        level+(height-level)*depth+jitter*(3+depth*12)];
    };
    for(let y=0;y<rows;y++)for(let x=-1;x<=columns;x++){
      const a=point(x,y),b=point(x+1,y),c=point(x,y+1),d=point(x+1,y+1);
      const base=((x+2)*13+y*7+Math.floor(frame/4))%sea.length;
      poly(ctx,[a,b,c],sea[base]);
      poly(ctx,[b,d,c],sea[(base+2)%sea.length]);
    }
  }

  function breakers(ctx,width,height,frame,level,p) {
    for(let row=0;row<5;row++){
      const depth=(row+1)/6;
      const x=((frame*(14+row*1.25)+row*239)%(width+270))-135;
      const y=level+(height-level)*depth;
      const span=width*(.22+depth*.19), lift=12+depth*32;
      const crest=Array.from({length:9},(_,i)=>{
        const wave=Math.sin(i*.83+frame*.28+row*2.3);
        return [x+i*span/8,y+wave*lift*.46-Math.sin(i*Math.PI/8)*lift];
      });
      for(let i=0;i<8;i++){
        const a=crest[i],b=crest[i+1];
        const rise=4+Math.sin(i*1.19+frame*.48+row)*8;
        poly(ctx,[a,b,[b[0]+12,b[1]+lift*.68],[a[0]-10,a[1]+lift*.88]],i%2?"#10788f":"#239eaa");
        poly(ctx,[a,[a[0]+5,a[1]-rise],b,[b[0]-6,b[1]+lift*.24],[a[0]+9,a[1]+lift*.15]],foam[(i+row)%3]);
        if((frame+i+row)%3===0){
          const sx=a[0]+13,sy=a[1]-rise-5-8*Math.sin(p*Math.PI);
          poly(ctx,[[sx-3,sy+2],[sx+2,sy-6],[sx+7,sy]],foam[i%3]);
        }
      }
    }
  }

  function draw(ctx,{width,height,progress:p,dir=1,layer="back",floor=height*.48}) {
    const frame=Math.floor(p*80);
    const rise=smooth((p-.02)/.41);
    const drain=smooth((p-.63)/.36);
    const strength=rise*(1-drain);
    if(strength<=0)return;

    const level=height-(height-floor)*strength;
    const lead=smooth((p-.015)/.43);
    const edge=-30+(width+60)*lead;
    ctx.save();
    if(dir<0){ctx.translate(width,0);ctx.scale(-1,1);}
    ctx.beginPath();
    ctx.moveTo(-30,level-12);
    ctx.lineTo(edge-width*.12,level-10);
    ctx.lineTo(edge+9,height+12);
    ctx.lineTo(-30,height+12);
    ctx.closePath();
    ctx.clip();

    if(layer==="back"){
      ctx.globalAlpha *= (.55+.25*strength)*(1-drain);
      volume(ctx,width,height,frame,level);
      breakers(ctx,width,height,frame,level,p);
    }else{
      // The low foreground wash overlaps boots without hiding the wizards.
      ctx.globalAlpha *= .42*(1-drain);
      const front=level+(height-level)*.37;
      volume(ctx,width,height,frame+3,front);
      breakers(ctx,width,height,frame+3,front,p);
    }
    ctx.restore();
  }

  function portrait(ctx,width,height){
    draw(ctx,{width,height,progress:.49,floor:height*.12});
    draw(ctx,{width,height,progress:.49,floor:height*.12,layer:"front"});
  }

  window.HighTide={draw,portrait};
})();
