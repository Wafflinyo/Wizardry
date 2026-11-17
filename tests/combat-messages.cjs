const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let code=fs.readFileSync('arena.js','utf8').replace('  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);','');const node={getContext:()=>({})},ctx={window:{},Image:class{},document:{getElementById:()=>node},requestAnimationFrame:()=>{}};vm.runInNewContext(code,ctx);const api=ctx.window.WIZARDRY_ARENA_TEST;
const c={save(){},restore(){},font:'',measureText(text){return {width:text.length*Number(this.font.match(/\d+px/)[0].slice(0,-2))*.65};}};
function check(messages){const boxes=api.layoutCombatMessages(c,messages);assert.equal(boxes.length,messages.length);for(let i=0;i<boxes.length;i++){const a=boxes[i];assert.ok(a.x-a.width/2>=0&&a.x+a.width/2<=1000&&a.y-a.height/2>=0&&a.y+a.height/2<=620,'labels stay on screen');for(const b of boxes.slice(i+1))assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2||Math.abs(a.y-b.y)>=(a.height+b.height)/2,'every label remains separate');}return boxes;}
const message=(text,x=800,y=342,age=0)=>({text,x,y,age,color:'#fff'});
let a=check([message('-280'),message('FEAR · 3 ROUNDS')]);assert.ok(a[1].y<a[0].y,'debuff sits above damage');
for(let i=0;i<96;i++){const age=i/100;check([message('-'+(50+Math.floor(i/10)*50),800,342,i%10/100),message('FEAR · 3 ROUNDS',800,342,age),message('FROSTBITE · 3 TURNS',790,340,age),message('+200 HP',810,350,age)]);}
check(Array.from({length:18},(_,i)=>message(i%2?'-500':'FROSTBITE · 5 TURNS',490+i%3*10,340,i%4*.1)));
check([message('-280',10,8,.9),message('FEAR · 3 ROUNDS',10,8,.9)]);
check(Array.from({length:18},()=>message('VERY LONG SIMULTANEOUS SPELL STATUS MESSAGE '.repeat(3))));
const art={window:{},Image:class{complete=true;naturalWidth=1247;naturalHeight=1261;}};vm.runInNewContext(fs.readFileSync('assets/jack-v129.js','utf8'),art);const fx=art.window.WIZARDRY_JACK_V129;assert.equal(fx.crowPose(.2,{x:800,y:450},0).size,54);assert.equal(fx.crowPose(.8,{x:800,y:450},0).size,61);assert.equal(fx.glowStrength(.4),0);assert.ok(fx.glowStrength(.52)>.95);assert.ok(fx.glowStrength(.61)>.99);assert.equal(fx.glowStrength(.67),0);assert.ok((fx.SWARM-.50)*5200>=600,"bright glow holds at least 600ms before launch");
for(let i=0;i<3;i++){const b=fx.crowPose(.61,{x:800,y:450},i);assert.ok(Math.abs(b.x-500)<=76,"crows keep circling during glow hold");}
console.log('Combat messages: simultaneous damage/debuff/heal, growing totals, floating ages, screen edges and 18-label crowds remain separate. Jack: larger crows and pre-swarm face glow timing passed.');
