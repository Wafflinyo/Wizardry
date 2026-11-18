/* Blooming Spores: a closed bud swells, blossoms intact and exhales pollen. */
(function(root){'use strict';
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2,SIZE=265;
const image=new Image(),listeners=[];let ready=false;
image.onload=()=>{ready=true;listeners.forEach(fn=>fn());};image.src='./assets/blooming-spores-v97.webp';
const feet=[306, 305, 305, 305, 290, 290, 290, 290, 285, 286, 286, 287, 306, 306, 306, 306];
function pose(p){const frame=p<.16?Math.min(3,Math.floor(p/.16*4)):p<.38?4+Math.min(2,Math.floor((p-.16)/.22*3)):p<.57?7+Math.min(2,Math.floor((p-.38)/.19*3)):p<.62?10:p<.68?11:p<.76?12:p<.84?13:p<.92?14:15;
 return{frame,x:500,y:480,alpha:C(p/.05)*(1-C((p-.92)/.08))};}
function travel(p,target){const q=C((p-.58)/.14);return{x:L(500,target.x,q),y:L(280,target.y-75,q)-Math.sin(q*Math.PI)*22,depthY:L(480,target.y,q)+.1,q};}
function depthFor({progress:p},target){return travel(p,target).depthY;}
function sprite(c,f,size=SIZE){if(!ready)return;const w=image.naturalWidth/4,h=image.naturalHeight/4;c.drawImage(image,f%4*w,Math.floor(f/4)*h,w,h,-size/2,-feet[f]*size/w,size,h*size/w);}
function cloud(c,x,y,q,fade){c.save();c.globalAlpha*=fade;
 for(let i=0;i<16;i++){const a=i*2.399,r=(8+q*18)*(1+i%4*.2),xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.65-Math.sin(q*Math.PI)*(i%3*5),s=12+i%5*3+q*11;
 const g=c.createRadialGradient?.(xx,yy,0,xx,yy,s);if(g?.addColorStop){g.addColorStop(0,'#f8e6a266');g.addColorStop(.38,'#cbd26955');g.addColorStop(1,'#a1b44300');c.fillStyle=g;}else c.fillStyle='#cbd26933';c.beginPath();c.arc(xx,yy,s,0,T);c.fill();}
 for(let i=0;i<48;i++){const a=i*2.399+q*.8,r=8+q*(30+i%6*7),xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.7-q*(i%5*4);c.fillStyle=i%3?'#f0d67e':'#eaffac';c.beginPath();c.arc(xx,yy,.8+i%3*.55,0,T);c.fill();}c.restore();}
function draw(c,{progress:p,target,layer='flower'}){
 if(layer==='flower'){const b=pose(p);c.save();c.globalAlpha=.2*b.alpha;c.fillStyle='#1b2918';c.beginPath();c.ellipse(500,429,100,23,0,0,T);c.fill();c.restore();
 c.save();c.globalAlpha*=b.alpha;c.translate(500,480);sprite(c,b.frame);c.restore();
 if(p>=.57&&p<.84)cloud(c,500,280,C((p-.57)/.27),Math.sin(C((p-.57)/.27)*Math.PI)*.65);return;}
 if(layer==='spores'&&target&&p>=.58&&p<.96){const b=travel(p,target),fade=C((p-.58)/.035)*(1-C((p-.82)/.14));cloud(c,b.x,b.y,b.q,fade);
 if(p>=.72){const q=C((p-.72)/.24);c.save();c.globalAlpha=(1-q)*.65;c.strokeStyle='#e2eab0';c.lineWidth=2;c.beginPath();c.ellipse(target.x,target.y-75,12+q*44,8+q*30,0,0,T);c.stroke();c.restore();}}
}
function portrait(c,w,h){c.save();const k=Math.min(w/275,h/275);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,15);c.restore();}
root.WIZARDRY_BLOOM_V97={draw,pose,travel,depthFor,portrait,onReady:fn=>listeners.push(fn)};
})(window);
