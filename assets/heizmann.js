(()=>{
  const image=new Image(),ready=[];
  image.onload=()=>ready.splice(0).forEach(fn=>fn());
  image.src='./assets/heizmann.webp?v=158';
  const clamp=x=>Math.max(0,Math.min(1,x)),tau=Math.PI*2;
  const times=[0,.136,.195,.24,.31,.50,.555,.602,.642,.659,.69,.85];
  // Register each stance to the planted boot pair, including the low follow-through.
  const anchors=[180,540-362,899-724,1260-1086,180,552-362,905-724,1220-1086,134,501-362,860-724,1225-1086];
  function sprite(g,n,x,y,size,dir,height=size){
    if(!image.naturalWidth)return;
    g.save();g.translate(x,y);g.scale(dir,1);
    g.drawImage(image,n%4*256,Math.floor(n/4)*256,256,256,-anchors[n]/362*size,-(n<4?352:n<8?350:328)/362*height,size,height);
    g.restore();
  }
  function line(g,points,color,width){
    g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.stroke();
  }
  function shards(g,x,y,t,count,spread){
    if(t<=0||t>=1)return;
    g.save();g.globalAlpha*=1-t;
    for(let i=0;i<count;i++){
      const a=i*2.4,r=spread*(.45+.55*((i*17)%23)/23);
      const px=x+Math.cos(a)*r*t,py=y+Math.sin(a)*r*t*.65-r*t*(1-t),w=2+i%4;
      g.fillStyle=i%3?'#bef5ff':'#4fbbe8';g.beginPath();g.moveTo(px,py-w*2);g.lineTo(px+w,py);g.lineTo(px-2,py+w);g.fill();
    }g.restore();
  }
  function breath(g,x,y,t,d){
    if(t<=0||t>=1)return;
    for(let i=0;i<7;i++){
      const u=clamp(t*1.5-i*.082);if(!u||u===1)continue;
      const px=x+d*(4+48*u),py=y-13*u+Math.sin(i*2+u*5)*4*u,r=3+12*u;
      const cloud=g.createRadialGradient(px,py,0,px,py,r);
      cloud.addColorStop(0,'rgba(229,253,255,'+(.57*(1-u))+')');cloud.addColorStop(1,'rgba(175,229,255,0)');
      g.fillStyle=cloud;g.fillRect(px-r,py-r,r*2,r*2);
    }
  }
  function draw(g,p,target,layer){
    const d=target.x>=500?1:-1,step=clamp((p-.625)/.04),x=500+24*d*step,y=510;
    g.save();
    if(layer==='floor'&&p>=.136){
      g.globalAlpha=clamp((1-p)/.14);
      const grow=clamp((p-.136)/.055);
      for(let i=0;i<11;i++){
        const a=i*tau/11,r=(29+i%4*9)*grow;
        line(g,[[500,y],[500+Math.cos(a+.14)*r*.55,y+Math.sin(a+.14)*r*.21],[500+Math.cos(a)*r,y+Math.sin(a)*r*.37]],'#b8eeff',2);
      }
      const advance=clamp((p-.642)/(.748-.642));
      for(let i=0;i<18*advance;i++){
        const point=j=>[x+(target.x-x)*j/18,y+(target.y-y)*j/18+Math.sin(j*4.4)*4*Math.sin(Math.PI*j/18)];
        const a=point(i),b=point(Math.min(i+1,18*advance));
        line(g,[a,b],'#274f71',6);line(g,[a,b],'#defaff',2);
        if(i%3===1){
          const side=i%2?1:-1, extension=clamp(advance*18-i);
          const fork=[a[0]+d*9*extension,a[1]+side*8*extension];
          const tip=[fork[0]+d*14*extension,fork[1]+side*5*extension];
          line(g,[a,fork,tip],'#223e58',4);line(g,[a,fork,tip],'#a7eaff',1.4);
          line(g,[fork,[fork[0]-d*4*extension,fork[1]+side*7*extension]],'#d8ffff',1);
        }
      }
    }else if(layer==='actor'){
      const n=times.filter(t=>p>=t).length-1,drop=clamp(p/.136);
      const lift=320*(1-drop*drop),cycle=(p-.24)/.13;
      const breathing=p>.24&&p<.50?Math.sin(cycle*tau)*1.6:0;
      g.globalAlpha=clamp((1-p)/.12);
      sprite(g,n,x,y-lift,196,d,196+breathing);
      for(const start of [.275,.405])breath(g,x+5*d,y-112-breathing,(p-start)/.12,d);
      shards(g,500,y,(p-.136)/.14,26,80);
      shards(g,x+20*d,y,(p-.642)/.12,20,75);
      shards(g,x,y-76,(p-.86)/.14,38,100);
    }else if(layer==='slash'){
      if(p>=.659&&p<.748){
        const u=(p-.659)/(.748-.659),px=x+(target.x-x)*u+d*Math.min(100,Math.abs(target.x-x)*.55)*(1-u),py=y-87+(target.y-88-(y-87))*u;
        g.translate(px,py);g.scale(d,1);g.rotate(-.24);
        const ice=g.createLinearGradient(-30,0,30,0);
        ice.addColorStop(0,'rgba(88,175,239,.16)');ice.addColorStop(.55,'#63baef');ice.addColorStop(.84,'#bdffff');ice.addColorStop(1,'#ffffff');
        for(let j=0;j<9;j++){
          const h=(j-4)*11,edge=20-h*h/75;
          line(g,[[edge-7,h],[edge-22-j%3*8,h+3]],'rgba(174,241,255,.68)',1+j%2);
        }
        g.beginPath();g.moveTo(-18,-58);g.quadraticCurveTo(67,0,-22,58);g.quadraticCurveTo(30,0,-18,-58);g.fillStyle=ice;g.fill();g.strokeStyle='#efffff';g.lineWidth=2;g.stroke();
      }else shards(g,target.x,target.y-88,(p-.748)/.14,44,107);
    }g.restore();
  }
  window.Heizmann={draw,onReady:fn=>image.naturalWidth?fn():ready.push(fn),portrait:(g,w,h)=>sprite(g,9,w*.38,h*.97,Math.min(w,h*1.32),1)};
})();
