/* Jack the Lantern: original low-poly scarecrow poses and three animated crows. */
(function(root){'use strict';
const C=t=>Math.max(0,Math.min(1,t)),L=(a,b,t)=>a+(b-a)*t,E=t=>{t=C(t);return t*t*(3-2*t);};
const atlas=new Image(),listeners=[];atlas.onload=()=>{buildFaceMasks();listeners.splice(0).forEach(fn=>fn());};atlas.src='./assets/jack-cross-atlas-v130.webp';
const FLOOR=425,SIZE=185,SWARM=.53,HIT=.73,faceMasks=[];
function glowStrength(p){return E((p-.43)/.085)*(1-E((p-SWARM)/.035));}
function buildFaceMasks(){
 if(typeof document==='undefined')return;
 const cw=atlas.naturalWidth/4,rows=[[0,330],[330,309],[639,327]];
 for(let frame=4;frame<12;frame++){
  const [sy,ch]=rows[Math.floor(frame/4)],mask=document.createElement('canvas');mask.width=Math.ceil(cw);mask.height=ch;
  const g=mask.getContext('2d');g.drawImage(atlas,frame%4*cw,sy,cw,ch,0,0,cw,ch);
  const pixels=g.getImageData(0,0,mask.width,ch),data=pixels.data;
  // Only the existing bright yellow carvings in the pumpkin face glow.
  for(let y=0;y<ch;y++)for(let x=0;x<mask.width;x++){const i=(y*mask.width+x)*4,r=data[i],green=data[i+1],b=data[i+2];
   if(y>ch*.35||x<cw*.35||x>cw*.83||r<185||green<125||b>110||green<r*.68||green<b*1.8)data[i+3]=0;
   else{data[i]=255;data[i+1]=232;data[i+2]=112;}
  }
  g.putImageData(pixels,0,0);faceMasks[frame]=mask;
 }
}
function faceGlow(c,b,p){const mask=faceMasks[b.frame],strength=glowStrength(p);if(!mask||strength<=0)return;
 c.save();c.translate(b.x,b.y);c.scale(b.dir,1);c.globalCompositeOperation='lighter';c.globalAlpha*=strength*b.alpha;
 c.shadowColor='#ffb52e';c.shadowBlur=18*strength;c.drawImage(mask,-SIZE/2,-SIZE*.94,SIZE,SIZE);
 c.shadowBlur=7*strength;c.drawImage(mask,-SIZE/2,-SIZE*.94,SIZE,SIZE);c.restore();
}
function pose(p,target){const dir=target.x>=500?1:-1,rise=E(p/.28),sink=E((p-.86)/.12);let frame=p<.28?Math.min(3,Math.floor(p/.28*4)):p<.48?4+Math.min(3,Math.floor((p-.28)/.20*4)):8+Math.floor((p-.48)*25)%4;return{x:500,y:FLOOR+(1-rise)*SIZE*.94+sink*SIZE,dir,frame,alpha:1-E((p-.92)/.07)};}
function sprite(c,frame,x,y,size,dir=1,alpha=1,angle=0){if(!atlas.complete||!atlas.naturalWidth)return;const cw=atlas.naturalWidth/4,rows=[[0,330],[330,309],[639,327],[966,295]],row=rows[Math.floor(frame/4)],sy=row[0]*atlas.naturalHeight/1261,ch=row[1]*atlas.naturalHeight/1261;c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.scale(dir,1);c.drawImage(atlas,frame%4*cw,sy,cw,ch,-size/2,-size*.94,size,size);c.restore();}
function orbit(p,i){const a=p*16+i*Math.PI*2/3;return{x:500+Math.cos(a)*76,y:210+Math.sin(a)*17,dir:-Math.sin(a)>=0?1:-1};}
function crowPose(p,target,i){const release=SWARM+i*.02,start=orbit(release,i);if(p<release)return{...orbit(p,i),size:54,alpha:1,angle:0};
 const q=C((p-release)/.16),a=(p-release)*55+i*Math.PI*2/3,tx=target.x+Math.cos(a)*21,ty=target.y-104+Math.sin(a)*30;
 const x=L(start.x,tx,E(q)),y=L(start.y,ty,E(q))-Math.sin(q*Math.PI)*53;
 return{x,y,dir:target.x>=500?1:-1,size:L(54,61,q),alpha:1-E((p-.84)/.10),angle:Math.sin(a)*.15};}
function draw(c,{progress:p,target,layer='actor'}){if(!target||p<0||p>=1)return;
 if(layer==='actor'){const b=pose(p,target);c.save();c.beginPath();c.rect(330,-150,340,FLOOR+152);c.clip();sprite(c,b.frame,b.x,b.y,SIZE,b.dir,b.alpha);faceGlow(c,b,p);c.restore();}
 else if(layer.startsWith('crow')){const i=Number(layer.slice(4)),b=crowPose(p,target,i);sprite(c,12+Math.floor(p*88+i)%4,b.x,b.y+b.size*.44,b.size,b.dir,b.alpha,b.angle);}
 else if(layer==='ground'){
  const q=p<.32?C(p/.32):C((p-.86)/.12),alpha=p<.32?Math.sin(q*Math.PI):p>.86?Math.sin(q*Math.PI):0;
  c.save();c.globalAlpha=alpha*.55;c.fillStyle='#7c6653';
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=18+q*44,x=500+Math.cos(a)*r,y=FLOOR+Math.sin(a)*r*.22;c.beginPath();c.moveTo(x-8,y);c.lineTo(x-4,y-6);c.lineTo(x+9,y-2);c.lineTo(x+5,y+4);c.closePath();c.fill();}c.restore();
 }else if(layer==='impact'&&p>=HIT&&p<HIT+.09){const q=(p-HIT)/.09;c.save();c.globalAlpha=(1-q)*.60;c.strokeStyle='#b88cce';c.lineWidth=3;
  for(let i=0;i<5;i++){const a=i*Math.PI*.4+q,cx=target.x+Math.cos(a)*(17+q*26),cy=target.y-104+Math.sin(a)*(17+q*26);c.beginPath();c.moveTo(cx-8,cy-6);c.lineTo(cx,cy);c.lineTo(cx-5,cy+9);c.stroke();}c.restore();}
}
function depthFor({progress:p,target},layer){if(layer==='ground')return FLOOR-.2;if(layer==='actor')return FLOOR;if(layer==='impact')return target.y+.3;const i=Number(layer.slice(4));return p<SWARM+i*.02?FLOOR+(Math.sin(p*16+i*Math.PI*2/3)>.1?.1:-.1):L(FLOOR,target.y,C((p-SWARM-i*.02)/.16))+.2;}
function portrait(c,w,h){const size=Math.min(w*.97,h*.78);sprite(c,10,w*.50,h*.99,size,1);for(let i=0;i<3;i++)sprite(c,12+i,w*(.19+i*.30),h*(.12+(i%2)*.06),w*.33,i===2?-1:1);}
root.WIZARDRY_JACK_V129={draw,portrait,pose,crowPose,depthFor,HIT,SWARM,glowStrength,onReady(fn){if(atlas.complete&&atlas.naturalWidth)fn();else listeners.push(fn);}};
})(window);
