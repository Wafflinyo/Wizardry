/* Wizardry 0.136 — 2.5D battles, level-20 builds and host-authoritative test lobbies. */
(()=>{"use strict";
  const W=1000,H=620,MAX_MANA=16,MAX_SLOTS=3;
  const Builds=window.WizardryBuilds;
  let configuredProfile=null,activeRoster=null,camera={scale:1,x:0,y:0};
  const canvas=document.getElementById("battleCanvas"),g=canvas.getContext("2d");
  const $=id=>document.getElementById(id);
  const ui={mode:$("modeControls"),sizes:$("sizeControls"),round:$("roundLabel"),phase:$("phaseLabel"),
    badge:$("battleBadge"),hint:$("turnHint"),queueCount:$("queueCount"),initiative:$("initiative"),allies:$("allyRoster"),
    enemies:$("enemyRoster"),hand:$("cardHand"),handTitle:$("handTitle"),mana:$("selectedMana"),
    chosenSpell:$("chosenSpell"),chosenTarget:$("chosenTarget"),targetPicker:$("targetPicker"),
    queue:$("queueButton"),auto:$("autoButton"),resolve:$("resolveButton"),plans:$("plannedList"),
    status:$("status"),reset:$("resetButton"),hat:$("wizardHat"),robe:$("wizardRobe"),
    robeColor:$("wizardColor"),hatColor:$("wizardHatColor"),
    skinColor:$("wizardSkinColor"),confirm:$("confirmTarget"),
    statusPopup:$("statusPopup"),statusName:$("statusName"),
    statusText:$("statusText"),statusClose:$("statusClose")};
  // Cards use accuracy rolls, never manual tracing. The lightning summon
  // adds a real one-action stun only AFTER a successful damaging cast.
  const CARDS=[
    {id:"poseidon",name:"Poseidon's Wrath",school:"water",cost:8,target:"enemy",kind:"summon",damage:1200,
      icon:"♆",description:"On success: recharge 1 round & Tidal Echo +30% next Water hit",short:"70% ACCURACY",accuracy:.70,duration:2550,hit:.60,artFrame:7},
    {id:"golem",name:"Stone Golem",school:"earth",cost:6,target:"enemy",kind:"summon",damage:900,
      icon:"◆",description:"Seismic fissure · one enemy",short:"85% ACCURACY",accuracy:.85,duration:2850,hit:.62,artFrame:10},
    {id:"volt",name:"Professor Volt",school:"lightning",cost:5,target:"enemy",kind:"summon",damage:450,
      icon:"⚡",description:"20% stun chance on hit · target skips one action",short:"80% ACCURACY",accuracy:.80,
      stunChance:.20,duration:2950,hit:.66,artFrame:2},
    {id:"estel",name:"Lady Estel",school:"nature",cost:5,target:"ally",
      kind:"heal",heal:750,icon:"❀",description:"Blesses one ally: up to 750 HP",
      short:"90% ACCURACY",accuracy:.90,duration:3200,hit:.66,artFrame:3},
    {id:"wind",name:"Tornado Barrage",school:"wind",cost:6,target:"all_enemies",
      kind:"aoe",damage:200,icon:"≋",description:"200 damage to each enemy; next cast gets +10 accuracy points on hit",
      short:"80% ACCURACY",accuracy:.80,duration:3300,hit:.70,artFrame:0},
    {id:"vampire",name:"Crimson Siphon",school:"dark",cost:7,target:"enemy",
      kind:"drain",damage:550,leech:.5,icon:"☠",
      description:"Vampire steals up to 550 HP, returns and offers a red orb healing 50% of HP actually drained",
      short:"85% ACCURACY",accuracy:.85,duration:4500,hit:.68,artFrame:4},
    {id:"dragon",name:"Dragonfire Descent",school:"fire",cost:7,target:"enemy",
      kind:"dragon",damage:650,splash:150,burnChance:.25,
      burnDamage:50,burnTurns:3,icon:"♨",
      description:"Baby dragon drops in, charges a giant fireball and hits 650 + 150 to each adjacent enemy. 25% burn: 50 for 3 turns",
      short:"80% ACCURACY",accuracy:.80,duration:4400,hit:.65,artFrame:7},
    {id:"bear",name:"Icefang Rampage",school:"ice",cost:6,target:"enemy",
      kind:"summon",damage:460,icon:"❄",accuracy:.85,duration:3300,hit:.65,
      short:"85% ACCURACY",description:"An icicle-furred polar bear roars, charges and claws one enemy for 460 damage, then disperses",artFrame:6},
    {id:"shark",name:"Reef Rush",school:"water",cost:4,target:"enemy",kind:"damage",
      damage:480,icon:"♆",accuracy:.90,duration:5800,hit:.65,rarity:"EPIC",
      short:"90% ACCURACY",description:"A dorsal fin slowly rises and circles before a shark jumps straight up, flops at the apex, then arches downward onto one target and chomps for 480 damage, then splashes back beneath the arena floor"},
    {id:"thunder",name:"Thunderclap",school:"lightning",cost:6,target:"enemy",kind:"summon",
      damage:550,icon:"⚡",accuracy:.75,duration:3060,hit:.65,rarity:"EPIC",
      short:"75% ACCURACY",description:"A dark thundercloud being with electric-blue eyes forms at the arena center, spreads its arms and claps, firing an arcing bolt at one enemy for 550 damage"},
    {id:"arrows",name:"Flaming Arrows",school:"fire",cost:4,target:"all_enemies",kind:"rain",
      damage:150,accuracy:.85,icon:"♨",rarity:"RARE",burnChance:.10,burnDamage:50,burnTurns:3,duration:2900,
      short:"85% ACCURACY",description:"A slanted fire rune circle rains a barrage of flaming arrows across all enemies. Each enemy hit takes 150 total damage with an independent 10% chance to burn for 50 damage at the start of each of the next 3 rounds"},
    {id:"ronin",name:"Wind Slashes",school:"wind",cost:5,target:"enemy",kind:"slashes",damage:150,accuracy:.80,icon:"≋",rarity:"EPIC",duration:3280,
      short:"80% ACCURACY",description:"A wandering samurai drops into the arena, slowly reaches for his sheathed katana, then draws it in a flash and releases three rapid wind slashes at one enemy. Each slash deals 150 damage: 450 total. 80% spell accuracy"},
    {id:"reaper",name:"Reaper",school:"dark",cost:8,target:"enemy",kind:"reaper",damage:950,accuracy:.80,icon:"☠",rarity:"LEGENDARY",duration:3740,
      short:"80% ACCURACY",description:"A red-eyed hooded Reaper rises from a shadow circle, lunges and slashes for 950 damage. Applies Decaying Strength: the next successful damaging spell against that enemy deals 20% more damage, including all hits of that spell"},
    {id:"bender",name:"Stone Bender",school:"earth",cost:5,target:"enemy",kind:"stonebender",damage:540,accuracy:.85,icon:"◆",rarity:"EPIC",duration:3950,
      short:"85% ACCURACY",description:"An earthbender appears with arms crossed, takes a palm-and-fist stance, then lifts her forward foot and stomps hard in front of her to raise a huge rectangular stone wall. She punches it into a barrage of broken stones, dealing 540 total damage to one enemy"},
    {id:"frosty",name:"Frosty",school:"ice",cost:7,target:"enemy",kind:"frosty",damage:750,accuracy:.80,icon:"❄",rarity:"LEGENDARY",duration:7822.5,frostDamage:50,frostTurns:3,frostChance:.30,
      short:"80% ACCURACY",description:"A winter gust reveals a happy snowman. He turns angry, becomes a muscular snow giant and hurls a huge snowball for 750 damage. He melts away after the throw, with a 30% chance to inflict Frostbite: 50 damage per turn for 3 turns"},
    {id:"solidity",name:"Solidity",school:"earth",cost:3,target:"ally",kind:"shield",reduction:.25,accuracy:1,icon:"◆",rarity:"RARE",duration:1900,hit:.76,short:"100% ACCURACY",description:"An earth-symbol shield travels to yourself or a living ally and dissolves into a Solidity rune. Reduces every hit of the next successful damaging spell by 25%, then expires. Misses and damage over time do not consume it. Does not stack."},
    {id:"calming",name:"Calming Waters",school:"water",cost:3,target:"ally",kind:"regen",heal:375,healPerTurn:125,healTurns:3,accuracy:1,icon:"≈",rarity:"RARE",duration:2100,hit:.72,short:"100% ACCURACY",description:"Calming currents bless yourself or a living ally. Restores 125 HP at the start of each of the next 3 turns: 375 total. Cannot exceed maximum HP or revive a defeated wizard. Reapplying refreshes the duration; it does not stack."},
    {id:"static",name:"Static Shock",school:"lightning",cost:3,target:"enemy",kind:"static",damage:100,accuracy:1,icon:"ϟ",rarity:"RARE",duration:1900,hit:.72,short:"100% ACCURACY",description:"Curses one enemy with −30 percentage points of spell accuracy for 3 turns (80% becomes 50%). On their first missed spell, discharges for 100 damage and expires. Successful spells leave the curse active until its duration ends. Refreshes without stacking."},
    {id:"rage",name:"Blazing Rage",school:"fire",cost:3,target:"ally",kind:"rage",boost:.20,accuracy:1,icon:"♨",rarity:"RARE",duration:1900,hit:.72,short:"100% ACCURACY",description:"Fiery energy blesses yourself or a living ally. Their next successful damaging spell deals 20% more damage, including every hit and target of that spell. Misses, healing and support spells preserve it. Refreshes without stacking."},
    {id:"turbulence",name:"Turbulence",school:"wind",cost:3,target:"enemy",kind:"turbulence",accuracy:1,icon:"≋",rarity:"RARE",duration:1900,hit:.72,short:"100% ACCURACY",description:"Restless wind curses one enemy. Their next spell loses 50 percentage points of accuracy. An 80% spell becomes 30% accurate (70% failure). Combines with Static Shock and other active accuracy effects. Consumed on the next cast attempt, whether it succeeds or fails. Does not stack."},
    {id:"soul",name:"Soul Drain",school:"dark",cost:3,target:"enemy",kind:"souldrain",damage:100,drainTurns:3,accuracy:1,icon:"☠",rarity:"RARE",duration:2100,hit:.72,short:"100% ACCURACY",description:"Curses one enemy for 3 turns. At the start of each turn, drains up to 100 HP and restores the HP actually drained to the caster, capped at maximum HP. 300 total drain. Cannot revive a defeated caster. Reapplying refreshes the curse without stacking."},
    {id:"healingaura",name:"Healing Aura",school:"nature",cost:5,target:"team",kind:"teamregen",heal:600,healPerTurn:200,healTurns:3,accuracy:1,icon:"❀",rarity:"EPIC",duration:2300,hit:.72,short:"100% ACCURACY",description:"Blesses every living teammate, including yourself. Each restores 200 HP at the start of each of the next 3 turns: 600 HP per ally. Capped at maximum HP; cannot revive. Works alongside Calming Waters. Reapplying refreshes this aura without stacking copies."},
    {id:"freezing",name:"Freezing Temps",school:"ice",cost:3,target:"enemy",kind:"freezing",accuracy:1,icon:"❄",rarity:"RARE",duration:1900,hit:.72,short:"100% ACCURACY",description:"Marks one enemy. The next successful damaging Ice spell consumes the mark for a 50% chance to freeze them for up to 3 turns. Before each frozen turn, thaw chances rise from 20% to 40% to 60%. Failed thaw rolls skip the turn; automatically unfreezes after the third turn. Misses and other elements preserve the mark."},
    {id:"scorpion",name:"Scorpion Sting",school:"earth",cost:4,target:"enemy",kind:"scorpion",damage:340,poisonChance:.30,poisonDamage:50,poisonTurns:3,accuracy:.85,icon:"◆",rarity:"RARE",duration:4700,hit:3108/4700,short:"85% ACCURACY",description:"A giant orange scorpion rolls down curled into an armored ball, unfolds, pauses, winds up its tail and stings one enemy for 340 damage. 30% chance to poison for 50 HP per turn for 3 turns, then digs and burrows beneath the arena."}
,
    {id:"octo",name:"Octo Whip",school:"water",cost:4,target:"enemy",kind:"octo",damage:400,flinchChance:.15,accuracy:.85,icon:"♆",rarity:"RARE",duration:4400,hit:.70,short:"85% ACCURACY",description:"A large blue octopus slams down, flails angrily and whips one enemy for 400 damage. 15% chance to flinch: skips their action this turn only if they have not acted yet. No carryover to the next turn."}
,
    {id:"devil",name:"Devil Boy",school:"fire",cost:3,target:"enemy",kind:"damage",damage:250,accuracy:.85,icon:"♨",rarity:"RARE",duration:3800,hit:.60,short:"85% ACCURACY",description:"A small red demon appears in a burst of flames, aims his musket-style pistol and fires a glowing volcanic rock at one enemy for 250 Fire damage, then disappears in another burst of flames."}
,
    {id:"bloom",name:"Blooming Spores",school:"nature",cost:4,target:"all_enemies",kind:"spores",damage:100,poisonChance:.30,poisonDamage:50,poisonTurns:5,accuracy:.90,icon:"❀",rarity:"EPIC",duration:4600,hit:.72,short:"90% ACCURACY",description:"A huge spotted closed flower bud bulges with pressure, then bursts open into full bloom and releases spore dust, dealing 100 Nature damage to every enemy. Each enemy hit has an independent 30% chance to be poisoned for 50 HP per turn for 5 turns."}
,
    {id:"rod",name:"Lightning Rod",school:"lightning",cost:3,target:"ally",selfOnly:true,kind:"lightningrod",damage:100,rodTurns:5,accuracy:1,icon:"ϟ",rarity:"EPIC",duration:4000,hit:.78,short:"100% ACCURACY",description:"Self-only Lightning rune for the next 5 turns. Each later successful Lightning cast by you or any ally stores 1 charge. Failed spells never add charges. At the end of the fifth turn, discharges 100 damage per charge TOTAL, split among living enemies. Lightning Rod itself never charges it. Recasting refreshes duration without stacking runes or losing stored charges."}
,
    {id:"undead",name:"Undead Rampage",school:"dark",cost:3,target:"enemy",kind:"damage",damage:200,fearChance:.10,accuracy:.85,icon:"☠",rarity:"RARE",duration:4500,hit:.80,short:"85% ACCURACY",description:"A gaunt hooded zombie rips one arm through the ground, then the other, hauls itself free, screeches and pounces onto one enemy for a 200-damage Dark claw strike. On a successful hit, 10% chance to Fear: skips the target only if they have not acted yet this round. No effect if they already acted; never carries into the next round."}
,
    {id:"centaur",name:"Forrest Centaur",school:"nature",cost:6,target:"enemy",kind:"damage",damage:650,accuracy:.90,icon:"❀",rarity:"EPIC",duration:5000,hit:.724,short:"90% ACCURACY",description:"A centaur in woodland leaves, vines and bark garments gallops into position, plants his hooves, draws and charges his bow, then snipes one enemy with a Nature arrow for 650 damage."},
    {id:"winddome",name:"Wind Dome",school:"wind",cost:4,target:"ally",selfOnly:true,kind:"winddome",accuracy:1,icon:"≋",rarity:"EPIC",duration:2600,hit:.72,short:"100% ACCURACY",description:"Rapidly rotating wind forms a protective dome around yourself. Blocks every hit and on-hit effect of the next incoming damaging spell, then disappears. Misses, support spells and all damage from debuffs preserve it. Lasts until used; reapplying refreshes one shield without stacking."},
    {id:"penguins",name:"Ninja Penguins",school:"ice",cost:4,target:"enemy",kind:"penguins",damage:100,accuracy:.90,icon:"❄",rarity:"EPIC",duration:6000,hit:.99,frostChance:.10,frostDamage:50,frostTurns:3,short:"90% ACCURACY",description:"Three ninja penguins flip into the arena with ice kunai. Two launch their teammate diagonally above one enemy; he spins and throws 3 fast kunai for 100 damage each. Each hit has a 10% chance of Frostbite: 50 damage per turn for 3 turns. Frostbite cannot stack or refresh from later kunai."},
    {id:"blizzard",name:"Blizzard",school:"ice",cost:5,target:"all_enemies",kind:"blizzard",damage:160,accuracy:.80,icon:"❄",rarity:"EPIC",duration:3400,hit:.99,frostChance:.60,frostDamage:100,frostTurns:5,short:"80% ACCURACY",description:"Whipping icy winds rip through every enemy for 160 damage. Each enemy hit has a 60% chance of Frostbite: 100 damage per turn for 5 turns. Refreshes one Frostbite without stacking."},
    {id:"thornwrap",name:"Thorny Wrap",school:"nature",cost:3,target:"enemy",kind:"thornwrap",accuracy:1,icon:"❧",rarity:"RARE",duration:2300,hit:.85,short:"100% ACCURACY",description:"A thorny vine erupts beneath one enemy and wraps around them for 3 turns. Each spell attempt deals 150 damage to the wrapped caster, even if their spell misses. While attached: −15 accuracy points. Refreshes without stacking."},
    {id:"kineticsand",name:"Kinetic Sand",school:"earth",cost:6,target:"enemy",kind:"damage",damage:620,accuracy:.85,icon:"◆",rarity:"EPIC",duration:4800,hit:.79,short:"85% ACCURACY",description:"Sand whirls at the arena center, rises into a towering wave and dives onto one enemy. It encases the target, then clenches in a crushing grip for 620 Earth damage before crumbling away."},
    {id:"zeus",name:"Zeus’s Might",school:"lightning",cost:9,target:"enemy",kind:"zeus",damage:1350,chainDamage:200,stunChance:.20,accuracy:.70,icon:"⚡",rarity:"LEGENDARY",duration:4000,hit:.565,short:"70% ACCURACY",description:"Zeus descends waist-up in a cloud, winds up and hurls his golden thunderbolt for 1,350 damage. Lightning then chains to each immediate adjacent enemy for 200 damage. Every target hit has an independent 20% chance to lose one action to stun."},
    {id:"gunpowderkiss",name:"Gunpowder Kiss",school:"fire",cost:3,target:"enemy",kind:"gunpowder",accuracy:1,coatTurns:3,coatDamage:150,icon:"♨",rarity:"EPIC",duration:4200,hit:.70,short:"100% ACCURACY",description:"A mistress made entirely of gunpowder forms from thin air and blows a powder kiss onto one enemy. Gunpowder Coat lasts 3 turns. A Fire spell hit ignites it for 150 extra damage, once per turn and up to 3 times. The coat stays after each explosion. Reapplying refreshes without stacking. Burn ticks do not trigger it."}
  ];
  CARDS.push({id:"flowstate",name:"Flow State",school:"water",cost:2,target:"ally",selfOnly:true,kind:"flowstate",accuracy:1,icon:"≈",rarity:"RARE",duration:2300,hit:.72,short:"100% ACCURACY",description:"Enter Flow State. Gain 1 extra mana at the start of each of your next 3 turns: 2 mana after casting, or 3 after passing, up to your mana capacity. Lasts for 3 mana gains, including skipped turns. Reapplying refreshes without stacking."});
  CARDS.push({id:"windfist",name:"Wind Fist Barrage",school:"wind",cost:6,target:"enemy",kind:"windfist",damage:500,hitDamage:50,hits:10,accuracy:.85,icon:"≋",rarity:"EPIC",duration:5400,hit:.98,short:"85% ACCURACY",description:"A monk drops into a three-point crouched landing, stands, claps his hands and bows, then takes an open-palm forward stance. He leaps up and unleashes ten forceful wind fists at one enemy: 50 damage per punch, 500 total. 85% spell accuracy."});
  CARDS.push({id:"jack",name:"Jack the Lantern",school:"dark",cost:4,target:"enemy",kind:"jack",damage:280,accuracy:.85,icon:"☠",rarity:"EPIC",duration:5200,hit:.82,fearChance:.30,fearTurns:3,short:"85% ACCURACY",description:"A pumpkin-headed scarecrow rises with its head bowed as three crows circle overhead. It lifts its head to face one enemy, sending the crows to swarm for 280 Dark damage. Inflicts Fear for 3 rounds: a 30% chance to skip each turn. Refreshes without stacking."});
  CARDS.push({id:"croc",name:"Creeping Croc",school:"water",cost:6,target:"enemy",kind:"croc",damage:800,accuracy:.85,icon:"♆",rarity:"EPIC",duration:4500,hit:.62,fearChance:.10,short:"85% ACCURACY",description:"A crocodile floats almost completely submerged toward one enemy, showing only its eyes, the top of its head and its ridged back. It suddenly lunges from the water and snaps for 800 damage. On hit: 10% chance to Fear, skipping the target only if they have not acted yet this round. Never carries into the next round."});
  for(const card of CARDS)if(['static','soul','freezing','scorpion','bloom','gunpowderkiss','thornwrap','blizzard','penguins','frosty','jack','dragon','arrows','reaper','turbulence'].includes(card.id)){
    card.description=card.description.replace(/Reapplying refreshes[^.]*\.|Refreshes[^.]*\./g,'');
    card.description+=' Only one harmful debuff can be active. Repeat applications cannot refresh it.';
  }
  const WIND_FIST_RELEASES=Array.from({length:10},(_,i)=>.52+i*.014);
  const WIND_FIST_HIT_TIMES=WIND_FIST_RELEASES.map(p=>p+.032);
  const BY_ID=Object.fromEntries(CARDS.map(x=>[x.id,x]));
  const MAX_HAND_SIZE=5;
  // The latest implemented card is always in a human player's opening hand.
  // It is not necessary to edit this routine when more spells are appended.
  const FEATURED_TEST_CARD=CARDS[CARDS.length-1].id;
  function shuffleDeck(cards){
    const result=[...cards];
    for(let i=result.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }
  function drawCard(u){
    if(!u?.hand||u.hand.length>=MAX_HAND_SIZE)return null;
    if(!u.drawPile.length&&u.discardPile.length)
      u.drawPile=shuffleDeck(u.discardPile.splice(0));
    const id=u.drawPile.shift();
    if(id)u.hand.push(id);
    return id||null;
  }
  function startHand(u,includeNewest=false){
    u.hand=[];u.discardPile=[];
    const legal=u.grimoire?.length?[...u.grimoire]:CARDS.filter(c=>!u.masteries||u.masteries.includes(c.school)).map(c=>c.id);
    const feature=includeNewest&&legal.includes(FEATURED_TEST_CARD);
    u.drawPile=shuffleDeck(legal);
    if(feature){u.drawPile.splice(u.drawPile.indexOf(FEATURED_TEST_CARD),1);u.hand.push(FEATURED_TEST_CARD);}
    while(u.hand.length<Math.min(MAX_HAND_SIZE,CARDS.length)&&u.drawPile.length)
      drawCard(u);
    return u.hand;
  }
  function playHandCard(u,id){
    const i=u?.hand?.indexOf(id)??-1;
    if(i<0)return false;
    u.hand.splice(i,1);
    u.discardPile.push(id);
    return true;
  }
  const ALLIES=[
    {name:"Tidecaller",style:"tide",color:"#68e8f1",hp:1260,speed:88},
    {name:"Storm Adept",style:"storm",color:"#a49dff",hp:1210,speed:76},
    {name:"Ember Sage",style:"ember",color:"#ffba66",hp:1280,speed:70},
    {name:"Verdant Hexer",style:"leaf",color:"#a7e57c",hp:1370,speed:64}
  ];
  const ENEMIES=[
    {name:"Stone Sentinel",style:"sentinel",color:"#f0bd8e",hp:1700,speed:81},
    {name:"Moss Golem",style:"moss",color:"#a2ef72",hp:1500,speed:57},
    {name:"Crystal Brute",style:"crystal",color:"#d6adff",hp:1470,speed:71},
    {name:"Shadow Idol",style:"shadow",color:"#b49bff",hp:1180,speed:95}
  ];
  const PVP_WIZARDS=[
    {name:"Dusk Magus",style:"night",color:"#a8a0ef",hp:1260,speed:81},
    {name:"Frost Scholar",style:"frost",color:"#a6ecf2",hp:1260,speed:72},
    {name:"Crimson Witch",style:"flame",color:"#f2a28d",hp:1260,speed:69},
    {name:"Astral Seer",style:"astral",color:"#e5d49b",hp:1260,speed:89}
  ];
  // Opposing parenthesis arcs: back/front seats curve inward while the
  // middle seats sit farther out. Vertical spacing preserves 2.5D depth
  // and leaves a clear casting lane plus room for outward-facing HP plates.
  const scenePositions={
    1:[[[225,520]],[[775,500]]],
    2:[[[210,445],[285,590]],[[790,425],[715,570]]],
    3:[[[245,420],[135,515],[305,600]],[[755,400],[865,495],[695,580]]],
    4:[[[265,410],[130,475],[180,550],[330,605]],
       [[735,390],[870,455],[820,530],[670,590]]]
  };
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const rand=(seed)=>{let n=(seed*9301+49297)%233280;return n/233280};
  let state=null,background=null,frameLast=0,spriteCache={},handSwipe=null,lastHandArtKey="";
  // User-approved, transparent 12-frame idle + 16-frame casting atlas.
  const wizardAtlas=new Image();
  wizardAtlas.decoding="async";
  wizardAtlas.src="./assets/wizard-approved-animations-v33.png";
  const wizardAtlasReady=()=>wizardAtlas.complete&&wizardAtlas.naturalWidth===512&&wizardAtlas.naturalHeight===896;
  // Eight approved full-body defeat poses, bottom-aligned in a 4×2 atlas.
  // They belong to the same one-staff model and face with the team mirror.
  const defeatAtlas=new Image();
  defeatAtlas.decoding="async";
  defeatAtlas.src="./assets/wizard-defeat-v37.png";
  const defeatAtlasReady=()=>defeatAtlas.complete&&defeatAtlas.naturalWidth===512&&defeatAtlas.naturalHeight===256;
  // Transparent padding below the boots varies by animation frame.
  // Measure once per atlas and anchor the lowest visible foot pixel to
  // each unit's original ground coordinate, avoiding apparent hovering.
  const footPadCache=new WeakMap();
  function footPadding(atlas,frame){
    if(!atlas?.complete||!atlas.naturalWidth)return 0;
    let data=footPadCache.get(atlas);
    if(!data){
      data=[];
      try{
        const sample=document.createElement("canvas");
        sample.width=atlas.naturalWidth;sample.height=atlas.naturalHeight;
        const c=sample.getContext("2d",{willReadFrequently:true});
        c.drawImage(atlas,0,0);
        const pixels=c.getImageData(0,0,sample.width,sample.height).data;
        const cols=Math.floor(sample.width/128),rows=Math.floor(sample.height/128);
        for(let index=0;index<cols*rows;index++){
          const ox=(index%cols)*128,oy=Math.floor(index/cols)*128;
          let lastOpaque=127,found=false;
          for(let y=127;y>=45&&!found;y--){
            for(let x=24;x<=103;x+=2){
              const a=pixels[4*((oy+y)*sample.width+(ox+x))+3];
              if(a>=112){lastOpaque=y;found=true;break;}
            }
          }
          data.push(found?Math.min(42,Math.max(0,(127-lastOpaque)*220/128)):0);
        }
      }catch(e){data=[];}
      footPadCache.set(atlas,data);
    }
    return data[frame]||0;
  }
  const DEFEAT_FRAME_STARTS=[0,95,185,285,385,510,625,745];
  const DEFEAT_HOLD_MS=DEFEAT_FRAME_STARTS.at(-1);
  function defeatFrame(ms){
    const t=Math.max(0,ms||0);
    for(let i=DEFEAT_FRAME_STARTS.length-1;i>=0;i--)
      if(t>=DEFEAT_FRAME_STARTS[i])return i;
    return 0;
  }
  function drawDefeatSprite(ctx,elapsedMs,look){
    if(!defeatAtlasReady())return false;
    const i=defeatFrame(elapsedMs);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    const art=window.WizardryPalettes?.getAtlas(defeatAtlas,"defeat",look)||defeatAtlas;
    ctx.drawImage(art,(i%4)*128,Math.floor(i/4)*128,128,128,-74,-220+footPadding(defeatAtlas,i)+7,148,220);
    ctx.restore();return true;
  }
  const waveFrame=ms=>16+(Math.floor(Math.max(0,ms)/130)%8);
  function wizardFrame(stage,p,ms,time,lowerFrom){
    const progress=clamp(p,0,1);
    if(stage==="raising")return 12+Math.min(3,Math.floor(ease(progress)*4));
    if(stage==="tracing-auto")return waveFrame(ms);
    if(stage==="lowering"){
      const from=Number.isInteger(lowerFrom)?clamp(lowerFrom,16,23):23;
      if(progress<.38)return Math.min(23,from+Math.floor(ease(progress/.38)*(24-from)));
      return 24+Math.min(3,Math.floor(ease((progress-.38)/.62)*4));
    }
    return Math.floor((Math.max(0,time)%1440)/120)%12;
  }
  function drawWizardSprite(ctx,stage,p,ms,time,lowerFrom,look){
    if(!wizardAtlasReady())return false;
    const i=wizardFrame(stage,p,ms,time,lowerFrom);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    const art=window.WizardryPalettes?.getAtlas(wizardAtlas,"wizard",look)||wizardAtlas;
    ctx.drawImage(art,(i%4)*128,Math.floor(i/4)*128,128,128,-74,-220+footPadding(wizardAtlas,i)+7,148,220);
    ctx.restore();return true;
  }
  const ARM_RAISE_MS=300,AUTO_TRACE_MS=1600,ARM_LOWER_MS=340,FIZZLE_MS=360;
  const RUNE_GLOW_MS=620,RUNE_CRUMBLE_MS=700;
  const WIZARD_RECOVERY_MS=520; // Independent from summon/fizzle timing.
  // Original full Golem animation: emerge, clasp, wind up, slam,
  // stand/idle, then dissolve while the independent fissure is still moving.
  const GOLEM_SLAM_MS=1520,GOLEM_IMPACT_MS=540;
  const GOLEM_SPEED_PX_PER_MS=.31,GOLEM_MIN_TRAVEL_MS=650,GOLEM_MAX_TRAVEL_MS=1480;
  // Lady Estel's Nature healing is staged separately. Health changes
  // ONLY when the independent floating orb physically reaches its ally.
  const ESTEL_RISE_MS=1050,ESTEL_ORB_SPEED_PX_PER_MS=.39;
  const ESTEL_TRAVEL_MIN_MS=540,ESTEL_TRAVEL_MAX_MS=1100;
  const ESTEL_IMPACT_MS=720,ESTEL_EXIT_MS=840;
  // A full vortex stays on screen; 152ms high-speed rock flights replace
  // the former 620ms arcing hops. One damage event per target still lands
  // precisely at the renderer's own hitAt() milestone.
  const WIND_FORM_MS=960,WIND_VOLLEY_MS=1520,WIND_IMPACT_MS=420,WIND_DISSOLVE_MS=620;
  // Smooth sixteen-frame vampire: rise and open at the center floor ring,
  // fully leave the coffin, travel to the target, then return and turn
  // toward its own caster BEFORE presenting the free-floating blood orb.
  const VAMP_RISE_MS=1250,VAMP_OPEN_MS=830,VAMP_LUNGE_MS=1080;
  const VAMP_DRAIN_MS=700,VAMP_RETURN_MS=1330,VAMP_PRESENT_MS=900;
  const VAMP_ORB_MS=920,VAMP_VANISH_MS=650;
  // Fire dragon lands, charges its own fireball, shoots at one enemy
  // and splashes only their immediate formation neighbors, then flies off.
  const DRAGON_DROP_MS=880,DRAGON_LAND_MS=600,DRAGON_CHARGE_MS=1280;
  // The fully-charged fireball fires as a near-instant blast.
  // Adjacent follow-up fireballs also move quickly after the explosion.
  const DRAGON_SHOT_MS=110,DRAGON_SPLASH_MS=460;
  const DRAGON_IMPACT_MS=420,DRAGON_EXIT_MS=970;
  // Same approved wizard mesh in every battle slot, with different palettes.
  const LOOK_PRESETS=[
    [{robeColor:"#6f4ab4",hatColor:"#6f4ab4",skinColor:"#cca084"},
     {robeColor:"#3269c1",hatColor:"#128e9e",skinColor:"#e7b081"},
     {robeColor:"#b83a55",hatColor:"#30293c",skinColor:"#c7885b"},
     {robeColor:"#2c8a64",hatColor:"#d08a34",skinColor:"#805036"}],
    [{robeColor:"#44526b",hatColor:"#b83a55",skinColor:"#f1cfad"},
     {robeColor:"#d08a34",hatColor:"#3269c1",skinColor:"#a96b4a"},
     {robeColor:"#ad5c9d",hatColor:"#30293c",skinColor:"#b197c5"},
     {robeColor:"#dfd8c7",hatColor:"#128e9e",skinColor:"#58382f"}]
  ];
  const LOOK_STORAGE_KEY="wizardry.appearance.v38";
  let savedLooks={};
  try{const saved=JSON.parse(localStorage.getItem(LOOK_STORAGE_KEY)||"{}");
    if(saved&&typeof saved==="object"&&!Array.isArray(saved))savedLooks=saved;}catch{}
  function saveLook(u){
    savedLooks[u.id]={hat:u.hat,robe:u.robe,robeColor:u.robeColor,
      hatColor:u.hatColor,skinColor:u.skinColor};
    try{localStorage.setItem(LOOK_STORAGE_KEY,JSON.stringify(savedLooks));}catch{}
  }
  // Rune drawings play automatically in the arena for all combatants.
  function createUnit(d,team,index){
    const id=(team?"e":"a")+index;
    const preset=LOOK_PRESETS[team][index];
    const custom=savedLooks[id]||{};
    const colors=window.WizardryPalettes;
    const pick=(value,allowed,defaultValue)=>allowed&&Object.hasOwn(allowed,value)?value:defaultValue;
    const entry=activeRoster?.find(p=>p.team===team&&p.slot===index);
    const profile=Builds?(entry?.profile||(!activeRoster&&team===0&&index===0&&configuredProfile?configuredProfile:Builds.cpu(CARDS,index+team*4))):null;
    const build=profile?Builds.stats(profile):{hp:2000,mana:16};
    return {id,team,index,name:profile?.name||d.name,style:'tide',color:d.color,
      hp:build.hp,maxHp:build.hp,mana:build.mana,maxMana:build.mana,level:profile?.level||20,skills:profile?.skills||{},masteries:profile?.masteries,grimoire:profile?.deck,peerId:entry?.isCpu?null:entry?.peerId||null,isHuman:!!entry?.peerId&&!entry?.isCpu,
      speed:d.speed,statuses:[],rechargeRound:null,stunRound:null,x:0,y:0,
      hat:"pointed",
      robe:"classic",
      robeColor:profile?.robeColor||pick(custom.robeColor,colors?.robeColors,preset.robeColor),
      hatColor:profile?.hatColor||pick(custom.hatColor,colors?.hatColors,preset.hatColor),
      skinColor:profile?.skinColor||pick(custom.skinColor,colors?.skinColors,preset.skinColor),
      armRaise:0,facing:team?-.74:.74,defeatElapsedMs:null};
  }
  function sideUnits(team){return state.units.filter(u=>u.team===team);}
  function alive(side){return sideUnits(side).filter(u=>u.hp>0);}
  function getUnit(id){return state.units.find(u=>u.id===id)||null;}
  function setBattle(mode="story",size=4){
    if(![1,2,3,4].includes(size))size=4;
    const units=[...ALLIES.slice(0,size).map((d,i)=>createUnit(d,0,i)),
                 ...(mode==="pvp"?PVP_WIZARDS:ENEMIES).slice(0,size).map((d,i)=>createUnit(d,1,i))].filter(u=>mode!=="online"||activeRoster?.some(p=>p.team===u.team&&p.slot===u.index));
    for(const u of units){
      const p=scenePositions[size][u.team][u.index];u.x=p[0];u.y=p[1];
      startHand(u,u.isHuman||(!activeRoster&&u.id==="a0"));
    }
    state={mode,size,units,round:1,phase:"planning",planningSide:0,
      // Only seat 0 on each human-controlled team belongs to a real player.
      // Everyone else is a CPU stand-in until live co-op / PvP exists.
      humanByTeam:{0:"a0",1:mode==="pvp"?"e0":null},
      selectedCaster:units[0]?.id,selectedCard:null,selectedTarget:null,
      plans:{},sequence:[],queueAt:0,animation:null,winner:null,auras:[null,null],
      flashes:[],log:[],activeCard:null,inspectedStatus:null};
    handSwipe?.reset();
    ui.statusPopup.hidden=true;
    ui.status.textContent=mode==="story"?
      "You control "+units[0].name+". All other wizards are CPU-controlled.":
      "PvP local hot-seat simulation only. No real matchmaking or connected friends yet.";
    paintUI();
  }
  function caster(){
    const id=window.WizardrySession?.active?state.units.find(u=>u.peerId===window.WizardrySession.peerId)?.id:state.humanByTeam[state.planningSide];
    const u=id?getUnit(id):null;
    return u&&u.hp>0&&u.team===state.planningSide?u:null;
  }
  // No implicit spell or enemy selection. Each player-controlled wizard
  // must explicitly pick a card and target again for EVERY new round.
  function currentCard(){return state.selectedCard?BY_ID[state.selectedCard]||null:null;}
  function targetsFor(card,c){
    if(!card||!c)return[];
    if(card.selfOnly)return c.hp>0?[c]:[];
    if(card.target==="team")return alive(c.team);
    if(card.target==="all_enemies")return alive(1-c.team);
    return alive(card.target==="ally"?c.team:1-c.team);
  }
  function correctTarget(){
    const c=caster(),card=currentCard();
    if(!c||!card)return null;
    if(card.target==="team"||card.target==="all_enemies"){state.selectedTarget=null;return null;}
    const selected=getUnit(state.selectedTarget);
    if(!selected||!targetsFor(card,c).some(u=>u.id===selected.id)){
      state.selectedTarget=null;
      return null;
    }
    return selected;
  }
  function clearSelection(){
    handSwipe?.reset();
    state.selectedCard=null;state.selectedHandCopy=0;
    state.selectedTarget=null;
  }
  function nearestAvailableCaster(){
    state.selectedCaster=state.humanByTeam[state.planningSide]||null;
    clearSelection();
  }
  function selectCaster(id){
    // Other wizards are separate people/CPU, never controllable in this test.
    if(state.phase!=="planning"||id!==state.humanByTeam[state.planningSide])return;
    paintUI();
  }
  function selectTarget(id){
    if(state.phase!=="planning")return;
    const u=getUnit(id),c=caster(),card=currentCard();
    if(!c||!card||!u||u.hp<=0||
       !targetsFor(card,c).some(v=>v.id===u.id))return;
    // Allies can be targeted for healing; enemies for damaging spells.
    // No spell queues until the explicit confirmation is pressed.
    state.selectedTarget=id;
    paintUI();
  }
  function selectFanCard(id,copy=0){
    const u=caster(),card=BY_ID[id];
    if(state.phase!=="planning"||!u?.hand.includes(id)||!card)return;
    state.selectedHandCopy=copy;handSwipe?.focusCard(id,copy);
    chooseCard(id);
  }
  function chooseCard(id){
    if(state.phase!=="planning"||!BY_ID[id]||!caster())return;
    if(!caster().hand.includes(id))return;
    if(state.plans[caster().id])return;
    state.selectedCard=id;
    state.selectedTarget=BY_ID[id].selfOnly?caster().id:null;
    paintUI();
  }
  function confirmTarget(){
    if(state.phase!=="planning"||!caster()||!currentCard())return;
    if(!["team","all_enemies"].includes(currentCard().target)&&!correctTarget())return;
    if(queueSpell())resolvePressed();
  }
  function queueSpell(){
    if(window.WizardrySession?.active){const c=caster(),card=currentCard(),t=correctTarget();if(!c||!card)return false;return window.WizardrySession.plan({cardId:card.id,targetId:t?.id||null,round:state.round});}
    const c=caster(),card=currentCard(),target=correctTarget();
    const area=["team","all_enemies"].includes(card?.target);
    if(state.phase!=="planning"||!c||!card||requiresRest(c)||state.plans[c.id]||
       c.mana<card.cost||!c.hand.includes(card.id)||(!target&&!area)||
       (area&&!alive(card.target==="team"?c.team:1-c.team).length))return false;
    state.plans[c.id]={casterId:c.id,cardId:card.id,
      targetId:area?null:target.id,team:c.team,auto:false};
    playHandCard(c,card.id);
    state.log=[c.name+" played "+card.name+" against "+(area?(card.target==="team"?"ALL ALLIES":"ALL ENEMIES"):target.name),
      ...state.log].slice(0,5);
    clearSelection();
    paintUI();
    return true;
  }
  function isRecharging(u){
    return !!u&&u.hp>0&&Number.isInteger(u.rechargeRound)&&
      state.round===u.rechargeRound;
  }
  function isStunned(u){
    return !!u&&u.hp>0&&Number.isInteger(u.stunRound)&&
      state.round===u.stunRound&&u.statuses.some(st=>st.kind==="stun");
  }
  function isFrozen(u,roll){
    const frost=u?.statuses.find(st=>st.kind==="frozen");if(!frost||u.hp<=0||state.round<frost.startRound)return false;
    if(frost.releaseRound&&state.round>=frost.releaseRound){consumeStatus(u,"frozen");return false;}
    if(frost.lastTurnRound!==state.round){frost.lastTurnRound=state.round;frost.turnsTested=(frost.turnsTested||0)+1;
      const chance=frost.turnsTested*.20;
      if((roll??Math.random())<chance){consumeStatus(u,"frozen");flash(u,"THAWED","#b8f3ff");return false;}
      flash(u,"FROZEN · SKIP","#b8f3ff");if(frost.turnsTested>=3)frost.releaseRound=state.round+1;
    }return true;
  }
  function attemptMarkedFreeze(target,card,spell,roll){
    if(card?.school!=="ice")return false;
    if(spell?.freezeMarkTargets?.[target.id])return false;
    if(spell){if(!spell.freezeMarkTargets)spell.freezeMarkTargets={};spell.freezeMarkTargets[target.id]=true;}
    const mark=consumeStatus(target,"freezing_temps");if(!mark||target.hp<=0||(roll??Math.random())>=.5)return false;
    if(!canReceiveDebuff(target))return false;
    addStatus(target,"frozen","❄",1);const frozen=target.statuses.find(st=>st.kind==="frozen");
    const pending=state.phase==="resolving"&&state.sequence?.slice(state.queueAt).some(a=>a.casterId===target.id);
    frozen.startRound=pending?state.round:state.round+1;frozen.turnsTested=0;frozen.lastTurnRound=null;frozen.releaseRound=null;
    flash(target,"FROZEN","#b8f3ff");return true;
  }
  function expireJackFear(u){
    const fear=u?.statuses.find(st=>st.kind==="fear");
    if(fear&&(u.hp<=0||state.round>=fear.expiresRound))consumeStatus(u,"fear");
  }
  function rollJackFear(u,roll){
    expireJackFear(u);
    const fear=u?.statuses.find(st=>st.kind==="fear");
    if(!fear||state.round<fear.startRound)return false;
    if(fear.lastRollRound!==state.round){
      fear.lastRollRound=state.round;
      fear.skip=(roll??Math.random())<fear.value;
    }
    return fear.skip;
  }
  function applyJackFear(target,card){
    if(!canReceiveDebuff(target))return false;
    const pending=state.phase==="resolving"&&state.sequence?.slice(state.queueAt).some(a=>a.casterId===target.id);
    const startRound=pending?state.round:state.round+1;
    addStatus(target,"fear","☠",card.fearChance);
    Object.assign(target.statuses.find(st=>st.kind==="fear"),{startRound,expiresRound:startRound+card.fearTurns,lastRollRound:null,skip:false});
    flash(target,"FEAR · 3 ROUNDS","#dfb7f1");
    state.log=[target.name+" is haunted by Jack the Lantern: 30% chance to skip each of 3 turns.",...state.log].slice(0,5);
  }
  function requiresRest(u){
    return !!u&&u.hp>0&&(isFrozen(u)||isStunned(u)||isRecharging(u)||
      !u.hand.some(id=>BY_ID[id]?.cost<=u.mana));
  }
  function autoPlan(u){
    if(requiresRest(u))return null;
    const opponents=alive(1-u.team);
    const wounded=alive(u.team).filter(a=>a.hp<a.maxHp);
    if(!opponents.length)return null;
    // CPU healing prioritizes a real injury and never targets an enemy.
    const affordable=CARDS.filter(card=>u.hand.includes(card.id)&&
      card.cost<=u.mana&&(card.kind!=="heal"||wounded.length>0));
    if(!affordable.length)return null;
    const card=affordable[Math.floor(Math.random()*affordable.length)];
    const target=["team","all_enemies"].includes(card.target)?null:
      card.selfOnly?u:card.kind==="heal"?
        [...wounded].sort((a,b)=>(b.maxHp-b.hp)-(a.maxHp-a.hp))[0]:
        card.target==="ally"?alive(u.team)[Math.floor(Math.random()*alive(u.team).length)]:
        opponents[Math.floor(Math.random()*opponents.length)];
    if(!target&&!["team","all_enemies"].includes(card.target))return null;
    return {casterId:u.id,cardId:card.id,targetId:target?.id||null,
      team:u.team,auto:true};
  }
  function autoFill(team){
    if(state.phase!=="planning")return;
    for(const u of alive(team)){
      if((window.WizardrySession?.active?u.isHuman:u.id===state.humanByTeam[team])||state.plans[u.id])continue;
      const p=autoPlan(u);
      if(p&&playHandCard(u,p.cardId))state.plans[u.id]=p;
    }
  }
  function resolvePressed(){
    if(window.WizardrySession?.active){if(window.WizardrySession.isHost){autoFill(0);autoFill(1);runResolution();}return;}
    if(state.phase!=="planning")return;
    const humanId=state.humanByTeam[state.planningSide];
    // The player's own wizard must have queued their one explicit choice.
    if(humanId&&getUnit(humanId)?.hp>0&&!requiresRest(getUnit(humanId))&&
       !state.plans[humanId])return;
    if(state.mode==="pvp"&&state.planningSide===0&&
       state.humanByTeam[1]&&getUnit(state.humanByTeam[1])?.hp>0){
      state.planningSide=1;
      nearestAvailableCaster();
      paintUI();
      if(!caster()||requiresRest(caster()))resolvePressed();
      return;
    }
    autoFill(0);autoFill(1);
    runResolution();
  }
  // Rotate the fixed interleaved seat ring, then omit defeated wizards.
  function turnOrder(round=state.round){
    const seats=[];
    for(let i=0;i<state.size;i++)for(const team of [0,1]){
      const u=state.units.find(u=>u.team===team&&u.index===i);if(u)seats.push(u);
    }
    const offset=(round-1)%seats.length;
    return seats.slice(offset).concat(seats.slice(0,offset)).filter(u=>u.hp>0);
  }
  function discardFromHand(u,id){
    if(!u||u.discardedRound===state.round)return false;
    const at=u.hand.indexOf(id);if(at<0)return false;
    u.hand.splice(at,1);u.drawPile.push(id);u.discardedRound=state.round;u.discardedCard=id;return true;
  }
  function discardSelected(){
    const u=caster();if(state.phase!=="planning"||!u||state.plans[u.id]||!state.selectedCard)return false;
    const ok=discardFromHand(u,state.selectedCard);if(ok){clearSelection();paintUI();}return ok;
  }
  function passTurn(){
    if(window.WizardrySession?.active){window.WizardrySession.plan({pass:true,round:state.round});return;}
    const c=caster();if(state.phase!=="planning"||!c||state.plans[c.id])return;
    c.passedRound=state.round;
    state.plans[c.id]={casterId:c.id,cardId:null,targetId:null,team:c.team,pass:true};
    clearSelection();resolvePressed();
  }
  function grantTurnMana(){
    for(const u of state.units){
      if(u.hp<=0)continue;
      const flow=u.statuses.find(st=>st.kind==="flow_state");
      const bonus=flow&&flow.remaining>0&&flow.appliedRound<state.round&&flow.lastTickRound!==state.round?1:0;
      // Guard repeated entry to this turn against duplicate mana awards.
      if(u.lastManaRound===state.round)continue;
      const passed=u.passedRound===state.round-1;
      u.passStreak=passed?(u.passStreak||0)+1:0;
      const base=passed?1+u.passStreak:1,gain=base+bonus;
      u.lastManaRound=state.round;u.mana=Math.min(u.maxMana||MAX_MANA,u.mana+gain);
      if(bonus){flow.lastTickRound=state.round;flow.remaining--;flash(u,"+"+gain+" MANA · FLOW STATE","#a7f5ff");
        if(!flow.remaining)consumeStatus(u,"flow_state");}
    }
  }
  function checkBattleEnd(){
    if(!state)return false;
    if(state.phase==="ending"||state.phase==="finished")return true;
    const a=alive(0).length,b=alive(1).length;if(a&&b)return false;
    // Lethal damage must not erase the active spell. Its remaining hits,
    // exit and recovery finish normally; startNextAction checks again once
    // the animation clears, before another queued action can begin.
    if(state.phase==="resolving"&&state.animation)return false;
    state.winner=a?0:b?1:"draw";state.phase="ending";state.endingHoldMs=0;
    state.animation=null;state.plans={};state.sequence=[];state.queueAt=0;
    clearSelection();for(const u of state.units)u.armRaise=0;
    ui.hint.textContent="The final wizard falls...";
    ui.status.textContent=ui.hint.textContent;paintUI();return true;
  }
  function updateBattleEnding(dt){
    if(state.phase!=="ending")return;
    // Finish every active defeat pose before starting the half-second pause.
    if(state.units.some(u=>u.hp<=0&&(!Number.isFinite(u.defeatElapsedMs)||u.defeatElapsedMs<DEFEAT_HOLD_MS)))return;
    state.endingHoldMs+=Math.max(0,dt);
    if(state.endingHoldMs<500)return;
    state.phase="finished";
    ui.hint.textContent=state.winner==="draw"?"Draw!":(state.winner===0?"Allies":"Enemy team")+" wins!";
    ui.status.textContent=ui.hint.textContent;paintUI();
  }
  function runResolution(){
    if(state.phase!=="planning")return;
    // All humans must lock in before any CPU or human action resolves.
    if(state.units.some(u=>u.hp>0&&(window.WizardrySession?.active?u.isHuman:u.id===state.humanByTeam[u.team])&&
      !requiresRest(u)&&!state.plans[u.id]))return;
    autoFill(0);autoFill(1);
    const order=turnOrder().map(u=>state.plans[u.id]).filter(Boolean);
    state.plans=Object.freeze(Object.fromEntries(Object.entries(state.plans)
      .map(([id,plan])=>[id,Object.freeze({...plan})])));
    state.sequence=Object.freeze(order.map(plan=>Object.freeze({...plan})));state.queueAt=0;state.animation=null;state.phase="resolving";
    for(const u of state.units)u.armRaise=0;
    state.log=["Actions follow the rotating zigzag turn order.",...state.log].slice(0,5);
    paintUI();
    startNextAction();
  }
  // Element tracing uses the SAME 24×24 glyph geometry as the low-poly
  // emblem on each card. Never replace it with a generic squiggle.
  function runePath(id){
    const school=BY_ID[id]?.school||id;
    return window.WIZARDRY_ELEMENT_TRACE_V45?.pathFor(school)||[];
  }
  function startStage(a,stage,duration){
    a.stage=stage;a.elapsed=0;a.duration=duration;
  }
  // All wizards AND enemies automatically trace the same rune.
  // Accuracy is a separate per-cast random roll, independent of user input.
  // A uniform roll in [0,1) gives the card's exact percentage chance.
  function spellHitCheck(card,roll=Math.random(),bonus=0){
    return roll<Math.max(0,Math.min(1,Math.round((card.accuracy+bonus)*1e12)/1e12));
  }
  function resolveAutoRune(){
    const a=state?.animation;
    if(!a||a.stage!=="tracing-auto")return false;
    const c=getUnit(a.source);
    const used=consumeStatus(c,"tailwind"),shock=c.statuses.find(st=>st.kind==="static_shock"),turbulence=consumeStatus(c,"turbulence"),bonus=(used?.value||0)-(shock?.value||0)-(turbulence?.value||0)-thornAccuracyPenalty(c);
    a.accuracyBonusUsed=bonus;
    a.effectiveAccuracy=Math.max(0,Math.min(1,a.card.accuracy+bonus));
    const success=spellHitCheck(a.card,Math.random(),bonus);
    if(turbulence){flash(c,"TURBULENCE −50% ACC","#b8efdc");state.log=[c.name+" uses up Turbulence (−50 accuracy points).",...state.log].slice(0,5);}
    a.runeResult=success?"success":"failed";
    if(used){
      flash(c,"TAILWIND +10% ACC","#cbf7e4");
      state.log=[c.name+" uses Tailwind (+10 accuracy points) on "+a.card.name+".",
        ...state.log].slice(0,5);
    }
    // Rune outcome ends the staff wave immediately, irrespective of the
    // subsequent summon/fizzle animation's length.
    a.lowerFromFrame=waveFrame(a.traceMs||0);
    a.visualRecoveryMs=0;
    const label=Math.round(a.effectiveAccuracy*100)+"% accuracy";
    if(success){
      c.mana=Math.max(0,c.mana-a.card.cost);
      recordLightningRodCast(c,a.card);
      // The COMPLETED ELEMENT rune must brighten and hold before any
      // summon begins. Freeze the chosen Golem target for its later fissure.
      if(a.card.id==="golem"){
        const goal=getUnit(a.target);
        a.targetPoint=goal?{x:goal.x,y:goal.y+8}:null;
        a.golemPostSlamMs=0;
      }
      startStage(a,"rune-success",RUNE_GLOW_MS);
      ui.hint.textContent=c.name+" completes the "+a.card.school+
        " rune ("+label+") — it pulses with magical light!";
    }else{
      // Keep the FAILED glyph on screen until its own darkening/crumbling
      // animation has finished. No generic red X or premature fizzle.
      startStage(a,"rune-fail",RUNE_CRUMBLE_MS);
      flash(c,"MISS","#f6a7a2");
      if(shock){consumeStatus(c,"static_shock");c.hp=Math.max(0,c.hp-(shock.damage||100));flash(c,"STATIC SHOCK −"+(shock.damage||100),"#a5dfff");
        state.log=[c.name+" takes 100 damage from Static Shock; the curse expires.",...state.log].slice(0,5);
        if(!c.hp){c.defeatElapsedMs=0;flash(c,"DEFEATED","#ffdb9c");}}
      state.log=[c.name+"'s "+a.card.name+" missed ("+label+").",...state.log].slice(0,5);
      ui.hint.textContent=c.name+"'s "+a.card.school+
        " rune goes dark and crumbles — no damage.";
    }
    paintUI();
    return success;
  }
  function updateCastSequence(deltaMs){
    const a=state?.animation;
    if(!a||state.phase!=="resolving")return;
    const caster=getUnit(a.source);
    if(a.card.id==="thunder"&&a.stage.startsWith("thunder-"))
      a.thunderMs=(a.thunderMs||0)+Math.min(Math.max(0,deltaMs),Math.max(0,a.duration-a.elapsed));
    a.elapsed=Math.min(a.duration,a.elapsed+Math.max(0,deltaMs));
    const p=clamp(a.elapsed/a.duration,0,1);
    // Trace only while checking the rune. The spell effect remains active
    // independently while the caster lowers their staff and resumes idle.
    if(a.stage==="tracing-auto")
      a.traceMs=(a.traceMs||0)+Math.max(0,deltaMs);
    if(["rune-success","rune-fail","summon","fizzle","lowering","golem-slam",
        "golem-travel","golem-impact","estel-summon","estel-travel",
        "estel-impact","estel-exit","wind-summon","wind-volley",
        "wind-impact","wind-dissolve","vamp-rise","vamp-open",
        "vamp-lunge","vamp-drain","vamp-return","vamp-present",
        "vamp-orb","vamp-vanish","dragon-drop","dragon-land",
        "dragon-charge","dragon-shot","dragon-splash",
        "dragon-impact","dragon-exit","bear-appear","bear-roar","bear-ready","bear-charge","bear-claw","bear-disperse","shark-fin","shark-swim","shark-submerge","shark-rise","shark-flop","shark-arch","shark-chomp","shark-dive","shark-splash","thunder-form","thunder-spread","thunder-clap","thunder-bolt","thunder-impact","thunder-dissolve","rain-form","rain-barrage","rain-fade","ronin-drop","ronin-land","ronin-reach","ronin-draw","ronin-volley","ronin-finish","ronin-exit","reaper-circle","reaper-rise","reaper-windup","reaper-lunge","reaper-slash","reaper-dissolve","reaper-close","bender-appear","bender-stance","bender-stomp","bender-wall","bender-punch","bender-barrage","bender-exit","frost-gust","frost-appear","frost-happy","frost-angry","frost-transform","frost-pause","frost-lift","frost-windup","frost-throw","frost-flight","frost-impact","frost-melt"]
        .includes(a.stage)&&Number.isFinite(a.visualRecoveryMs))
      a.visualRecoveryMs=Math.min(WIZARD_RECOVERY_MS,
        a.visualRecoveryMs+Math.max(0,deltaMs));
    // Golem can return to idle and unsummon independently of the moving
    // fissure; its animation clock is never reset at a combat stage boundary.
    if(["golem-travel","golem-impact"].includes(a.stage))
      a.golemPostSlamMs=(a.golemPostSlamMs||0)+Math.max(0,deltaMs);
    if(a.stage==="bender-barrage"&&a.elapsed>=90&&!a.applied)applyBenderStrike(a);
    if(a.stage==="reaper-slash"&&p>=.4&&!a.applied)applyReaperStrike(a);
    if(a.stage==="ronin-volley"&&a.runeResult==="success")
      for(let i=0;i<3;i++)if(a.elapsed>=260+i*135)applyRoninHit(a,i);
    if(a.stage==="rain-barrage"&&a.runeResult==="success")
      for(let i=0;i<(a.rainTargets||[]).length;i++)
        if(a.elapsed>=440+i*55)applyRainHit(a,a.rainTargets[i]);
    if(a.stage==="bear-claw"&&p>=.45&&!a.applied)applySpell(a);
    if(a.stage==="raising")caster.armRaise=ease(p);
    else if(a.stage==="lowering")caster.armRaise=1-ease(p);
    else caster.armRaise=1;
    if(a.stage==="summon"&&a.card.id==="windfist"&&a.runeResult==="success")
      for(let i=0;i<WIND_FIST_HIT_TIMES.length;i++)if(p>=WIND_FIST_HIT_TIMES[i])applyWindFistHit(a,i);
    if(a.stage==="summon"&&a.card.id==="zeus"&&a.runeResult==="success"){
      if(p>=a.card.hit)applyZeusImpact(a);
      for(const entry of a.zeusChainTargets||[])if(p>=entry.hitAt)applyZeusChain(a,entry);
    }
    if(a.stage==="summon"&&a.card.id==="blizzard"&&a.runeResult==="success")
      for(const [i,entry] of (a.blizzardTargets||[]).entries())
        if(p>=blizzardHitAt(i,a.blizzardTargets.length))applyBlizzardHit(a,entry);
    if(a.stage==="summon"&&a.card.id==="penguins"&&a.runeResult==="success")
      for(let i=0;i<3;i++)if(a.elapsed>=NINJA_HIT_TIMES[i]*a.card.duration)applyPenguinHit(a,i);
    if(a.stage==="summon"&&a.card.id!=="penguins"&&!a.applied&&a.elapsed>=a.card.duration*a.card.hit)
      applySpell(a);
    if(a.stage==="dragon-splash"&&a.runeResult==="success"){
      // Apply the 150 damage when each outward-traveling mini fireball
      // reaches its neighbor, never before or more than once.
      const splash=a.dragonSplashIds||[];
      for(let i=0;i<splash.length;i++){
        const id=splash[i];
        const arrival=window.WIZARDRY_BABY_DRAGON_V61?.splashHitAt(i,splash.length)||
          (splash.length===1?.62:i===0?.57:.73);
        if(p>=arrival)applyDragonSplashHit(a,id);
      }
    }
    if(a.stage==="wind-volley"&&a.runeResult==="success"){
      // Each rock volley has its own launch/arrival window. Apply 200 HP
      // damage to EACH opposing wizard when that wizard's stones land,
      // rather than damaging all opponents at the end of the sequence.
      const targets=a.windImpactTargets||[];
      for(let i=0;i<targets.length;i++){
        const entry=targets[i];
        if(entry.hit)continue;
        const arrival=window.WIZARDRY_TORNADO_V54?.hitAt(i,targets.length)||
          (targets.length<=1?.45:.34+i*.48/(targets.length-1));
        if(p>=arrival){
          entry.hit=true;
          const unit=getUnit(entry.id);
          if(unit&&unit.hp>0&&unit.team!==caster.team)
            damage(caster,unit,a.card.damage,a.card,a);
        }
      }
    }
    if(a.elapsed<a.duration)return;
    if(a.stage==="raising"){
      caster.armRaise=1;
      startStage(a,"tracing-auto",AUTO_TRACE_MS);
      const nextBonus=(caster.statuses.find(st=>st.kind==="tailwind")?.value||0)-(caster.statuses.find(st=>st.kind==="static_shock")?.value||0)-(caster.statuses.find(st=>st.kind==="turbulence")?.value||0)-thornAccuracyPenalty(caster);
      ui.hint.textContent=caster.name+" automatically traces the "+a.card.school+
        " rune · "+Math.round(Math.max(0,Math.min(1,a.card.accuracy+nextBonus))*100)+"% accuracy";
      paintUI();
    }else if(a.stage==="tracing-auto"){
      resolveAutoRune();
    }else if(a.stage==="rune-success"){
      // Only begin a summon after the completed rune has glowed.
      // Estel then materializes BEFORE releasing the floating orb;
      // the HP change is delayed until the orb reaches the ally.
      if(a.card.id==="blizzard"){
        a.blizzardTargets=alive(1-caster.team).map(u=>({id:u.id,x:u.x,y:u.y,hit:false}));
        startStage(a,"summon",a.card.duration);
      }else if(a.card.id==="bloom"){
        a.sporeTargets=alive(1-caster.team).map(u=>({id:u.id,x:u.x,y:u.y}));
        startStage(a,"summon",a.card.duration);
      }else if(a.card.id==="frosty"){
        const target=getUnit(a.target);a.frostTargetPoint=target?{x:target.x,y:target.y}:null;
        startStage(a,"frost-gust",800);
      }else if(a.card.id==="bender"){
        const target=getUnit(a.target);a.benderTargetPoint=target?{x:target.x,y:target.y}:null;
        startStage(a,"bender-appear",550);
      }else if(a.card.id==="reaper"){
        const target=getUnit(a.target);a.reaperTargetPoint=target?{x:target.x,y:target.y}:null;
        startStage(a,"reaper-circle",650);
      }else if(a.card.id==="ronin"){
        const target=getUnit(a.target);a.slashTargetPoint=target?{x:target.x,y:target.y}:null;a.slashHits=[];
        startStage(a,"ronin-drop",450);
      }else if(a.card.id==="arrows"){
        a.rainTargets=alive(1-caster.team).map(u=>({id:u.id,x:u.x,y:u.y,hit:false}));
        startStage(a,"rain-form",650);
      }else if(a.card.id==="thunder")startStage(a,"thunder-form",700);
      else if(a.card.id==="shark")startStage(a,"shark-fin",1100);
      else if(a.card.id==="bear")startStage(a,"bear-appear",650);
      else if(a.card.id==="estel")startStage(a,"estel-summon",ESTEL_RISE_MS);
      else if(a.card.id==="wind")startStage(a,"wind-summon",WIND_FORM_MS);
      else if(a.card.id==="vampire")startStage(a,"vamp-rise",VAMP_RISE_MS);
      else if(a.card.id==="dragon")startStage(a,"dragon-drop",DRAGON_DROP_MS);
      else startStage(a,a.card.id==="golem"?"golem-slam":"summon",
        a.card.id==="golem"?GOLEM_SLAM_MS:a.card.duration);
      ui.hint.textContent=caster.name+" invokes "+a.card.name+"!";
      paintUI();
    }else if(a.stage==="rune-fail"){
      // The fractured rune has completely disappeared. End the attempt
      // without starting a summon, without a red-X overlay and without
      // granting Poseidon recharge or Tidal Echo.
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
      paintUI();
    }else if(a.stage==="frost-gust"){
      startStage(a,"frost-appear",650);
    }else if(a.stage==="frost-appear"){
      startStage(a,"frost-happy",700);
    }else if(a.stage==="frost-happy"){
      startStage(a,"frost-angry",500);
    }else if(a.stage==="frost-angry"){
      startStage(a,"frost-transform",1000);
    }else if(a.stage==="frost-transform"){
      startStage(a,"frost-pause",900);
    }else if(a.stage==="frost-pause"){
      startStage(a,"frost-lift",650);
    }else if(a.stage==="frost-lift"){
      startStage(a,"frost-windup",600);
    }else if(a.stage==="frost-windup"){
      startStage(a,"frost-throw",150);
    }else if(a.stage==="frost-throw"){
      startStage(a,"frost-flight",322.5);
    }else if(a.stage==="frost-flight"){
      applyFrostyImpact(a);startStage(a,"frost-impact",350);
    }else if(a.stage==="frost-impact"){
      startStage(a,"frost-melt",1200);
    }else if(a.stage==="frost-melt"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="bender-appear"){
      startStage(a,"bender-stance",500);
    }else if(a.stage==="bender-stance"){
      startStage(a,"bender-stomp",850);
    }else if(a.stage==="bender-stomp"){
      startStage(a,"bender-wall",650);
    }else if(a.stage==="bender-wall"){
      startStage(a,"bender-punch",250);
    }else if(a.stage==="bender-punch"){
      startStage(a,"bender-barrage",550);
    }else if(a.stage==="bender-barrage"){
      if(!a.applied)applyBenderStrike(a);
      startStage(a,"bender-exit",600);
    }else if(a.stage==="bender-exit"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="reaper-circle"){
      startStage(a,"reaper-rise",850);
    }else if(a.stage==="reaper-rise"){
      startStage(a,"reaper-windup",550);
    }else if(a.stage==="reaper-windup"){
      startStage(a,"reaper-lunge",320);
    }else if(a.stage==="reaper-lunge"){
      startStage(a,"reaper-slash",420);
    }else if(a.stage==="reaper-slash"){
      if(!a.applied)applyReaperStrike(a);
      startStage(a,"reaper-dissolve",650);
    }else if(a.stage==="reaper-dissolve"){
      startStage(a,"reaper-close",300);
    }else if(a.stage==="reaper-close"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="ronin-drop"){
      startStage(a,"ronin-land",300);
    }else if(a.stage==="ronin-land"){
      startStage(a,"ronin-reach",1000);
    }else if(a.stage==="ronin-reach"){
      startStage(a,"ronin-draw",120);
    }else if(a.stage==="ronin-draw"){
      startStage(a,"ronin-volley",760);
    }else if(a.stage==="ronin-volley"){
      for(let i=0;i<3;i++)applyRoninHit(a,i);
      a.applied=true;startStage(a,"ronin-finish",350);
    }else if(a.stage==="ronin-finish"){
      startStage(a,"ronin-exit",300);
    }else if(a.stage==="ronin-exit"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="rain-form"){
      startStage(a,"rain-barrage",1800);
    }else if(a.stage==="rain-barrage"){
      // Finish any arrivals skipped by a large frame; extra visual arrows never multiply damage.
      for(const entry of a.rainTargets||[])applyRainHit(a,entry);
      a.applied=true;startStage(a,"rain-fade",450);
    }else if(a.stage==="rain-fade"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="thunder-form"){
      startStage(a,"thunder-spread",650);
    }else if(a.stage==="thunder-spread"){
      startStage(a,"thunder-clap",140);
    }else if(a.stage==="thunder-clap"){
      startStage(a,"thunder-bolt",320);
    }else if(a.stage==="thunder-bolt"){
      if(!a.applied)applySpell(a);
      startStage(a,"thunder-impact",650);
    }else if(a.stage==="thunder-impact"){
      startStage(a,"thunder-dissolve",600);
    }else if(a.stage==="thunder-dissolve"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="shark-fin"){
      startStage(a,"shark-swim",1500);
    }else if(a.stage==="shark-swim"){
      startStage(a,"shark-submerge",350);
    }else if(a.stage==="shark-submerge"){
      startStage(a,"shark-rise",650);
    }else if(a.stage==="shark-rise"){
      startStage(a,"shark-flop",500);
    }else if(a.stage==="shark-flop"){
      startStage(a,"shark-arch",550);
    }else if(a.stage==="shark-arch"){
      startStage(a,"shark-chomp",180);
    }else if(a.stage==="shark-chomp"){
      if(!a.applied)applySpell(a);
      startStage(a,"shark-dive",520);
    }else if(a.stage==="shark-dive"){
      startStage(a,"shark-splash",450);
    }else if(a.stage==="shark-splash"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="bear-appear"){
      startStage(a,"bear-roar",950);
    }else if(a.stage==="bear-roar"){
      startStage(a,"bear-ready",260);
    }else if(a.stage==="bear-ready"){
      startStage(a,"bear-charge",800);
    }else if(a.stage==="bear-charge"){
      startStage(a,"bear-claw",550);
    }else if(a.stage==="bear-claw"){
      if(!a.applied)applySpell(a);
      startStage(a,"bear-disperse",650);
    }else if(a.stage==="bear-disperse"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="estel-summon"){
      // Lady Estel's wings open and the glowing orb forms in her hand.
      // No healing occurs until its independent travel animation ends.
      beginEstelTravel(a);
      ui.hint.textContent="Lady Estel sends a glowing Nature orb toward "+
        (getUnit(a.target)?.name||"the chosen ally")+".";
    }else if(a.stage==="estel-travel"){
      // Orb and the selected ally now meet at the exact arrival point.
      // Apply 750 HP ONCE here, not while summoning or mid-flight.
      if(!a.applied)applySpell(a);
      startStage(a,"estel-impact",ESTEL_IMPACT_MS);
      ui.hint.textContent="Lady Estel's blessing blooms on "+
        (getUnit(a.target)?.name||"the chosen ally")+"!";
      paintUI();
    }else if(a.stage==="estel-impact"){
      // Allow the green-gold healing bloom and leaves to finish before
      // Estel flies upward and disappears from the battlefield.
      startStage(a,"estel-exit",ESTEL_EXIT_MS);
    }else if(a.stage==="estel-exit"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="wind-summon"){
      // Capture the living enemies before the first rock launches.
      // Positions also anchor their own staggered impact effects.
      a.windImpactTargets=alive(1-caster.team).map(u=>({
        id:u.id,x:u.x,y:u.y,hit:false
      }));
      startStage(a,"wind-volley",WIND_VOLLEY_MS);
      ui.hint.textContent="The whirlwind launches high-speed rocks directly at each enemy!";
    }else if(a.stage==="wind-volley"){
      // All individual rock impacts have completed by this boundary.
      // This call grants Tailwind once and cannot replay previous damage.
      if(!a.applied)applySpell(a);
      startStage(a,"wind-impact",WIND_IMPACT_MS);
      ui.hint.textContent="The rock barrage finishes; Tailwind empowers the next spell!";
      paintUI();
    }else if(a.stage==="wind-impact"){
      startStage(a,"wind-dissolve",WIND_DISSOLVE_MS);
    }else if(a.stage==="wind-dissolve"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="dragon-drop"){
      startStage(a,"dragon-land",DRAGON_LAND_MS);
      ui.hint.textContent="The baby dragon crashes onto the arena floor in a cloud of smoke!";
    }else if(a.stage==="dragon-land"){
      startStage(a,"dragon-charge",DRAGON_CHARGE_MS);
      ui.hint.textContent="The dragon charges an enormous fireball in its mouth!";
    }else if(a.stage==="dragon-charge"){
      startStage(a,"dragon-shot",DRAGON_SHOT_MS);
      ui.hint.textContent="The dragon blasts a fast fireball straight toward "+
        (getUnit(a.target)?.name||"the enemy")+"!";
    }else if(a.stage==="dragon-shot"){
      // Main fireball contacts the target now: 650 HP and the 25% Burn
      // roll resolve at impact. Mini fireballs will carry splash separately.
      applyDragonImpact(a);
      startStage(a,"dragon-splash",DRAGON_SPLASH_MS);
      ui.hint.textContent="BOOM! A fiery explosion sends mini fireballs toward adjacent enemies!";
      paintUI();
    }else if(a.stage==="dragon-splash"){
      startStage(a,"dragon-impact",DRAGON_IMPACT_MS);
      ui.hint.textContent="The smaller fireballs finish striking nearby enemies!";
      paintUI();
    }else if(a.stage==="dragon-impact"){
      startStage(a,"dragon-exit",DRAGON_EXIT_MS);
      ui.hint.textContent="The baby dragon takes flight and leaves the arena.";
    }else if(a.stage==="dragon-exit"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="vamp-rise"){
      startStage(a,"vamp-open",VAMP_OPEN_MS);
      ui.hint.textContent="The coffin opens to reveal the vampire!";
    }else if(a.stage==="vamp-open"){
      startStage(a,"vamp-lunge",VAMP_LUNGE_MS);
      ui.hint.textContent="The vampire fully emerges in shadowy mist and lunges at its enemy!";
    }else if(a.stage==="vamp-lunge"){
      applyVampDamage(a);
      startStage(a,"vamp-drain",VAMP_DRAIN_MS);
      ui.hint.textContent="The vampire siphons "+(a.vampDrained||0)+" HP!";
      paintUI();
    }else if(a.stage==="vamp-drain"){
      startStage(a,"vamp-return",VAMP_RETURN_MS);
      ui.hint.textContent="The vampire flies back to "+caster.name+".";
    }else if(a.stage==="vamp-return"){
      startStage(a,"vamp-present",VAMP_PRESENT_MS);
      ui.hint.textContent="Facing "+caster.name+", the vampire offers the stolen life as a blood orb.";
    }else if(a.stage==="vamp-present"){
      startStage(a,"vamp-orb",VAMP_ORB_MS);
      ui.hint.textContent="The crimson orb floats into "+caster.name+".";
    }else if(a.stage==="vamp-orb"){
      applyVampHeal(a);
      startStage(a,"vamp-vanish",VAMP_VANISH_MS);
      paintUI();
    }else if(a.stage==="vamp-vanish"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="golem-slam"){
      // The original approved frame 11 is the moment the clasped-fist
      // ground slam finishes. Spawn the separate fissure ONLY after it.
      beginGolemTravel(a);
      ui.hint.textContent="Stone Golem slams the ground! The fissure races toward its target.";
    }else if(a.stage==="golem-travel"){
      // No arbitrary .62 threshold: the traveling sprite's head has
      // literally reached the target before a single damage point lands.
      if(!a.applied)applySpell(a);
      startStage(a,"golem-impact",GOLEM_IMPACT_MS);
      ui.hint.textContent="Stone fissure strikes "+(getUnit(a.target)?.name||"the target")+"!";
    }else if(a.stage==="golem-impact"){
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
    }else if(a.stage==="summon"||a.stage==="fizzle"){
      if(a.card.id==="poseidon"&&!a.postCastEffectsApplied){
        // A successful rune earns BOTH the one-round recharge and
        // Tidal Echo. A fizzle grants neither; any earlier Echo remains.
        const u=getUnit(a.source);
        if(u&&u.hp>0){
          if(a.runeResult==="success"){
            u.rechargeRound=state.round+1;
            addStatus(u,"recharge","⧖",1);
            addStatus(u,"tidal_echo","≈",.30);
            flash(u,"TIDAL ECHO","#87f2fa");
            state.log=[u.name+" gains Tidal Echo (+30% next successful Water hit) and must recharge next round.",
              ...state.log].slice(0,5);
          }else{
            state.log=[u.name+"'s Poseidon's Wrath fizzled: no recharge and no new Tidal Echo.",
              ...state.log].slice(0,5);
          }
        }
        a.postCastEffectsApplied=true;
      }
      // Every wizard uses the same recovery timing; the visible sprite
      // lowers immediately at rune outcome, then idles during the summon.
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
      paintUI();
    }else if(a.stage==="lowering"){
      caster.armRaise=0;
      state.animation=null;
      startNextAction();
    }
  }
  function startNextAction(){
    if(!state||state.phase!=="resolving"||checkBattleEnd())return;
    while(state.queueAt<state.sequence.length){
      const action=state.sequence[state.queueAt++],c=getUnit(action.casterId),card=BY_ID[action.cardId];
      if(checkBattleEnd())return;
      if(!c||c.hp<=0||!card)continue;
      // Exactly ONE eligible action is lost, whether the spell struck
      // before this wizard's planned cast or during a prior round.
      if(c.fearRound===state.round){
        c.fearRound=null;consumeStatus(c,"fear_turn");flash(c,"FEARED · SKIPPED","#d4c0eb");
        state.log=[c.name+" is feared and loses this round's action to "+(c.fearSource||"Undead Rampage")+".",...state.log].slice(0,5);c.fearSource=null;continue;
      }
      if(rollJackFear(c)){
        flash(c,"FEAR · TURN SKIPPED","#dfb7f1");
        state.log=[c.name+" loses this turn to Jack the Lantern's Fear.",...state.log].slice(0,5);continue;
      }
      if(isFrozen(c)){state.log=[c.name+" loses their action while frozen.",...state.log].slice(0,5);continue;}
      if(c.flinchRound===state.round){
        c.flinchRound=null;flash(c,"FLINCHED · SKIPPED","#88ddff");
        state.log=[c.name+" flinches and loses this turn to Octo Whip.",...state.log].slice(0,5);continue;
      }
      if(isStunned(c)){
        consumeStatus(c,"stun");c.stunRound=null;
        flash(c,"STUNNED · SKIPPED","#88e8ff");
        state.log=[c.name+" loses their action while stunned.",
          ...state.log].slice(0,5);
        continue;
      }
      if(c.mana<card.cost||isRecharging(c))continue;
      // Cast-attempt curses strike before staff raising or rune tracing.
      // Ineligible/skipped turns above never count as an attempt.
      const attempt={card};
      if(!triggerThornyWrap(c,attempt)){
        if(checkBattleEnd())return;
        continue;
      }
      if(card.target!=="team"&&card.target!=="all_enemies"){
        const t=getUnit(action.targetId),valid=targetsFor(card,c);
        if(!t||t.hp<=0||!valid.some(v=>v.id===t.id)){
          // A locked spell is spent on its original target, never redirected.
          flash(c,"TARGET DEFEATED · FAILED","#ffd5b0");
          state.log=[c.name+"'s "+card.name+" fails: the locked target is defeated or unavailable.",
            ...state.log].slice(0,5);
          continue;
        }
      }
      c.armRaise=0;
      state.animation={action,card,stage:"raising",elapsed:0,duration:ARM_RAISE_MS,
        applied:false,traceMs:0,source:c.id,target:action.targetId,
        automatic:!!action.auto||(state.mode==="story"&&c.team===1),
        runeResult:null,runeScore:null};
      ui.hint.textContent=c.name+" raises their staff toward the center...";
      paintUI();
      return;
    }
    finishRound();
  }
  function flash(unit,text,color="#f8d3a0"){
    if(!unit)return;
    const message={x:unit.x,y:unit.y-108,text,color,age:0};
    state.flashes.push(message);
    if(state.flashes.length>18)state.flashes.shift();
    return message;
  }
  function flashSpellDamage(target,amount,color,spell){
    if(!spell){flash(target,"-"+amount,color);return;}
    // One running number per victim per cast, shared by every direct hit.
    const displays=spell.damageDisplays??=Object.create(null);
    const entry=displays[target.id]??={total:0,message:null};
    entry.total+=amount;
    if(entry.message&&state.flashes.includes(entry.message)){
      Object.assign(entry.message,{x:target.x,y:target.y-108,
        text:"-"+entry.total,color,age:0});
    }else entry.message=flash(target,"-"+entry.total,color);
  }
  function layoutCombatMessages(c,messages){
    // Lay out every card's messages together using their actual text bounds.
    // Damage, debuffs and healing keep separate rows even on the same frame.
    const gap=7,overlaps=(a,b)=>Math.abs(a.x-b.x)<(a.width+b.width)/2+gap&&Math.abs(a.y-b.y)<(a.height+b.height)/2+gap;
    c.save();
    for(let fontSize=31;fontSize>=15;fontSize-=2){
      c.font="800 "+fontSize+"px system-ui,sans-serif";
      const placed=[];
      for(const f of messages){
        const width=c.measureText(f.text).width+12,height=fontSize+12;
        if(width>W-24)break;
        const x=clamp(f.x,width/2+12,W-width/2-12),y=clamp(f.y-f.age*67,height/2+12,H-height/2-12);
        const xs=[x,width/2+12,W-width/2-12],ys=[y,height/2+12,H-height/2-12];
        for(const b of placed){ys.push(b.y-(b.height+height)/2-gap,b.y+(b.height+height)/2+gap);xs.push(b.x-(b.width+width)/2-gap,b.x+(b.width+width)/2+gap);}
        const candidates=[];
        for(const px of xs)for(const py of ys){
          const box={f,x:px,y:py,width,height,fontSize};
          if(px-width/2<12||px+width/2>W-12||py-height/2<12||py+height/2>H-12||placed.some(b=>overlaps(box,b)))continue;
          candidates.push(box);
        }
        candidates.sort((a,b)=>(a.x-x)**2*4+(a.y-y)**2-((b.x-x)**2*4+(b.y-y)**2));
        if(!candidates.length)break;
        placed.push(candidates[0]);
      }
      if(placed.length===messages.length){c.restore();return placed;}
    }
    // Dense bursts still fit visibly in ordered rows; never draw over a label.
    c.font="800 15px system-ui,sans-serif";
    const placed=messages.map((f,i)=>{c.font="800 15px system-ui,sans-serif";const measured=c.measureText(f.text).width;
      const fontSize=Math.min(15,15*(W-36)/Math.max(1,measured));
      return {f,x:W/2,y:26+i*32,width:Math.min(W-24,measured+12),height:27,fontSize};});
    c.restore();return placed;
  }
  const DEBUFFS=new Set(['burn','poison','frostbite','fear','fear_turn','stun','frozen','freezing_temps','thorny_wrap','gunpowder_coat','decaying_strength','soul_drain','turbulence','static_shock','trap']);
  function canReceiveDebuff(u){return !!u&&u.hp>0&&!u.statuses.some(st=>DEBUFFS.has(st.kind))&&u.fearRound!==state.round&&u.flinchRound!==state.round;}
  function addStatus(u,kind,icon,value){
    if(DEBUFFS.has(kind)&&!canReceiveDebuff(u))return false;
    let existing=u.statuses.find(s=>s.kind===kind);
    if(existing){existing.value=value;existing.charges=1;return;}
    if(u.statuses.length>=MAX_SLOTS){const at=u.statuses.findIndex(st=>st.kind!=="lightning_rod"&&!DEBUFFS.has(st.kind));if(at>=0)u.statuses.splice(at,1);}
    u.statuses.push({kind,icon,value,charges:1});
  }
  function consumeStatus(u,kind){
    const at=u.statuses.findIndex(s=>s.kind===kind);
    return at<0?null:u.statuses.splice(at,1)[0];
  }
  function applyLightningRod(u,spell){
    const stored=u.statuses.find(st=>st.kind==="lightning_rod")?.stored||0;
    addStatus(u,"lightning_rod","ϟ",stored);
    const rod=u.statuses.find(st=>st.kind==="lightning_rod");
    Object.assign(rod,{stored,power:spellPower(u,BY_ID.rod,spell),appliedRound:state.round,expiresRound:state.round+5});
    flash(u,"LIGHTNING ROD · 5 TURNS","#c7eaff");
  }
  function recordLightningRodCast(u,card){
    if(!u||u.hp<=0||card.school!=="lightning"||card.id==="rod")return false;
    let charged=false;
    for(const owner of alive(u.team)){
      const rod=owner.statuses.find(st=>st.kind==="lightning_rod");
      if(!rod||state.round<rod.appliedRound||state.round>rod.expiresRound)continue;
      rod.stored=(rod.stored||0)+1;rod.value=rod.stored;charged=true;
      flash(owner,"ROD CHARGE "+rod.stored,"#c7eaff");
    }
    return charged;
  }
  function splitLightningRodDamage(pool,targets){
    if(!targets.length||pool<=0)return[];
    const share=Math.floor(pool/targets.length),extra=pool%targets.length;
    return targets.map((target,i)=>({target,amount:share+(i<extra?1:0)}));
  }
  function expireLightningRods(){
    for(const u of state.units){const rod=u.statuses.find(st=>st.kind==="lightning_rod");if(!rod)continue;
      if(u.hp<=0){consumeStatus(u,"lightning_rod");continue;}
      if(state.round<rod.expiresRound)continue;
      consumeStatus(u,"lightning_rod");const pool=Math.round((rod.stored||0)*100*(rod.power||1)),targets=alive(1-u.team),shares=splitLightningRodDamage(pool,targets);
      flash(u,pool?"ROD DISCHARGE · "+pool:"ROD EXPIRED · NO CHARGE","#c9edff");
      if(shares.length){(state.rodBursts??=[]).push({source:{x:u.x,y:u.y},targets:shares.map(({target,amount})=>({x:target.x,y:target.y,amount})),age:0});}
      // A delayed fixed damage pool: it does not consume next-spell buffs or marks.
      for(const {target,amount} of shares){if(!amount)continue;target.hp=Math.max(0,target.hp-amount);flash(target,"−"+amount+" · ROD","#bde7ff");if(!target.hp){target.defeatElapsedMs=0;flash(target,"DEFEATED","#ffd5b0");}}
      state.log=[u.name+"'s Lightning Rod releases "+pool+" total damage across "+shares.length+" enemies.",...state.log].slice(0,5);
    }
  }
  function attemptUndeadFear(source,target,card,roll=Math.random()){
    if(!["undead","croc"].includes(card?.id)||!source||!target||target.hp<=0||source.team===target.team||roll>=card.fearChance||state.phase!=="resolving")return false;
    if(!(state.sequence||[]).slice(state.queueAt).some(a=>a.casterId===target.id))return false;
    if(!canReceiveDebuff(target))return false;
    addStatus(target,"fear_turn","☠",1);target.statuses.find(st=>st.kind==="fear_turn").round=state.round;
    target.fearRound=state.round;target.fearSource=card.name;
    flash(target,"FEARED · THIS ROUND","#d4c0eb");
    state.log=[target.name+" is feared by "+card.name+" and will miss their pending action this round.",...state.log].slice(0,5);
    return true;
  }
  function attemptOctoFlinch(target,roll=Math.random()){
    if(!target||target.hp<=0||roll>=.15||state.phase!=="resolving")return false;
    if(!state.sequence.slice(state.queueAt).some(a=>a.casterId===target.id))return false;
    if(!canReceiveDebuff(target))return false;
    target.flinchRound=state.round;
    flash(target,"FLINCH","#86e7ff");
    return true;
  }
  function attemptVoltStun(source,target,card,roll=Math.random()){
    if(!["volt","zeus"].includes(card?.id)||!target||target.hp<=0||roll>=card.stunChance)
      return false;
    // If the target is still due to act this round, cancel that cast;
    // otherwise reserve the stun for their next round. Never double-skip.
    const pending=state.phase==="resolving"&&state.sequence
      .slice(state.queueAt).some(a=>a.casterId===target.id);
    if(!canReceiveDebuff(target))return false;
    target.stunRound=pending?state.round:state.round+1;
    addStatus(target,"stun","⚡",1);
    flash(target,"STUNNED","#96f3ff");
    state.log=[source.name+"'s "+card.name+" stuns "+target.name+
      " for one action!",...state.log].slice(0,5);
    return true;
  }
  function blockWithWindDome(source,target,base,spell){
    if(!source||!target||source.team===target.team||target.hp<=0||base<=0)return false;
    if(spell?.windDomeTargets?.[target.id])return true;
    if(!consumeStatus(target,"wind_dome"))return false;
    if(spell){if(!spell.windDomeTargets)spell.windDomeTargets={};spell.windDomeTargets[target.id]=true;}
    (state.windDomeBursts??=[]).push({targetId:target.id,age:0});
    flash(target,"WIND DOME · BLOCKED","#d1fff1");
    state.log=[target.name+"'s Wind Dome blocks "+(spell?.card?.name||"the incoming spell")+" and disperses.",...state.log].slice(0,5);
    return true;
  }
  function spellPower(source,card,spell){
    if(!Builds||!source)return 1;
    if(spell&&spell.damageVariant===undefined)spell.damageVariant=Builds.rollVariant();
    return (spell?.damageVariant||1)*Builds.multiplier(source,card?.school);
  }
  function effectDamage(source,card,base,spell){return Math.round(base*spellPower(source,card,spell));}
  function damage(source,target,base,card,spell=null){
    let raw=base*spellPower(source,card,spell),notes=[];
    // Echo applies to a SUCCESSFUL damaging Water spell only. An Earth
    // spell, a fizzle, or a spell without a living target cannot consume it.
    if(card?.school==="water"){
      const echo=consumeStatus(source,"tidal_echo");
      if(echo){raw*=1+echo.value;notes.push("TIDAL ECHO +30%");}
    }
    let rage=spell?.rageBonus;
    if(rage===undefined){rage=consumeStatus(source,"blazing_rage")?.value||0;if(spell)spell.rageBonus=rage;}
    if(rage){raw*=1+rage;notes.push("BLAZING RAGE +20%");}
    const blade=consumeStatus(source,"blade");
    if(blade){raw*=1+blade.value;notes.push("BLADE");}
    const aura=state.auras[source.team];
    if(aura&&aura.turns>0){raw*=1+aura.value;notes.push("AURA");}
    if(blockWithWindDome(source,target,base,spell))return 0;
    // Decaying Strength belongs to the next successful SPELL, including every hit.
    let decay=spell?.decayBonusTargets?.[target.id];
    if(decay===undefined){
      const mark=consumeStatus(target,"decaying_strength");
      decay=mark?.value||0;
      if(spell){if(!spell.decayBonusTargets)spell.decayBonusTargets={};spell.decayBonusTargets[target.id]=decay;}
    }
    if(decay){raw*=1+decay;notes.push("DECAYING STRENGTH +20%");}
    const trap=consumeStatus(target,"trap");
    if(trap){raw*=1+trap.value;notes.push("TRAP");}
    let solidity=spell?.solidityTargets?.[target.id];
    if(solidity===undefined){const ward=consumeStatus(target,"solidity");solidity=ward?.value||0;
      if(spell){if(!spell.solidityTargets)spell.solidityTargets={};spell.solidityTargets[target.id]=solidity;}}
    if(solidity){raw*=1-solidity;notes.push("SOLIDITY -25%");}
    const shield=consumeStatus(target,"shield");
    if(shield){raw*=1-shield.value;notes.push("BLOCK");}
    const amount=Math.max(1,Math.round(raw));
    const oldHp=target.hp,wasAlive=target.hp>0;
    target.hp=Math.max(0,target.hp-amount);
    if(wasAlive&&target.hp===0){
      // Start the one-shot defeat animation at the exact lethal hit.
      // This remains independent of the attacker's ongoing summon/trace.
      target.defeatElapsedMs=0;
    }
    flashSpellDamage(target,amount,notes.includes("BLOCK")?"#8df2f5":"#f8c49c",spell);
    state.log=[source.name+" → "+target.name+": "+amount+" damage"+
      (notes.length?" ["+notes.join(", ")+"]":""),...state.log].slice(0,5);
    if(target.hp<=0){flash(target,"DEFEATED","#ffd5b0");}
    attemptMarkedFreeze(target,card,spell);
    const directDamage=oldHp-target.hp;
    triggerGunpowderCoat(source,target,card,spell);
    return directDamage;
  }
  function applyVampDamage(a){
    if(a.vampDamageResolved)return;
    a.vampDamageResolved=true;
    const c=getUnit(a.source),t=getUnit(a.target);
    a.vampDrained=c&&c.hp>0&&t&&t.hp>0&&t.team!==c.team?
      damage(c,t,a.card.damage,a.card,a):0;
    a.vampPotentialHeal=a.vampDrained>0?Math.round(a.card.damage*(a.card.leech||.5)*Builds.multiplier(c,a.card.school)):0;
    state.log=["Vampire siphons "+a.vampDrained+" actual HP.",
      ...state.log].slice(0,5);
  }
  function applyVampHeal(a){
    if(a.vampHealingResolved)return;
    a.vampHealingResolved=true;
    const c=getUnit(a.source);
    const n=c&&c.hp>0?Math.min(Math.max(0,c.maxHp-c.hp),
      Math.max(0,a.vampPotentialHeal||0)):0;
    if(c&&c.hp>0){
      c.hp+=n;flash(c,n?"+"+n+" HP":"FULL HP","#ffb6c4");
      state.log=[c.name+" receives "+n+" HP from the vampire's orb.",
        ...state.log].slice(0,5);
    }
    a.applied=true;
  }


  function applyWindFistHit(a,index){
    if(state.phase==="ending"||state.phase==="finished"||a.runeResult==="failed")return false;
    if(!Number.isInteger(index)||index<0||index>=10)return false;
    a.windFistHits??=[];if(a.windFistHits[index])return false;a.windFistHits[index]=true;
    const source=getUnit(a.source||a.action.casterId),target=getUnit(a.target||a.action.targetId);
    if(!source||source.hp<=0||!target||target.hp<=0||source.team===target.team)return false;
    damage(source,target,a.card.hitDamage,a.card,a);return true;
  }
  function applyGunpowderCoat(target,card,source,spell){
    if(!canReceiveDebuff(target))return false;
    const last=target.statuses.find(st=>st.kind==="gunpowder_coat")?.lastTriggerRound??null;
    addStatus(target,"gunpowder_coat","✺",effectDamage(source,card,card.coatDamage,spell));
    Object.assign(target.statuses.find(st=>st.kind==="gunpowder_coat"),{expiresRound:state.round+card.coatTurns,lastTriggerRound:last,triggers:0});
    flash(target,"GUNPOWDER COAT · 3 TURNS","#c8b69a");
    state.log=[target.name+" is coated in gunpowder for 3 turns: Fire hits can ignite it once each turn.",...state.log].slice(0,5);
  }
  function triggerGunpowderCoat(source,target,card,spell){
    const coat=target?.statuses.find(st=>st.kind==="gunpowder_coat");
    if(!coat||card?.school!=="fire"||card.id==="gunpowderkiss"||spell?.runeResult==="failed"||state.round>=coat.expiresRound||coat.lastTriggerRound===state.round||(coat.triggers||0)>=3)return 0;
    coat.lastTriggerRound=state.round;coat.triggers=(coat.triggers||0)+1;
    const wasAlive=target.hp>0,amount=Math.min(target.hp,coat.value||150);
    target.hp=Math.max(0,target.hp-(coat.value||150));
    (state.gunpowderBursts??=[]).push({targetId:target.id,x:target.x,y:target.y,age:0});
    flash(target,"GUNPOWDER −"+(coat.value||150),"#ffd38b");
    state.log=[target.name+"'s Gunpowder Coat sparks and explodes for "+amount+" damage; the coat remains.",...state.log].slice(0,5);
    if(wasAlive&&!target.hp){target.defeatElapsedMs=0;flash(target,"DEFEATED","#ffdb9c");}
    return amount;
  }
  function expireGunpowderCoats(){
    for(const u of state.units){
      const coat=u.statuses.find(st=>st.kind==="gunpowder_coat");
      if(coat&&(u.hp<=0||state.round>=coat.expiresRound))consumeStatus(u,"gunpowder_coat");
    }
  }

  function applyZeusImpact(a,roll){
    if(!a||a.zeusImpactResolved||a.runeResult!=="success")return false;
    a.zeusImpactResolved=true;a.applied=true;
    const caster=getUnit(a.source),target=getUnit(a.target);
    if(!caster||caster.hp<=0||!target||target.hp<=0||target.team===caster.team)return false;
    // Snapshot formation neighbors before the primary strike can defeat its target.
    a.zeusChainTargets=dragonSplashTargets(target,caster).map((u,i)=>({id:u.id,x:u.x,y:u.y,hit:false,hitAt:.645+i*.02}));
    damage(caster,target,a.card.damage,a.card,a);
    if(target.hp>0&&!a.windDomeTargets?.[target.id])attemptVoltStun(caster,target,a.card,roll??a.stunRolls?.[target.id]??Math.random());
    paintUI();return true;
  }
  function applyZeusChain(a,entry,roll){
    if(!a||!entry||entry.hit||!a.zeusImpactResolved||a.runeResult!=="success")return false;
    entry.hit=true;
    const caster=getUnit(a.source),target=getUnit(entry.id);
    if(!caster||caster.hp<=0||!target||target.hp<=0||target.team===caster.team)return false;
    damage(caster,target,a.card.chainDamage,a.card,a);
    if(target.hp>0&&!a.windDomeTargets?.[target.id])attemptVoltStun(caster,target,a.card,roll??a.stunRolls?.[target.id]??Math.random());
    paintUI();return true;
  }

  function dragonSplashTargets(main,caster){
    if(!main||!caster||main.team===caster.team)return [];
    // "Left and right" means immediate formation neighbors: index ±1,
    // never the next available living combatant beyond an empty slot.
    return sideUnits(main.team).filter(u=>
      u.hp>0&&Math.abs(u.index-main.index)===1);
  }

  // Kunai arrival times are shared by combat and animation.
  const NINJA_HIT_TIMES=[.62,.64,.66];
  function applyPenguinHit(a,index,roll){
    if(!a||a.runeResult!=="success"||!Number.isInteger(index)||index<0||index>2)return false;
    const hits=a.penguinHits??=[];
    if(hits.includes(index))return false;
    hits.push(index);
    const caster=getUnit(a.source),target=getUnit(a.target);
    if(!caster||caster.hp<=0||!target||target.hp<=0||target.team===caster.team)return false;
    damage(caster,target,a.card.damage,a.card,a);
    if(canReceiveDebuff(target)&&target.hp>0&&!a.windDomeTargets?.[target.id]&&!target.statuses.some(s=>s.kind==="frostbite")&&(roll??Math.random())<a.card.frostChance){
      addStatus(target,"frostbite","❄",effectDamage(getUnit(a.source),a.card,a.card.frostDamage,a));
      Object.assign(target.statuses.find(s=>s.kind==="frostbite"),{remaining:a.card.frostTurns,appliedRound:state.round,lastTickRound:state.round});
      flash(target,"FROSTBITE · 3 TURNS","#b6eeff");
    }
    paintUI();return true;
  }
  function penguinDepth(opts,layer){return window.WIZARDRY_PENGUINS_V103.depthFor(opts,layer);}
  function drawPenguins(c,opts){window.WIZARDRY_PENGUINS_V103.draw(c,opts);}
  function drawPenguinPortrait(c,w,h){window.WIZARDRY_PENGUINS_V103.portrait(c,w,h);}




  function sandGripShake(p){return window.WIZARDRY_KINETIC_SAND_V112?.shake(p)||{x:0,y:0};}
  function drawKineticSand(c,p,target,time,layer){window.WIZARDRY_KINETIC_SAND_V112?.draw(c,{progress:p,target,layer});}
  function thornAccuracyPenalty(u){
    const vine=u?.statuses.find(st=>st.kind==="thorny_wrap");
    return vine&&u.hp>0&&state.round<vine.expiresRound?.15:0;
  }
  function triggerThornyWrap(u,a){
    if(!thornAccuracyPenalty(u)||a.thornTriggered)return u.hp>0;
    const vine=u.statuses.find(st=>st.kind==="thorny_wrap");
    a.thornTriggered=true;
    const amount=vine.attemptDamage||150;
    u.hp=Math.max(0,u.hp-amount);
    flash(u,"THORNS −"+amount,"#b1e781");
    state.log=[u.name+" attempts "+a.card.name+"; Thorny Wrap tightens for "+amount+" damage.",...state.log].slice(0,5);
    if(!u.hp){u.defeatElapsedMs=0;flash(u,"DEFEATED","#ffdb9c");}
    return u.hp>0;
  }
  function drawThornyVine(c,u,progress,time,layer){
    if(progress<=0)return;
    const scale=lerp(.60,.90,clamp((u.y-288)/235,0,1)),height=150*scale;
    const total=100,grown=Math.floor(total*progress),turns=3.2;
    c.save();c.lineJoin="bevel";c.lineCap="round";
    if(layer==="back"){
      c.fillStyle="#293e25";c.beginPath();c.ellipse(u.x,u.y+2,29*scale*progress,9*scale*progress,0,0,Math.PI*2);c.fill();
      for(let n=0;n<7;n++){
        const angle=n*2.4,r=(12+n%3*8)*scale;
        c.fillStyle=n%2?"#6b7850":"#424f36";c.beginPath();
        const x=u.x+Math.cos(angle)*r,y=u.y+Math.sin(angle)*r*.3;
        c.moveTo(x-5,y+2);c.lineTo(x,y-5*progress);c.lineTo(x+7,y+3);c.closePath();c.fill();
      }
    }
    for(let j=0;j<grown;j++){
      const t=j/total,next=(j+1)/total,angle=t*Math.PI*2*turns-.8,angle2=next*Math.PI*2*turns-.8;
      if((Math.sin(angle)>0)!==(layer==="front"))continue;
      const radius=(30+4*Math.sin(t*8+time*.001))*scale;
      const x=u.x+Math.cos(angle)*radius,y=u.y-t*height+Math.sin(angle)*8*scale;
      const xx=u.x+Math.cos(angle2)*radius,yy=u.y-next*height+Math.sin(angle2)*8*scale;
      c.strokeStyle="#29491c";c.lineWidth=10*scale;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();
      c.strokeStyle=j%4<2?"#669b37":"#81b64b";c.lineWidth=6*scale;c.beginPath();c.moveTo(x-1,y-1);c.lineTo(xx-1,yy-1);c.stroke();
      if(j%5===0){
        const side=j%10?1:-1;
        c.fillStyle="#c7d893";c.beginPath();c.moveTo(x-3*scale,y);c.lineTo(x+side*12*scale,y-10*scale);c.lineTo(x+4*scale,y+3*scale);c.closePath();c.fill();
        c.fillStyle="#577b2e";c.beginPath();c.moveTo(x,y);c.lineTo(x+side*12*scale,y-10*scale);c.lineTo(x+side*4*scale,y-2*scale);c.closePath();c.fill();
      }
      if(j%19===0){const side=Math.cos(angle)>0?1:-1;c.fillStyle="#7eae43";c.beginPath();c.moveTo(x,y);c.lineTo(x+side*19*scale,y-14*scale);c.lineTo(x+side*13*scale,y+2*scale);c.closePath();c.fill();}
    }
    c.restore();
  }

  function blizzardHitAt(i,count){return .44+i*.18/Math.max(1,count-1);}
  function applyBlizzardHit(a,entry,roll){
    if(!a||!entry||entry.hit||a.runeResult!=="success")return false;
    entry.hit=true;
    const caster=getUnit(a.source),target=getUnit(entry.id);
    if(!caster||caster.hp<=0||!target||target.hp<=0||target.team===caster.team)return false;
    damage(caster,target,a.card.damage,a.card,a);
    if(canReceiveDebuff(target)&&target.hp>0&&!a.windDomeTargets?.[target.id]&&(roll??Math.random())<a.card.frostChance){
      addStatus(target,"frostbite","❄",effectDamage(getUnit(a.source),a.card,a.card.frostDamage,a));
      Object.assign(target.statuses.find(st=>st.kind==="frostbite"),{remaining:a.card.frostTurns,appliedRound:state.round,lastTickRound:state.round});
      flash(target,"FROSTBITE · 5 TURNS","#b6eeff");
      state.log=[target.name+" suffers Blizzard Frostbite: 100 HP per turn for 5 turns.",...state.log].slice(0,5);
    }
    paintUI();return true;
  }
  // World-space gusts mirror with the caster and sort at each victim's depth.
  function drawBlizzardWind(c,p,caster,target,index){
    const local=clamp((p-.09-index*.045)/.86,0,1);
    if(local<=0||local>=1)return;
    const dir=target.x>=caster.x?1:-1,fade=Math.min(1,local*9,(1-local)*6);
    const origin=caster.x+dir*25,span=Math.abs(target.x-origin)+200;
    const front=clamp(local*3.5,0,1),back=clamp((local-.62)*2.8,0,1);
    const base=target.y-75;
    const edgeFade=f=>clamp((f-back)/.13,0,1)*clamp((front-f)/.13,0,1);
    c.save();c.lineJoin="bevel";
    // Continuous flowing volumes, tessellated into lit low-poly facets.
    // The front sweeps through the victim, followed by a sustained snow body.
    for(let band=0;band<6;band++){
      const center=base+(band-2.5)*29,phase=local*12-band*.73+index*.4;
      // Independent pointed wisps avoid a shared vertical boundary.
      const bandBack=back-.055-.065*rand(band+index*19+7);
      const bandFront=front+.035+.09*rand(band+index*31+67);
      const points=[];
      for(let j=0;j<=18;j++){
        const t=j/18,u=bandBack+(bandFront-bandBack)*t,x=origin+dir*span*u;
        const wave=Math.sin(u*8-phase)*23+Math.sin(u*15-phase*.7)*9;
        const taper=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.7);
        const thickness=(23+12*Math.sin(u*5+phase*.45+band))*taper;
        points.push({x,y:center+wave,w:thickness});
      }
      for(let j=0;j<18;j++){
        const a=points[j],b=points[j+1],midA=a.y-a.w*.18,midB=b.y-b.w*.18;
        const feather=Math.min(1,(j+.5)/3,(18-j-.5)/3);
        c.globalAlpha=fade*feather*(band%2?.56:.68);
        c.fillStyle=["#72b6d1","#a7deeb","#d1f0f5"][(j+band)%3];
        c.beginPath();c.moveTo(a.x,a.y-a.w);c.lineTo(b.x,b.y-b.w);c.lineTo(b.x,midB);c.lineTo(a.x,midA);c.closePath();c.fill();
        c.fillStyle=["#3f82aa","#679fbd","#8ac9dd"][(j+band)%3];
        c.beginPath();c.moveTo(a.x,midA);c.lineTo(b.x,midB);c.lineTo(b.x,b.y+b.w);c.lineTo(a.x,a.y+a.w);c.closePath();c.fill();
        if((j+band)%3===0){
          c.globalAlpha=fade*feather*.48;c.fillStyle="#eafcff";
          c.beginPath();c.moveTo(a.x,a.y-a.w);c.lineTo(b.x,b.y-b.w);c.lineTo(b.x,midB);c.closePath();c.fill();
        }
      }
    }
    // Billowing angular snow pockets break up the ribbons into a thick squall.
    for(let n=0;n<22;n++){
      const f=(rand(n+index*37)+local*1.5)%1;if(f>front||f<back)continue;
      const x=origin+dir*span*f,y=base+(rand(n+133)-.5)*180+Math.sin(f*9-local*12)*24;
      const r=16+rand(n+27)*23;c.globalAlpha=fade*edgeFade(f)*.22;c.fillStyle=n%2?"#c9edf4":"#edfaff";
      c.beginPath();
      for(let k=0;k<7;k++){const angle=k*Math.PI*2/7,px=x+Math.cos(angle)*r*1.9,py=y+Math.sin(angle)*r;if(k)c.lineTo(px,py);else c.moveTo(px,py);}
      c.closePath();c.fill();
    }
    // Fast snow blades have long tapered wakes and faceted crystalline tips.
    for(let n=0;n<112;n++){
      const seed=rand(n+index*131),f=(seed+local*(2.8+rand(n+73)*1.5))%1;
      if(f>front||f<back)continue;
      const x=origin+dir*span*f,y=base+(rand(n+311)-.5)*224+Math.sin(f*9-local*12)*22;
      const size=1.5+rand(n+52)*4,length=14+rand(n+89)*46;
      c.globalAlpha=fade*edgeFade(f)*(.3+seed*.6);c.fillStyle="#caeef8";
      c.beginPath();c.moveTo(x-dir*length,y+size);c.lineTo(x+dir*size*3,y-size*.35);c.lineTo(x-dir*size,y-size);c.closePath();c.fill();
      c.fillStyle=n%4?"#f2fdff":"#8dd5ee";
      c.beginPath();c.moveTo(x+dir*size*3,y);c.lineTo(x,y-size*1.6);c.lineTo(x-dir*size*2,y);c.lineTo(x,y+size);c.closePath();c.fill();
    }
    const impact=clamp(1-Math.abs(p-blizzardHitAt(index,4))/.15,0,1);
    if(impact>0)for(let n=0;n<15;n++){
      const seed=rand(n+index*43),x=target.x+dir*(seed*130-30),y=base+(rand(n+77)-.5)*175;
      c.globalAlpha=impact*.7;c.fillStyle=n%2?"#f0fdff":"#9cdeef";
      c.beginPath();c.moveTo(x-dir*35,y+8);c.lineTo(x+dir*42,y-3);c.lineTo(x,y-11);c.closePath();c.fill();
    }
    c.restore();
  }

  function applyFrostyImpact(a,roll){
    if(!a||a.applied||a.runeResult!=="success")return false;
    a.applied=true;const c=getUnit(a.source),target=getUnit(a.target);
    if(!c||c.hp<=0||!target||target.hp<=0||target.team===c.team)return false;
    damage(c,target,a.card.damage,a.card,a);
    if(canReceiveDebuff(target)&&target.hp>0&&!a.windDomeTargets?.[target.id]&&(roll??Math.random())<a.card.frostChance){
      addStatus(target,"frostbite","❄",effectDamage(getUnit(a.source),a.card,a.card.frostDamage,a));
      const frost=target.statuses.find(st=>st.kind==="frostbite");frost.remaining=a.card.frostTurns;frost.appliedRound=state.round;frost.lastTickRound=state.round;
      flash(target,"FROSTBITE (3 TURNS)","#b6eeff");
    }
    paintUI();return true;
  }
  function applyBenderStrike(a){
    if(!a||a.applied||a.runeResult!=="success")return false;
    a.applied=true;const c=getUnit(a.source),target=getUnit(a.target);
    if(!c||c.hp<=0||!target||target.hp<=0||target.team===c.team)return false;
    damage(c,target,a.card.damage,a.card,a);paintUI();return true;
  }
  function applyReaperStrike(a){
    if(!a||a.applied||a.runeResult!=="success")return false;
    a.applied=true;const caster=getUnit(a.source),target=getUnit(a.target);
    if(!caster||caster.hp<=0||!target||target.hp<=0||target.team===caster.team)return false;
    damage(caster,target,a.card.damage,a.card,a);
    if(canReceiveDebuff(target)&&target.hp>0&&!a.windDomeTargets?.[target.id]){addStatus(target,"decaying_strength","☠",.20);flash(target,"DECAYING STRENGTH","#c89bd8");}
    paintUI();return true;
  }
  function applyRoninHit(a,index){
    if(!a||a.runeResult!=="success"||index<0||index>2)return false;
    if(!a.slashHits)a.slashHits=[];if(a.slashHits.includes(index))return false;
    a.slashHits.push(index);
    const c=getUnit(a.source),target=getUnit(a.target);
    if(!c||c.hp<=0||!target||target.hp<=0||target.team===c.team)return false;
    damage(c,target,a.card.damage,a.card,a);paintUI();return true;
  }
  function applyRainHit(a,entry,roll){
    if(!a||!entry||entry.hit||a.runeResult!=="success")return false;
    entry.hit=true;
    const caster=getUnit(a.source),target=getUnit(entry.id);
    if(!caster||caster.hp<=0||!target||target.hp<=0||target.team===caster.team)return false;
    damage(caster,target,a.card.damage,a.card,a);
    // One independent burn roll per enemy hit, not per cosmetic arrow.
    if(canReceiveDebuff(target)&&target.hp>0&&!a.windDomeTargets?.[target.id]&&(roll??Math.random())<a.card.burnChance){
      addStatus(target,"burn","🔥",effectDamage(getUnit(a.source),a.card,a.card.burnDamage,a));
      const burn=target.statuses.find(st=>st.kind==="burn");
      burn.remaining=a.card.burnTurns;burn.appliedRound=state.round;burn.lastTickRound=state.round;
      flash(target,"BURNED (3 TURNS)","#ffb178");
    }
    paintUI();return true;
  }
  function applyDragonImpact(a,roll=Math.random()){
    if(!a||a.dragonImpactResolved||a.runeResult!=="success")return false;
    a.dragonImpactResolved=true;a.applied=true;
    const c=getUnit(a.source),target=getUnit(a.target);
    if(!c||c.hp<=0||!target||target.hp<=0||c.team===target.team)return false;
    // Lock the adjacent victims BEFORE primary damage (which may KO).
    const neighbors=dragonSplashTargets(target,c);
    a.dragonSplashIds=neighbors.map(u=>u.id);
    a.dragonSplashHitIds=[];
    // Only the main target is damaged here. Secondary hits wait until
    // their separate fireballs actually arrive at adjacent opponents.
    damage(c,target,a.card.damage,a.card,a);
    // Only primary target can burn; fireball must have hit successfully.
    // Burns refresh to three future round ticks and never stack.
    if(canReceiveDebuff(target)&&target.hp>0&&!a.windDomeTargets?.[target.id]&&a.runeResult==="success"&&roll<a.card.burnChance){
      addStatus(target,"burn","🔥",effectDamage(getUnit(a.source),a.card,a.card.burnDamage,a));
      const burn=target.statuses.find(st=>st.kind==="burn");
      burn.remaining=a.card.burnTurns;
      burn.appliedRound=state.round;
      burn.lastTickRound=state.round;
      flash(target,"BURNED (3 TURNS)","#ffb178");
      state.log=[target.name+" is burned: 50 damage at the start of the next 3 rounds.",
        ...state.log].slice(0,5);
      a.dragonBurned=true;
    }
    paintUI();return true;
  }
  function applyDragonSplashHit(a,id){
    if(!a||a.runeResult!=="success"||!a.dragonImpactResolved)return false;
    if(!(a.dragonSplashIds||[]).includes(id))return false;
    if(!a.dragonSplashHitIds)a.dragonSplashHitIds=[];
    if(a.dragonSplashHitIds.includes(id))return false;
    a.dragonSplashHitIds.push(id);
    const caster=getUnit(a.source),neighbor=getUnit(id);
    if(caster&&caster.hp>0&&neighbor&&neighbor.hp>0&&
       neighbor.team!==caster.team)
      damage(caster,neighbor,a.card.splash,a.card,a);
    return true;
  }
  function tickBurnsForRound(){
    expireGunpowderCoats();
    for(const u of state.units)expireJackFear(u);
    for(const u of state.units){isFrozen(u);const vine=u.statuses.find(st=>st.kind==="thorny_wrap");if(vine&&(u.hp<=0||state.round>=vine.expiresRound))consumeStatus(u,"thorny_wrap");}
    for(const u of state.units){const shock=u.statuses.find(st=>st.kind==="static_shock");
      if(shock&&(u.hp<=0||state.round>=shock.expiresRound))consumeStatus(u,"static_shock");}
    for(const u of state.units)for(const kind of ["calming_waters","healing_aura"]){const effect=u.statuses.find(st=>st.kind===kind);if(!effect)continue;
      if(u.hp<=0){consumeStatus(u,kind);continue;}
      if(effect.lastTickRound===state.round||effect.appliedRound>=state.round)continue;
      effect.lastTickRound=state.round;const amount=Math.min(effect.value,Math.max(0,u.maxHp-u.hp));u.hp+=amount;effect.remaining--;
      flash(u,"+"+amount+" HP","#a8f1ee");state.log=[u.name+" restores "+amount+" HP from "+(kind==="healing_aura"?"Healing Aura":"Calming Waters")+" ("+effect.remaining+" turns remaining).",...state.log].slice(0,5);
      if(!effect.remaining)consumeStatus(u,kind);
    }
    for(const u of state.units){const effect=u.statuses.find(st=>st.kind==="soul_drain");if(!effect)continue;
      if(u.hp<=0){consumeStatus(u,"soul_drain");continue;}
      if(effect.lastTickRound===state.round||effect.appliedRound>=state.round)continue;
      effect.lastTickRound=state.round;const drained=Math.min(u.hp,effect.value);u.hp-=drained;effect.remaining--;
      const caster=getUnit(effect.sourceId),healed=caster&&caster.hp>0?Math.min(effect.healValue||drained,Math.max(0,caster.maxHp-caster.hp)):0;
      if(healed){caster.hp+=healed;flash(caster,"+"+healed+" HP","#ddafe8");}
      flash(u,"SOUL DRAIN −"+drained,"#d79ce7");state.log=[u.name+" loses "+drained+" HP to Soul Drain"+(healed?"; "+caster.name+" restores "+healed+" HP":"")+" ("+effect.remaining+" turns remaining).",...state.log].slice(0,5);
      if(!u.hp){u.defeatElapsedMs=0;flash(u,"DEFEATED","#ffdb9c");}
      if(!effect.remaining||!u.hp)consumeStatus(u,"soul_drain");
      if(checkBattleEnd())return;
    }
    // Burn and Frostbite tick independently; neither consumes spell-only marks or shields.
    for(const u of state.units)for(const kind of ["burn","frostbite","poison"]){
      const effect=u.statuses.find(st=>st.kind===kind);if(!effect)continue;
      if(u.hp<=0){consumeStatus(u,kind);continue;}
      if(effect.lastTickRound===state.round||effect.appliedRound>=state.round)continue;
      effect.lastTickRound=state.round;const amount=Math.min(u.hp,effect.value||50);u.hp-=amount;effect.remaining=Math.max(0,(effect.remaining||1)-1);
      flash(u,(kind==="burn"?"🔥 -":kind==="poison"?"POISON −":"❄ -")+amount,kind==="burn"?"#ffa56a":kind==="poison"?"#b9e878":"#b6eeff");
      state.log=[u.name+" takes "+amount+" "+kind+" damage ("+effect.remaining+" ticks remaining).",...state.log].slice(0,5);
      if(u.hp===0){u.defeatElapsedMs=0;flash(u,"DEFEATED","#ffdb9c");}
      if(!effect.remaining||u.hp===0)consumeStatus(u,kind);
      if(checkBattleEnd())return;
    }
  }
  function applySpell(anim){
    if(anim.applied||state.phase==="ending"||state.phase==="finished")return;
    anim.applied=true;
    const {action,card}=anim,c=getUnit(action.casterId),t=getUnit(action.targetId);
    if(!c||c.hp<=0)return;
    if(card.kind==="croc"){
      if(anim.runeResult==="success"&&t&&t.hp>0&&t.team!==c.team){
        damage(c,t,card.damage,card,anim);
        if(t.hp>0&&!anim.windDomeTargets?.[t.id])attemptUndeadFear(c,t,card,anim.fearRoll??Math.random());
      }
    }else if(card.kind==="jack"){
      if(anim.runeResult==="success"&&t&&t.hp>0&&t.team!==c.team){
        damage(c,t,card.damage,card,anim);
        if(t.hp>0&&!anim.windDomeTargets?.[t.id])applyJackFear(t,card);
      }
    }else if(card.kind==="windfist"){
      for(let i=0;i<10;i++)applyWindFistHit(anim,i);
    }else if(card.kind==="flowstate"){
      addStatus(c,"flow_state","≈",1);
      Object.assign(c.statuses.find(st=>st.kind==="flow_state"),{remaining:3,appliedRound:state.round,lastTickRound:state.round});
      flash(c,"FLOW STATE · 3 TURNS","#a7f5ff");
      state.log=[c.name+" gains +1 extra mana for the next 3 turns.",...state.log].slice(0,5);
    }else if(card.kind==="gunpowder"){
      if(canReceiveDebuff(t)&&t&&t.hp>0&&t.team!==c.team)applyGunpowderCoat(t,card,c,anim);
    }else if(card.kind==="zeus"){
      applyZeusImpact(anim);
      for(const entry of anim.zeusChainTargets||[])applyZeusChain(anim,entry);
    }else if(card.kind==="thornwrap"){
      if(canReceiveDebuff(t)&&t&&t.hp>0&&t.team!==c.team){
        addStatus(t,"thorny_wrap","❧",.15);
        Object.assign(t.statuses.find(st=>st.kind==="thorny_wrap"),{expiresRound:state.round+3,appliedRound:state.round,attemptDamage:effectDamage(c,card,150,anim)});
        flash(t,"THORNY WRAP · 3 TURNS","#b5e989");
        state.log=[t.name+" is wrapped: 150 damage per spell attempt and −15 accuracy points for 3 turns.",...state.log].slice(0,5);
      }
    }else if(card.kind==="blizzard"){
      for(const entry of anim.blizzardTargets||[])applyBlizzardHit(anim,entry);
    }else if(card.kind==="penguins"){
      for(let i=0;i<3;i++)applyPenguinHit(anim,i);
    }else if(card.kind==="winddome"){
      addStatus(c,"wind_dome","≋",1);flash(c,"WIND DOME READY","#d1fff1");
      state.log=[c.name+" is protected from the next damaging spell by Wind Dome.",...state.log].slice(0,5);
    }else if(card.kind==="lightningrod"){
      applyLightningRod(c,anim);
    }else if(card.kind==="spores"){
      for(const enemy of alive(1-c.team)){
        damage(c,enemy,card.damage,card,anim);
        if(canReceiveDebuff(enemy)&&enemy.hp>0&&!anim.windDomeTargets?.[enemy.id]&&(anim.poisonRolls?.[enemy.id]??Math.random())<card.poisonChance){
          addStatus(enemy,"poison","☠",effectDamage(c,card,card.poisonDamage,anim));
          const poison=enemy.statuses.find(st=>st.kind==="poison");
          poison.remaining=card.poisonTurns;poison.appliedRound=state.round;poison.lastTickRound=state.round;
          flash(enemy,"POISONED · 5 TURNS","#c3e985");
        }
      }
    }else if(card.kind==="aoe"&&card.target==="all_enemies"){
      // The wind-volley stage normally applies hits individually at the
      // precise arrival of each stone. This only resolves remaining hits,
      // never replaying damage on an already impacted enemy.
      const targets=anim.windImpactTargets||alive(1-c.team).map(u=>({
        id:u.id,x:u.x,y:u.y,hit:false
      }));
      for(const entry of targets){
        if(entry.hit)continue;
        entry.hit=true;
        const enemy=getUnit(entry.id);
        if(enemy&&enemy.hp>0&&enemy.team!==c.team)
          damage(c,enemy,card.damage,card,anim);
      }
      if(anim.runeResult==="success"){
        addStatus(c,"tailwind","≋",.10);
        flash(c,"TAILWIND +10% ACC","#b5f2dd");
        state.log=[c.name+" gains Tailwind: +10 accuracy points on the next spell (any element).",
          ...state.log].slice(0,5);
      }
    }else if(card.kind==="octo"){
      if(t&&t.hp>0&&t.team!==c.team){damage(c,t,card.damage,card,anim);if(!anim.windDomeTargets?.[t.id])attemptOctoFlinch(t,anim.flinchRoll??Math.random());}
    }else if(card.kind==="scorpion"){
      if(t&&t.hp>0&&t.team!==c.team){damage(c,t,card.damage,card,anim);
        if(canReceiveDebuff(t)&&t.hp>0&&!anim.windDomeTargets?.[t.id]&&(anim.poisonRoll??Math.random())<card.poisonChance){addStatus(t,"poison","☠",effectDamage(c,card,card.poisonDamage,anim));const poison=t.statuses.find(st=>st.kind==="poison");poison.remaining=card.poisonTurns;poison.appliedRound=state.round;poison.lastTickRound=state.round;flash(t,"POISONED","#b9e878");}}
    }else if(card.kind==="damage"||card.kind==="summon"){
      if(t&&t.hp>0){
        damage(c,t,card.damage,card,anim);
        if(anim.runeResult==="success"&&card.id==="undead"&&!anim.windDomeTargets?.[t.id])
          attemptUndeadFear(c,t,card,anim.fearRoll??Math.random());
        // The independent 20% stun roll happens ONLY after a successful
        // lightning rune and beam impact against a surviving target.
        if(anim.runeResult==="success"&&card.id==="volt"&&t.hp>0&&!anim.windDomeTargets?.[t.id])
          attemptVoltStun(c,t,card);
      }
    } else if(card.kind==="heal"&&t&&t.hp>0&&t.team===c.team){
      // The heal cannot damage an enemy, resurrect a KO, or exceed max HP.
      const n=Math.min(Builds.healing(card,c),Math.max(0,t.maxHp-t.hp));
      t.hp+=n;flash(t,n>0?"+"+n+" HP":"FULL HP","#bff4a1");
      state.log=[c.name+"'s Lady Estel blesses "+t.name+" for "+n+" HP",
        ...state.log].slice(0,5);
    } else if(card.kind==="freezing"&&canReceiveDebuff(t)&&t&&t.hp>0&&t.team!==c.team){
      addStatus(t,"freezing_temps","❄",.5);flash(t,"FREEZING TEMPS","#b8f3ff");state.log=[t.name+" is marked: the next Ice spell has a 50% freeze chance.",...state.log].slice(0,5);
    } else if(card.kind==="teamregen"){
      for(const ally of alive(c.team)){addStatus(ally,"healing_aura","❀",Math.round(card.healPerTurn*Builds.multiplier(c,card.school)));const effect=ally.statuses.find(st=>st.kind==="healing_aura");effect.remaining=card.healTurns;effect.appliedRound=state.round;effect.lastTickRound=state.round;flash(ally,"HEALING AURA","#c9f4ab");}
      state.log=[c.name+" blesses the entire team: 200 HP per turn for 3 turns each.",...state.log].slice(0,5);
    } else if(card.kind==="souldrain"&&canReceiveDebuff(t)&&t&&t.hp>0&&t.team!==c.team){
      addStatus(t,"soul_drain","☠",effectDamage(c,card,card.damage,anim));const curse=t.statuses.find(st=>st.kind==="soul_drain");
      curse.healValue=Math.round(card.damage*Builds.multiplier(c,card.school));curse.sourceId=c.id;curse.remaining=card.drainTurns;curse.appliedRound=state.round;curse.lastTickRound=state.round;
      flash(t,"SOUL DRAIN","#d79ce7");state.log=[c.name+" curses "+t.name+" with Soul Drain: 100 HP per turn for 3 turns.",...state.log].slice(0,5);
    } else if(card.kind==="turbulence"&&canReceiveDebuff(t)&&t&&t.hp>0&&t.team!==c.team){
      addStatus(t,"turbulence","≋",.5);flash(t,"TURBULENCE","#b8efdc");state.log=[t.name+" loses 50 accuracy points on their next spell.",...state.log].slice(0,5);
    } else if(card.kind==="rage"&&t&&t.hp>0&&t.team===c.team){
      addStatus(t,"blazing_rage","♨",card.boost);flash(t,"BLAZING RAGE +20%","#ffbb76");state.log=[t.name+" gains +20% damage on their next damaging spell.",...state.log].slice(0,5);
    } else if(card.kind==="static"&&canReceiveDebuff(t)&&t&&t.hp>0&&t.team!==c.team){
      addStatus(t,"static_shock","ϟ",.30);const curse=t.statuses.find(st=>st.kind==="static_shock");curse.expiresRound=state.round+3;curse.damage=effectDamage(c,card,100,anim);
      flash(t,"STATIC SHOCK −30% ACC","#a5dfff");state.log=[t.name+" is cursed with Static Shock for 3 turns.",...state.log].slice(0,5);
    } else if(card.kind==="regen"&&t&&t.hp>0&&t.team===c.team){
      addStatus(t,"calming_waters","≈",Math.round(card.healPerTurn*Builds.multiplier(c,card.school)));const effect=t.statuses.find(st=>st.kind==="calming_waters");
      effect.remaining=card.healTurns;effect.appliedRound=state.round;effect.lastTickRound=state.round;
      flash(t,"CALMING WATERS","#a8f1ee");state.log=[t.name+" gains Calming Waters: 125 HP per turn for 3 turns.",...state.log].slice(0,5);
    } else if(card.kind==="shield"&&t&&t.hp>0&&t.team===c.team){
      addStatus(t,"solidity","◆",card.reduction);flash(t,"SOLIDITY −25%","#d8d7a0");
      state.log=["Shield attached to "+t.name,...state.log].slice(0,5);
    } else if(card.kind==="blade"&&t&&t.hp>0){
      addStatus(t,"blade","✦",.50);flash(t,"+50%","#f8db94");
      state.log=["Blade attached to "+t.name,...state.log].slice(0,5);
    } else if(card.kind==="trap"&&canReceiveDebuff(t)&&t&&t.hp>0){
      addStatus(t,"trap","◈",.35);flash(t,"TRAP","#e8ba91");
      state.log=["Trap attached to "+t.name,...state.log].slice(0,5);
    } else if(card.kind==="aura"){
      state.auras[c.team]={turns:2,value:.20};
      state.log=["Two-round damage aura for "+(c.team?"Team B":"Team A"),...state.log].slice(0,5);
    }
    paintUI();
  }
  function finishRound(){
    if(checkBattleEnd())return;
    for(const u of state.units)if(Number.isInteger(u.fearRound)&&u.fearRound<=state.round){u.fearRound=null;u.fearSource=null;consumeStatus(u,"fear_turn");}
    expireLightningRods();
    if(checkBattleEnd())return;
    for(const team of [0,1]){
      const aura=state.auras[team];
      if(aura&&--aura.turns<=0)state.auras[team]=null;
    }
    // Consume the REST round at its end, not at the end of the casting
    // round: cast R1 -> skip R2 -> available R3.
    for(const u of state.units){
      if(u.rechargeRound!==null&&u.rechargeRound<=state.round){
        consumeStatus(u,"recharge");
        u.rechargeRound=null;
      }
      // If a stunned wizard couldn't queue at all (because it was
      // stunned during planning), that round itself consumes the skip.
      if(u.stunRound!==null&&u.stunRound<=state.round){
        consumeStatus(u,"stun");u.stunRound=null;
      }
    }
    state.round++;
    tickBurnsForRound();
    if(checkBattleEnd())return;
    grantTurnMana();
    // Complete old round teardown: no queued player actions, target, card,
    // or combat animation may carry into the next planning phase.
    state.plans={};state.sequence=[];state.queueAt=0;state.animation=null;
    // Draw ONE new card per round for every living wizard (if room).
    // Skipping a turn with five cards never causes a six-card hand.
    for(const u of state.units)if(u.hp>0)drawCard(u);
    state.phase="planning";state.planningSide=window.WizardrySession?.active?(state.units.find(u=>u.peerId===window.WizardrySession.peerId)?.team||0):0;
    nearestAvailableCaster();
    state.log=["Round "+state.round+" begins: your spell and target choice.",...state.log].slice(0,5);
    ui.status.textContent="Round "+state.round+": "+
      (isFrozen(caster())?"Frozen — your wizard skips this turn.":isStunned(caster())?"Stunned — your wizard loses this action; CPU continues.":
       isRecharging(caster())?"Recharge round — your wizard skips this turn; CPU continues.":
       "Choose a card in hand, tap a target, and confirm.");
    paintUI();
    // If the controlled wizard was knocked out, teammates remain autonomous.
    // Do not ask the player to control another wizard.
    if(!caster()||requiresRest(caster()))resolvePressed();
  }
  function paintUI(){
    if(!state)return;
    // A tooltip must never claim an expired/consumed rune still exists.
    if(state.inspectedStatus){
      const {unitId,kind}=state.inspectedStatus;
      const u=getUnit(unitId);
      if(!u||!unitStatuses(u).some(status=>status.kind===kind))
        closeStatusInfo();
    }
    const planning=state.phase==="planning",c=caster(),card=currentCard(),
      target=correctTarget()||(!card?getUnit(state.selectedTarget):null),
      toPlan=alive(state.planningSide).length,
      count=alive(state.planningSide).filter(u=>state.plans[u.id]).length;
    ui.round.textContent="ROUND "+state.round;
    ui.phase.textContent=planning?(state.planningSide?"TEAM B · SELECT":"YOUR MOVE"):
      state.phase==="finished"?"BATTLE COMPLETE":state.phase==="ending"?"FINAL DEFEAT":"RESOLVING SPELLS";
    ui.badge.textContent=sideUnits(0).length+" vs "+sideUnits(1).length+" · "+
      (state.mode==="story"?"PRACTICE":"ONLINE LOBBY");
    ui.queueCount.textContent=planning?(c?"YOUR TURN":"CPU PLAYING"):
      state.phase==="resolving"?"ACTION "+state.queueAt+" / "+state.sequence.length:state.phase==="ending"?"FINAL DEFEAT":"FINISHED";
    if(planning)ui.hint.textContent=c?
      (isFrozen(c)?"FROZEN: skips this turn unless thawed.":isStunned(c)?"STUNNED: "+c.name+" skips this one action.":
       isRecharging(c)?"RECHARGING: "+c.name+" must skip this round. Tidal Echo remains active.":
       card?(card.selfOnly?"Confirm "+card.name+" on your wizard.":card.target==="team"?"Cast "+card.name+" on your entire team; no target selection.":card.target==="all_enemies"?
         "Cast "+card.name+" on all enemies; no target selection.":
         target?"Confirm "+card.name+" on "+target.name+".":
         "Tap "+(card.target==="ally"?"an ally":"an enemy")+" to target "+card.name+"."):
        "Slide across your cards to browse. Tap one, then choose a target."):
      "Your wizard is knocked out. Teammates are CPU-controlled.";
    if(planning&&c&&state.plans[c.id]){ui.phase.textContent="WAITING FOR PLAYERS";ui.hint.textContent="Choice locked in. Waiting for the other players…";}
    ui.handTitle.textContent=(c?c.name:"Your wizard")+" · "+(c?.hand?.length||0)+"/5";
    ui.mana.textContent=(c?c.mana:0)+" / "+(c?.maxMana||MAX_MANA)+" MANA";
    const passGain=2+(c?.passedRound===state.round-1?(c.passStreak||0):0)+(c?.statuses.some(st=>st.kind==="flow_state"&&st.remaining>0)?1:0);
    const discard=$("discardCard");if(discard){discard.hidden=!planning||!c;discard.disabled=!card||!!state.plans[c.id]||c.discardedRound===state.round;}
    const pass=$("passTurn");if(pass){pass.hidden=!planning||!c;pass.disabled=!planning||!c||!!state.plans[c.id];pass.textContent="Pass Turn · +"+passGain+" Mana";pass.title="Save your cards and regenerate "+passGain+" mana next turn (up to your build’s mana capacity).";}
    // Dress-up controls affect the selected wizard immediately on Canvas.
    const canDress=planning&&!!c&&(c.team===0||state.mode==="pvp");
    ui.hat.disabled=ui.robe.disabled=ui.robeColor.disabled=
      ui.hatColor.disabled=ui.skinColor.disabled=!canDress;
    if(c){
      ui.hat.value=c.hat;ui.robe.value=c.robe;
      ui.robeColor.value=c.robeColor;
      ui.hatColor.value=c.hatColor;ui.skinColor.value=c.skinColor;
      for(const [input,color] of [[ui.robeColor,c.robeColor],
          [ui.hatColor,c.hatColor],[ui.skinColor,c.skinColor]])
        input.style.setProperty("--swatch",color);
    }
    ui.chosenSpell.textContent=card?card.name.toUpperCase():"CHOOSE YOUR SPELL";
    const allEnemies=card?.target==="all_enemies",allAllies=card?.target==="team";
    ui.chosenTarget.textContent=card?.id==="flowstate"?"Self · +1 extra mana for your next 3 turns":card?.selfOnly?(card.id==="winddome"?"Self · blocks the next damaging spell · debuff damage passes through":"Self · 5 turns · successful allied Lightning casts charge a shared damage pool"):allAllies?"All living allies · 200 HP × 3 turns each":allEnemies?
      (card.id==="arrows"?"All living enemies · 150 each · 10% burn chance":"All living enemies · next spell +10 accuracy points"):
      target?"Target: "+target.name:
      !card?"Tap a card to select":
      "Tap "+(card.target==="ally"?"an ally":"an enemy")+" on the battlefield";
    const canConfirm=planning&&!!c&&!!card&&
      (!!target||(allEnemies&&alive(1-c.team).length>0)||(allAllies&&alive(c.team).length>0))&&
      c.mana>=card.cost&&!state.plans[c.id];
    ui.confirm.hidden=!canConfirm;
    ui.confirm.disabled=!canConfirm;
    ui.confirm.textContent=card?.selfOnly?"Cast on Yourself":allAllies?"Cast on Entire Team":allEnemies?"Cast on All Enemies":"Confirm Target";
    // Preview the same rotating seat order used by resolution. The active resolving
    // action is highlighted, so 4v4 never leaves turn order ambiguous.
    if(ui.initiative){
      ui.initiative.hidden=true;
      ui.initiative.innerHTML="";
      const ordered=state.phase==="resolving"?
        state.sequence.map(a=>getUnit(a.casterId)).filter(Boolean):
        turnOrder();
      ordered.forEach((u,i)=>{
        const chip=document.createElement("span");
        chip.className="initiative-slot"+(u.team?" enemy":"")+
          (state.animation?.source===u.id?" current":"")+
          (u.hp<=0?" dimmed":"");
        chip.textContent=(i+1)+". "+(u.team?"B":"A")+(u.index+1)+" · "+u.name;
        chip.title="Round "+state.round+" · position "+(i+1);
        ui.initiative.appendChild(chip);
      });
    }
    ui.allies.innerHTML="";ui.enemies.innerHTML="";
    const paintRoster=(team,root)=>{for(const u of sideUnits(team)){
      const b=document.createElement("button");b.type="button";
      b.className="unit"+(team?" enemy":"")+
        (c?.id===u.id?" is-caster":"")+
        (target?.id===u.id?" is-target":"")+
        (u.hp<=0?" dead":"");
      const tags=u.statuses.map(s=>s.icon).join(" ")+(state.auras[u.team]?" ◎":"")+
        (state.plans[u.id]?" ✓":"");
      b.innerHTML='<span class="unit-name">'+escapeHtml(u.name)+'</span>'+
        '<span class="meter"><i style="width:'+(100*u.hp/u.maxHp)+'%"></i></span>'+
        '<span class="unit-metrics">'+u.hp+' HP · '+u.mana+' MP</span>'+
        '<span class="unit-tags">'+tags+'</span>';
      b.title=u.name+" · "+u.hp+"/"+u.maxHp+" HP";
      b.disabled=true; // Detailed rosters are status-only, never extra control.
      b.onclick=null;
      root.appendChild(b);
    }};
    paintRoster(0,ui.allies);paintRoster(1,ui.enemies);
    if(ui.targetPicker){
      ui.targetPicker.innerHTML="";
      const placeholder=document.createElement("option");
      placeholder.value="";
      placeholder.textContent="Choose target";
      ui.targetPicker.appendChild(placeholder);
      if(c&&!["team","all_enemies"].includes(card?.target)){
        // When Lady Estel is selected, show allies (including the caster).
        // Without a selected card, show opponents as before.
        const choices=card?targetsFor(card,c):alive(1-c.team);
        for(const u of choices){
          const option=document.createElement("option");
          option.value=u.id;
          option.textContent=u.name;
          ui.targetPicker.appendChild(option);
        }
      }
      ui.targetPicker.value=state.selectedTarget||"";
      ui.targetPicker.disabled=!planning||!c||["team","all_enemies"].includes(card?.target);
      ui.targetPicker.hidden=!planning||["team","all_enemies"].includes(card?.target);
    }
    if(!ui.hand.childElementCount){
      for(const k of CARDS)for(let copy=0;copy<3;copy++){
        const b=document.createElement("button");b.type="button";
        b.className="spell card-ornate school-"+k.school;
        b.dataset.card=k.id;b.dataset.copy=String(copy);b.hidden=true;
        b.dataset.element=k.school;
        const water=k.id==="poseidon";
        const effect=k.id==="croc"?
          '<span class="spell-effect"><b>LUNGE & SNAP · 800</b><span>10% FEAR · THIS ROUND ONLY</span></span>':k.id==="jack"?
          '<span class="spell-effect"><b>CROW SWARM · 280</b><span>FEAR · 30% SKIP · 3 ROUNDS</span></span>':k.id==="windfist"?
          '<span class="spell-effect"><b>10 WIND FISTS × 50</b><span>1 ENEMY · 500 TOTAL</span></span>':k.id==="flowstate"?
          '<span class="spell-effect"><b>+1 EXTRA MANA / TURN</b><span>SELF · NEXT 3 TURNS</span></span>':k.id==="gunpowderkiss"?
          '<span class="spell-effect"><b>GUNPOWDER COAT · 3 TURNS</b><span>FIRE HIT: 150 · UP TO 3 TIMES</span></span>':k.id==="zeus"?
          '<span class="spell-effect"><b>1,350 + 200 ADJACENT</b><span>20% STUN TO EACH HIT</span></span>':k.id==="kineticsand"?
          '<span class="spell-effect"><b>CRUSHING GRIP · 620</b><span>1 ENEMY · EARTH</span></span>':k.id==="thornwrap"?
          '<span class="spell-effect"><b>150 PER SPELL ATTEMPT</b><span>−15% ACC · 3 TURNS</span></span>':k.id==="blizzard"?
          '<span class="spell-effect"><b>160 TO ALL ENEMIES</b><span>60% FROSTBITE · 100×5</span></span>':k.id==="penguins"?
          '<span class="spell-effect"><b>3 KUNAI × 100</b><span>10% FROSTBITE EACH · 50×3</span></span>':k.id==="winddome"?
          '<span class="spell-effect"><b>BLOCK NEXT DAMAGE SPELL</b><span>SELF · EXCLUDES DEBUFF DAMAGE</span></span>':k.id==="centaur"?
          '<span class="spell-effect"><b>CHARGED ARROW · 650</b><span>1 ENEMY · NATURE</span></span>':k.id==="undead"?
          '<span class="spell-effect"><b>POUNCE & CLAW · 200</b><span>10% FEAR · THIS ROUND ONLY</span></span>':k.id==="rod"?
          '<span class="spell-effect"><b>5 TURNS · 100 × CHARGES</b><span>TOTAL SPLIT BETWEEN ENEMIES</span></span>':k.id==="bloom"?
          '<span class="spell-effect"><b>100 TO ALL ENEMIES</b><span>30% POISON EACH · 50×5</span></span>':k.id==="devil"?
          '<span class="spell-effect"><b>VOLCANIC SHOT · 250</b><span>1 ENEMY · FIRE</span></span>':k.id==="octo"?
          '<span class="spell-effect"><b>TENTACLE WHIP · 400</b><span>15% FLINCH · THIS TURN ONLY</span></span>':k.id==="scorpion"?
          '<span class="spell-effect"><b>STING · 340</b><span>30% POISON · 50×3</span></span>':k.id==="freezing"?
          '<span class="spell-effect"><b>NEXT ICE: 50% FREEZE</b><span>UP TO 3 TURNS · THAW 20/40/60%</span></span>':k.id==="healingaura"?
          '<span class="spell-effect"><b>200 HP × 3 TURNS</b><span>ENTIRE TEAM · 600 EACH</span></span>':k.id==="soul"?
          '<span class="spell-effect"><b>DRAIN 100 HP × 3 TURNS</b><span>HEALS CASTER · 300 TOTAL</span></span>':k.id==="turbulence"?
          '<span class="spell-effect"><b>−50% SPELL ACCURACY</b><span>ENEMY · NEXT SPELL</span></span>':k.id==="rage"?
          '<span class="spell-effect"><b>+20% SPELL DAMAGE</b><span>NEXT SPELL · SELF / ALLY</span></span>':k.id==="static"?
          '<span class="spell-effect"><b>−30% ACC · 3 TURNS</b><span>ON MISS: 100 DAMAGE</span></span>':k.id==="calming"?
          '<span class="spell-effect"><b>125 HP × 3 TURNS</b><span>SELF / ALLY · 375 TOTAL</span></span>':k.id==="solidity"?
          '<span class="spell-effect"><b>25% DAMAGE REDUCTION</b><span>NEXT SPELL · SELF / ALLY</span></span>':k.id==="frosty"?
          '<span class="spell-effect"><b>30% FROSTBITE · 50×3</b><span>1 ENEMY · 750 HIT</span></span>':k.id==="bender"?
          '<span class="spell-effect"><b>STONE BARRAGE · 540</b><span>1 ENEMY</span></span>':k.id==="reaper"?
          '<span class="spell-effect"><b>DECAYING STRENGTH</b><span>NEXT SPELL TAKEN +20%</span></span>':k.id==="ronin"?
          '<span class="spell-effect"><b>3 × 150 SLASHES</b><span>1 ENEMY · 450 TOTAL</span></span>':k.id==="arrows"?
          '<span class="spell-effect"><b>150 TO ALL</b><span>10% BURN · 50×3</span></span>':k.id==="thunder"?
          '<span class="spell-effect"><b>THUNDERCLAP · 550</b><span>1 ENEMY</span></span>':k.id==="shark"?
          '<span class="spell-effect"><b>SHARK CHOMP · 480</b><span>1 ENEMY</span></span>':k.id==="bear"?
          '<span class="spell-effect"><b>ICY CLAW · 460</b><span>1 ENEMY</span></span>':water?
          '<span class="spell-effect"><b>REST 1 ROUND</b><span>NEXT WATER +30%</span></span>':
          k.id==="golem"?
          '<span class="spell-effect"><b>SEISMIC FISSURE</b><span>1 ENEMY</span></span>':
          k.id==="volt"?
          '<span class="spell-effect"><b>20% STUN</b><span>SKIP 1 ACTION</span></span>':
          k.id==="estel"?
          '<span class="spell-effect"><b>NATURE BLESSING</b><span>HEAL 750 HP</span></span>':
          k.id==="wind"?
          '<span class="spell-effect"><b>200 TO ALL</b><span>NEXT ACC +10%</span></span>':
          k.id==="vampire"?
          '<span class="spell-effect"><b>DRAIN 550 HP</b><span>HEAL HALF</span></span>':
          '<span class="spell-effect"><b>650 + 150 SPLASH</b><span>25% BURN · 50×3</span></span>';
        const rarity=k.rarity||(water?"LEGENDARY":
          k.id==="golem"||k.id==="estel"||k.id==="wind"?"EPIC":
          k.id==="vampire"||k.id==="dragon"?"LEGENDARY":"RARE");
        b.innerHTML='<span class="spell-tier">'+rarity+' · '+k.school.toUpperCase()+'</span>'+
          '<span class="spell-mana-cost" aria-label="'+k.cost+' mana">'+k.cost+'</span>'+
          '<span class="spell-art-shell"><canvas class="spell-art-canvas" width="240" height="196" aria-hidden="true"></canvas></span>'+
          '<span class="spell-name">'+escapeHtml(k.name)+'</span>'+
          '<span class="spell-combat"><span><b>'+(k.kind==="winddome"?"≋ ":k.kind==="freezing"?"❄ ":k.kind==="turbulence"?"≋ ":k.kind==="rage"?"✦ ":k.kind==="shield"?"◆ ":(k.kind==="heal"||k.kind==="regen"||k.kind==="teamregen")?"✚ ":"✹ ")+
          (k.id==="flowstate"?"+1 MANA":k.id==="gunpowderkiss"?"150 / FIRE":k.id==="thornwrap"?"150 / CAST":k.id==="winddome"?"BLOCK":k.id==="rod"?"100×":k.kind==="freezing"?"50% FREEZE":k.kind==="turbulence"?"50% FAIL":k.kind==="rage"?"+20%":k.kind==="shield"?"25%":((k.kind==="heal"||k.kind==="regen"||k.kind==="teamregen")?k.heal:k.id==="penguins"?300:k.id==="ronin"?450:(k.damage??0)).toLocaleString())+'</b></span>'+
          '<span><b>◎ '+Math.round(k.accuracy*100)+'%</b> ACC</span></span>'+
          effect;
        b.setAttribute("aria-label",k.name+", "+k.cost+" mana, "+
          (k.id==="flowstate"?"self-only bonus: 1 extra mana for the next 3 turns":k.id==="gunpowderkiss"?"three-turn Gunpowder Coat: Fire hits trigger 150 extra damage once per turn":k.id==="thornwrap"?"three-turn curse: 150 damage per spell attempt and minus 15 accuracy points":k.id==="winddome"?"self-only protection against the next damaging spell":k.id==="rod"?"self-only five-turn charging rune; shared total damage on expiry":k.kind==="freezing"?"next Ice spell has 50% freeze chance":k.kind==="turbulence"?"adds 50% failure chance to the next spell":k.kind==="rage"?"grants 20% damage boost to the next damaging spell":k.kind==="shield"?"reduces the next damaging spell by 25%":(k.kind==="heal"||k.kind==="regen"||k.kind==="teamregen")?"heals up to "+k.heal+" HP to a living ally":
            (k.id==="penguins"?300:k.id==="ronin"?450:k.damage)+" "+k.school+" damage")+", "+Math.round(k.accuracy*100)+
          "% accuracy. "+(k.id==="croc"||k.id==="jack"||k.id==="windfist"||k.id==="flowstate"||k.id==="gunpowderkiss"||k.id==="zeus"||k.id==="kineticsand"||k.id==="thornwrap"||k.id==="blizzard"?k.description:k.id==="penguins"?k.description:k.id==="winddome"?k.description:k.id==="centaur"?k.description:k.id==="undead"?k.description:k.id==="rod"?k.description:k.id==="bloom"?k.description:k.id==="devil"?k.description:k.id==="octo"?k.description:k.id==="scorpion"?k.description:k.id==="freezing"?k.description:k.id==="healingaura"?k.description:k.id==="soul"?k.description:k.id==="turbulence"?k.description:k.id==="rage"?k.description:k.id==="static"?k.description:k.id==="calming"?k.description:k.id==="solidity"?k.description:k.id==="frosty"?k.description:k.id==="bender"?k.description:k.id==="reaper"?k.description:k.id==="ronin"?k.description:k.id==="arrows"?k.description:k.id==="thunder"?k.description:k.id==="shark"?k.description:k.id==="bear"?k.description:k.id==="dragon"?
            "A baby dragon falls from the sky in a smoke cloud, charges and fires a large fireball. Deals 650 to its main target and 150 to immediate left and right enemy formation neighbors. 25 percent burn chance on main target: 50 damage at the start of each of the next three rounds. Then it flies off.":
            k.id==="vampire"?
            "A coffin rises and opens. The vampire flies entirely out to an enemy and siphons 550 damage. It flies back to the caster and presents a red orb that floats to the caster, healing 50% of mastery-adjusted base damage without a damage-variant roll, capped at maximum health.":
            k.id==="wind"?
            "A tornado hurls rocks at ALL living enemies for 200 damage each. Successful cast grants +10 percentage points of accuracy on the next spell of any element; consumed on next attempt.":
            k.id==="estel"?
            "Summons an angel-winged goddess who rises, blesses a chosen living ally, then flies away.":
            water?"On a successful cast, recharge one round and gain Tidal Echo +30% next Water hit. On a miss, neither effect is applied.":
            k.id==="golem"?"Seismic fissure attack.":
            "Summons Professor Volt: 450 Lightning damage and 20% stun chance on a successful hit; target skips one action."));
        b.onclick=()=>selectFanCard(k.id,copy);
        ui.hand.appendChild(b);
      }
      drawCardArts();
    }
    for(const b of ui.hand.children){
      const copy=Number(b.dataset.copy)||0,indices=(c?.hand||[]).map((id,i)=>id===b.dataset.card?i:-1).filter(i=>i>=0),index=indices[copy],inHand=index!==undefined;
      b.hidden=!inHand;
      b.classList.toggle("chosen",inHand&&b.dataset.card===card?.id&&copy===(state.selectedHandCopy||0));
      // Every held card remains inspectable, even when mana is insufficient.
      b.disabled=!planning||!c||!inHand;
      b.classList.toggle("unaffordable",!!c&&BY_ID[b.dataset.card].cost>c.mana);
      if(inHand){
        const offset=index-(c.hand.length-1)/2;
        b.style.setProperty("--fan-index",offset);
        b.style.setProperty("--fan-angle",offset*5+"deg");
        b.style.setProperty("--fan-drop",Math.abs(offset)*9+"px");
        b.style.setProperty("--fan-z",index+1);
        b.style.order=index;
      }
      b.setAttribute("aria-pressed",String(inHand&&b.dataset.card===card?.id&&copy===(state.selectedHandCopy||0)));
    }
    const handArtKey=c?.hand?.join('|')||'';if(handArtKey!==lastHandArtKey){lastHandArtKey=handArtKey;drawCardArts();}
    if(Builds)for(const button of ui.hand.querySelectorAll('button[data-card]')){
      const k=BY_ID[button.dataset.card],range=Builds.range(k,c);
      const main=button.querySelector('.spell-combat b');
      if(range&&main){main.textContent='✹ '+range.low.toLocaleString()+'–'+range.high.toLocaleString();button.setAttribute('aria-label',k.name+', '+k.cost+' mana, '+range.low+' to '+range.high+' '+k.school+' damage, '+Math.round(k.accuracy*100)+'% accuracy. '+k.description);}
      if(k.heal&&main)main.textContent='✚ '+Builds.healing(k,c).toLocaleString();
      const scaledEffect=Builds.effectText(k,c),effectNode=button.querySelector('.spell-effect');
      if(scaledEffect&&effectNode){effectNode.textContent=scaledEffect;effectNode.title='Includes your mastery bonus. Healing has no damage-variant roll.';}
      if(range){const effect=button.querySelector('.spell-effect');if(effect&&!effect.dataset.base){effect.dataset.base=effect.innerHTML;effect.title='Values include your mastery bonus. Damage uses three variants; healing does not.';}}
    }
    ui.queue.disabled=!planning||!c||!card||!!state.plans[c.id]||
      c.mana<card.cost||(card.target!=="team"&&card.target!=="all_enemies"&&!target);
    ui.auto.disabled=true;
    ui.resolve.disabled=true;
    ui.resolve.textContent=state.mode==="pvp"&&state.planningSide===0?
      "Pass to Team B":state.phase==="finished"?"Fight again":"Resolve round";
    ui.queue.textContent=card&&target?"Queue spell":"Choose spell + target";
    ui.auto.textContent="CPU controls other wizards";
    ui.plans.innerHTML="";
    for(const u of state.units){
      const p=state.plans[u.id];if(!p)continue;
      const chip=document.createElement("span");chip.className="action-tag"+(u.team?" enemy":"");
      chip.textContent=u.name+": "+(p.pass?"Pass Turn · Save Mana":BY_ID[p.cardId]?.name||"No spell")+
        (p.targetId?" → "+(getUnit(p.targetId)?.name||"target"):"");
      ui.plans.appendChild(chip);
    }
    if(!ui.plans.childElementCount)ui.plans.textContent=state.phase==="resolving"?
      "Combat actions are resolving...":"No actions queued yet.";
  }
  function escapeHtml(x){return String(x).replace(/[&<>"']/g,c=>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function setupControlHandlers(){
    handSwipe=window.WIZARDRY_HAND_SWIPE_V71?.attach(ui.hand)||null;
    for(const b of ui.mode.querySelectorAll("button[data-mode]"))b.onclick=()=>{
      for(const x of ui.mode.querySelectorAll("button")){const on=x===b;x.classList.toggle("active",on);x.setAttribute("aria-pressed",String(on));}
      setBattle(b.dataset.mode,state.size);
    };
    for(const b of ui.sizes.querySelectorAll("button[data-size]"))b.onclick=()=>{
      for(const x of ui.sizes.querySelectorAll("button"))x.classList.toggle("active",x===b);
      setBattle(state.mode,Number(b.dataset.size));
    };
    // Card -> appropriate ally/enemy -> explicit confirmation. CPU teammates can receive healing.
    ui.confirm.onclick=confirmTarget;
    $("passTurn").onclick=passTurn;
    $("discardCard").onclick=discardSelected;
    ui.queue.onclick=()=>{};
    ui.auto.onclick=()=>{};
    ui.resolve.onclick=()=>{};
    for(const [input,field] of [[ui.hat,"hat"],[ui.robe,"robe"],[ui.robeColor,"robeColor"],
        [ui.hatColor,"hatColor"],[ui.skinColor,"skinColor"]]){
      input.onchange=()=>{
        const u=caster();
        if(state.phase!=="planning"||!u||(u.team===1&&state.mode!=="pvp"))return;
        u[field]=input.value;
        saveLook(u);
        paintUI();
      };
    }
    ui.reset.onclick=()=>setBattle(state.mode,state.size);
    // Working dropdown fallback for closely spaced allies in 4v4.
    if(ui.targetPicker)ui.targetPicker.onchange=()=>{
      if(ui.targetPicker.value)selectTarget(ui.targetPicker.value);
      else if(state.phase==="planning"){
        state.selectedTarget=null;
        paintUI();
      }
    };
    ui.statusClose.onclick=closeStatusInfo;
    canvas.addEventListener("pointerdown",event=>{
      const rect=canvas.getBoundingClientRect();
      const x=(event.clientX-rect.left-camera.x)/camera.scale;
      const y=(event.clientY-rect.top-camera.y)/camera.scale;
      // Magical runes remain inspectable even during spell animations.
      if(hitStatusRune(x,y))return;
      closeStatusInfo();
      if(state.phase!=="planning")return;
      // Ally healing must search the caster's OWN team, not enemies.
      // The same nameplate and character tap areas work for both teams.
      const card=currentCard(),active=caster();
      if(!card||!active)return;
      const candidates=targetsFor(card,active)
        .map(u=>{
          const plate=unitPlateRect(u);
          const onPlate=x>=plate.x-3&&x<=plate.x+plate.w+3&&
            y>=plate.y-5&&y<=plate.y+plate.h+5;
          const dx=Math.abs(x-u.x),dy=Math.abs(y-(u.y-88));
          return {u,onPlate,dx,dy,
            d:onPlate?-1:Math.hypot(dx*.92,dy*.83)};
        }).sort((a,b)=>a.d-b.d);
      if(!candidates[0]||(!candidates[0].onPlate&&
          (candidates[0].dx>90||candidates[0].dy>135)))return;
      selectTarget(candidates[0].u.id);
    });
  }
  function pathPoly(ctx,pts,fill,stroke=null,width=1){
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function ellipse(ctx,x,y,rx,ry,fill,stroke=null,width=1){
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
  }
  function line(ctx,x1,y1,x2,y2,col,width=1){
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.strokeStyle=col;ctx.lineWidth=width;ctx.stroke();
  }
  function drawPillar(ctx,x,base,scale=1){
    ctx.save();ctx.translate(x,base);ctx.scale(scale,scale);
    pathPoly(ctx,[[-22,0],[-30,-180],[15,-190],[23,0]],"#284a58");
    pathPoly(ctx,[[-22,0],[-23,-182],[-6,-185],[2,0]],"#486875");
    pathPoly(ctx,[[-38,-186],[31,-186],[32,-212],[-35,-212]],"#567781","#203b49",3);
    pathPoly(ctx,[[-35,-213],[-21,-229],[30,-222],[32,-213]],"#718994");
    ctx.restore();
  }
  function drawBackground(ctx){
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,"#071522");sky.addColorStop(.55,"#103b4b");sky.addColorStop(1,"#031521");
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    for(let i=0;i<6;i++){
      const x=140+i*155;
      pathPoly(ctx,[[x-48,185],[x-12,38],[x+14,38],[x+94,212]],"#0ba7bd0b");
    }
    // Ancient archways and ruins recede behind the arena.
    for(let i=0;i<7;i++){
      let x=5+i*164;
      ctx.fillStyle="#0b2433";ctx.fillRect(x,118,42,238);
      ctx.fillStyle="#1e4c5d";ctx.fillRect(x+9,119,10,236);
      ctx.strokeStyle="#1c4f60";ctx.lineWidth=12;
      ctx.beginPath();ctx.arc(x+103,182,75,Math.PI,Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle="#132e3b";ctx.fillRect(0,77,W,35);
    pathPoly(ctx,[[0,76],[82,56],[244,68],[390,37],[640,73],[813,50],[1000,75],[1000,98],[0,98]],"#1c3f4c");
    for(let i=0;i<14;i++){
      const x=i*82-15;
      pathPoly(ctx,[[x,117],[x+23,119],[x+31,138],[x+6,147]],i%2?"#173b49":"#255567");
    }
    drawPillar(ctx,44,353,.8);drawPillar(ctx,952,353,.8);
    for(const [x,y,size,col] of [[62,352,36,"#46d6da"],[930,369,44,"#66e0e0"],[168,354,21,"#a374e2"],[824,345,24,"#d7a9ee"],[498,334,23,"#26c6d9"]]){
      pathPoly(ctx,[[x-size*.5,y],[x-size*.8,y-size],[x,y-size*2],[x+size*.5,y-size*.6],[x+size*.65,y]],col+"55");
      pathPoly(ctx,[[x,y],[x,y-size*2],[x+size*.6,y-size],[x+size*.65,y]],col+"78");
    }
    // Level three-quarter SIDE-ANGLE view: shallow, horizontal battle ring.
    // Characters stand on LEFT/RIGHT arcs, not front/back enemy rows.
    // A visible vertical edge below the fighting surface conveys height.
    ctx.save();ctx.translate(500,412); // level horizon, no side-to-side tilt
    ellipse(ctx,0,42,481,143,"#03111b");
    const edge=ctx.createLinearGradient(0,118,0,182);
    edge.addColorStop(0,"#5c6972");edge.addColorStop(.4,"#263f4b");
    edge.addColorStop(1,"#102432");
    ellipse(ctx,0,31,481,147,edge,"#a5946e",4);
    ellipse(ctx,0,0,478,140,"#284652","#d3bd89",5);
    const surface=ctx.createLinearGradient(0,-145,0,148);
    surface.addColorStop(0,"#294a55");surface.addColorStop(.45,"#173847");
    surface.addColorStop(1,"#102b3c");
    ellipse(ctx,0,-4,462,129,surface,"#5b7d7f",3);
    // Side perspective grid follows the level ellipse rather than a
    // centered overhead disc. Low-poly paving wedges fan from the seal.
    for(let i=0;i<24;i++){
      const a=i*Math.PI*2/24,b=(i+1)*Math.PI*2/24;
      pathPoly(ctx,[[0,-4],[456*Math.cos(a),-4+127*Math.sin(a)],
        [456*Math.cos(b),-4+127*Math.sin(b)]],
        i%2===0?"#78919b10":"#0a1d2b12");
    }
    ellipse(ctx,0,-4,417,113,null,"#baa7767a",3);
    ellipse(ctx,0,-4,302,80,null,"#c4b58d55",2.5);
    ellipse(ctx,0,-4,162,41,"#132d3b46","#d4bf7b70",2.5);
    for(let i=0;i<8;i++){
      const a=i*Math.PI*2/8;
      pathPoly(ctx,[[86*Math.cos(a),-4+25*Math.sin(a)],
        [150*Math.cos(a+.15),-4+39*Math.sin(a+.15)],
        [87*Math.cos(a+.35),-4+25*Math.sin(a+.35)]],
        i%2?"#bca05d23":"#c9c9a01c");
    }
    pathPoly(ctx,[[0,-29],[15,-4],[0,26],[-16,-4]],"#d6bd7d67");
    line(ctx,0,-36,0,33,"#d0b67a4f",2);
    ctx.restore();
    // Stone foreground drops BELOW the arena's near edge. Never overdraw
    // combatants or treat their lower-left arc as a back-facing camera.
    pathPoly(ctx,[[0,565],[177,572],[492,566],[785,570],[1000,550],
      [1000,620],[0,620]],"#102733");
    pathPoly(ctx,[[0,568],[177,576],[492,570],[785,574],[1000,553],
      [1000,577],[782,591],[490,585],[170,598],[0,590]],"#2a4450");
    for(let i=0;i<13;i++){
      const x=i*89;
      line(ctx,x,573+(i%2)*5,x+32,583+(i%3)*5,"#59707e53",1.8);
    }
    // Colosseum edge torches.
    for(const x of [23,978]){
      ctx.fillStyle="#51616a";ctx.fillRect(x-10,308,20,55);
      ellipse(ctx,x,307,16,4,"#d0a661");
      const fire=ctx.createRadialGradient(x,289,1,x,289,36);
      fire.addColorStop(0,"#fff4bb");fire.addColorStop(.4,"#e3a85c");fire.addColorStop(1,"#e3a85c00");
      ctx.fillStyle=fire;ctx.fillRect(x-36,257,72,69);
    }
  }
  function createBackground(){
    background=document.createElement("canvas");background.width=W;background.height=H;
    const bg=background.getContext("2d");
    // Always render a safe frame immediately. Static art loads separately,
    // so a slow image fetch cannot leave the fighting canvas blank.
    const fallback=()=>{
      try{
        bg.clearRect(0,0,W,H);
        if(window.WIZARDRY_LOW_POLY_ARENA_V47)
          window.WIZARDRY_LOW_POLY_ARENA_V47.draw(bg);
        else drawBackground(bg);
      }catch(err){
        bg.setTransform(1,0,0,1,0,0);
        bg.fillStyle="#132a40";bg.fillRect(0,0,W,H);
        console.warn("Wizardry arena fallback renderer:",err);
      }
    };
    fallback();
    // This image is constructed from the ACTUAL approved arena concept:
    // same stone arcade, crystals, banners, statue and golden floor rim.
    // The eight painted placeholder wizards are removed; the live sprite
    // renderer draws real animation frames/HP plates on top of it.
    const concept=new Image();
    concept.decoding="async";
    concept.onload=()=>{
      if(concept.naturalWidth!==W||concept.naturalHeight!==H){
        console.warn("Wizardry: approved arena image has incorrect dimensions");
        return;
      }
      try{
        bg.save();bg.setTransform(1,0,0,1,0,0);
        bg.clearRect(0,0,W,H);
        bg.drawImage(concept,0,0,W,H);
        bg.restore();
      }catch(err){
        console.warn("Wizardry: concept image draw failed, retaining fallback",err);
        fallback();
      }
    };
    concept.onerror=()=>console.warn("Wizardry: approved arena image failed to load; retaining fallback");
    concept.src="./assets/arena-concept-approved-v48.webp?v=0.48.0";
  }
  function rounded(ctx,x,y,w,h,r,fill,stroke=null,sw=1){
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke();}
  }
  function shadeColor(hex,offset){
    let value=String(hex||"#267eab").replace("#","");
    if(!/^[0-9a-f]{6}$/i.test(value))value="267eab";
    const channel=i=>clamp(parseInt(value.slice(i,i+2),16)+offset,0,255);
    return "#"+[0,2,4].map(i=>Math.round(channel(i)).toString(16).padStart(2,"0")).join("");
  }
  function drawWizard(ctx,u,time){
    // Individually assembled low-poly wizard — not a rotated, fixed sprite.
    // Three real hat silhouettes and a hood, three robe cuts, six colors.
    const side=u.team?-1:1;
    const primary=u.robeColor||"#267eab";
    const dark=shadeColor(primary,-61),deeper=shadeColor(primary,-93);
    const light=shadeColor(primary,39),shine=shadeColor(primary,65);
    const trim="#d8bd88",skin=u.skinColor||"#cca084";
    const sway=Math.sin(time*1.18+u.index*1.61)*1.3;
    const raised=clamp(u.armRaise||0,0,1);
    // Rear cape: faceted panels overlap the robe at the shoulders.
    pathPoly(ctx,[[-26,-114],[-50,-78],[-53,1],[-17,-13],[21,-7],[44,3],
      [38,-77],[21,-116]],deeper,dark,2);
    pathPoly(ctx,[[-30,-103],[-53,-72],[-48,-4],[-14,-10]],dark);
    pathPoly(ctx,[[23,-100],[44,-73],[44,-3],[18,-12]],shadeColor(primary,-39));
    // Three distinct robe silhouettes, all with consistent feet/scale.
    if(u.robe==="armored"){
      pathPoly(ctx,[[-30,-110],[-31,-8],[-40,4],[39,4],[29,-110]],
        dark,trim,2.4);
      pathPoly(ctx,[[-30,-111],[-6,-128],[29,-110],[24,-75],[-27,-75]],
        primary,light,2);
      pathPoly(ctx,[[-29,-83],[-8,-94],[0,-45],[-27,-8]],light);
      pathPoly(ctx,[[5,-90],[30,-80],[36,-4],[0,-22]],deeper);
      for(const y of [-74,-51,-28]){
        pathPoly(ctx,[[-24,y],[-14,y-6],[17,y-5],[28,y]],
          y===-51?trim:shadeColor(primary,-24),dark,1.3);
      }
    }else if(u.robe==="split"){
      pathPoly(ctx,[[-27,-112],[-23,-65],[-46,2],[-7,-6],[0,-42],[9,-6],
        [45,3],[25,-66],[27,-111]],primary,dark,2);
      pathPoly(ctx,[[-26,-109],[-9,-122],[7,-119],[-5,-43],[-25,0]],light);
      pathPoly(ctx,[[8,-117],[28,-111],[43,3],[10,-6],[-1,-42]],dark);
      pathPoly(ctx,[[-13,-42],[0,-49],[8,-9],[-4,0]],shine);
    }else{
      pathPoly(ctx,[[-27,-112],[-33,-70],[-43,2],[39,2],[31,-70],
        [28,-114]],primary,dark,2.1);
      pathPoly(ctx,[[-28,-110],[-7,-126],[-5,-22],[-39,3]],light);
      pathPoly(ctx,[[16,-117],[31,-110],[40,2],[7,-2]],dark);
      pathPoly(ctx,[[-14,-108],[0,-98],[10,-8],[-6,0]],shadeColor(primary,16));
    }
    // Trim and buckle are always visible and vary in the attached garment.
    pathPoly(ctx,[[-28,-111],[-8,-122],[6,-119],[29,-111],[22,-94],
      [-21,-94]],shadeColor(primary,-16),trim,2);
    pathPoly(ctx,[[-24,-38],[-14,-42],[15,-41],[25,-36],
      [22,-29],[-21,-30]],deeper,trim,1.6);
    pathPoly(ctx,[[-7,-43],[7,-43],[8,-30],[-7,-30]],trim);
    pathPoly(ctx,[[-3,-40],[4,-40],[4,-34],[-3,-34]],u.color||"#98eeef");
    // Sleeves and hands are genuine articulated faceted polygons, no
    // stretch; shoulder -> elbow -> hand changes via fixed segment joins.
    pathPoly(ctx,[[-side*24,-108],[-side*43,-93],[-side*40,-58],
      [-side*26,-57],[-side*18,-86]],dark,light,1.7);
    pathPoly(ctx,[[-side*41,-62],[-side*30,-66],[-side*31,-50],[-side*42,-48]],
      skin,dark,1.2);
    // Low-poly neck and 3/4 human face. Side orientation remains FIXED.
    pathPoly(ctx,[[-15,-130],[16,-130],[18,-109],[-15,-107]],skin,shadeColor(skin,-42),1.3);
    ellipse(ctx,0,-136+sway,19,23,skin,shadeColor(skin,-55),1.6);
    pathPoly(ctx,[[side*9,-143],[side*22,-134],[side*8,-126]],
      shadeColor(skin,22));
    pathPoly(ctx,[[side*13,-139],[side*24,-135],[side*14,-129]],
      shadeColor(skin,4),shadeColor(skin,-46),1);
    ellipse(ctx,side*12,-140+sway,2.4,2.1,"#ecf5ec");
    line(ctx,side*7,-126,side*15,-124,shadeColor(skin,-72),1.3);
    // Hat style can change independently of robe silhouette/colors.
    const hat=u.hat||"pointed";
    const hatPrimary=u.hatColor||primary;
    const hatDark=shadeColor(hatPrimary,-61),hatDeeper=shadeColor(hatPrimary,-93);
    const hatLight=shadeColor(hatPrimary,39);
    if(hat==="wide"){
      pathPoly(ctx,[[-44,-159+sway],[46,-159+sway],
        [37,-150+sway],[-42,-149+sway]],hatDeeper,trim,1.8);
      pathPoly(ctx,[[-24,-159+sway],[-13,-193+sway],[12,-195+sway],
        [27,-159+sway]],hatPrimary,hatLight,1.6);
      pathPoly(ctx,[[-13,-193+sway],[13,-195+sway],[25,-159+sway],
        [3,-166+sway]],hatDark);
    }else if(hat==="hood"){
      pathPoly(ctx,[[-25,-117],[-31,-156+sway],[-14,-179+sway],
        [14,-179+sway],[33,-151+sway],[25,-111]],
        hatDark,hatLight,2);
      pathPoly(ctx,[[-29,-156+sway],[-14,-179+sway],[0,-170+sway],
        [-9,-132]],hatLight);
      pathPoly(ctx,[[-21,-154+sway],[-12,-165+sway],[18,-164+sway],
        [25,-151+sway],[20,-131],[-20,-133]],hatDeeper,trim,1.6);
    }else if(hat==="scholar"){
      pathPoly(ctx,[[-32,-158+sway],[-20,-184+sway],[22,-184+sway],
        [33,-158+sway],[24,-150+sway],[-26,-149+sway]],
        hatPrimary,trim,2);
      pathPoly(ctx,[[-20,-184+sway],[22,-184+sway],[27,-160+sway],
        [3,-166+sway]],hatDark);
      pathPoly(ctx,[[-43,-152+sway],[40,-152+sway],[33,-143+sway],
        [-38,-143+sway]],hatDeeper,trim,1.6);
    }else{
      pathPoly(ctx,[[-30,-156+sway],[-9,-206+sway],
        [8,-218+sway],[27,-157+sway]],hatPrimary,trim,2.2);
      pathPoly(ctx,[[-9,-206+sway],[8,-218+sway],[20,-159+sway],
        [0,-177+sway]],hatDark);
      pathPoly(ctx,[[-37,-161+sway],[36,-161+sway],[30,-150+sway],
        [-34,-150+sway]],hatDeeper,trim,1.7);
    }
    // Adjustable staff arm: all poses point toward arena CENTER, never
    // rotate the standing wizard or enemy. Wrist moves from hip to extended.
    const sh=[side*24,-102];
    const el=[side*(34+20*raised),-83-18*raised];
    const hand=[side*(41+57*raised),-52-58*raised];
    const top=[hand[0]+side*(7+101*raised),
               hand[1]-lerp(107,12,raised)];
    pathPoly(ctx,[[sh[0]-8,sh[1]-7],[el[0]-8,el[1]-9],
      [el[0]+8,el[1]+9],[sh[0]+9,sh[1]+10]],primary,dark,1.6);
    pathPoly(ctx,[[el[0]-7,el[1]-9],[hand[0]-7,hand[1]-6],
      [hand[0]+7,hand[1]+7],[el[0]+9,el[1]+8]],light,dark,1.6);
    ellipse(ctx,hand[0],hand[1],9,8,skin,shadeColor(skin,-35),1);
    // One single solid wand, rigid and aimed with the entire arm.
    line(ctx,hand[0],hand[1]+15,top[0],top[1],
      u.robe==="armored"?"#d6c597":"#c4a675",6);
    line(ctx,hand[0]+side*2,hand[1]+12,top[0],top[1],
      "#f7e0a5a0",1.4);
    const element=state.animation?.source===u.id?state.animation.card.id:"";
    const gem=element==="golem"?"#b5ec79":
      element==="poseidon"?"#7eebfa":u.color;
    pathPoly(ctx,[[top[0]-10,top[1]],[top[0],top[1]-16],
      [top[0]+10,top[1]],[top[0],top[1]+9]],gem,trim,1.6);
    ellipse(ctx,top[0],top[1]-2,4,6,"#ecffff8c");
  }
  function drawEnemyStaffArm(ctx,u,rock,shade,bright){
    // Story-mode monster enemies stay planted facing the center, with one
    // simple rigid stone arm that lifts a rune staff when casting.
    const p=clamp(u.armRaise||0,0,1),side=-1;
    const sh=[-44,-113],el=[-60-22*p,-86-14*p],
      hand=[-71-50*p,-37-66*p];
    pathPoly(ctx,[[sh[0]-13,sh[1]-6],[el[0]-10,el[1]-11],
      [el[0]+12,el[1]+11],[sh[0]+12,sh[1]+9]],rock,shade,2.5);
    pathPoly(ctx,[[el[0]-12,el[1]-11],[hand[0]-14,hand[1]-8],
      [hand[0]+13,hand[1]+9],[el[0]+12,el[1]+11]],rock,shade,2.5);
    pathPoly(ctx,[[hand[0]-14,hand[1]-7],[hand[0]+12,hand[1]-10],
      [hand[0]+17,hand[1]+14],[hand[0]-13,hand[1]+17]],shade,rock,2);
    const top=[hand[0]+side*(6+94*p),hand[1]-lerp(95,12,p)];
    line(ctx,hand[0],hand[1]+12,top[0],top[1],"#826e5e",6);
    pathPoly(ctx,[[top[0]-10,top[1]+4],[top[0],top[1]-21],
      [top[0]+9,top[1]+5],[top[0],top[1]+10]],bright,
      "#d4e8ba",1.6);
  }
  function drawEnemy(ctx,u,time){
    const rock=u.style==="moss"?"#6d795a":u.style==="crystal"?"#6b5c85":
      u.style==="shadow"?"#503966":"#77828a";
    const shade=u.style==="moss"?"#3a573d":u.style==="crystal"?"#42335e":
      u.style==="shadow"?"#2b2041":"#465862";
    const bright=u.style==="moss"?"#c5f083":u.style==="crystal"?"#c4a4fe":
      u.style==="shadow"?"#b58df6":"#92dfea";
    if(u.style==="shadow"){
      ellipse(ctx,0,-105,28,36,"#322744");
      pathPoly(ctx,[[-44,0],[-38,-100],[-17,-142],[24,-142],[38,-90],[48,0]],
        "#403051","#795eac",2);
      pathPoly(ctx,[[-20,-138],[0,-172],[20,-138],[18,-102],[-19,-102]],"#201a32","#8164aa",3);
      const side=u.team?-1:1;
      ellipse(ctx,side*10,-125,4,3.4,"#dfb2ff");
      pathPoly(ctx,[[side*22,-124],[side*34,-120],[side*21,-112]],"#635182");
      for(let i=0;i<3;i++)pathPoly(ctx,[[(-1+i)*30,-96],[(-1+i)*24,-154],[(-1+i)*35,-124]],bright+"8a");
      drawEnemyStaffArm(ctx,u,"#52436c","#2b2041",bright);
      return;
    }
    // Massive faceted golem / sentinel / brute.
    pathPoly(ctx,[[-37,-5],[-48,-76],[-27,-100],[30,-100],[47,-5]],rock,shade,3);
    pathPoly(ctx,[[-46,-72],[-62,-119],[-30,-154],[32,-150],[64,-118],[47,-70]],rock,shade,3);
    pathPoly(ctx,[[-62,-118],[-32,-156],[-17,-109],[-43,-73]],"#a5aaa060");
    pathPoly(ctx,[[29,-150],[64,-119],[46,-71],[12,-112]],shade);
    pathPoly(ctx,[[55,-118],[84,-106],[84,-43],[55,-40],[42,-91]],rock,shade,3);
    pathPoly(ctx,[[58,-44],[83,-48],[90,-19],[73,-13],[55,-23]],"#576d6b");
    pathPoly(ctx,[[-43,-10],[-7,-14],[-13,4],[-48,9]],"#758077");
    pathPoly(ctx,[[7,-15],[46,-14],[48,8],[10,6]],shade);
    pathPoly(ctx,[[-25,-144],[-28,-181],[0,-194],[29,-178],[26,-139],[0,-127]],rock,shade,3);
    pathPoly(ctx,[[-27,-181],[0,-194],[-1,-153]],"#b5baad64");
    pathPoly(ctx,[[0,-194],[28,-177],[25,-141],[-1,-154]],shade);
    const front=u.team?-1:1;
    // Stronger near-side eye and a visible faceted nose/cheek on the side
    // facing the enemy. The far-side eye recedes into the stone face.
    pathPoly(ctx,[[front*-16,-161],[front*-7,-162],[front*-7,-155],[front*-16,-154]],bright+"82");
    pathPoly(ctx,[[front*5,-163],[front*21,-161],[front*21,-153],[front*5,-155]],bright);
    pathPoly(ctx,[[front*25,-154],[front*38,-148],[front*23,-139]],rock,shade,1.7);
    pathPoly(ctx,[[-11,-112],[5,-120],[19,-102],[2,-88]],bright);
    if(u.style==="moss"){
      pathPoly(ctx,[[-55,-147],[-40,-183],[-18,-160],[5,-190],[28,-168],[55,-174],[47,-149]],"#5f8e3c");
      for(const x of [-31,-4,28])pathPoly(ctx,[[x-8,-171],[x,-201],[x+13,-169]],"#a0dc55");
    }
    if(u.style==="crystal"){
      for(const [x,y] of [[-51,-150],[35,-170],[-63,-105],[52,-117]])
        pathPoly(ctx,[[x-11,y+12],[x,y-32],[x+14,y+9]],"#b78af0","#e0c8ff",2);
    }
    drawEnemyStaffArm(ctx,u,rock,shade,bright);
  }
  function unitPosition(u){return {x:u.x,y:u.y};}
  // Wizards and ordinary enemies maintain their fixed three-quarter
  // facing. Only summoned spell creatures turn to face their targets.
  function desiredYaw(u){return u.team?-.74:.74;}
  function updateFacing(dt){} // No target-based combatant rotation.
  // Inlaid floor medallion and concentrated shadows anchor every
  // character on the original depth plane instead of a hovering oval.
  function drawGroundMarker(ctx,u,scale){
    const y=7*scale,rx=57*scale,ry=17*scale;
    ctx.save();
    const shade=ctx.createRadialGradient(0,y,3*scale,0,y,73*scale);
    shade.addColorStop(0,"#010914d9");
    shade.addColorStop(.48,"#010b17a0");
    shade.addColorStop(1,"#010b1700");
    ctx.fillStyle=shade;
    ctx.beginPath();ctx.ellipse(0,y,78*scale,23*scale,0,0,Math.PI*2);
    ctx.fill();
    // Warm, engraved gold rings match the approved reference artwork
    // without adding a raised podium under the feet.
    ellipse(ctx,0,y+1,rx,ry,"#142738b0","#d5ae75de",2.4);
    ellipse(ctx,0,y+1,rx-6*scale,ry-3*scale,null,"#ddc18788",1.4);
    // Four tiny faceted inlaid stones, not elevated podiums.
    for(let k=0;k<4;k++){
      const a=Math.PI*(k+.5)/2;
      const x=rx*Math.cos(a),py=y+ry*Math.sin(a);
      pathPoly(ctx,[[x-5*scale,py],[x,py-4*scale],
        [x+5*scale,py],[x,py+4*scale]],
        k%2?"#cbaa6bb5":"#6db5b7a3");
    }
    ellipse(ctx,0,y,31*scale,8*scale,"#020911cf");
    ctx.restore();
  }
  function drawUnit(u,time){
    // Physical depth scale from the same arena floor, not separate
    // front/back teams. Lower Y sits nearer the 3/4 camera.
    const scale=lerp(.60,.90,clamp((u.y-288)/235,0,1));
    g.save();g.translate(u.x,u.y);
    drawGroundMarker(g,u,scale);
    // Keep the collapsed pose readable instead of fading it nearly away.
    if(u.hp<=0)g.globalAlpha=.85;
    if(state.auras[u.team]){
      ellipse(g,0,3,72*scale,23*scale,"#5edbd41b","#76f1d39b",2);
    }
    if(state.phase==="planning"&&u.id===state.humanByTeam[state.planningSide]&&u.hp>0)
      ellipse(g,0,5,77*scale,27*scale,"#18e8d21f","#70f6f2",4);
    // Green eligibility markers for heal targets, gold for enemies.
    if(state.phase==="planning"&&currentCard()&&caster()&&u.hp>0&&
       targetsFor(currentCard(),caster()).some(t=>t.id===u.id))
      ellipse(g,0,5,87*scale,30*scale,
        ["ally","team"].includes(currentCard().target)?"#57ec9628":
        currentCard().target==="all_enemies"?"#9ed5d02c":"#d4b64d20",
        ["ally","team"].includes(currentCard().target)?"#95ffad":
        currentCard().target==="all_enemies"?"#b9edf0":"#f6d487",4);
    if(state.animation&&(state.animation.source===u.id||state.animation.target===u.id)){
      ellipse(g,0,4,82*scale,29*scale,null,
        state.animation.source===u.id?"#94e9f6":"#f6be9a",3);
    }
    g.scale(scale,scale);
    // The approved low-poly wizard now occupies ALL 1v1–4v4 slots,
    // on both teams. Mirror the enemy team so they face the allies.
    // Palette swaps use the approved full-body frames; only changing
    // silhouettes uses the existing geometry-based model fallback.
    const approvedWizard=u.hat==="pointed"&&u.robe==="classic";
    const action=state.animation?.source===u.id?state.animation:null;
    let visualStage=action?.stage||"idle";
    let visualProgress=action?.duration?action.elapsed/action.duration:0;
    if(action&&["rune-success","rune-fail","summon","fizzle","lowering","golem-slam",
        "golem-travel","golem-impact","estel-summon","estel-travel",
        "estel-impact","estel-exit","wind-summon","wind-volley",
        "wind-impact","wind-dissolve","vamp-rise","vamp-open","vamp-lunge",
        "vamp-drain","vamp-return","vamp-present","vamp-orb","vamp-vanish",
        "dragon-drop","dragon-land","dragon-charge","dragon-shot",
        "dragon-impact","dragon-exit","rain-form","rain-barrage","rain-fade","ronin-drop","ronin-land","ronin-reach","ronin-draw","ronin-volley","ronin-finish","ronin-exit","reaper-circle","reaper-rise","reaper-windup","reaper-lunge","reaper-slash","reaper-dissolve","reaper-close","bender-appear","bender-stance","bender-stomp","bender-wall","bender-punch","bender-barrage","bender-exit","frost-gust","frost-appear","frost-happy","frost-angry","frost-transform","frost-pause","frost-lift","frost-windup","frost-throw","frost-flight","frost-impact","frost-melt"].includes(visualStage)){
      // Stop waving the instant rune accuracy resolves. Smoothly lower the
      // staff while the summon/failure effect plays, then breathe at idle.
      visualProgress=clamp((action.visualRecoveryMs||0)/WIZARD_RECOVERY_MS,0,1);
      visualStage=visualProgress>=1?"idle":"lowering";
    }
    // Stagger each unit's breathing loop so eight identical wizards
    // don't bob in perfect synchronization. Casting uses each unit's
    // own action state and returns to idle after rune success/failure.
    const idleTime=time+u.index*235+u.team*437;
    g.save();
    if(u.team===1)g.scale(-1,1);
    const spriteDrawn=u.hp<=0
      ? drawDefeatSprite(g,u.defeatElapsedMs||0,u)
      : approvedWizard&&drawWizardSprite(g,
          visualStage,visualProgress,
          action?.traceMs||0,idleTime,action?.lowerFromFrame,u);
    g.restore();
    if(spriteDrawn){
      // All sprites stay in the same depth-sorted scene and use the
      // original world-space HP/status plates and target hit testing.
    }else{
      const bob=(u.hp>0?Math.sin(time*.002*2+u.index*2)*2:0);
      g.translate(0,bob);
      const side=u.team?-1:1;
      g.transform(.79,0,-side*.11,1,0,0);
      if(u.team&&state.mode==="story")drawEnemy(g,u,time*.001);
      else drawWizard(g,u,time*.001);
    }
    g.restore();
  }
  // Stable labels attached to their own wizard: upper half above the
  // head, lower half below the feet. No packing, drifting, or regrouping.
  function unitPlateRect(u){
    const team=state.units.filter(v=>v.team===u.team).sort((a,b)=>a.y-b.y),index=team.findIndex(v=>v.id===u.id),top=index<Math.ceil(team.length/2),w=160;
    const scale=lerp(.60,.90,clamp((u.y-288)/235,0,1));
    const offset=top&&index===1?(u.team?32:-32):0;
    return {x:clamp(u.x-w/2+offset,8,W-w-8),y:top?u.y-220*scale-64:u.y+14,w,h:52,above:top};
  }
  function plateIsTarget(u,a){
    if(!a)return false;if(a.target===u.id)return true;
    const source=getUnit(a.source);
    if(a.card.target==='all_enemies'&&u.team!==source?.team)return true;
    if(a.card.target==='team'&&u.team===source?.team)return true;
    if(a.card.selfOnly&&u.id===a.source)return true;
    for(const key of ['dragonSplashIds','zeusChainTargets','rainTargets','sporeTargets','blizzardTargets','windImpactTargets'])
      if((a[key]||[]).some(v=>(typeof v==='string'?v:v.id)===u.id))return true;
    return false;
  }
  function plateAlpha(){return 1;}
  function unitStatuses(u){
    const rank=st=>DEBUFFS.has(st.kind)?10:st.kind==='wind_dome'?4:st.kind==='lightning_rod'?3:0;
    const list=[...u.statuses].sort((a,b)=>rank(b)-rank(a)).slice(0,3);
    if(state.auras[u.team])list.push({kind:"aura",icon:"◎",value:state.auras[u.team].value});
    return list.slice(0,4);
  }
  function statusRuneRect(u,index){
    const p=unitPlateRect(u);
    return {x:p.x+18+index*36,y:p.above?p.y-24:p.y+74,r:17,hitRadius:30};
  }
  function describeStatus(u,st){
    switch(st.kind){
      case "fear_turn":return {title:"Fear · This round only",detail:"Creeping Croc frightened "+u.name+". They skip their pending action this round. This Fear expires after that action or at round end; it never carries into the next round."};
      case "fear":return {title:"Fear · Jack the Lantern",detail:"30% chance to skip each turn for 3 rounds. "+Math.max(0,st.expiresRound-Math.max(state.round,st.startRound))+" rounds remain. One independent roll per turn. Reapplication is blocked until this debuff expires."};
      case "flow_state":return {title:"Flow State · Water blessing",detail:"Gain 1 extra mana on each of your next "+st.remaining+" turns: 1 bonus mana on top of normal regeneration or the current consecutive-pass bonus. Maximum mana is determined by your build. Skipping or saving mana still grants this bonus. Reapplying refreshes without stacking."};
      case "gunpowder_coat":return {title:"Gunpowder Coat · Fire reaction",detail:"A Fire spell hit triggers 150 extra explosion damage once per turn, up to 3 times. "+Math.max(0,st.expiresRound-state.round)+" turns remain; "+Math.max(0,3-(st.triggers||0))+" explosions remain. The coat stays after exploding. Burn ticks and other elements do not ignite it. Reapplying refreshes the coat without stacking."};
      case "wind_dome":return {title:"≋ Wind Dome · One spell block",detail:"Blocks every hit and on-hit effect of the next incoming damaging spell, then disappears. Misses and support spells preserve it. All damage caused by debuffs passes through without consuming it. Lasts until used; does not stack."};
      case "lightning_rod":return {title:"ϟ Lightning Rod · Charging rune",detail:(st.stored||0)+" stored Lightning casts · "+Math.round((st.stored||0)*100*(st.power||1))+" total damage. "+Math.min(5,Math.max(0,st.expiresRound-state.round+1))+" turns remain. Discharges at the end of Round "+st.expiresRound+", split across living enemies. Only successful casts by you or allies count; Lightning Rod itself does not. Recasting refreshes the timer and preserves charges."};
      case "decaying_strength":return {title:"☠ Decaying Strength · Debuff",detail:u.name+" takes 20% more damage from the next successful damaging spell. Includes every hit of that spell. Misses, healing and burn ticks do not consume it. Does not stack."};
      case "recharge":
        return {title:"⧖ Recharge · Debuff",
          detail:u.name+" must skip Round "+u.rechargeRound+
          " after using Poseidon's Wrath. The status expires once that round has passed."};
      case "stun":
        return {title:"⚡ Stunned · 1 action",
          detail:u.name+" is stunned and will lose their next eligible action"+
            (u.stunRound===state.round?" this round.":" next round.")+
            " A stun does not alter spell accuracy or deal additional damage."};
      case "frostbite":return {title:"❄ Frostbite · Ice damage over time",detail:u.name+" takes "+(st.value||50)+" damage at the start of each turn for "+(st.remaining||0)+" more turns ("+((st.value||50)*(st.remaining||0))+" damage remaining). Cannot be reapplied or combined with another debuff until it expires. Does not consume spell shields or Decaying Strength."};
      case "burn":
        return {title:"🔥 Burning · Fire damage over time",
          detail:u.name+" takes "+(st.value||50)+" damage at the start of each round for "+
            (st.remaining||0)+" more ticks. Cannot be reapplied until this debuff expires."};
      case "tailwind":
         return {title:"≋ Tailwind · Accuracy buff",
           detail:u.name+"'s next spell of ANY element gets +10 percentage points of accuracy (70% becomes 80%). Consumed on the next cast attempt, even on a miss. Does not stack."};
       case "tidal_echo":
        return {title:"≈ Tidal Echo · Water buff",
          detail:"The next SUCCESSFUL damaging Water spell from "+u.name+
          " deals +30% damage (1.30×). Earth spells do not use it; misses do not consume it. This bonus does not stack."};
      case "poison":return {title:"☠ Poison · Damage over time",detail:"Loses "+st.value+" HP at the start of each turn for "+st.remaining+" more turns. Cannot be reapplied or combined with another debuff until it expires."};
      case "freezing_temps":return {title:"❄ Freezing Temps · Ice mark",detail:"Next successful damaging Ice spell consumes this mark for a 50% freeze chance. Misses, other elements and damage-over-time ticks preserve it."};
      case "frozen":return {title:"❄ Frozen · Cannot cast",detail:"Skips up to 3 turns. Thaw rolls: 20%, then 40%, then 60% before each turn. Automatically thaws after the third frozen turn. Turns tested: "+(st.turnsTested||0)+"."};
      case "healing_aura":return {title:"❀ Healing Aura · Nature healing",detail:"Restores "+st.value+" HP at the start of each turn for "+st.remaining+" more turns: "+(st.value*st.remaining)+" HP remaining. Capped at maximum HP; cannot revive. Works alongside Calming Waters."};
      case "soul_drain":return {title:"☠ Soul Drain · Dark curse",detail:"Drains up to 100 HP at the start of each turn for "+st.remaining+" more turns and heals "+(getUnit(st.sourceId)?.name||"the caster")+" by the HP actually drained. Healing is capped at maximum HP and cannot revive. Does not consume spell-only effects."};
      case "turbulence":return {title:"≋ Turbulence · Wind curse",detail:"Subtracts 50 accuracy points on the next spell: 80% becomes 30% accuracy (70% failure). Combines immediately with Static Shock and other accuracy effects; there is no waiting order. Consumed on the next cast attempt, even if it misses. Does not stack."};
      case "blazing_rage":return {title:"♨ Blazing Rage · Fire blessing",detail:"Next successful damaging spell deals 20% more damage, including all hits and targets. Misses, healing, support spells and damage-over-time ticks preserve it. Does not stack."};
      case "thorny_wrap":return {title:"❧ Thorny Wrap · Nature curse",detail:"Thorny vines deal 150 damage whenever "+u.name+" attempts any spell, whether it succeeds or misses. −15 percentage points of accuracy while attached. "+Math.max(0,st.expiresRound-state.round)+" turns remain. Skipped turns do not trigger damage. Refreshes without stacking; damage bypasses spell shields."};
      case "static_shock":return {title:"ϟ Static Shock · Lightning curse",detail:"−30 percentage points of spell accuracy for "+Math.max(0,st.expiresRound-state.round)+" more turns. The first missed spell triggers 100 damage and removes this curse. Successful spells do not consume it. Does not stack."};
      case "calming_waters":return {title:"≈ Calming Waters · Healing",detail:"Restores "+st.value+" HP at the start of each turn for "+st.remaining+" more turns. "+(st.value*st.remaining)+" HP remaining. Refreshes without stacking; cannot revive or exceed maximum HP."};
      case "solidity":return {title:"◆ Solidity · Earth protection",detail:"Reduces all hits of the next successful damaging spell by 25%. Misses, burn and Frostbite do not consume it. Does not stack."};
      case "shield":return {title:"⬡ Shield",detail:"Reduces the next incoming hit by "+
        Math.round(st.value*100)+"%, then disappears."};
      case "blade":return {title:"✦ Damage boost",detail:"The next successful attack deals "+
        Math.round(st.value*100)+"% bonus damage."};
      case "trap":return {title:"◈ Trap",detail:"The next damaging hit against this combatant deals "+
        Math.round(st.value*100)+"% bonus damage."};
      case "aura":return {title:"◎ Team aura",detail:"Team damage is boosted by "+
        Math.round(st.value*100)+"% while the aura remains."};
      default:return {title:st.kind,detail:"Active magical effect."};
    }
  }
  function showStatusInfo(u,st){
    const info=describeStatus(u,st);
    state.inspectedStatus={unitId:u.id,kind:st.kind};
    ui.statusName.textContent=info.title;
    ui.statusText.textContent=info.detail;
    ui.statusPopup.hidden=false;
  }
  function closeStatusInfo(){
    if(!state)return;
    state.inspectedStatus=null;
    ui.statusPopup.hidden=true;
  }
  function hitStatusRune(x,y){
    let closest=null,distance=Infinity;
    for(const u of state.units){if(u.hp<=0||plateAlpha(u)<.1)continue;
      for(const [i,st] of unitStatuses(u).entries()){
        const r=statusRuneRect(u,i),d=Math.hypot(x-r.x,y-r.y);
        if(d<=r.hitRadius&&d<distance){closest={u,st};distance=d;}
      }
    }
    if(!closest)return false;showStatusInfo(closest.u,closest.st);return true;
  }
  function drawDeathRune(ctx,x,y,color){
    ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.lineCap="round";
    // A drawn death seal stays legible on mobile without depending on an emoji font.
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-8,side*8);ctx.lineTo(8,-side*8);ctx.stroke();}
    pathPoly(ctx,[[-6,-6],[-3,-9],[3,-9],[6,-6],[6,0],[3,3],[3,7],[-3,7],[-3,3],[-6,0]],color);
    ctx.fillStyle="#151023";ctx.beginPath();ctx.ellipse(-2.7,-2,1.6,2,-.2,0,Math.PI*2);ctx.ellipse(2.7,-2,1.6,2,.2,0,Math.PI*2);ctx.fill();
    pathPoly(ctx,[[0,0],[-1.4,3],[1.4,3]],"#151023");
    ctx.strokeStyle="#38233d";ctx.lineWidth=1;for(const dx of [-1,1]){ctx.beginPath();ctx.moveTo(dx,4);ctx.lineTo(dx,7);ctx.stroke();}ctx.restore();
  }
  function drawUnitPlate(u){
    const {x,y,w}=unitPlateRect(u);
    g.save();
    const disabled=u.hp<=0;
    const opacity=plateAlpha(u);if(opacity<=.001){g.restore();return;}
    g.globalAlpha=(disabled?.66:1)*opacity;
    const tint=u.team?"#865563":"#3f96a7";
    rounded(g,x,y,w,26,6,"#061621eb",tint,1.3);
    g.fillStyle=disabled?"#ab9e9e":"#e9f6f2";
    g.font="700 18px system-ui,sans-serif";
    g.textAlign="center";g.textBaseline="middle";
    const masteries=u.masteries||[],iconSpace=masteries.length*23;
    g.fillText(u.name,x+(w-iconSpace)/2,y+13,w-iconSpace-10);
    const colors={water:'#65d9f2',earth:'#d7ba8c',lightning:'#f8df79',nature:'#8ce4a2',wind:'#c8f6ed',dark:'#c5a2ff',fire:'#ffaf81',ice:'#c3f5ff'};
    masteries.forEach((school,i)=>{g.strokeStyle=colors[school]||'#fff';window.WIZARDRY_ELEMENT_TRACE_V45?.drawSymbol(g,school,x+w-iconSpace+12+i*23,y+13,20);});
    rounded(g,x+2,y+30,w-4,12,4,"#101b27eb");
    if(u.hp>0)rounded(g,x+3,y+31,(w-6)*clamp(u.hp/u.maxHp,0,1),
      10,3,u.team?"#cc7364":"#66d8a0");
    g.save();
    g.font="900 15px system-ui,sans-serif";
    g.fillStyle="#ffffff";g.strokeStyle="#06121b";g.lineWidth=3;g.lineJoin="round";
    const hpText=disabled?"K.O.":u.hp+" / "+u.maxHp+" HP";
    g.strokeText(hpText,x+w/2,y+50,w-4);
    g.fillText(hpText,x+w/2,y+50,w-4);
    g.restore();
    // Persistent magic runes sit BELOW the HP plate, never over the
    // fighter's face. Each rune is independently tappable for details.
    const symbols=unitStatuses(u);
    symbols.forEach((st,i)=>{
      const r=statusRuneRect(u,i);
      const glow=st.kind==="lightning_rod"?"#91d8ff":st.kind==="tidal_echo"?"#44dbee":
        st.kind==="stun"?"#98dfff":
        st.kind==="recharge"?"#e6b75b":
        st.kind==="burn"?"#ff9258":st.kind==="decaying_strength"?"#d39bd5":st.kind==="frostbite"?"#99e9ff":"#b4eac2";
      ellipse(g,r.x,r.y,17,17,"#071d2dec",glow,2);
      g.fillStyle=glow;g.font="bold 23px system-ui,sans-serif";
      g.textAlign="center";g.textBaseline="middle";
      if(st.kind==="gunpowder_coat")window.WIZARDRY_GUNPOWDER_V120?.emblem(g,r.x,r.y,20);
      else if(st.kind==="wind_dome")window.WIZARDRY_WIND_DOME_V101?.emblem(g,r.x,r.y,21);
      else if(st.kind==="lightning_rod"){window.WIZARDRY_ROD_V98?.emblem(g,r.x,r.y,21);g.font="bold 9px system-ui";g.fillStyle="#fff2ae";g.fillText(String(st.stored||0),r.x+10,r.y+10);}
      else if(st.kind==="frostbite"){
        g.save();g.translate(r.x,r.y);g.strokeStyle="#b6eeff";g.lineWidth=1.5;
        for(let arm=0;arm<6;arm++){g.save();g.rotate(arm*Math.PI/3);g.beginPath();g.moveTo(0,0);g.lineTo(0,-9);g.moveTo(0,-5);g.lineTo(-3,-7);g.moveTo(0,-5);g.lineTo(3,-7);g.stroke();g.restore();}g.restore();
      }else if(st.kind==="freezing_temps"||st.kind==="frozen")window.WIZARDRY_FREEZING_TEMPS_V93?.emblem(g,r.x,r.y,18);
      else if(st.kind==="healing_aura")window.WIZARDRY_HEALING_AURA_V92?.emblem(g,r.x,r.y,18);
      else if(st.kind==="soul_drain")window.WIZARDRY_SOUL_DRAIN_V91?.emblem(g,r.x,r.y,18);
      else if(st.kind==="turbulence")window.WIZARDRY_TURBULENCE_V90?.emblem(g,r.x,r.y,18);
      else if(st.kind==="blazing_rage")window.WIZARDRY_BLAZING_RAGE_V89?.emblem(g,r.x,r.y,18);
      else if(st.kind==="static_shock")window.WIZARDRY_STATIC_SHOCK_V88?.emblem(g,r.x,r.y,18);
      else if(st.kind==="flow_state")window.WIZARDRY_FLOW_STATE_V121?.emblem(g,r.x,r.y,18);
      else if(st.kind==="calming_waters")window.WIZARDRY_CALMING_WATERS_V87?.emblem(g,r.x,r.y,18);
      else if(st.kind==="solidity")window.WIZARDRY_SOLIDITY_V86?.emblem(g,r.x,r.y,18);
      else if(st.kind==="decaying_strength")drawDeathRune(g,r.x,r.y,glow);
      else g.fillText(st.icon,r.x,r.y+1);
    });
    g.restore();
  }
  function drawTargetArrow(u,time){
    if(!u||u.hp<=0)return;
    const scale=lerp(.60,.90,clamp((u.y-288)/235,0,1));
    const modelHeight=218;
    const tipY=clamp(u.y-modelHeight*scale-12,45,H-55)+
      Math.sin(time*.006)*3;
    g.save();g.translate(u.x,tipY);
    g.shadowColor="#f4c768";g.shadowBlur=15;
    // Single unmistakable DOWN arrow, floating just above the target head.
    pathPoly(g,[[-5,-33],[5,-33],[5,-13],[15,-13],
      [0,9],[-15,-13],[-5,-13]],"#f5d075","#fff3bb",1.9);
    g.shadowBlur=0;
    g.restore();
  }
  function renderSprite(kind,index,x,base,size,target,progress=0){
    const arr=spriteCache[kind];
    if(!arr||!arr.every(im=>im.complete&&im.naturalWidth))return false;
    const row=Math.floor(index/4),cell=index%4;
    const edges=[0,314,627,940,1254],top=row===0||row===3?314:313;
    // Only temporary spell creatures face the currently selected target:
    // mirror the approved low-poly animation for a LEFT target and apply a
    // mild perspective yaw for its depth lane. The original source PNG
    // pixels, order and hand-to-projectile release are NEVER edited.
    const direction=target&&target.x<x?-1:1;
    const dy=target?target.y-base:0;
    const dx=target?Math.max(180,Math.abs(target.x-x)):300;
    const yaw=clamp(dy/dx*.16,-.085,.085)*ease(progress/.19);
    g.save();g.translate(x,0);g.scale(direction,1);
    g.transform(.98,0,yaw,1,0,0);
    g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
    g.drawImage(arr[row],edges[cell],0,edges[cell+1]-edges[cell],top,
      -size/2,base-size,size,size);
    g.restore();return true;
  }
  // Both artworks are literal frames from the approved summon animation.
  // Poseidon frame 7 shows him gripping the raised trident.
  function drawCardArts(){
    const cards=[...ui.hand.children];
    for(const b of cards){
      if(b.hidden)continue;
      const card=BY_ID[b.dataset.card];
      const canvas=b.querySelector?.(".spell-art-canvas");
      if(!card||!canvas)continue;
      const c=canvas.getContext("2d");if(!c)continue;
      const shell=canvas.parentElement,rect=shell.getBoundingClientRect();
      const width=Math.max(1,rect.width||240),height=Math.max(1,rect.height||196);
      const ratio=Math.min(window.devicePixelRatio||1,2);
      const pixelW=Math.round(width*ratio),pixelH=Math.round(height*ratio);
      if(canvas.width!==pixelW||canvas.height!==pixelH){canvas.width=pixelW;canvas.height=pixelH;}
      c.setTransform(ratio,0,0,ratio,0,0);
      const water=card.school==="water",nature=card.school==="nature";
      c.clearRect(0,0,width,height);
      const sky=c.createLinearGradient(0,0,0,height),wind=card.school==="wind",
        dark=card.school==="dark",fire=card.school==="fire",ice=card.school==="ice";
      sky.addColorStop(0,ice?"#9cdeeb":fire?"#983c2a":dark?"#5a243a":wind?"#638f97":nature?"#486d4d":water?"#155473":"#5e5143");
      sky.addColorStop(.55,ice?"#326c92":fire?"#583024":dark?"#342039":wind?"#2f505b":nature?"#203c37":water?"#0b3049":"#2c3032");
      sky.addColorStop(1,ice?"#112b4b":fire?"#2a1a1a":dark?"#170e28":wind?"#152b39":nature?"#10292c":water?"#061c30":"#171d28");
      c.fillStyle=sky;c.fillRect(0,0,width,height);
      c.save();c.globalAlpha=.17;c.fillStyle=water?"#4dd4ed":"#dbc489";
      c.beginPath();c.moveTo(0,0);c.lineTo(width*.36,0);
      c.lineTo(width*.11,height*.64);c.lineTo(0,height*.82);c.closePath();c.fill();
      c.beginPath();c.moveTo(width*.76,0);c.lineTo(width,0);
      c.lineTo(width,height*.68);c.lineTo(width*.82,height*.44);c.closePath();c.fill();
      c.restore();
      // All card artwork shares the same visible-bounds contain fit.
      // The battlefield renderers keep their independent sprite anchors.
      if(card.id==="croc")window.WIZARDRY_CROC_V134?.portrait(c,width,height);
      else if(card.id==="jack")window.WIZARDRY_JACK_V129?.portrait(c,width,height);
      else if(card.id==="windfist")window.WIZARDRY_WIND_FIST_V123?.portrait(c,width,height);
      else if(card.id==="flowstate")window.WIZARDRY_FLOW_STATE_V121?.portrait(c,width,height);
      else if(card.id==="gunpowderkiss")window.WIZARDRY_GUNPOWDER_V120?.portrait(c,width,height);
      else if(card.id==="zeus")window.WIZARDRY_ZEUS_V119?.portrait(c,width,height);
      else if(card.id==="kineticsand")window.WIZARDRY_KINETIC_SAND_V112?.portrait(c,width,height);
      else if(card.id==="thornwrap"){c.save();c.translate(width*.5,height*.94);c.scale(width/130,height/180);drawThornyVine(c,{x:0,y:0},1,0,"back");drawThornyVine(c,{x:0,y:0},1,0,"front");c.restore();}
      else if(card.id==="blizzard"){c.save();c.scale(width/1000,height/620);drawBlizzardWind(c,.53,{x:100,y:440},{x:740,y:450},0);c.restore();}
      else if(card.id==="penguins")drawPenguinPortrait(c,width,height);
      else if(card.id==="ronin")window.WIZARDRY_WIND_SLASHES_V81?.drawPortrait(c,width,height);
      else if(card.id==="arrows")window.WIZARDRY_FLAMING_ARROWS_V80?.drawPortrait(c,width,height);
      else window.WIZARDRY_CARD_ART_V70?.draw(card.id,c,width,height);

    }
  }
  function setupSprites(){
    for(const [kind,prop] of [["poseidon","WIZARDRY_POSEIDON_V22_ROWS"],
                               ["golem","WIZARDRY_GOLEM_V23_ROWS"]]){
      const sources=window[prop];
      if(!Array.isArray(sources)||sources.length!==4)continue;
      spriteCache[kind]=sources.map(src=>{
        const image=new Image();
        image.onload=()=>drawCardArts();
        image.src=src;return image;
      });
    }
    // Redraw once after all atlas references are installed, including
    // browsers that fire a cached data-image load event synchronously.
    window.WIZARDRY_PROFESSOR_V49?.onReady(drawCardArts);
    window.WIZARDRY_LADY_ESTEL_V51?.onReady(drawCardArts);
    // The approved wind atlas loads asynchronously; redraw its fifth card
    // from the same art asset used for the battlefield animation.
    window.WIZARDRY_TORNADO_V54?.onReady(drawCardArts);
    window.WIZARDRY_VAMPIRE_V57?.onReady(drawCardArts);
    window.WIZARDRY_BABY_DRAGON_V61?.onReady(drawCardArts);
    window.WIZARDRY_CARD_ART_V70?.onReady(drawCardArts);
    window.WIZARDRY_SCORPION_V94?.onReady(drawCardArts);
    window.WIZARDRY_OCTO_V95?.onReady(drawCardArts);
    window.WIZARDRY_DEVIL_V96?.onReady(drawCardArts);
    window.WIZARDRY_BLOOM_V97?.onReady(drawCardArts);
    window.WIZARDRY_ROD_V98?.onReady(drawCardArts);
    window.WIZARDRY_UNDEAD_V99?.onReady(drawCardArts);
    window.WIZARDRY_CENTAUR_V100?.onReady(drawCardArts);
    window.WIZARDRY_CROC_V134?.onReady(drawCardArts);
    window.WIZARDRY_JACK_V129?.onReady(drawCardArts);
    window.WIZARDRY_WIND_FIST_V123?.onReady(drawCardArts);
    window.WIZARDRY_FLOW_STATE_V121?.onReady(drawCardArts);
    window.WIZARDRY_GUNPOWDER_V120?.onReady(drawCardArts);
    window.WIZARDRY_ZEUS_V119?.onReady(drawCardArts);
    window.WIZARDRY_KINETIC_SAND_V112?.onReady(drawCardArts);
    window.WIZARDRY_PENGUINS_V103?.onReady(drawCardArts);
    if(typeof ResizeObserver!=="undefined"){
      const observer=new ResizeObserver(()=>requestAnimationFrame(drawCardArts));
      observer.observe(ui.hand);
    }
    window.addEventListener("resize",()=>requestAnimationFrame(drawCardArts));
    requestAnimationFrame(drawCardArts);
  }
  // Normalized original 16-cell timing for the ALREADY APPROVED Poseidon art.
  // This preserves the exact right-hand windup and empty-hand release.
  const POSEIDON_KEY_TIMES=[.06,.30,.53,.73,.90,1.17,1.41,1.62,
    1.80,2.04,2.26,2.48,2.80,3.24,3.59,4.00].map(t=>t/4.47);
  function approvedPoseidonIndex(progress){
    let i=0;
    while(i<15&&progress>=POSEIDON_KEY_TIMES[i+1])i++;
    return i;
  }

  // The source is exactly where the original Golem slams the arena;
  // the 8-frame rock wave has its own world-space travel clock.
  function beginGolemTravel(anim){
    const target=getUnit(anim.target);
    const direction=(target?.x??700)>=500?1:-1;
    const start={x:500+direction*112,y:462};
    const end=target?{x:target.x,y:target.y+8}:start;
    const distance=Math.hypot(end.x-start.x,end.y-start.y);
    const duration=clamp(distance/GOLEM_SPEED_PX_PER_MS,
      GOLEM_MIN_TRAVEL_MS,GOLEM_MAX_TRAVEL_MS);
    anim.travelStart=start;anim.travelEnd=end;
    anim.golemPostSlamMs=0;
    startStage(anim,"golem-travel",duration);
  }
  function beginEstelTravel(anim){
    const target=getUnit(anim.target);
    const direction=(target?.x??320)>=500?1:-1;
    // The orb forms beside Lady Estel's extended hand.
    const start={x:500+direction*88,y:204};
    const end=target?{x:target.x,y:target.y-82}:start;
    const pixels=Math.hypot(end.x-start.x,end.y-start.y);
    anim.estelOrbStart=start;anim.estelOrbEnd=end;
    const duration=clamp(pixels/ESTEL_ORB_SPEED_PX_PER_MS,
      ESTEL_TRAVEL_MIN_MS,ESTEL_TRAVEL_MAX_MS);
    startStage(anim,"estel-travel",duration);
  }
  function drawAction(anim,time){
    const p=clamp(anim.elapsed/anim.duration,0,1),caster=getUnit(anim.source),
      target=getUnit(anim.target),card=anim.card;
    if(!caster)return;
    const baseX=500,baseY=470;
    g.save();
    if(card.id==="dragon"){
      window.WIZARDRY_BABY_DRAGON_V61?.draw(g,{
        stage:anim.stage,progress:p,time,caster,target,
        splashTargets:(anim.dragonSplashIds||[]).map(getUnit).filter(Boolean)
      });
      g.restore();return;
    }
    if(card.id==="vampire"){
      window.WIZARDRY_VAMPIRE_V57?.draw(g,{
        stage:anim.stage,progress:p,time,caster,target
      });
      g.restore();return;
    }
    if(card.id==="wind"){
      window.WIZARDRY_TORNADO_V54?.draw(g,{
        stage:anim.stage,progress:p,time,
        targets:anim.windImpactTargets||alive(1-caster.team)
      });
      g.restore();return;
    }
    if(card.id==="volt"){
      window.WIZARDRY_PROFESSOR_V49?.draw(g,{progress:p,time,target});
      g.restore();return;
    }
    if(card.id==="estel"){
      // The goddess, floating orb and contact impact use independent
      // stages. Never use the old beam animation or heal early.
      window.WIZARDRY_LADY_ESTEL_V51?.draw(g,{
        stage:anim.stage,progress:p,time,target,
        start:anim.estelOrbStart,end:anim.estelOrbEnd
      });
      g.restore();return;
    }
    if(card.id==="scorpion"){window.WIZARDRY_SCORPION_V94?.draw(g,{progress:p,target});g.restore();return;}
    if(card.id==="freezing"){window.WIZARDRY_FREEZING_TEMPS_V93?.draw(g,{progress:p,target});g.restore();return;}
    if(card.id==="healingaura"){window.WIZARDRY_HEALING_AURA_V92?.draw(g,{progress:p,targets:alive(caster.team)});g.restore();return;}
    if(card.id==="soul"){window.WIZARDRY_SOUL_DRAIN_V91?.draw(g,{progress:p,target,caster});g.restore();return;}
    if(card.id==="turbulence"){window.WIZARDRY_TURBULENCE_V90?.draw(g,{progress:p,target});g.restore();return;}
    if(card.id==="rage"){window.WIZARDRY_BLAZING_RAGE_V89?.draw(g,{progress:p,target});g.restore();return;}
    if(card.id==="static"){window.WIZARDRY_STATIC_SHOCK_V88?.draw(g,{progress:p,target});g.restore();return;}
    if(card.id==="flowstate"){window.WIZARDRY_FLOW_STATE_V121?.draw(g,{progress:p,target:caster});g.restore();return;}
    if(card.id==="calming"){window.WIZARDRY_CALMING_WATERS_V87?.draw(g,{progress:p,target});g.restore();return;}
    if(card.id==="solidity"){window.WIZARDRY_SOLIDITY_V86?.draw(g,{progress:p,target});g.restore();return;}
    if(card.kind==="summon"){
      const idx=card.id==="poseidon"?approvedPoseidonIndex(p):clamp(Math.floor(p*16),0,15);
      const done=renderSprite(card.id,idx,500,470,310,target,p);
      if(!done){
        const col=card.id==="poseidon"?"#66daf0":"#96b97e";
        ellipse(g,500,392,65+Math.sin(time*.006)*6,18,col+"66",col,3);
        g.font="bold 22px system-ui";g.fillStyle=col;g.textAlign="center";
        g.fillText(card.name,500,337);
      }
      // Poseidon's flying trident is now a separate depth-sorted object.
    }else{
      if(target&&card.target!=="team"){
        const x=lerp(500,target.x,ease(p)),y=lerp(340,target.y-100,ease(p));
        if(card.kind==="damage"){
          line(g,500,340,x,y,"#66e2f1",9);
          ellipse(g,x,y,15,26,"#9bebff","#efffff",2);
        }else{
          const ring=ease(p);
          ellipse(g,target.x,target.y-18,20+ring*70,8+ring*27,
            null,card.school==="earth"?"#dbbd7c":"#80eacb",4-ring*2);
        }
      }else if(card.kind==="aura"){
        ellipse(g,500,400,100+p*290,45+p*100,null,"#91e8d5",6*(1-p)+1);
      }
    }
    if(anim.applied&&p<.86&&target){
      const pp=(p-card.hit)/(.86-card.hit),radius=20+pp*105;
      ellipse(g,target.x,target.y-112,radius,radius*.42,null,
        card.school==="earth"?"#caff9f":"#b9f9ff",Math.max(.5,4*(1-pp)));
    }
    g.restore();
  }
  function poseidonProjectileAt(anim){
    if(!anim||anim.card?.id!=="poseidon"||anim.stage!=="summon")return null;
    const target=getUnit(anim.target);
    if(!target||target.hp<=0)return null;
    const p=clamp(anim.elapsed/anim.duration,0,1);
    const release=POSEIDON_KEY_TIMES[10];
    if(p<release||p>=anim.card.hit)return null;
    const t=ease((p-release)/(anim.card.hit-release));
    const originX=target.x>=500?550:450,originY=284;
    const direction=target.x>=500?1:-1;
    return {
      x:lerp(originX,target.x,t),
      y:lerp(originY,target.y-105,t)-38*Math.sin(Math.PI*t),
      angle:Math.atan2(target.y-105-originY,target.x-originX),
      direction,
      // Follow the projectile's projected arena floor depth, not a
      // permanent background layer or its elevated screen Y coordinate.
      depthY:lerp(471,target.y+12,t)
    };
  }
  function drawPoseidonProjectile(p){
    if(!p)return;
    g.save();
    line(g,p.x-p.direction*70,p.y+15,p.x,p.y,"#3acfe3",18);
    line(g,p.x-p.direction*38,p.y+7,p.x,p.y,"#d3fdff",5);
    drawFlyingTrident(p.x,p.y,p.angle);
    g.restore();
  }
  function drawFlyingTrident(x,y,angle){
    g.save();g.translate(x,y);g.rotate(angle);
    line(g,-60,0,37,0,"#d4b968",7);
    pathPoly(g,[[37,-20],[72,-8],[61,0],[72,8],[37,20],[45,3],[28,2],[45,-3]],
      "#e3c468","#ffed9f",2);
    pathPoly(g,[[43,-6],[59,0],[43,6],[35,0]],"#54e4f0");
    g.restore();
  }
  function drawAirborneRune(a){
    if(!a||a.stage!=="tracing-auto")return;
    // The active element glyph is hand-traced by a bright magical tip:
    // gold sparks shower from the traced line and swirl in circular arcs.
    // All sparks stop IMMEDIATELY when rune success/failure resolves.
    window.WIZARDRY_ELEMENT_TRACE_V45?.draw(g,{
      school:a.card.school,elapsed:a.elapsed,duration:a.duration,
      centerX:500,centerY:410,scale:5.55
    });
  }
  function drawRuneOutcome(a){
    if(!a||!["rune-success","rune-fail"].includes(a.stage))return;
    window.WIZARDRY_ELEMENT_TRACE_V45?.drawOutcome(g,{
      school:a.card.school,
      result:a.stage==="rune-success"?"success":"fail",
      elapsed:a.elapsed,duration:a.duration,
      centerX:500,centerY:410,scale:5.55
    });
  }
  function drawFizzle(a){
    if(!a||a.stage!=="fizzle")return;
    const c=getUnit(a.source);if(!c)return;
    const progress=a.elapsed/a.duration;
    const centerX=500,centerY=410;
    g.save();g.globalAlpha=Math.max(0,1-progress);
    ellipse(g,centerX,centerY,17+progress*77,17+progress*29,
      null,"#ef9e9f",3);
    line(g,centerX-20,centerY-20,centerX+20,centerY+20,"#faa9aa",3);
    line(g,centerX+20,centerY-20,centerX-20,centerY+20,"#faa9aa",3);
    g.restore();
  }
  function render(time){
    const bounds=canvas.getBoundingClientRect(),vw=Math.max(1,bounds.width),vh=Math.max(1,bounds.height),ratio=Math.min(window.devicePixelRatio||1,2);
    const pw=Math.round(vw*ratio),ph=Math.round(vh*ratio);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
    g.setTransform(ratio,0,0,ratio,0,0);g.fillStyle='#06151f';g.fillRect(0,0,vw,vh);
    const fieldHeight=Math.max(1,vh-30),sceneHeight=state.size>1?730:H,fit=Math.min(vw/W,fieldHeight/sceneHeight);
    camera={scale:fit,x:(vw-W*fit)/2,y:(fieldHeight-sceneHeight*fit)/2};
    // Keep the painted diamond (image Y=414) under the world summon point
    // while reserving visible space below front-row feet for attached labels.
    if(background){const diamondY=camera.y+480*fit,cover=Math.max(vw/W,vh/H,diamondY/414,(vh-diamondY)/(H-414));g.drawImage(background,(vw-W*cover)/2,diamondY-414*cover,W*cover,H*cover);}
    g.setTransform(ratio*fit,0,0,ratio*fit,ratio*camera.x,ratio*camera.y);
    const quake=state.animation?.card?.id==="zeus"&&state.animation.stage==="summon"?window.WIZARDRY_ZEUS_V119?.shake(clamp(state.animation.elapsed/state.animation.duration,0,1)):state.animation?.card?.id==="kineticsand"&&state.animation.stage==="summon"?sandGripShake(clamp(state.animation.elapsed/state.animation.duration,0,1)):state.animation?.card?.id==="bender"?window.WIZARDRY_STONE_BENDER_V83?.cameraShake({stage:state.animation.stage,progress:clamp(state.animation.elapsed/state.animation.duration,0,1)}):state.animation?.card?.id==="centaur"&&state.animation.stage==="summon"?window.WIZARDRY_CENTAUR_V100?.impactKick(clamp(state.animation.elapsed/state.animation.duration,0,1)):null;
    if(quake&&(quake.x||quake.y)){g.translate(W/2,H/2);g.scale(1.012,1.012);g.translate(-W/2+quake.x,-H/2+quake.y);}
    if(!background)drawBackground(g);
    if(state.auras[0])ellipse(g,500,465,388,107,"#3fd5ce0b","#4debdc66",4);
    if(state.auras[1])ellipse(g,500,321,347,96,"#d5c65f0b","#eed88466",4);
    // Render environmental VFX first. Movable summons and airborne
    // projectiles share a depth-sorted pass with the actual fighters.
    const action=state.animation;
    const vampStages=["vamp-rise","vamp-open","vamp-lunge","vamp-drain",
      "vamp-return","vamp-present","vamp-orb","vamp-vanish"];
    if(action){
      const a=action,effects=window.WIZARDRY_GOLEM_EFFECTS_V42;
      if(["golem-slam","golem-travel","golem-impact"].includes(a.stage)){
        effects?.drawGolem(g,a,spriteCache.golem,time);
        if(a.stage==="golem-travel")effects?.drawTravel(g,a);
        if(a.stage==="golem-impact")effects?.drawImpact(g,a);
      }else if(a.card.id==="vampire"&&vampStages.includes(a.stage)){
        // Vampire layers are inserted among wizard bodies below.
      }else if(a.card.id==="dragon"&&
        ["dragon-drop","dragon-land","dragon-charge","dragon-shot",
         "dragon-splash","dragon-impact","dragon-exit"].includes(a.stage)){
        // Dragon and its projectile use the shared world depth sorter.
      }else if(a.stage==="summon"&&(["croc","jack","windfist","gunpowderkiss","zeus","kineticsand","thornwrap","blizzard","penguins","scorpion","octo","devil","bloom","rod","undead","centaur","winddome"].includes(a.card.id)||["flowstate","shield","regen","teamregen","rage","static","turbulence","souldrain","freezing"].includes(a.card.kind))){
        // Attached effects and the scorpion share the fighter depth sorter below.
      }else if(a.stage==="summon"||
          a.card.id==="estel"&&
            ["estel-summon","estel-travel","estel-impact","estel-exit"].includes(a.stage)||
          a.card.id==="wind"&&
            ["wind-summon","wind-volley","wind-impact","wind-dissolve"].includes(a.stage))
        drawAction(a,time);
      else{
        drawAirborneRune(a);
        drawRuneOutcome(a);
        drawFizzle(a);
      }
    }
    const sorted=[...state.units].sort((a,b)=>a.y-b.y);
    const renderables=sorted.map(u=>({
      type:"wizard",depthY:u.y,priority:1,draw:()=>drawUnit(u,time)
    }));
    for(const u of sorted){
      if(u.hp<=0)continue;
      if(u.statuses.some(st=>st.kind==="gunpowder_coat"&&state.round<st.expiresRound))renderables.push({type:"gunpowder-coat",depthY:u.y+.12,priority:2,draw:()=>window.WIZARDRY_GUNPOWDER_V120?.drawCoat(g,{target:u,time})});
      const growing=action?.card?.id==="thornwrap"&&action.stage==="summon"&&action.target===u.id;
      const wrapped=u.statuses.some(st=>st.kind==="thorny_wrap"&&state.round<st.expiresRound);
      if(growing||wrapped){
        const progress=growing?clamp(action.elapsed/action.duration/.85,0,1):1;
        for(const layer of ["back","front"])renderables.push({type:"thornwrap-"+layer,depthY:u.y+(layer==="back"?-.06:.06),priority:2,draw:()=>drawThornyVine(g,u,progress,time,layer)});
      }
      const cast=action?.card?.id==="winddome"&&action.stage==="summon"&&action.source===u.id;
      if(cast||u.statuses.some(st=>st.kind==="wind_dome")){
        const opts={target:u,time,mode:cast?"cast":"active",progress:cast?clamp(action.elapsed/action.duration,0,1):1};
        for(const layer of ["back","front"])renderables.push({type:"wind-dome-"+layer,depthY:u.y+(layer==="back"?-.05:.05),priority:2,draw:()=>window.WIZARDRY_WIND_DOME_V101?.draw(g,{...opts,layer})});
      }
    }
    for(const burst of state.windDomeBursts||[]){const u=getUnit(burst.targetId);if(!u||u.hp<=0)continue;
      for(const layer of ["back","front"])renderables.push({type:"wind-dome-block-"+layer,depthY:u.y+(layer==="back"?-.05:.05),priority:2,draw:()=>window.WIZARDRY_WIND_DOME_V101?.draw(g,{target:u,time,mode:"block",age:burst.age,layer})});
    }
    if(action?.stage==="summon"&&["flowstate","shield","regen","teamregen","rage","static","turbulence","souldrain","freezing"].includes(action.card.kind)){
      const caster=getUnit(action.source),target=getUnit(action.target),targets=action.card.target==="team"?alive(caster.team):[target].filter(Boolean);
      const depth=(targets.length?Math.max(...targets.map(t=>t.y)):480)+.1;
      renderables.push({type:"attached-spell",depthY:depth,priority:2,draw:()=>drawAction(action,time)});
    }
    if(action?.card?.id==="croc"&&action.stage==="summon"){
      const opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target)};
      const spell=window.WIZARDRY_CROC_V134;
      if(spell)for(const layer of ["water","actor","splash","impact"])
        renderables.push({type:"croc-"+layer,depthY:spell.depthFor(opts,layer),priority:2,draw:()=>spell.draw(g,{...opts,layer})});
    }
    if(action?.card?.id==="jack"&&action.stage==="summon"){
      const opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target)};
      const spell=window.WIZARDRY_JACK_V129;
      if(spell)for(const layer of ["ground","actor","crow0","crow1","crow2","impact"])
        renderables.push({type:"jack-"+layer,depthY:spell.depthFor(opts,layer),priority:2,draw:()=>spell.draw(g,{...opts,layer})});
    }
    if(action?.card?.id==="windfist"&&action.stage==="summon"){
      const opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target),releases:WIND_FIST_RELEASES};
      const spell=window.WIZARDRY_WIND_FIST_V123;
      if(spell){
        for(const layer of ["ground","actor"])renderables.push({type:"wind-fist-"+layer,depthY:layer==="ground"?479.8:480,priority:2,draw:()=>spell.draw(g,{...opts,layer})});
        for(let i=0;i<10;i++)for(const layer of ["fist","impact"])renderables.push({type:"wind-fist-"+layer+i,depthY:spell.depthFor({...opts,index:i,layer}),priority:2,draw:()=>spell.draw(g,{...opts,index:i,layer})});
      }
    }
    if(action?.card?.id==="penguins"&&action.stage==="summon"){
      const opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target),caster:getUnit(action.source)};
      for(const layer of ["ground","actor0","actor1","actor2","kunai","impact"])
        renderables.push({type:"penguins-"+layer,depthY:penguinDepth(opts,layer),priority:2,draw:()=>drawPenguins(g,{...opts,layer})});
    }
    if(action?.card?.id==="centaur"&&action.stage==="summon"){
      const centaur=window.WIZARDRY_CENTAUR_V100,opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target)};
      if(centaur)for(const layer of ["ground","actor","arrow","impact"])renderables.push({type:"centaur-"+layer,depthY:centaur.depthFor(opts,layer),priority:2,draw:()=>centaur.draw(g,{...opts,layer})});
    }
    if(action?.card?.id==="undead"&&action.stage==="summon"){
      const undead=window.WIZARDRY_UNDEAD_V99,opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target)};
      if(undead)for(const layer of ["ground","actor","claws"])renderables.push({type:"undead-"+layer,depthY:undead.depthFor(opts,layer),priority:2,draw:()=>undead.draw(g,{...opts,layer})});
    }
    if(action?.card?.id==="rod"&&action.stage==="summon"){
      const rod=window.WIZARDRY_ROD_V98,opts={progress:clamp(action.elapsed/action.duration,0,1),caster:getUnit(action.source)};
      if(rod)for(const layer of ["rod","arc"])renderables.push({type:"lightning-rod-"+layer,depthY:layer==="arc"?opts.caster.y+.1:480,priority:2,draw:()=>rod.draw(g,{...opts,layer})});
    }
    for(const burst of state.rodBursts||[])for(const target of burst.targets)renderables.push({type:"rod-discharge",depthY:target.y+.1,priority:2,draw:()=>window.WIZARDRY_ROD_V98?.discharge(g,burst,target)});
    for(const burst of state.gunpowderBursts||[])renderables.push({type:"gunpowder-explosion",depthY:burst.y+.15,priority:2,draw:()=>window.WIZARDRY_GUNPOWDER_V120?.explosion(g,burst)});
    if(action?.card?.id==="gunpowderkiss"&&action.stage==="summon"){
      const kiss=window.WIZARDRY_GUNPOWDER_V120,opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target)};
      if(kiss){
        renderables.push({type:"gunpowder-mistress",depthY:480,priority:1,draw:()=>kiss.draw(g,{...opts,layer:"actor"})});
        renderables.push({type:"gunpowder-kiss",depthY:kiss.depthFor(opts),priority:2,draw:()=>kiss.draw(g,{...opts,layer:"powder"})});
      }
    }
    if(action?.card?.id==="zeus"&&action.stage==="summon"){
      const zeus=window.WIZARDRY_ZEUS_V119,opts={progress:clamp(action.elapsed/action.duration,0,1),caster:getUnit(action.source),target:getUnit(action.target)};
      if(zeus){
        renderables.push({type:"zeus-cloud",depthY:300,priority:1,draw:()=>zeus.draw(g,{...opts,layer:"actor"})});
        for(const layer of ["projectile","impact"])renderables.push({type:"zeus-"+layer,depthY:opts.target.y+.1,priority:2,draw:()=>zeus.draw(g,{...opts,layer})});
        for(const neighbor of action.zeusChainTargets||[])renderables.push({type:"zeus-chain-"+neighbor.id,depthY:neighbor.y+.1,priority:2,draw:()=>zeus.draw(g,{...opts,neighbor,layer:"chain"})});
      }
    }
    if(action?.card?.id==="kineticsand"&&action.stage==="summon"){
      const p=clamp(action.elapsed/action.duration,0,1),target=getUnit(action.target);
      if(target)for(const layer of ["back","front"])renderables.push({type:"kinetic-sand-"+layer,depthY:p<.43?480+(layer==="back"?-.1:.1):target.y+(layer==="back"?-.1:.1),priority:2,draw:()=>drawKineticSand(g,p,target,time,layer)});
    }
    if(action?.card?.id==="blizzard"&&action.stage==="summon"){
      const caster=getUnit(action.source),progress=clamp(action.elapsed/action.duration,0,1);
      for(const [i,target] of (action.blizzardTargets||[]).entries())renderables.push({type:"blizzard-"+target.id,depthY:target.y+.1,priority:2,draw:()=>drawBlizzardWind(g,progress,caster,target,i)});
    }
    if(action?.card?.id==="bloom"&&action.stage==="summon"){
      const bloom=window.WIZARDRY_BLOOM_V97,caster=getUnit(action.source),opts={progress:clamp(action.elapsed/action.duration,0,1),targets:action.sporeTargets||alive(1-caster.team).map(t=>({id:t.id,x:t.x,y:t.y}))};
      if(bloom){renderables.push({type:"bloom-flower",depthY:480,priority:2,draw:()=>bloom.draw(g,{...opts,layer:"flower"})});
        for(const target of opts.targets)renderables.push({type:"bloom-spores-"+target.id,depthY:bloom.depthFor(opts,target),priority:2,draw:()=>bloom.draw(g,{...opts,target,layer:"spores"})});}
    }
    if(action?.card?.id==="devil"&&action.stage==="summon"){
      const devil=window.WIZARDRY_DEVIL_V96,opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target)};
      if(devil)for(const layer of ["ground","actor","projectile","impact"])renderables.push({type:"devil-"+layer,depthY:devil.depthFor(opts,layer),priority:2,draw:()=>devil.draw(g,{...opts,layer})});
    }
    if(action?.card?.id==="octo"&&action.stage==="summon"){
      const octo=window.WIZARDRY_OCTO_V95,opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target)};
      if(octo)for(const layer of ["ground","body","whip"])renderables.push({type:"octo-"+layer,depthY:layer==="ground"?200:layer==="whip"?opts.target.y+.1:opts.target.y-.1,priority:2,draw:()=>octo.draw(g,{...opts,layer})});
    }
    if(action?.card?.id==="scorpion"&&action.stage==="summon"){
      const scorpion=window.WIZARDRY_SCORPION_V94,opts={progress:clamp(action.elapsed/action.duration,0,1),target:getUnit(action.target)};
      if(scorpion)renderables.push({type:"scorpion",depthY:scorpion.depthFor(opts),priority:2,draw:()=>scorpion.draw(g,opts)});
    }
    if(action?.card?.id==="vampire"&&vampStages.includes(action.stage)){
      const vampire=window.WIZARDRY_VAMPIRE_V57;
      if(vampire){
        const options={
          stage:action.stage,
          progress:clamp(action.elapsed/action.duration,0,1),
          time,caster:getUnit(action.source),target:getUnit(action.target)
        };
        for(const layer of ["coffin","actor","orb"]){
          if(layer==="coffin"&&!["vamp-rise","vamp-open","vamp-lunge"].includes(action.stage))continue;
          if(layer==="actor"&&["vamp-rise","vamp-open"].includes(action.stage))continue;
          if(layer==="orb"&&!["vamp-drain","vamp-present","vamp-orb"].includes(action.stage))continue;
          renderables.push({
            type:"vampire-"+layer,
            depthY:vampire.depthFor(options,layer),
            priority:layer==="coffin"?0:2,
            draw:()=>vampire.draw(g,{...options,layer})
          });
        }
      }
    }
    if(action?.card?.id==="dragon"&&
      ["dragon-drop","dragon-land","dragon-charge","dragon-shot",
       "dragon-splash","dragon-impact","dragon-exit"].includes(action.stage)){
      const dragon=window.WIZARDRY_BABY_DRAGON_V61;
      if(dragon){
        const opts={stage:action.stage,
          progress:clamp(action.elapsed/action.duration,0,1),time,
          caster:getUnit(action.source),target:getUnit(action.target),
          splashTargets:(action.dragonSplashIds||[]).map(getUnit).filter(Boolean)};
        renderables.push({
          type:"baby-dragon",depthY:dragon.depthFor(opts,"actor"),priority:1,
          draw:()=>dragon.draw(g,{...opts,layer:"actor"})
        });
        if(["dragon-charge","dragon-shot","dragon-splash","dragon-impact"]
          .includes(action.stage)){
          renderables.push({
            type:"dragon-main-fireball",depthY:dragon.depthFor(opts,"projectile"),
            priority:2,draw:()=>dragon.draw(g,{...opts,layer:"projectile"})
          });
        }
        if(action.stage==="dragon-splash"){
          for(const [index,u] of opts.splashTargets.entries()){
            const splashOpts={...opts,splashTarget:u,splashIndex:index};
            renderables.push({
              type:"dragon-mini-fireball-"+u.id,
              depthY:dragon.depthFor(splashOpts,"splash"),priority:2,
              draw:()=>dragon.draw(g,{...splashOpts,layer:"splash"})
            });
          }
        }
      }
    }
    if(action?.card?.id==="bear"&&action.stage.startsWith("bear-")){
      const bear=window.WIZARDRY_POLAR_BEAR_V67;
      const opts={stage:action.stage,progress:clamp(action.elapsed/action.duration,0,1),
        target:getUnit(action.target),caster:getUnit(action.source)};
      if(bear){
        // Shadows belong on the floor below all bodies. Keep the bear
        // and the contact claw marks in separate depth-sorted layers.
        bear.draw(g,{...opts,layer:"ground"});
        renderables.push({type:"polar-bear",depthY:bear.depthFor(opts,"actor"),priority:0,
          draw:()=>bear.draw(g,{...opts,layer:"actor"})});
        if(action.stage==="bear-claw")renderables.push({type:"polar-bear-claw",
          depthY:bear.depthFor(opts,"claw"),priority:2,
          draw:()=>bear.draw(g,{...opts,layer:"claw"})});
      }
    }
    if(action?.card?.id==="frosty"&&action.stage.startsWith("frost-")){
      const frosty=window.WIZARDRY_FROSTY_V85,opts={stage:action.stage,progress:clamp(action.elapsed/action.duration,0,1),target:action.frostTargetPoint||getUnit(action.target)};
      if(frosty){frosty.draw(g,{...opts,layer:"ground"});renderables.push({type:"frosty",depthY:424,priority:0,draw:()=>frosty.draw(g,{...opts,layer:"actor"})});
        renderables.push({type:"frosty-snow-veil",depthY:480,priority:1,draw:()=>frosty.drawVeil(g,opts)});
        const ball=frosty.projectile(opts);if(ball)renderables.push({type:"frosty-snowball",depthY:ball.depthY,priority:1,draw:()=>frosty.drawBall(g,ball)});
        renderables.push({type:"frosty-impact",depthY:(opts.target?.y||450)+.1,priority:2,draw:()=>frosty.drawImpact(g,opts)});
      }
    }
    if(action?.card?.id==="bender"&&action.stage.startsWith("bender-")){
      const bender=window.WIZARDRY_STONE_BENDER_V83;
      const opts={stage:action.stage,progress:clamp(action.elapsed/action.duration,0,1),target:action.benderTargetPoint||getUnit(action.target)};
      if(bender){bender.draw(g,{...opts,layer:"ground"});
        renderables.push({type:"stone-bender",depthY:417,priority:0,draw:()=>bender.draw(g,{...opts,layer:"actor"})});
        renderables.push({type:"stone-wall",depthY:480,priority:1,draw:()=>bender.draw(g,{...opts,layer:"wall"})});
        for(const item of bender.items(opts))renderables.push({type:"bender-"+item.type,depthY:item.depthY,priority:item.type==="impact"?2:0,draw:()=>bender.drawItem(g,item)});
      }
    }
    if(action?.card?.id==="reaper"&&action.stage.startsWith("reaper-")){
      const reaper=window.WIZARDRY_REAPER_V82;
      const opts={stage:action.stage,progress:clamp(action.elapsed/action.duration,0,1),target:action.reaperTargetPoint||getUnit(action.target)};
      if(reaper){reaper.draw(g,{...opts,layer:"ground"});
        for(const layer of ["actor","slash"])renderables.push({type:"reaper-"+layer,depthY:reaper.depthFor(opts,layer),priority:layer==="slash"?2:0,draw:()=>reaper.draw(g,{...opts,layer})});
      }
    }
    if(action?.card?.id==="ronin"&&action.stage.startsWith("ronin-")){
      const ronin=window.WIZARDRY_WIND_SLASHES_V81;
      const opts={stage:action.stage,progress:clamp(action.elapsed/action.duration,0,1),target:action.slashTargetPoint||getUnit(action.target)};
      if(ronin){ronin.draw(g,{...opts,layer:"ground"});
        renderables.push({type:"ronin",depthY:417,priority:0,draw:()=>ronin.draw(g,{...opts,layer:"actor"})});
        for(const item of ronin.items(opts))renderables.push({type:"wind-slash",depthY:item.depthY,priority:item.type==="impact"?2:0,draw:()=>ronin.drawItem(g,item)});
      }
    }
    if(action?.card?.id==="arrows"&&action.stage.startsWith("rain-")){
      const rain=window.WIZARDRY_FLAMING_ARROWS_V80;
      const opts={stage:action.stage,progress:clamp(action.elapsed/action.duration,0,1),targets:action.rainTargets||[]};
      if(rain){
        rain.drawCircle(g,opts);
        for(const item of rain.items(opts))renderables.push({type:"flaming-"+item.type,depthY:item.depthY,priority:item.type==="impact"?2:0,draw:()=>rain.drawItem(g,item)});
      }
    }
    if(action?.card?.id==="thunder"&&action.stage.startsWith("thunder-")){
      const thunder=window.WIZARDRY_THUNDERCLAP_V79;
      const opts={stage:action.stage,progress:clamp(action.elapsed/action.duration,0,1),time:action.thunderMs||0,target:getUnit(action.target)};
      if(thunder){
        thunder.draw(g,{...opts,layer:"ground"});
        for(const layer of ["actor","bolt"])renderables.push({type:"thunder-"+layer,
          depthY:thunder.depthFor(opts,layer),priority:layer==="bolt"?2:0,
          draw:()=>thunder.draw(g,{...opts,layer})});
      }
    }
    if(action?.card?.id==="shark"&&action.stage.startsWith("shark-")){
      const shark=window.WIZARDRY_REEF_RUSH_V77;
      const opts={stage:action.stage,progress:clamp(action.elapsed/action.duration,0,1),
        elapsed:action.elapsed,target:getUnit(action.target)};
      if(shark){
        shark.draw(g,{...opts,layer:"water"});
        renderables.push({type:"reef-shark",depthY:shark.depthFor(opts,"actor"),priority:0,
          draw:()=>shark.draw(g,{...opts,layer:"actor"})});
        renderables.push({type:"shark-splash",depthY:shark.depthFor(opts,"splash"),priority:0,
          draw:()=>shark.draw(g,{...opts,layer:"splash"})});
      }
    }
    const trident=poseidonProjectileAt(action);
    if(trident)renderables.push({
      type:"poseidon-trident",depthY:trident.depthY,priority:2,
      draw:()=>drawPoseidonProjectile(trident)
    });
    renderables.sort((a,b)=>a.depthY-b.depthY||a.priority-b.priority);
    for(const entry of renderables)entry.draw();
    // Only the bottom portion of the 8-frame impact atlas overlays the
    // target's boots. The full effect stays behind the wizard model.
    if(state.animation?.stage==="golem-impact")
      window.WIZARDRY_GOLEM_EFFECTS_V42?.drawImpactForeground(
        g,state.animation);
    if(["wind-volley","wind-impact"].includes(state.animation?.stage)){
      const a=state.animation;
      window.WIZARDRY_TORNADO_V54?.drawForeground(g,{
        stage:a.stage,progress:clamp(a.elapsed/a.duration,0,1),
        time,targets:a.windImpactTargets||[]
      });
    }
    if(["dragon-splash","dragon-impact"].includes(state.animation?.stage)){
      const a=state.animation;
      window.WIZARDRY_BABY_DRAGON_V61?.drawForeground(g,{
        stage:a.stage,progress:clamp(a.elapsed/a.duration,0,1),
        time,target:getUnit(a.target),
        splashTargets:(a.dragonSplashIds||[]).map(getUnit).filter(Boolean)
      });
    }
    if(["vamp-drain","vamp-orb"].includes(state.animation?.stage)){
      const a=state.animation;
      window.WIZARDRY_VAMPIRE_V57?.drawForeground(g,{
        stage:a.stage,progress:clamp(a.elapsed/a.duration,0,1),
        time,target:getUnit(a.target),caster:getUnit(a.source)
      });
    }
    if(state.animation?.stage==="estel-impact"){
      const a=state.animation;
      window.WIZARDRY_LADY_ESTEL_V51?.drawForeground(g,{
        stage:a.stage,progress:clamp(a.elapsed/a.duration,0,1),
        time,target:getUnit(a.target),end:a.estelOrbEnd
      });
    }
    // Keep side plates readable on top without blocking the models.
    for(const u of sorted)drawUnitPlate(u);
    if(state.phase==="planning"&&currentCard()&&state.selectedTarget)
      drawTargetArrow(getUnit(state.selectedTarget),time);
    for(const {f,x,y,fontSize} of layoutCombatMessages(g,state.flashes)){
      const alpha=clamp(1-f.age/.95,0,1);
      g.save();g.globalAlpha=alpha;g.textAlign="center";g.textBaseline="middle";
      g.font="800 "+fontSize+"px system-ui,sans-serif";g.lineWidth=5;g.strokeStyle="#081624";
      g.strokeText(f.text,x,y);
      g.fillStyle=f.color;g.fillText(f.text,x,y);g.restore();
    }
    if(state.phase==="finished"){
      // The defeated wizards remain visible in their held kneeling pose.
      g.fillStyle="#03121e88";g.fillRect(0,0,W,H);
      g.fillStyle="#f4e2aa";g.font="700 52px Georgia,serif";g.textAlign="center";
      g.fillText(state.winner==="draw"?"DRAW":state.winner===0?"ALLIES VICTORIOUS":"ENEMIES VICTORIOUS",500,292);
      g.font="20px system-ui";g.fillStyle="#bbdbdc";
      g.fillText("Tap New battle to try another team composition.",500,343);
    }
  }
  function tick(now){
    if(!state)return;
    if(document.body?.dataset?.screen&&document.body.dataset.screen!=='battle'){frameLast=now;requestAnimationFrame(tick);return;}
    // At 120 Hz the Canvas would be repainted twice as often for no visible
    // benefit, which is expensive on iPhones. Cap to roughly 60 fps.
    if(now-frameLast<13.3){requestAnimationFrame(tick);return;}
    const dt=Math.min(55,Math.max(0,now-frameLast||0));frameLast=now;
    updateFacing(dt);
    if(window.WizardrySession?.active){
      const session=window.WizardrySession,a=state.animation,elapsed=a?.elapsed;
      if(session.isHost){if(a)a.elapsed=Math.min(a.duration,elapsed+Math.min(100,Math.max(0,performance.now()-(session.clockAt||performance.now()))));}
      else{if(a)a.elapsed=Math.min(a.duration,a.elapsed+dt);for(const u of state.units)if(u.hp<=0)u.defeatElapsedMs=Math.min(DEFEAT_HOLD_MS,(u.defeatElapsedMs||0)+dt);for(const f of state.flashes)f.age+=dt/1000;}
      render(now);if(session.isHost&&a===state.animation&&a)a.elapsed=elapsed;requestAnimationFrame(tick);return;
    }
    if(state.phase==="resolving"&&state.animation){
      updateCastSequence(dt);
      checkBattleEnd();
    }
    updateBattleEnding(dt);
    // Each fallen wizard gets its own timeline: play the sequence once,
    // then freeze on frame 7 through the rest of the battle and victory.
    for(const u of state.units){
      if(u.hp<=0){
        if(!Number.isFinite(u.defeatElapsedMs))u.defeatElapsedMs=0;
        else u.defeatElapsedMs=Math.min(DEFEAT_HOLD_MS,u.defeatElapsedMs+dt);
      }
    }
    for(const burst of state.gunpowderBursts||[])burst.age+=dt/1000;
    if(state.gunpowderBursts)state.gunpowderBursts=state.gunpowderBursts.filter(b=>b.age<.85);
    for(const burst of state.windDomeBursts||[])burst.age+=dt/1000;
    if(state.windDomeBursts)state.windDomeBursts=state.windDomeBursts.filter(b=>b.age<.62);
    for(const burst of state.rodBursts||[])burst.age+=dt/1000;
    if(state.rodBursts)state.rodBursts=state.rodBursts.filter(b=>b.age<.85);
    for(const f of state.flashes)f.age+=dt/1000;
    state.flashes=state.flashes.filter(f=>f.age<.96);
    render(now);
    requestAnimationFrame(tick);
  }
  // Small test API for browser and deterministic combat regression checks.
  window.WIZARDRY_ARENA_TEST={
    getState:()=>state,plateAlpha,plateIsTarget,drawAirborneRune,drawRuneOutcome,
    configureProfile:p=>{configuredProfile=Builds.normalize(p,CARDS);activeRoster=null;},
    startPractice:size=>{activeRoster=null;setBattle('story',size);},
    startLobby:(roster,size)=>{activeRoster=roster.map(p=>({...p,profile:Builds.normalize(p.profile,CARDS)}));setBattle('online',size);for(const team of [0,1])state.humanByTeam[team]=state.units.find(u=>u.team===team&&u.peerId===window.WizardrySession?.peerId)?.id||null;state.planningSide=state.units.find(u=>u.peerId===window.WizardrySession?.peerId)?.team||0;paintUI();},
    receiveSnapshot:snapshot=>{const previous=caster(),discard=previous?.discardedRound===state.round?previous.discardedCard:null,previousRound=state.round;const local=state?.selectedCard,copy=state?.selectedHandCopy||0,target=state?.selectedTarget;state=snapshot;state.selectedHandCopy=copy;const mine=state.units.find(u=>u.peerId===window.WizardrySession?.peerId);if(discard&&snapshot.round===previousRound&&snapshot.phase==='planning'&&mine&&!state.plans[mine.id]&&mine.discardedRound!==state.round)discardFromHand(mine,discard);state.planningSide=mine?.team||0;state.humanByTeam={0:null,1:null};if(mine)state.humanByTeam[mine.team]=mine.id;if(mine&&window.WizardrySession?.pendingPlan){const pending=window.WizardrySession.pendingPlan;if(state.phase!=='planning'||pending.round!==state.round||state.plans[mine.id])window.WizardrySession.pendingPlan=null;else state.plans[mine.id]={casterId:mine.id,...pending};}state.selectedCard=mine?.hand.includes(local)&&!state.plans[mine.id]?local:null;state.selectedTarget=state.selectedCard?target:null;paintUI();},
    submitRemotePlan:(peerId,p)=>{const u=state?.units.find(u=>u.peerId===peerId);if(state.phase!=='planning'||!u||u.hp<=0||p.round!==state.round||state.plans[u.id])return false;
      const needsDiscard=p.discardId&&u.discardedRound!==state.round;
      if(p.discardId&&(u.discardedRound===state.round?u.discardedCard!==p.discardId:!u.hand.includes(p.discardId)))return false;
      if(!p.pass&&needsDiscard&&p.cardId===p.discardId&&u.hand.filter(id=>id===p.cardId).length<2)return false;
      if(p.pass){if(needsDiscard)discardFromHand(u,p.discardId);u.passedRound=state.round;state.plans[u.id]={casterId:u.id,pass:true,cardId:null,targetId:null,team:u.team};}
      else{const card=BY_ID[p.cardId],t=getUnit(p.targetId);if(!card||!u.hand.includes(card.id)||u.mana<card.cost||!u.masteries.includes(card.school)||requiresRest(u))return false;const area=['team','all_enemies'].includes(card.target);if(!area&&(!t||!targetsFor(card,u).includes(t)))return false;if(area&&!alive(card.target==='team'?u.team:1-u.team).length)return false;
       if(needsDiscard)discardFromHand(u,p.discardId);
       if(!playHandCard(u,card.id))return false;state.plans[u.id]={casterId:u.id,cardId:card.id,targetId:area?null:t.id,team:u.team};}
      clearSelection();autoFill(0);autoFill(1);runResolution();paintUI();return true;},
    advanceBackground:ms=>{let left=Math.min(30000,Math.max(0,ms));while(left>0&&state&&state.phase!=='finished'){const dt=Math.min(40,left);if(state.phase==='resolving'&&state.animation){updateCastSequence(dt);checkBattleEnd();}for(const u of state.units)if(u.hp<=0)u.defeatElapsedMs=Math.min(DEFEAT_HOLD_MS,(u.defeatElapsedMs||0)+dt);updateBattleEnding(dt);for(const f of state.flashes)f.age+=dt/1000;state.flashes=state.flashes.filter(f=>f.age<.96);for(const key of ['gunpowderBursts','windDomeBursts','rodBursts'])if(state[key]){for(const b of state[key])b.age+=dt/1000;state[key]=state[key].filter(b=>b.age<.85);}left-=dt;}},
    drawWizardPreview:(target,look)=>{const c=target.getContext('2d'),w=target.width,h=target.height;c.clearRect(0,0,w,h);c.save();c.translate(w/2,h*.94);c.scale(1.4,1.4);drawWizardSprite(c,'idle',0,0,performance.now(),null,look);c.restore();},

    drawCardArts,
    getHand:id=>[...(getUnit(id)?.hand||[])],
    getDeck:id=>[...(getUnit(id)?.drawPile||[])],
    featuredCard:FEATURED_TEST_CARD,drawCard,startHand,playHandCard,
    cards:CARDS,desiredYaw,updateFacing,runePath,spellHitCheck,
    getDragonInfo:()=>state?.animation?.card?.id==="dragon"?{
      stage:state.animation.stage,
      burned:!!state.animation.dragonBurned,
      impactResolved:!!state.animation.dragonImpactResolved,
      splashIds:state.animation.dragonSplashIds||[],
      splashHitIds:state.animation.dragonSplashHitIds||[],
      progress:clamp(state.animation.elapsed/state.animation.duration,0,1)
    }:null,
    dragonSplashTargets,applyDragonImpact,applyDragonSplashHit,applyRainHit,applyRoninHit,applyReaperStrike,applyBenderStrike,applyFrostyImpact,tickBurnsForRound,
    getPoseidonProjectileInfo:()=>poseidonProjectileAt(state?.animation),
    getSceneDepths:()=>[
      ...state.units.map(u=>({type:"wizard",depthY:u.y,id:u.id})),
      ...(state.animation?.card?.id==="vampire"?
        ["coffin","actor","orb"].map(layer=>({
          type:"vampire-"+layer,
          depthY:window.WIZARDRY_VAMPIRE_V57?.depthFor({
            stage:state.animation.stage,
            progress:clamp(state.animation.elapsed/state.animation.duration,0,1),
            target:getUnit(state.animation.target),caster:getUnit(state.animation.source)
          },layer)
        })):[]),
      ...(poseidonProjectileAt(state.animation)?[{
        type:"poseidon-trident",depthY:poseidonProjectileAt(state.animation).depthY
      }]:[])
    ],
    getVampireInfo:()=>state?.animation?.card?.id==="vampire"?{
      stage:state.animation.stage,drained:state.animation.vampDrained||0,
      pendingHeal:state.animation.vampPotentialHeal||0,
      healed:!!state.animation.vampHealingResolved,
      progress:clamp(state.animation.elapsed/state.animation.duration,0,1),
      artworkFrames:window.WIZARDRY_VAMPIRE_V57?.frames||null,
      coffin:window.WIZARDRY_VAMPIRE_V57?.coffinAnchor||null,
      position:window.WIZARDRY_VAMPIRE_V57?.position({
        stage:state.animation.stage,
        progress:clamp(state.animation.elapsed/state.animation.duration,0,1),
        caster:getUnit(state.animation.source),
        target:getUnit(state.animation.target)
      })||null
    }:null,
    getWindVolleyInfo:()=>state?.animation?.card?.id==="wind"?{
      stage:state.animation.stage,
      targets:(state.animation.windImpactTargets||[]).map(t=>({id:t.id,hit:t.hit})),
      progress:clamp(state.animation.elapsed/state.animation.duration,0,1)
    }:null,
    getEffectiveAccuracy:(unitId,cardId)=>{
      const u=getUnit(unitId),card=BY_ID[cardId];
      return !u||!card?null:Math.max(0,Math.min(1,card.accuracy+
        (u.statuses.find(st=>st.kind==="tailwind")?.value||0)-(u.statuses.find(st=>st.kind==="static_shock")?.value||0)-(u.statuses.find(st=>st.kind==="turbulence")?.value||0)-thornAccuracyPenalty(u)));
    },
    applyGunpowderCoat,triggerGunpowderCoat,expireGunpowderCoats,applyZeusImpact,applyZeusChain,thornAccuracyPenalty,triggerThornyWrap,drawThornyVine,applyBlizzardHit,blizzardHitAt,drawBlizzardWind,applyPenguinHit,NINJA_HIT_TIMES,applyLightningRod,recordLightningRodCast,splitLightningRodDamage,expireLightningRods,attemptUndeadFear,attemptOctoFlinch,isFrozen,attemptMarkedFreeze,isStunned,attemptVoltStun,requiresRest,applySpell,
    runeTiming:()=>({trace:AUTO_TRACE_MS,glow:RUNE_GLOW_MS,
      crumble:RUNE_CRUMBLE_MS}),
    layoutCombatMessages,
    rollJackFear,applyJackFear,expireJackFear,
    applyWindFistHit,WIND_FIST_RELEASES,WIND_FIST_HIT_TIMES,
    applyVampDamage,applyVampHeal,canReceiveDebuff,addStatus,consumeStatus,statusRuneRect,hitStatusRune,discardSelected,discardFromHand,resolveAutoRune,turnOrder,grantTurnMana,checkBattleEnd,updateBattleEnding,finishRound,passTurn,startNextAction,runResolution,tick,
    setBattle,queueSpell,autoFill,resolvePressed,
    chooseCard,selectCaster,selectTarget,confirmTarget,unitPlateRect,
    statusRuneRect,showStatusInfo,closeStatusInfo,unitStatuses,
    getGolemTravelInfo:()=>state?.animation?.stage==="golem-travel"?
      {start:state.animation.travelStart,end:state.animation.travelEnd,
       duration:state.animation.duration,progress:state.animation.elapsed/state.animation.duration}:null,
    getGolemSpriteInfo:()=>window.WIZARDRY_GOLEM_EFFECTS_V42?.getAtlasInfo(),
    getEstelOrbInfo:()=>state?.animation?.stage==="estel-travel"?
      {start:state.animation.estelOrbStart,
       end:state.animation.estelOrbEnd,
       duration:state.animation.duration,
       progress:state.animation.elapsed/state.animation.duration}:null,
    advanceAction:(ms)=>{
      // Headless test helper advances in 40ms steps without bypassing
      // the exact same stage machine used by real 60fps rendering.
      let remaining=Math.max(0,ms),guard=0;
      while(remaining>0&&state.animation&&guard++<1000){
        const slice=Math.min(40,remaining);updateCastSequence(slice);
        remaining-=slice;
      }
    },
    getSummonAvailable:kind=>!!spriteCache[kind]?.every(im=>im.complete&&im.naturalWidth),
    getTopWizardIdleAvailable:wizardAtlasReady,
    getApprovedWizardFrame:wizardFrame,
    getDefeatAvailable:defeatAtlasReady,
    getDefeatFrame:defeatFrame,
    defeatHoldMs:DEFEAT_HOLD_MS
  };
  window.WIZARDRY_PENGUINS_V103?.onReady(()=>{if(state)drawCardArts();});
  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);
  requestAnimationFrame(tick);
})();
