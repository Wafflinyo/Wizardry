const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const arena=fs.readFileSync('arena.js','utf8');
assert.ok(arena.includes('id:"frostboundcolossus",name:"Frostbound Colossus",school:"ice",cost:6,target:"all_enemies",kind:"frostboundcolossus",damage:480,freezeChance:.15,accuracy:.80'));
assert.ok(arena.includes('const ICE_TEST_CARDS=[TEST_MAMMOTH,TEST_PERMAFROST,TEST_SHATTERPOINT,TEST_FROSTBOUND_COLOSSUS,TEST_WINTERS_EMBRACE]'));
const ctx={window:{},setTimeout,clearTimeout,Image:class{constructor(){this.complete=false;}set src(s){this.path=s;this.complete=true;this.naturalWidth=1792;this.naturalHeight=896;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/frostbound-colossus.js','utf8'),ctx);
(async()=>{
 const art=ctx.window.FrostboundColossus;assert.ok(await art.ensure());assert.equal(art.frameCount,32);assert.equal(art.effectFrameCount,32);
 for(const team of [0,1]){
  const seen=new Set(),fx=new Set(),t={id:'t',x:team?190:810,y:430,hitAt:.80,frozen:true};
  const g={globalAlpha:1,save(){},restore(){},translate(){},scale(){},drawImage(im,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=1792&&y+h<=896);(im.path.includes('-body')?seen:fx).add(y/224*8+x/224);}};
  for(let i=1;i<4800;i++){
   const s=art.scene({team},[t],i/4800);assert.equal(s.x,500);assert.equal(s.y,510);assert.equal(s.dir,team? -1:1);
   art.actor(g,s);art.summon(g,s);art.shockwave(g,s);art.travel(g,s,t);art.impact(g,s,t);
  }
  assert.equal(seen.size,32);assert.equal(fx.size,32);
 }
 assert.ok(fs.existsSync('assets/frostbound-colossus-body.webp'));assert.ok(fs.existsSync('assets/frostbound-colossus-effects.webp'));
 const start=arena.indexOf('  function colossusTargets('),end=arena.indexOf('  function stampedeTargets(',start);
 const units=[{id:'s',team:0,hp:2000,x:200,y:450,statuses:[]},{id:'a',team:1,hp:2000,x:800,y:400,statuses:[]},{id:'b',team:1,hp:2000,x:790,y:500,statuses:[]},{id:'dead',team:1,hp:0,x:850,y:450,statuses:[]}];
 let hits=0;
 const combat={state:{mode:'tester'},alive:team=>units.filter(u=>u.team===team&&u.hp>0),getUnit:id=>units.find(u=>u.id===id),damage:(s,v,n)=>{hits++;v.hp-=n;if(v.id==='a')v.statuses.push({kind:'frozen'});},paintUI(){}};
 vm.runInNewContext(arena.slice(start,end),combat);
 const entries=combat.colossusTargets(units[0]),cast={source:'s',runeResult:'success',card:{damage:480}};
 assert.equal(entries.length,2);entries.forEach(e=>{assert.ok(combat.applyColossusHit(cast,e));assert.equal(combat.applyColossusHit(cast,e),false);});
 assert.equal(hits,2);assert.equal(units[1].hp,1520);assert.equal(units[2].hp,1520);assert.equal(entries[0].frozen,true);assert.equal(entries[1].frozen,false);
 combat.state.mode='online';assert.equal(combat.applyColossusHit(cast,{id:'a',hit:false}),false);
 console.log('Frostbound Colossus: 32 body and 32 independent effects, center summon, mirrored direction, one damage hit per living enemy.');
})().catch(e=>{console.error(e);process.exitCode=1;});
