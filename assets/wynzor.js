(() => {
  const atlas = new Image();
  atlas.src = "./assets/wynzor.webp?v=0.277.3";
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => { const q = clamp(n); return q * q * (3 - 2 * q); };
  const transitions = new Image();
  transitions.src = "./assets/wynzor-transitions.webp?v=0.277.3";
  const poses = [
    [0,0],[.035,16],[.067,17],[.100,1],[.128,18],[.153,19],[.183,2],[.208,3],
    [.232,20],[.258,4],[.283,21],[.310,5],[.335,22],[.362,23],
    [.390,6],[.421,24],[.453,7],[.486,25],[.519,8],[.550,26],
    [.575,27],[.602,28],[.625,9],[.653,29],[.685,10],[.721,30],
    [.754,11],[.786,31],[.815,12],[.876,13],[.908,14],[.95,15]
  ];
  const release = .815;
  // In-jaw anchor coordinates within each windup and release cel.
  const mouth = {
    29:[.19,.72],10:[.23,.65],30:[.15,.76],
    11:[.21,.66],31:[.23,.64],12:[.33,.54]
  };
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
    const descent = ease(p/.258);
    const frame = poses.findLast(([at]) => p >= at)[1];
    return {
      p, hit, side, floor, size, frame,
      x: x - side * 126 * (1-descent), y: floor - 270 * (1-descent),
      originX: x + side * size*mouth[12][0], originY: floor - size*mouth[12][1],
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
    tile(g, frame, size);
    g.restore();
    if (p >= .258 && p < .404) {
      const q = (p-.258)/.146;
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
    const { p, hit, originX, originY, endX, endY, side, size, frame } = s;
    if (p < .653 || p >= hit+.15) return;
    g.save();
    if (p < release) {
      const charge = ease((p-.653)/(release-.653));
      const [mouthOffset, mouthHeight] = mouth[frame];
      const mouthX = s.x + side*size*mouthOffset;
      const mouthY = s.floor - size*mouthHeight;
      const radius = 5+charge*27;
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
          Math.sin(a)*9,-Math.cos(a)*9,.22,colors[i%4]);
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
