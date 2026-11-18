/* A gaunt hunter-like undead climbs out, screeches, pounces and claws. */
(function(root){'use strict';const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2,SIZE=140;
const images={emerge:new Image(),attack:new Image()},ready={emerge:false,attack:false},listeners=[];
for(const [atlas,path] of Object.entries({emerge:'undead-emergence-v99b.webp',attack:'undead-action-v99b.webp'})){images[atlas].onload=()=>{ready[atlas]=true;listeners.forEach(fn=>fn());};images[atlas].src='./assets/'+path;}
const feet={emerge:[309, 309, 309, 308, 281, 281, 281, 281, 254, 254, 254, 254, 272, 271, 271, 271],attack:[316, 316, 316, 316, 301, 301, 301, 301, 297, 291, 260, 228, 290, 291, 290, 290]};
function bodyScaleAt(y){return L(.60,.90,C((y-288)/235));}
function pose(p,target){const dir=target.x>=500?1:-1,q=C((p-.62)/.14),groundY=L(510,target.y,q),jump=Math.sin(q*Math.PI)*115,atlas=p<.45?'emerge':'attack';
 const frame=p<.45?Math.min(15,Math.floor(p/.45*16)):p<.56?Math.min(3,Math.floor((p-.45)/.11*4)):p<.62?4+Math.min(3,Math.floor((p-.56)/.06*4)):p<.67?8+Math.min(1,Math.floor((p-.62)/.05*2)):p<.75?10+Math.min(1,Math.floor((p-.67)/.08*2)):p<.78?12:p<.83?13:p<.87?14:15;
 return{atlas,dir,frame,q,groundY,jump,size:SIZE*bodyScaleAt(groundY)/bodyScaleAt(510),x:L(500,target.x-dir*32,q),y:groundY-jump,alpha:C(p/.025)*(1-C((p-.90)/.10))};}
function sourceRect(atlas,f){const left=atlas==='attack'&&f===10?8:0;return{offset:0,left,width:320-left,height:320,foot:feet[atlas][f]};}
function sprite(c,atlas,f,size=SIZE){if(!ready[atlas])return;const image=images[atlas],w=image.naturalWidth/4,h=image.naturalHeight/4,k=size/w,r=sourceRect(atlas,f);
 c.drawImage(image,f%4*w+r.left,Math.floor(f/4)*h+r.offset,r.width,r.height,-size/2+r.left*k,-r.foot*k,r.width*k,r.height*k);}
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function dust(c,x,y,q,scale=1){if(q<0||q>1)return;c.save();c.globalAlpha*=(1-q)*.7;for(let i=0;i<28;i++){const a=i*2.399,r=(15+q*(25+i%5*12))*scale,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.23-Math.sin(q*Math.PI)*(i%4*10),s=2+i%3;poly(c,[[xx-s,yy],[xx,yy-s*1.5],[xx+s,yy],[xx+s*.3,yy+s]],i%2?'#8b8474':'#5b5f54');}c.restore();}
function depthFor({progress:p,target},layer){if(layer==='ground')return 200;if(layer==='claws')return(target?.y||510)+.1;const b=pose(p,target);return b.groundY+(p>=.74?.1:0);}
function draw(c,{progress:p,target,layer='actor'}){if(!target)return;const b=pose(p,target);
 if(layer==='ground'){
 const hole=(1-C((p-.65)/.20))*C(p/.04);c.save();c.globalAlpha=hole;c.fillStyle='#101519';c.beginPath();c.ellipse(500,510,L(18,44,C(p/.35)),L(5,12,C(p/.35)),0,0,T);c.fill();c.strokeStyle='#2b302b';c.lineWidth=2;for(let i=0;i<7;i++){const a=i*T/7;c.beginPath();c.moveTo(500+Math.cos(a)*25,510+Math.sin(a)*7);c.lineTo(500+Math.cos(a)*48,510+Math.sin(a)*14);c.lineTo(500+Math.cos(a+.08)*61,510+Math.sin(a+.08)*18);c.stroke();}c.restore();
 dust(c,500,510,(p-.02)/.16,.7);dust(c,500,510,(p-.13)/.17,.56);dust(c,500,510,(p-.62)/.16,.49);
 c.save();c.globalAlpha=.22*b.alpha*(1-b.jump/150);c.fillStyle='#141b18';c.beginPath();c.ellipse(b.x,b.groundY+3,b.size*.225,b.size*.06,0,0,T);c.fill();c.restore();return;}
 if(layer==='actor'){
 c.save();c.globalAlpha*=b.alpha;if(p<.45){c.beginPath();c.rect(0,-1000,1000,1000+b.groundY+2);c.clip();}c.translate(b.x,b.y+(p<.45?36*(1-C(p/.27))**2:0));c.scale(b.dir,1);sprite(c,b.atlas,b.frame,b.size);c.restore();
 if(p>=.45&&p<.56){const q=(p-.45)/.11;c.save();c.globalAlpha=(1-q)*.45;c.strokeStyle='#b1bb99';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(b.x+b.dir*(37+q*22)*b.size/200,b.y-135*b.size/200,(8+q*(25+i*12))*b.size/200,(12+q*(20+i*10))*b.size/200,0,b.dir>0?-1.0:Math.PI-1,b.dir>0?1.0:Math.PI+1);c.stroke();}c.restore();}
 if(p>=.76&&p<.85)dust(c,b.x,b.groundY+3,(p-.76)/.09,.65);
 if(p>.90){const q=(p-.90)/.10;c.save();c.globalAlpha=1-q;c.fillStyle='#97ad93';for(let i=0;i<30;i++){const a=i*2.399,x=b.x+Math.cos(a)*(15+q*47),y=b.groundY-15-i%7*15-q*55;c.fillRect(x,y,2,3);}c.restore();}return;}
 if(layer==='claws'&&p>=.78&&p<.87){const q=C((p-.78)/.06);c.save();c.globalAlpha=p>.83?( .87-p)/.04:1;c.strokeStyle='#bce3b1';c.shadowColor='#637e9b';c.shadowBlur=5;c.lineWidth=3.5;
 for(let i=0;i<3;i++){const x=target.x-25+i*14,y=target.y-118+i*5;c.beginPath();c.moveTo(x-b.dir*15,y-16);c.lineTo(x+b.dir*40*q,y+48*q);c.stroke();}c.restore();}
}
function portrait(c,w,h){c.save();const k=Math.min(w/215,h/215);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,'attack',2,200);c.restore();}
root.WIZARDRY_UNDEAD_V99={draw,pose,bodyScaleAt,depthFor,sourceRect,portrait,onReady:fn=>listeners.push(fn)};
})(window);
