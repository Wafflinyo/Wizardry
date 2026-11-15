/* Starter Water spell: a faceted sigil, independent water bullet and burst. */
(function(root){
'use strict';
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p;
function anchors(o){
 const t=o.target||{x:750,y:370},dir=t.x>=500?1:-1;
 return {start:{x:500,y:340,depth:425},end:{x:t.x,y:t.y-85,depth:t.y-1},dir};
}
function sigil(c,x,y,r,alpha=1){
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.strokeStyle='#9ffaff';c.lineWidth=2.5;
 c.shadowColor='#39d8ff';c.shadowBlur=14;c.beginPath();
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.stroke();
 c.shadowBlur=0;c.fillStyle='#1d93c86b';c.fill();c.beginPath();c.moveTo(0,-r*.66);c.bezierCurveTo(r*.75,r*.06,r*.48,r*.65,0,r*.6);c.bezierCurveTo(-r*.48,r*.65,-r*.75,r*.06,0,-r*.66);c.fillStyle='#a1f9ff';c.fill();
 c.fillStyle='#37b9e4';c.beginPath();c.moveTo(0,-r*.45);c.lineTo(-r*.23,r*.36);c.lineTo(r*.16,r*.45);c.closePath();c.fill();c.restore();
}
function bullet(c,x,y,angle,size=1,alpha=1){
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.scale(size,size*1.3);
 const glow=c.createLinearGradient(-85,0,22,0);glow.addColorStop(0,'#48cfff00');glow.addColorStop(1,'#8df5ffb0');c.fillStyle=glow;
 c.beginPath();c.moveTo(-90,-3);c.lineTo(-10,-14);c.lineTo(17,0);c.lineTo(-10,14);c.lineTo(-90,3);c.closePath();c.fill();
 c.shadowColor='#49dbff';c.shadowBlur=16;c.fillStyle='#76e8f6';c.beginPath();c.moveTo(-31,0);c.lineTo(-15,-15);c.lineTo(10,-13);c.lineTo(24,0);c.lineTo(10,13);c.lineTo(-15,15);c.closePath();c.fill();
 c.shadowBlur=0;c.fillStyle='#dcffff';c.beginPath();c.moveTo(-23,-2);c.lineTo(-11,-11);c.lineTo(8,-9);c.lineTo(18,-2);c.closePath();c.fill();
 c.fillStyle='#239acb';c.beginPath();c.moveTo(-25,3);c.lineTo(18,3);c.lineTo(7,11);c.lineTo(-13,12);c.closePath();c.fill();c.restore();
}
function draw(c,o){
 const a=anchors(o),p=C(o.progress),layer=o.layer;
 if(layer==='sigil')sigil(c,a.start.x,a.start.y,34*(o.stage==='pistol-form'?(.4+.6*p):1),o.stage==='pistol-form'?Math.min(1,p*3):.85);
 if(layer==='bullet'&&o.stage==='pistol-flight')bullet(c,L(a.start.x,a.end.x,p),L(a.start.y,a.end.y,p),Math.atan2(a.end.y-a.start.y,a.end.x-a.start.x),1.65);
 if(layer==='impact'&&o.stage==='pistol-impact'){
  c.save();c.globalAlpha=1-p;c.translate(a.end.x,a.end.y);c.strokeStyle='#a4f8ff';c.lineWidth=5*(1-p)+1;
  // Explosive white-blue core, expanding splash crown and spray shards.
  c.fillStyle='#d9ffff';c.beginPath();c.arc(0,0,38*(1-p)+6,0,Math.PI*2);c.fill();
  c.strokeStyle='#6ae7ff';c.lineWidth=7*(1-p)+2;
  c.beginPath();c.ellipse(0,0,16+84*p,10+64*p,0,0,Math.PI*2);c.stroke();
  c.strokeStyle='#d0ffff';c.lineWidth=3;
  c.beginPath();c.ellipse(0,0,10+64*p,8+50*p,0,0,Math.PI*2);c.stroke();
  for(let i=0;i<24;i++){const ang=i*2.399,r=18+98*p;const x=Math.cos(ang)*r,y=Math.sin(ang)*r*.8+18*p*p;
   c.fillStyle=i%2?'#5bd8ed':'#d4ffff';c.beginPath();c.moveTo(x,y-7);c.lineTo(x+4,y);c.lineTo(x,y+6);c.lineTo(x-4,y);c.closePath();c.fill();}
  c.restore();
 }
}
root.WIZARDRY_WATER_PISTOL_V73={draw,anchors,
 depthFor:(o,layer)=>{const a=anchors(o);return layer==='sigil'?a.start.depth:layer==='bullet'?L(a.start.depth,a.end.depth,C(o.progress)):a.end.depth;},
 drawCardArt:(c,w,h)=>{const s=Math.min(w/200,h/140);c.save();c.translate(w/2,h/2);c.scale(s,s);sigil(c,-65,0,26);for(let i=0;i<3;i++)bullet(c,38,i*38-38,0,.85);c.restore();return true;}};
})(window);
