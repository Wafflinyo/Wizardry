/* Photosynthesis: independent transparent 32-frame low-poly plant,
sunlight, transfer, and activation atlases, rendered once into cached canvases.
No wizard, dummy, arena, background or glow baked into the flower. */
(()=>{
"use strict";
const N=32,TAU=Math.PI*2,clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>{p=clamp(p);return p*p*(3-2*p);},mix=(a,b,p)=>a+(b-a)*p;
const sheets={flower:[],sun:[],transfer:[],activate:[]};
let ready=false,error="";
function poly(g,pts,c){g.fillStyle=c;g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.closePath();g.fill();}
function leaf(g,x,y,a,l,w){g.save();g.translate(x,y);g.rotate(a);poly(g,[[0,0],[l*.42,-w*.5],[l*.76,-w*.39],[l,0],[l*.61,w*.47],[l*.28,w*.33]],"#35672c");poly(g,[[0,0],[l*.42,-w*.5],[l*.76,-w*.39],[l,0],[l*.45,-w*.06]],"#7da941");poly(g,[[0,0],[l*.45,-w*.06],[l,0],[l*.61,w*.47]],"#548438");g.restore();}
function rock(g,x,y,r,k){const pts=Array.from({length:6},(_,j)=>[x+Math.cos(j*TAU/6)*r,y+Math.sin(j*TAU/6)*r*.48]);for(let j=0;j<6;j++)poly(g,[[x-r*.1,y-r*.17],pts[j],pts[(j+1)%6]],["#735235","#967144","#ae8652","#63452d","#846039","#503924"][(j+k)%6]);}
function flower(g,t){
 const grow=ease(t/.31)*(1-ease((t-.76)/.24)),open=ease((t-.19)/.23)*(1-ease((t-.76)/.14)),soil=ease(t/.08)*(1-ease((t-.94)/.06));
 if(soil<=0)return;
 for(let i=0;i<13;i++){const a=i*2.4,r=7+(i*11)%41;rock(g,128+Math.cos(a)*r*soil,235+Math.sin(a)*r*.20*soil,(5+i%5*2)*soil,i);}
 if(grow<=0)return;
 const topX=128+Math.sin(t*TAU*1.5)*8*grow+ease((t-.40)/.12)*12*grow,topY=233-132*grow;
 const w=4+grow*6;
 poly(g,[[128-w,233],[128+w,233],[topX+w*.58,topY],[topX-w*.50,topY]],"#35682b");
 poly(g,[[128-w,233],[128+1,233],[topX+1,topY],[topX-w*.50,topY]],"#78a33b");
 for(let i=0;i<4;i++){const p=.22+i*.16,side=i%2?1:-1;leaf(g,mix(128,topX,p),mix(233,topY,p),side>0?-.27:Math.PI+.24,(37+i*3)*grow,(17+i%2*5)*grow);}
 g.save();g.translate(topX,topY);g.rotate(-.09-ease((t-.40)/.12)*.25);g.scale(1,.86+.14*open);
 const r=(15+17*open)*grow;
 for(let j=0;j<13;j++){const a=j*TAU/13;g.save();g.rotate(a);
 const l=(16+27*open)*grow,wide=(7+7*open)*grow;
 const pts=[[r*.55,-wide*.35],[r+l*.45,-wide*.65],[r+l,0],[r+l*.45,wide*.65],[r*.55,wide*.35]];
 poly(g,pts,open>.2?"#e7ac26":"#6f953a");
 poly(g,[pts[0],pts[1],pts[2],[r+l*.31,0]],open>.2?"#ffd554":"#94b34a");
 poly(g,[pts[0],[r+l*.31,0],pts[2],pts[3],pts[4]],open>.2?"#c98b1b":"#527c30");g.restore();}
 const count=12;
 for(let j=0;j<count;j++){const a=j*TAU/count,b=(j+1)*TAU/count;poly(g,[[0,0],[Math.cos(a)*r,Math.sin(a)*r],[Math.cos(b)*r,Math.sin(b)*r]],open>.2?["#6b421e","#875827","#9d6c2e","#563716"][j%4]:["#426c2b","#648a36"][j%2]);}
 if(open>.55)for(let j=0;j<23;j++){const a=j*2.4,d=Math.sqrt(j/23)*r*.85;rock(g,Math.cos(a)*d,Math.sin(a)*d,1.6*grow,j);}
 g.restore();
}
function sun(g,t){const a=Math.sin(Math.PI*t);if(a<=0)return;
 for(let i=0;i<7;i++){g.globalAlpha=a*(.10+i%3*.07);const x=160+i*10;poly(g,[[x,0],[x+12,0],[118+i*3,128],[100+i*3,128]],i%2?"#f8d55d":"#eab845");}
 for(let i=0;i<14;i++){const q=(t*2+i/14)%1;g.globalAlpha=a*Math.sin(q*Math.PI)*.8;const x=mix(194+i%4*8,127+i%3*5,q),y=q*125,r=2+i%2;poly(g,[[x-r,y],[x,y-r*2],[x+r,y],[x,y+r*2]],"#e9c44c");}}
function transfer(g,t){const a=Math.sin(Math.PI*t);for(let i=0;i<14;i++){const q=t*1.45-i*.033;if(q<=0||q>=1)continue;const x=24+q*206,y=133-53*Math.sin(q*Math.PI)+Math.sin(q*13+i)*12;g.globalAlpha=a*Math.sin(Math.PI*q);if(i%3===0)leaf(g,x,y,q*8+i,13,7);else poly(g,[[x-3,y],[x,y-4],[x+3,y],[x,y+4]],"#e4c64e");}}
function activate(g,t){
 const a=Math.sin(Math.PI*t);if(a<=0)return;
 // A shallow ground-level leaf wreath and descending sunlight, no solid
 // white bloom or character silhouette; the center remains transparent.
 for(let i=0;i<12;i++){const ang=i*TAU/12+t*TAU,r=43+10*Math.sin(t*Math.PI);g.globalAlpha=a*.95;leaf(g,128+Math.cos(ang)*r,222+Math.sin(ang)*r*.35,ang+.6,12+6*a,7+4*a);}
 for(let i=0;i<6;i++){const x=94+i*13;g.globalAlpha=a*.12;poly(g,[[x-5,24],[x+5,24],[x+13,219],[x-13,219]],"#f0ca50");}
 for(let i=0;i<13;i++){const q=(t*1.4+i/13)%1,ang=i*2.4+t*4,x=128+Math.cos(ang)*43,y=220-q*148;g.globalAlpha=a*Math.sin(q*Math.PI);if(i%3===0)leaf(g,x,y,ang,12,7);else poly(g,[[x-3,y],[x,y-4],[x+3,y],[x,y+4]],"#e7c95b");}
}
function ensure(){if(ready)return Promise.resolve(true);try{for(const [name,draw] of Object.entries({flower,sun,transfer,activate}))for(let n=0;n<N;n++){const c=document.createElement("canvas");c.width=c.height=256;draw(c.getContext("2d"),n/(N-1));sheets[name].push(c);}ready=true;Promise.resolve().then(()=>{try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}});}catch(e){error=String(e);for(const f of Object.values(sheets))f.length=0;}return Promise.resolve(ready);}
function tile(g,name,t,x,y,w,h,dir=1){if(!ready||t<0||t>1)return;const f=sheets[name][Math.min(N-1,Math.round(t*(N-1)))];g.save();g.translate(x,y);g.scale(dir,1);g.drawImage(f,-w/2,-h,w,h);g.restore();}
function scene(u,p,factor=1){const k=Math.max(.7,Math.min(2.1,factor)),dir=u.x<500?1:-1;return {u,p:clamp(p),x:u.x+dir*85*k,y:u.y+4*k,k,dir};}
function drawFlower(g,s){tile(g,"flower",s.p,s.x,s.y+12*s.k,190*s.k,220*s.k);}
function drawSun(g,s){tile(g,"sun",(s.p-.30)/.38,s.x,s.y-57*s.k,210*s.k,270*s.k);}
function drawTransfer(g,s){tile(g,"transfer",(s.p-.58)/.25,(s.x+s.u.x)/2,s.y-25*s.k,145*s.k,155*s.k,-s.dir);}
function drawActivation(g,u,p,factor=1){const k=Math.max(.7,Math.min(2.1,factor));tile(g,"activate",p,u.x,u.y+20*k,200*k,245*k);}
function portrait(g,w,h){const size=Math.min(w*1.08,h*1.04);tile(g,"flower",.53,w*.5,h*.99,size,size);}
window.Photosynthesis={ensure,ready:()=>ready,error:()=>error,scene,flower:drawFlower,sun:drawSun,transfer:drawTransfer,activate:drawActivation,portrait};ensure();
})();