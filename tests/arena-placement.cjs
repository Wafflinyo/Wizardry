const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const node={getContext:()=>({})},ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','  paintUI=()=>{};'),ctx);const api=ctx.window.WIZARDRY_ARENA_TEST;
for(const size of [1,2,3,4]){api.startPractice(size);const s=api.getState();for(const owner of s.units){const p=api.unitPlateRect(owner),team=s.units.filter(v=>v.team===owner.team).sort((a,b)=>a.y-b.y),rank=team.indexOf(owner),above=rank<Math.ceil(team.length/2);assert.equal(p.above,above);if(!above)assert.equal(p.y,owner.y+14);const stable=JSON.stringify(p);owner.statuses.push({kind:"poison",value:50});assert.equal(JSON.stringify(api.unitPlateRect(owner)),stable,"status changes cannot move labels");owner.statuses=[];for(const wizard of s.units){const scale=.6+.3*Math.max(0,Math.min(1,(wizard.y-288)/235));const body={x:wizard.x-74*scale,y:wizard.y-220*scale,w:148*scale,h:220*scale};const intersects=p.x<body.x+body.w&&p.x+p.w>body.x&&p.y<body.y+body.h&&p.y+p.h>body.y;assert.equal(intersects,false,'attached HP plate never intersects any wizard');}for(const other of s.units.filter(v=>v.team===owner.team&&v!==owner)){const q=api.unitPlateRect(other);assert.ok(p.x+p.w<=q.x||q.x+q.w<=p.x||p.y+52<=q.y||q.y+52<=p.y,'fixed attached labels stay separate');}}}
for(const start of [api.startPractice,api.startCardTester]){
  start(4);
  const {units}=api.getState();
  for(const owner of units)for(let index=0;index<4;index++){
    const rune=api.statusRuneRect(owner,index);
    for(const other of units.filter(unit=>unit!==owner)){
      const plate=api.unitPlateRect(other);
      assert.ok(rune.x+rune.r+2<=plate.x||rune.x-rune.r-2>=plate.x+plate.w||
        rune.y+rune.r+2<=plate.y||rune.y-rune.r-2>=plate.y+plate.h+8,
        'Every rune clears the neighboring HP plates on both teams');
    }
  }
}
for(const size of [1,2,3,4]){
  ctx.window.matchMedia=()=>({matches:false});
  api.startPractice(size);
  const compact=api.getState().units.map(({x,y})=>({x,y}));
  ctx.window.matchMedia=query=>({matches:query.includes('pointer: fine')});
  api.startPractice(size);
  for(const [index,unit] of api.getState().units.entries()){
    assert.equal(unit.x,compact[index].x+(unit.team?100:-100));
    assert.equal(unit.y,compact[index].y);
  }
}
delete ctx.window.matchMedia;
let trace,outcome;ctx.window.WIZARDRY_ELEMENT_TRACE_V45={draw:(g,o)=>trace=o,drawOutcome:(g,o)=>outcome=o};const a={stage:'tracing-auto',card:api.cards[0],elapsed:300,duration:1600};api.drawAirborneRune(a);a.stage='rune-success';api.drawRuneOutcome(a);assert.equal(trace.centerY,440);assert.equal(outcome.centerY,440);
for(const f of ['jack-v129.js','octo-whip-v95.js','forrest-centaur-v100.js'])vm.runInNewContext(fs.readFileSync('assets/'+f,'utf8'),ctx);
for(const target of [{x:335,y:410},{x:265,y:550},{x:735,y:455},{x:650,y:590}]){assert.equal(ctx.window.WIZARDRY_JACK_V129.pose(.5,target).y,510);assert.equal(ctx.window.WIZARDRY_OCTO_V95.pose(.3,target).groundY,510);assert.equal(ctx.window.WIZARDRY_CENTAUR_V100.pose(.5,target).groundY,510);}
api.startPractice(4);{const s=api.getState(),caster=s.units[0],target=s.units[4],other=s.units[1];s.phase='resolving';s.animation={source:caster.id,target:target.id,card:api.cards.find(c=>c.id==='croc'),stage:'tracing-auto',elapsed:0,duration:1600};assert.equal(api.plateAlpha(other),1);s.animation.stage='rune-success';s.animation.elapsed=220;assert.equal(api.plateAlpha(other),1);assert.equal(api.plateAlpha(target),1);s.animation.stage='summon';assert.equal(api.plateAlpha(other),1);s.animation.stage='lowering';s.animation.elapsed=280;assert.equal(api.plateAlpha(other),1);s.animation.elapsed=140;assert.equal(api.plateAlpha(other),1);s.animation.card=api.cards.find(c=>c.target==='all_enemies');s.animation.stage='summon';assert.equal(api.plateAlpha(target),1);assert.equal(api.plateAlpha(other),1);}
{const pixels=new Uint8ClampedArray(6*6*4);assert.equal(api.portraitBounds(pixels,6,6),null);pixels[(1*6+2)*4+3]=255;pixels[(4*6+4)*4+3]=255;assert.equal(JSON.stringify(api.portraitBounds(pixels,6,6)),JSON.stringify({x:2,y:1,w:3,h:4}),'portrait framing removes only transparent borders');}
// Entrance and exit flame frames must share Devil Boy's actual foot anchor.
{const calls=[],ellipses=[],images=[];const renderCtx={window:{},Image:class{constructor(){this.naturalWidth=1280;this.naturalHeight=1280;images.push(this);}set src(v){this.onload?.();}}};vm.runInNewContext(fs.readFileSync('assets/devil-boy-v96.js','utf8'),renderCtx);const devil=renderCtx.window.WIZARDRY_DEVIL_V96,c=new Proxy({globalAlpha:1,drawImage:(...a)=>calls.push(a),ellipse:(...a)=>ellipses.push(a)},{get:(o,k)=>k in o?o[k]:(()=>{})});for(const target of [{x:200,y:550},{x:800,y:390}])for(const progress of [.12,.82]){calls.length=0;ellipses.length=0;devil.draw(c,{progress,target,layer:'ground'});assert.ok(ellipses.every(a=>a[1]===510),'burst ground glow stays at summon feet');devil.draw(c,{progress,target,layer:'actor'});const flames=calls.filter(a=>a[0]===images[1]);assert.ok(flames.length);for(const a of flames){const f=Math.round(a[1]/320)+Math.round(a[2]/640)*4,feet=[298,299,301,301,300,299,299,298];assert.ok(Math.abs(a[6]+feet[f]*(a[7]/320)-510)<.001,'each flame frame is grounded at actor feet');}}const t={x:800,y:550},b=devil.pose(.53,t),shot=devil.shot(.53,t);assert.equal(shot.x,b.muzzle.x);assert.equal(shot.y,b.muzzle.y);}
console.log('Placement: fixed top-above/bottom-below labels clear every wizard silhouette in 1v1–4v4; traces hold at forward center; center summons share diamond floor while retaining target positions.');
