const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"colossalgolem",name:"Colossal Golem",school:"earth",cost:7,target:"enemy",kind:"damage",damage:900,accuracy:.80,boulderChance:.25'));
assert.ok(a.includes('testCards:[TEST_COLOSSAL_GOLEM'));
assert.ok(a.includes('card.id==="colossalgolem"&&dealt>0&&t.hp>0'));
const ctx={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=384;this.naturalHeight=64;}}};
vm.runInNewContext(fs.readFileSync('assets/colossal-golem.js','utf8'),ctx);
const art=ctx.window.ColossalGolem;
assert.equal(art.frameCount,48);assert.ok(art.ready());
for(let n=0;n<48;n++)assert.equal(art.frameAt((n+.01)/48),n);
assert.equal(art.frameAt(1),47);assert.equal(art.frameAt(31/48),31);
for(const team of [0,1]){
 const s={team},t={x:team?200:800,y:450};
 assert.equal(art.scene(s,t,0).x,500);
 for(const factor of [1,1.4,2]){
  const f=art.scene(s,t,31/48,factor);
  assert.ok(Math.abs(f.x+f.dir*.04*f.size-t.x)<.00001);
  assert.equal(f.frame,31);assert.ok(f.size>=320);
 }
}
assert.equal(art.shake(.2).x,0);
assert.ok(art.shake(31/48).y>0);
for(let i=0;i<8;i++){const b=fs.readFileSync('assets/colossal-golem-row'+i+'.webp');assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');}
const u={hp:100,statuses:[],id:'enemy'};
const c={BY_ID:{boulderweight:{penalty:.3,school:'earth',turns:3}},state:{round:3,sequence:[],queueAt:0},canReceiveDebuff:()=>true,addStatus:(t,kind,_i,value)=>{t.statuses=[{kind,value}];return true;},flash:()=>{}};
const start=a.indexOf('  function applyColossalBoulder('),end=a.indexOf('\n  }',start)+4;
vm.runInNewContext(a.slice(start,end),c);
assert.equal(c.applyColossalBoulder(u,.25),false);assert.equal(c.applyColossalBoulder(u,.249),true);assert.equal(u.statuses[0].expiresRound,7);assert.equal(u.statuses[0].value,.3);
c.state.sequence=[{casterId:'enemy'}];assert.equal(c.applyColossalBoulder(u,0),true);assert.equal(u.statuses[0].expiresRound,6);
console.log('Colossal Golem: 48 raster frames, mirrored target alignment, synchronized damage, and Boulder Weight.');
