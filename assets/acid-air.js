(()=>{
  const image=new Image(),listeners=[];
  const art=new Image();
  art.onload=()=>listeners.splice(0).forEach(fn=>fn());
  art.src="./assets/acid-air-card.webp";
  image.src='./assets/acid-air-cloud.webp';
  function frame(g,i,size){
    if(image.naturalWidth)g.drawImage(image,(i%4)*192,Math.floor(i/4)*192,192,192,-size/2,-size/2,size,size);
  }
  function draw(g,target,p,time,opacity){
    const scale=.60+.30*Math.min(1,Math.max(0,(target.y-288)/235)),side=target.team?-1:1;
    const grow=Math.min(1,p/.36);
    const wooden=target.dummy&&!target.wizardDummy;
    g.save();g.translate(target.x+16*side*scale,target.y-(wooden?176:107)*scale);
    g.scale(side*scale,scale);g.globalAlpha*=grow*opacity;
    frame(g,Math.floor(time/145+target.index*3)%16,105*(.55+.45*grow));
    g.restore();
  }
  window.AcidAir={draw,onReady:fn=>art.naturalWidth?fn():listeners.push(fn),portrait:(g,w,h)=>{if(art.naturalWidth)g.drawImage(art,0,0,w,h);}};
})();
