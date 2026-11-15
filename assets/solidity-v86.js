/* Low-poly earth ward shared by the spell, card portrait and status rune. */
(function(root){'use strict';
function emblem(c,x,y,size,alpha=1,rotation=0){c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha*=alpha;
 c.shadowColor='#e8b853';c.shadowBlur=7;c.strokeStyle='#f5d78c';c.lineWidth=1.3;
 const circle=r=>{c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();};
 const polygon=(r,n,angle)=>{c.beginPath();for(let i=0;i<=n;i++){const a=angle+i/n*Math.PI*2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.stroke();};
 c.fillStyle='#73613024';c.beginPath();c.arc(0,0,53,0,Math.PI*2);c.fill();
 circle(53);circle(49);circle(38);circle(35);
 c.save();c.rotate(rotation);polygon(47,4,Math.PI/4);polygon(47,4,0);
 for(let i=0;i<20;i++){c.save();c.rotate(i*Math.PI/10);c.translate(0,-43);c.lineWidth=.85;c.beginPath();c.moveTo(-2,-3);c.lineTo(1,-1);c.lineTo(-1,2);c.lineTo(2,3);if(i%2){c.moveTo(-2,0);c.lineTo(2,-1);}else{c.moveTo(2,-3);c.lineTo(2,1);}c.stroke();c.restore();}c.restore();
 c.save();c.rotate(-rotation*.65);c.strokeStyle='#b8d49b';c.lineWidth=.85;polygon(33,3,-Math.PI/2);polygon(33,3,Math.PI/2);
 for(let i=0;i<32;i++){const a=i*Math.PI/16;c.beginPath();c.moveTo(Math.cos(a)*50,Math.sin(a)*50);c.lineTo(Math.cos(a)*(i%4?52:56),Math.sin(a)*(i%4?52:56));c.stroke();}c.restore();
 // Upright earth glyph remains readable as the outer sigils counter-rotate.
 c.strokeStyle='#fff0bb';c.lineWidth=2.6;c.lineJoin='miter';c.beginPath();c.moveTo(-23,12);c.lineTo(-7,-16);c.lineTo(3,0);c.lineTo(13,-18);c.lineTo(26,12);c.closePath();c.stroke();c.beginPath();c.moveTo(-20,20);c.lineTo(22,20);c.moveTo(-9,7);c.lineTo(-4,-2);c.lineTo(2,7);c.stroke();c.restore();}
function draw(c,{progress:p,target}){if(!target)return;const travel=Math.max(0,Math.min(1,(p-.28)/.46)),q=travel*travel*(3-2*travel),x=500+(target.x-500)*q,y=335+(target.y-100-335)*q-Math.sin(q*Math.PI)*30,fade=p<.18?p/.18:p>.76?Math.max(0,(1-p)/.24):1;
 c.save();for(let i=0;i<22;i++){const a=i*2.399+p*8,r=65+(i%4)*8; c.globalAlpha=fade*(.25+(i%3)*.15);c.fillStyle=i%2?'#ebd59d':'#9aa875';c.save();c.translate(x+Math.cos(a)*r,y+Math.sin(a)*r*.8);c.rotate(a);c.fillRect(-2,-2,4+i%3,4+i%3);c.restore();}c.globalAlpha=1;
 emblem(c,x,y,100*(p>.76?1+(p-.76)*2:Math.min(1,p/.18)),fade,p*4);
 if(p>.76){c.globalAlpha=fade;c.strokeStyle='#d8d7a0';c.lineWidth=3;c.beginPath();c.ellipse(target.x,target.y-95,45+(p-.76)*190,65+(p-.76)*220,0,0,Math.PI*2);c.stroke();}c.restore();}
root.WIZARDRY_SOLIDITY_V86={draw,emblem};})(window);
