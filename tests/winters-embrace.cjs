const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const arena=fs.readFileSync('arena.js','utf8');
assert.ok(arena.includes('id:"wintersembrace",name:"Winter’s Embrace",school:"ice",cost:3,target:"ally",kind:"wintersembrace",accuracy:.95,reduction:.50,rounds:3'));
assert.ok(arena.includes('const BENEFICIAL_RUNES=new Set(["winters_embrace"'));
assert.ok(arena.includes('wintersembrace:"winters_embrace"'));
assert.ok(arena.includes('grovelandMultiplier(school)*wintersEmbraceMultiplier(u,kind)'));
const start=arena.indexOf('  function applyWintersEmbrace('),end=arena.indexOf('  function tickBurnsForRound(',start);
const ctx={state:{round:4},addStatus(u,kind,_,value,school){let s=u.statuses.find(s=>s.kind===kind);if(!s){if(u.statuses.length>=4)return false;s={kind};u.statuses.push(s);}Object.assign(s,{value,school});},flash(){},recordBattleEvent(){},window:{},setTimeout,clearTimeout,Image:class{constructor(){this.complete=false;}set src(s){this.complete=true;this.naturalWidth=1536;this.naturalHeight=768;this.onload?.();}}};
vm.runInNewContext(arena.slice(start,end),ctx);
const c={id:'c',team:0,hp:2000,statuses:[]},u={id:'u',team:0,hp:2000,statuses:[]},card={school:'ice',reduction:.5,rounds:3};
assert.equal(ctx.applyWintersEmbrace(c,u,card),true);
for(let r=5;r<=7;r++){ctx.state.round=r;for(const kind of ['burn','poison','frostbite']){assert.equal(50*ctx.wintersEmbraceMultiplier(u,kind),25);assert.equal(100*ctx.wintersEmbraceMultiplier(u,kind),50);}for(const kind of ['curse','water_prison','direct'])assert.equal(ctx.wintersEmbraceMultiplier(u,kind),1);}
ctx.state.round=8;assert.equal(ctx.wintersEmbraceMultiplier(u,'burn'),1);
assert.equal(ctx.applyWintersEmbrace(c,u,card),true);assert.equal(u.statuses.length,1);assert.equal(u.statuses[0].expiresRound,12);
assert.equal(ctx.applyWintersEmbrace(c,{...u,team:1},card),false);
assert.equal(ctx.applyWintersEmbrace(c,{...u,statuses:[{kind:'a'},{kind:'b'},{kind:'c'},{kind:'d'}]},card),false);
vm.runInNewContext(fs.readFileSync('assets/winters-embrace.js','utf8'),ctx);
(async()=>{const art=ctx.window.WintersEmbrace;assert.ok(await art.ensure());assert.equal(art.frameCount,32);const seen=new Set(),g={globalAlpha:1,save(){},restore(){},beginPath(){},rect(){},clip(){},drawImage(im,x,y,w,h){assert.ok(x+w<=1536&&y+h<=768);seen.add(y/192*8+x/192);}};
for(let i=0;i<3200;i++)art.cast(g,{x:400,y:450},i/3200,1,'front');assert.equal(seen.size,32);art.portrait(g,300,300);assert.ok(fs.existsSync('assets/winters-embrace.webp'));console.log('Winter’s Embrace: three protected ticks, normal/extreme status damage halved, no direct reduction, rune cap and refresh, all 32 effect frames.');})().catch(e=>{console.error(e);process.exitCode=1;});
