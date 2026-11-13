/* Wizardry 0.20 — sprite in-betweens constructed from the FIVE exact
 * user-approved Poseidon images. No new art-style model and no dissolve
 * between two visible bodies/tridents. Twenty-nine separate Canvas frames:
 * 0–5 rise, 6 idle, 7–10 windup A, 11–14 windup B,
 * 15–16 anticipation, 17 release, 18–20 follow-through, 21 hold,
 * 22–28 sink. Frame geometry always shares the same 360×330 anchor.
 */
(function () {
  "use strict";
  const W=360,H=330,STEP=8;
  const anchors=[[0,0],[180,0],[359,0],[0,165],[359,165],
    [0,329],[90,328],[180,329],[270,328],[359,329]];
  const poses=[
    {headtop:[212,69],nose:[236,112],beard:[248,173],hair:[157,117],
      lshoulder:[154,163],lelbow:[129,197],lhand:[107,188],
      trident_tip:[116,37],trident_base:[106,296],
      rshoulder:[268,168],relbow:[294,206],rhand:[299,257],
      chest:[215,181],waist:[201,233],wavecenter:[181,296],
      waveleft:[65,294],waveright:[326,300]},
    {headtop:[218,70],nose:[245,118],beard:[259,169],hair:[148,125],
      lshoulder:[141,169],lelbow:[106,186],lhand:[80,174],
      trident_tip:[137,44],trident_base:[60,233],
      rshoulder:[263,164],relbow:[291,199],rhand:[330,223],
      chest:[217,179],waist:[206,235],wavecenter:[190,294],
      waveleft:[65,296],waveright:[323,303]},
    {headtop:[225,72],nose:[246,111],beard:[265,160],hair:[171,120],
      lshoulder:[120,151],lelbow:[78,137],lhand:[56,104],
      trident_tip:[135,17],trident_base:[16,145],
      rshoulder:[272,153],relbow:[298,180],rhand:[345,204],
      chest:[229,179],waist:[208,230],wavecenter:[198,292],
      waveleft:[64,294],waveright:[319,295]},
    {headtop:[225,73],nose:[246,121],beard:[265,164],hair:[175,123],
      lshoulder:[117,161],lelbow:[116,219],lhand:[116,251],
      rshoulder:[268,154],relbow:[283,162],rhand:[337,142],
      chest:[225,185],waist:[218,233],wavecenter:[190,295],
      waveleft:[65,293],waveright:[324,295]},
    {headtop:[226,77],nose:[250,118],beard:[269,170],hair:[167,117],
      lshoulder:[139,172],lelbow:[128,229],lhand:[145,254],
      rshoulder:[273,162],relbow:[310,192],rhand:[329,232],
      chest:[220,187],waist:[212,239],wavecenter:[187,294],
      waveleft:[64,294],waveright:[326,296]}
  ];
  const keys=Object.keys(poses[0]);
  function newFrame(){
    const c=document.createElement("canvas");c.width=W;c.height=H;return c;
  }
  function kernel(r2){return r2<1e-8?0:.5*r2*Math.log(r2);}
  // Thin-plate spline: exact matched landmarks, regularized slightly.
  // Solve both x and y displacement with the same pivoted elimination.
  function fitWarp(source,dest,factor){
    const pts=[],dx=[],dy=[];
    for(const key of keys)if(source[key]&&dest[key]){
      const a=source[key],b=dest[key];
      const x=a[0]+(b[0]-a[0])*factor;
      const y=a[1]+(b[1]-a[1])*factor;
      pts.push([x,y]);dx.push(a[0]-x);dy.push(a[1]-y);
    }
    for(const p of anchors){
      pts.push(p);dx.push(0);dy.push(0);
    }
    const n=pts.length,m=n+3;
    const mat=new Array(m);
    for(let i=0;i<m;i++)mat[i]=new Float64Array(m+2);
    for(let i=0;i<n;i++){
      const a=pts[i];
      for(let j=0;j<n;j++){
        const b=pts[j],ex=a[0]-b[0],ey=a[1]-b[1];
        mat[i][j]=kernel(ex*ex+ey*ey)+(i===j?1.2:0);
      }
      mat[i][n]=1;mat[i][n+1]=a[0];mat[i][n+2]=a[1];
      mat[i][m]=dx[i];mat[i][m+1]=dy[i];
    }
    for(let j=0;j<n;j++){
      mat[n][j]=1;mat[n+1][j]=pts[j][0];mat[n+2][j]=pts[j][1];
    }
    for(let col=0;col<m;col++){
      let pivot=col;
      for(let row=col+1;row<m;row++)
        if(Math.abs(mat[row][col])>Math.abs(mat[pivot][col]))pivot=row;
      if(pivot!==col){const tmp=mat[pivot];mat[pivot]=mat[col];mat[col]=tmp;}
      const value=mat[col][col];
      if(Math.abs(value)<1e-10)continue;
      for(let k=col;k<m+2;k++)mat[col][k]/=value;
      for(let row=0;row<m;row++)if(row!==col){
        const f=mat[row][col];if(!f)continue;
        for(let k=col;k<m+2;k++)mat[row][k]-=f*mat[col][k];
      }
    }
    const cx=new Float64Array(m),cy=new Float64Array(m);
    for(let i=0;i<m;i++){cx[i]=mat[i][m];cy[i]=mat[i][m+1];}
    return {pts,cx,cy,n};
  }
  function warpFrame(original,source,destination,t){
    const from=t<=.51?source:destination;
    const to=t<=.51?destination:source;
    const frac=t<=.51?t:1-t;
    const warp=fitWarp(poses[from],poses[to],frac);
    const frame=newFrame(),ctx=frame.getContext("2d",{willReadFrequently:true});
    const dest=ctx.createImageData(W,H),pixels=dest.data;
    const src=original[from],nx=Math.ceil((W-1)/STEP)+1;
    const ny=Math.ceil((H-1)/STEP)+1;
    const gx=new Float32Array(nx*ny),gy=new Float32Array(nx*ny);
    // Evaluate the smooth displacement on a coarse lattice (fast on iPhone).
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
      const px=Math.min(W-1,x*STEP),py=Math.min(H-1,y*STEP);
      let xx=warp.cx[warp.n]+warp.cx[warp.n+1]*px+warp.cx[warp.n+2]*py;
      let yy=warp.cy[warp.n]+warp.cy[warp.n+1]*px+warp.cy[warp.n+2]*py;
      for(let j=0;j<warp.n;j++){
        const dx=px-warp.pts[j][0],dy=py-warp.pts[j][1];
        const k=kernel(dx*dx+dy*dy);xx+=warp.cx[j]*k;yy+=warp.cy[j]*k;
      }
      const p=y*nx+x;gx[p]=xx;gy[p]=yy;
    }
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const fx=x/STEP,fy=y/STEP,x0=Math.min(nx-2,Math.floor(fx));
      const y0=Math.min(ny-2,Math.floor(fy)),a=Math.min(1,fx-x0);
      const b=Math.min(1,fy-y0),p=y0*nx+x0;
      const wx=(1-a)*(1-b)*gx[p]+a*(1-b)*gx[p+1]+
        (1-a)*b*gx[p+nx]+a*b*gx[p+nx+1];
      const wy=(1-a)*(1-b)*gy[p]+a*(1-b)*gy[p+1]+
        (1-a)*b*gy[p+nx]+a*b*gy[p+nx+1];
      const sx=x+wx,sy=y+wy;
      if(sx<0||sy<0||sx>=W-1||sy>=H-1)continue;
      const ix=Math.floor(sx),iy=Math.floor(sy),tx=sx-ix,ty=sy-iy;
      const q=(iy*W+ix)*4;
      const o=(y*W+x)*4;
      let ar=0,rr=0,gg=0,bb=0;
      for(let v=0;v<2;v++)for(let u=0;u<2;u++){
        const loc=q+v*W*4+u*4;
        const weight=(u?tx:1-tx)*(v?ty:1-ty)*src[loc+3];
        ar+=weight;rr+=weight*src[loc];gg+=weight*src[loc+1];
        bb+=weight*src[loc+2];
      }
      if(ar>.05){
        pixels[o]=Math.round(rr/ar);pixels[o+1]=Math.round(gg/ar);
        pixels[o+2]=Math.round(bb/ar);pixels[o+3]=Math.round(ar);
      }
    }
    ctx.putImageData(dest,0,0);
    return frame;
  }
  function waterFront(idle){
    const data=idle.data,frame=newFrame(),ctx=frame.getContext("2d");
    const image=ctx.createImageData(W,H),dest=image.data;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const i=(y*W+x)*4,r=data[i],g=data[i+1],b=data[i+2],alpha=data[i+3];
      const whitefoam=y>288&&b>155&&g>132;
      const seafront=(y>278&&(x<116||x>257))||whitefoam||y>301;
      const iswater=b>r*1.15&&g>r*.95&&alpha>25;
      if(seafront&&iswater){
        dest[i]=r;dest[i+1]=g;dest[i+2]=b;
        dest[i+3]=Math.round(alpha*Math.min(1,Math.max(0,(y-278)/15)));
      }
    }
    ctx.putImageData(image,0,0);
    return frame;
  }
  function submergedPose(original,front,u){
    const frame=newFrame(),ctx=frame.getContext("2d");
    const shift=Math.round((1-u)*242);
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,316);ctx.clip();
    ctx.drawImage(original,0,shift);ctx.restore();
    const tide=Math.pow(1-u,.85);
    if(tide>.02){
      ctx.save();ctx.globalAlpha=Math.min(1,tide*1.55);
      ctx.drawImage(front,0,0);ctx.restore();
    }
    return frame;
  }
  // Synchronous build runs only once on art load. 29 small cached frames
  // replace changing large DOM surfaces or per-refresh image warping.
  window.WIZARDRY_POSEIDON_BUILD_FRAMES=function(image){
    const originals=[],raw=[];
    for(let i=0;i<5;i++){
      const c=newFrame(),ctx=c.getContext("2d",{willReadFrequently:true});
      ctx.drawImage(image,i*W,0,W,H,0,0,W,H);
      originals.push(c);raw.push(ctx.getImageData(0,0,W,H).data);
    }
    const front=waterFront({data:raw[0]}),frames=[],labels=[];
    function add(c,label){frames.push(c);labels.push(label);}
    [0,.18,.37,.58,.80,1].forEach((u,i)=>
      add(submergedPose(originals[0],front,u),"rise_"+i));
    add(originals[0],"idle");
    [.25,.5,.75].forEach(t=>add(warpFrame(raw,0,1,t),"windup_A_"+t));
    add(originals[1],"windup_A");
    [.25,.5,.75].forEach(t=>add(warpFrame(raw,1,2,t),"windup_B_"+t));
    add(originals[2],"windup_B");
    [.06,.13].forEach(t=>add(warpFrame(raw,2,3,t),"release_anticipation_"+t));
    add(originals[3],"throw");
    [.20,.36,.78].forEach(t=>add(warpFrame(raw,3,4,t),"follow_through_"+t));
    add(originals[4],"hold");
    [1,.85,.68,.5,.34,.16,0].forEach((u,i)=>
      add(submergedPose(originals[4],front,u),"sink_"+i));
    if(frames.length!==29)throw new Error("Poseidon frame count mismatch");
    return {frames,labels,originals,frameCount:29};
  };
})();