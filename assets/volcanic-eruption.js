(()=>{
  const atlas=new Image();
  atlas.src="./assets/volcanic-eruption.webp";
  const clamp=x=>Math.max(0,Math.min(1,x));
  const flight=860;
  const flightProgress=age=>clamp(1+age/flight);
  const vent={x:500,y:391};
  function tile(g,frame,x,y,size){
    if(!atlas.naturalWidth)return;
    const cell=atlas.naturalWidth/4;
    g.drawImage(atlas,frame%4*cell,Math.floor(frame/4)*cell,cell,cell,x-size/2,y-size,size,size);
  }
  function cone(g,time,duration){
    const fade=clamp((duration-time)/420);
    const rise=clamp(time/950);
    const tremor=rise*(time<2060?3.2:1.4);
    const x=500+Math.sin(time*.054)*tremor;
    const frame=time<1000?Math.min(3,Math.floor(time/250)):
      time<2060?4+Math.min(3,Math.floor((time-1000)/265)):
      time<duration-540?8+Math.floor((time-2060)/115)%4:
      12+Math.min(3,Math.floor((time-duration+540)/135));
    g.save();
    g.globalAlpha*=clamp(time/110)*fade;
    g.beginPath();g.rect(335,180,330,333);g.clip();
    tile(g,frame,x,513+32*(1-rise)+45*(1-fade),282);
    g.restore();
  }
  function face(g,points,color){
    g.fillStyle=color;g.beginPath();g.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)g.lineTo(...points[i]);
    g.closePath();g.fill();
  }
  // Each frame changes the skin of the molten bomb, opening seams between plates of crust.
  const bombs=[];
  function molten(g,x,y,r,phase){
    const frame=Math.floor(phase*16)%16;
    if(!bombs[frame]){
      const canvas=document.createElement("canvas");canvas.width=canvas.height=80;
      const c=canvas.getContext("2d"),t=frame*Math.PI/8,points=[];
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6,rad=30+4*Math.sin(3*a+t)+2*Math.sin(5*a-t);
        points.push([40+rad*Math.cos(a),40+rad*.87*Math.sin(a)]);
      }
      face(c,points,"#ff801c");
      const core=[36+4*Math.sin(t),34+3*Math.cos(t)];
      for(let i=0;i<12;i++){
        const a=points[i],b=points[(i+1)%12];
        const tip=[core[0]+(a[0]-core[0])*.29,core[1]+(b[1]-core[1])*.30];
        face(c,[a,b,tip],["#ffbe36","#ffdf60","#e65314","#9b321d","#682823","#ff9b22"][i%6]);
        if(i%3!==1)face(c,[a,[(a[0]+b[0])/2,(a[1]+b[1])/2],[(a[0]+tip[0])/2,(a[1]+tip[1])/2]],"#632826");
      }
      bombs[frame]=canvas;
    }
    g.drawImage(bombs[frame],x-r,y-r,r*2,r*2);
  }
  function blob(g,entry,index,age){
    if(age < -flight||age>=620)return;
    const side=entry.x<500?-1:1;
    const endX=entry.x+(entry.lands?0:-side*82),endY=entry.y-(entry.lands?69:2);
    const arch=124+index%3*16;
    function point(q){
      return [vent.x+(endX-vent.x)*q,vent.y+(endY-vent.y)*q-4*arch*q*(1-q)];
    }
    g.save();
    if(age<0){
      const q=flightProgress(age);
      for(let i=7;i>=0;i--){
        if(q<i*.021)continue;
        const [x,y]=point(q-i*.021);
        molten(g,x,y+Math.sin(q*18+i)*i*.65,24-i*2.6,q*2+index+i*.31);
      }
    }else{
      const q=age/620;
      g.globalAlpha*=1-q*q;
      for(let i=0;i<17;i++){
        const a=i*2.39996+index,spread=34+i%6*10;
        const x=endX+Math.cos(a)*q*spread;
        const y=endY+Math.sin(a)*q*spread*.42-(28+i%5*12)*Math.sin(Math.PI*q)+38*q*q;
        molten(g,x,y,(6+i%5*2)*(1-q*.7),q+i*.13);
      }
    }
    g.restore();
  }
  window.VolcanicEruption={cone,blob,flightProgress,portrait(g,w,h){tile(g,10,w/2,h,Math.min(w,h));},
    onReady(fn){if(atlas.naturalWidth)fn();else atlas.addEventListener("load",fn,{once:true});}};
})();
