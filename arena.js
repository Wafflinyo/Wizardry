/* Wizardry 0.49 — interactive 2.5D battle test.
   Authoritative multiplayer and accounts are NOT implemented.
   Story = four local players / simulated CPUs. PvP = local hot-seat test. */
(()=>{"use strict";
  const W=1000,H=620,MAX_MANA=10,MAX_SLOTS=3;
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
      stunChance:.20,duration:2950,hit:.66,artFrame:2}
  ];
  const BY_ID=Object.fromEntries(CARDS.map(x=>[x.id,x]));
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
  // Side-on 3/4 arc seating. Allies LEFT, enemies RIGHT, never front/back.
  // Y offsets provide depth; preserve the same camera and ground plane
  // for 1v1, 2v2, 3v3 and 4v4.
  const scenePositions={
    1:[[[235,435]],[[769,376]]],
    2:[[[194,390],[297,480]],[[709,346],[816,450]]],
    3:[[[178,359],[239,433],[319,495]],[[681,320],[760,395],[834,465]]],
    4:[[[175,340],[205,404],[270,461],[341,508]],
       [[667,315],[742,370],[802,428],[831,488]]]
  };
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const rand=(seed)=>{let n=(seed*9301+49297)%233280;return n/233280};
  let state=null,background=null,frameLast=0,spriteCache={};
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
    return {id,team,index,name:d.name,style:d.style,color:d.color,
      hp:d.hp,maxHp:d.hp,mana:MAX_MANA,speed:d.speed,statuses:[],rechargeRound:null,stunRound:null,x:0,y:0,
      hat:["pointed","wide","hood","scholar"].includes(custom.hat)?custom.hat:"pointed",
      robe:["classic","split","armored"].includes(custom.robe)?custom.robe:"classic",
      robeColor:pick(custom.robeColor,colors?.robeColors,preset.robeColor),
      hatColor:pick(custom.hatColor,colors?.hatColors,preset.hatColor),
      skinColor:pick(custom.skinColor,colors?.skinColors,preset.skinColor),
      armRaise:0,facing:team?-.74:.74,defeatElapsedMs:null};
  }
  function sideUnits(team){return state.units.filter(u=>u.team===team);}
  function alive(side){return sideUnits(side).filter(u=>u.hp>0);}
  function getUnit(id){return state.units.find(u=>u.id===id)||null;}
  function setBattle(mode="story",size=4){
    if(![1,2,3,4].includes(size))size=4;
    const units=[...ALLIES.slice(0,size).map((d,i)=>createUnit(d,0,i)),
                 ...(mode==="pvp"?PVP_WIZARDS:ENEMIES).slice(0,size).map((d,i)=>createUnit(d,1,i))];
    for(const u of units){const p=scenePositions[size][u.team][u.index];u.x=p[0];u.y=p[1];}
    state={mode,size,units,round:1,phase:"planning",planningSide:0,
      // Only seat 0 on each human-controlled team belongs to a real player.
      // Everyone else is a CPU stand-in until live co-op / PvP exists.
      humanByTeam:{0:"a0",1:mode==="pvp"?"e0":null},
      selectedCaster:units[0]?.id,selectedCard:null,selectedTarget:null,
      plans:{},sequence:[],queueAt:0,animation:null,winner:null,auras:[null,null],
      flashes:[],log:[],activeCard:null,inspectedStatus:null};
    ui.statusPopup.hidden=true;
    ui.status.textContent=mode==="story"?
      "You control Tidecaller only. All other allies and enemies are CPU-controlled.":
      "PvP local hot-seat simulation only. No real matchmaking or connected friends yet.";
    paintUI();
  }
  function caster(){
    const id=state.humanByTeam[state.planningSide];
    const u=id?getUnit(id):null;
    return u&&u.hp>0&&u.team===state.planningSide?u:null;
  }
  // No implicit spell or enemy selection. Each player-controlled wizard
  // must explicitly pick a card and target again for EVERY new round.
  function currentCard(){return state.selectedCard?BY_ID[state.selectedCard]||null:null;}
  function targetsFor(card,c){
    if(!card||!c)return[];
    if(card.target==="team")return[];
    return alive(card.target==="ally"?c.team:1-c.team);
  }
  function correctTarget(){
    const c=caster(),card=currentCard();
    if(!c||!card)return null;
    if(card.target==="team"){state.selectedTarget=null;return null;}
    const selected=getUnit(state.selectedTarget);
    if(!selected||!targetsFor(card,c).some(u=>u.id===selected.id)){
      state.selectedTarget=null;
      return null;
    }
    return selected;
  }
  function clearSelection(){
    state.selectedCard=null;
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
    if(!c||!card||!u||u.hp<=0||u.team!==1-c.team)return;
    // Selecting or changing an enemy only previews the target; no spell is
    // queued or mana spent until the visible Confirm Target is pressed.
    state.selectedTarget=id;
    paintUI();
  }
  function chooseCard(id){
    if(state.phase!=="planning"||!BY_ID[id]||!caster())return;
    if(requiresRest(caster())||caster().mana<BY_ID[id].cost)return;
    state.selectedCard=id;
    state.selectedTarget=null;
    paintUI();
  }
  function confirmTarget(){
    if(state.phase!=="planning"||!caster()||!currentCard()||!correctTarget())return;
    if(queueSpell())resolvePressed();
  }
  function queueSpell(){
    const c=caster(),card=currentCard(),target=correctTarget();
    if(state.phase!=="planning"||!c||!card||requiresRest(c)||state.plans[c.id]||
       c.mana<card.cost||!target)return false;
    state.plans[c.id]={casterId:c.id,cardId:card.id,
      targetId:target.id,team:c.team,auto:false};
    state.log=[c.name+" chose "+card.name+" against "+target.name,
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
  function requiresRest(u){
    return !!u&&u.hp>0&&(isStunned(u)||isRecharging(u)||
      !CARDS.some(card=>card.cost<=u.mana));
  }
  function autoPlan(u){
    if(requiresRest(u))return null;
    const opponents=alive(1-u.team);
    if(!opponents.length)return null;
    const affordable=CARDS.filter(card=>card.cost<=u.mana);
    if(!affordable.length)return null;
    // CPU teammates and opponents pick independently each turn, including
    // independently selecting a living target; no repeated saved orders.
    const card=affordable[Math.floor(Math.random()*affordable.length)];
    const target=opponents[Math.floor(Math.random()*opponents.length)];
    return {casterId:u.id,cardId:card.id,targetId:target.id,
      team:u.team,auto:true};
  }
  function autoFill(team){
    if(state.phase!=="planning")return;
    for(const u of alive(team)){
      if(u.id===state.humanByTeam[team]||state.plans[u.id])continue;
      const p=autoPlan(u);
      if(p)state.plans[u.id]=p;
    }
  }
  function resolvePressed(){
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
  function runResolution(){
    const order=Object.values(state.plans)
      .filter(p=>getUnit(p.casterId)?.hp>0)
      .sort((a,b)=>getUnit(b.casterId).speed-getUnit(a.casterId).speed||
        a.casterId.localeCompare(b.casterId));
    state.sequence=order;state.queueAt=0;state.animation=null;state.phase="resolving";
    for(const u of state.units)u.armRaise=0;
    state.log=["Actions resolve from fastest to slowest.",...state.log].slice(0,5);
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
  function spellHitCheck(card,roll=Math.random()){
    return roll<card.accuracy;
  }
  function resolveAutoRune(){
    const a=state?.animation;
    if(!a||a.stage!=="tracing-auto")return false;
    const success=spellHitCheck(a.card);
    a.runeResult=success?"success":"failed";
    // Rune outcome ends the staff wave immediately, irrespective of the
    // subsequent summon/fizzle animation's length.
    a.lowerFromFrame=waveFrame(a.traceMs||0);
    a.visualRecoveryMs=0;
    const c=getUnit(a.source);
    const label=Math.round(a.card.accuracy*100)+"% accuracy";
    if(success){
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
    a.elapsed=Math.min(a.duration,a.elapsed+Math.max(0,deltaMs));
    const p=clamp(a.elapsed/a.duration,0,1);
    // Trace only while checking the rune. The spell effect remains active
    // independently while the caster lowers their staff and resumes idle.
    if(a.stage==="tracing-auto")
      a.traceMs=(a.traceMs||0)+Math.max(0,deltaMs);
    if(["rune-success","rune-fail","summon","fizzle","lowering","golem-slam","golem-travel","golem-impact"]
        .includes(a.stage)&&Number.isFinite(a.visualRecoveryMs))
      a.visualRecoveryMs=Math.min(WIZARD_RECOVERY_MS,
        a.visualRecoveryMs+Math.max(0,deltaMs));
    // Golem can return to idle and unsummon independently of the moving
    // fissure; its animation clock is never reset at a combat stage boundary.
    if(["golem-travel","golem-impact"].includes(a.stage))
      a.golemPostSlamMs=(a.golemPostSlamMs||0)+Math.max(0,deltaMs);
    if(a.stage==="raising")caster.armRaise=ease(p);
    else if(a.stage==="lowering")caster.armRaise=1-ease(p);
    else caster.armRaise=1;
    if(a.stage==="summon"&&!a.applied&&a.elapsed>=a.card.duration*a.card.hit)
      applySpell(a);
    if(a.elapsed<a.duration)return;
    if(a.stage==="raising"){
      caster.armRaise=1;
      startStage(a,"tracing-auto",AUTO_TRACE_MS);
      ui.hint.textContent=caster.name+" automatically traces the "+a.card.school+
        " rune · "+Math.round(a.card.accuracy*100)+"% accuracy";
      paintUI();
    }else if(a.stage==="tracing-auto"){
      resolveAutoRune();
    }else if(a.stage==="rune-success"){
      // Begin the ORIGINAL summon only AFTER the bright completed rune
      // has held for its entire glow sequence.
      startStage(a,a.card.id==="golem"?"golem-slam":"summon",
        a.card.id==="golem"?GOLEM_SLAM_MS:a.card.duration);
      ui.hint.textContent=caster.name+" invokes "+a.card.name+"!";
      paintUI();
    }else if(a.stage==="rune-fail"){
      // The fractured rune has completely disappeared. End the attempt
      // without starting a summon, without a red-X overlay and without
      // granting Poseidon recharge or Tidal Echo.
      startStage(a,"lowering",WIZARD_RECOVERY_MS);
      paintUI();
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
    if(!state||state.phase!=="resolving")return;
    while(state.queueAt<state.sequence.length){
      const action=state.sequence[state.queueAt++],c=getUnit(action.casterId),card=BY_ID[action.cardId];
      if(!c||c.hp<=0||!card)continue;
      // Exactly ONE eligible action is lost, whether the spell struck
      // before this wizard's planned cast or during a prior round.
      if(isStunned(c)){
        consumeStatus(c,"stun");c.stunRound=null;
        flash(c,"STUNNED · SKIPPED","#88e8ff");
        state.log=[c.name+" loses their action to Professor Volt's stun.",
          ...state.log].slice(0,5);
        continue;
      }
      if(c.mana<card.cost||isRecharging(c))continue;
      if(card.target!=="team"){
        const t=getUnit(action.targetId),valid=targetsFor(card,c);
        if(!t||t.hp<=0){action.targetId=valid[0]?.id||null;}
        if(!action.targetId)continue;
      }
      c.mana-=card.cost;
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
    state.flashes.push({x:unit.x,y:unit.y-108,text,color,age:0});
    if(state.flashes.length>18)state.flashes.shift();
  }
  function addStatus(u,kind,icon,value){
    let existing=u.statuses.find(s=>s.kind===kind);
    if(existing){existing.value=value;existing.charges=1;return;}
    if(u.statuses.length>=MAX_SLOTS)u.statuses.shift();
    u.statuses.push({kind,icon,value,charges:1});
  }
  function consumeStatus(u,kind){
    const at=u.statuses.findIndex(s=>s.kind===kind);
    return at<0?null:u.statuses.splice(at,1)[0];
  }
  function attemptVoltStun(source,target,card,roll=Math.random()){
    if(card?.id!=="volt"||!target||target.hp<=0||roll>=card.stunChance)
      return false;
    // If the target is still due to act this round, cancel that cast;
    // otherwise reserve the stun for their next round. Never double-skip.
    const pending=state.phase==="resolving"&&state.sequence
      .slice(state.queueAt).some(a=>a.casterId===target.id);
    target.stunRound=pending?state.round:state.round+1;
    addStatus(target,"stun","⚡",1);
    flash(target,"STUNNED","#96f3ff");
    state.log=[source.name+"'s Professor Volt stuns "+target.name+
      " for one action!",...state.log].slice(0,5);
    return true;
  }
  function damage(source,target,base,card){
    let raw=base,notes=[];
    // Echo applies to a SUCCESSFUL damaging Water spell only. An Earth
    // spell, a fizzle, or a spell without a living target cannot consume it.
    if(card?.school==="water"){
      const echo=consumeStatus(source,"tidal_echo");
      if(echo){raw*=1+echo.value;notes.push("TIDAL ECHO +30%");}
    }
    const blade=consumeStatus(source,"blade");
    if(blade){raw*=1+blade.value;notes.push("BLADE");}
    const aura=state.auras[source.team];
    if(aura&&aura.turns>0){raw*=1+aura.value;notes.push("AURA");}
    const trap=consumeStatus(target,"trap");
    if(trap){raw*=1+trap.value;notes.push("TRAP");}
    const shield=consumeStatus(target,"shield");
    if(shield){raw*=1-shield.value;notes.push("BLOCK");}
    const amount=Math.max(1,Math.round(raw));
    const wasAlive=target.hp>0;
    target.hp=Math.max(0,target.hp-amount);
    if(wasAlive&&target.hp===0){
      // Start the one-shot defeat animation at the exact lethal hit.
      // This remains independent of the attacker's ongoing summon/trace.
      target.defeatElapsedMs=0;
    }
    flash(target,"-"+amount,shield?"#8df2f5":"#f8c49c");
    state.log=[source.name+" → "+target.name+": "+amount+" damage"+
      (notes.length?" ["+notes.join(", ")+"]":""),...state.log].slice(0,5);
    if(target.hp<=0){flash(target,"DEFEATED","#ffd5b0");}
  }
  function applySpell(anim){
    if(anim.applied)return;
    anim.applied=true;
    const {action,card}=anim,c=getUnit(action.casterId),t=getUnit(action.targetId);
    if(!c||c.hp<=0)return;
    if(card.kind==="damage"||card.kind==="summon"){
      if(t&&t.hp>0){
        damage(c,t,card.damage,card);
        // The independent 20% stun roll happens ONLY after a successful
        // lightning rune and beam impact against a surviving target.
        if(anim.runeResult==="success"&&card.id==="volt"&&t.hp>0)
          attemptVoltStun(c,t,card);
      }
    } else if(card.kind==="heal"&&t&&t.hp>0){
      const n=Math.min(card.heal,t.maxHp-t.hp);t.hp+=n;flash(t,"+"+n,"#9bffc0");
      state.log=[c.name+" healed "+t.name+" for "+n,...state.log].slice(0,5);
    } else if(card.kind==="shield"&&t&&t.hp>0){
      addStatus(t,"shield","⬡",.55);flash(t,"SHIELD","#a3efff");
      state.log=["Shield attached to "+t.name,...state.log].slice(0,5);
    } else if(card.kind==="blade"&&t&&t.hp>0){
      addStatus(t,"blade","✦",.50);flash(t,"+50%","#f8db94");
      state.log=["Blade attached to "+t.name,...state.log].slice(0,5);
    } else if(card.kind==="trap"&&t&&t.hp>0){
      addStatus(t,"trap","◈",.35);flash(t,"TRAP","#e8ba91");
      state.log=["Trap attached to "+t.name,...state.log].slice(0,5);
    } else if(card.kind==="aura"){
      state.auras[c.team]={turns:2,value:.20};
      state.log=["Two-round damage aura for "+(c.team?"Team B":"Team A"),...state.log].slice(0,5);
    }
    paintUI();
  }
  function finishRound(){
    for(const team of [0,1]){
      const aura=state.auras[team];
      if(aura&&--aura.turns<=0)state.auras[team]=null;
    }
    const allyAlive=alive(0).length,enemyAlive=alive(1).length;
    if(!allyAlive||!enemyAlive){
      state.phase="finished";state.winner=allyAlive&&!enemyAlive?0:!allyAlive&&enemyAlive?1:"draw";
      ui.hint.textContent=state.winner==="draw"?"Draw!":
        (state.winner===0?"Allies":"Enemy team")+" wins!";
      paintUI();return;
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
    for(const u of state.units)if(u.hp>0)u.mana=Math.min(MAX_MANA,u.mana+6);
    state.round++;
    // Complete old round teardown: no queued player actions, target, card,
    // or combat animation may carry into the next planning phase.
    state.plans={};state.sequence=[];state.queueAt=0;state.animation=null;
    state.phase="planning";state.planningSide=0;
    nearestAvailableCaster();
    state.log=["Round "+state.round+" begins: your spell and target choice.",...state.log].slice(0,5);
    ui.status.textContent="Round "+state.round+": "+
      (isStunned(caster())?"Stunned — your wizard loses this action; CPU continues.":
       isRecharging(caster())?"Recharge round — your wizard skips this turn; CPU continues.":
       "Choose a spell, tap an enemy, and confirm.");
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
      state.phase==="finished"?"BATTLE COMPLETE":"RESOLVING SPELLS";
    ui.badge.textContent=state.size+" vs "+state.size+" · "+
      (state.mode==="story"?"STORY / CPU":"PvP LOCAL TEST");
    ui.queueCount.textContent=planning?(c?"YOUR TURN":"CPU PLAYING"):
      state.phase==="resolving"?"ACTION "+state.queueAt+" / "+state.sequence.length:"FINISHED";
    if(planning)ui.hint.textContent=c?
      (isStunned(c)?"STUNNED: "+c.name+" skips this one action.":
       isRecharging(c)?"RECHARGING: "+c.name+" must skip this round. Tidal Echo remains active.":
       card?(target?"Confirm "+card.name+" on "+target.name+".":"Tap an enemy to target "+card.name+"."):
        "Tap one of your three spells below."):
      "Your wizard is knocked out. Teammates are CPU-controlled.";
    ui.handTitle.textContent=(c?c.name:(planning?"Spectating teammates":"Your wizard"))+
      (planning?" · "+(card?"Tap an enemy":"Choose a spell"):" · Casting");
    ui.mana.textContent=(c?c.mana:0)+" / "+MAX_MANA+" MANA";
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
    ui.chosenSpell.textContent=card?card.name.toUpperCase():"SELECT A SPELL";
    ui.chosenTarget.textContent=target?"Target: "+target.name:
      "Tap an enemy on the battlefield";
    const canConfirm=planning&&!!c&&!!card&&!!target&&
      c.mana>=card.cost&&!state.plans[c.id];
    ui.confirm.hidden=!canConfirm;
    ui.confirm.disabled=!canConfirm;
    ui.confirm.textContent=target?"Confirm Target":"Confirm Target";
    // Actual initiative preview, ordered by speed. The active resolving
    // action is highlighted, so 4v4 never leaves turn order ambiguous.
    if(ui.initiative){
      ui.initiative.innerHTML="";
      const ordered=state.phase==="resolving"?
        state.sequence.map(a=>getUnit(a.casterId)).filter(Boolean):
        [...state.units].filter(u=>u.hp>0).sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id));
      ordered.forEach((u,i)=>{
        const chip=document.createElement("span");
        chip.className="initiative-slot"+(u.team?" enemy":"")+
          (state.animation?.source===u.id?" current":"")+
          (u.hp<=0?" dimmed":"");
        chip.textContent=(i+1)+". "+u.name+" · "+u.speed;
        chip.title=u.name+": speed "+u.speed;
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
      if(c){
        // Both approved summons target enemies. Permit explicit enemy
        // selection before choosing a card if the player prefers.
        const choices=card?targetsFor(card,c):alive(1-c.team);
        for(const u of choices){
          const option=document.createElement("option");
          option.value=u.id;
          option.textContent=u.name;
          ui.targetPicker.appendChild(option);
        }
      }
      ui.targetPicker.value=state.selectedTarget||"";
      ui.targetPicker.disabled=!planning||!c;
      ui.targetPicker.hidden=!planning;
    }
    if(!ui.hand.childElementCount){
      for(const k of CARDS){
        const b=document.createElement("button");b.type="button";
        b.className="spell card-ornate school-"+k.school;
        b.dataset.card=k.id;
        b.dataset.element=k.school;
        const water=k.id==="poseidon";
        const effect=water?
          '<span class="spell-effect"><b>⧖ HIT: RECHARGE 1 ROUND</b><span>≈ HIT: NEXT WATER +30%</span></span>':
          k.id==="golem"?
          '<span class="spell-effect"><b>◈ SEISMIC FISSURE</b><span>SINGLE ENEMY · GROUND SLAM</span></span>':
          '<span class="spell-effect"><b>⚡ 20% STUN ON HIT</b><span>TARGET SKIPS 1 ACTION</span></span>';
        const rarity=water?"LEGENDARY":k.id==="golem"?"EPIC":"RARE";
        b.innerHTML='<span class="spell-tier">'+rarity+' · '+k.school.toUpperCase()+'</span>'+
          '<span class="spell-mana-cost" aria-label="'+k.cost+' mana">'+k.cost+'</span>'+
          '<span class="spell-art-shell"><canvas class="spell-art-canvas" width="240" height="196" aria-hidden="true"></canvas></span>'+
          '<span class="spell-name">'+escapeHtml(k.name)+'</span>'+
          '<span class="spell-combat"><span><b>✹ '+k.damage.toLocaleString()+'</b></span>'+
          '<span><b>◎ '+Math.round(k.accuracy*100)+'%</b> ACC</span></span>'+
          effect;
        b.setAttribute("aria-label",k.name+", "+k.cost+" mana, "+
          k.damage+" "+k.school+" damage, "+Math.round(k.accuracy*100)+
          "% accuracy. "+(water?"On a successful cast, recharge one round and gain Tidal Echo +30% next Water hit. On a miss, neither effect is applied.":
            k.id==="golem"?"Seismic fissure attack.":"Summons Professor Volt: 450 Lightning damage and 20% stun chance on a successful hit; target skips one action."));
        b.onclick=()=>chooseCard(k.id);
        ui.hand.appendChild(b);
      }
      drawCardArts();
    }
    for(const b of ui.hand.children){
      b.classList.toggle("chosen",b.dataset.card===card?.id);
      b.disabled=!planning||!c||requiresRest(c)||BY_ID[b.dataset.card].cost>c.mana;
      b.setAttribute("aria-pressed",String(b.dataset.card===card?.id));
    }
    ui.queue.disabled=!planning||!c||!card||!!state.plans[c.id]||
      c.mana<card.cost||(card.target!=="team"&&!target);
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
      chip.textContent=u.name+": "+BY_ID[p.cardId].name+
        (p.targetId?" → "+(getUnit(p.targetId)?.name||"target"):"");
      ui.plans.appendChild(chip);
    }
    if(!ui.plans.childElementCount)ui.plans.textContent=state.phase==="resolving"?
      "Combat actions are resolving...":"No actions queued yet.";
  }
  function escapeHtml(x){return String(x).replace(/[&<>"']/g,c=>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function setupControlHandlers(){
    for(const b of ui.mode.querySelectorAll("button[data-mode]"))b.onclick=()=>{
      for(const x of ui.mode.querySelectorAll("button")){const on=x===b;x.classList.toggle("active",on);x.setAttribute("aria-pressed",String(on));}
      setBattle(b.dataset.mode,state.size);
    };
    for(const b of ui.sizes.querySelectorAll("button[data-size]"))b.onclick=()=>{
      for(const x of ui.sizes.querySelectorAll("button"))x.classList.toggle("active",x===b);
      setBattle(state.mode,Number(b.dataset.size));
    };
    // Card -> enemy -> explicit confirmation. CPU teammates still auto-plan.
    ui.confirm.onclick=confirmTarget;
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
    if(ui.targetPicker)ui.targetPicker.onchange=()=>{};
    ui.statusClose.onclick=closeStatusInfo;
    canvas.addEventListener("pointerdown",event=>{
      const rect=canvas.getBoundingClientRect();
      const x=(event.clientX-rect.left)*W/rect.width;
      const y=(event.clientY-rect.top)*H/rect.height;
      // Magical runes remain inspectable even during spell animations.
      if(hitStatusRune(x,y))return;
      closeStatusInfo();
      if(state.phase!=="planning")return;
      // Opposing models and their new SIDE nameplates are both tappable.
      // Selection previews the down arrow; only Confirm Target starts a cast.
      if(!currentCard()||!caster())return;
      const candidates=alive(1-state.planningSide)
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
    if(state.phase==="planning"&&currentCard()&&caster()&&u.hp>0&&u.team!==state.planningSide)
      ellipse(g,0,5,87*scale,30*scale,"#d4b64d20","#f6d487",4);
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
        "golem-travel","golem-impact"].includes(visualStage)){
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
  // Small plates sit OUTSIDE each character silhouette: allies on the
  // left, enemies on the right. Shared placements also inform tap hitboxes.
  function unitPlateRect(u){
    // Narrow side plates avoid the adjacent front-row character silhouettes
    // in dense 4v4 seating, particularly the two rightmost enemies.
    const w=100;
    const x=clamp(u.team?u.x+82:u.x-w-82,8,W-w-8);
    const y=u.y-132;
    return {x,y,w,h:43};
  }
  function unitStatuses(u){
    const list=u.statuses.slice(0,3);
    if(state.auras[u.team])list.push({kind:"aura",icon:"◎",value:state.auras[u.team].value});
    return list.slice(0,4);
  }
  function statusRuneRect(u,index){
    const p=unitPlateRect(u);
    return {x:p.x+18+index*31,y:p.y+58,r:13,hitRadius:24};
  }
  function describeStatus(u,st){
    switch(st.kind){
      case "recharge":
        return {title:"⧖ Recharge · Debuff",
          detail:u.name+" must skip Round "+u.rechargeRound+
          " after using Poseidon's Wrath. The status expires once that round has passed."};
      case "stun":
        return {title:"⚡ Stunned · 1 action",
          detail:u.name+" is stunned by Professor Volt and will lose their next eligible action"+
            (u.stunRound===state.round?" this round.":" next round.")+
            " A stun does not alter spell accuracy or deal additional damage."};
      case "tidal_echo":
        return {title:"≈ Tidal Echo · Water buff",
          detail:"The next SUCCESSFUL damaging Water spell from "+u.name+
          " deals +30% damage (1.30×). Earth spells do not use it; misses do not consume it. This bonus does not stack."};
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
    for(const u of state.units){
      if(u.hp<=0)continue;
      for(const [i,st] of unitStatuses(u).entries()){
        const r=statusRuneRect(u,i);
        if(Math.abs(x-r.x)<=r.hitRadius&&Math.abs(y-r.y)<=r.hitRadius){
          showStatusInfo(u,st);
          return true;
        }
      }
    }
    return false;
  }
  function drawUnitPlate(u){
    const {x,y,w}=unitPlateRect(u);
    g.save();
    const disabled=u.hp<=0;
    g.globalAlpha=disabled?.66:1;
    const tint=u.team?"#865563":"#3f96a7";
    rounded(g,x,y,w,20,6,"#061621eb",tint,1.3);
    g.fillStyle=disabled?"#ab9e9e":"#e9f6f2";
    g.font="700 11px system-ui,sans-serif";
    g.textAlign="center";g.textBaseline="middle";
    g.fillText(u.name,x+w/2,y+10,w-8);
    rounded(g,x+2,y+23,w-4,9,4,"#101b27eb");
    if(u.hp>0)rounded(g,x+3,y+24,(w-6)*clamp(u.hp/u.maxHp,0,1),
      7,3,u.team?"#cc7364":"#66d8a0");
    g.font="700 9px system-ui,sans-serif";
    g.fillStyle=disabled?"#f2b4aa":"#d4e3d8";
    g.fillText(disabled?"K.O.":u.hp+" / "+u.maxHp+" HP",x+w/2,y+38,w-4);
    // Persistent magic runes sit BELOW the HP plate, never over the
    // fighter's face. Each rune is independently tappable for details.
    const symbols=unitStatuses(u);
    symbols.forEach((st,i)=>{
      const r=statusRuneRect(u,i);
      const glow=st.kind==="tidal_echo"?"#44dbee":
        st.kind==="stun"?"#98dfff":
        st.kind==="recharge"?"#e6b75b":"#b4eac2";
      ellipse(g,r.x,r.y,13,13,"#071d2dec",glow,2);
      g.fillStyle=glow;g.font="bold 19px system-ui,sans-serif";
      g.textAlign="center";g.textBaseline="middle";
      g.fillText(st.icon,r.x,r.y+1);
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
    for(const b of ui.hand.children){
      const card=BY_ID[b.dataset.card];
      const canvas=b.querySelector?.(".spell-art-canvas");
      if(!card||!canvas)continue;
      const c=canvas.getContext("2d");if(!c)continue;
      const width=canvas.width,height=canvas.height,water=card.school==="water";
      c.clearRect(0,0,width,height);
      const sky=c.createLinearGradient(0,0,0,height);
      sky.addColorStop(0,water?"#155473":"#5e5143");
      sky.addColorStop(.55,water?"#0b3049":"#2c3032");
      sky.addColorStop(1,water?"#061c30":"#171d28");
      c.fillStyle=sky;c.fillRect(0,0,width,height);
      c.save();c.globalAlpha=.17;c.fillStyle=water?"#4dd4ed":"#dbc489";
      c.beginPath();c.moveTo(0,0);c.lineTo(width*.36,0);
      c.lineTo(width*.11,height*.64);c.lineTo(0,height*.82);c.closePath();c.fill();
      c.beginPath();c.moveTo(width*.76,0);c.lineTo(width,0);
      c.lineTo(width,height*.68);c.lineTo(width*.82,height*.44);c.closePath();c.fill();
      c.restore();
      const frame=card.artFrame||0,row=Math.floor(frame/4),col=frame%4;
      const image=spriteCache[card.id]?.[row];
      if(card.id==="volt"){
        const rendered=window.WIZARDRY_PROFESSOR_V49?.drawCardArt(c,width,height);
        if(!rendered){
          c.font="bold 71px Georgia,serif";c.textAlign="center";
          c.fillStyle="#a7f4fc";c.fillText("ϟ",width/2,height*.57);
        }
      }else if(image?.complete&&image.naturalWidth>0){
        const edges=[0,314,627,940,1254],size=water?212:210;
        c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
        c.drawImage(image,edges[col],0,edges[col+1]-edges[col],
          row===0||row===3?314:313,(width-size)/2,water?-9:-6,size,size);
        c.restore();
      }else{
        c.font="bold 70px Georgia,serif";c.textAlign="center";
        c.fillStyle=water?"#96eefa":"#dbcc92";
        c.fillText(water?"♆":"◆",width/2,height*.55);
      }
      const v=c.createLinearGradient(0,height*.61,0,height);
      v.addColorStop(0,"#07172600");
      v.addColorStop(1,water?"#061b32e9":"#171d29eb");
      c.fillStyle=v;c.fillRect(0,height*.61,width,height*.39);
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
  function drawAction(anim,time){
    const p=clamp(anim.elapsed/anim.duration,0,1),caster=getUnit(anim.source),
      target=getUnit(anim.target),card=anim.card;
    if(!caster)return;
    const baseX=lerp(caster.x,target?.x||500,.48);
    const baseY=lerp(caster.y,target?.y||360,.53)+65;
    g.save();
    if(card.id==="volt"){
      // An actual eight-pose inventor animal aims both electrodes at the
      // current target. The independently animated beam runs to their body.
      window.WIZARDRY_PROFESSOR_V49?.draw(g,{progress:p,time,target});
      g.restore();return;
    }
    if(card.kind==="summon"){
      const idx=card.id==="poseidon"?approvedPoseidonIndex(p):clamp(Math.floor(p*16),0,15);
      const done=renderSprite(card.id,idx,500,470,310,target,p);
      if(!done){
        const col=card.id==="poseidon"?"#66daf0":"#96b97e";
        ellipse(g,500,392,65+Math.sin(time*.006)*6,18,col+"66",col,3);
        g.font="bold 22px system-ui";g.fillStyle=col;g.textAlign="center";
        g.fillText(card.name,500,337);
      }
      const release=POSEIDON_KEY_TIMES[10];
      if(card.id==="poseidon"&&p>=release&&p<card.hit&&target){
        const t=ease((p-release)/(card.hit-release));
        const originX=target.x>=500?550:450,originY=284;
        const x=lerp(originX,target.x,t);
        const y=lerp(originY,target.y-105,t)-38*Math.sin(Math.PI*t);
        const direction=target.x>=500?1:-1;
        line(g,x-direction*70,y+15,x,y,"#3acfe3",18);
        line(g,x-direction*38,y+7,x,y,"#d3fdff",5);
        drawFlyingTrident(x,y,Math.atan2(target.y-105-originY,target.x-originX));
      }
    }else{
      if(target&&card.target!=="team"){
        const x=lerp(caster.x,target.x,ease(p)),y=lerp(caster.y-105,target.y-100,ease(p));
        if(card.kind==="damage"){
          line(g,caster.x,caster.y-125,x,y,"#66e2f1",9);
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
      centerX:500,centerY:310,scale:5.55
    });
  }
  function drawRuneOutcome(a){
    if(!a||!["rune-success","rune-fail"].includes(a.stage))return;
    window.WIZARDRY_ELEMENT_TRACE_V45?.drawOutcome(g,{
      school:a.card.school,
      result:a.stage==="rune-success"?"success":"fail",
      elapsed:a.elapsed,duration:a.duration,
      centerX:500,centerY:310,scale:5.55
    });
  }
  function drawFizzle(a){
    if(!a||a.stage!=="fizzle")return;
    const c=getUnit(a.source);if(!c)return;
    const progress=a.elapsed/a.duration;
    const centerX=500,centerY=339;
    g.save();g.globalAlpha=Math.max(0,1-progress);
    ellipse(g,centerX,centerY,17+progress*77,17+progress*29,
      null,"#ef9e9f",3);
    line(g,centerX-20,centerY-20,centerX+20,centerY+20,"#faa9aa",3);
    line(g,centerX+20,centerY-20,centerX-20,centerY+20,"#faa9aa",3);
    g.restore();
  }
  function render(time){
    g.setTransform(1,0,0,1,0,0);
    if(background)g.drawImage(background,0,0,W,H);else drawBackground(g);
    if(state.auras[0])ellipse(g,500,465,388,107,"#3fd5ce0b","#4debdc66",4);
    if(state.auras[1])ellipse(g,500,321,347,96,"#d5c65f0b","#eed88466",4);
    // Spell passes are BELOW ALL fighter models, regardless of action
    // caster, depth or target. Approved sprites are left completely intact.
    if(state.animation){
      const a=state.animation,effects=window.WIZARDRY_GOLEM_EFFECTS_V42;
      if(["golem-slam","golem-travel","golem-impact"].includes(a.stage)){
        // Original 16-frame Golem character and the rock attack have
        // INDEPENDENT animation clips, paths, clocks and source textures.
        effects?.drawGolem(g,a,spriteCache.golem,time);
        if(a.stage==="golem-travel")effects?.drawTravel(g,a);
        if(a.stage==="golem-impact")effects?.drawImpact(g,a);
      }else if(a.stage==="summon")drawAction(a,time);
      else {
        drawAirborneRune(a);
        drawRuneOutcome(a);
        drawFizzle(a);
      }
    }
    const sorted=[...state.units].sort((a,b)=>a.y-b.y);
    for(const u of sorted)drawUnit(u,time);
    // Only the bottom portion of the 8-frame impact atlas overlays the
    // target's boots. The full effect stays behind the wizard model.
    if(state.animation?.stage==="golem-impact")
      window.WIZARDRY_GOLEM_EFFECTS_V42?.drawImpactForeground(
        g,state.animation);
    // Keep side plates readable on top without blocking the models.
    for(const u of sorted)drawUnitPlate(u);
    if(state.phase==="planning"&&currentCard()&&state.selectedTarget)
      drawTargetArrow(getUnit(state.selectedTarget),time);
    for(const f of state.flashes){
      const alpha=clamp(1-f.age/.95,0,1);
      g.save();g.globalAlpha=alpha;g.textAlign="center";g.textBaseline="middle";
      g.font="800 31px system-ui,sans-serif";g.lineWidth=5;g.strokeStyle="#081624";
      g.strokeText(f.text,f.x,f.y-f.age*67);
      g.fillStyle=f.color;g.fillText(f.text,f.x,f.y-f.age*67);g.restore();
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
    // At 120 Hz the Canvas would be repainted twice as often for no visible
    // benefit, which is expensive on iPhones. Cap to roughly 60 fps.
    if(now-frameLast<13.3){requestAnimationFrame(tick);return;}
    const dt=Math.min(55,Math.max(0,now-frameLast||0));frameLast=now;
    updateFacing(dt);
    if(state.phase==="resolving"&&state.animation)
      updateCastSequence(dt);
    // Each fallen wizard gets its own timeline: play the sequence once,
    // then freeze on frame 7 through the rest of the battle and victory.
    for(const u of state.units){
      if(u.hp<=0){
        if(!Number.isFinite(u.defeatElapsedMs))u.defeatElapsedMs=0;
        else u.defeatElapsedMs=Math.min(DEFEAT_HOLD_MS,u.defeatElapsedMs+dt);
      }
    }
    for(const f of state.flashes)f.age+=dt/1000;
    state.flashes=state.flashes.filter(f=>f.age<.96);
    render(now);
    requestAnimationFrame(tick);
  }
  // Small test API for browser and deterministic combat regression checks.
  window.WIZARDRY_ARENA_TEST={
    getState:()=>state,
    cards:CARDS,desiredYaw,updateFacing,runePath,spellHitCheck,
    isStunned,attemptVoltStun,requiresRest,applySpell,
    runeTiming:()=>({trace:AUTO_TRACE_MS,glow:RUNE_GLOW_MS,
      crumble:RUNE_CRUMBLE_MS}),
    setBattle,queueSpell,autoFill,resolvePressed,
    chooseCard,selectCaster,selectTarget,confirmTarget,unitPlateRect,
    statusRuneRect,showStatusInfo,closeStatusInfo,unitStatuses,
    getGolemTravelInfo:()=>state?.animation?.stage==="golem-travel"?
      {start:state.animation.travelStart,end:state.animation.travelEnd,
       duration:state.animation.duration,progress:state.animation.elapsed/state.animation.duration}:null,
    getGolemSpriteInfo:()=>window.WIZARDRY_GOLEM_EFFECTS_V42?.getAtlasInfo(),
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
  setupControlHandlers();createBackground();setupSprites();setBattle("story",4);
  requestAnimationFrame(tick);
})();