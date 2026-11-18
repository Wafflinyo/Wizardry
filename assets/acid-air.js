(()=>{
  const image=new Image(),listeners=[];
  image.onload=()=>listeners.splice(0).forEach(fn=>fn());
  image.src='./assets/acid-air.webp';
  function frame(g,i,w,h){
    if(image.naturalWidth)g.drawImage(image,i*256,0,256,256,-w/2,-h/2,w,h);
  }
  function draw(g,target,p){
    const scale=.60+.30*Math.min(1,Math.max(0,(target.y-288)/235)),side=target.team?-1:1;
    g.save();g.translate(target.x+16*side*scale,target.y-(target.dummy&&!target.wizardDummy?176:155)*scale);
    g.scale(side*scale,scale);g.rotate(-.18+.25*Math.sin(p*7));
    const size=70+92*Math.min(1,p/.45)+25*p;
    g.globalAlpha=Math.min(1,p/.12,(1-p)/.21);
    frame(g,p<.18?0:p<.38?1:p<.79?2:3,size,size*.68);
    for(let i=0;i<15;i++){
      const a=p*9+i*2.4;g.fillStyle=i%3?'#a9c749':'#dafa72';g.beginPath();
      g.arc(Math.cos(a)*size*.44,Math.sin(a)*size*.27,1+i%3,0,Math.PI*2);g.fill();
    }
    g.restore();
  }
  window.AcidAir={draw,onReady:fn=>image.naturalWidth?fn():listeners.push(fn),portrait:(g,w,h)=>{g.save();g.translate(w/2,h/2);frame(g,2,w*.92,h*.94);g.restore();}};
})();
