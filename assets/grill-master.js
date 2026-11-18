/* A cast-iron creature with a hinged jaw, furnace cheeks and four ember vents. */
(function(root){
  'use strict';
  const CENTER_X=500,FLOOR_Y=510,SCALE=.83,RELEASE=.53,HIT=.60,LID_SWING=1.04;
  const clamp=p=>Math.max(0,Math.min(1,p));
  const ease=p=>{p=clamp(p);return p*p*(3-2*p);};
  const lerp=(a,b,p)=>a+(b-a)*p;

  function pose(progress,target){
    const dir=target.x>=CENTER_X?1:-1;
    const heat=ease((progress-.12)/.41);
    const planted=ease(progress/.17),close=ease((progress-.75)/.15);
    const jaw=ease((progress-.49)/.055)*(1-close);
    const recoil=Math.sin(Math.PI*clamp((progress-.51)/.24))*jaw;
    const shake=progress<RELEASE?Math.sin(progress*156)*heat*3:0;
    const x=CENTER_X+dir*(shake-recoil*13),y=FLOOR_Y-95*(1-planted)**2;
    const muzzle={x:x+dir*62*SCALE,y:y-95*SCALE};
    return {dir,x,y,heat,jaw,muzzle,alpha:planted*(1-ease((progress-.90)/.10))};
  }

  function flamePath(progress,target,body=pose(progress,target)){
    const reach=ease((progress-RELEASE)/(HIT-RELEASE))*(1-ease((progress-.69)/.095));
    const end={x:target.x,y:target.y-79};
    return {origin:body.muzzle,end,reach};
  }

  function poly(c,fill,points){
    c.fillStyle=fill;c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.closePath();c.fill();
  }
  function glow(c,x,y,r,color){
    const light=c.createRadialGradient(x,y,0,x,y,r);
    light.addColorStop(0,color);light.addColorStop(1,'#ff5b1500');
    c.fillStyle=light;c.fillRect(x-r,y-r,r*2,r*2);
  }
  function leg(c,x,back){
    c.save();c.translate(x,0);
    poly(c,back?'#212127':'#353037',[[-15,-55],[12,-52],[16,-24],[10,-10],[-16,-10],[-22,-23]]);
    poly(c,'#66626b',[[-15,-55],[-7,-49],[-12,-22],[-22,-23]]);
    poly(c,back?'#303035':'#453b3d',[[-16,-17],[13,-17],[25,-8],[24,0],[-20,0],[-23,-7]]);
    poly(c,'#8b7771',[[4,-9],[12,-10],[17,-7],[13,-2],[5,-2]]);
    c.restore();
  }
  function body(c,{heat,jaw}){
    const iron='#30272d',edge='#8b6555',hot=heat>.59?'#ff791c':'#ce4117';
    leg(c,29,true);leg(c,-43,false);
    // The hinged lid is the creature's upper jaw. Its claws brace the sides.
    poly(c,'#211b22',[[-62,-91],[-86,-77],[-78,-49],[-55,-47],[-48,-62],[-63,-67]]);
    poly(c,'#56464b',[[-62,-91],[-86,-77],[-81,-68],[-55,-78]]);
    poly(c,'#191822',[[25,-86],[43,-107],[62,-101],[78,-79],[65,-67],[50,-78]]);
    poly(c,'#776064',[[43,-107],[62,-101],[78,-79],[63,-83]]);
    poly(c,iron,[[-65,-94],[32,-96],[67,-75],[61,-52],[29,-31],[-39,-34],[-65,-53],[-76,-78]]);
    poly(c,'#59454a',[[-65,-94],[-39,-81],[-34,-40],[-58,-52],[-76,-78]]);
    poly(c,'#6c4942',[[-34,-80],[62,-79],[61,-68],[37,-55],[-32,-59]]);
    poly(c,'#21171b',[[-47,-84],[49,-94],[68,-81],[43,-73],[-34,-74]]);
    c.save();c.globalAlpha=.22+heat*.78;
    glow(c,42,-83,31,'#ff6429a3');
    poly(c,hot,[[-25,-84],[-14,-85],[-8,-76],[-18,-75]]);
    poly(c,hot,[[0,-85],[11,-86],[17,-77],[7,-76]]);
    poly(c,hot,[[25,-87],[34,-88],[41,-78],[32,-77]]);
    poly(c,'#ffd780',[[46,-89],[55,-88],[63,-83],[51,-80]]);
    c.restore();
    // Faceted chimney and lid, rotated around the back hinge.
    c.save();c.translate(-56,-92);c.rotate(-jaw*LID_SWING);
    poly(c,'#2e272f',[[-8,-8],[1,-34],[22,-51],[75,-57],[107,-42],[123,-19],[119,0],[39,8],[5,3]]);
    poly(c,'#73636a',[[1,-34],[22,-51],[75,-57],[107,-42],[60,-34],[24,-26]]);
    poly(c,'#4f434b',[[24,-26],[60,-34],[107,-42],[123,-19],[65,-14],[34,-11]]);
    poly(c,'#775147',[[5,3],[39,8],[119,0],[121,-6],[41,0],[4,-5]]);
    poly(c,'#2b272b',[[14,-40],[13,-66],[27,-71],[36,-64],[33,-47]]);
    poly(c,'#716369',[[11,-67],[28,-73],[39,-66],[23,-60]]);
    poly(c,'#1c1820',[[53,-26],[73,-26],[71,-13],[59,-9]]);
    poly(c,'#1c1820',[[86,-31],[108,-37],[103,-20],[91,-15]]);
    c.save();c.globalAlpha=.78+heat*.22;
    poly(c,hot,[[56,-23],[70,-23],[67,-15],[60,-13]]);
    poly(c,'#ffb954',[[90,-28],[104,-33],[100,-23],[93,-19]]);
    c.restore();
    poly(c,edge,[[70,-10],[84,-16],[104,-15],[108,-9],[91,-9],[78,-5]]);
    c.restore();
    poly(c,'#695659',[[-51,-69],[-43,-63],[-28,-63],[-17,-54],[-22,-45],[-43,-48],[-57,-58]]);
    poly(c,'#aa8877',[[-41,-61],[-30,-61],[-23,-56],[-25,-51],[-38,-52]]);
    if(jaw>.08){
      c.save();c.globalAlpha=jaw;
      glow(c,47,-91,43,'#ff7919e0');
      poly(c,'#ffae32',[[17,-84],[30,-95],[55,-103],[72,-95],[58,-84]]);
      poly(c,'#fff6aa',[[35,-88],[51,-98],[66,-95],[53,-87]]);
      c.restore();
    }
  }

  function smoke(c,b,p,scale=SCALE){
    if(p<.10)return;
    const heat=b.heat*(1-ease((p-.70)/.25)),angle=-b.jaw*LID_SWING;
    const sourceX=b.x+b.dir*(-56+24*Math.cos(angle)+67*Math.sin(angle))*scale;
    const sourceY=b.y+(-92+24*Math.sin(angle)-67*Math.cos(angle))*scale;
    for(let i=0;i<17;i++){
      const age=(p*4.7+i*.37)%1;
      const x=sourceX-b.dir*age*38+Math.sin(i*19+age*4)*age*37;
      const y=sourceY-age*(49+heat*65);
      const r=8+age*24+heat*7;
      c.save();c.globalAlpha=b.alpha*heat*Math.sin(age*Math.PI)*.40;
      poly(c,i%3===0?'#dccbb6':i%3===1?'#77707a':'#43404b',[[x-r,y],[x-r*.5,y-r*.65],[x+r*.25,y-r*.8],[x+r,y-r*.2],[x+r*.64,y+r*.50],[x-r*.4,y+r*.65]]);
      c.restore();
    }
  }

  function flame(c,p,b,target){
    const {origin,end,reach}=flamePath(p,target,b);
    if(reach<=0)return;
    const angle=Math.atan2(end.y-origin.y,end.x-origin.x),length=Math.hypot(end.x-origin.x,end.y-origin.y);
    c.save();c.translate(origin.x,origin.y);c.rotate(angle);
    const size=Math.min(length,length*reach);
    for(let row=0;row<3;row++){
      const outline=[],spread=[42,24,11][row];
      for(let i=0;i<=13;i++){
        const q=i/13,width=(4+Math.sin(q*2.2)*spread)*(1-q**7);
        outline.push([q*size,-width*(.86+.27*Math.sin(i*4.1+p*186+row))]);
      }
      for(let i=13;i>=0;i--){
        const q=i/13,width=(4+Math.sin(q*2.2)*spread)*(1-q**7);
        outline.push([q*size,width*(.85+.25*Math.sin(i*5.5-p*161+row))]);
      }
      c.globalAlpha=[.73,.93,1][row];
      poly(c,['#e64314','#ff891c','#fff5aa'][row],outline);
    }
    for(let i=0;i<19;i++){
      const q=(p*18+i*.31)%1,x=q*size,y=Math.sin(i*9+q*3)*q*46;
      c.globalAlpha=(1-q)*.85;
      poly(c,i%2?'#ffbb44':'#ff6025',[[x-6,y+1],[x+6,y-2],[x+3,y+3]]);
    }
    c.restore();
  }

  function draw(c,{progress:p,target,layer}){
    if(!target)return;
    const b=pose(p,target);
    if(layer==='stream'){flame(c,p,b,target);return;}
    if(layer==='impact'){
      const age=(p-HIT)/.21;
      if(age<0||age>=1)return;
      const {end}=flamePath(p,target,b);
      c.save();c.globalAlpha=(1-age)**2;
      glow(c,end.x,end.y,23+age*87,'#ff8d30e0');
      for(let i=0;i<16;i++){
        const angle=i*2.4,x=end.x+Math.cos(angle)*age*(48+i%5*12),y=end.y+Math.sin(angle)*age*48-age*26;
        poly(c,i%2?'#ff9329':'#ffd16c',[[x-5,y+4],[x+2,y-7],[x+4,y+3]]);
      }
      c.restore();return;
    }
    if(layer==='ground'){
      c.save();c.globalAlpha*=b.alpha*.45;c.fillStyle='#221722';
      c.beginPath();c.ellipse(b.x,FLOOR_Y,66,15,0,0,Math.PI*2);c.fill();c.restore();return;
    }
    smoke(c,b,p);
    c.save();c.globalAlpha*=b.alpha;c.translate(b.x,b.y);c.scale(b.dir*SCALE,SCALE);
    body(c,b);c.restore();
  }
  function depthFor({target},layer){
    if(layer==='ground')return FLOOR_Y-.2;
    if(layer==='actor')return FLOOR_Y;
    return target.y+(layer==='impact'?.2:.1);
  }
  function portrait(c,w,h){
    const scale=Math.min(w/211,h/185);
    c.save();c.translate(w*.52,h*.93);c.scale(scale,scale);
    glow(c,0,-76,100,'#ff6b1970');
    smoke(c,{x:0,y:0,dir:1,heat:1,jaw:.26,alpha:1},.43,1);
    body(c,{heat:1,jaw:.26});c.restore();
  }
  root.WIZARDRY_GRILL_MASTER={draw,portrait,pose,flamePath,depthFor,HIT};
})(window);
