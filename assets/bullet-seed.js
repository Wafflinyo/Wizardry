(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/bullet-panda.webp?v=0.206.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const poses=[0,.15,.19,.235,.285,.326,.35,.397,.47,.54,.60,.906];
  const poseAnchors=[.49,.48,.35,.31,.34,.43,.49,.39,.33,.46,.49,.49];
  const size=125;
  function sprite(g,i,x,y,w){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/4;
    g.drawImage(atlas,i%4*tile,Math.floor(i/4)*tile,tile,tile,x,y,w,w);
  }
  function reaction(p,at){
    const elapsed=p-at;
    return elapsed<0?0:Math.sin(elapsed*49)*Math.exp(-elapsed*17);
  }
  function bend(p,i){
    const sway=Math.sin(p*17+i)*5;
    if(i===0)return sway+18*reaction(p,.15);
    if(i===1)return sway+44*reaction(p,.35)-32*reaction(p,.397);
    return sway+41*reaction(p,.60);
  }
  const trunks=[[-154,112],[-40,183],[80,144]];
  function stem(g,x,height,b,scale){
    const sections=7;
    const base=510;
    const point=t=>[x+b*t*t,base-height*t];
    for(let j=0;j<sections;j++){
      const t=j/sections,u=(j+1)/sections;
      const [ax,ay]=point(t),[bx,by]=point(u);
      const w=(8-3*t)*scale;
      const end=(8-3*u)*scale;
      for(let side=0;side<2;side++){
        g.fillStyle=side===0?'#65974a':'#a3cb66';
        g.beginPath();
        g.moveTo(ax+(side===0?-w:0),ay);
        g.lineTo(ax+(side===0?0:w),ay);
        g.lineTo(bx+(side===0?0:end),by);
        g.lineTo(bx+(side===0?-end:0),by);
        g.closePath();g.fill();
      }
      g.fillStyle='#426d41';g.fillRect(bx-end-1,by,end*2+2,2.4);
      if(j>1&&j%2===0){
        const dir=j%4===0?1:-1;
        for(let leaf=0;leaf<3;leaf++){
          const length=(23+leaf*6)*scale;
          g.fillStyle=['#477940','#8dbf55','#b9d875'][leaf];
          g.beginPath();g.moveTo(bx,by);
          g.lineTo(bx+dir*length*.57,by-16+leaf*6);
          g.lineTo(bx+dir*length,by-22+leaf*9);
          g.lineTo(bx+dir*length*.56,by+3+leaf*4);
          g.closePath();g.fill();
        }
      }
    }
  }
  function perch(p,i){
    const [x,height]=trunks[i];
    return {x:x+bend(p,i),y:510-height+1};
  }
  function panda(p){
    if(p<.15)return perch(p,0);
    if(p>=.60)return perch(p,2);
    const first=p<.397,start=first?.15:.397,land=first?.35:.60,i=first?0:1;
    const q=clamp((p-start)/(land-start));
    const a=perch(start,i),b=perch(p,i+1);
    return {x:mix(a.x,b.x,q),y:mix(a.y,b.y,q)-Math.sin(Math.PI*q)*(first?88:94)};
  }
  function actor(g,{target,progress:p}){
    const dir=target.x>=500?1:-1;
    const alpha=clamp(p/.10)*clamp((1-p)/.095);
    g.save();g.translate(500,0);g.scale(dir,1);
    g.globalAlpha=alpha*.48;
    for(const [i,[x,height]] of trunks.entries())stem(g,x-20,height*.72,bend(p,i)*.60,.64);
    g.globalAlpha=alpha;
    for(const [i,[x,height]] of trunks.entries())stem(g,x,height,bend(p,i),1);
    const {x,y}=panda(p),pose=poses.findLastIndex(t=>p>=t);
    sprite(g,pose,x-size/2,y-size*(.50+poseAnchors[pose]),size);
    g.restore();
  }
  function chip(g,x,y,angle,r,fill){
    g.save();g.translate(x,y);g.rotate(angle);
    g.fillStyle=fill;g.beginPath();
    g.moveTo(r,0);g.lineTo(-r*.5,-r*.43);g.lineTo(-r,0);g.lineTo(-r*.45,r*.43);
    g.closePath();g.fill();g.restore();
  }
  function volley(g,{target,progress:p,releases,hits,seed}){
    const dir=target.x>=500?1:-1;
    const tx=target.x,ty=target.y-72;
    for(const [i,start] of releases.entries()){
      if(p<start||p>=hits[i]+.084)continue;
      const origin=panda(start),sx=500+dir*(origin.x+49),sy=origin.y-39;
      const angle=Math.atan2(ty-sy,tx-sx);
      g.save();
      if(p<hits[i]){
        const q=clamp((p-start)/(hits[i]-start));
        const x=mix(sx,tx,q),y=mix(sy,ty,q);
        g.strokeStyle='#c7fa83';g.lineWidth=3;g.globalAlpha=.64;
        g.beginPath();g.moveTo(x,y);g.lineTo(mix(sx,tx,Math.max(0,q-.24)),mix(sy,ty,Math.max(0,q-.24)));g.stroke();
        g.globalAlpha=1;
        chip(g,x,y,angle,10,'#93cd4d');chip(g,x+Math.cos(angle)*2,y+Math.sin(angle)*2,angle,5,'#e4ff9c');
      }else{
        const age=clamp((p-hits[i])/.084);
        g.globalAlpha=1-age;
        for(let j=0;j<7;j++){
          const a=j*2.39996+i*.94,r=(9+j*3)*Math.sqrt(age);
          chip(g,tx+Math.cos(a)*r,ty+Math.sin(a)*r,a,3+j%3,'#ddff91');
        }
        if(seed&&i===releases.length-1){
          chip(g,tx+12*(1-age),ty-16*(1-age),-.85,13,'#a8ff65');
          chip(g,tx+12*(1-age),ty-16*(1-age),-.85,6,'#f2ffd6');
        }
      }
      g.restore();
    }
  }
  window.BulletSeed={
    actor,volley,
    onReady(fn){if(atlas.naturalWidth)fn();else listeners.push(fn);},
    portrait(g,w,h){
      const side=Math.min(w,h),scale=side/170;
      g.save();g.translate(w/2-side*.43,h/2-side*.47);g.scale(scale,scale);
      g.translate(0,-355);
      stem(g,34,153,12,.75);
      sprite(g,10,22,19+355,142);
      g.restore();
    }
  };
})();
