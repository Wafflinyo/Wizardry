const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"tectoniccrush",name:"Tectonic Crush",school:"earth",cost:6,target:"enemy",kind:"damage",damage:780,accuracy:.85,boulderChance:.25'));
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["tectoniccrush","sentinelfissure"'));
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
for(const p of ['assets/tectonic-rocks.webp','assets/tectonic-impact.webp']){
 const b=fs.readFileSync(p);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
}
console.log('Tectonic Crush: original raster frames, separate depth layers, exact hit and opening hand order.');