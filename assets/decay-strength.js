(()=>{
  const art=new Image(),listeners=[];
  art.onload=()=>listeners.splice(0).forEach(fn=>fn());art.src='./assets/decay-strength.webp';
  function crest(g,i,x,y,w,h){if(art.naturalWidth)g.drawImage(art,i*256,0,256,320,x-w/2,y-h/2,w,h);}
  window.DecayStrength={onReady:fn=>art.naturalWidth?fn():listeners.push(fn),
    portrait:(g,w,h)=>crest(g,2,w/2,h/2,h*.82,h),
    draw(g,t,p){const scale=.6+.3*Math.max(0,Math.min(1,(t.y-288)/235));
      g.save();g.globalAlpha*=Math.min(1,p/.16,(1-p)/.15);
      const h=scale*(96+35*Math.sin(Math.PI*p));
      crest(g,Math.min(3,Math.floor(p*4)),t.x,t.y-90*scale,h*.82,h);g.restore();}
  };
})();
