/* Wizardry v0.42 — restore the original approved 16-pose Stone Golem.
   The golem is a character, NOT the projectile. The looping rock-front and
   impact are separate exported transparent textures. No procedural spikes,
   repeated slam frames as rocks, or model substitutions. */
(function(root){"use strict";
  const GROUND={x:500,y:470},SLAM_FRAMES=16,TRAVEL_FRAMES=8,IMPACT_FRAMES=8;
  const slamKeyframes=[
    [0,0],[115,1],[230,2],[345,3], // original emergence
    [465,4],[615,5],                // ORIGINAL clasped hands
    [755,6],[920,7],                // wind-up / both fists over head
    [1010,8],[1095,9],[1190,10],[1265,11], // fists SLAM
    [1350,12],[1445,13]            // stand back up
  ];
  const travelAtlas=new Image(),impactAtlas=new Image();
  travelAtlas.decoding="async";impactAtlas.decoding="async";
  travelAtlas.src="./assets/golem-fissure-travel-v42.webp";
  impactAtlas.src="./assets/golem-fissure-impact-v42.webp";
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
  const good=im=>im?.complete&&im.naturalWidth>0;
  function originalPose(ctx,rows,frame,target,alpha=1,bob=0){
    const row=Math.floor(frame/4),col=frame%4,im=rows?.[row];
    if(!good(im))return false;
    const edges=[0,314,627,940,1254],h=row===0||row===3?314:313;
    const flip=target&&target.x<GROUND.x;
    ctx.save();ctx.globalAlpha*=alpha;
    if(flip){ctx.translate(2*GROUND.x,0);ctx.scale(-1,1);}
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    // The EXACT approved 16 original poses, including the original fist
    // clasp, over-head winding motion, floor slam, and reverse sink.
    ctx.drawImage(im,edges[col],0,edges[col+1]-edges[col],h,
      GROUND.x-155,GROUND.y-310+bob,310,310);
    ctx.restore();return true;
  }
  function slamIndex(ms){
    let result=0;
    for(const [time,idx] of slamKeyframes){
      if(ms<time)break;
      result=idx;
    }
    return result;
  }
  function drawGolem(ctx,anim,rows,now=0){
    const target=anim.travelEnd||anim.targetPoint||{x:700,y:400};
    if(anim.stage==="golem-slam")
      return originalPose(ctx,rows,slamIndex(anim.elapsed),target);
    if(["golem-travel","golem-impact"].includes(anim.stage)){
      // A separate track starts the moment fists touch the floor.
      // Golem resumes original standing pose, breathes, then sinks and
      // disappears independently while the fissure is still traveling.
      const t=Math.max(0,anim.golemPostSlamMs||0);
      if(t<540)return originalPose(ctx,rows,13,target,1,
        Math.sin(t*.011)*1.7);
      if(t<770)return originalPose(ctx,rows,14,target,1);
      if(t<1090)return originalPose(ctx,rows,15,target,
        clamp((1090-t)/320,0,1));
      return true; // fully unsummoned, travel remains alive
    }
    return false;
  }
  function position(anim,t){
    const start=anim.travelStart||{x:500,y:463};
    const end=anim.travelEnd||start;
    const p=clamp(t);
    // Fissure is on the ground plane at every time, including arrival.
    return {x:lerp(start.x,end.x,p),y:lerp(start.y,end.y,p)};
  }
  function sprite(ctx,im,frame,cw,ch,x,y,w,h,alpha=1){
    if(!good(im))return false;
    const i=Math.max(0,Math.floor(frame));
    ctx.save();ctx.globalAlpha*=alpha;
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    ctx.drawImage(im,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,x,y,w,h);
    ctx.restore();return true;
  }
  function drawTravel(ctx,anim){
    if(!good(travelAtlas))return false;
    const p=clamp(anim.elapsed/anim.duration);
    const pos=position(anim,p);
    const index=Math.floor(anim.elapsed/91)%TRAVEL_FRAMES;
    // Two small fragments from the actual travel atlas leave a faint,
    // ephemeral fissure. The one animated leading rock wave is the spell.
    for(let i=2;i>=1;i--){
      const back=Math.max(0,p-i*.11);
      if(back<=0)continue;
      const q=position(anim,back);
      sprite(ctx,travelAtlas,(index+8-i)%8,192,144,
        q.x-48,q.y-52,96,54,(3-i)*.16);
    }
    // Every frame of the 8-frame LOOP translates in world coordinates.
    // It is not a stretching crack and not a clone of the golem sprite.
    return sprite(ctx,travelAtlas,index,192,144,
      pos.x-96,pos.y-112,192,112,1);
  }
  function drawImpact(ctx,anim){
    const p=clamp(anim.elapsed/anim.duration);
    const idx=Math.min(IMPACT_FRAMES-1,Math.floor(p*IMPACT_FRAMES));
    const pt=anim.travelEnd;
    if(!pt)return false;
    return sprite(ctx,impactAtlas,idx,224,168,
      pt.x-111,pt.y-152,222,152,1);
  }
  function drawImpactForeground(ctx,anim){
    const pt=anim?.travelEnd;
    if(!pt||!good(impactAtlas))return false;
    const p=clamp(anim.elapsed/anim.duration),idx=Math.min(7,Math.floor(p*8));
    const fade=p>.79?clamp((1-p)/.21):1;
    // ONLY bottom 30% of the genuine impact artwork is above the boots.
    // The full effect is behind the wizard. No rock triangles or overlays.
    ctx.save();ctx.globalAlpha*=fade;
    ctx.drawImage(impactAtlas,(idx%4)*224,Math.floor(idx/4)*168+128,
      224,40,pt.x-92,pt.y-31,184,34);
    ctx.restore();return true;
  }
  root.WIZARDRY_GOLEM_EFFECTS_V42={
    drawGolem,drawTravel,drawImpact,drawImpactForeground,position,slamIndex,
    getAtlasInfo:()=>({
      golemFrames:SLAM_FRAMES,travelFrames:TRAVEL_FRAMES,impactFrames:IMPACT_FRAMES,
      originalGolem:true,travelReady:good(travelAtlas),impactReady:good(impactAtlas)
    })
  };
})(window);
