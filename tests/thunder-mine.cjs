const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const node={getContext:()=>({})},ctx={window:{},document:{getElementById:()=>node},Image:class{},requestAnimationFrame(){},console};
vm.runInNewContext(fs.readFileSync('assets/wizard-system-v135.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('arena.js','utf8').replace(
 '  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);',
 '  window.setMineState=s=>state=s;paintUI=()=>{};'),ctx);
const api=ctx.window.WIZARDRY_ARENA_TEST,card=api.cards.find(c=>c.id==='thundermine');
assert.ok(card&&!card.testOnly&&!api.testCards.some(c=>c.id===card.id));
const unit=(id,team)=>({id,name:id,team,index:0,x:team?750:250,y:430,hp:3000,maxHp:3000,mana:10,maxMana:20,statuses:[],masteries:[],skills:{},hand:[]});
function setup(){const c=unit('a',0),t=unit('b',1),s={mode:'tester',phase:'resolving',round:1,units:[c,t],auras:[null,null],log:[],flashes:[],sequence:[],queueAt:0};ctx.window.setMineState(s);return {c,t,s};}
const cast=(c,t)=>({card,action:{casterId:c.id,targetId:t.id},source:c.id,target:t.id,runeResult:'success',damageVariant:1});
const active=t=>t.statuses.find(st=>st.kind==='thunder_mine');
{
 const {c,t}=setup();const a=cast(c,t);api.applySpell(a);assert.equal(t.hp,2800);assert.equal(active(t).expiresRound,4);
 assert.equal(api.thunderMineTriggerable({card:{target:'ally',heal:200},runeResult:'success'}),false);
 assert.equal(api.thunderMineTriggerable({card:{target:'enemy',damage:200},runeResult:'failed'}),false);
 const reaction={card:{target:'enemy',damage:200},runeResult:'success'};
 assert.ok(api.beginThunderMineDetonation(reaction,t));assert.equal(reaction.stage,'mine-detonation');assert.ok(active(t));
 api.applyThunderMineDetonation(reaction);assert.equal(t.hp,2500);assert.ok(!active(t));api.applyThunderMineDetonation(reaction);assert.equal(t.hp,2500);
}
{
 const {c,t}=setup();t.statuses=['growth','blazing_rage','flow_state','live_wire'].map(kind=>({kind,value:1}));
 api.applySpell(cast(c,t));assert.equal(t.statuses.length,4);assert.ok(!active(t));assert.equal(t.hp,2800);
}
{
 const {c,t}=setup();api.applySpell(cast(c,t));api.consumeStatus(t,'thunder_mine');assert.equal(api.beginThunderMineDetonation({card,runeResult:'success'},t),false);
}
console.log('Thunder Mine: initial damage, four-rune cap, successful-cast reaction, cleanse and single detonation passed.');

// Sprite placement: both teams' mines are on the rear side, behind the
// body, and the attachment point is model- and perspective-dependent.
{
 const artCtx={window:{},Image:class{},setTimeout:()=>0,clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync('assets/thunder-mine.js','utf8'),artCtx);
 const art=artCtx.window.ThunderMine;
 for(const model of [{},{dummy:true},{minionId:'scribe'},{minionId:'acolyte'},{minionId:'pageguard'},{minionId:'magistrate'},{minionId:'inkbinder'},{minionId:'warden'},{bossId:'abyssal'},{bossId:'gale'},{bossId:'briar'},{bossId:'glacial'},{bossId:'grelus'}]){
  const l={...model,team:0,x:250,y:450},r={...model,team:1,x:750,y:450};
  const a=art.mount(l),b=art.mount(r);
  if(model.bossId){
   assert.equal(b.kind,"leg");assert.ok(b.depth>r.y&&b.y>r.y-35);
  }else{
   assert.ok(a.x<l.x&&b.x>r.x&&a.depth<l.y&&b.depth<r.y);
   assert.ok(Math.abs((l.x-a.x)-(b.x-r.x))<1e-8);
  }
  assert.equal(Math.abs(b.angle),Math.PI/2);
  assert.equal(a.y,b.y);
  const leap=art.scene(l,r,.779999);
  assert.ok(Math.abs(leap.x-b.x)<.1&&Math.abs(leap.y-b.y)<.1);
 }
 const u={x:750,y:450,team:1},wizard=art.mount(u),page=art.mount({...u,minionId:'pageguard'}),guardian=art.mount({...u,bossId:'glacial'});
 assert.ok(page.y>wizard.y&&guardian.y>wizard.y&&guardian.size>wizard.size);
 assert.equal(art.mount({...u,bossId:'grelus'}).kind,'leg');
 assert.ok(art.mount({...u,bossId:'grelus'}).x<u.x);
}

{
 const artCtx={window:{},Image:class{},setTimeout:()=>0,clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync('assets/thunder-mine.js','utf8'),artCtx);
 const art=artCtx.window.ThunderMine,cell=64,pixels=new Uint8ClampedArray(cell*cell*4);
 for(let y=20;y<44;y++)for(let x=0;x<cell;x++)if((x>=22&&x<=40)||(x>=54&&x<=57))pixels[(y*cell+x)*4+3]=255;
 assert.equal(art.torsoEdge(pixels,cell,32,1),40);
 assert.equal(art.torsoEdge(pixels,cell,32,-1),22);
 const u={x:750,y:450,team:1},m=art.mount(u);
 assert.ok(m.y>u.y-70&&m.size<45);
}

// The leg sampler stays on the chosen shin, ignoring a separate cape edge.
{
 const artCtx={window:{},Image:class{},setTimeout:()=>0,clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync('assets/thunder-mine.js','utf8'),artCtx);
 const art=artCtx.window.ThunderMine,cell=64,pixels=new Uint8ClampedArray(cell*cell*4);
 for(let y=44;y<62;y++)for(let x=0;x<cell;x++)if((x>=17&&x<=25)||(x>=34&&x<=42)||(x>=52&&x<=61))pixels[(y*cell+x)*4+3]=255;
 assert.equal(art.legCenter(pixels,cell,53,20),20);
 assert.equal(art.legCenter(pixels,cell,53,38),38);
}
