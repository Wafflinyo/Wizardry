const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1280;this.naturalHeight=960;}},setTimeout:()=>0,clearTimeout:()=>{}};
vm.runInNewContext(fs.readFileSync('assets/thunder-god-drums.js','utf8'),context);
const fx=context.window.ThunderGodDrums;
for(let n=1;n<=4;n++){
 const targets=Array.from({length:n},(_,i)=>({x:700+i*20,y:420,arm:i%2,strikeAt:1100+i*850,hitAt:1530+i*850}));
 const last=targets.at(-1),duration=last.hitAt+1400;
 assert.equal(fx.scene(last.hitAt,duration,targets).alpha,1);
 const hold=fx.scene(last.hitAt+699,duration,targets);assert.equal(hold.alpha,1);assert.ok(hold.frame<22);
 const fade=fx.scene(last.hitAt+1050,duration,targets);assert.equal(fade.alpha,.5);assert.equal(fade.frame,23);
 assert.equal(fx.scene(duration,duration,targets).alpha,0);
}
const arena=fs.readFileSync('arena.js','utf8');
assert.match(arena,/kind:"thundergoddrums",damage:480,accuracy:\.80/);
assert.match(arena,/startStage\(a,"summon",\(a\.drumTargets\.at\(-1\)\?\.hitAt\?\?1530\)\+1400\)/);
console.log('Thunder God Drums: 480 base damage, final-impact hold and fade for one to four targets.');
