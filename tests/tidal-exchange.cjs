const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const arena=fs.readFileSync("arena.js","utf8");
assert.ok(arena.includes('id:"tidalexchange",name:"Tidal Exchange",school:"water",cost:3,target:"ally",kind:"tidalexchange",manaRestore:4,accuracy:.90'));
assert.ok(arena.includes('const gained=restoreTidalMana(t,card.manaRestore)'));
assert.ok(/const TEST_TIDAL_EXCHANGE=\{[^\n]*duration:3500,hit:\.72/.test(arena));
assert.ok(arena.includes('type:"tidal-exchange-back",depthY:target.y-.16'));
assert.ok(arena.includes('type:"tidal-exchange-front",depthY:target.y+.20'));
const code=arena.match(/function restoreTidalMana\(target,amount\)\{[\s\S]*?\n  \}/)[0];
const restore=vm.runInNewContext("("+code+")",{MAX_MANA:20});
for(const [mana,max,gain] of [[0,20,4],[17,20,3],[20,20,0],[19,42,4]]){
 const target={mana,maxMana:max};assert.equal(restore(target,4),gain);assert.equal(target.mana,mana+gain);
}
const self={mana:20,maxMana:20};self.mana-=3;assert.equal(restore(self,4),3);assert.equal(self.mana,20);
const low={mana:10,maxMana:20};low.mana-=3;assert.equal(restore(low,4),4);assert.equal(low.mana,11);
const ctx={window:{},Image:class{constructor(){this.complete=true;}set src(s){assert.ok(s.includes("tidal-exchange-32.webp"));this.naturalWidth=1600;this.naturalHeight=960;this.onload?.();}}};
vm.runInNewContext(fs.readFileSync("assets/tidal-exchange.js","utf8"),ctx);
(async()=>{const art=ctx.window.TidalExchange;assert.ok(await art.ensure());assert.equal(art.frameCount,32);for(let i=0;i<=320;i++){const s=art.scene({x:300,y:450},i/320,1.5);assert.equal(s.y,458);assert.ok(s.n>=0&&s.n<32);let images=0;const g={globalAlpha:1,save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},drawImage(im,x,y,w,h){assert.ok(x>=0&&y>=0&&x+w<=1600&&y+h<=960);images++;}};art.back(g,s);const rearImages=images;art.front(g,s);assert.equal(images,rearImages);for(const v of art.ribbonSegments(s)){assert.ok(v.a.z*v.b.z>=-1e-8);assert.equal(v.front,v.a.z+v.b.z>0);}if(i===192){assert.ok(art.ribbonSegments(s).some(v=>v.front));assert.ok(art.ribbonSegments(s).some(v=>!v.front));}}console.log("Tidal Exchange: capped mana restore, self cast and 32 frame bounds.");})().catch(e=>{console.error(e);process.exitCode=1;});
