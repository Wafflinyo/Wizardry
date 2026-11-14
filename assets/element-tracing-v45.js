/* Wizardry 0.45 — actual elemental sigils with portal-like spark tracing.
   The glyph geometry mirrors each card's SVG emblem. All sparks are visual
   only; hit chance and animation state are owned by arena.js. */
(function(root){
"use strict";
const TAU=Math.PI*2;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const hash=n=>{const x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x);};
function bez(a,b,c,d,n=14){
  const points=[];
  for(let i=0;i<=n;i++){
    const t=i/n,u=1-t;
    points.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],
      u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);
  }
  return points;
}
const droplet=[
  [12,2],[5.6,10.2],
  ...bez([5.6,10.2],[1.8,15.4],[5.8,22],[12,22]).slice(1),
  ...bez([12,22],[18.2,22],[22.2,15.4],[18.4,10.2]).slice(1),
  [12,2]
];
// Stroke coordinates are in the SAME 24×24 coordinate system as the
// card emblems. The first stroke is the silhouette; following strokes
// complete its faceted interior lines, without fake zigzag substitutes.
const PATHS={
  water:[
    droplet,
    [[12,3],[12,20.8]],
    [[12,3],[17,10.6],[18.0,14.5],[16.8,18],[12,20.8]],
    [[8.9,11.4],[7.7,14.1],[9.2,16.7]]
  ],
  earth:[
    [[1.7,20],[9.3,5.1],[14.7,14],[17.8,8.8],[23,20],[1.7,20]],
    [[5.7,12.2],[9.3,5.1],[12.2,10.1],[9,12.6],[5.7,12.2]],
    [[15.8,14],[17.8,8.8],[20.3,14.3]],
    [[9.3,5.1],[11,20]]
  ],
  fire:[
    [[13.2,2.1],[14.4,5.2],[12.8,8],[12.8,11.3],
      [16.9,5.9],[20.2,11.4],[20,17],[16.8,20.7],[12.2,21.4],
      [8.2,20.5],[5,17],[5.7,11.5],[9.9,7.2],[9.9,13.1],[13.2,10.6],[13.2,2.1]],
    [[12.2,12.2],[11.1,15.2],[10.7,18],[13.5,20.3],[16,18],[15.1,14.5],[12.2,12.2]]
  ],
  air:[
    [[3,8],[15.8,8],[18.6,6.3],[17.6,4.5],[15.3,4.7],[14.3,6.1]],
    [[2,12.5],[20,12.5],[22.3,14.3],[20.3,17.1],[18,16.9],[18.2,15]],
    [[4,17],[13.8,17],[16,19.2],[13.9,21.3],[11.3,20],[12.1,19]]
  ],
  light:[
    [[12,1.5],[14.7,7.7],[21.2,6.2],[19.1,12.4],[23.2,17.1],
     [16.4,17.2],[12,23],[7.6,17.2],[.8,17.1],[4.9,12.4],
     [2.8,6.2],[9.3,7.7],[12,1.5]],
    [[12,7.5],[15.5,12],[12,16.6],[8.5,12],[12,7.5]]
  ],
  shadow:[
    [[16.1,2.3],[11,3.4],[7.2,6.1],[4.2,13],[7.1,20],
     [13.8,22.1],[19.8,19],[22.6,15.9],[16.7,17.3],
     [11.2,14.4],[9.5,8.2],[12.1,4.4],[16.1,2.3]],
    [[18,4],[18.8,5.8],[21,6],[19.6,7.5],[20,9.8],[18,8.7],[16.2,10],[16.6,7.6],[15.2,6.1],[17.3,5.8],[18,4]]
  ],
  nature:[
    [[21.9,2.1],[14.1,3.8],[7.9,7.8],[3.6,15.6],
     [5.4,20],[11.1,21.8],[19.5,16],[22.5,7.5],[21.9,2.1]],
    [[3.3,23],[9.3,16],[14,10],[21.4,3]],
    [[9.1,16],[8,10.1]],[[13.6,11.9],[18.5,12.4]]
  ],
  arcane:[
    [[12,1.7],[20.4,8],[20.4,17],[12,22.3],[3.6,17],[3.6,8],[12,1.7]],
    [[12,1.7],[12,22.3]],[[3.6,8],[12,11.1],[20.4,8]],
    [[12,5.2],[16,8.5],[12,10.2],[8,8.5],[12,5.2]]
  ],
  ice:[
    [[12,1.5],[12,22.5]],[[1.5,12],[22.5,12]],
    [[4.6,4.6],[19.4,19.4]],[[19.4,4.6],[4.6,19.4]],
    [[8.5,4.7],[12,7.7],[15.5,4.7]],[[8.5,19.3],[12,16.3],[15.5,19.3]]
  ],
  lightning:[
    [[13.2,1.2],[4.7,13.2],[11.1,13.2],[10.1,22.8],
      [19.3,9.1],[12.9,9.1],[13.2,1.2]],
    [[13.2,1.2],[11.3,11.5],[12.8,11.7],[10.1,22.8]]
  ]
};
PATHS.storm=PATHS.lightning;
PATHS.dark=PATHS.shadow;
const COLORS={water:"#8cefff",earth:"#c9ee95",fire:"#ffc078",
  air:"#d7faff",light:"#fff0b2",shadow:"#ddc4ff",
  nature:"#a8f5b1",arcane:"#dabaff",ice:"#d4faff",
  lightning:"#fff098",storm:"#fff098",dark:"#ddc4ff"};
function prepare(lines){
  const strokes=lines.map(points=>{
    const cumulative=[0];
    for(let i=1;i<points.length;i++)
      cumulative.push(cumulative.at(-1)+Math.hypot(points[i][0]-points[i-1][0],
        points[i][1]-points[i-1][1]));
    return {points,cumulative,length:cumulative.at(-1)};
  });
  return {strokes,length:strokes.reduce((sum,s)=>sum+s.length,0)};
}
const GEOMETRY=Object.fromEntries(Object.entries(PATHS).map(([k,v])=>[k,prepare(v)]));
function pointAlong(geo,fraction){
  let distance=clamp(fraction)*geo.length;
  for(const s of geo.strokes){
    if(distance>s.length){distance-=s.length;continue;}
    const p=s.points,di=s.cumulative;
    for(let i=1;i<p.length;i++)if(distance<=di[i]){
      const t=(distance-di[i-1])/Math.max(.00001,di[i]-di[i-1]);
      return [mix(p[i-1][0],p[i][0],t),mix(p[i-1][1],p[i][1],t)];
    }
    return p.at(-1);
  }
  return geo.strokes.at(-1).points.at(-1);
}
function paintPath(ctx,geo,project,complete){
  let left=geo.length*clamp(complete);
  ctx.beginPath();
  for(const s of geo.strokes){
    if(left<=0)break;
    const p=s.points,di=s.cumulative;
    let first=project(p[0]);ctx.moveTo(first[0],first[1]);
    for(let i=1;i<p.length;i++){
      const segment=di[i]-di[i-1];
      if(left>=segment){
        const xy=project(p[i]);ctx.lineTo(xy[0],xy[1]);left-=segment;
      }else{
        const t=clamp(left/Math.max(segment,.00001));
        const xy=project([mix(p[i-1][0],p[i][0],t),
          mix(p[i-1][1],p[i][1],t)]);
        ctx.lineTo(xy[0],xy[1]);left=0;break;
      }
    }
  }
}
// Deterministic particle positions produce continuous sparks without
// allocating an extra animation loop or storing thousands of particles.
function streak(ctx,x,y,dx,dy,color,width,opacity){
  ctx.globalAlpha=opacity;
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x,y);ctx.stroke();
}
function draw(ctx,options){
  if(!ctx||!options)return false;
  const school=PATHS[options.school]?options.school:"arcane";
  const geo=GEOMETRY[school],color=COLORS[school];
  const ms=Math.max(0,Number(options.elapsed)||0),
    duration=Math.max(1,Number(options.duration)||850),
    fraction=ease(ms/duration);
  const cx=Number(options.centerX)||500,cy=Number(options.centerY)||312;
  const scale=Number(options.scale)||5.55;
  const project=p=>[cx+(p[0]-12)*scale,cy+(p[1]-12)*scale];
  const radius=78*scale/5.55;
  ctx.save();
  ctx.lineCap="round";ctx.lineJoin="round";
  // Thin arc fragments revolve like a forged magic circle, distinctly
  // BEHIND the actual card symbol rather than being the rune itself.
  const rotate=ms*.0018;
  ctx.lineWidth=2;
  ctx.shadowColor="#ffb34b";ctx.shadowBlur=12;
  for(let k=0;k<3;k++){
    ctx.beginPath();
    const start=rotate*(k%2?-.8:1)+k*TAU/3;
    ctx.arc(cx,cy,radius+k*3,start,start+1.18);
    ctx.strokeStyle=k===1?"#fff1a1ad":"#ffb04a9a";
    ctx.stroke();
  }
  ctx.shadowBlur=0;
  // The true element shape is visible as a faint engraving before drawing.
  ctx.lineWidth=2.3;ctx.strokeStyle=color+"28";
  paintPath(ctx,geo,project,1);ctx.stroke();
  // Active golden molten outline + vivid element-colored core.
  if(fraction>0){
    paintPath(ctx,geo,project,fraction);
    ctx.lineWidth=7.5;ctx.strokeStyle="#ad6525";
    ctx.shadowColor="#ff9b31";ctx.shadowBlur=16;ctx.stroke();
    ctx.lineWidth=4.2;ctx.strokeStyle="#ffc45b";ctx.shadowBlur=9;ctx.stroke();
    ctx.shadowBlur=0;ctx.lineWidth=2.5;ctx.strokeStyle=color;ctx.stroke();
    ctx.lineWidth=.9;ctx.strokeStyle="#fff9de";ctx.stroke();
  }
  const tip=project(pointAlong(geo,Math.max(.00001,fraction)));
  // Traveling sparks peel from traced strokes and disperse outward.
  for(let i=0;i<42;i++){
    const age=(ms+i*67)%490;
    const born=ms-age;
    if(born<0)continue;
    const from=project(pointAlong(geo,ease(born/duration)));
    const angle=hash(i*23+4)*TAU;
    const speed=25+hash(i*9+12)*66;
    const dx=Math.cos(angle)*speed*age/1000,
      dy=Math.sin(angle)*speed*age/1000-9*age/490;
    const life=1-age/490;
    streak(ctx,from[0]+dx,from[1]+dy,
      Math.cos(angle)*(3+life*7),Math.sin(angle)*(3+life*7),
      i%5===0?color:i%3===0?"#fff9dd":"#ffb552",
      .75+life*.9,life*.87);
  }
  // Emitting tip: visible bright star and rapid streaks, like magical
  // portal sparks, moving WITH the trace instead of appearing at random.
  if(fraction>0){
    const pulse=1+.24*Math.sin(ms*.042);
    ctx.globalAlpha=1;
    ctx.shadowColor="#ffc453";ctx.shadowBlur=22;
    ctx.beginPath();ctx.arc(tip[0],tip[1],4.1*pulse,0,TAU);
    ctx.fillStyle="#fff5c9";ctx.fill();
    ctx.shadowBlur=0;
    for(let i=0;i<16;i++){
      const a=i*2.39996+ms*.0066;
      const r=8+hash(i*5+21)*20;
      const spin=ms*.005+i*.8;
      const x=tip[0]+Math.cos(a)*r,
        y=tip[1]+Math.sin(a)*r;
      streak(ctx,x,y,Math.cos(a+spin)*(4+i%4),
        Math.sin(a+spin)*(4+i%4),
        i%4===0?color:i%3===0?"#fff8d4":"#ffbd58",
        i%4===0?1.8:1.25,.35+.6*(.5+.5*Math.sin(ms*.015+i*3)));
    }
  }
  // Short-lived rotating sparks on the outer ring: animated arcs, not
  // an unrelated symbol. Kept translucent enough for arena visibility.
  for(let i=0;i<18;i++){
    const a=ms*.00165+i*TAU/18;
    const r=radius+(i%3-1)*3;
    const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
    const opacity=.18+.38*(.5+.5*Math.sin(ms*.014+i*1.91));
    streak(ctx,x,y,-Math.sin(a)*(4+i%3*2),Math.cos(a)*(4+i%3*2),
      i%6===0?color:"#ffd481",.8,opacity);
  }
  ctx.restore();return true;
}
root.WIZARDRY_ELEMENT_TRACE_V45={
  draw,
  pathFor:school=>(PATHS[school]||PATHS.arcane)[0].map(p=>p.slice()),
  pointAt:(school,t)=>pointAlong(GEOMETRY[PATHS[school]?school:"arcane"],t),
  schools:Object.keys(PATHS)
};
})(window);
