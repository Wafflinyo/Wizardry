/* Wizardry — Poseidon's Wrath prototype.
 * Self-contained Canvas 2D low-poly/2.5D battle renderer.
 * No game engine, asset hosting, build step, or external scripts required.
 */
(() => {
  "use strict";
  const canvas = document.getElementById("battlefield");
  const g = canvas.getContext("2d", { alpha: false });
  const UI = {
    cast: document.getElementById("castButton"),
    castText: document.getElementById("castButtonText"),
    reset: document.getElementById("resetButton"),
    speed: document.getElementById("speedButton"),
    sound: document.getElementById("soundButton"),
    soundLabel: document.getElementById("soundLabel"),
    card: document.getElementById("poseidonCard"),
    golemCard: document.getElementById("stoneGolemCard"),
    spellSchool: document.getElementById("spellSchool"),
    spellName: document.getElementById("spellName"),
    spellSummary: document.getElementById("spellSummary"),
    spellCost: document.getElementById("spellCost"),
    spellDamage: document.getElementById("spellDamage"),
    spellTarget: document.getElementById("spellTarget"),
    manaPips: document.getElementById("manaPips"),
    manaText: document.getElementById("manaText"),
    round: document.getElementById("roundLabel"),
    state: document.getElementById("stateLabel"),
    caption: document.getElementById("spellCaption"),
    status: document.getElementById("castStatus"),
    hint: document.getElementById("battleHint"),
    hpFill: document.getElementById("enemyHealthFill"),
    hpText: document.getElementById("enemyHealthText"),
    enemyHud: document.getElementById("enemyHud"),
    win: document.getElementById("winOverlay"),
    winReplay: document.getElementById("winReplay"),
    winFlavor: document.getElementById("winFlavor")
  };
  const W = 1000, H = 560, MAX_HP = 3000, DAMAGE = 1200, COST = 8;
  // All keyframes share one clock: the projectile and damage cannot drift apart.
  // Key pose samples are evaluated every screen refresh (60/120+ Hz), not
  // 9 image frames. Timing is animation seconds independent of refresh rate.
  const SPELL = Object.freeze({
    riseStart: .45, riseEnd: 1.65,
    aimStart: 1.13, aimEnd: 1.60,
    windStart: 1.54, windEnd: 2.37,
    releaseStart: 2.37, releaseEnd: 2.70,
    launch: 2.55, hit: 2.86,
    sinkStart: 3.52, sinkEnd: 4.74, end: 4.88
  });
  // Earth: clasp two stone fists, raise overhead, ground slam, spikes travel.
  const EARTH = Object.freeze({
    emergeStart:.07,emergeEnd:1.02,
    claspStart:.89,claspEnd:1.30,
    liftStart:1.19,liftEnd:2.13,
    holdStart:2.13,holdEnd:2.31,
    slamStart:2.31,slamEnd:2.73,
    spikesStart:2.73,spikesEnd:3.53,hit:3.53,
    settleStart:3.83,crumbleStart:4.08,crumbleEnd:4.85,end:5.03
  });
  const duration = SPELL.end;
  // Middle ground between the original slower cast (4.88s) and v0.3.2 (2.44s).
  // One cast now takes ~3.25s at displayed 1×, preserving every keyframe.
  const DEFAULT_SPELL_RATE = 1.5;
  let health = MAX_HP, mana = 8, round = 1;
  const SPELLS = Object.freeze({
    poseidon: {
      name: "Poseidon's Wrath", school: "Water", cost: 8, damage: 1200,
      summary: "Poseidon rises with the sea, aims and throws his trident at the Sentinel, and becomes the wave as he disappears.",
      start: "The ocean answers your call...",
      caption: "POSEIDON'S WRATH",
      hint: "Whirlpool → surge → aim → trident throw → splash → unsummon.",
      finish: "Poseidon has been fully unsummoned."
    },
    stone: {
      name: "Stone Golem", school: "Earth", cost: 6, damage: 900,
      summary: "A towering golem clasps both stone fists, raises them overhead, and slams the floor. Jagged Earth spikes race toward the enemy.",
      start: "Stone rumbles beneath the arena...",
      caption: "STONE GOLEM",
      hint: "Rise → clasp stone fists → raise → ground slam → advancing stone spikes → impact.",
      finish: "Stone Golem has crumbled back into the earth."
    }
  });
  let selectedSpell = "poseidon", targeted = true, defeated = false;
  let cast = null, particles = [], speed = 1, sound = true;
  let previousTime = performance.now(), totalTime = 0, targetPulse = 0;
  let audio = null;

  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const out = n => 1 - Math.pow(1 - clamp(n), 3);
  const rand = (a, b) => a + Math.random() * (b - a);
  const phase = (t, start, end) => clamp((t - start) / (end - start));

  // Natural cubic interpolator between many intermediate limb key poses.
  // Unlike linear tweening, joints have continuous motion at every pose key.
  function jointCurve(frames, p) {
    p = clamp(p);
    let i = 0;
    while (i < frames.length - 2 && p > frames[i + 1][0]) i++;
    const a = frames[Math.max(0, i - 1)];
    const b = frames[i], c = frames[i + 1];
    const d = frames[Math.min(frames.length - 1, i + 2)];
    const distance = c[0] - b[0], u = clamp((p - b[0]) / distance);
    const m0 = (c[1] - a[1]) / (c[0] - a[0]);
    const m1 = (d[1] - b[1]) / (d[0] - b[0]);
    return (2*u*u*u - 3*u*u + 1)*b[1]
      + (u*u*u - 2*u*u + u)*m0*distance
      + (-2*u*u*u + 3*u*u)*c[1]
      + (u*u*u - u*u)*m1*distance;
  }
  // In-between joint coordinates for an actual wind-up and shoulder follow-through.
  // All values are relative to Poseidon's centre (x=505, y=bodyY).
  const ARM = Object.freeze({
    elbowX: [[0,102],[.16,109],[.32,101],[.5,68],[.7,29],[.9,8],[1,7]],
    elbowY: [[0,-73],[.16,-91],[.32,-115],[.5,-133],[.7,-155],[.9,-161],[1,-156]],
    handX: [[0,125],[.16,123],[.32,94],[.5,45],[.7,-13],[.9,-55],[1,-64]],
    handY: [[0,-55],[.16,-91],[.32,-125],[.5,-151],[.7,-175],[.9,-172],[1,-164]],
    snapElbowX: [[0,7],[.25,26],[.5,57],[.72,88],[1,102]],
    snapElbowY: [[0,-156],[.25,-169],[.5,-158],[.72,-125],[1,-97]],
    snapHandX: [[0,-64],[.2,-36],[.44,24],[.62,73],[.82,125],[1,154]],
    snapHandY: [[0,-164],[.2,-175],[.44,-165],[.62,-146],[.82,-121],[1,-93]]
  });
  function throwPose(elapsed, t = 0) {
    const w = ease(phase(elapsed, SPELL.windStart, SPELL.windEnd));
    const r = ease(phase(elapsed, SPELL.releaseStart, SPELL.releaseEnd));
    const rising = out(phase(elapsed,SPELL.riseStart,SPELL.riseEnd));
    const sinking = ease(phase(elapsed,SPELL.sinkStart,SPELL.sinkEnd));
    const bodyY = 406 - 112*rising*(1-sinking) + Math.sin(t*2.4)*1.5;
    const x = 505;
    const elbowX = mix(jointCurve(ARM.elbowX,w),jointCurve(ARM.snapElbowX,r),r);
    const elbowY = mix(jointCurve(ARM.elbowY,w),jointCurve(ARM.snapElbowY,r),r);
    const handX = mix(jointCurve(ARM.handX,w),jointCurve(ARM.snapHandX,r),r);
    const handY = mix(jointCurve(ARM.handY,w),jointCurve(ARM.snapHandY,r),r);
    const rotation = -.08*w + .18*r;
    const pivotY = bodyY - 78;
    // World-space hand matches the transformed renderer, including torso twist.
    const ca=Math.cos(rotation),sa=Math.sin(rotation);
    const dx=handX,dy=handY + 78;
    const worldX=x+dx*ca-dy*sa;
    const worldY=pivotY+dx*sa+dy*ca;
    const targetX=785,targetY=290;
    // Our trident's head points local -Y. Aim every raised frame at the enemy.
    const worldAngle=Math.atan2(targetX-worldX,worldY-targetY);
    return {
      bodyY,w,r,rotation,
      elbow:[x+elbowX,bodyY+elbowY],
      hand:[x+handX,bodyY+handY],
      worldHand:[worldX,worldY],
      localAngle:worldAngle-rotation,
      worldAngle
    };
  }
  function tridentTip(hand, angle, length=106) {
    const reach=length*(.38+.67); // to the tip of the longest tine
    return [hand[0]+Math.sin(angle)*reach,
            hand[1]-Math.cos(angle)*reach];
  }

  function polygon(points, color, stroke = null, lineWidth = 1) {
    g.beginPath(); g.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
    g.closePath(); g.fillStyle = color; g.fill();
    if (stroke) { g.lineWidth = lineWidth; g.strokeStyle = stroke; g.stroke(); }
  }
  function oval(x, y, rx, ry, fill, stroke, width = 1) {
    g.beginPath(); g.ellipse(x, y, Math.max(.001, rx), Math.max(.001, ry), 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
  }
  function line(x1, y1, x2, y2, stroke, width = 2) {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
    g.strokeStyle = stroke; g.lineWidth = width; g.stroke();
  }
  function glow(x, y, r, core, edge = "transparent") {
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, core); grad.addColorStop(1, edge);
    oval(x, y, r, r, grad);
  }
  function label(text, x, y, size, color, align = "center") {
    g.save(); g.textAlign = align; g.font = "bold " + size + "px Georgia,serif";
    g.shadowColor = "#021321"; g.shadowBlur = 6; g.fillStyle = color; g.fillText(text, x, y); g.restore();
  }
  function triangleFacet(x1, y1, x2, y2, x3, y3, color) {
    polygon([[x1,y1],[x2,y2],[x3,y3]],color);
  }

  function drawSky(t) {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#071524"); sky.addColorStop(.48, "#153248"); sky.addColorStop(.8, "#172d3d"); sky.addColorStop(1, "#061824");
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    glow(505, 105, 300, "#2b859427", "#0f284400");
    glow(493, 135, 92, "#a7e8df13", "#23597300");
    oval(500, 108, 37, 37, "#c9e4df", "#ecffff", 2);
    oval(509, 101, 36, 35, "#254456");
    for (let i=0;i<95;i++) {
      const x = (i*191.67 + 62) % W, y = (i*63.11 + 19) % 275;
      const f = .5 + .5 * Math.sin(t*.9 + i*5);
      oval(x,y,.4+f*.8,.4+f*.8,"rgba(204,237,255,"+(.08+f*.3)+")");
    }
    const fog = g.createLinearGradient(0, 140, 0, 386);
    fog.addColorStop(0, "#36738700"); fog.addColorStop(.55, "#2d6c7e22"); fog.addColorStop(1, "#1b546218");
    g.fillStyle = fog; g.fillRect(0,140,W,260);
    polygon([[0,308],[39,247],[80,290],[129,218],[182,314],[244,240],[297,298],[349,223],[409,306],[458,251],[509,315],[565,219],[635,295],[686,238],[759,308],[803,207],[866,297],[913,246],[1000,317],[1000,402],[0,402]], "#142f40");
    polygon([[0,322],[68,269],[119,328],[183,269],[245,327],[314,253],[383,328],[446,279],[496,340],[555,274],[603,326],[675,271],[737,327],[809,253],[870,322],[936,259],[1000,320],[1000,400],[0,400]], "#1d3e4d");
    for(let i=0;i<7;i++) {
      const x = 55 + i*152;
      const y = 330 + (i%2)*15;
      polygon([[x-19,y],[x-15,y-120],[x+9,y-120],[x+14,y],[x-19,y]],"#233a46");
      polygon([[x-22,y-119],[x-31,y-136],[x+24,y-136],[x+16,y-119]], "#54606a");
      polygon([[x-15,y-120],[x-4,y-120],[x-4,y]],"#354a52");
      oval(x-3,y-137,21,4,"#5d636a");
      if (i===0 || i===6) glow(x,y-134,33,"#57eeea3a");
    }
  }

  function drawArena(t) {
    oval(500,426,492,143,"#050d15");
    const rim = g.createLinearGradient(0,335,0,515);
    rim.addColorStop(0,"#53636e");rim.addColorStop(.55,"#152f3b");rim.addColorStop(1,"#0b1b2a");
    oval(500,401,486,133,rim,"#9e9a78",4);
    oval(500,392,464,118,"#122c3c","#3e6870",3);
    for(let i=0;i<32;i++) {
      const a0=(i/32)*Math.PI*2, a1=((i+1)/32)*Math.PI*2;
      triangleFacet(500,395,500+460*Math.cos(a0),395+117*Math.sin(a0),500+460*Math.cos(a1),395+117*Math.sin(a1), i%2 ? "#233e4b38" : "#47677226");
    }
    for(let i=0;i<4;i++) oval(500,391,440-i*75,112-i*19,null,i%2?"#65a0a94a":"#95c8bc35",i===0?2:1);
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6;
      const x=500+390*Math.cos(a),y=392+95*Math.sin(a);
      g.save();g.translate(x,y);g.rotate(a+Math.PI/2);
      polygon([[-7,-9],[0,-17],[7,-9],[0,13]],"#8ababb45");g.restore();
    }
    // Water reflection across the floor
    glow(504,388,200,"#1c92b922");
    oval(500,390,154,48,"#1a617630","#55b9b63b",1.7);
    // Combatant platforms
    oval(214,409,114,37,"#0b1728","#5aa5ad",2);
    oval(785,400,114,38,"#211c2b","#ca9d6b",2);
    for(const x of [214,785]) {
      oval(x,400,81,25,null,x===214?"#79d6da77":"#f2bc8777",1.4);
      for(let j=0;j<6;j++){
        const a=j*Math.PI/3;line(x+72*Math.cos(a),401+20*Math.sin(a),x+86*Math.cos(a),401+24*Math.sin(a),"#ddc78c69",2);
      }
    }
    // Spinning summoning glyph only while active
    if(cast && cast.elapsed < (cast.type==="stone"?EARTH.end:SPELL.end)){
      const duration=cast.type==="stone"?EARTH.end:SPELL.end;
      const alpha=cast.elapsed<.50?phase(cast.elapsed,0,.50):1-phase(cast.elapsed,duration-.55,duration);
      g.save();g.globalAlpha=alpha;
      for(let k=0;k<3;k++){
        g.save();g.translate(505,402);g.rotate(t*(k%2?-.14:.19)+k);g.scale(1,.34);
        g.beginPath();g.arc(0,0,96-k*22,0,Math.PI*2);
        g.strokeStyle=cast.type==="stone"?(k===0?"#c5d18a":"#a69763"):(k===0?"#72f9ee":"#3ccbf2");g.lineWidth=3-k*.5;g.shadowBlur=12;g.shadowColor=cast.type==="stone"?"#acbe6f":"#4ffcf1";g.stroke();
        for(let q=0;q<9;q++){let a=q*Math.PI*2/9;line(70*Math.cos(a),70*Math.sin(a),78*Math.cos(a),78*Math.sin(a),"#a1ffff",4);}
        g.restore();
      }
      g.restore();
    }
  }

  function drawWizard(t) {
    const bob=Math.sin(t*1.8)*2;
    g.save();g.translate(216,377+bob);
    oval(0,35,60,14,"#0009");
    // Cape, polygon robe, folds
    polygon([[-29,-41],[22,-39],[49,37],[-42,40]],"#122c5d","#4088ae",2);
    triangleFacet(-29,-38,-9,-17,-41,39,"#245487");
    triangleFacet(19,-36,10,-10,45,37,"#1a3870");
    triangleFacet(-9,-19,5,38,19,-36,"#3976a4");
    polygon([[-33,-50],[-5,-67],[29,-52],[10,-24],[-19,-25]],"#173c65","#4f9bb2",2);
    polygon([[-22,-53],[-1,-88],[21,-58],[18,-38],[-19,-40]],"#305881");
    oval(-1,-56,13,17,"#c8987a","#916d5b",1.5);
    polygon([[-22,-48],[-7,-60],[6,-48],[20,-43],[6,-34],[-11,-34]],"#081725");
    oval(0,-55,5,3,"#72e9ff");
    // Staff with animated blue magic
    line(29,17,43,-87,"#b4a17b",6);line(29,17,43,-87,"#f3d28d",2);
    polygon([[36,-94],[43,-108],[50,-94],[43,-82]],"#4df4ff","#e6fdff",2);
    glow(43,-94,22,"#39d9ff74");
    g.restore();
  }

  function drawSentinel(t) {
    const alive = health>0;
    const bob = alive?Math.sin(t*1.4)*3:0;
    const strikeTime=cast?(cast.type==="stone"?EARTH.hit:SPELL.hit):0;
    const jolt=cast && cast.elapsed>strikeTime && cast.elapsed<strikeTime+.43
      ? Math.sin(cast.elapsed*90)*7*(1-phase(cast.elapsed,strikeTime,strikeTime+.43)):0;
    g.save();g.translate(785+jolt,371+bob);
    if (!alive) g.globalAlpha=.36;
    oval(0,36,70,17,"#040b13a0");
    // Legs
    polygon([[-45,-21],[-8,-18],[-12,33],[-51,35]],"#596a73","#98a5a3",2);
    triangleFacet(-45,-20,-8,-18,-36,31,"#87979c");
    polygon([[10,-19],[48,-22],[54,34],[13,33]],"#50616c","#91a4aa",2);
    triangleFacet(10,-19,50,-24,16,31,"#788f98");
    // Two-dimensional faceted body conveys a low-poly rock monster
    polygon([[-50,-130],[-18,-152],[26,-148],[56,-128],[49,-42],[18,-12],[-30,-17],[-57,-63]],"#5d6d79","#a4b2ad",2);
    triangleFacet(-50,-130,-18,-150,-10,-82,"#7c8d9c");
    triangleFacet(-18,-150,25,-146,-10,-82,"#92a5ac");
    triangleFacet(25,-146,55,-128,15,-82,"#526776");
    triangleFacet(-10,-82,15,-82,49,-41,"#435769");
    triangleFacet(-55,-64,-10,-82,-28,-18,"#667b83");
    triangleFacet(-10,-82,48,-43,-30,-18,"#8297a0");
    // arms and rock spikes
    polygon([[-48,-126],[-85,-116],[-96,-48],[-63,-39],[-45,-82]],"#6b8390","#adc0bb",2);
    polygon([[54,-122],[85,-116],[99,-50],[68,-37],[45,-80]],"#667b88","#a3b9b9",2);
    triangleFacet(-84,-117,-102,-136,-62,-119,"#95a9b0");
    triangleFacet(83,-116,98,-143,63,-122,"#8299a0");
    triangleFacet(-63,-45,-92,-64,-106,-43,"#455d68");
    triangleFacet(66,-42,101,-55,111,-31,"#516773");
    // head/helmet
    polygon([[-37,-172],[-25,-202],[18,-207],[41,-175],[33,-132],[-29,-132]],"#758896","#bdc5c2",2);
    triangleFacet(-37,-172,-25,-202,0,-167,"#9fadb2");
    triangleFacet(-25,-202,18,-207,0,-168,"#c3d0c8");
    triangleFacet(18,-207,41,-175,0,-168,"#556a79");
    triangleFacet(-29,-131,0,-168,33,-132,"#566b78");
    polygon([[-25,-174],[-8,-170],[-10,-158],[-28,-160]],"#0a2432");
    polygon([[9,-170],[27,-174],[29,-160],[10,-158]],"#0a2432");
    glow(-18,-165,18,"#64fdff66");glow(19,-165,18,"#64fdff66");
    polygon([[-22,-166],[-12,-167],[-15,-163],[-22,-162]],"#91fbff");
    polygon([[13,-167],[23,-166],[22,-162],[15,-163]],"#91fbff");
    // central energy seam
    line(0,-125,0,-52,"#0f3747",7);line(0,-125,0,-52,"#7de8e6",2);
    polygon([[-11,-100],[0,-112],[11,-100],[0,-87]],"#3cd4d6","#b3fded",2);
    if(targeted && alive){
      const pulse=1+.07*Math.sin(t*4)+targetPulse*.11;
      g.save();g.translate(0,24);g.scale(pulse,.29*pulse);
      g.beginPath();g.arc(0,0,111,0,Math.PI*2);g.strokeStyle="#f6d38cbb";g.lineWidth=4;g.setLineDash([16,10]);g.stroke();g.setLineDash([]);
      g.restore();
      polygon([[-8,-239],[0,-252],[8,-239],[0,-226]],"#eecb73");
    }
    g.restore();
  }

  function addParticle(x,y,kind="spray",scale=1){
    if(particles.length>300)particles.splice(0,particles.length-300);
    const hot=kind==="impact"||kind==="rock", gold=kind==="gold";
    particles.push({
      x,y, vx:rand(-3.8,3.8)*scale + (hot?rand(-5,5):0),
      vy:rand(-5.5,-1)*scale, life:rand(.4,1.15),
      max:0, size:rand(2,6)*(hot?1.4:1), kind,
      color:kind==="rock"?["#d2c39b","#7c886f","#555e4e"][Math.floor(rand(0,3))]
        :kind==="dust"?["#b8a987","#88856b","#d6c597"][Math.floor(rand(0,3))]
        :gold?"#f6da87":hot?["#eaffff","#6efbff","#2abedb"][Math.floor(rand(0,3))]
        :["#9cfaff","#29b5d5","#deffff"][Math.floor(rand(0,3))]
    });
    particles[particles.length-1].max=particles[particles.length-1].life;
  }
  function updateParticles(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.life-=dt;
      if(p.life<=0){particles.splice(i,1);continue;}
      p.x+=p.vx*dt*55;p.y+=p.vy*dt*55;p.vy+=dt*(p.kind==="impact"?4:3.2);
    }
  }
  function drawParticles(){
    for(const p of particles){
      const alpha=clamp(p.life/p.max);
      g.globalAlpha=alpha;
      if(p.kind==="spray")triangleFacet(p.x,p.y-p.size,p.x-p.size*.6,p.y+p.size*.8,p.x+p.size*.6,p.y+p.size*.8,p.color);
      else if(p.kind==="rock")polygon([[p.x-p.size,p.y-p.size*.5],[p.x+p.size*.5,p.y-p.size],[p.x+p.size,p.y+p.size*.7],[p.x-p.size*.6,p.y+p.size]],p.color);
      else oval(p.x,p.y,p.size,p.size,p.color);
    }
    g.globalAlpha=1;
  }
  function foamCurve(points,alpha=1){
    g.save();g.globalAlpha=alpha;g.beginPath();g.moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=4)g.bezierCurveTo(points[i],points[i+1],points[i+2],points[i+3],points[i+4],points[i+5]);
    g.strokeStyle="#b6fbff";g.lineWidth=5;g.shadowColor="#27ecfd";g.shadowBlur=12;g.stroke();g.restore();
  }
  function drawWhirlpool(t,power){
    if(power<=0)return;
    g.save();g.globalAlpha=power;glow(505,405,129,"#28d6f37c");
    oval(505,407,153,36,"#07556b","#4ec8d4",4);
    oval(505,408,117,25,"#0c7385","#91fcf9",3);
    oval(505,408,78,17,"#06374d","#34b3d0",3);
    oval(505,409,39,9,"#031e37","#93f7fb",2);
    for(let i=0;i<4;i++){
      g.save();g.translate(505,408);g.rotate(t*(i%2?-.8:.8)+i*1.57);g.scale(1,.22);
      g.beginPath();g.arc(0,0,67+i*18,.1,2.6);
      g.strokeStyle=i%2?"#a8faff":"#48c7e8";g.lineWidth=5;g.stroke();g.restore();
    }
    g.restore();
  }
  function drawWave(t,rise,bodyY) {
    if(rise<=.01)return;
    const x=505, floor=411;
    // The wave IS Poseidon's lower half. Its narrow upper edge begins INSIDE
    // his fading chest, then fans smoothly into the floor-level tide.
    // No separate side peaks, outlined stalk, or enclosing bell silhouette.
    const top=bodyY-57;
    const height=Math.max(1,floor-top);
    const flow=Math.sin(t*2.8)*2.6*rise;
    const water=g.createLinearGradient(x,top,x,floor+12);
    water.addColorStop(0,"rgba(122,211,207,0.14)");
    water.addColorStop(.24,"rgba(45,171,183,0.59)");
    water.addColorStop(.50,"rgba(25,133,164,0.86)");
    water.addColorStop(.80,"rgba(12,92,138,0.94)");
    water.addColorStop(1,"rgba(9,71,113,0.92)");
    g.save();
    glow(x,top+height*.65,112,"#0cdff01c");
    g.beginPath();
    // Continuous taper from the torso to a single low breaking wave.
    g.moveTo(x-37,top);
    g.bezierCurveTo(x-44,top+height*.20,x-46+flow,top+height*.43,x-65,top+height*.59);
    g.bezierCurveTo(x-80,top+height*.78,x-106, floor-16,x-126,floor+3);
    g.quadraticCurveTo(x,floor+12,x+126,floor+3);
    g.bezierCurveTo(x+106,floor-16,x+80,top+height*.78,x+65,top+height*.59);
    g.bezierCurveTo(x+46-flow,top+height*.43,x+44,top+height*.20,x+37,top);
    g.closePath();
    g.fillStyle=water;g.fill();
    // The soft internal shading shares the same geometry and dissolves at top.
    const shade=g.createLinearGradient(x-110,floor,x+110,top);
    shade.addColorStop(0,"rgba(14,75,115,0.05)");
    shade.addColorStop(.48,"rgba(112,221,222,0.08)");
    shade.addColorStop(1,"rgba(8,49,84,0.18)");
    g.fillStyle=shade;g.fill();
    // Low, sideways-moving eddies; do not outline the vertical sides.
    g.globalAlpha=.16+.08*Math.sin(t*2);
    g.beginPath();g.moveTo(x-69,top+height*.68);
    g.bezierCurveTo(x-45,top+height*.72,x+36,top+height*.75,x+70,top+height*.68);
    g.strokeStyle="#b1eff2";g.lineWidth=3;g.stroke();
    g.globalAlpha=.28;
    g.beginPath();g.moveTo(x-109,floor-9);
    g.quadraticCurveTo(x,floor-25,x+110,floor-8);
    g.strokeStyle="#a0e9e9";g.lineWidth=2.5;g.stroke();
    g.globalAlpha=1;
    // Only surface spray at the base, not white arches beside the torso.
    for(let i=0;i<8;i++){
      const xi=x-115+i*33;
      const yi=floor-4+Math.sin(t*3+i*.8)*3;
      oval(xi,yi,2.1+rise,1.3,"#9cece9a0");
    }
    g.restore();
  }

  function drawTrident(x,y,angle,length=145,alpha=1){
    g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha=alpha;
    g.shadowColor="#4ef8ff";g.shadowBlur=13;
    // The trident points towards LOCAL negative y; a 90 degree turn points right.
    line(0,length*.46,0,-length*.37,"#483e39",11);
    line(0,length*.46,0,-length*.37,"#efd58c",6);
    line(-2,length*.42,-2,-length*.34,"#fff4b7",1.8);
    const top=-length*.38;
    line(0,top,0,-length*.59,"#ffe69a",7);
    line(-28,top+20,-28,top-10,"#d6b570",7);
    line(28,top+20,28,top-10,"#d6b570",7);
    line(-28,top+19,-17,top+30,"#d6b570",6);
    line(28,top+19,17,top+30,"#d6b570",6);
    line(-17,top+30,17,top+30,"#e8cb86",6);
    polygon([[-36,top-5],[-28,top-22],[-20,top-5]],"#f9e4a9","#fff8d8",1.2);
    polygon([[-8,top-49],[0,top-67],[8,top-49]],"#f9e4a9","#fff8d8",1.2);
    polygon([[20,top-5],[28,top-22],[36,top-5]],"#f9e4a9","#fff8d8",1.2);
    polygon([[-10,top+20],[0,top+11],[10,top+20],[0,top+31]],"#42deeb","#c9ffff",1);
    g.restore();
  }

  function drawPoseidon(t, rise, elapsed, hasThrown, alpha = 1) {
    if (rise <= .01) return;
    const x = 505;
    const pose = throwPose(elapsed,t);
    const { bodyY, w, r, rotation } = pose;
    const aim=ease(phase(elapsed,SPELL.aimStart,SPELL.aimEnd));
    const leftShoulder=[x-51,bodyY-101];
    const leftElbow=[mix(x-91,x+12,aim),mix(bodyY-61,bodyY-84,aim)];
    const leftWrist=[mix(x-118,x+112,aim),mix(bodyY-25,bodyY-74,aim)];
    const rightShoulder=[x+57,bodyY-103];
    const rightElbow=pose.elbow,rightHand=pose.hand;
    // Elbows and forearms are separate tapered segments (never rigid 'stick' arms).
    function limb(a, b, thickA, thickB, light, dark) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len, ny = dx / len;
      polygon([
        [a[0]+nx*thickA, a[1]+ny*thickA],
        [b[0]+nx*thickB, b[1]+ny*thickB],
        [b[0]-nx*thickB, b[1]-ny*thickB],
        [a[0]-nx*thickA, a[1]-ny*thickA]
      ], light, "#f1c7a0", 1.3);
      line(a[0]-nx*thickA*.5,a[1]-ny*thickA*.5,b[0]-nx*thickB*.5,b[1]-ny*thickB*.5,dark,2);
    }
    g.save();
    g.globalAlpha = alpha;
    // Rotate subtly through the spine, not about the centre of the battlefield.
    g.translate(x, bodyY - 78);
    g.rotate(rotation);
    g.translate(-x, -(bodyY - 78));
    // Silvery hair flowing over the back of the ocean-born torso.
    polygon([[x-36,bodyY-132],[x-65,bodyY-92],[x-73,bodyY-38],[x-33,bodyY-59],[x+35,bodyY-57],[x+83,bodyY-34],[x+69,bodyY-109],[x+34,bodyY-135]],"#a0d8df","#d4faff",2);
    triangleFacet(x-55,bodyY-96,x-67,bodyY-40,x-17,bodyY-81,"#62a9bf");
    triangleFacet(x+38,bodyY-102,x+73,bodyY-40,x+18,bodyY-69,"#4c899f");
    // Arm holding the trident stays behind the chest until the release.
    limb(rightShoulder,rightElbow,22,17,"#bc9079","#876b65");
    limb(rightElbow,rightHand,16,11,"#d9a789","#9b766e");
    // The lower torso fades directly into the ONE wave behind him.
    // It is not a second shape running down to the arena floor.
    const skinToSea=g.createLinearGradient(x,bodyY-120,x,bodyY+42);
    skinToSea.addColorStop(0,"#d8ad90");
    skinToSea.addColorStop(.25,"#cd9e83");
    skinToSea.addColorStop(.40,"#b8a88c");
    skinToSea.addColorStop(.56,"rgba(87,184,185,0.82)");
    skinToSea.addColorStop(.73,"rgba(39,145,166,0.42)");
    skinToSea.addColorStop(1,"rgba(24,117,147,0)");
    // The silhouette reaches only a few pixels below the sternum and is
    // swallowed by the matching water mass beneath (no column).
    g.beginPath();
    g.moveTo(x-57,bodyY-102);
    g.lineTo(x-32,bodyY-117);g.lineTo(x+37,bodyY-118);
    g.lineTo(x+61,bodyY-97);
    g.bezierCurveTo(x+54,bodyY-56,x+43,bodyY-17,x+38,bodyY+18);
    g.quadraticCurveTo(x,bodyY+39,x-38,bodyY+18);
    g.bezierCurveTo(x-43,bodyY-17,x-54,bodyY-56,x-57,bodyY-102);
    g.closePath();g.fillStyle=skinToSea;g.fill();
    // Chest facets are confined to the solid upper body, not the water.
    triangleFacet(x-57,bodyY-101,x-23,bodyY-109,x-8,bodyY-80,"#e3b090");
    triangleFacet(x-23,bodyY-109,x+29,bodyY-112,x+1,bodyY-81,"#f3c5a7");
    triangleFacet(x+29,bodyY-112,x+59,bodyY-94,x+28,bodyY-80,"#9e7667");
    polygon([[x-71,bodyY-100],[x-58,bodyY-126],[x-30,bodyY-125],[x-25,bodyY-94]],"#ac8a56","#ffec9f",2);
    triangleFacet(x-70,bodyY-101,x-51,bodyY-119,x-34,bodyY-102,"#f6d999");
    polygon([[x+26,bodyY-97],[x+37,bodyY-126],[x+69,bodyY-124],[x+76,bodyY-102]],"#a68150","#f3d88c",2);
    triangleFacet(x+37,bodyY-126,x+70,bodyY-123,x+62,bodyY-107,"#f5db98");
    polygon([[x-44,bodyY-114],[x-9,bodyY-96],[x+17,bodyY-100],[x+45,bodyY-115],[x+32,bodyY-102],[x-2,bodyY-89]],"#2d94b1","#c1ffff",1);
    // The OTHER arm now reaches across the chest to POINT at the target.
    limb(leftShoulder,leftElbow,20,15,"#ca967b","#8c706b");
    limb(leftElbow,leftWrist,15,10,"#d9a88c","#a77a6c");
    oval(leftWrist[0],leftWrist[1],12,10,"#e7b998","#ffdfbb",1.5);
    if (aim > .05) {
      const pointX = leftWrist[0] + 30 * aim, pointY = leftWrist[1] + 10 * aim;
      limb([leftWrist[0]+5,leftWrist[1]-1],[pointX,pointY],6,3.5,"#f1bd9e","#ba8e77");
      glow(pointX,pointY,13*aim,"#7df9f52d");
    }
    // Right fist and gold bracer follow the wind-up and release curve.
    oval(rightHand[0],rightHand[1],12,12,"#e3ae88","#ffe0b0",1.5);
    polygon([
      [rightElbow[0]-10,rightElbow[1]-16],[rightElbow[0]+13,rightElbow[1]-16],
      [rightElbow[0]+18,rightElbow[1]+2],[rightElbow[0]-7,rightElbow[1]+4]
    ],"#d7b56a","#f9e5a5",1.2);
    // Head, pale hair, beard and crown stay readable throughout the toss.
    oval(x+2,bodyY-148,39,43,"#d5a48a","#f5ccae",2);
    triangleFacet(x-33,bodyY-153,x+1,bodyY-189,x+29,bodyY-152,"#ecc0a3");
    oval(x-14,bodyY-157,6,3,"#12253d");oval(x+18,bodyY-157,6,3,"#12253d");
    oval(x-13,bodyY-158,3,2,"#9bfaff");oval(x+19,bodyY-158,3,2,"#9bfaff");
    polygon([[x-16,bodyY-141],[x+4,bodyY-147],[x+22,bodyY-142],[x+38,bodyY-122],[x+16,bodyY-72],[x-15,bodyY-82],[x-41,bodyY-120]],"#a8dde3","#eafffa",2);
    triangleFacet(x-37,bodyY-120,x-13,bodyY-131,x-16,bodyY-82,"#6fbacb");
    triangleFacet(x-12,bodyY-130,x+15,bodyY-128,x+16,bodyY-76,"#d1f6f2");
    triangleFacet(x+14,bodyY-124,x+34,bodyY-119,x+15,bodyY-77,"#75b7c7");
    polygon([[x-38,bodyY-165],[x-32,bodyY-205],[x-10,bodyY-190],[x+2,bodyY-216],[x+14,bodyY-190],[x+33,bodyY-204],[x+40,bodyY-161]],"#d5b26c","#ffea9f",2);
    triangleFacet(x-37,bodyY-167,x-12,bodyY-186,x+3,bodyY-171,"#f5dc8a");
    polygon([[x-7,bodyY-185],[x+2,bodyY-195],[x+11,bodyY-185],[x+2,bodyY-176]],"#5af2ff","#dcffff",1);
    line(x-12,bodyY-51,x+16,bodyY-34,"#55d6e6",2.5);
    glow(x+5,bodyY-51,30,"#4db5d51d");
    if (!hasThrown) {
      // Twist the weapon up and back, then whip it into a forward-facing release.
      // As soon as his arm starts to lift, the tines aim at the Sentinel.
      // Gradual turn happens BEFORE the wind-up, not after the throw.
      const holdAngle = mix(-.15,pose.localAngle,aim);
      drawTrident(rightHand[0],rightHand[1],holdAngle,106,alpha);
    }
    g.restore();
  }

  function drawSummon(t,elapsed) {
    const opening=ease(phase(elapsed,.04,SPELL.riseStart));
    const rising=out(phase(elapsed,SPELL.riseStart,SPELL.riseEnd));
    const sinking=ease(phase(elapsed,SPELL.sinkStart,SPELL.sinkEnd));
    const rise=rising*(1-sinking);
    // The summoning ring dims once the sea is formed; it is not a bright
    // outline around the foot of a separate water tower.
    const portalPower=opening*(1-sinking)*(.24+.76*(1-rising))+sinking*.14;
    drawWhirlpool(t,portalPower);
    if(rise>.01) {
      const torso=throwPose(elapsed,t);
      drawWave(t,rise,torso.bodyY);
      drawPoseidon(t,rise,elapsed,elapsed>=SPELL.launch,clamp((1-sinking)*3));
    }
    if(opening>.3&&elapsed<1.1)glow(505,405,90*opening,"#6df5fa2d");
  }

  function drawProjectile(elapsed,t) {
    if(elapsed<SPELL.launch||elapsed>=SPELL.hit)return;
    const p=phase(elapsed,SPELL.launch,SPELL.hit);
    // Flight starts at the exact tip location of the trident Poseidon released.
    // The hand/weapon hand-off is seamless, with no snapped position or rotation.
    const source=throwPose(SPELL.launch,t-(elapsed-SPELL.launch));
    const start=tridentTip(source.worldHand,source.worldAngle,106);
    const target=[785,290];
    const head=[mix(start[0],target[0],p),mix(start[1],target[1],p)-Math.sin(Math.PI*p)*12];
    const previousP=Math.max(0,p-.16);
    const previous=[mix(start[0],target[0],previousP),mix(start[1],target[1],previousP)-Math.sin(Math.PI*previousP)*12];
    const angle=Math.atan2(target[0]-start[0],start[1]-target[1]);
    const length=106,reach=length*1.05;
    const cx=head[0]-Math.sin(angle)*reach,cy=head[1]+Math.cos(angle)*reach;
    g.save();g.globalCompositeOperation="lighter";
    const tailX=head[0]-(head[0]-previous[0])*1.5,tailY=head[1]-(head[1]-previous[1])*1.5;
    line(tailX,tailY,head[0],head[1],"#0ab7ec",24);
    line(tailX,tailY,head[0],head[1],"#d4ffff",5);
    glow(head[0],head[1],32,"#bbffff83");
    g.restore();
    drawTrident(cx,cy,angle,length);
  }

  function drawImpact(elapsed) {
    if(elapsed<SPELL.hit||elapsed>SPELL.hit+1.02)return;
    const p=phase(elapsed,SPELL.hit,SPELL.hit+1.02);
    g.save();g.globalCompositeOperation="lighter";
    const flare=1-ease(p);
    glow(783,291,175*flare+30,"rgba(155,255,255,"+(.6*flare)+")");
    glow(782,309,96*flare+10,"rgba(68,210,250,"+(.7*flare)+")");
    for(let i=0;i<4;i++){
      g.save();g.globalAlpha=flare;
      oval(783,393,35+p*195,12+p*41,null,i%2?"#62dcff":"#d3ffff",6-i);
      g.restore();
    }
    for(let i=0;i<9;i++){
      const a=i*Math.PI*2/9+.23,inner=18+p*32,outer=55+p*162;
      line(783+Math.cos(a)*inner,301+Math.sin(a)*inner,
           783+Math.cos(a)*outer,301+Math.sin(a)*outer,
           i%2?"#48e7ef":"#c4fcff",8*flare);
    }
    g.restore();
    if(p<.94){
      const y=232-48*ease(p);
      g.save();g.globalAlpha=1-ease(phase(elapsed,SPELL.hit+.64,SPELL.hit+1));
      g.textAlign="center";g.font="bold 56px Georgia,serif";
      g.lineWidth=6;g.strokeStyle="#061823";g.shadowBlur=18;g.shadowColor="#8afaff";
      g.strokeText("-1,200",782,y);g.fillStyle="#fef8df";g.fillText("-1,200",782,y);
      g.restore();
    }
  }

  // --- EARTH SCHOOL: STONE GOLEM -------------------------------------------
  // Sandstone-and-moss creature, separate from the blue-grey enemy Sentinel.
  function drawBoulder(x,y,r,spin=0,opacity=1) {
    g.save();g.translate(x,y);g.rotate(spin);g.globalAlpha*=opacity;
    const pts=[[-.88,-.52],[-.43,-.96],[.23,-1],[.76,-.67],[1,-.13],[.72,.62],[.12,.99],[-.58,.88],[-1,.25]].map(p=>[p[0]*r,p[1]*r]);
    polygon(pts,"#686958","#d3bc8d",2.8);
    triangleFacet(-.88*r,-.52*r,-.43*r,-.96*r,-.16*r,-.18*r,"#a2a18a");
    triangleFacet(-.43*r,-.96*r,.23*r,-r,.31*r,-.21*r,"#b2ac8e");
    triangleFacet(.23*r,-r,.76*r,-.67*r,.31*r,-.21*r,"#7e826a");
    triangleFacet(.76*r,-.67*r,r,-.13*r,.15*r,.17*r,"#525f51");
    triangleFacet(-r,.25*r,-.16*r,-.18*r,.12*r,.99*r,"#92917b");
    triangleFacet(.15*r,.17*r,.72*r,.62*r,.12*r,.99*r,"#434d41");
    triangleFacet(-.58*r,.88*r,.12*r,.99*r,-.12*r,.27*r,"#686d5a");
    g.beginPath();g.moveTo(-.54*r,-.58*r);
    g.lineTo(-.12*r,-.28*r);g.lineTo(.12*r,-.39*r);g.lineTo(.36*r,-.12*r);
    g.strokeStyle="#d8c592";g.lineWidth=2.2;g.stroke();
    g.beginPath();g.moveTo(-.29*r,.12*r);
    g.lineTo(-.1*r,.42*r);g.lineTo(.15*r,.48*r);
    g.strokeStyle="#9ac16f";g.lineWidth=3.5;g.stroke();
    // Faceted quartz inclusions distinguish the projectile from plain rocks.
    polygon([[.37*r,-.54*r],[.52*r,-.31*r],[.32*r,-.20*r],[.20*r,-.40*r]],"#bde6a1","#d9edb7",1.1);
    g.restore();
  }
  // Fixed-length stone skeleton. Both elbow and knee positions are solved
  // geometrically: hands/feet can move, but the stone segments NEVER stretch.
  function stoneIK(start,end,upper,lower,bend) {
    const dx=end[0]-start[0],dy=end[1]-start[1],actual=Math.max(.0001,Math.hypot(dx,dy));
    const d=clamp(actual,Math.abs(upper-lower)+.001,upper+lower-.001);
    const ux=dx/actual,uy=dy/actual;
    const forward=(upper*upper-lower*lower+d*d)/(2*d);
    const offset=Math.sqrt(Math.max(0,upper*upper-forward*forward));
    return [start[0]+ux*forward-uy*offset*bend,start[1]+uy*forward+ux*offset*bend];
  }
  function stoneRotate(point,pivot,angle) {
    const dx=point[0]-pivot[0],dy=point[1]-pivot[1];
    return [pivot[0]+dx*Math.cos(angle)-dy*Math.sin(angle),
      pivot[1]+dx*Math.sin(angle)+dy*Math.cos(angle)];
  }
  function earthPose(elapsed,t=0) {
    // One interlocked grip: hands always travel as a single unit.
    // Two-bone IK gives constant stone upper-arm and forearm lengths.
    const emerging=ease(phase(elapsed,EARTH.emergeStart,EARTH.emergeEnd));
    const descent=ease(phase(elapsed,EARTH.crumbleStart,EARTH.crumbleEnd));
    const clasp=ease(phase(elapsed,EARTH.claspStart,EARTH.claspEnd));
    const lift=ease(phase(elapsed,EARTH.liftStart,EARTH.liftEnd));
    const slam=ease(phase(elapsed,EARTH.slamStart,EARTH.slamEnd));
    const settle=ease(phase(elapsed,EARTH.settleStart,EARTH.crumbleStart));
    const base=411+306*(1-emerging)+306*descent;
    const x=504+15*slam*(1-settle*.5);
    const lean=-.09*lift*(1-slam)+.24*slam*(1-settle*.6);
    const pivot=[x,base-83];
    const shoulders=[
      stoneRotate([x-61,base-165],pivot,lean),
      stoneRotate([x+61,base-165],pivot,lean)
    ];
    const hips=[
      stoneRotate([x-36,base-80],pivot,lean),
      stoneRotate([x+36,base-80],pivot,lean)
    ];
    // Clasp at chest height, lift high above the head, smash down in front.
    const fistX=mix(x-2,x+64,slam);
    const fistY=mix(base-142-174*lift,base-13,slam);
    const hands=[[fistX-8,fistY],[fistX+8,fistY]];
    const armUpper=99,armLower=96;
    const elbows=[
      stoneIK(shoulders[0],hands[0],armUpper,armLower,-1),
      stoneIK(shoulders[1],hands[1],armUpper,armLower,1)
    ];
    const feet=[[x-65,base-4],[x+60,base-4]];
    const legUpper=60,legLower=57;
    const knees=[
      stoneIK(hips[0],feet[0],legUpper,legLower,1),
      stoneIK(hips[1],feet[1],legUpper,legLower,-1)
    ];
    return {x,base,pivot,emerging,descent,clasp,lift,slam,settle,lean,
      fistX,fistY,hands,elbows,shoulders,hips,feet,knees,
      armUpper,armLower,legUpper,legLower};
  }
  function stoneLimb(a,b,thickA,thickB,light,shadow) {
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.max(1,Math.hypot(dx,dy));
    const nx=-dy/length,ny=dx/length;
    polygon([
      [a[0]+nx*thickA,a[1]+ny*thickA],
      [b[0]+nx*thickB,b[1]+ny*thickB],
      [b[0]-nx*thickB,b[1]-ny*thickB],
      [a[0]-nx*thickA,a[1]-ny*thickA]
    ],light,"#b2a683",2);
    triangleFacet(a[0]+nx*thickA,a[1]+ny*thickA,
      b[0]+nx*thickB,b[1]+ny*thickB,b[0],b[1],shadow);
  }
  function drawStoneGolem(elapsed,t) {
    const p=earthPose(elapsed,t);
    if(p.emerging<.001||p.descent>.999)return;
    const x=p.x,y=p.base;
    g.save();
    g.beginPath();g.rect(270,-120,480,531);g.clip();
    g.globalAlpha*=1-ease(phase(p.descent,.68,1));
    // Low, broad shadow reinforces his mass; NO random vertical bobbing.
    oval(502,407,92,18,"#151f1695");
    // A clear three-quarter silhouette: planted rear leg, raised leading
    // stone leg, faceted knees and broad feet.
    for(let side=1;side>=0;side--){
      const hip=p.hips[side],knee=p.knees[side],foot=p.feet[side];
      stoneLimb(hip,knee,24,20,side===0?"#829078":"#697961","#495a46");
      oval(knee[0],knee[1],18,17,side===0?"#8c9576":"#74826d","#c7bf9e",1.2);
      stoneLimb(knee,foot,21,17,side===0?"#9aa58b":"#727d68","#55624d");
      g.save();g.translate(foot[0],foot[1]);g.rotate(side===0?-.21*p.footLift:0);
      polygon([[-27,-8],[7,-12],[30,-1],[19,9],[-27,8]],
        side===0?"#84957c":"#6d806a","#c7bea1",2);
      triangleFacet(-27,-8,7,-12,6,3,"#b8b89b");
      g.restore();
    }
    // Far arms and massive faceted elbow hinges.
    for(let side=1;side>=0;side--){
      const shoulder=p.shoulders[side],elbow=p.elbows[side],hand=p.hands[side];
      stoneLimb(shoulder,elbow,21,17,side===0?"#798b73":"#63765e","#425742");
      oval(elbow[0],elbow[1],18,17,"#8d977d","#cfc8a7",1.4);
      stoneLimb(elbow,hand,17,12,side===0?"#a3ab90":"#7b8e76","#526a52");
    }
    // One connected pelvis / chest / head: all rotate together through the
    // same hip pivot, so charging with the spine does not stretch the stone.
    g.save();
    g.translate(p.pivot[0],p.pivot[1]);g.rotate(p.lean);
    g.translate(-p.pivot[0],-p.pivot[1]);
    // Pelvis
    polygon([[x-44,y-90],[x+43,y-91],[x+48,y-58],[x+23,y-43],[x-26,y-45],[x-48,y-63]],
      "#5d735a","#b6b697",2);
    triangleFacet(x-43,y-88,x+10,y-81,x-25,y-48,"#849076");
    triangleFacet(x+10,y-81,x+45,y-86,x+25,y-48,"#405946");
    // Large trapezoidal chest with crystalline moss seams
    polygon([[x-74,y-161],[x-35,y-193],[x+33,y-194],[x+74,y-162],
      [x+67,y-109],[x+48,y-77],[x-51,y-77],[x-69,y-110]],
      "#647862","#beb899",3);
    triangleFacet(x-74,y-159,x-35,y-191,x-12,y-123,"#a5b093");
    triangleFacet(x-35,y-192,x+34,y-193,x+6,y-128,"#8e9f86");
    triangleFacet(x+34,y-193,x+73,y-162,x+37,y-118,"#4e6651");
    triangleFacet(x-70,y-110,x-12,y-126,x-51,y-79,"#758d70");
    triangleFacet(x+6,y-127,x+67,y-109,x+46,y-80,"#435e4b");
    polygon([[x-22,y-141],[x+2,y-156],[x+28,y-140],[x+16,y-116],
      [x-12,y-115]],"#3c5942","#9baf7c",1.1);
    polygon([[x-11,y-139],[x+3,y-146],[x+19,y-138],[x+14,y-126],[x-9,y-127]],
      "#afd58a","#e6f5b9",1.5);
    // Shoulder blocks are angular, not organic muscle shapes.
    polygon([[x-91,y-179],[x-64,y-207],[x-28,y-189],[x-30,y-153],[x-76,y-145]],
      "#869578","#d1c6a2",2.6);
    triangleFacet(x-87,y-181,x-63,y-204,x-57,y-153,"#c0c5a3");
    polygon([[x+58,y-207],[x+92,y-179],[x+81,y-145],[x+31,y-152],[x+29,y-187]],
      "#728b72","#c6c4a3",2.6);
    triangleFacet(x+60,y-205,x+90,y-179,x+59,y-160,"#9daf8e");
    // Distinctive overhanging stone brow, prominent forward/right nose,
    // and angular jaw so he faces the TARGET instead of staring front.
    polygon([[x-34,y-215],[x-30,y-269],[x-1,y-290],[x+28,y-278],
      [x+44,y-246],[x+55,y-235],[x+42,y-225],[x+28,y-197],[x-24,y-194]],
      "#82937d","#d5caa4",2.8);
    triangleFacet(x-32,y-268,x-1,y-288,x-6,y-247,"#bac3a4");
    triangleFacet(x-1,y-287,x+28,y-278,x+16,y-251,"#d0caad");
    triangleFacet(x+29,y-277,x+44,y-246,x+22,y-228,"#5e7968");
    triangleFacet(x+27,y-210,x+55,y-235,x+37,y-221,"#a7ae94");
    polygon([[x-34,y-248],[x-20,y-260],[x+14,y-259],[x+33,y-247],
      [x+35,y-237],[x-31,y-236]],"#485f4d");
    polygon([[x-23,y-246],[x-7,y-248],[x-7,y-241],[x-22,y-239]],"#c4f9a1");
    polygon([[x+12,y-246],[x+29,y-243],[x+29,y-237],[x+12,y-240]],"#c4f9a1");
    polygon([[x-19,y-211],[x+25,y-209],[x+31,y-220],[x+4,y-217]],
      "#5b735c","#aab99a",1.7);
    // Back crystal shards give an ancient, magical Earth silhouette.
    polygon([[x-47,y-194],[x-57,y-224],[x-31,y-206]],"#9dc48a");
    polygon([[x+41,y-186],[x+58,y-219],[x+63,y-183]],"#7ca67a");
    g.restore();
    // The boulder is OVER/BEHIND the head at the loaded pose, held by BOTH
    // hands. Its centre is never a detached, independently floating object.
    if(elapsed<EARTH.launch)
      drawBoulder(p.rockX,p.rockY,51,
        -p.load*.18 + p.drive*.33);
    // Visible wrist/knuckle blocks firmly cup the sides of the same rock.
    for(let side=0;side<2;side++){
      const hand=p.hands[side];
      polygon([[hand[0]-13,hand[1]-12],[hand[0]+13,hand[1]-11],
        [hand[0]+15,hand[1]+12],[hand[0]-9,hand[1]+14]],
        side===0?"#b5b99d":"#969f87","#dfd5b4",1.9);
      triangleFacet(hand[0]-11,hand[1]-10,hand[0]+10,hand[1]-10,
        hand[0]+1,hand[1]+5,side===0?"#d8ceae":"#adb99c");
    }
    g.restore();
  }

  function drawEarthPortal(elapsed,t) {
    const emerge=ease(phase(elapsed,.05,EARTH.emergeEnd));
    const fade=1-ease(phase(elapsed,EARTH.crumbleStart,EARTH.crumbleEnd));
    if(emerge<=.01||fade<=.01)return;
    const x=502,y=410;
    g.save();g.globalAlpha=emerge*fade;
    glow(x,y,115,"#9eca6a30");
    oval(x,y+1,146,35,"#383b2a90","#bea86f",2.6);
    oval(x,y,115,26,"#47422e72","#a8bb74",2);
    // Earth cracks radiate from the golem's emergence, not a water whirlpool.
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6+t*.015;
      const dx=Math.cos(a),dy=Math.sin(a)*.28;
      line(x+dx*45,y+dy*40,x+dx*(84+(i%3)*18),y+dy*(90+(i%3)*15),
           i%3?"#9f9e6e":"#d9ca8a",2.5);
    }
    g.restore();
  }
  function drawEarthProjectile(elapsed,t) {
    if(elapsed<EARTH.launch||elapsed>=EARTH.hit)return;
    const p=phase(elapsed,EARTH.launch,EARTH.hit); // decisive release
    const source=earthPose(EARTH.launch,t-(elapsed-EARTH.launch));
    const x=mix(source.rockX,783,p);
    const y=mix(source.rockY,286,p)-Math.sin(Math.PI*p)*22;
    const q=Math.max(0,p-.21);
    const trailX=mix(source.rockX,783,q);
    const trailY=mix(source.rockY,286,q)-Math.sin(Math.PI*q)*22;
    g.save();g.globalCompositeOperation="lighter";
    line(trailX,trailY,x,y,"#ddc59c6b",21);
    glow(x,y,44,"#dfe9b337");
    g.restore();
    drawBoulder(x,y,51,-.18+p*5.4);
  }

  function drawEarthImpact(elapsed) {
    if(elapsed<EARTH.hit||elapsed>EARTH.hit+1.03)return;
    const p=phase(elapsed,EARTH.hit,EARTH.hit+1.03);
    const alpha=1-ease(p),x=784,y=287;
    g.save();g.globalAlpha=alpha;
    glow(x,y,175*(1-p)+20,"#c8d5878c");
    // Jagged chunks of stone instead of a watery splash.
    for(let i=0;i<15;i++){
      const a=i*Math.PI*2/15+.37;
      const dis=23+p*(125+(i%3)*26);
      const cx=x+Math.cos(a)*dis,cy=y+Math.sin(a)*dis;
      g.save();g.translate(cx,cy);g.rotate(a+p*3);
      polygon([[-8,-6],[1,-15],[13,-4],[9,10],[-5,11]],
        i%2===0?"#d3c499":"#879274","#e2d9af",1.3);
      g.restore();
    }
    for(let i=0;i<3;i++)
      oval(x,390,30+p*(90+i*21),9+p*(29+i*7),null,
        i%2?"#b5ae77":"#ded3a1",4-i*.7);
    g.restore();
    if(p<.94){
      g.save();g.globalAlpha=1-ease(phase(elapsed,EARTH.hit+.63,EARTH.hit+1));
      g.font="bold 53px Georgia,serif";g.textAlign="center";
      g.lineWidth=6;g.strokeStyle="#292916";g.shadowBlur=12;g.shadowColor="#dff6a4";
      g.strokeText("-900",x,214-52*ease(p));
      g.fillStyle="#fbefd3";g.fillText("-900",x,214-52*ease(p));g.restore();
    }
  }
  function drawEarthSummon(elapsed,t) {
    drawEarthPortal(elapsed,t);
    drawStoneGolem(elapsed,t);
  }

  function drawForeground(t){
    // Cracked stone foreground gives the scene depth.
    polygon([[0,482],[162,471],[319,492],[495,479],[633,494],[845,468],[1000,475],[1000,560],[0,560]],"#0b1825");
    polygon([[0,485],[162,475],[319,495],[495,482],[633,498],[845,471],[1000,478],[1000,502],[839,499],[632,514],[496,500],[320,512],[155,496],[0,508]],"#263b48");
    polygon([[0,505],[158,496],[322,512],[499,499],[630,514],[840,498],[1000,502],[1000,560],[0,560]],"#101e2d");
    for(let i=0;i<18;i++){
      const x=i*60-15,y=493+Math.sin(i*2.33)*6;
      line(x,y,x+25,y+7,"#4b6471",1.4);
    }
    // light mist
    g.save();g.globalAlpha=.14+.05*Math.sin(t*.7);
    const mist=g.createLinearGradient(0,475,0,560);mist.addColorStop(0,"#65d0d100");mist.addColorStop(1,"#367e9a");
    g.fillStyle=mist;g.fillRect(0,475,W,85);g.restore();
  }

  function applyShake(elapsed) {
    const strikeTime=cast&&cast.type==="stone"?EARTH.hit:SPELL.hit;
    if(elapsed<strikeTime||elapsed>strikeTime+.4)return;
    const strength=12*(1-phase(elapsed,strikeTime,strikeTime+.4));
    // Deterministic easing prevents random full-scene teleporting/flicker.
    g.translate(Math.sin(elapsed*98)*strength*.57,Math.sin(elapsed*112)*strength*.32);
  }

  function render(t){
    const scaleX=canvas.width/W,scaleY=canvas.height/H;
    g.setTransform(scaleX,0,0,scaleY,0,0);
    g.save();
    if(cast)applyShake(cast.elapsed);
    drawSky(t);
    drawArena(t);
    drawWizard(t);
    if(cast) {
      if(cast.type==="stone")drawEarthSummon(cast.elapsed,t);
      else drawSummon(t,cast.elapsed);
    }
    drawSentinel(t);
    if(cast) {
      if(cast.type==="stone") {
        drawEarthProjectile(cast.elapsed,t);
        drawEarthImpact(cast.elapsed);
      } else {
        drawProjectile(cast.elapsed,t);
        drawImpact(cast.elapsed);
      }
    }
    drawParticles();
    drawForeground(t);
    g.restore();
  }

  function tone(frequency,durationSecs,type="sine",volume=.13,to=undefined){
    if(!sound)return;
    try{
      const A=window.AudioContext||window.webkitAudioContext;
      if(!A)return;
      if(!audio)audio=new A();
      if(audio.state==="suspended")audio.resume();
      const oscillator=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
      oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,now);
      if(to)oscillator.frequency.exponentialRampToValueAtTime(Math.max(25,to),now+durationSecs);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.023);
      gain.gain.exponentialRampToValueAtTime(.0001,now+durationSecs);
      oscillator.connect(gain);gain.connect(audio.destination);
      oscillator.start(now);oscillator.stop(now+durationSecs+.01);
    }catch(err){console.warn("Sound unavailable",err);}
  }
  function noise(durationSecs=.3,volume=.06){
    if(!sound)return;
    try{
      if(!audio){tone(80,.02);if(!audio)return;}
      const sampleRate=audio.sampleRate,buffer=audio.createBuffer(1,Math.floor(sampleRate*durationSecs),sampleRate);
      const channel=buffer.getChannelData(0);
      for(let i=0;i<channel.length;i++)channel[i]=(Math.random()*2-1)*(1-i/channel.length);
      const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
      source.buffer=buffer;filter.type="lowpass";filter.frequency.value=1100;gain.gain.value=volume;
      source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();
    }catch(err){console.warn("Sound unavailable",err);}
  }
  function playEffect(name){
    if(name==="cast"){tone(140,1.1,"sawtooth",.08,60);tone(380,.8,"sine",.11,110);noise(.48,.035);}
    else if(name==="rise"){tone(90,1.5,"triangle",.12,300);tone(180,1.3,"sine",.07,520);}
    else if(name==="wind"){tone(300,.4,"sawtooth",.075,700);}
    else if(name==="throw"){tone(800,.5,"sawtooth",.08,125);noise(.3,.065);}
    else if(name==="hit"){tone(105,.9,"sawtooth",.17,45);tone(620,.35,"square",.05,100);noise(.8,.18);}
    else if(name==="sink"){tone(300,1.3,"sine",.085,55);noise(.7,.04);}
    else if(name==="earthCast"){tone(97,.38,"triangle",.095,60);noise(.5,.07);}
    else if(name==="stoneRise"){tone(80,.48,"sawtooth",.08,125);noise(.60,.10);}
    else if(name==="stoneLift"){tone(125,.6,"triangle",.065,185);noise(.4,.035);}
    else if(name==="stoneThrow"){tone(270,.33,"sawtooth",.06,75);noise(.28,.08);}
    else if(name==="stoneHit"){tone(62,.75,"sawtooth",.15,35);noise(.68,.20);}
    else if(name==="stoneSink"){tone(138,.6,"triangle",.08,50);noise(.7,.10);}
  }

  function refreshUI() {
    const spell=SPELLS[selectedSpell];
    UI.manaText.textContent=mana+" / 8";
    UI.manaPips.innerHTML="";
    for(let i=0;i<8;i++){
      const pip=document.createElement("span");
      pip.className="mana-pip"+(i>=mana?" spent":"");
      UI.manaPips.appendChild(pip);
    }
    UI.manaPips.setAttribute("aria-label",mana+" of 8 mana");
    UI.round.textContent="ROUND "+round;
    UI.hpText.textContent=health.toLocaleString()+" / "+MAX_HP.toLocaleString()+" HP";
    UI.hpFill.style.width=(health/MAX_HP*100)+"%";
    UI.card.setAttribute("aria-pressed",String(selectedSpell==="poseidon"));
    UI.golemCard.setAttribute("aria-pressed",String(selectedSpell==="stone"));
    if(selectedSpell==="poseidon"){
      UI.card.classList.add("selected");UI.golemCard.classList.remove("selected");
    }else{
      UI.golemCard.classList.add("selected");UI.card.classList.remove("selected");
    }
    UI.card.disabled=!!cast||defeated;
    UI.golemCard.disabled=!!cast||defeated;
    UI.spellSchool.textContent="SUMMONING SPELL · "+spell.school.toUpperCase()+" SCHOOL";
    UI.spellName.textContent=spell.name;
    UI.spellSummary.textContent=spell.summary;
    UI.spellCost.textContent=spell.cost+" Mana";
    UI.spellDamage.textContent=spell.damage.toLocaleString()+" HP";
    UI.spellTarget.textContent="Single enemy";
    UI.cast.disabled=!!cast||defeated||mana<spell.cost;
    UI.castText.textContent=cast?"SPELL IN PROGRESS":defeated?"TARGET DEFEATED":"CAST "+spell.name.toUpperCase();
  }
  function chooseSpell(type) {
    if(cast||defeated||!SPELLS[type])return;
    selectedSpell=type;
    UI.status.textContent=SPELLS[type].name+" selected.";
    UI.hint.textContent=type==="stone"?"Tap Cast to summon an Earth golem.":"Tap Cast to summon Poseidon.";
    UI.caption.textContent=type==="stone"?"EARTH SCHOOL · STONE GOLEM":"WATER SCHOOL · POSEIDON'S WRATH";
    refreshUI();
  }

  function reset() {
    cast=null;particles.length=0;sprayCarry=0;goldCarry=0;earthCarry=0;
    health=MAX_HP;mana=8;round=1;targeted=true;selectedSpell="poseidon";
    defeated=false;targetPulse=0;
    UI.win.hidden=true;
    UI.winFlavor.textContent="The elements answer your call.";
    UI.state.textContent="READY TO CAST";
    UI.caption.textContent="Choose Water or Earth magic.";
    UI.status.textContent="Select a card, then Cast.";
    UI.hint.textContent="Choose Poseidon's Wrath or Stone Golem.";
    refreshUI();
  }

  function startCast() {
    const spell=SPELLS[selectedSpell];
    if(cast||defeated||mana<spell.cost)return;
    if(sound)tone(440,.04,"sine",.001);
    mana-=spell.cost;
    cast={type:selectedSpell,elapsed:0,stage:"opening",hit:false};
    UI.state.textContent="SUMMONING";
    UI.status.textContent=spell.start;
    UI.caption.textContent=spell.caption;
    UI.hint.textContent=spell.hint;
    playEffect(selectedSpell==="stone"?"earthCast":"cast");
    refreshUI();
  }

  function stageAt(e,type) {
    if(type==="stone"){
      if(e<EARTH.emergeStart)return "opening";
      if(e<EARTH.liftStart)return "rise";
      if(e<EARTH.braceStart)return "lift";
      if(e<EARTH.releaseStart)return "brace";
      if(e<EARTH.launch)return "wind";
      if(e<EARTH.hit)return "throw";
      if(e<EARTH.crumbleStart)return "impact";
      if(e<EARTH.crumbleEnd)return "sink";
      return "complete";
    }
    if(e<.8)return "opening";
    if(e<SPELL.aimStart)return "rise";
    if(e<SPELL.windStart)return "aim";
    if(e<SPELL.launch)return "wind";
    if(e<SPELL.hit)return "throw";
    if(e<SPELL.sinkStart)return "impact";
    if(e<SPELL.sinkEnd)return "sink";
    return "complete";
  }
  function setStage(stage,type) {
    const earth=type==="stone";
    const stages=earth?{
      opening:["EARTH AWAKENS","Cracks race across the arena floor."],
      rise:["STONE GOLEM SUMMONED","An ancient Earth guardian rises!"],
      lift:["HEAVY OVERHEAD LIFT","The golem bends both elbows and hauls the boulder upward."],
      brace:["CHARGING THE THROW","It leans back, lifts its left foot and draws the boulder behind its head."],
      wind:["DRIVING FORWARD","The lead foot plants, hips drive, and both arms whip overhead!"],
      throw:["BOULDER RELEASED","The spinning boulder rockets straight toward the Sentinel!"],
      impact:["CRUSHING IMPACT","Stone Sentinel takes 900 Earth damage!"],
      sink:["CRUMBLING AWAY","The golem returns to the earth."],
      complete:["EARTH SPELL COMPLETE","The ground grows still."]
    }:{
      opening:["THE SEA STIRS","The ocean begins to turn..."],
      rise:["POSEIDON RISES","The sea god surges from the towering wave!"],
      aim:["TRIDENT AIMED","The raised trident points at the Sentinel."],
      wind:["WINDING UP","His hand draws back; the trident stays aimed."],
      throw:["TRIDENT RELEASED","The trident tears toward the enemy!"],
      impact:["DEVASTATING IMPACT","The Stone Sentinel takes 1,200 water damage!"],
      sink:["UNSUMMONING","Poseidon dissolves into the collapsing wave."],
      complete:["SPELL COMPLETE","The waters grow still."]
    };
    UI.state.textContent=stages[stage][0];
    UI.status.textContent=stages[stage][1];
    if(earth){
      if(stage==="rise")playEffect("stoneRise");
      if(stage==="lift")playEffect("stoneLift");
      if(stage==="throw")playEffect("stoneThrow");
      if(stage==="impact")playEffect("stoneHit");
      if(stage==="sink")playEffect("stoneSink");
    }else{
      if(stage==="rise")playEffect("rise");
      if(stage==="aim")playEffect("wind");
      if(stage==="throw")playEffect("throw");
      if(stage==="impact")playEffect("hit");
      if(stage==="sink")playEffect("sink");
    }
  }

  function completeCast() {
    const type=cast.type,spell=SPELLS[type];
    cast=null;mana=8;round++;
    if(health<=0){
      defeated=true;UI.win.hidden=false;UI.state.textContent="VICTORY";
      UI.winFlavor.textContent=type==="stone"?"The earth rests after a mighty blow.":"The sea reclaims its champion.";
      UI.caption.textContent=spell.caption+" · VICTORY";
      UI.status.textContent="The Stone Sentinel has fallen.";
      UI.hint.textContent="Victory! Restart to test another spell.";
    }else{
      UI.state.textContent="READY TO CAST";
      UI.caption.textContent=type==="stone"?"The earth settles. Choose your next spell.":"The waters are calm. Choose your next spell.";
      UI.status.textContent=spell.finish;
      UI.hint.textContent="Mana restored. Choose either card for your next spell.";
    }
    refreshUI();
  }
  let sprayCarry=0,goldCarry=0,earthCarry=0;
  function spawnTimed(kind, rate, x, y, width, height, scale) {
    let carry=kind==="spray"?sprayCarry:goldCarry;
    carry+=rate;
    for(;carry>=1;carry--)addParticle(x+rand(-width,width),y-rand(0,height),kind,scale);
    if(kind==="spray")sprayCarry=carry;else goldCarry=carry;
  }

  function update(dt) {
    targetPulse=Math.max(0,targetPulse-dt*1.4);
    if(!cast){updateParticles(dt);return;}
    const type=cast.type,earth=type==="stone",timing=earth?EARTH:SPELL;
    const spellDt=dt*speed*DEFAULT_SPELL_RATE;
    cast.elapsed+=spellDt;
    const stage=stageAt(cast.elapsed,type);
    if(stage!==cast.stage){cast.stage=stage;setStage(stage,type);}
    if(!cast.hit&&cast.elapsed>=timing.hit){
      cast.hit=true;
      health=Math.max(0,health-SPELLS[type].damage);
      targetPulse=1.3;
      refreshUI();
      if(earth){
        for(let i=0;i<72;i++)addParticle(785+rand(-24,24),300+rand(-25,40),"rock",rand(.7,1.8));
        for(let i=0;i<34;i++)addParticle(785+rand(-30,30),311+rand(-12,33),"dust",rand(.55,1.35));
      }else{
        for(let i=0;i<82;i++)addParticle(785+rand(-26,26),310+rand(-22,44),"impact",rand(.5,1.8));
        for(let i=0;i<16;i++)addParticle(785,310,"gold",rand(.8,1.2));
      }
    }
    if(earth){
      if(cast.elapsed>EARTH.emergeStart&&cast.elapsed<EARTH.liftEnd){
        earthCarry+=25*spellDt;
        while(earthCarry>=1){
          earthCarry--;
          addParticle(502+rand(-86,86),409+rand(-8,4),"dust",.45);
        }
      }
    }else{
      if(cast.elapsed>SPELL.riseStart&&cast.elapsed<SPELL.sinkEnd)
        spawnTimed("spray",33*spellDt,505,399,140,80,.45);
      if(cast.elapsed>=SPELL.launch&&cast.elapsed<SPELL.hit)
        spawnTimed("gold",35*spellDt,700,245,85,36,.45);
    }
    if(cast.elapsed>=timing.end)completeCast();
    updateParticles(spellDt);
  }

  function resize(){
    const rect=canvas.getBoundingClientRect();
    // Avoid expensive 4x pixel redraws on high-DPI phones.
    const dpr=Math.min(window.devicePixelRatio||1,rect.width<720?1.5:2);
    const width=Math.max(1,Math.round(rect.width*dpr));
    const height=Math.max(1,Math.round(rect.height*dpr));
    // Reassigning canvas.width/height clears its drawing surface and can
    // retrigger layout/ResizeObserver even when dimensions are identical.
    if(canvas.width!==width)canvas.width=width;
    if(canvas.height!==height)canvas.height=height;
  }
  function selectEnemy(event){
    if(defeated||cast)return;
    const box=canvas.getBoundingClientRect();
    const x=(event.clientX-box.left)/box.width*W;
    const y=(event.clientY-box.top)/box.height*H;
    if(x>650&&x<920&&y>155&&y<454){
      targeted=true;targetPulse=1;
      UI.status.textContent="Stone Sentinel targeted.";
      UI.hint.textContent="Target acquired. Cast Poseidon's Wrath!";
      tone(640,.17,"sine",.05,350);
    }
  }
  UI.cast.addEventListener("click",startCast);
  UI.card.addEventListener("click",()=>chooseSpell("poseidon"));
  UI.golemCard.addEventListener("click",()=>chooseSpell("stone"));
  UI.reset.addEventListener("click",reset);
  UI.winReplay.addEventListener("click",reset);
  UI.speed.addEventListener("click",()=>{
    speed=speed===1?2:1;UI.speed.textContent="Speed: "+speed+"×";
  });
  UI.sound.addEventListener("click",()=>{
    sound=!sound;UI.soundLabel.textContent=sound?"ON":"OFF";
    UI.sound.setAttribute("aria-pressed",String(sound));
    if(sound)tone(660,.16,"sine",.03,880);
  });
  canvas.addEventListener("pointerdown",selectEnemy);
  window.addEventListener("resize",resize);
  // Observe the stable arena parent, never the canvas we resize inside it.
  if(window.ResizeObserver)new ResizeObserver(resize).observe(document.getElementById("arena"));
  resize();reset();
  function frame(now){
    // Render a fresh interpolated pose every display refresh, including 120 Hz.
    // Use elapsed time, so additional in-between frames do not slow the spell.
    const dt=Math.min(Math.max(0,(now-previousTime)/1000),.04);
    previousTime=now;totalTime+=dt;
    update(dt);render(totalTime);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
