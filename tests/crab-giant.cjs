const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{},Image:class{}};vm.runInNewContext(fs.readFileSync('assets/crab-giant.js','utf8'),context);
const fx=context.window.CrabGiant;
for(const x of [210,790]){
 const calls=[],g=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
 const target={x,y:450};
 fx.impact(g,{target,progress:.71,hit:.72});assert.equal(calls.length,0);
 fx.impact(g,{target,progress:.72,hit:.72});assert.ok(calls.some(a=>a[0]==='translate'&&a[1]===x&&a[2]===364));assert.ok(calls.filter(a=>a[0]==='fill').length>=59);
 assert.ok(calls.some(a=>a[0]==='ellipse'));assert.ok(calls.some(a=>a[0]==='scale'&&a[1]===(x>=500?1:-1)));
 calls.length=0;fx.impact(g,{target,progress:.95,hit:.72});assert.equal(calls.length,0);
}
assert.equal(fx.shake(.71).x,0);assert.ok(fx.shake(.72,1).x>0);assert.ok(fx.shake(.72,-1).x<0);assert.equal(fx.shake(.80).x,0);
console.log('Crab Giant snap flash, mirrored spray, pressure arcs and timed shake passed.');
