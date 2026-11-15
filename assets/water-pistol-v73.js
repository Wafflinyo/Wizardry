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
function bullet(c,x,y,angle,size=1,alpha=1,phase=0){
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.scale(size,size*1.3);
 // Broken, curving liquid wake instead of a rigid polygonal ice shard.
 for(let i=9;i>=0;i--){
  const xx=-18-i*7,yy=Math.sin(phase*2.1-i*.65)*(2+i*.48);
  c.fillStyle='rgba(76,211,242,'+(.025+(10-i)*.025)+')';
  c.beginPath();c.ellipse(xx,yy,12-i*.65,4+(9-i)*.5,Math.sin(phase-i)*.14,0,Math.PI*2);c.fill();
 }
 const wobble=Math.sin(phase*3)*3;
 const water=c.createLinearGradient(0,-18,0,17);
 water.addColorStop(0,'#c3fbffce');water.addColorStop(.4,'#48d4efd9');water.addColorStop(1,'#128fc29c');
 c.fillStyle=water;c.shadowColor='#51ddf5';c.shadowBlur=9;
 c.beginPath();c.moveTo(-36,0);c.bezierCurveTo(-21,-5,-23,-19+wobble,4,-16);
 c.bezierCurveTo(30,-13,33,9,10,16);c.bezierCurveTo(-13,22-wobble,-22,5,-36,0);c.fill();
 c.shadowBlur=0;c.strokeStyle='#e4ffffcf';c.lineWidth=2;c.lineCap='round';
 c.beginPath();c.moveTo(-17,-6);c.bezierCurveTo(-6,-13,8,-13,15,-6+wobble*.3);c.stroke();
 c.strokeStyle='#adf6ff7a';c.lineWidth=1.3;c.beginPath();c.moveTo(-18,5);c.quadraticCurveTo(-3,11+wobble,11,6);c.stroke();
 // Loose droplets shear from the sides and tumble through the air.
 for(let i=0;i<16;i++){
  const u=((phase*.13+i*.137)%1+1)%1;
  const xx=-22-u*83,yy=(i%2?1:-1)*(6+u*16)+Math.sin(phase*2+i)*4;
  c.globalAlpha=alpha*(1-u)*.8;c.fillStyle=i%3?'#76e5f2':'#d4fbff';
  c.beginPath();c.ellipse(xx,yy,2.2+u*3,1.2+u*.7,Math.sin(phase+i)*.4,0,Math.PI*2);c.fill();
 }
 c.restore();
}
function shotProgress(o){return ((o.elapsed||0)-(o.shotIndex||0)*100)/170;}
function draw(c,o){
 const a=anchors(o),p=C(o.progress),layer=o.layer;
 if(layer==='sigil')sigil(c,a.start.x,a.start.y,34*(o.stage==='pistol-form'?(.4+.6*p):1),o.stage==='pistol-form'?Math.min(1,p*3):.85);
 const flight=shotProgress(o);
 if(layer==='bullet'&&o.stage==='pistol-burst'&&flight>=0&&flight<1){
  const wobble=Math.sin(flight*Math.PI*3+(o.shotIndex||0))*5*Math.sin(flight*Math.PI);
  bullet(c,L(a.start.x,a.end.x,flight),L(a.start.y,a.end.y,flight)+wobble,
    Math.atan2(a.end.y-a.start.y,a.end.x-a.start.x),1.65,1,(o.elapsed||0)/60+(o.shotIndex||0)*2);
 }
 const impact=((o.elapsed||0)-(o.shotIndex||0)*100-170)/360;
 if(layer==='impact'&&o.stage==='pistol-burst'&&impact>=0&&impact<1){
  const p=impact;
  c.save();c.globalAlpha=1-p;c.translate(a.end.x,a.end.y);c.strokeStyle='#a4f8ff';c.lineWidth=5*(1-p)+1;
  // Explosive white-blue core, expanding splash crown and spray shards.
  c.fillStyle='#d9ffff';c.beginPath();c.arc(0,0,38*(1-p)+6,0,Math.PI*2);c.fill();
  c.strokeStyle='#6ae7ff';c.lineWidth=7*(1-p)+2;
  c.beginPath();c.ellipse(0,0,16+84*p,10+64*p,0,0,Math.PI*2);c.stroke();
  c.strokeStyle='#d0ffff';c.lineWidth=3;
  c.beginPath();c.ellipse(0,0,10+64*p,8+50*p,0,0,Math.PI*2);c.stroke();
  for(let i=0;i<24;i++){const ang=i*2.399,r=18+98*p;const x=Math.cos(ang)*r,y=Math.sin(ang)*r*.8+18*p*p;
   c.fillStyle=i%2?'#5bd8ed':'#d4ffff';c.beginPath();c.ellipse(x,y,4+5*(1-p),2+3*(1-p),ang,0,Math.PI*2);c.fill();}
  c.restore();
 }
}
root.WIZARDRY_WATER_PISTOL_V73={draw,anchors,shotProgress,
 depthFor:(o,layer)=>{const a=anchors(o);return layer==='sigil'?a.start.depth:layer==='bullet'?L(a.start.depth,a.end.depth,C(shotProgress(o))):a.end.depth;},
 drawCardArt:(c,w,h)=>{const s=Math.min(w/200,h/140);c.save();c.translate(w/2,h/2);c.scale(s,s);sigil(c,-65,0,26);for(let i=0;i<3;i++)bullet(c,38,i*38-38,0,.85);c.restore();return true;}};
})(window);
