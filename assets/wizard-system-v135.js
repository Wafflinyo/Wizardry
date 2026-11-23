/* Shared build rules. No DOM, storage or transport dependencies. */
(function(root){'use strict';
const elements=['water','earth','lightning','nature','wind','dark','fire','ice'];
const colors=['#6f4ab4','#3269c1','#128e9e','#2c8a64','#b83a55','#d08a34','#ad5c9d','#44526b','#dfd8c7','#30293c'];
const skins=['#cca084','#f1cfad','#e7b081','#c7885b','#a96b4a','#805036','#58382f','#81b9c8','#b197c5','#f8e0cc','#dfb798','#be906e','#995e43','#684332','#432b26','#899e81'];
const dyes={"#322c33":"Raven","#694839":"Chestnut","#ae6045":"Copper","#d6b06e":"Honey","#eee2d2":"Pearl","#84919e":"Silver","#645486":"Violet","#297c80":"Teal","#aa394e":"Ruby","#3176ad":"Sapphire","#459366":"Emerald"};
const dyeOptions={original:"Original",...dyes};
const gear={
 hairColor:{label:"Hair color",options:dyeOptions},beardColor:{label:"Facial hair color",options:dyeOptions},
 crystalColor:{label:"Staff crystal",options:dyeOptions},bootColor:{label:"Boot color",options:dyeOptions},
 robeTrim:{label:"Robe trim",options:dyeOptions},hatTrim:{label:"Hat band",options:dyeOptions},
 staffWood:{label:"Staff wood color",options:{original:"Original oak","#7b4a30":"Walnut","#633636":"Redwood","#bc8a54":"Honey maple","#c7b8a1":"Pale ash","#413a49":"Ebony","#516744":"Mosswood","#52637a":"Stormwood","#79507f":"Witchwood"}},
 staffSculpt:{label:"Staff sculpt",options:{original:"Smooth wood",spiral:"Spiral ridges",rings:"Raised rings",collared:"Wide collars",vcut:"Raised V",circle:"Raised circles",dots:"Raised dots",xcut:"Raised X"}}
};
function gearLook(p){return Object.fromEntries(Object.entries(gear).map(([key,field])=>[key,Object.hasOwn(field.options,p?.[key])?p[key]:"original"]));}
const names={water:'Water',earth:'Earth',lightning:'Lightning',nature:'Nature',wind:'Wind',dark:'Dark',fire:'Fire',ice:'Ice'};
function baseline(level=20){level=Math.max(1,Math.min(20,Math.floor(level)));return {level,hp:1500+Math.floor(level/5)*100+(level===20?100:0),mana:12+2*Math.floor(level/5),points:level};}
function orderedSpells(cards,school){
 return cards.filter(c=>c.school===school).sort((a,b)=>a.cost-b.cost||(a.id<b.id?-1:a.id>b.id?1:0));
}
// Unlock order mixes direct damage, support, and debuffs. Binder display sorts separately.
const UNLOCK_ORDER=Object.fromEntries(Object.entries({
 water:"waterblast octo shark calming bubbleshield crabgiant flowstate ragingwaters sirensmelody croc poseidon waterprison hightide whale",
 earth:"rockblast scorpion bender solidity boulderweight kineticsand quicksand rogginbowler cyclops meteorshower sentinelfissure landray earthquake",
 lightning:"shockblast electrodisc volt electricalcharge static lightningball rod thunder electriceel stormlizard zeus lightningfield claritystrike",
 nature:"solarblast bulletseed venustrap growth estel bloom thornwrap centaur healingaura drowzyflowers tree groveland thornyhug",
 wind:"windblast scaldingair ronin zen winddome windfist turbulence wind acidair sticksandstones wynzor windrazor aromatherapy",
 dark:"darkblast undead jack soul decaystrength vampire manascourge soulharvest wickedwitch darksorcerer reaper darkgrounds cursedhold",
 fire:"blazingembers devil arrows rage gunpowderkiss grillmaster kamikaze dragon reikel volcaniceruption burningpheonix sunfire flamingflamingo",
 ice:"iceblast totallyrad penguins freezing frozentouch yeti crystalicemirrors bear blizzard frosty heizmann doublepick reflectiveice",
}).map(([school,ids])=>[school,ids.split(" ")]));
function unlockOrder(cards,school){
 const order=UNLOCK_ORDER[school]||[];
 const byId=new Map(orderedSpells(cards,school).map(card=>[card.id,card]));
 const ranked=order.map(id=>byId.get(id)).filter(Boolean);
 return [...ranked,...Array.from(byId.values()).filter(card=>!order.includes(card.id))];
}
const MAX_COPIES=4;
function unlockLevel(index,masteryCount){
 const single=masteryCount===1;
 const starters=single?7:5;
 if(index<starters)return 1;
 return Math.min(15,5*(1+Math.floor((index-starters)/(single?1:2))));
}
function unlockedSpells(cards,masteries,level){
 return masteries.flatMap(school=>unlockOrder(cards,school).filter((_,i)=>unlockLevel(i,masteries.length)<=level));
}
function deckSize(available){return Math.min(24,MAX_COPIES*available.length);}
function progressionDeck(cards,masteries,level,current=[]){
 const available=unlockedSpells(cards,masteries,level),limit=deckSize(available);
 const legal=new Set(available.map(c=>c.id)),counts=new Map(),deck=[];
 function add(id){
  const copies=counts.get(id)||0;
  if(deck.length>=limit||copies>=MAX_COPIES||!legal.has(id))return;
  deck.push(id);counts.set(id,copies+1);
 }
 current.forEach(add);
 const choices=shuffle(available);
 for(let pass=1;pass<=MAX_COPIES;pass++)for(const card of choices)if((counts.get(card.id)||0)<pass)add(card.id);
 return deck;
}
function normalize(input,cards,progression=false){
 const p=input||{},masteries=[...new Set((Array.isArray(p.masteries)?p.masteries:[]).filter(e=>elements.includes(e)))];
 if(masteries.length<1||masteries.length>2)throw Error('Choose one or two mastery elements.');
 const level=Math.max(1,Math.min(20,Math.floor(Number(p.level)||20))),skills=Object.fromEntries(['hp','mana',...elements].map(k=>[k,Math.max(0,Math.floor(Number(p.skills?.[k])||0))]));
 for(const e of elements)if(!masteries.includes(e))skills[e]=0;
 if(Object.values(skills).reduce((a,b)=>a+b,0)>level)throw Error('You have allocated more skill points than your level allows.');
 const available=progression?unlockedSpells(cards,masteries,level):cards.filter(c=>masteries.includes(c.school));
 const legal=available.map(c=>c.id),deck=(Array.isArray(p.deck)?p.deck:[]).filter(id=>legal.includes(id));
 const required=progression?deckSize(available):24;
 if(deck.length!==required||(progression&&deck.length!==p.deck?.length))throw Error('Your grimoire must contain exactly '+required+' unlocked cards from your selected mastery elements.');
 const counts={};for(const id of deck){counts[id]=(counts[id]||0)+1;if(counts[id]>MAX_COPIES)throw Error('A grimoire can hold up to '+MAX_COPIES+' copies of each spell.');}
 const name=String(p.name||'').trim().replace(/[\u0000-\u001f]/g,'').slice(0,24);if(name.length<2)throw Error('Choose a wizard name with 2–24 characters.');
 return {...gearLook(p),id:typeof p.id==='string'?p.id.slice(0,60):'',name,level,masteries,skills,deck,towerCleared:p.towerCleared===true,lastTowerWin:typeof p.lastTowerWin==='string'?p.lastTowerWin.slice(0,60):'',hat:['hood','top','round','wide','scholar'].includes(p.hat)?p.hat:'pointed',robe:'classic',headHair:["medium","long","curlyMedium","curlyLong"].includes(p.headHair)?p.headHair:"none",facialHair:p.facialHair==='none'?'none':'original',robeColor:colors.includes(p.robeColor)?p.robeColor:colors[0],hatColor:colors.includes(p.hatColor)?p.hatColor:colors[0],skinColor:skins.includes(p.skinColor)?p.skinColor:skins[0]};
}
function stats(p){const b=baseline(p.level);return {hp:b.hp+150*(p.skills.hp||0),mana:b.mana+2*(p.skills.mana||0),remaining:b.points-Object.values(p.skills).reduce((a,b)=>a+b,0)};}
const masteryPercentPerPoint=1.5;
function masteryBonusPercent(p,school){return masteryPercentPerPoint*(p?.skills?.[school]||0);}
function multiplier(p,school){return 1+masteryBonusPercent(p,school)/100;}
function healAmount(base,p,school){return Math.floor(base*multiplier(p,school));}
function healing(card,p){return healAmount(card.healPerTurn||card.heal||0,p,card.school)*(card.healPerTurn?(card.healTurns||1):1);}
function effectText(card,p){
 if(card.kind==='wickedwitch')return '';
 if(card.seedDamage)return Math.round(card.seedChance*100)+'% HEALING SEED · '+card.seedDamage+' HP × '+card.seedTurns+' ROUNDS';
 if(card.healPerTurn)return healAmount(card.healPerTurn,p,card.school)+' HP × '+card.healTurns+' TURNS · '+healing(card,p)+' TOTAL';
 if(card.heal)return 'RESTORE '+healing(card,p)+' HP';
 if(card.id==='rod')return Math.round(card.redirect*100)+'% LIGHTNING DAMAGE → SELF HEAL · '+card.rodTurns+' ROUNDS';
 return [[card.burnDamage,card.burnChance,card.burnTurns,'BURN'],[card.poisonDamage,card.poisonChance,card.poisonTurns,'POISON'],[card.frostDamage,card.frostChance,card.frostTurns,'FROSTBITE'],[card.curseDamage,card.curseChance,card.curseTurns,'CURSE']].filter(x=>x[0]).map(([base,chance,turns,label])=>Math.round(chance*100)+'% '+(base===100&&turns===5?'EXTREME ':'')+label+' · '+base+' × '+turns).join(' · ');
}
function rollVariant(r=Math.random()){return [.9,1,1.1][Math.min(2,Math.floor(Math.max(0,r)*3))];}
function range(card,p,total=true){let base=card.damage||card.coatDamage||(card.id==='thornwrap'?150:0);if(!(base>0))return null;if(['static','soul','gunpowderkiss','thornwrap'].includes(card.id))return {low:base,high:base};let hits=1;if(total&&(card.id==='windfist'||card.id==='bulletseed'||card.id==='electrodisc')){base=card.hitDamage;hits=card.hits;}if(total&&(card.id==='penguins'||card.id==='ronin'))hits=3;
 const boost=multiplier(p,card.school);return {low:Math.floor(base*boost*.9)*hits,high:Math.floor(base*boost*1.1)*hits};}
function shuffle(list,rng=Math.random){const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function makeDeck(cards,masteries,rng=Math.random){const legal=shuffle(cards.filter(c=>masteries.includes(c.school)),rng);if(legal.length<8)return [];const deck=legal.slice(0,12).flatMap(c=>[c.id,c.id]);for(const c of legal){if(deck.length>=24)break;deck.push(c.id);}return shuffle(deck,rng);}
function cpu(cards,index=0,rng=Math.random,level=20){const masteries=shuffle(elements,rng).slice(0,2),skills={hp:0,mana:0};for(const e of masteries)skills[e]=0;for(let i=0;i<level;i++){const keys=['hp','mana',...masteries];skills[keys[Math.floor(rng()*keys.length)]]++;}
 const bag=cards.filter(c=>masteries.includes(c.school)).flatMap(c=>[c.id,c.id,c.id]),deck=shuffle(bag,rng).slice(0,24);
 return normalize({name:['Ash','Mira','Rune','Vesper','Bram','Nyx','Sora','Rowan'][index%8]+' '+names[masteries[0]],level,masteries,skills,deck,robeColor:colors[Math.floor(rng()*colors.length)],hatColor:colors[Math.floor(rng()*colors.length)],skinColor:skins[Math.floor(rng()*skins.length)]},cards);}
root.WizardryBuilds={elements,names,colors,skins,gear,gearLook,baseline,normalize,stats,masteryPercentPerPoint,masteryBonusPercent,multiplier,healAmount,healing,effectText,rollVariant,range,MAX_COPIES,orderedSpells,unlockOrder,unlockLevel,unlockedSpells,deckSize,progressionDeck,makeDeck,cpu};
})(typeof window!=='undefined'?window:globalThis);
