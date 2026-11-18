/* Nature blessing for the entire team. */
(function(root){'use strict';const T=Math.PI*2;
function emblem(c,x,y,size,alpha=1,time=0){c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha*=alpha;c.strokeStyle='#d0f5a9';c.shadowColor='#73da88';c.shadowBlur=7;c.lineWidth=2;c.beginPath();c.arc(0,0,48,0,T);c.stroke();
 for(let i=0;i<6;i++){const a=i*T/6+time;c.save();c.rotate(a);c.beginPath();c.moveTo(0,-8);c.bezierCurveTo(-27,-22,-13,-39,0,-40);c.bezierCurveTo(13,-39,27,-22,0,-8);c.fillStyle=i%2?'#78bf6860':'#b8dd7760';c.fill();c.stroke();c.restore();}c.fillStyle='#f0ffd4';c.fillRect(-4,-18,8,36);c.fillRect(-18,-4,36,8);c.restore();}
function draw(c,{progress:p,targets}){const fade=Math.min(1,p/.15,(1-p)/.2);emblem(c,500,410,100,fade,p);
 for(const t of targets||[]){if(t.hp<=0)continue;const q=Math.max(0,Math.min(1,(p-.2)/.5));for(let j=0;j<6;j++){const u=Math.max(0,q-j*.045),x=500+(t.x-500)*u,y=410+(t.y-85-410)*u-Math.sin(u*Math.PI)*45;c.save();c.globalAlpha=fade*(1-j*.13);c.fillStyle='#c5f9a9';c.shadowColor='#74dca2';c.shadowBlur=8;c.beginPath();c.arc(x,y,3+j%2,0,T);c.fill();c.restore();}
 if(p>.62){const u=(p-.62)/.38;c.save();c.globalAlpha=fade;c.strokeStyle='#bef0ab';c.lineWidth=2;for(let j=0;j<3;j++){c.beginPath();c.ellipse(t.x,t.y-10-u*85-j*18,42+u*12,13,0,0,T);c.stroke();}c.restore();}}}root.WIZARDRY_HEALING_AURA_V92={emblem,draw};})(window);
