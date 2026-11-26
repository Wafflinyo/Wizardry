const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');assert.ok(a.includes('damage:380,barrierBonus:.50,accuracy:.85'));assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["quicksilver"'));
const start=a.indexOf('  function barrierDamagePortion('),end=a.indexOf('\n  }',start)+4,ctx={};vm.runInNewContext(a.slice(start,end),ctx);
function check(amount,hp,bonus,shieldDamage,spent){const r=ctx.barrierDamagePortion(amount,hp,bonus);assert.equal(r.shieldDamage,shieldDamage);assert.equal(r.spent,spent);}
check(380,400,.5,400,267);check(380,1000,.5,570,380);check(380,250,.5,250,167);check(380,400,0,380,380);check(113,360,.5,169,113);
const art={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=768;}}};vm.runInNewContext(fs.readFileSync('assets/quicksilver.js','utf8'),art);
const fx=art.window.Quicksilver;assert.ok(fx.ready());
for(const team of [0,1]){
 const s={team},target={x:team?200:800,y:450};
 const at=fx.scene(s,target,.5);assert.equal(at.x,target.x);assert.equal(at.y,target.y+4);assert.equal(at.dir,team?-1:1);
 for(let i=0;i<=100;i++){const frame=fx.scene(s,target,i/100).frame;assert.ok(frame>=0&&frame<12,'never use spear tiles');}
}
assert.equal(fx.coverage(.2).active,false);assert.ok(fx.coverage(.55).rise>0&&fx.coverage(.55).rise<1);
assert.equal(fx.coverage(.73).rise,1);assert.equal(fx.coverage(.73).hard,1);assert.equal(fx.coverage(.73).breakup,0);
assert.ok(fx.coverage(.95).breakup>0);assert.equal(fx.coverage(1).active,false);
const original=new Uint8ClampedArray(4*8*4);for(let y=1;y<7;y++)for(let x=1;x<3;x++){const j=(y*4+x)*4;original.set([200,35,20,255],j);}
const coated=original.slice();fx.metalPixels(coated,4,8,fx.coverage(.73));assert.equal(coated[3],0);assert.equal(coated[(1*4+1)*4+3],255);assert.notEqual(coated[(1*4+1)*4+1],35);
const partial=original.slice();fx.metalPixels(partial,4,8,{rise:.4,hard:0,breakup:0,frame:25});assert.equal(partial[(1*4+1)*4+1],35);assert.notEqual(partial[(6*4+1)*4+1],35);
assert.ok(a.includes('window.Quicksilver.coat(ctx,metal,paint,rect)'));assert.equal((a.match(/paintBody\(g,/g)||[]).length,5);
assert.ok(fs.existsSync('assets/quicksilver-frames.webp'));console.log('Quicksilver: liquid travel, bottom-up full body coating, hardening, release and unchanged barrier bonus.');
