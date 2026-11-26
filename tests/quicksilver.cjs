const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');assert.ok(a.includes('damage:380,barrierBonus:.50,accuracy:.85'));assert.ok(/RECENTLY_UPDATED_CARDS=\[[^\]]*"quicksilver"/.test(a));
const start=a.indexOf('  function barrierDamagePortion('),end=a.indexOf('\n  }',start)+4,ctx={};vm.runInNewContext(a.slice(start,end),ctx);
function check(amount,hp,bonus,shieldDamage,spent){const r=ctx.barrierDamagePortion(amount,hp,bonus);assert.equal(r.shieldDamage,shieldDamage);assert.equal(r.spent,spent);}
check(380,400,.5,400,267);check(380,1000,.5,570,380);check(380,250,.5,250,167);check(380,400,0,380,380);check(113,360,.5,169,113);
const art={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=768;}}};vm.runInNewContext(fs.readFileSync('assets/quicksilver.js','utf8'),art);
const fx=art.window.Quicksilver;assert.ok(fx.ready());
for(const team of [0,1]){
 const s={team},target={x:team?200:800,y:450};
 const at=fx.scene(s,target,.5);assert.equal(at.x,target.x);assert.equal(at.y,target.y+4);assert.equal(at.dir,team?-1:1);
 for(let i=0;i<=100;i++){const frame=fx.scene(s,target,i/100).frame;assert.ok(frame>=0&&frame<16,'never use spear tiles');}
}
assert.equal(fx.coverage(.2).active,false);assert.ok(fx.coverage(.55).rise>0&&fx.coverage(.55).rise<1);
assert.equal(fx.coverage(.73).rise,1);assert.equal(fx.coverage(.73).hard,1);assert.equal(fx.coverage(.73).breakup,0);
assert.ok(fx.coverage(.95).breakup>0);assert.equal(fx.coverage(1).active,false);
const original=new Uint8ClampedArray(4*8*4);for(let y=1;y<7;y++)for(let x=1;x<3;x++){const j=(y*4+x)*4;original.set([200,35,20,255],j);}
const coated=original.slice();fx.metalPixels(coated,4,8,fx.coverage(.73));assert.equal(coated[3],0);assert.equal(coated[(1*4+1)*4+3],255);assert.notEqual(coated[(1*4+1)*4+1],35);
const partial=original.slice();fx.metalPixels(partial,4,8,{rise:.4,hard:0,breakup:0,frame:25});assert.equal(partial[(1*4+1)*4+1],35);assert.notEqual(partial[(6*4+1)*4+1],35);
assert.ok(a.includes('window.Quicksilver.coat(ctx,metal,original,rect)'));assert.ok((a.match(/paintBody\(g,/g)||[]).length>=5);
assert.ok(fs.existsSync('assets/quicksilver-frames.webp'));console.log('Quicksilver: liquid travel, bottom-up full body coating, hardening, release and unchanged barrier bonus.');

const stage={startAt:0,hitAt:2628,kind:"sand_warrior"};
assert.equal(fx.stagePhase(2627,stage).burst,0);assert.ok(fx.stagePhase(2628,stage).burst>0);
assert.equal(fx.stagePhase(2628,stage).rise,1);
const follow={startAt:3068,hitAt:3998,kind:"body",from:"sand_warrior"};
const t={x:800,y:450,team:1};
assert.equal(fx.surfaceScene({team:0},t,3068,follow,1).x,694);
assert.equal(fx.surfaceScene({team:0},t,3998,follow,1).x,800);
const source={team:0,hp:1000},target={id:"t",team:1,hp:1000,statuses:[]};
const c={state:{round:1},getUnit:()=>target,petrified:()=>false,paintUI:()=>{},absorbFaultlineDamage:(_t,n)=>absorb("faultline_bulwark",n),absorbBarrierDamage:(_t,n,_d,_b,k)=>absorb(k,n),absorbPetrifyDamage:(_t,n)=>n,splitReflectiveIce:()=>null};
function absorb(kind,n){const st=target.statuses.find(s=>s.kind===kind);const {shieldDamage,spent}=ctx.barrierDamagePortion(n,st.value,.5);st.value-=shieldDamage;if(!st.value)target.statuses=target.statuses.filter(s=>s!==st);return n-spent;}
const qsStart=a.indexOf("  function quicksilverSurface("),qsEnd=a.indexOf("  function damage(",qsStart);vm.runInNewContext(a.slice(qsStart,qsEnd),c);
function run(statuses,expected,stages){
 target.statuses=statuses;let finished=null;const spell={card:{id:"quicksilver",duration:3600,hit:.73,barrierBonus:.5},target:"t",duration:3600,elapsed:2628};
 c.initQuicksilver(spell);c.resolveQuicksilver(source,target,380,spell,n=>{finished=n;});
 for(const kind of stages){assert.equal(finished,null);assert.equal(spell.quicksilver.next.kind,kind);spell.elapsed=spell.quicksilver.next.hitAt-1;c.advanceQuicksilver(spell);assert.equal(finished,null);spell.elapsed++;c.advanceQuicksilver(spell);}
 assert.equal(finished,expected);assert.equal(spell.quicksilver.next,null);
}
run([{kind:"bubble_shield",value:1000}],0,[]);
run([{kind:"sand_warrior",value:250}],213,["body"]);
run([{kind:"faultline_bulwark",value:350},{kind:"bubble_shield",value:100}],79,["bubble_shield","body"]);
run([],380,[]);

assert.equal(fx.frameCounts.travel,16);assert.equal(fx.frameCounts.formation,16);assert.equal(fx.frameCounts.impact,16);
assert.equal(fx.stagePhase(2627,stage).burst,0);assert.equal(fx.stagePhase(2628,stage).impactIndex,4);assert.equal(fx.stagePhase(2628+42*11,stage).impactIndex,15);
