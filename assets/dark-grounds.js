(()=>{
  const art=new Image();
  art.src="./assets/dark-grounds-frames.webp?v=0.291.0";
  const LOOP=[4,5,6,7,6,5];

  function fog(g,frame,x,y,width,height){
    if(!art.complete||!art.naturalWidth)return;
    g.drawImage(art,frame%4*288,Math.floor(frame/4)*224,288,224,x,y,width,height);
  }

  function draw(g,{width,height,time,strength=1}){
    g.save();
    g.globalAlpha*=strength;
    const shade=g.createLinearGradient(0,0,0,height);
    shade.addColorStop(0,"#100820d6");
    shade.addColorStop(.45,"#241036a8");
    shade.addColorStop(1,"#2c104bb8");
    g.fillStyle=shade;
    g.fillRect(0,0,width,height);
    const beat=Math.floor(time/150);
    for(let row=0;row<3;row++){
      const frame=strength<1?Math.min(3,Math.floor(strength*4)):LOOP[(beat+row*2)%LOOP.length];
      const drift=Math.sin(time*.00075+row*1.8)*width*.06;
      g.save();
      g.globalAlpha*=.52+row*.15;
      fog(g,frame,-width*.32+drift,height*(.07+row*.20),width*1.2,height*.56);
      fog(g,frame,width*.35-drift,height*(.10+row*.20),width*.94,height*.51);
      g.restore();
    }
    g.restore();
  }

  window.DarkGrounds={draw,portrait(g,width,height){draw(g,{width,height,time:610});}};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
