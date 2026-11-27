const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const a=fs.readFileSync('arena.js','utf8');
assert.ok(a.includes('id:"jellyshock",name:"Jellyshock",school:"water",cost:3,target:"enemy",kind:"damage",damage:280,stunChance:.15,accuracy:.85'));
assert.ok(a.includes('RECENTLY_UPDATED_CARDS=["hydroserpent","fountainofyouth","hydrocannon"'));
assert.ok(a.includes('if(card.id==="jellyshock"&&dealt>0&&t.hp>0&&t.team!==c.team&&!preventsHitEffects(anim,t))attemptVoltStun'));
const target={id:'t',hp:1000,statuses:[]},source={name:'Caster'},card={id:'jellyshock',name:'Jellyshock',school:'water',stunChance:.15};
const state={round:2,phase:'resolving',sequence:[{casterId:'t'}],queueAt:0};
let permitted=true;
const ctx={state,BY_ID:{},canReceiveDebuff:()=>permitted,addStatus:(t,k)=>t.statuses.push(k),flash(){},recordBattleEvent(){}};
vm.runInNewContext(a.slice(a.indexOf('  function attemptVoltStun('),a.indexOf('  function blockWithWindDome(')),ctx);
assert.equal(ctx.attemptVoltStun(source,target,card,.15),false);
assert.equal(ctx.attemptVoltStun(source,target,card,.149),true);assert.equal(target.stunRound,2);
state.queueAt=1;assert.equal(ctx.attemptVoltStun(source,target,card,0),true);assert.equal(target.stunRound,3);
permitted=false;assert.equal(ctx.attemptVoltStun(source,target,card,0),false);
target.hp=0;permitted=true;assert.equal(ctx.attemptVoltStun(source,target,card,0),false);
const visual={window:{},Image:class{constructor(){this.complete=true;}set src(s){this.naturalWidth=s.includes('body')?1448:1446;this.naturalHeight=s.includes('body')?1086:3252;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync('assets/jellyshock.js','utf8'),visual);
const art=visual.window.Jellyshock;assert.ok(art.ready());assert.equal(art.hit,.62);assert.equal(art.frameCount,48);assert.equal(art.effectFrameCount,72);
for(const x of [200,250,750,800])for(const y of [320,420,540])for(const factor of [1,1.5,2]){
 const t={x,y},src={x:1000-x},s=art.scene(src,t,.62,factor),r=art.lashPath(s);
 assert.equal(s.x,500);assert.equal(s.y,510);assert.equal(s.dir,x>500?1:-1);assert.ok(Math.abs(r.to.x-x)<1e-7&&Math.abs(r.to.y-s.end.y)<1e-7);
 assert.ok(s.end.y<y);assert.equal(art.lashPath(art.scene(src,t,.80,factor)),null);
 for(let n=0;n<=100;n++){
 const s=art.scene(src,t,n/100,factor),calls=[],g={globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(...a){calls.push(a)}};
 art.pool(g,s);art.actor(g,s);art.lash(g,s);art.impact(g,s);
 for(const c of calls)assert.ok(c[1]>=0&&c[2]>=0&&c[1]+c[3]<=c[0].naturalWidth&&c[2]+c[4]<=c[0].naturalHeight);
 }
}
console.log('Jellyshock: separate illustrated frames, target anchoring, 15% stun threshold and one-action timing.');