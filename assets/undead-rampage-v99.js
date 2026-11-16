/* A gaunt hunter-like undead climbs out, screeches, pounces and claws. */
(function(root){'use strict';const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2,SIZE=200;
const image=new Image(),listeners=[];let ready=false,audio=null;image.onload=()=>{ready=true;listeners.forEach(fn=>fn());};image.src='./assets/undead-rampage-v99.webp';
const feet=[299,299,299,299,290,290,290,290,284,284,282,284,269,289,289,288];
function pose(p,target){const dir=target.x>=500?1:-1,q=C((p-.62)/.14),groundY=L(425,target.y,q),jump=Math.sin(q*Math.PI)*115;
 const frame=p<.07?0:p<.12?1:p<.18?2:p<.23?3:p<.28?4:p<.33?5:p<.38?6:p<.45?7:p<.50?8:p<.56?9:p<.62?10:p<.66?11:p<.74?12:p<.78?13:p<.83?14:15;
 return{dir,frame,q,groundY,jump,x:L(500,target.x-dir*45,q),y:groundY-jump,alpha:C(p/.025)*(1-C((p-.90)/.10))};}
function sourceRect(f){const offset=f===13?-18:0,height=f===9?295:f===13?338:320;return{offset,height,foot:feet[f]-offset};}
function sprite(c,f,size=SIZE){if(!ready)return;const w=image.naturalWidth/4,h=image.naturalHeight/4,k=size/w,r=sourceRect(f);
 // Frame 13's raised hand extends into the atlas gutter above it. Read its full pose,
 // and stop frame 9 before that neighboring hand so neither pose bleeds or floats.
 c.drawImage(image,f%4*w,Math.floor(f/4)*h+r.offset,w,r.height,-size/2,-r.foot*k,size,r.height*k);}
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function dust(c,x,y,q,scale=1){if(q<0||q>1)return;c.save();c.globalAlpha*=(1-q)*.7;for(let i=0;i<28;i++){const a=i*2.399,r=(15+q*(25+i%5*12))*scale,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.23-Math.sin(q*Math.PI)*(i%4*10),s=2+i%3;poly(c,[[xx-s,yy],[xx,yy-s*1.5],[xx+s,yy],[xx+s*.3,yy+s]],i%2?'#8b8474':'#5b5f54');}c.restore();}
function depthFor({progress:p,target},layer){if(layer==='ground')return 200;if(layer==='claws')return(target?.y||425)+.1;const b=pose(p,target);return b.groundY+(p>=.74?.1:0);}
function draw(c,{progress:p,target,layer='actor'}){if(!target)return;const b=pose(p,target);
 if(layer==='ground'){
 const hole=(1-C((p-.65)/.20))*C(p/.04);c.save();c.globalAlpha=hole;c.fillStyle='#101519';c.beginPath();c.ellipse(500,427,L(20,61,C(p/.35)),L(6,17,C(p/.35)),0,0,T);c.fill();c.strokeStyle='#2b302b';c.lineWidth=2;for(let i=0;i<7;i++){const a=i*T/7;c.beginPath();c.moveTo(500+Math.cos(a)*32,427+Math.sin(a)*9);c.lineTo(500+Math.cos(a)*67,427+Math.sin(a)*19);c.lineTo(500+Math.cos(a+.08)*83,427+Math.sin(a+.08)*24);c.stroke();}c.restore();
 dust(c,500,429,(p-.02)/.16);dust(c,500,429,(p-.13)/.17,.8);dust(c,500,429,(p-.62)/.16,.7);
 c.save();c.globalAlpha=.22*b.alpha*(1-b.jump/150);c.fillStyle='#141b18';c.beginPath();c.ellipse(b.x,b.groundY+3,45,12,0,0,T);c.fill();c.restore();return;}
 if(layer==='actor'){
 c.save();c.globalAlpha*=b.alpha;if(p<.38){c.beginPath();c.rect(0,-1000,1000,1427);c.clip();}c.translate(b.x,b.y);c.scale(b.dir,1);sprite(c,b.frame);c.restore();
 if(p>=.45&&p<.56){const q=(p-.45)/.11;c.save();c.globalAlpha=(1-q)*.45;c.strokeStyle='#b1bb99';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(b.x+b.dir*(37+q*22),b.y-135,8+q*(25+i*12),12+q*(20+i*10),0,b.dir>0?-1.0:Math.PI-1,b.dir>0?1.0:Math.PI+1);c.stroke();}c.restore();}
 if(p>=.76&&p<.85)dust(c,b.x,b.groundY+3,(p-.76)/.09,.65);
 if(p>.90){const q=(p-.90)/.10;c.save();c.globalAlpha=1-q;c.fillStyle='#97ad93';for(let i=0;i<30;i++){const a=i*2.399,x=b.x+Math.cos(a)*(15+q*47),y=b.groundY-15-i%7*15-q*55;c.fillRect(x,y,2,3);}c.restore();}return;}
 if(layer==='claws'&&p>=.78&&p<.87){const q=C((p-.78)/.06);c.save();c.globalAlpha=p>.83?( .87-p)/.04:1;c.strokeStyle='#bce3b1';c.shadowColor='#637e9b';c.shadowBlur=5;c.lineWidth=3.5;
 for(let i=0;i<3;i++){const x=target.x-25+i*14,y=target.y-118+i*5;c.beginPath();c.moveTo(x-b.dir*15,y-16);c.lineTo(x+b.dir*40*q,y+48*q);c.stroke();}c.restore();}
}
function unlockAudio(){const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return;try{if(!audio)audio=new AC();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function screech(){if(!audio||audio.state!=='running')return;try{const now=audio.currentTime,duration=.48,osc=audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter();osc.type='sawtooth';osc.frequency.setValueAtTime(420,now);osc.frequency.exponentialRampToValueAtTime(1100,now+.09);osc.frequency.exponentialRampToValueAtTime(240,now+duration);filter.type='bandpass';filter.frequency.setValueAtTime(1400,now);filter.Q.value=1.1;gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(.038,now+.045);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(filter);filter.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+duration);
 const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const noise=audio.createBufferSource(),rasp=audio.createGain();noise.buffer=buffer;rasp.gain.value=.022;noise.connect(rasp);rasp.connect(filter);noise.start(now);noise.stop(now+duration);}catch{}}
function portrait(c,w,h){c.save();const k=Math.min(w/215,h/215);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,8);c.restore();}
root.WIZARDRY_UNDEAD_V99={draw,pose,depthFor,sourceRect,portrait,unlockAudio,screech,onReady:fn=>listeners.push(fn)};
})(window);
