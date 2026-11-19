/* Shared build rules. No DOM, storage or transport dependencies. */
(function(root){'use strict';
const elements=['water','earth','lightning','nature','wind','dark','fire','ice'];
const colors=['#6f4ab4','#3269c1','#128e9e','#2c8a64','#b83a55','#d08a34','#ad5c9d','#44526b','#dfd8c7','#30293c'];
const skins=['#cca084','#f1cfad','#e7b081','#c7885b','#a96b4a','#805036','#58382f','#81b9c8','#b197c5'];
const names={water:'Water',earth:'Earth',lightning:'Lightning',nature:'Nature',wind:'Wind',dark:'Dark',fire:'Fire',ice:'Ice'};
function baseline(level=20){level=Math.max(1,Math.min(20,Math.floor(level)));return {level,hp:1500+Math.floor(level/5)*100+(level===20?100:0),mana:12+Math.floor(level/5),points:level};}
function normalize(input,cards){
 const p=input||{},masteries=[...new Set((Array.isArray(p.masteries)?p.masteries:[]).filter(e=>elements.includes(e)))];
 if(masteries.length!==2)throw Error('Choose exactly two mastery elements for this test.');
 const level=Math.max(1,Math.min(20,Math.floor(Number(p.level)||20))),skills=Object.fromEntries(['hp','mana',...elements].map(k=>[k,Math.max(0,Math.floor(Number(p.skills?.[k])||0))]));
 for(const e of elements)if(!masteries.includes(e))skills[e]=0;
 if(Object.values(skills).reduce((a,b)=>a+b,0)>level)throw Error('You have allocated more skill points than your level allows.');
 const legal=cards.filter(c=>masteries.includes(c.school)).map(c=>c.id),deck=(Array.isArray(p.deck)?p.deck:[]).filter(id=>legal.includes(id));
 if(deck.length!==24)throw Error('Your grimoire must contain exactly 24 cards from your two mastery elements.');
 const counts={};for(const id of deck){counts[id]=(counts[id]||0)+1;if(counts[id]>3)throw Error('A grimoire can hold up to 3 copies of each spell.');}
 const name=String(p.name||'').trim().replace(/[\u0000-\u001f]/g,'').slice(0,24);if(name.length<2)throw Error('Choose a wizard name with 2–24 characters.');
 return {id:typeof p.id==='string'?p.id.slice(0,60):'',name,level,masteries,skills,deck,hat:'pointed',robe:'classic',robeColor:colors.includes(p.robeColor)?p.robeColor:colors[0],hatColor:colors.includes(p.hatColor)?p.hatColor:colors[0],skinColor:skins.includes(p.skinColor)?p.skinColor:skins[0]};
}
function stats(p){const b=baseline(p.level);return {hp:b.hp+150*(p.skills.hp||0),mana:b.mana+2*(p.skills.mana||0),remaining:b.points-Object.values(p.skills).reduce((a,b)=>a+b,0)};}
function multiplier(p,school){return 1+.02*(p?.skills?.[school]||0);}
function healAmount(base,p,school){return Math.floor(base*multiplier(p,school));}
function healing(card,p){return healAmount(card.healPerTurn||card.heal||0,p,card.school)*(card.healPerTurn?(card.healTurns||1):1);}
function effectText(card,p){
 if(card.kind==='wickedwitch')return '';
 const boost=multiplier(p,card.school),span=base=>{const a=Math.floor(base*boost*.9),b=Math.floor(base*boost*1.1);return a===b?String(a):a+'–'+b;};
 if(card.seedDamage)return Math.round(card.seedChance*100)+'% HEALING SEED · '+healAmount(card.seedDamage,p,card.school)+' HP × '+card.seedTurns+' ROUNDS';
 if(card.healPerTurn)return healAmount(card.healPerTurn,p,card.school)+' HP × '+card.healTurns+' TURNS · '+healing(card,p)+' TOTAL';
 if(card.heal)return 'RESTORE '+healing(card,p)+' HP';
 if(card.id==='rod')return span(card.damage)+' DAMAGE / CHARGE · 5 TURNS';
 return [[card.burnDamage,card.burnChance,card.burnTurns,'BURN'],[card.poisonDamage,card.poisonChance,card.poisonTurns,'POISON'],[card.frostDamage,card.frostChance,card.frostTurns,'FROSTBITE']].filter(x=>x[0]).map(([base,chance,turns,label])=>Math.round(chance*100)+'% '+(base===100&&turns===5?'EXTREME ':'')+label+' · '+span(base)+' × '+turns).join(' · ');
}
function rollVariant(r=Math.random()){return [.9,1,1.1][Math.min(2,Math.floor(Math.max(0,r)*3))];}
function range(card,p,total=true){let base=card.damage||card.coatDamage||(card.id==='thornwrap'?150:0);if(!(base>0))return null;let hits=1;if(total&&(card.id==='windfist'||card.id==='bulletseed')){base=card.hitDamage;hits=card.hits;}if(total&&(card.id==='penguins'||card.id==='ronin'))hits=3;
 const boost=multiplier(p,card.school);return {low:Math.floor(base*boost*.9)*hits,high:Math.floor(base*boost*1.1)*hits};}
function shuffle(list,rng=Math.random){const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function makeDeck(cards,masteries,rng=Math.random){const legal=shuffle(cards.filter(c=>masteries.includes(c.school)),rng);if(legal.length<8)return [];const deck=legal.flatMap(c=>[c.id,c.id]);for(const c of shuffle(legal,rng)){if(deck.length>=24)break;deck.push(c.id);}return shuffle(deck.slice(0,24),rng);}
function cpu(cards,index=0,rng=Math.random){const masteries=shuffle(elements,rng).slice(0,2),skills={hp:0,mana:0};for(const e of masteries)skills[e]=0;for(let i=0;i<20;i++){const keys=['hp','mana',...masteries];skills[keys[Math.floor(rng()*keys.length)]]++;}
 const bag=cards.filter(c=>masteries.includes(c.school)).flatMap(c=>[c.id,c.id,c.id]),deck=shuffle(bag,rng).slice(0,24);
 return normalize({name:['Ash','Mira','Rune','Vesper','Bram','Nyx','Sora','Rowan'][index%8]+' '+names[masteries[0]],level:20,masteries,skills,deck,robeColor:colors[Math.floor(rng()*colors.length)],hatColor:colors[Math.floor(rng()*colors.length)],skinColor:skins[Math.floor(rng()*skins.length)]},cards);}
root.WizardryBuilds={elements,names,colors,skins,baseline,normalize,stats,multiplier,healAmount,healing,effectText,rollVariant,range,makeDeck,cpu};
})(typeof window!=='undefined'?window:globalThis);
