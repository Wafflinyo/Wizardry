const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');assert.ok(a.includes('damage:380,barrierBonus:.50,accuracy:.85'));assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["quicksilver"'));
const start=a.indexOf('  function barrierDamagePortion('),end=a.indexOf('\n  }',start)+4,ctx={};vm.runInNewContext(a.slice(start,end),ctx);
function check(amount,hp,bonus,shieldDamage,spent){const r=ctx.barrierDamagePortion(amount,hp,bonus);assert.equal(r.shieldDamage,shieldDamage);assert.equal(r.spent,spent);}
check(380,400,.5,400,267);check(380,1000,.5,570,380);check(380,250,.5,250,167);check(380,400,0,380,380);check(113,360,.5,169,113);
const art={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=768;}}};vm.runInNewContext(fs.readFileSync('assets/quicksilver.js','utf8'),art);
const fx=art.window.Quicksilver;assert.ok(fx.ready());for(const team of [0,1]){const s={team},target={x:team?200:800,y:450};assert.equal(fx.scene(s,target,0).frame,0);assert.equal(fx.scene(s,target,.729).frame,23);assert.equal(fx.scene(s,target,.73).frame,24);assert.equal(fx.scene(s,target,1).frame,31);assert.equal(fx.scene(s,target,1).dir,team?-1:1);}
assert.ok(fs.existsSync('assets/quicksilver-frames.webp'));console.log('Quicksilver: barrier bonus without HP bonus, 32 authored frames, mirrored travel.');
