/* Shared build rules. No DOM, storage or transport dependencies. */
(function(root){'use strict';
const elements=['water','earth','lightning','nature','wind','dark','fire','ice'];
const clothingColors=Object.freeze({"#6f4ab4":"Amethyst","#3269c1":"Royal Blue","#128e9e":"Ocean Teal","#2c8a64":"Emerald","#b83a55":"Crimson","#d08a34":"Amber","#ad5c9d":"Rose","#44526b":"Slate","#dfd8c7":"Ivory","#30293c":"Midnight","#322c33":"Raven","#694839":"Chestnut","#ae6045":"Copper","#d6b06e":"Honey","#eee2d2":"Pearl","#84919e":"Silver","#645486":"Violet","#297c80":"Teal","#aa394e":"Ruby","#3176ad":"Sapphire","#459366":"Soft Emerald"});
const colors=Object.keys(clothingColors);
const clothingOptions=Object.freeze({original:"Original",...clothingColors});
const skins=['#cca084','#f1cfad','#e7b081','#c7885b','#a96b4a','#805036','#58382f','#81b9c8','#b197c5','#f8e0cc','#dfb798','#be906e','#995e43','#684332','#432b26','#899e81'];
const dyes={"#322c33":"Raven","#694839":"Chestnut","#ae6045":"Copper","#d6b06e":"Honey","#eee2d2":"Pearl","#84919e":"Silver","#645486":"Violet","#297c80":"Teal","#aa394e":"Ruby","#3176ad":"Sapphire","#459366":"Emerald"};
const dyeOptions={original:"Original",...dyes};
const gear={
 hairColor:{label:"Hair color",options:dyeOptions},beardColor:{label:"Facial hair color",options:dyeOptions},
 crystalColor:{label:"Staff crystal",options:dyeOptions},bootColor:{label:"Boot color",options:clothingOptions},
 robeTrim:{label:"Robe trim",options:clothingOptions},hatTrim:{label:"Hat band",options:clothingOptions},
 staffWood:{label:"Staff wood color",options:{original:"Original oak","#7b4a30":"Walnut","#633636":"Redwood","#bc8a54":"Honey maple","#c7b8a1":"Pale ash","#413a49":"Ebony","#516744":"Mosswood","#52637a":"Stormwood","#79507f":"Witchwood"}},
 staffSculpt:{label:"Staff sculpt",options:{original:"Smooth wood",spiral:"Spiral ridges",rings:"Raised rings",collared:"Wide collars",vcut:"Raised V",circle:"Raised circles",dots:"Raised dots",xcut:"Raised X"}}
};
function gearLook(p){return Object.fromEntries(Object.entries(gear).map(([key,field])=>[key,Object.hasOwn(field.options,p?.[key])?p[key]:"original"]));}
const names={water:'Water',earth:'Earth',lightning:'Lightning',nature:'Nature',wind:'Wind',dark:'Dark',fire:'Fire',ice:'Ice'};
function baseline(level=20){level=Math.max(1,Math.min(20,Math.floor(level)));return {level,hp:1500+50*level,mana:12+level,points:level};}
function orderedSpells(cards,school){
 return cards.filter(c=>c.school===school).sort((a,b)=>a.cost-b.cost||(a.id<b.id?-1:a.id>b.id?1:0));
}
// Unlock order mixes direct damage, support, and debuffs. Binder display sorts separately.
const UNLOCK_ORDER=Object.fromEntries(Object.entries({
 water:"waterblast octo shark calming bubbleshield crabgiant flowstate ragingwaters sirensmelody croc poseidon waterprison hightide whale ripcurrent hydrocannon fountainofyouth hydroserpent undertow tidalexchange",
 earth:"rockblast scorpion bender solidity boulderweight kineticsand quicksand rogginbowler cyclops meteorshower sentinelfissure landray earthquake sandwarrior faultlinebulwark tectoniccrush quicksilver crystalcavern petrify giantarmadillo",
 lightning:"shockblast electrodisc volt electricalcharge static lightningball rod thunder electriceel stormlizard zeus lightningfield claritystrike livewire chainedjavelin thunderbirds thundergoddrums magneticpulse shortcircuit thundermine",
 nature:"solarblast bulletseed venustrap growth estel bloom thornwrap centaur healingaura drowzyflowers tree groveland thornyhug briarremedy lifevine stampede killerbees guardianroots photosynthesis mothernature",
 wind:"windblast scaldingair ronin zen winddome windfist turbulence wind acidair sticksandstones wynzor windrazor aromatherapy",
 dark:"darkblast undead jack soul decaystrength vampire manascourge soulharvest wickedwitch darksorcerer reaper darkgrounds cursedhold",
 fire:"blazingembers devil arrows rage gunpowderkiss grillmaster kamikaze dragon reikel volcaniceruption burningpheonix sunfire flamingflamingo flamewheel flashover hellhound infernotitan ringoffire backdraft furnace",
 ice:"iceblast totallyrad penguins freezing frozentouch yeti crystalicemirrors bear blizzard frosty heizmann doublepick reflectiveice coldstorage glacierlance shatterpoint permafrost mammothiceshard frostboundcolossus wintersembrace",
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
function rogueSchedule(cards,masteries,seen,start=1){
 const width=masteries.length===1?3:2;
 const rounds=Math.max(0,...masteries.map(e=>Math.ceil(unlockOrder(cards,e).filter(c=>!seen.includes(c.id)).length/width)));
 const first=Math.min(20,Math.max(5,start+1)),n=Math.min(rounds,21-first);
 if(start===1&&masteries.length===1&&rounds===3)return [5,10,15];
 return Array.from({length:n},(_,i)=>n===1?20:Math.round(first+(20-first)*i/(n-1)));
}
function rogueStarter(cards,masteries){
 const single=masteries.length===1,owned={},deck=[];
 for(const school of masteries)for(const card of unlockOrder(cards,school).slice(0,single?6:4)){
  owned[card.id]=single?4:3;for(let i=0;i<owned[card.id];i++)deck.push(card.id);
 }
 return {deck,rogue:{owned,seen:Object.keys(owned),schedule:rogueSchedule(cards,masteries,Object.keys(owned)),pending:null,gold:0,replayFloor:1}};
}
function cleanRogue(raw,cards,masteries){
 const legal=new Set(cards.filter(c=>masteries.includes(c.school)).map(c=>c.id)),owned={};
 for(const [id,n] of Object.entries(raw?.owned||{}))if(legal.has(id)&&Number.isInteger(n)&&n>0)owned[id]=Math.min(4,n);
 const seen=[...new Set([...Object.keys(owned),...(Array.isArray(raw?.seen)?raw.seen.filter(id=>legal.has(id)):[])])];
 const schedule=[...new Set((Array.isArray(raw?.schedule)?raw.schedule:[]).filter(n=>Number.isInteger(n)&&n>=2&&n<=20))].sort((a,b)=>a-b);
 let pending=null;
 if(raw?.pending&&Array.isArray(raw.pending.groups)){
  const groups=raw.pending.groups.filter(g=>masteries.includes(g.school)&&Array.isArray(g.ids)).map(g=>({school:g.school,ids:[...new Set(g.ids.filter(id=>legal.has(id)&&!owned[id]&&cards.find(c=>c.id===id)?.school===g.school))].slice(0,masteries.length===1?3:2)})).filter(g=>g.ids.length);
  if(groups.length)pending={level:Math.max(2,Math.min(20,Number(raw.pending.level)||2)),groups};
 }
 return {owned,seen,schedule,pending,gold:Math.max(0,Math.min(100000000,Math.floor(Number(raw?.gold)||0))),replayFloor:Math.max(1,Math.min(21,Math.floor(Number(raw?.replayFloor)||1)))};
}
function availableSpells(cards,p){return p.rogue?cards.filter(c=>p.masteries.includes(c.school)&&p.rogue.owned[c.id]>0):unlockedSpells(cards,p.masteries,p.level);}
function copyLimit(p,id){return p.rogue?(p.rogue.owned[id]||0):MAX_COPIES;}
function fillOwned(cards,p){
 if(!p.rogue)return progressionDeck(cards,p.masteries,p.level,p.deck);
 const deck=[],counts={},available=availableSpells(cards,p);
 const add=id=>{if(deck.length<24&&(counts[id]||0)<copyLimit(p,id)){deck.push(id);counts[id]=(counts[id]||0)+1;}};
 (p.deck||[]).forEach(add);for(let i=0;i<4;i++)for(const c of available)add(c.id);return deck;
}
function migrateRogue(cards,p){
 if(p.rogue)return {...p,rogue:cleanRogue(p.rogue,cards,p.masteries)};
 if(p.level===1&&!p.finalBossUnlocked&&!p.towerCleared)return {...p,...rogueStarter(cards,p.masteries)};
 const owned={};for(const id of p.deck||[])if(cards.some(c=>c.id===id&&p.masteries.includes(c.school)))owned[id]=Math.min(4,(owned[id]||0)+1);
 for(const [id,n] of Object.entries(rogueStarter(cards,p.masteries).rogue.owned))if(!owned[id])owned[id]=n;
 return {...p,rogue:{owned,seen:Object.keys(owned),schedule:p.towerCleared?[]:rogueSchedule(cards,p.masteries,Object.keys(owned),p.level),pending:null,gold:0,replayFloor:1}};
}
function rogueFloor(p){return p.towerCleared?(p.rogue?.replayFloor||1):p.level===20&&p.finalBossUnlocked?21:p.level;}
function goldReward(floor){return 50+10*floor;}
function libraryPrice(card){return 100+40*card.cost;}
function makeOffer(cards,p,level,rng=Math.random){
 const r=p.rogue,width=p.masteries.length===1?3:2,groups=[];
 for(const school of p.masteries){
  const missing=unlockOrder(cards,school).filter(c=>!r.owned[c.id]);
  const fresh=missing.filter(c=>!r.seen.includes(c.id));
  const ids=shuffle(fresh.slice(0,width*2),rng).slice(0,width).map(c=>c.id);
  if(ids.length<width)ids.push(...shuffle(missing.filter(c=>!ids.includes(c.id)&&r.seen.includes(c.id)),rng).slice(0,width-ids.length).map(c=>c.id));
  if(ids.length)groups.push({school,ids});
 }
 return groups.length?{level,groups}:null;
}
function awardFloor(cards,profile,floor,winId,rng=Math.random){
 if(profile.lastTowerWin===winId)return profile;
 const p={...profile,rogue:cleanRogue(profile.rogue,cards,profile.masteries),lastTowerWin:winId};p.rogue.gold+=goldReward(floor);
 if(rogueFloor(profile)!==floor)return p;
 if(p.towerCleared){p.rogue.replayFloor=floor===21?1:floor+1;return p;}
 p.level=Math.min(20,p.level+1);p.finalBossUnlocked=!!p.finalBossUnlocked||floor>=20;p.towerCleared=floor===21;
 if(p.towerCleared){p.rogue.replayFloor=1;p.rogue.pending=null;return p;}
 if(p.rogue.schedule.includes(p.level)&&!p.rogue.pending){
  p.rogue.pending=makeOffer(cards,p,p.level,rng);
  if(p.rogue.pending)p.rogue.seen=[...new Set([...p.rogue.seen,...p.rogue.pending.groups.flatMap(g=>g.ids)])];
  p.rogue.schedule=p.rogue.schedule.filter(n=>n!==p.level);
 }
 return p;
}
function chooseOffer(cards,p,choices){
 const r=cleanRogue(p.rogue,cards,p.masteries),pending=r.pending;
 if(!pending||pending.groups.some(g=>!g.ids.includes(choices[g.school])))throw Error('Choose one spell from each offered element.');
 for(const g of pending.groups)r.owned[choices[g.school]]=3;
 r.pending=null;return {...p,rogue:r};
}
function buySpell(cards,p,id){
 const card=cards.find(c=>c.id===id);
 if(!p.towerCleared||!card||!p.masteries.includes(card.school)||p.rogue.owned[id])throw Error('This spell is not available for purchase.');
 const price=libraryPrice(card);if(p.rogue.gold<price)throw Error('Not enough gold.');
 return {...p,rogue:{...p.rogue,gold:p.rogue.gold-price,owned:{...p.rogue.owned,[id]:3},seen:[...new Set([...p.rogue.seen,id])]}};
}
function normalize(input,cards,progression=false){
 const p=input||{},masteries=[...new Set((Array.isArray(p.masteries)?p.masteries:[]).filter(e=>elements.includes(e)))];
 if(masteries.length<1||masteries.length>2)throw Error('Choose one or two mastery elements.');
 const level=Math.max(1,Math.min(20,Math.floor(Number(p.level)||20))),skills=Object.fromEntries(['hp','mana',...elements].map(k=>[k,Math.max(0,Math.floor(Number(p.skills?.[k])||0))]));
 for(const e of elements)if(!masteries.includes(e))skills[e]=0;
 if(Object.values(skills).reduce((a,b)=>a+b,0)>level)throw Error('You have allocated more skill points than your level allows.');
 const rogue=p.rogue?cleanRogue(p.rogue,cards,masteries):null;
 const available=rogue?cards.filter(c=>masteries.includes(c.school)&&rogue.owned[c.id]):progression?unlockedSpells(cards,masteries,level):cards.filter(c=>masteries.includes(c.school));
 const legal=available.map(c=>c.id),deck=(Array.isArray(p.deck)?p.deck:[]).filter(id=>legal.includes(id));
 const required=rogue?24:progression?deckSize(available):24;
 if(deck.length!==required||(progression&&deck.length!==p.deck?.length))throw Error('Your grimoire must contain exactly '+required+' unlocked cards from your selected mastery elements.');
 const counts={};for(const id of deck){counts[id]=(counts[id]||0)+1;if(counts[id]>(rogue?rogue.owned[id]:MAX_COPIES))throw Error('Your grimoire contains more copies than are owned.');}
 const name=String(p.name||'').trim().replace(/[\u0000-\u001f]/g,'').slice(0,24);if(name.length<2)throw Error('Choose a wizard name with 2–24 characters.');
 return {...gearLook(p),...(rogue?{rogue}:{}),id:typeof p.id==='string'?p.id.slice(0,60):'',name,level,masteries,skills,deck,finalBossUnlocked:level===20&&(p.finalBossUnlocked===true||p.towerCleared===true),towerCleared:level===20&&p.finalBossUnlocked===true&&p.towerCleared===true,lastTowerWin:typeof p.lastTowerWin==='string'?p.lastTowerWin.slice(0,60):'',hat:['hood','top','round','wide','scholar'].includes(p.hat)?p.hat:'pointed',robe:'classic',headHair:["medium","long","curlyMedium","curlyLong"].includes(p.headHair)?p.headHair:"none",facialHair:p.facialHair==='none'?'none':'original',robeColor:Object.hasOwn(clothingOptions,p.robeColor)?p.robeColor:colors[0],hatColor:Object.hasOwn(clothingOptions,p.hatColor)?p.hatColor:colors[0],skinColor:skins.includes(p.skinColor)?p.skinColor:skins[0]};
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
root.WizardryBuilds={elements,names,colors,clothingColors,clothingOptions,skins,gear,gearLook,baseline,normalize,stats,masteryPercentPerPoint,masteryBonusPercent,multiplier,healAmount,healing,effectText,rollVariant,range,MAX_COPIES,orderedSpells,unlockOrder,unlockLevel,unlockedSpells,deckSize,progressionDeck,makeDeck,cpu,rogueStarter,rogueSchedule,migrateRogue,availableSpells,copyLimit,fillOwned,rogueFloor,goldReward,libraryPrice,awardFloor,chooseOffer,buySpell,shuffle};
})(typeof window!=='undefined'?window:globalThis);
