/* Wizardry 0.38 — independent hat, robe, and skin palette swaps.
   All colors use the same approved full-body idle/cast/defeat sprites:
   no regenerated frames, no duplicated props, no added animation layers. */
(function(global){
  "use strict";
  const DEFAULT="#6f4ab4",DEFAULT_SKIN="#cca084",CELL=128,MAX_CACHE=18;
  const paletteColors=Object.freeze({
    "#6f4ab4":"Amethyst","#3269c1":"Royal Blue","#128e9e":"Ocean Teal",
    "#2c8a64":"Emerald","#b83a55":"Crimson","#d08a34":"Amber",
    "#ad5c9d":"Rose","#44526b":"Slate","#dfd8c7":"Ivory",
    "#30293c":"Midnight"
  });
  const skinColors=Object.freeze({
    "#cca084":"Classic","#f1cfad":"Fair","#e7b081":"Warm",
    "#c7885b":"Golden Tan","#a96b4a":"Bronze","#805036":"Deep Brown",
    "#58382f":"Espresso","#81b9c8":"Frost Blue","#b197c5":"Lavender"
  });
  const sources=new WeakMap(),colored=new Map();
  function rgb(hex){
    if(typeof hex!=="string"||!/^#[\da-f]{6}$/i.test(hex))return null;
    return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  }
  function isPurple(r,g,b,a){
    // Isolate the richly shaded purple cloth, excluding brown staff,
    // metallic yellow trim, boots, hair, and cyan crystals.
    return a>12&&b>r*1.17&&b>g*1.18&&r>g*.90&&r>20;
  }
  function isSkin(r,g,b,a,x,y,top){
    // Only exposed face and hands on the front of the sprite. The
    // spatial restriction protects boots and the wooden staff.
    return a>12&&r>155&&g>110&&b>55&&r>g*1.07&&r<g*1.58&&
      g>b*1.08&&b>g*.64&&x>CELL*.48&&
      y>=top+CELL*.27&&y<CELL*.96;
  }
  function analyze(source){
    let found=sources.get(source);if(found)return found;
    if(!source.complete||!source.naturalWidth)return null;
    const width=source.naturalWidth,height=source.naturalHeight;
    if(width%CELL||height%CELL)return null;
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)return null;
    ctx.drawImage(source,0,0);
    let original;
    try{original=ctx.getImageData(0,0,width,height);}catch{return null;}
    const pix=original.data,cols=width/CELL,rows=height/CELL;
    const top=new Int16Array(cols*rows);top.fill(CELL);
    // Find the upper edge of the hat in EACH pose, including crouching.
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const at=(y*width+x)*4;
      if(!isPurple(pix[at],pix[at+1],pix[at+2],pix[at+3]))continue;
      const n=Math.floor(y/CELL)*cols+Math.floor(x/CELL);
      const yy=y%CELL;if(yy<top[n])top[n]=yy;
    }
    const positions=[[],[],[]]; // [hat,robe,skin]; cache indexes once.
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const at=(y*width+x)*4,r=pix[at],g=pix[at+1],b=pix[at+2],a=pix[at+3];
      if(a<=12)continue;
      const n=Math.floor(y/CELL)*cols+Math.floor(x/CELL);
      const yy=y%CELL,xx=x%CELL,hatTop=top[n]===CELL?0:top[n];
      if(isPurple(r,g,b,a)){
        positions[yy<hatTop+CELL*.39?0:1].push(at);
      }else if(isSkin(r,g,b,a,xx,yy,hatTop)){
        positions[2].push(at);
      }
    }
    found={original,width,height,positions};
    sources.set(source,found);return found;
  }
  function recolor(source,look,kind){
    const robe=paletteColors[look.robeColor]?look.robeColor:DEFAULT;
    const hat=paletteColors[look.hatColor]?look.hatColor:DEFAULT;
    const skin=skinColors[look.skinColor]?look.skinColor:DEFAULT_SKIN;
    if(robe===DEFAULT&&hat===DEFAULT&&skin===DEFAULT_SKIN)return source;
    const key=kind+"|"+robe+"|"+hat+"|"+skin;
    if(colored.has(key)){
      const v=colored.get(key);colored.delete(key);colored.set(key,v);return v;
    }
    const base=analyze(source);if(!base)return source;
    const out=document.createElement("canvas");out.width=base.width;out.height=base.height;
    const ctx=out.getContext("2d");if(!ctx)return source;
    const pixels=ctx.createImageData(base.width,base.height);
    pixels.data.set(base.original.data);
    const settings=[[hat,DEFAULT,156],[robe,DEFAULT,156],[skin,DEFAULT_SKIN,210]];
    for(let role=0;role<3;role++){
      const [hex,original,baseLight]=settings[role];
      if(hex===original)continue;
      const target=rgb(hex);if(!target)continue;
      const list=base.positions[role];
      for(let i=0;i<list.length;i++){
        const at=list[i];
        const brightness=Math.max(base.original.data[at],
          base.original.data[at+1],base.original.data[at+2]);
        const light=Math.max(.14,Math.min(1.60,brightness/baseLight));
        pixels.data[at]=Math.min(255,Math.round(target[0]*light));
        pixels.data[at+1]=Math.min(255,Math.round(target[1]*light));
        pixels.data[at+2]=Math.min(255,Math.round(target[2]*light));
      }
    }
    ctx.putImageData(pixels,0,0);
    colored.set(key,out);
    if(colored.size>MAX_CACHE)colored.delete(colored.keys().next().value);
    return out;
  }
  global.WizardryPalettes={
    getAtlas:(image,kind,look)=>recolor(image,look||{},kind),
    robeColors:paletteColors,hatColors:paletteColors,skinColors,
    clear:()=>colored.clear()
  };
})(window);
