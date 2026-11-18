const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const pixels=new Uint8ClampedArray(128*128*4);function pixel(x,y,r,g,b){pixels.set([r,g,b,255],(y*128+x)*4);}pixel(40,7,90,55,140);pixel(84,77,233,168,81);pixel(74,48,206,121,69);pixel(50,25,233,168,81);pixel(90,95,154,93,40);
let painted;const ctx={window:{},document:{createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:pixels}),createImageData:()=>({data:new Uint8ClampedArray(pixels.length)}),putImageData(p){painted=p.data;}})})}};
vm.runInNewContext(fs.readFileSync('assets/wizard-palettes-v38.js','utf8'),ctx);const source={complete:true,naturalWidth:128,naturalHeight:128};
const P=ctx.window.WizardryPalettes;
for(const skinColor of Object.keys(P.skinColors).filter(c=>c!=='#cca084')){P.getAtlas(source,'wizard',{skinColor});for(const [x,y] of [[84,77],[74,48]]){const at=(y*128+x)*4;assert.notDeepEqual(Array.from(painted.slice(at,at+3)),Array.from(pixels.slice(at,at+3)),skinColor+' changes skin');}for(const [x,y] of [[50,25],[90,95]]){const at=(y*128+x)*4;assert.deepEqual(Array.from(painted.slice(at,at+4)),Array.from(pixels.slice(at,at+4)),'trim/staff preserved');}}
vm.runInNewContext(fs.readFileSync('assets/element-tracing-v45.js','utf8'),ctx);const T=ctx.window.WIZARDRY_ELEMENT_TRACE_V45;for(const e of ['water','earth','lightning','nature','wind','dark','fire','ice']){assert.ok(T.svgFor(e).includes('<svg'));assert.ok(T.svgFor(e).includes(T.pathFor(e).map(p=>p.join(',')).join(' ')));}
assert.ok(fs.readFileSync('assets/wizard-home-v135.css','utf8').includes('touch-action:manipulation'));
console.log('Appearance: all skin choices recolor actual sprite skin shades, trim/staff stay intact, and mastery artwork uses all eight trace paths.');
