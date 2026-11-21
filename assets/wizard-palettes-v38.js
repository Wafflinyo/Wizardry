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
    "#58382f":"Espresso","#81b9c8":"Frost Blue","#b197c5":"Lavender","#f8e0cc": "Porcelain", "#dfb798": "Sand", "#be906e": "Olive tan", "#995e43": "Sienna", "#684332": "Umber", "#432b26": "Deep mahogany", "#899e81": "Sage"
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
  // The approved sprite uses orange/tan skin, not the pale beige that
  // the original color threshold expected. Limit recoloring to exposed
  // face/hand areas so gold cuffs, trim, beard and staff keep their colors.
  const handCenters=[[84,77],[84,77],[84,77],[84,77],[84,77],[84,77],[84,77],[84,77],[84,77],[84,77],[84,77],[84,77],
    [84,77],[84,73],[84,66],[83,59],[81,53],[79,49],[78,45],[76,43],[78,46],[81,54],[83,64],[84,73],[84,77],[84,77],[84,77],[84,77]];
  function isSkin(r,g,b,a,x,y,top,frame,kind){
    const face=x>=64&&x<=85&&y>=top+34&&y<=top+51;
    const hand=kind==='wizard'?handCenters[frame]:null;
    const exposedHand=hand&&Math.hypot(x-hand[0],y-hand[1])<=7;
    const defeatHand=kind==='defeat'&&x>=65&&x<=94&&y>=top+46&&y<=top+78;
    return a>12&&(face||exposedHand||defeatHand)&&r>100&&g>55&&b>25&&
      r>g*1.20&&r<g*1.95&&g>b*1.12&&b>g*.38;
  }
  function analyze(source,kind){
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
      }else if(isSkin(r,g,b,a,xx,yy,hatTop,n,kind)){
        positions[2].push(at);
      }
    }
    found={original,width,height,positions};
    sources.set(source,found);return found;
  }
  const materialRuns={};
  function paintGear(pixels,base,look,kind,variant){
    const encoded=global.WizardMaterialMasks?.[kind];
    if(!encoded)return;
    const runs=materialRuns[kind]||(materialRuns[kind]=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)));
    const dyes=[null,variant==="clean"?null:rgb(look.beardColor),rgb(look.crystalColor),rgb(look.bootColor),rgb(look.hatTrim),rgb(look.robeTrim)];
    const levels=[0,218,222,125,224,224];
    let pixel=0;
    for(let i=0;i<runs.length;i+=4){
      pixel+=runs[i]*256+runs[i+1];
      const count=runs[i+2],role=runs[i+3],end=pixel+count;
      const target=dyes[role];
      const ridge=role<8?0:look.staffSculpt==="spiral"?(role-8)%3:look.staffSculpt==="rings"?Math.floor((role-8)/3):0;
      if(target||ridge)for(let j=pixel;j<end;j++){
        const at=j*4,src=base.original.data;
        const light=Math.max(.12,Math.max(src[at],src[at+1],src[at+2])/levels[role]);
        for(let c=0;c<3;c++)pixels.data[at+c]=target?target[c]*light:ridge===1?src[at+c]*1.35+22:src[at+c]*.63;
      }
      pixel=end;
    }
  }
  function recolor(source,look,kind,variant){
    const robe=paletteColors[look.robeColor]?look.robeColor:DEFAULT;
    const hat=paletteColors[look.hatColor]?look.hatColor:DEFAULT;
    const skin=skinColors[look.skinColor]?look.skinColor:DEFAULT_SKIN;
    const gear=[look.beardColor,look.crystalColor,look.bootColor,look.hatTrim,look.robeTrim,look.staffSculpt];
    const dyed=gear.some(v=>v&&v!=="original");
    if(robe===DEFAULT&&hat===DEFAULT&&skin===DEFAULT_SKIN&&!dyed)return source;
    const key=variant+"|"+kind+"|"+robe+"|"+hat+"|"+skin+"|"+gear.join("|");
    if(colored.has(key)){
      const v=colored.get(key);colored.delete(key);colored.set(key,v);return v;
    }
    const base=analyze(source,kind);if(!base)return source;
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
    if(dyed)paintGear(pixels,base,look,kind,variant);
    ctx.putImageData(pixels,0,0);
    colored.set(key,out);
    if(colored.size>MAX_CACHE)colored.delete(colored.keys().next().value);
    return out;
  }
  global.WizardryPalettes={
    getAtlas:(image,kind,look,variant="original")=>recolor(image,look||{},kind,variant),
    robeColors:paletteColors,hatColors:paletteColors,skinColors,
    clear:()=>colored.clear()
  };
})(window);
