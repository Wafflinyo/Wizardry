/* Low-poly earth ward shared by the spell, card portrait and status rune. */
(function(root){'use strict';
function emblem(c,x,y,size,alpha=1){c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha*=alpha;
 const poly=(pts,fill,stroke)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}};
 poly([[-43,-48],[43,-48],[48,10],[27,40],[0,58],[-27,40],[-48,10]],'#554c35','#efd49b');
 poly([[-36,-40],[0,-40],[0,47],[-22,32],[-40,7]],'#8a9c66');poly([[0,-40],[36,-40],[40,7],[22,32],[0,47]],'#657b50');
 poly([[-29,17],[-7,-22],[5,-4],[17,-27],[33,17]],'#f2dda5');poly([[-17,12],[-7,-6],[4,12]],'#a49869');
 c.strokeStyle='#fff1bf';c.lineWidth=2;c.beginPath();c.moveTo(-22,27);c.lineTo(22,27);c.stroke();c.restore();}
function draw(c,{progress:p,target}){if(!target)return;const travel=Math.max(0,Math.min(1,(p-.28)/.46)),q=travel*travel*(3-2*travel),x=500+(target.x-500)*q,y=335+(target.y-100-335)*q-Math.sin(q*Math.PI)*30,fade=p<.18?p/.18:p>.76?Math.max(0,(1-p)/.24):1;
 c.save();for(let i=0;i<22;i++){const a=i*2.399+p*8,r=65+(i%4)*8; c.globalAlpha=fade*(.25+(i%3)*.15);c.fillStyle=i%2?'#ebd59d':'#9aa875';c.save();c.translate(x+Math.cos(a)*r,y+Math.sin(a)*r*.8);c.rotate(a);c.fillRect(-2,-2,4+i%3,4+i%3);c.restore();}c.globalAlpha=1;
 emblem(c,x,y,100*(p>.76?1+(p-.76)*2:Math.min(1,p/.18)),fade);
 if(p>.76){c.globalAlpha=fade;c.strokeStyle='#d8d7a0';c.lineWidth=3;c.beginPath();c.ellipse(target.x,target.y-95,45+(p-.76)*190,65+(p-.76)*220,0,0,Math.PI*2);c.stroke();}c.restore();}
root.WIZARDRY_SOLIDITY_V86={draw,emblem};})(window);
