/* Short Circuit: authored 6x4 automaton atlas and separate 6x4 electrical atlas.
   Neither target nor scenery is part of the sprites. */
(()=>{
"use strict";
const C=256,R=256,body=new Image(),effects=new Image();
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
let pending=null,lastError="";
const ready=()=>[body,effects].every(im=>im.complete&&im.naturalWidth===1536&&im.naturalHeight===1024);
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 pending=Promise.all([[body,"./assets/short-circuit-body.webp?v=2"],[effects,"./assets/short-circuit-fx.webp?v=1"]].map(([im,url])=>new Promise(resolve=>{
   if(im.complete&&im.naturalWidth===1536&&im.naturalHeight===1024){resolve(true);return;}
   const timer=setTimeout(()=>resolve(false),12000);
   im.onload=()=>{clearTimeout(timer);resolve(true);};
   im.onerror=()=>{clearTimeout(timer);resolve(false);};im.src=url;
 }))).then(()=>{lastError=ready()?"":"Short Circuit artwork failed to load";if(ready())try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}return ready();}).finally(()=>pending=null);
 return pending;
}
function tile(g,img,frame,x,y,w,h){
 if(!ready())return;
 const n=Math.min(23,Math.max(0,Math.floor(frame)));
 g.drawImage(img,n%6*C,Math.floor(n/6)*R,C,R,x,y,w,h);
}
function scene(source,target,p,mana,factor=1,blocked=false,tally=null,clockMs=0){
 p=clamp(p);
 const dir=target.x>=source.x?1:-1,w=235;
 // The arena background is registered to the world diamond at (500,510).
 // Anchor the actual soles at atlas row 231, not the transparent cell bottom.
 const x=500,y=510,top=y-w*231/256;
 // Reuse the clean authored poses, not the smoke-baked summon poses.
 let frame=5;
 if(p>=.18&&p<.43)frame=6+Math.min(8,Math.floor((p-.18)/.25*9));
 else if(p>=.43&&p<.77)frame=15+Math.min(4,Math.floor((p-.43)/.34*5));
 else if(p>=.77)frame=20+Math.min(3,Math.floor((p-.77)/.23*4));
 const alpha=ease(p/.13)*(1-ease((p-.90)/.10));
 // Intensity grows with each counted mana instead of reaching maximum
 // before the counter has actually filled.
 const strength=clamp((tally?.counting?tally.counted:Number(mana)||0)/15);
 if(tally?.counting)frame=18;
 const targetScale=Math.max(.8,Math.min(1.7,factor||1));
 return {x,y,top,w,dir,p,frame,alpha,strength,blocked,tally,clockMs,
   hand:{x:x+dir*w*.39,y:top+w*.475},
   core:{x:x+dir*w*.045,y:top+w*.52},
   hit:{x:target.x,y:target.y-95*targetScale},targetScale};
}
function draw(g,s){
 if(!ready())return;
 g.save();g.globalAlpha*=s.alpha;g.translate(s.x,s.top);g.scale(s.dir,1);
 tile(g,body,s.frame,-s.w/2,0,s.w,s.w);g.restore();
}
function fx(g,n,x,y,size,alpha=1,dir=1){
 if(alpha<=0)return;
 g.save();g.globalAlpha*=clamp(alpha);g.translate(x,y);g.scale(dir,1);
 tile(g,effects,n,-size/2,-size/2,size,size);g.restore();
}
// Separate electrical frames remain the charge/impact accents. A continuous
// branched channel replaces the old repeated zigzag and traveling orbs.
function hash(n){const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);}
function lightning(g,from,to,frame,width,alpha,spread,branches=true){
 const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);
 if(alpha<=0||len<2)return;
 const nx=-dy/len,ny=dx/len,steps=Math.max(5,Math.ceil(len/19)),pts=[];
 for(let i=0;i<=steps;i++){
   const t=i/steps,j=(i===0||i===steps)?0:(hash(frame*31+i*7)-.5)*2*spread*Math.sin(Math.PI*t)**.55;
   const along=(i===0||i===steps)?0:(hash(frame*23+i*13)-.5)*9;
   pts.push({x:from.x+dx*t+nx*j+dx/len*along,y:from.y+dy*t+ny*j+dy/len*along});
 }
 function stroke(points,w,a){
   g.save();g.globalAlpha*=a;g.lineJoin="round";g.lineCap="round";
   g.beginPath();points.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));
   g.strokeStyle="rgba(20,100,255,.26)";g.lineWidth=w*5;g.stroke();
   g.strokeStyle="rgba(39,170,255,.75)";g.lineWidth=w*2.8;g.stroke();
   g.strokeStyle="#87eaff";g.lineWidth=w*1.35;g.stroke();
   g.strokeStyle="#efffff";g.lineWidth=w*.58;g.stroke();g.restore();
 }
 if(branches)for(let i=1;i<steps-1;i++){
   if(hash(frame*11+i*3)<.36)continue;
   const q=pts[i],sign=hash(frame*17+i*5)>.5?1:-1,reach=13+hash(frame*9+i*31)*34;
   const bend={x:q.x+dx/len*reach*.35+nx*sign*reach*.52,y:q.y+dy/len*reach*.35+ny*sign*reach*.52};
   const tip={x:q.x+dx/len*reach*.9+nx*sign*reach,y:q.y+dy/len*reach*.9+ny*sign*reach};
   stroke([q,bend,tip],width*(.27+hash(i+frame)*.15),alpha*.67);
   if(i%2===0)stroke([bend,{x:bend.x+nx*sign*10-dx/len*8,y:bend.y+ny*sign*10-dy/len*8}],width*.2,alpha*.45);
 }
 stroke(pts,width,alpha);
}
function glow(g,x,y,r,a){
 if(a<=0)return;
 g.save();g.globalAlpha*=a;
 const gr=g.createRadialGradient(x,y,0,x,y,r);
 gr.addColorStop(0,"rgba(237,255,255,.95)");gr.addColorStop(.22,"rgba(94,220,255,.72)");
 gr.addColorStop(.58,"rgba(30,140,255,.23)");gr.addColorStop(1,"rgba(30,140,255,0)");
 g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);g.restore();
}
function charge(g,s){
 if(s.p<.06||s.p>=.70)return;
 const u=ease((s.p-.06)/.38),fade=1-ease((s.p-.58)/.12),a=u*fade,f=Math.floor(s.p*100);
 // Small sparks at the two shoulder coils and through the forearm.
 const coils=[{x:s.x-s.dir*s.w*.19,y:s.top+s.w*.17},{x:s.x+s.dir*s.w*.13,y:s.top+s.w*.21}];
 for(let k=0;k<coils.length;k++){
   const q=coils[k];
   fx(g,Math.floor(u*8),q.x,q.y,40+u*10,a*.65);
   lightning(g,q,s.core,f+k*9,1.7,a*.8,7,true);
 }
 if(s.p>.25){
   const h=ease((s.p-.25)/.22);
   lightning(g,s.core,s.hand,f+11,2.2,a*h,10,true);
   fx(g,Math.min(8,Math.floor(h*9)),s.hand.x,s.hand.y,40+h*16,a*h*.76);
   glow(g,s.hand.x,s.hand.y,23+h*9,a*h*.65);
 }
}
function discharge(g,s){
 if(s.p<.57||s.p>=.81)return;
 // Short lead-in, then a sustained current until the overload. No
 // independent floating orb or repeated sawtooth pattern in the gap.
 const u=s.tally?.counting?1:ease((s.p-.57)/.11),fade=s.tally?.counting?1:1-ease((s.p-.72)/.09);
 const head={x:s.hand.x+(s.hit.x-s.hand.x)*u,y:s.hand.y+(s.hit.y-s.hand.y)*u};
 const f=Math.floor(s.clockMs/42),power=4.8+s.strength*2.4;
 glow(g,s.hand.x,s.hand.y,26,fade*.9);
 lightning(g,s.hand,head,f,power,fade,14+s.strength*9,true);
 // A thinner irregular filament flickers along the main channel.
 lightning(g,s.hand,head,f+47,power*.36,fade*.66,24+s.strength*8,false);
 if(u>.1&&u<1)glow(g,head.x,head.y,13,fade*.56);
 if(s.tally?.counting){
   const age=s.tally.elapsed%s.tally.stepMs;
   const pulse=s.tally.counted>0?1-ease(age/s.tally.stepMs):0;
   glow(g,s.hit.x,s.hit.y,27+14*pulse, .38+.32*pulse);
   // Brief little forks at the contact point on every counted mana.
   for(let k=0;k<3;k++){
     const angle=f*.29+k*2.1,r=18+16*pulse;
     lightning(g,s.hit,{x:s.hit.x+Math.cos(angle)*r,y:s.hit.y+Math.sin(angle)*r},f+k*5,1.8+pulse, .56+.28*pulse,6,false);
   }
 }
}
function impact(g,s){
 if(s.p<.68||s.p>=.98||s.blocked)return;
 const t=clamp((s.p-.68)/.30),a=1-ease(t),f=Math.floor(s.p*130);
 const scale=s.targetScale,energy=.82+s.strength*.42;
 // Electrical overload crawls along the target, then bursts from the
 // torso. The authored impact frames are a short accent, not a cover.
 const n=13+Math.min(10,Math.floor(t*11));
 fx(g,n,s.hit.x,s.hit.y,(100+42*s.strength)*scale,Math.max(0,1-ease((t-.42)/.58))*.8);
 glow(g,s.hit.x,s.hit.y,65*scale*energy,1-ease(t/.22));
 for(let k=0;k<7;k++){
   const ang=k*2.39996+hash(f+k)*.45,rr=(24+44*ease(t/.45))*scale*energy;
   const q={x:s.hit.x+Math.cos(ang)*rr*.72,y:s.hit.y+Math.sin(ang)*rr*1.33};
   lightning(g,s.hit,q,f+k*7,2.5+s.strength*1.4,a,10*scale,true);
 }
 // Small faceted sparks shoot away from the overloaded body.
 for(let k=0;k<15;k++){
   const ang=k*2.39996,rr=(12+t*(55+hash(k)*50))*scale;
   const x=s.hit.x+Math.cos(ang)*rr,y=s.hit.y+Math.sin(ang)*rr*1.15;
   const l=(5+hash(k+19)*10)*a*scale;
   g.save();g.translate(x,y);g.rotate(ang);g.globalAlpha*=a;
   g.fillStyle=k%3?"#5fdcff":"#e9ffff";g.beginPath();g.moveTo(l,0);g.lineTo(-l*.4,-l*.17);g.lineTo(-l*.72,0);g.lineTo(-l*.4,l*.17);g.closePath();g.fill();g.restore();
 }
}
function drawTally(g,t){
 if(!t.counting)return;
 // Central counter stays away from the target's HP and rune row.
 const x=500,y=103,w=242,h=91;
 const pulse=t.counted>0&&t.counted<t.goal?1-ease((t.elapsed%t.stepMs)/t.stepMs):0;
 g.save();g.translate(x,y);
 g.fillStyle="rgba(5,21,34,.93)";g.strokeStyle="#61c8ee";g.lineWidth=1.8;
 g.beginPath();g.moveTo(-w/2+9,-h/2);g.lineTo(w/2-9,-h/2);g.lineTo(w/2,-h/2+9);g.lineTo(w/2,h/2-9);g.lineTo(w/2-9,h/2);g.lineTo(-w/2+9,h/2);g.lineTo(-w/2,h/2-9);g.lineTo(-w/2,-h/2+9);g.closePath();g.fill();g.stroke();
 g.textAlign="center";g.textBaseline="middle";
 g.font="700 15px system-ui,sans-serif";g.fillStyle="#b8edff";
 g.fillText("MANA COUNT  "+t.counted+" / "+t.goal,0,-27);
 g.font="800 20px system-ui,sans-serif";g.fillStyle="#7ce7ff";
 g.fillText("BONUS  +"+t.bonus,0,-5);
 g.font="900 "+(25+2*pulse)+"px system-ui,sans-serif";
 g.fillStyle="#f1fcff";g.fillText(t.total+" BASE DMG",0,23);
 g.restore();
}
function portrait(g,w,h){
 if(!ready())return;
 const size=Math.min(w,h)*1.04;
 tile(g,body,14,(w-size)/2,(h-size)/2,size,size);
}
window.ShortCircuit={ensure,ready,error:()=>lastError,scene,draw,charge,discharge,impact,drawTally,portrait};ensure();
})();
