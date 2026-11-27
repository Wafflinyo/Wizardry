const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"tectoniccrush",name:"Tectonic Crush",school:"earth",cost:6,target:"enemy",kind:"damage",damage:780,accuracy:.85,boulderChance:.25'));
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["hydrocannon","tectoniccrush","sentinelfissure"'));
assert.ok(a.includes('card.id==="tectoniccrush"&&dealt>0&&t.hp>0'));
assert.ok(a.includes('type:"tectonic-crush-back",depthY:target.y-.15'));
assert.ok(a.includes('type:"tectonic-crush-front",depthY:target.y+.15'));
const ctx={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=0;this.naturalHeight=0;}set src(s){this.naturalWidth=s.includes("rocks")?1248:1240;this.naturalHeight=1240;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/tectonic-crush.js','utf8'),ctx);
const art=ctx.window.TectonicCrush;
assert.equal(art.frameCount,48);assert.equal(art.rockFrameCount,32);assert.equal(art.impactFrameCount,16);assert.ok(art.ready());
for(let n=0;n<48;n++)assert.equal(art.frameAt((n+.01)/48),n);
assert.equal(art.frameAt(1),47);
assert.equal(art.frameAt(art.hit),28);
assert.equal(art.poseAt(27).fx,-1);
assert.equal(art.poseAt(28).fx,0);
assert.equal(art.poseAt(47).fx,15);
assert.equal(art.poseAt(47).opacity,0);
assert.ok(art.poseAt(28).offset<art.poseAt(22).offset);
for(const team of [0,1])for(const factor of [1,1.4,2]){
 const t={x:team?800:200,y:450,team};
 const s=art.scene(t,28/48,factor);assert.equal(s.x,t.x);assert.ok(s.leftX<t.x&&s.rightX>t.x);
 const calls=[];const g={globalAlpha:1,save(){},restore(){},drawImage(...args){calls.push(args);}};
 art.draw(g,s,"back");art.draw(g,s,"front");art.impact(g,s);
 assert.equal(calls.length,3);assert.ok(calls[0][1]!==calls[1][1]);assert.ok(calls[0][5]!==calls[1][5]);
}
// Check the actual raster destination bottom anchor, including perspective
// and larger guardian/boss scale. Every resting rubble frame uses the feet.
const fxBases=[256,259,262,265,267,266,264,264,266,266,265,265,263,263,263,264];
for(const team of [0,1])for(const factor of [1,1.4,2])for(const y of [320,450,540]){
 const t={x:team?800:200,y,team};
 for(let n=38;n<48;n++){
  const s=art.scene(t,(n+.01)/48,factor),calls=[];
  const g={globalAlpha:1,save(){},restore(){},drawImage(...args){calls.push(args);}};
  art.impact(g,s);assert.equal(calls.length,1);
  const d=calls[0],k=d[7]/310;
  assert.ok(Math.abs(d[6]+fxBases[s.pose.fx]*k-y)<1e-7);
  assert.ok(Math.abs(d[5]+d[7]/2-t.x)<1e-7);
 }
}
for(const p of ['assets/tectonic-rocks.webp','assets/tectonic-impact.webp']){
 const b=fs.readFileSync(p);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
}
console.log('Tectonic Crush: original raster frames, separate depth layers, exact hit and opening hand order.');