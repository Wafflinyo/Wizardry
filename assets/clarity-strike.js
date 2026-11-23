(() => {
  "use strict";

  const rim = [[-101,2],[-90,-21],[-59,-32],[-42,-57],[-12,-68],[23,-59],
    [46,-38],[74,-40],[94,-25],[105,-4],[87,13],[49,22],[-2,25],[-58,22],[-87,14]];
  const surface = [[-50,-8],[-18,-36],[24,-22],[59,-7],[3,10]];
  const faces = [
    [0,1,2,15],[2,3,4,16,15],[4,5,6,17,16],[6,7,8,18,17],[8,9,10,18],
    [15,16,17,19],[17,18,11,19],[10,11,18],[11,12,19],[12,13,15,19],[13,14,0,15]
  ];
  const shade = ["#42516f","#697a9b","#8297bc","#5a6a92","#465475","#53698d",
    "#3b486b","#343c61","#242c4b","#343d60","#39465f"];
  const boltOffsets = [-6,22,-19,15,-13,7,0];
  const clamp = p => Math.min(1,Math.max(0,p));

  function polygon(ctx, points, color) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle=color;
    ctx.fill();
  }

  function cloud(ctx,x,y,frame,scale,charge,alpha) {
    const points = [...rim,...surface].map(([px,py],i)=>[
      px+Math.sin(frame*.48+i*.8)*4, py+Math.cos(frame*.36+i)*3
    ]);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    faces.forEach((face,i)=>polygon(ctx,face.map(point=>points[point]),shade[i]));
    if (charge>0) {
      ctx.globalAlpha *= charge;
      polygon(ctx,[[-55,-4],[-18,-29],[-25,-6],[5,-21],[37,-13],[4,-9],[12,1],[-23,7],[-12,-8]],"#ffe1a4");
      polygon(ctx,[[23,3],[47,-15],[42,-4],[67,-7],[55,7]],"#d2c7ff");
    }
    ctx.restore();
  }

  function draw(ctx,target,rune,progress,hit) {
    const frame=Math.min(35,Math.floor(progress*36));
    const grow=clamp(progress/.25);
    const fade=clamp((1-progress)/.28);
    const x=target.x+Math.sin(frame*.25)*4;
    const y=target.y-190+(1-grow)*18;
    const charge=progress<hit?clamp((progress-.19)/.28)*(.52+.48*Math.sin(frame*2)**2):
      clamp(1-(progress-hit)*7);
    cloud(ctx,x,y,frame,.30+.54*grow,charge,fade*clamp(progress/.09));
    const release=progress-hit;
    if(release<-.032||release>.24)return;
    const endX=rune?.x??target.x,endY=rune?.y??target.y-70;
    const bolt=boltOffsets.map((offset,i)=>{
      const t=i/(boltOffsets.length-1);
      return [x+(endX-x)*t+offset*(i%2&&frame%2?-.75:1),y+10+(endY-y-10)*t];
    });
    bolt[bolt.length-1]=[endX,endY];
    const width=8*clamp(1-release/.24);
    ctx.save();
    ctx.globalAlpha *= clamp(1-release/.25);
    polygon(ctx,[...bolt.map(([px,py],i)=>[px+width*(1-i/bolt.length),py]),...bolt.slice().reverse().map(([px,py],i)=>[px-width*(i+1)/bolt.length,py])],"#a398fa");
    polygon(ctx,[...bolt,...bolt.slice().reverse().map(([px,py],i)=>[px-width*.65*(i+1)/bolt.length,py])],"#fff4ca");
    ctx.restore();
  }

  function portrait(ctx,width,height) {
    const ground = {x:width/2,y:height*.37+190};
    draw(ctx,ground,{x:width*.57,y:height*.91},.56,.54);
  }

  window.ClarityStrike={draw,portrait};
})();
