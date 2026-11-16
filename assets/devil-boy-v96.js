/* Devil Boy: rendered low-poly poses with a volcanic shot and paired flame bursts. */
(function(root){'use strict';
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2,SIZE=120,SCALE=SIZE/320;
const feet=[308,308,308,308,308,308,308,308,307,307,306,307,307,307,307,307];
const image=new Image(),listeners=[];let ready=false;image.onload=()=>{ready=true;listeners.forEach(fn=>fn());};image.src='./assets/devil-boy-v96.webp';
function pose(p,target){const dir=target.x>=500?1:-1;
 const frame=p<.18?Math.min(3,Math.floor(p/.18*4)):p<.30?4+Math.min(1,Math.floor((p-.18)/.12*2)):p<.40?6+Math.min(1,Math.floor((p-.30)/.10*2)):p<.49?8+Math.min(1,Math.floor((p-.40)/.09*2)):p<.53?10:p<.59?11:p<.68?12:p<.76?13:p<.83?14:15;
 const kick=p>=.53&&p<.62?Math.sin((p-.53)/.09*Math.PI)*9:0;
 return {dir,frame,x:500-dir*kick,y:425,alpha:C((p-.055)/.055)*(1-C((p-.88)/.045)),muzzle:{x:500+dir*(308-160)*SCALE,y:425-(feet[10]-124)*SCALE}};}
function shot(p,target){if(!target||p<.53||p>=.60)return null;const b=pose(p,target),q=C((p-.53)/.07);return{x:L(b.muzzle.x,target.x,q),y:L(b.muzzle.y,target.y-80,q)-Math.sin(q*Math.PI)*5,depthY:L(425,target.y,q)+.1,q};}
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function sprite(c,f,size=SIZE){if(!ready)return;const w=image.naturalWidth/4,h=image.naturalHeight/4;c.drawImage(image,f%4*w,Math.floor(f/4)*h,w,h,-size/2,-feet[f]*size/w,size,h*size/w);}
function burst(c,x,y,q){if(q<0||q>1)return;const power=Math.sin(q*Math.PI);c.save();c.globalAlpha*=C(power*2);
 for(let i=0;i<24;i++){const a=i*2.399,r=(12+q*(28+i%5*10)),xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.22,h=(45+i%6*23)*power,s=(9+i%4*5)*(1-q*.55);
 poly(c,[[xx-s,yy],[xx-s*.7,yy-h*.35],[xx+s*.4,yy-h*.62],[xx+s*.25,yy-h],[xx+s,yy-h*.42],[xx+s*1.2,yy]],i%3?'#e64310':'#ff8a16');
 poly(c,[[xx-s*.55,yy],[xx,yy-h*.66],[xx+s*.65,yy]],i%2?'#ffbc34':'#ffe18c');}
 for(let i=0;i<28;i++){const a=i*2.399,xx=x+Math.cos(a)*(20+q*72),yy=y-q*(60+i%7*25)+Math.sin(a)*15;c.fillStyle=i%2?'#ffd37c':'#f57525';c.fillRect(xx,yy,2+i%3,3+i%4);}
 c.restore();}
function rock(c,x,y,q,r=18){c.save();c.translate(x,y);c.rotate(q*9);
 poly(c,[[-r,-r*.4],[-r*.4,-r],[r*.6,-r*.8],[r,r*.1],[r*.5,r],[-r*.6,r*.7]],'#362d30');
 poly(c,[[-r,-r*.4],[-r*.4,-r],[r*.6,-r*.8],[0,0]],'#695054');poly(c,[[0,0],[r*.6,-r*.8],[r,r*.1],[r*.5,r]],'#211c27');
 c.strokeStyle='#ff7a20';c.lineWidth=2;c.beginPath();c.moveTo(-r*.5,-r*.8);c.lineTo(-r*.15,0);c.lineTo(r*.45,r*.7);c.moveTo(-r*.15,0);c.lineTo(r*.7,-r*.3);c.stroke();c.restore();}
function depthFor({progress:p,target},layer){if(layer==='ground')return 200;if(layer==='impact')return(target?.y||425)+.1;if(layer==='projectile')return shot(p,target)?.depthY||425;return 425;}
function draw(c,{progress:p,target,layer='actor'}){if(!target)return;const b=pose(p,target);
 if(layer==='ground'){c.save();c.globalAlpha=.22*b.alpha;c.fillStyle='#261716';c.beginPath();c.ellipse(500,429,35,10,0,0,T);c.fill();c.restore();for(const q of [p/.20,(p-.79)/.21])if(q>=0&&q<=1){c.save();c.globalAlpha=Math.sin(q*Math.PI)*.8;c.strokeStyle='#ffab39';c.lineWidth=5;c.beginPath();c.ellipse(500,429,20+q*55,7+q*12,0,0,T);c.stroke();c.restore();}return;}
 if(layer==='actor'){c.save();c.globalAlpha*=b.alpha;c.translate(b.x,425);c.scale(b.dir,1);sprite(c,b.frame);c.restore();burst(c,500,429,p/.20);burst(c,500,429,(p-.79)/.21);
 if(p>=.53&&p<.60){const q=(p-.53)/.07;c.save();c.translate(b.muzzle.x,b.muzzle.y);c.scale(b.dir,1);c.globalAlpha=Math.pow(1-q,1.4);
 poly(c,[[0,-8],[24,-22],[20,-8],[70,0],[20,9],[29,20],[0,8]],'#ff711a');
 poly(c,[[0,-5],[23,-12],[48,0],[21,11],[0,5]],'#ffc655');poly(c,[[0,-3],[40,0],[0,3]],'#fff2c5');
 c.strokeStyle='#ffbe6a';c.lineWidth=3;c.beginPath();c.ellipse(5+q*36,0,5+q*18,8+q*26,0,0,T);c.stroke();
 for(let i=0;i<12;i++){const xx=8+q*(55+i%4*16),yy=Math.sin(i*2.399)*q*35;poly(c,[[xx-3,yy],[xx+8,yy-1],[xx,yy+3]],i%2?'#fff2b1':'#ff9435');}c.restore();}return;}
 if(layer==='projectile'){const s=shot(p,target);if(!s)return;c.save();
 for(let i=12;i>=1;i--){const old=shot(Math.max(.53,p-i*.0025),target);if(!old)continue;c.globalAlpha=(1-i/13)*.8;c.fillStyle=i%2?'#ed4918':'#ffae30';c.beginPath();c.arc(old.x,old.y,3+(12-i)*.55,0,T);c.fill();}
 c.globalAlpha=.18;c.fillStyle='#ff661e';c.beginPath();c.arc(s.x,s.y,25,0,T);c.fill();c.globalAlpha=1;rock(c,s.x,s.y,s.q);c.restore();return;}
 if(layer==='impact'&&p>=.60&&p<.80){const q=(p-.60)/.20,x=target.x,y=target.y-80;c.save();
 // A white-hot center, explosive crown, two pressure rings and heavy magma fragments.
 c.globalAlpha=Math.max(0,1-q*4);c.fillStyle='#fff1c2';c.beginPath();c.arc(x,y,18+q*140,0,T);c.fill();
 c.globalAlpha=(1-q)*.9;const crown=[];for(let i=0;i<32;i++){const a=i*T/32,r=(i%2?20:46+i%5*5)*(1+q*.9);crown.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}poly(c,crown,'#f9651c');
 for(let j=0;j<2;j++){c.globalAlpha=(1-q)*(j?.55:.95);c.strokeStyle=j?'#ee581c':'#ffd18b';c.lineWidth=(j?7:5)*(1-q)+1;c.beginPath();c.arc(x,y,12+q*(j?120:95),0,T);c.stroke();}
 c.globalAlpha=1-q;for(let i=0;i<28;i++){const a=i*2.399,r=12+q*(60+i%5*20);rock(c,x+Math.cos(a)*r,y+Math.sin(a)*r+q*q*65,q,3+i%5);}
 c.globalAlpha=(1-q)*.65;for(let i=0;i<24;i++){const a=i*2.399,r=q*(70+i%4*16),xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r-q*35;poly(c,[[xx-2,yy],[xx+5,yy-7],[xx+2,yy+3]],i%2?'#ffd375':'#ff8d29');}c.restore();}

}
function portrait(c,w,h){c.save();const k=Math.min(w/215,h/220);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,8,200);c.restore();}
root.WIZARDRY_DEVIL_V96={draw,pose,shot,depthFor,portrait,onReady:fn=>listeners.push(fn)};
})(window);
