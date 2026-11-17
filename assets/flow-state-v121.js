/* Flow State: low-poly water currents circling the caster. */
(function(root){"use strict";const T=Math.PI*2,C=x=>Math.max(0,Math.min(1,x));
 function emblem(c,x,y,size){c.save();c.translate(x,y);c.scale(size/24,size/24);c.fillStyle="#72e6f5";c.beginPath();c.moveTo(0,-11);c.lineTo(-8,1);c.lineTo(-6,8);c.lineTo(0,11);c.lineTo(7,7);c.lineTo(9,1);c.closePath();c.fill();c.fillStyle="#d5ffff";c.beginPath();c.moveTo(0,-7);c.lineTo(-4,2);c.lineTo(0,7);c.lineTo(3,1);c.closePath();c.fill();c.restore();}
 function currents(c,x,y,scale,p,alpha){
   c.save();c.globalAlpha=alpha;
   for(let band=0;band<3;band++)for(let i=0;i<44;i++){
     const a=i*T/44+p*T*1.7+band*2.1,b=a+T/44,r=(42+band*6)*scale;
     const point=t=>[x+Math.cos(t)*r,y-(24+band*43)*scale+Math.sin(t)*15*scale];
     const A=point(a),B=point(b),thick=(5+Math.sin(a+band)*2)*scale;
     c.fillStyle=["#287caa","#43b7d3","#9aebf1","#d2ffff"][(i+band)%4];
     c.beginPath();c.moveTo(A[0],A[1]);c.lineTo(B[0],B[1]);c.lineTo(B[0]+Math.cos(b)*3*scale,B[1]-thick);c.lineTo(A[0]+Math.cos(a)*3*scale,A[1]-thick);c.closePath();c.fill();
   }
   for(let n=0;n<9;n++){const q=(p*1.7+n/9)%1,a=n*2.4+p*2;emblem(c,x+Math.cos(a)*35*scale,y-q*170*scale,7*scale);}
   c.restore();
 }
 function draw(c,{progress:p,target}){if(!target)return;const scale=.60+.30*C((target.y-288)/235),alpha=C(p/.16)*C((1-p)/.20);currents(c,target.x,target.y,scale,p,alpha);}
 function portrait(c,w,h){currents(c,w/2,h*.94,Math.min(w/130,h/180),.35,1);emblem(c,w/2,h*.40,48);}
 root.WIZARDRY_FLOW_STATE_V121={draw,portrait,emblem};
})(window);
