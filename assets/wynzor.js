(() => {
  const atlas = new Image();
  atlas.src = "./assets/wynzor.webp?v=0.277.5";
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => { const q = clamp(n); return q * q * (3 - 2 * q); };
  const transitions = new Image();
  transitions.src = "./assets/wynzor-transitions.webp?v=0.277.5";
  const landing = .200;
  const chargeStart = .615;
  const release = .815;
  const poses = [
    [0,0],[.027,16],[.052,17],[.077,1],[.099,18],[.118,19],[.142,2],[.161,3],
    [.180,20],[landing,4],[.219,21],[.241,5],[.260,22],
    [.281,6],[.309,24],[.340,23],[.374,7],
    [.415,25],[.439,9],[.465,26],[.486,10],[.507,31],
    [.551,28],[.574,27],[.592,29],[chargeStart,30],
    [release,12],[.876,13],[.908,14],[.95,15]
  ];
  // The windup uses an unlit mouth cel. Its glow grows independently.
  const chargeMouth = [.15,.76];
  const releaseMouth = [.33,.54];
  const colors = ["#eafff5","#b9f4e2","#65baa8","#67d5c2"];

  function tile(g, frame, size) {
    if (!atlas.naturalWidth) return;
    const sheet = frame >= 16 && transitions.naturalWidth ? transitions : atlas;
    const index = frame >= 16 && sheet === atlas ? [0,0,1,1,3,4,5,6,6,7,7,8,9,10,11,11][frame-16] : frame%16;
    const cell = sheet.naturalWidth / 4;
    g.drawImage(sheet, index % 4 * cell, Math.floor(index / 4) * cell,
      cell, cell, -size/2, -size, size, size);
  }

  function scene(target, p, hit) {
    const side = target.team ? 1 : -1;
    const floor = Math.max(335, Math.min(529, target.y + 8));
    const x = 500 - side * 56;
    const size = 302 + (floor - 335) * .23;
    const descent = ease(p/landing);
    const pose = poses.findLastIndex(([at]) => p >= at);
    const [at, frame] = poses[pose];
    const blend = pose > 0 && p < release ? ease((p-at)/.014) : 1;
    return {
      p, hit, side, floor, size, frame, blend, previousFrame: poses[Math.max(0,pose-1)][1],
      x: x - side * 126 * (1-descent), y: floor - 270 * (1-descent),
      originX: x + side * size*releaseMouth[0], originY: floor - size*releaseMouth[1],
      endX: target.x, endY: target.y - 93
    };
  }

  function shard(g, x, y, dx, dy, width, color) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x+dx,y+dy);
    g.lineTo(x-dy*width,y+dx*width);
    g.lineTo(x-dx*.66,y-dy*.66);
    g.lineTo(x+dy*width,y-dx*width);
    g.closePath();
    g.fill();
  }

  let poseBuffer;
  function actor(g, s) {
    const { x, y, floor, size, side, p, frame } = s;
    const fade = 1 - ease((p-.94)/.06);
    g.save();
    g.globalAlpha *= fade;
    g.fillStyle = "#182e34";
    g.beginPath();
    g.ellipse(x, floor-5, size*.25, size*.046, 0, 0, 2*Math.PI);
    g.fill();
    g.save();
    g.translate(x,y);
    g.scale(side,1);
    if (s.blend < 1) {
      // Mix premultiplied frames once so overlapping opaque pixels stay opaque.
      if (!poseBuffer) {
        poseBuffer = document.createElement("canvas");
        poseBuffer.width = poseBuffer.height = 256;
      }
      const mix = poseBuffer.getContext("2d");
      mix.setTransform(1,0,0,1,0,0);
      mix.clearRect(0,0,256,256);
      mix.translate(128,256);
      mix.globalCompositeOperation = "source-over";
      mix.globalAlpha = 1-s.blend;
      tile(mix,s.previousFrame,256);
      mix.globalCompositeOperation = "lighter";
      mix.globalAlpha = s.blend;
      tile(mix,frame,256);
      g.drawImage(poseBuffer,-size/2,-size,size,size);
    } else tile(g,frame,size);
    g.restore();
    if (p >= landing && p < landing+.13) {
      const q = (p-landing)/.13;
      g.globalAlpha *= (1-q)**2;
      for (let i=0; i<16; i++) {
        const a=i*2.39996, r=16+q*(52+i%5*14);
        shard(g,x+Math.cos(a)*r,floor-5+Math.sin(a)*r*.23,
          Math.cos(a)*10,Math.sin(a)*4,.36,"#92b4b0");
      }
    }
    g.restore();
  }

  function blast(g, s) {
    const { p, hit, originX, originY, endX, endY, side, size } = s;
    if (p < chargeStart || p >= hit+.15) return;
    g.save();
    if (p < release) {
      const charge = clamp((p-chargeStart)/(release-chargeStart));
      const [mouthOffset, mouthHeight] = chargeMouth;
      const mouthX = s.x + side*size*mouthOffset;
      const mouthY = s.floor - size*mouthHeight;
      g.globalAlpha *= Math.min(1,charge*1.7);
      const radius = 2+charge**1.35*33;
      const glow = g.createRadialGradient(mouthX,mouthY,0,mouthX,mouthY,radius*1.5);
      glow.addColorStop(0,"#f4fff5");
      glow.addColorStop(.45,"#92f3d8b0");
      glow.addColorStop(1,"#61d9bf00");
      g.fillStyle = glow;
      g.fillRect(mouthX-radius*1.5,mouthY-radius*1.5,radius*3,radius*3);
      for (let i=0; i<14; i++) {
        const a = i*2.39996 - p*62;
        const r = radius*(.55+((i*.381-p*14)%1+1)%1);
        shard(g,mouthX+Math.cos(a)*r,mouthY+Math.sin(a)*r*.73,
          Math.sin(a)*9*charge,-Math.cos(a)*9*charge,.22,colors[i%4]);
      }
    } else if (p < hit) {
      const q = clamp((p-release)/(hit-release));
      const dx=endX-originX,dy=endY-originY,length=Math.hypot(dx,dy)||1;
      const nx=-dy/length,ny=dx/length;
      const frontX=originX+dx*q,frontY=originY+dy*q;
      const width=18+q*43,tail=Math.max(0,q-.68);
      const tailX=originX+dx*tail,tailY=originY+dy*tail;
      g.globalAlpha*=.49;
      g.fillStyle="#a5f3de";
      g.beginPath();
      g.moveTo(tailX,tailY);
      g.quadraticCurveTo(frontX-dx*.16+nx*width,frontY-dy*.16+ny*width,
        frontX+nx*width*.48,frontY+ny*width*.48);
      g.quadraticCurveTo(frontX+dx*.09,frontY+dy*.09,
        frontX-nx*width*.48,frontY-ny*width*.48);
      g.quadraticCurveTo(frontX-dx*.21-nx*width,frontY-dy*.21-ny*width,tailX,tailY);
      g.fill();
      for(let i=0;i<36;i++){
        const back=i/42,front=q-back;
        if(front<0)continue;
        const a=front*15-p*103+i*2.39996;
        const ring=(11+front*35)*(1-back*.68);
        const px=originX+dx*front+nx*Math.cos(a)*ring;
        const py=originY+dy*front+ny*Math.cos(a)*ring;
        g.globalAlpha=.45+(1-back)*.45;
        shard(g,px,py,dx/length*(15+i%5*6),dy/length*(15+i%5*6)+Math.sin(a)*7,.26,colors[i%4]);
      }
    } else {
      const q = (p-hit)/.15;
      g.globalAlpha *= (1-q)**1.5;
      for(let i=0;i<30;i++){
        const a=i*2.39996+q*.8,r=(19+108*q**.66)*(.65+(i%5)*.10);
        shard(g,endX+Math.cos(a)*r,endY+Math.sin(a)*r*.82,
          Math.cos(a)*(20+i%4*6),Math.sin(a)*(14+i%4*5),.28,colors[i%4]);
      }
    }
    g.restore();
  }

  window.Wynzor = {
    scene, actor, blast,
    portrait(g,w,h) {
      g.save();
      g.translate(w/2,h*.92);
      tile(g,7,Math.min(w,h)*.97);
      g.restore();
    },
    onReady(fn) {
      if (atlas.naturalWidth) fn();
      else atlas.addEventListener("load",fn,{once:true});
    }
  };
})();
