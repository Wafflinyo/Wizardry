(()=>{
  const atlas=new Image(),ready=[];
  atlas.onload=()=>ready.splice(0).forEach(fn=>fn());
  atlas.src='./assets/raging-waters.webp?v=0.222.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const thresholds=[0,.06,.12,.19,.26,.32,.39,.47,.53,.60,.65,.70,.77,.84,.90,.95];

  function tile(g,index,x,y,width){
    if(!atlas.naturalWidth)return;
    const cell=atlas.naturalWidth/4;
    g.drawImage(atlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,x,y,width,width);
  }

  function draw(g,{progress:p,target}){
    const index=thresholds.findLastIndex(t=>p>=t);
    const rise=clamp(p/.19);
    const size=252*(.42+.58*rise);
    // The puddle is centered on the feet, then the growing crest pivots to its base.
    const anchor=.833+(.947-.833)*rise;
    g.save();
    g.globalAlpha=Math.min(clamp(p/.08),clamp((1-p)/.10));
    tile(g,index,target.x-size/2,target.y-size*anchor,size);
    if(p>=.47){
      const q=clamp((p-.47)/.48);
      const y=target.y-82-32*Math.sin(q*Math.PI);
      for(let i=0;i<22;i++){
        const angle=i*2.39996+q*3;
        const radius=(31+i%7*12)*Math.sqrt(q+.04);
        const x=target.x+Math.cos(angle)*radius;
        const py=y+Math.sin(angle)*radius*.48+q*q*(38+i%4*9);
        const d=2+i%4*1.4;
        g.globalAlpha=(1-q)*(.40+i%4*.15)*clamp((p-.47)*20);
        g.fillStyle=['#f3ffff','#91f2ff','#3dbee9','#2378bb'][i%4];
        g.beginPath();
        g.moveTo(x,py-d);g.lineTo(x+d,py+1);g.lineTo(x-d*.75,py+d);g.closePath();g.fill();
      }
    }
    g.restore();
  }

  window.RagingWaters={
    draw,onReady(fn){if(atlas.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){const side=Math.min(w,h);tile(g,7,(w-side)/2,(h-side)/2,side);}
  };
})();
