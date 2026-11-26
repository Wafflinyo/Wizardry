(() => {
  "use strict";
  const clamp=t=>Math.max(0,Math.min(1,t));
  // Coordinates follow the ground plane, with the apex toward the opposing team.
  const slabs=[
    {a:[39,-61],b:[69,-38],h:94,delay:.34},
    {a:[66,-40],b:[96,-16],h:119,delay:.17},
    {a:[93,-19],b:[111,0],h:139,delay:0},
    {a:[111,0],b:[92,21],h:135,delay:.05},
    {a:[95,18],b:[67,42],h:114,delay:.23},
    {a:[70,39],b:[39,66],h:94,delay:.40}
  ];
  const tones=["#483638","#74534a","#a0775c","#e0b582","#b68a66"];
  function poly(g,color,points){
    g.beginPath();
    points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();
    g.fillStyle=color;
    g.fill();
  }
  // Extrude each panel perpendicular to its own ground edge, retaining the
  // original six centerlines, heights, delays and front/back layering.
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
  const noise=n=>{const f=Math.sin(n*127.1+311.7)*43758.5453;return f-Math.floor(f);};
  const palette={
    inner:["#88766a","#a18c77","#98816c","#b09a83"],
    outer:["#77675b","#94806d","#897461","#a38a71"],
    end:["#5b4e47","#6d5c50","#786354","#89735f"],
    cap:["#b4a08a","#c5ae92","#a9957e","#d2ba9c"]
  };
  function face(g,quad,rows,seed,kind){
    const [tl,tr,br,bl]=quad;
    const P=(u,v)=>mix(mix(tl,tr,u),mix(bl,br,u),v);
    const colors=palette[kind];
    poly(g,kind==="cap"?"#8c7967":"#4f443e",quad);
    for(let row=0;row<rows;row++){
      const v0=row/rows,v1=(row+1)/rows;
      const split=.38+noise(seed+row*13)*.24;
      const cuts=(kind==="end"||kind==="cap"||row%3===1)?[0,1]:[0,split,1];
      for(let k=0;k<cuts.length-1;k++){
        const n=seed*73+row*19+k*7,r=noise(n);
        const u0=cuts[k]+.018,u1=cuts[k+1]-.018;
        const t=v0+.012,b=v1-.012,w=u1-u0,h=b-t;
        const p=(u,v)=>P(u0+w*u,t+h*v);
        const a=p(.12,.02),c=p(.87,.04+noise(n+1)*.06),
              d=p(.99,.19),e=p(.96,.79),f=p(.79,.97),
              m=p(.13,.94),l=p(.01,.76),z=p(.02,.19);
        poly(g,colors[Math.floor(r*colors.length)],[a,c,d,e,f,m,l,z]);
        const A=p(.18,.18),B=p(.81,.19),D=p(.83,.72),E=p(.2,.76);
        const hi=kind==="end"?"#aa937b":kind==="cap"?"#e3cdb0":"#c5ac8d";
        const shade=kind==="end"?"#4b403a":kind==="cap"?"#8b7562":"#66564b";
        poly(g,hi,[a,c,d,B,A,z]);
        poly(g,shade,[d,e,f,m,E,D,B]);
        poly(g,colors[Math.floor(noise(n+3)*colors.length)],[A,B,D,E]);
        if(r>.36)poly(g,kind==="end"?"#605249":"#8b7563",[A,p(.49,.23),p(.6,.51),E]);
        if(r>.71)poly(g,shade,[p(.69,.28),p(.77,.35),p(.72,.58),p(.65,.46)]);
      }
    }
  }
  function slab(g,{a,b,h,delay},growth,impact){
    const lift=clamp((growth-delay)/.55);
    if(!lift)return;
    const height=h*(1-(1-lift)**3);
    const dx=b[0]-a[0],dy=(b[1]-a[1])/.62,length=Math.hypot(dx,dy)||1;
    const d=[dy/length*28,-dx/length*28*.62];
    const A=a,B=b,C=add(b,d),D=add(a,d);
    const ta=[A[0]-3,A[1]-height*.94],tb=[B[0]-3,B[1]-height],tc=add(tb,d),td=add(ta,d);
    const near=dx<0,seed=Math.round(a[0]*3+a[1]*7);
    const rows=Math.max(3,Math.round(h/27));
    // Near walls expose the outer broad face, far walls the inner broad face.
    // Unlike the previous uniform skew, neither branch collapses into a plane.
    const broad=near?[tc,td,D,C]:[ta,tb,B,A];
    face(g,broad,rows,seed,near?"outer":"inner");
    face(g,[tb,tc,C,B],rows,seed+19,"end");
    face(g,[ta,tb,tc,td],2,seed+37,"cap");
    const edge=near?[tc,td]:[ta,tb];
    poly(g,"#d2bb9e",[edge[0],edge[1],add(edge[1],[0,3]),add(edge[0],[0,3])]);
    poly(g,"#59493f",[B,C,add(C,[0,-4]),add(B,[0,-4])]);
    if(impact){
      const stress=clamp((impact.age-delay*.09)/.12)*(impact.broken?1:impact.stress);
      const [p,q,r,s]=broad,P=(u,v)=>mix(mix(p,q,u),mix(s,r,u),v);
      fissure(g,[P(.69,0),P(.47,.26),P(.65,.45),P(.39,.68),P(.53,.94)],stress);
    }
    // Rising dust is drawn separately so it does not inherit wall geometry.
  }
  function riseFx(g,target,p,layer="front",factor=1){
    if(p<0||p>=1.30)return;
    const front=layer==="front",dir=target.team?-1:1;
    g.save();g.translate(target.x,target.y+3);g.scale(dir*factor,factor);
    for(const [idx,{a,b,delay}] of slabs.entries()){
      const age=p-delay;
      if(age<0||age>=.85)continue;
      const fade=1-clamp((age-.42)/.43);
      const mid=mix(a,b,.5);
      // Ground fractures open just where this segment rises.
      if(!front){
        const spread=clamp(age/.18);
        for(let k=0;k<3;k++){
          const theta=(k-1)*.9+(idx<3?-1:1)*.6,len=(24+k*10)*spread;
          const x=mid[0]+Math.cos(theta)*len,y=mid[1]+Math.sin(theta)*len*.52;
          poly(g,"#514038",[[mid[0],mid[1]],[x-4,y+2],[x+3,y-3]]);
        }
      }
      // Continuous clouds roll out from the base as the stone pushes up.
      for(let k=0;k<12;k++){
        const birth=(k%4)*.075,life=(age-birth)/.55;
        if(life<0||life>=1||((k%2===0)!==front))continue;
        const n=idx*71+k*13,side=k%3===0?-1:1;
        const x=mid[0]+side*(8+life*(29+noise(n)*44));
        const y=mid[1]-Math.sin(life*Math.PI)*(12+noise(n+1)*24)+(front?10:-8);
        const r=(15+noise(n+2)*17)*(1+life*.65);
        const glow=g.createRadialGradient(0,0,0,0,0,r);
        glow.addColorStop(0,"rgba(177,145,111,.83)");
        glow.addColorStop(.48,"rgba(157,128,99,.51)");
        glow.addColorStop(1,"rgba(157,128,99,0)");
        g.save();g.translate(x,y);g.scale(1.25,.68);g.globalAlpha*=fade*Math.sin(life*Math.PI)*.78;
        g.fillStyle=glow;g.beginPath();g.ellipse(0,0,r,r,0,0,Math.PI*2);g.fill();g.restore();
      }
      // Solid stone chips shoot outward and upward, then fall to the floor.
      for(let k=0;k<9;k++){
        const life=(age-(k%3)*.055)/.48;
        if(life<0||life>=1||((k%2===0)!==front))continue;
        const n=idx*131+k*17,side=k%2?1:-1;
        const x=mid[0]+side*(9+life*(27+noise(n)*55));
        const y=mid[1]-4*life*(1-life)*(35+noise(n+1)*65)+(front?8:-5);
        const r=3+noise(n+2)*6;
        g.save();g.translate(x,y);g.rotate(n+life*7);g.globalAlpha*=fade*(1-clamp((life-.8)/.2));
        poly(g,"#806b59",[[-r,0],[-r*.3,-r],[r,-r*.2],[r*.3,r*.7]]);
        poly(g,"#c5a789",[[-r,0],[-r*.3,-r],[r,-r*.2]]);g.restore();
      }
    }
    g.restore();
  }
  function shake(p){
    if(p<0||p>=1.18)return {x:0,y:0};
    const envelope=clamp(p/.045)*(1-clamp((p-.94)/.24));
    let kicks=0;
    for(const {delay} of slabs){const d=p-delay;if(d>=0&&d<.17)kicks+=Math.sin(d*55)*Math.exp(-d*20);}
    return {x:envelope*(Math.sin(p*111)*3.5+Math.sin(p*53)*2.5),y:envelope*(Math.cos(p*139)*4.5+kicks*3.8)};
  }
  function fissure(g,points,progress){
    const extent=clamp(progress)*(points.length-1);
    g.beginPath();
    g.moveTo(...points[0]);
    for(let i=0;i<points.length-1&&i<extent;i++){
      const [x,y]=points[i],[nextX,nextY]=points[i+1],t=clamp(extent-i);
      g.lineTo(x+(nextX-x)*t,y+(nextY-y)*t);
    }
    g.strokeStyle="#37282b";
    g.lineWidth=5;
    g.stroke();
    g.strokeStyle="#ffdb9c";
    g.lineWidth=1.6;
    g.stroke();
  }
  function dust(g,t){
    if(t<=0||t>=1)return;
    g.save();
    g.globalAlpha*=.44*(1-t);
    for(let i=0;i<13;i++){
      const x=(i-6)*(8+t*7),y=-t*(13+i%4*9);
      const size=5+i%3*3+t*7;
      poly(g,tones[i%tones.length],[[x-size,y],[x+2,y-size],[x+size,y-size*.6],[x+size*1.2,y+3]]);
    }
    g.restore();
  }
  function debris(g,x,y,dir,impact){
    const travel=clamp((impact.age-.17)/.49);
    if(travel<=0||travel>=1)return;
    g.save();
    g.globalAlpha*=1-clamp((travel-.76)/.24);
    for(let i=0;i<24;i++){
      const drift=(i%7-3)*7;
      const progress=clamp(travel*(.74+i%5*.07));
      const a=x+dir*drift+(impact.attacker.x-x)*progress;
      const b=y-70+(impact.attacker.y-y+70)*progress-Math.sin(Math.PI*progress)*(28+i%5*11)+drift*.65;
      const size=3+i%5*2;
      g.save();g.translate(a,b);g.rotate(i+travel*(4+i%4));
      poly(g,tones[(i+1)%tones.length],[[-size,-size*.4],[0,-size],[size,0],[size*.36,size*.8]]);
      poly(g,tones[3],[[-size,-size*.4],[0,-size],[size,0],[0,0]]);
      g.restore();
    }
    g.restore();
  }
  function wall(g,growth,impact,layer="all"){
    const age=impact?.age??0;
    if(!impact?.broken||age<.17){
      if(layer!=="front"){
        g.save();
        g.globalAlpha*=clamp(growth*4)*.46;
        poly(g,"#241d25",[[29,-58],[110,-8],[130,2],[48,74],[25,74],[98,1],[22,-59]]);
        g.restore();
      }
      slabs.forEach((piece,index)=>{if(layer==="all"||(layer==="back"?index<3:index>=3))slab(g,piece,growth,impact);});
    }else if(layer!=="back"){
      g.save();
      g.translate(84,0);
      dust(g,clamp((age-.17)/.61));
      g.restore();
    }
  }
  function draw(g,target,growth,impact,layer="all",factor=1){
    const dir=target.team?-1:1;
    g.save();
    g.translate(target.x,target.y+3);g.scale(dir*factor,factor);
    wall(g,growth,impact,layer);
    g.restore();
    if(impact?.broken&&layer!=="back")debris(g,target.x+dir*91*factor,target.y+3,dir,impact);
  }
  function portrait(g,w,h){
    const bg=g.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,"#342b30");bg.addColorStop(.57,"#7d6654");bg.addColorStop(1,"#514137");
    g.fillStyle=bg;g.fillRect(0,0,w,h);
    // Show the same six masonry panels in the same V formation as combat.
    // Frame the complete wall, not unrelated background spikes.
    const scale=Math.min(w/132,h/230);
    g.save();g.translate(w*.5-87*scale,h*.5+38*scale);g.scale(scale,scale);
    g.globalAlpha=.42;poly(g,"#2e2523",[[12,-48],[93,-14],[141,7],[53,84],[10,81],[79,0]]);g.globalAlpha=1;
    wall(g,1,null,"all");
    g.restore();
  }
  window.FaultlineBulwark={draw,portrait,riseFx,shake};
})();
