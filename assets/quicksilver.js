/* Quicksilver: authored liquid surge, then a pose-fitted metal shell.
   The original spear and horizontal impact tiles are deliberately never drawn. */
(()=>{
"use strict";
/* Vector contours traced from the approved 16-frame liquid-wave artwork.
   Shell and impact luminance samples are from the two separate 16-frame
   generated atlases, mapped to the live silhouette instead of a dummy. */
const alphabet="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const waveFrames=["JsLtJviucrTrQtNr/JsLtJvRvStWviucrTrQtNr/KuQvPt.VrWugubtar/WsWugtcuYr/","kreoYoIvhvkuis/kreoYoIvRvVtcthvkuis/SrJuRuOt.UqYoZtashvjugucrdphqisjreoYo/apYsct/Zscsbq","OlMkKn.qtnrlthrgpjmejXjSpOrEtDqAsEtCvnuos/ErDqAs.NkKmLn.qsmrltgqitfucscqjmejXjSpGsCvKvSsasevitnu/XlVkTo.jmejYjclZpTsPrRpKrMtJvQsbsdohl/MuRsMs.bpYpUsbr.ajdldnfndj/bkfndk","9sCsDqAq.OiLkOk.rrkrhmmjhfbfXhXkRpLpEuevitpt/OiLkOk.rrkrhokrjscqZtVtTraneihkkiljhfbfXhXkRpLpEuhumspt/bsguktdr.NuHsJqEu.hfdfdiZgXhVmNqTraneiij/cjXjYlWnUmWnRqWp/cjSqZn","OiNhLj.rrkrhohlkioilebdXgYiUnLoDtcvgtpt/rrkrhohrUtTsYqeigkjfohjdbdXgYiUnLoDtfumspt/qroqktbteu.ngjdbdXgagUnQpLoDtItHrLoTrXqjd/HtGrDt.hebdegahZmUqQqYp/cibhbkTqYp.eefggf","rhkbdbXgZhUmNnHrBp9tEsFuLtRvqtsrkqhllh/gilgohjg.rhkbdbXgZhUmNnHrBp9tEsFuNuPsSvXtqtsrmrhmjqbtVsbqflblgfoeqi/srlqdshumtmr.qfkbhbcgZfadXgYfZhUmLoGsCr9tEsGuQsRuUuVrcpemXqSqUsTtItHrMoQpRnVnhend/fsltkr.dnWqZq.lcicYiWlRmVnge/","temZbaQmNkMlOlOn8sFrGsDuKtQvdvkspsiqgmmgth/temZbaQmNkMlOlOn8sFrGsDuNuQsRucvetgupshpjrisfrbuZrhiblZjgdqdtgsh/oslret.blUqNsWrXsUuXubp.temZbaQm8sFqGsDuGsMuHtHrKrHqQoXjYkfd/amQrXqYsVtWu.YfRmNnTm.baidnckZ/ZnRrYrXq.fbmcka","vhrcmaYbUfWgUiHo7qEq7tavgshnmiqhvj/vhrcmaYbUfWgPl7qNqNtCr7teugsgnjkdobnYpXnajmf/hldpaoPt7tVuasbueu.ufmadaUfWgPl7qPpWjViYfWeZbcbfeYicike/fncqYpRtbqeu.XgRjQmDpOp.qfmafcjebije/fodreu.SlMoOp.gdpflb","ugoaaZVbSeXeOl7qEq8uDtKvYveseojingui/ugoaaZVbSeXeOl7qEq8ubuesdpgkcobnYpXnchnetgrhtish/enPtZsbudt.YeMm7qEq8uLuFtFoInLqQoXiVh.ZhaiietelZaZed/ZpTtRsWtZr.dobqbudt.XePlJnOpVjTi.pdlaebfdahgfhcme/TkMmMp.fboelb","vgtdnaTbNfTcXdPj6rCpFq6uDtXvfrfokjohvj/vgtdnaTbNfTcXdPj6rCpFq6uZufrenhkboandijfuhsi/6uPuEsHrEpEr.enXqWsQsas.vgtdnaZadbeeXjSiXdPj6rCpDnNpWibjle/doWsZs.UfOjQkJnNpSmUjQj.tdmbgcfesf/TkLnOo.hdndrfqc","vgnaWcMgEm9n5tEsFuWvesljvj/vgnaWcMgEm9n5tEsFuNvStesjldpcngiqfugvj/9rEsFuOuEsGr.bnTtcsZq.WfNiMhQeFlHmGnDm8oOoViTh.fejgvgna.gaUdad/ZpUtZt.UgHnPnTjOj.gerfpcic/YqVtYt.SkOkJnMo.idofqenc","wisdnbTdSgMg5p8q5uDsPvgtnmrkwl/wisdnbjbhdTdSgMg5p8q5uDsMugtbrmmsh/bjTjSiXfXdTdRiIkHjKh5p8q5u8sMtJsLr9s7p8oJoUjbl.vgnbhdemStZubtZrkh/CsItFr.bpTtatZq.CnMnSkJk.sfqcjdigkh/GmMnSkLk.lelgrgpd","wjsflcbcQgPeLeLhGi5p8r5tFsPvZvitrmwm/wjsflcgcidhecebdecbcQgPeLeLhGi5p8r5tFsWveucrkkpiuk/5tSr8r.cqTuau.afXeZdQgOe5q8oGpajUi.hloiwjsfkcneig/arUuZu.CsHtIrQr.XjJkFnHoRm.jhmjsirflf.ZfVeVgRfTgPiMgGjJhSi/HnUkKk.mfnirhqf","wmrgjdadRgIfIi5q9s5uHtevppwq/koWuhujthr.wmrghdjeifbfbdddRgIfIi5qDr5uUuSuRrLqOnZpboYmejrn/QtLrBt.joXugs.5qFqNnYoWmcjijomvkofnhkgkicjUibfLf/FtKuKs.vkrgijom.djRkMiMgOgFjJlGo8o6qDqRmWoUm/ljpmskph.BpZkPlJhFjLkHo","wlsgldLf5q9s5uGtgvoqwq/kpYqYugvdugsiukths.wlsgldLf5qEqEs5uQuMrOpUodjvo/aujqarcs.gipnwlqfkfki.ciYfZeWeWgSiNiMhOfLf5qEpEnJkKqIsCtOtJrVn/jqdrbths.ijnmvksh.YhNjKnLpXmZk.MgGiDm7pEn/XiOjMoWm.ohojrluj","wmrhkeNfEj5r6ugvrpwq/kpaqXsZujuktis.wmrhkeNfEj5r7s6uSuPsSpVpejonvo/OrKrJt6tLuOt.jqbrbu.wmpgriqjfipn.YfQjNjKg5rGoEmCoBmIiLkJnUpXnWlYiWg/hjnmvltj.WjOjLnUoTl/kkomulsj.OkQmVj"];
const shellFrames=["gfcibghbdhdihZfefigdbccacedbcefefaeedhbeidZccieb","dedfdagdhagjgeeeeibedbdcbbebfgddccfdeddajdbfchgd","acgeegacfjdageeaegecZZcjgdZZdchZcechcceccddiceie","dfeifebbdjdmbccVbdbcZaiefaZbagbcbbcddcdcacdfbdef","jghfeideajifcbbbcfcccUeeeaZbfgdbabbeecedbddgcedf","gcglfjjbYgbhdcchdedchZeegbYcfedbaabfebecbeegcded","hdheglfaXidhdbbbagdchcccedaaggdbaabcebebbdegddef","ihfdgidZZlfidZZYZfcbegdbedbWecebZacgdbecbdegccdf","ihedhjdbdmhjiZZXYecacidccdcWecebabbdbbdbbdegdbcf","lecehefddkhkdZZYZgdbahbdbccXdbdbZacddbdbcegfccdf","iidfjhfecjhhdZZZYfeaahbdacdWdbccaacdcbbabdffcade","gicggmcddhiefaYbXedaZhbcbbdVeaabZbbfbbbbadefcccg","gjdhgmefdhjffaZcWfdaYhbdbbdVeabcabaeccbcadfgddcf","jhdfhkddchidgaZcXgdaZhbdbbcVeabcabbeccbcadgfefdf","gedfefffbhjghZZcXedaYhbdaccVeabbaabdcbccZcffedcf","feefeffebjjgeXbbXedbZhbdadbVeZcbabcecaccadegeedf"];
const impactFrames=["XXbeZbXbfifcWUciYYbVedWeZWcZZaTXTUYTVZUUYWZYVUXc","YYadYbYdhhfaVTdgUXaUabVdYWbZZZTXSTXTVXSSYVaXTVXc","YYbeabYgedgaVTcfVWbUYaVdZXbZZZUXSSXTUWTTYVbYUUWc","ZYbcabZfcbgbVScdUWbUXZVdaXbaYZTXTSWTVXTTYWbYTTXc","dfdbbcZfdchdYTgcUZbVXaWeaWaaYaTXSUXUYXTVZVaYUVXc","bedbgdcfdcgbXVefUXcWXaXdZWabYZUbSSZVZVSVYVaYSUWc","becdceaZgecbaYddUYcWXZWdZVZbaYVYTSYYZVUVaYZbSUVd","bbdfcfaZfdcZeafdWZaWWYXdYWYcZZVYWTZXZUUVYXXbSTXa","bcefccWZebbZgccdWZZYXWYcYYWcYZWZXVZZbUVXYXacUUaZ","aeefccXacabZhdceWZYVWWYcYXVaYYVaZVZYcUUWWYWcTUbY","ZhffcaZZbabaeccgVYZUVUYcXXWbXXWaZUZYbUUXWaWbUSbZ","cecgbdaabbdYYZdhVYdWVWVdWYWYXYWbYUYXcVUUWbWaVSZa","cfcdbeaabaeXWXdgUZgaWaWeXYXWWYVaXUXXbVUTWbWaVTZa","cfcbcfbaWXdYWUcYTZebWcYZYVXVUXUWUSTUWTTSUXXaUTXa","efdZceYYVYdYUWdaUaaZUaYXWVVXUZTWWUXXWUVWTaXaVSXX","YXYWbbYXUcdWVXhZVaXXSZaVUVUZYYUVVUZWTUVVWVVYTTVY"];
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p;
const smooth=p=>{p=C(p);return p*p*(3-2*p);};
let scratch=null;
const ready=()=>true,ensure=()=>Promise.resolve(true);
const waveColors=["#69747e","#86909b","#acb5bf","#d0d6de","#f1f3f7"];
const wavePaths=waveFrames.map(f=>f.split("/").map(layer=>layer.split(".").filter(Boolean).map(path=>{
 const coords=[];for(let i=0;i<path.length;i+=2)coords.push([alphabet.indexOf(path[i]),alphabet.indexOf(path[i+1])]);return coords;
})));
function tile(g,n,x,y,w,h){
 const layers=wavePaths[Math.max(0,Math.min(15,n|0))];g.save();g.translate(x,y);g.scale(w/64,h/64);
 for(let i=0;i<layers.length;i++)for(const points of layers[i])polygon(g,points,waveColors[i]);
 g.restore();
}
function sampleFrame(phase,nx,ny){
 const form=phase.formationIndex??Math.min(15,Math.floor(phase.rise*16));
 const strike=phase.impactIndex??-1;
 const tex=strike>=0?impactFrames[strike]:shellFrames[form];
 const xx=C(nx)*5,yy=C(ny)*7,ix=Math.min(4,Math.floor(xx)),iy=Math.min(6,Math.floor(yy)),u=xx-ix,v=yy-iy;
 const get=(x,y)=>alphabet.indexOf(tex[y*6+x])*4;
 // Flat triangular facets interpolated between the authored silver samples.
 const a=get(ix,iy),b=get(ix+1,iy),c=get(ix,iy+1),d=get(ix+1,iy+1);
 return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
}
function coverage(p,hit=.73){
 p=C(p);const arrival=hit*.56,full=hit*.92,release=hit+(1-hit)*.32;
 const frame=Math.min(47,Math.floor(p*48)),q=p===1?1:frame/48;
 const rise=smooth((q-arrival)/(full-arrival)),breakup=smooth((q-release)/(1-release));
 const hard=smooth((q-full+.08)/.08);
 return {active:p>=arrival&&p<1,rise,hard,breakup,burst:p>=hit?1-breakup:0,frame,p,arrival,hit};
}
function scene(source,target,p,hit=.73,factor=1){
 p=C(p);const dir=source.team===0?1:-1,arrival=hit*.56,start=.13;
 const origin={x:500-dir*76,y:510},travel=smooth((p-start)/(arrival-start));
 const endX=target.x,endY=target.y+4;
 const frame=p<arrival?Math.min(15,Math.floor(p/arrival*16)):Math.max(0,Math.floor(3*(1-smooth((p-arrival)/(1-arrival)))));
 return {p,hit,arrival,dir,x:L(origin.x,endX,travel),y:L(origin.y,endY,travel),endX,endY,targetX:target.x,targetY:target.y,frame,factor};
}
function stagePhase(ms,s){
 const hit=s.hitAt,start=s.startAt,arrival=start+(s.from?380:(hit-start)*.56);
 const q=Math.floor(ms/20)*20;
 const rise=smooth((q-arrival)/Math.max(1,hit-100-arrival));
 const hard=smooth((q-hit+220)/220),breakup=smooth((ms-hit-180)/350);
 const formationIndex=Math.min(15,Math.floor(C((ms-arrival)/Math.max(1,hit-120-arrival))*16));
 const impactIndex=ms>=hit?Math.min(15,4+Math.floor((ms-hit)/42)):ms>=hit-120?Math.min(3,Math.floor((ms-hit+120)/30)):-1;
 const burst=ms<hit?0:[0,0,0,0,.50,.77,.96,1,1,1,1,.92,.72,.45,.20,0][impactIndex];
 return {active:ms>=arrival&&ms<hit+560,rise,hard,breakup,burst,formationIndex,impactIndex,frame:Math.floor(ms/20),arrival,hit};
}
function anchor(target,kind,factor){
 const side=target.team===0?1:-1;
 return {x:target.x+side*factor*(kind==="sand_warrior"?106:kind==="faultline_bulwark"?91:0),y:target.y+4};
}
function surfaceScene(source,target,ms,stage,factor){
 const phase=stagePhase(ms,stage),end=anchor(target,stage.kind,factor),dir=source.team===0?1:-1;
 const origin=stage.from?anchor(target,stage.from,factor):{x:500-dir*76,y:510};
 const p=C((ms-stage.startAt)/Math.max(1,phase.arrival-stage.startAt)),travel=p*p*(2-p),approach=ms<phase.arrival;
 const frame=approach?Math.min(15,Math.floor(p*16)):Math.floor(3*(1-phase.breakup));
 const lag=C(p-.12),trail=lag*lag*(2-lag);
 return {p,hit:1,arrival:1,approach,phase,dir,x:L(origin.x,end.x,travel),y:L(origin.y,end.y,travel),trailX:L(origin.x,end.x,trail),trailY:L(origin.y,end.y,trail),frame,factor};
}
function draw(g,s){
 const q=s.phase||coverage(s.p,s.hit),approach=s.approach??s.p<s.arrival;
 const size=approach?L(198,218*s.factor,smooth(s.p/s.arrival)):182*s.factor;
 // The leading crest continually changes shape, with a connected, low
 // trailing ribbon. No rigid spear tile or airborne projectile.
 if(approach&&s.p>.16&&s.trailX!=null){
  g.save();g.translate(s.trailX,s.trailY);g.scale(s.dir,1);g.globalAlpha*=.68*Math.sin(Math.PI*s.p);
  tile(g,Math.max(0,s.frame-4),-size*.48,-size*.36,size*.94,size*.40);g.restore();
 }
 g.save();g.translate(s.x,s.y);if(approach)g.scale(s.dir,1);
 g.globalAlpha*=approach?1:1-q.breakup;
 const height=approach?size*.84:size*.48;
 tile(g,s.frame,-size*.5,-height*58/64,size,height);g.restore();
}
function silhouette(data,w,h){
 let top=h,bottom=-1,left=w,right=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>96){top=Math.min(top,y);bottom=y;left=Math.min(left,x);right=Math.max(right,x);}
 return bottom<top?null:{top,bottom,left,right};
}
function metalPixels(data,w,h,phase,bounds=silhouette(data,w,h)){
 if(!bounds||!phase.rise)return bounds;
 const {top,bottom,left,right}=bounds,H=Math.max(1,bottom-top),B=Math.max(1,right-left),cell=Math.max(5,H*.075);
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
  const j=(y*w+x)*4;if(!data[j+3])continue;
  const nx=(x-left)/B,ny=(y-top)/H;
  const edge=1-phase.rise+.025*Math.sin(nx*13+phase.frame*.28);
  const wet=phase.rise>=1?1:smooth((ny-edge+.035)/.055);
  const cx=Math.floor(x/cell),cy=Math.floor(y/cell),hash=((Math.sin(cx*127.1+cy*311.7)*43758.5453)%1+1)%1;
  const tri=((x/cell)%1+(y/cell)%1)>1?1:-1;
  const detach=smooth((phase.breakup-hash*.78)/.22);
  const alpha=wet*(1-detach);if(alpha<=0)continue;
  const lum=data[j]*.299+data[j+1]*.587+data[j+2]*.114;
  const authored=sampleFrame(phase,nx,ny);
  const facet=phase.hard*(hash*26-13+tri*13);
  const rim=phase.rise<1?40*Math.max(0,1-Math.abs(ny-edge)/.05):0;
  const v=authored*.84+lum*.16+facet+rim;
  data[j]=L(data[j],Math.max(0,Math.min(255,v-7)),alpha);
  data[j+1]=L(data[j+1],Math.max(0,Math.min(255,v+2)),alpha);
  data[j+2]=L(data[j+2],Math.max(0,Math.min(255,v+10)),alpha);
  if(phase.surface&&data[j+3]>12)data[j+3]=L(data[j+3],255,alpha);
 }
 return bounds;
}
function polygon(g,pts,fill){g.beginPath();for(let i=0;i<pts.length;i++)i?g.lineTo(...pts[i]):g.moveTo(...pts[i]);g.closePath();g.fillStyle=fill;g.fill();}
// Spike shapes are retargeted to the actual boundary on every impact frame.
// Three distinct shaded planes give each protrusion a real low-poly volume.
function blade(g,x,y,dx,dy,width,shade){
 const n=Math.hypot(dx,dy)||1,px=-dy/n*width,py=dx/n*width;
 const root=[x,y],tip=[x+dx,y+dy],left=[x+px,y+py],right=[x-px,y-py],ridge=[x+dx*.28-px*.18,y+dy*.28-py*.18];
 polygon(g,[left,tip,ridge],"#f1f4f7");polygon(g,[tip,right,ridge],"#788591");polygon(g,[left,ridge,right,root],shade);
}
function spikes(g,p,b,data,w,x,y){
 if(!b||p.rise<.80||p.impactIndex<4||p.breakup>=1)return;
 const H=Math.max(1,b.bottom-b.top),B=Math.max(1,b.right-b.left),burst=p.burst||0;
 g.save();g.translate(x,y);
 if(burst>0){
  g.globalAlpha*=1-p.breakup*.8;
  for(let i=0;i<12;i++){
   const row=Math.round(b.top+H*(.12+i*.069)),side=i%2?1:-1;
   let edge=side<0?b.left:b.right;
   while(edge>=b.left&&edge<=b.right&&data[(row*w+edge)*4+3]<128)edge-=side;
   if(edge<b.left||edge>b.right)continue;
   const length=Math.min(H*.29,B*.48)*(1+(i%3)*.19)*burst,base=Math.max(2,H*.032);
   const dy=length*(i%3===0?-.62:i%3===1?-.13:.35);
   blade(g,edge-side*base*.3,row,side*length,dy,base,"#b5c0cb");
  }
  for(let i=0;i<7;i++){
   const row=Math.round(b.top+H*(.22+i*.09)),cx=Math.round(b.left+B*(.35+(i%3)*.14));
   if(data[(row*w+cx)*4+3]<128)continue;
   const len=H*.16*burst,side=i%2?1:-1;
   blade(g,cx,row,side*len*.76,-len*.55,H*.027,"#a4b0bc");
  }
 }
 if(p.impactIndex>=12){
  const q=C((p.impactIndex-11)/4);g.globalAlpha*=1-q*.65;
  for(let i=0;i<18;i++){
   const side=i%2?1:-1,row=b.top+H*(.1+((i*7)%17)/20),cx=side<0?b.left:b.right;
   const len=H*(.026+(i%4)*.012),dx=side*(H*.03+q*H*(.12+(i%4)*.045)),dy=q*H*(.06+(i%5)*.035)-Math.sin(q*Math.PI)*H*.15;
   blade(g,cx+dx,row+dy,side*len,-len*.55,len*.42,"#b2bdc8");
  }
 }
 g.restore();
}
function coat(g,phase,paint,rect){
 if(!phase?.active||phase.rise<=0)return paint(g);
 const {x,y,w,h}=rect,cw=Math.ceil(w),ch=Math.ceil(h);
 if(!scratch)scratch=document.createElement("canvas");
 if(scratch.width!==cw)scratch.width=cw;if(scratch.height!==ch)scratch.height=ch;
 const ctx=scratch.getContext("2d",{willReadFrequently:true});ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cw,ch);
 ctx.save();ctx.translate(-x,-y);const result=paint(ctx);ctx.restore();
 if(result===false)return false;
 const im=ctx.getImageData(0,0,cw,ch),bounds=metalPixels(im.data,cw,ch,phase.broken?{...phase,breakup:0}:phase);
 ctx.putImageData(im,0,0);
 // The mask comes from the current, dressed target pose, so every body,
 // cape, staff and creature has the correct outline without a dummy asset.
 g.save();if(phase.broken)g.globalAlpha*=1-phase.breakup;
 g.drawImage(scratch,x,y,cw,ch);
 spikes(g,phase,bounds,im.data,cw,x,y);g.restore();
 return result===undefined?true:result;
}
function shake(p,hit=.73){const q=(p-hit)/.085;if(q<0||q>=1)return{x:0,y:0};const f=(1-q)**2;return{x:Math.sin(q*35)*7*f,y:Math.cos(q*31)*4*f};}
function portrait(g,w,h){const size=Math.min(w,h)*1.13;tile(g,9,(w-size)/2,(h-size)/2,size,size);}
window.Quicksilver={ensure,ready,error:()=>"",frameCounts:{travel:waveFrames.length,formation:shellFrames.length,impact:impactFrames.length},scene,draw,coverage,stagePhase,surfaceScene,coat,metalPixels,silhouette,shake,portrait};ensure();
})();