/* Wizardry v0.47.0 — low-poly colosseum, original 3/4 side camera.
   Static 1000×620 canvas painter; not a screenshot of other wizards.
   The live units, targets, spells and HUD remain drawn by arena.js. */
(function(root) {
"use strict";
const W=1000,H=620,TAU=Math.PI*2;
const hash=n=>{const v=Math.sin(n*127.1+17.87)*43758.5453;return v-Math.floor(v)};
function poly(c,pts,fill,stroke="",sw=1) {
  c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
  for(let k=1;k<pts.length;k++)c.lineTo(pts[k][0],pts[k][1]);
  c.closePath();if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke();}
}
function line(c,pts,col,w=1) {
  c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
  for(let k=1;k<pts.length;k++)c.lineTo(pts[k][0],pts[k][1]);
  c.strokeStyle=col;c.lineWidth=w;c.stroke();
}
function oval(c,x,y,rx,ry,fill="",stroke="",sw=1){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);
  if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke();}
}
function diamond(c,x,y,r,col="#4beded"){
  poly(c,[[x,y-r*1.3],[x+r*.69,y],[x,y+r*1.28],
    [x-r*.70,y]],col,"#bcfff2",1.5);
  poly(c,[[x,y-r*1.3],[x,y+r*1.28],[x-r*.70,y]],"#207d99");
  poly(c,[[x,y-r*1.3],[x+r*.69,y],[x,y+r*1.28]],"#7cedeb");
  poly(c,[[x,y-r*1.3],[x+r*.69,y],[x,y-r*.18]],"#d0fff5");
}
function crystal(c,x,y,s,color="#42deda"){
  const base=y,top=y-s;
  c.save();
  c.shadowBlur=s*.28;c.shadowColor=color;
  poly(c,[[x-s*.33,base],[x-s*.49,y-s*.50],
    [x-s*.12,top],[x+s*.18,top+s*.13],[x+s*.39,y-s*.39],
    [x+s*.28,base]],color,"#84f7f0",1.5);
  c.shadowBlur=0;
  poly(c,[[x-s*.33,base],[x-s*.49,y-s*.50],[x-s*.12,top],
    [x+s*.02,y-s*.37],[x,base]],"#218ea1");
  poly(c,[[x-s*.12,top],[x+s*.18,top+s*.13],[x+s*.02,y-s*.37]],"#d7ffef");
  poly(c,[[x+s*.02,y-s*.37],[x+s*.18,top+s*.13],
    [x+s*.39,y-s*.39],[x+s*.28,base],[x,base]],"#75e5e4");
  c.restore();
}
function fireBowl(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);
  const halo=c.createRadialGradient(0,-18,1,0,-18,45);
  halo.addColorStop(0,"#ffd48c66");halo.addColorStop(.45,"#eb943d2c");
  halo.addColorStop(1,"#eb943d00");
  c.fillStyle=halo;c.fillRect(-50,-65,100,90);
  poly(c,[[-25,8],[-15,23],[18,23],[27,6]],"#4f536b");
  poly(c,[[-25,6],[0,12],[27,6],[0,0]],"#bd9567","#e7b77d",1.4);
  poly(c,[[-20,8],[20,8],[13,13],[-13,13]],"#e2ae57");
  poly(c,[[-5,5],[-17,-12],[-7,-23],[-5,-39],[2,-25],
    [11,-30],[13,-13],[5,8]],"#ffb14a");
  poly(c,[[-2,3],[-8,-11],[-2,-19],[5,-13],[7,-3],[3,6]],"#fff1aa");
  c.restore();
}
function banner(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);
  line(c,[[-25,-3],[25,-3]],"#c79b56",5);
  poly(c,[[-18,0],[17,0],[15,77],[0,91],[-16,73]],"#3b305a","#caa766",2);
  poly(c,[[-14,5],[13,5],[10,68],[0,79],[-12,65]],"#554077");
  diamond(c,0,38,11,"#e0b769");
  poly(c,[[0,20],[7,36],[0,50],[-7,36]],"#d2a45f");
  c.restore();
}
function col(c,x,base,scale=1){
  c.save();c.translate(x,base);c.scale(scale,scale);
  poly(c,[[-29,0],[-26,-203],[25,-203],[29,0]],
    "#475872","#172c42",2);
  poly(c,[[-29,0],[-26,-203],[-6,-203],[-8,0]],"#687a8f");
  poly(c,[[25,-203],[29,0],[8,0],[9,-203]],"#293d55");
  poly(c,[[-35,-204],[35,-204],[30,-223],[-30,-223]],"#8290a2","#2e4356",2);
  poly(c,[[-37,-224],[0,-232],[37,-224],[30,-211],[-31,-211]],"#6c7996");
  poly(c,[[-34,2],[34,2],[38,13],[-39,13]],"#4d617a","#1e3245",2);
  poly(c,[[-35,2],[-5,-6],[34,2],[13,13],[-20,13]],"#8594a2");
  poly(c,[[-26,-190],[-26,-184],[23,-184],[23,-190]],"#d1a66b");
  c.restore();
}
function drawHall(c){
  const sky=c.createLinearGradient(0,0,0,380);
  sky.addColorStop(0,"#081626");sky.addColorStop(.47,"#12344b");
  sky.addColorStop(1,"#0c283c");
  c.fillStyle=sky;c.fillRect(0,0,W,H);
  // Faceted, shadowed masonry high above the archways.
  for(let i=0;i<26;i++){
    const x=i*56-22,top=25+hash(i+4)*43;
    poly(c,[[x,top],[x+71,top-20],[x+67,170],[x+4,181]],
      i%3===0?"#1b3b50":i%3===1?"#153246":"#214052");
  }
  // Layered mountain silhouette behind the colosseum.
  for(let i=0;i<15;i++){
    const x=i*88-65,top=90+hash(i*8+2)*70;
    poly(c,[[x-52,270],[x+20,top],[x+118,273]],
      i%2?"#18354b":"#214458");
    poly(c,[[x+20,top],[x+118,273],[x+34,260]],"#112b3f");
  }
  // The faceted arcade, stonework and long upper parapet.
  for(let i=0;i<6;i++){
    const x=10+i*185;
    poly(c,[[x,290],[x+6,183],[x+93,95],[x+172,186],[x+179,292]],
      "#273b54");
    poly(c,[[x+23,290],[x+34,188],[x+93,128],[x+153,187],[x+157,290]],
      "#071c2e");
    poly(c,[[x+24,287],[x+35,184],[x+93,124],[x+153,185],[x+158,287]],
      "", "#486179",4);
    poly(c,[[x+16,193],[x+40,153],[x+91,107],[x+138,155],[x+161,194]],
      "", "#9a866b",2);
    if(i===1||i===4)banner(c,x+94,150,.7);
  }
  // High parapet is built from irregular non-rounded stone slabs.
  poly(c,[[0,86],[108,67],[195,78],[328,55],[451,74],[560,62],
    [693,80],[825,61],[930,77],[1000,69],[1000,109],[0,111]],
    "#63748b","#253f55",3);
  poly(c,[[0,97],[163,103],[316,92],[488,105],[663,97],
    [829,102],[1000,91],[1000,117],[0,117]],"#344d63");
  for(let i=0;i<17;i++){
    const x=i*65-18;
    poly(c,[[x,91],[x+18,80],[x+51,88],[x+48,116],[x+4,118]],
      i%3===0?"#72839a":i%3===1?"#556c83":"#677993",
      "#243a51",.9);
  }
  for(let i=0;i<7;i++){
    const x=18+i*163;
    col(c,x,292,.83);
  }
  // Portal-shaped center keystone and hanging element crystal.
  poly(c,[[446,117],[462,91],[500,62],[542,91],[557,117],
    [545,170],[500,202],[454,170]],"#3a4e69","#caac70",3);
  poly(c,[[472,116],[500,84],[528,116],[527,163],[500,187],[472,163]],
    "#172d45","#a58c6e",2);
  crystal(c,500,167,49,"#65f2e1");
  // Side crystals and flat-shaded torch pedestals.
  for(const [x,y,s] of [[84,298,52],[921,305,56],[167,286,35],
      [833,292,35],[302,301,36],[694,303,34]])
    crystal(c,x,y,s,x%2?"#55dfda":"#72e8f1");
  for(const [x,y] of [[58,296],[946,301]]){
    poly(c,[[x-22,y+10],[x+22,y+10],[x+19,y+57],[x-18,y+56]],
      "#465771","#1d3046",2);
    fireBowl(c,x,y,1.05);
  }
  // Short front steps between hall and stone oval.
  for(let k=0;k<3;k++){
    const y=297+k*14;
    poly(c,[[394-k*31,y],[610+k*31,y],[624+k*31,y+12],
      [380-k*31,y+12]],k%2?"#495970":"#566680");
    line(c,[[394-k*31,y],[610+k*31,y]],"#bb9b71",1.3);
  }
}
const TILE_PALETTE=["#36576a","#405e71","#314c62","#426276",
  "#38566c","#2d485e","#354f67","#496679","#385468","#3d5e71"];
function drawFloor(c){
  const cx=500,cy=409,rx=481,ry=144;
  // The platform has a real 3D vertical near wall and a bright gold rim.
  oval(c,cx,cy+33,rx+2,ry+2,"#0a1c2e","#2e4660",5);
  const outerEdge=c.createLinearGradient(0,cy+40,0,cy+195);
  outerEdge.addColorStop(0,"#7e7e85");
  outerEdge.addColorStop(.21,"#42546c");
  outerEdge.addColorStop(1,"#152a40");
  oval(c,cx,cy+27,rx+3,ry+1,outerEdge,"#987e62",4);
  oval(c,cx,cy,rx,ry,"#2e5369","#d5ad70",7);
  c.save();c.beginPath();c.ellipse(cx,cy,rx-7,ry-7,0,0,TAU);c.clip();
  // Regular but offset polygon grid is closer to carved low-poly stone
  // than the previous procedural pie wedges or a flat gradient.
  const nCols=15,nRows=10,stepX=76,stepY=42;
  const grid=[];
  for(let row=0;row<=nRows;row++){
    const pts=[];
    for(let col=0;col<=nCols;col++){
      const x=-70+col*stepX+(row%2?10:-8)+
        (col===0||col===nCols?0:(hash(row*37+col*13)-.5)*19);
      const y=238+row*stepY+
        (row===0||row===nRows?0:(hash(row*64+col*11)-.5)*15);
      pts.push([x,y]);
    }
    grid.push(pts);
  }
  for(let row=0;row<nRows;row++)for(let col=0;col<nCols;col++){
    const a=grid[row][col],b=grid[row][col+1],
      d=grid[row+1][col],e=grid[row+1][col+1];
    const i=(row*13+col*7)%TILE_PALETTE.length;
    if(hash(row*77+col*19)>.48){
      poly(c,[a,b,d],TILE_PALETTE[i],"#213e51",1.7);
      poly(c,[b,e,d],TILE_PALETTE[(i+3)%10],"#213e51",1.7);
    }else{
      poly(c,[a,b,e],TILE_PALETTE[i],"#213e51",1.7);
      poly(c,[a,e,d],TILE_PALETTE[(i+5)%10],"#213e51",1.7);
    }
  }
  // Golden perspective rings break up the tiled floor into an arena.
  oval(c,cx,cy,429,123,"","#d4b67699",3.4);
  oval(c,cx,cy,356,100,"","#172b3c86",7);
  oval(c,cx,cy,354,98,"","#94b7aa34",1.5);
  oval(c,cx,cy,252,71,"","#d1b47961",2);
  oval(c,cx,cy,151,44,"#1d4256","#e6bd78",4.5);
  oval(c,cx,cy,127,37,"#315368","#bfa46b",2.2);
  // Central magic compass facets (no oversized painterly stickers).
  for(let k=0;k<8;k++){
    const a=k*TAU/8;
    const r=112,t=35;
    const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*t;
    poly(c,[[cx,cy],[x,y],[cx+Math.cos(a+.32)*r,
      cy+Math.sin(a+.32)*t]],
      k%2?"#14677929":"#4ed6c52a");
  }
  for(let k=0;k<8;k++){
    const a=k*TAU/8;
    const x=cx+Math.cos(a)*153,y=cy+Math.sin(a)*44;
    const sx=Math.cos(a),sy=Math.sin(a);
    poly(c,[[x-sx*10,y-sy*5],[x+sy*9,y-sx*3],[x+sx*13,y+sy*4],
      [x-sy*9,y+sx*3]],k%2?"#daa85d":"#63d2d9");
  }
  diamond(c,cx,cy,24,"#4edadd");
  // A gentle perimeter vignette adds height/depth without flattening art.
  const shade=c.createLinearGradient(0,255,0,550);
  shade.addColorStop(0,"#06172650");shade.addColorStop(.35,"#06172600");
  shade.addColorStop(1,"#06172635");
  c.fillStyle=shade;c.fillRect(0,244,1000,335);
  c.restore();
  // The near ring lip is in FRONT of the floor, retaining the shallow
  // original camera view and visible platform thickness.
  const N=64;
  const top=[],bottom=[];
  for(let i=0;i<=N;i++){
    const a=Math.PI*i/N;
    top.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);
    bottom.push([cx+(rx+2)*Math.cos(a),cy+32+(ry+2)*Math.sin(a)]);
  }
  poly(c,[...top,...bottom.reverse()],"#39485e","#203b50",1);
  for(let i=0;i<N;i+=4){
    const a=Math.PI*i/N,b=Math.PI*(i+4)/N;
    const p1=[cx+rx*Math.cos(a),cy+ry*Math.sin(a)],
      p2=[cx+rx*Math.cos(b),cy+ry*Math.sin(b)],
      q1=[p1[0],p1[1]+32],q2=[p2[0],p2[1]+32];
    poly(c,[p1,p2,q2,q1],i%12?"#526077":"#66758a","#283c50",1);
    poly(c,[p1,p2,[p2[0],p2[1]+6],[p1[0],p1[1]+6]],
      i%8?"#a78a62":"#dfbc7e");
  }
  line(c,top,"#f1c984",4.5);
  line(c,bottom.reverse(),"#1a3448",2);
  // Foreground stepped blocks: all angular, no smooth stadium fill.
  poly(c,[[0,568],[135,577],[305,587],[491,595],[706,585],
    [849,577],[1000,560],[1000,620],[0,620]],"#1a3348");
  poly(c,[[0,574],[180,594],[375,603],[590,604],
    [810,593],[1000,570],[1000,590],[801,614],[376,620],[0,600]],
    "#314d63");
  for(let i=0;i<12;i++){
    const x=i*94-48;
    poly(c,[[x,587+hash(i)*8],[x+94,589+hash(i+9)*9],
      [x+89,620],[x+6,620]],i%3===0?"#3f5870":i%2?"#26445c":"#345269",
      "#182f45",1.6);
  }
  // Peripheral crystals on plinths as in the approved concept.
  for(const [x,y,s] of [[36,594,55],[958,589,61],[120,595,31],[875,593,34]]){
    poly(c,[[x-28,y+8],[x+30,y+8],[x+35,y+30],[x-34,y+30]],
      "#465b72","#192b43",2);
    crystal(c,x,y+12,s,x<500?"#45ddd1":"#58c9f5");
  }
}
function draw(c){
  c.save();c.setTransform(1,0,0,1,0,0);
  c.clearRect(0,0,W,H);
  drawHall(c);
  drawFloor(c);
  c.restore();
}
root.WIZARDRY_LOW_POLY_ARENA_V47={draw,size:{width:W,height:H}};
})(window);
