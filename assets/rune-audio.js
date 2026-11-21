/* Short Web Audio cues for the auto-traced casting rune. */
(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  let audio,flow,lastStage,lastCast;
  function unlock(){
    try{
      audio??=new Audio();
      if(audio.state!=="running")audio.resume().catch(()=>{});
    }catch{
      // Audio is optional on browsers that cannot open a context.
    }
  }
  document.addEventListener("pointerup",unlock,{capture:true,passive:true});
  document.addEventListener("click",unlock,{capture:true,passive:true});

  // Notes use fractions of the trace: [start, length, MIDI note, level].
  const themes={
    water:{
      attack:.075,tail:.37,partials:[[1,1],[2,.23],[3.02,.1]],finish:[69,76],
      notes:[[0,.95,57,.043],[0,.35,69,.13],[.12,.34,72,.10],[.24,.41,76,.13],[.37,.32,79,.10],[.49,.38,77,.12],[.62,.30,74,.09],[.73,.27,72,.11],[.83,.17,76,.105]]
    },
    earth:{
      attack:.013,tail:.46,partials:[[1,1],[1.73,.21],[3.47,.095]],finish:[46,53,65],
      notes:[
        [0,.51,46,.18],[.24,.41,53,.085],[.50,.50,46,.145],[.75,.25,53,.082],
        [.09,.38,65,.12],[.22,.37,60,.105],[.43,.38,62,.13],[.59,.36,67,.12],[.77,.23,65,.13]
      ]
    },
    lightning:{
      attack:.004,tail:.24,partials:[[1,1],[2.63,.37],[4.77,.22]],finish:[61,73,85],
      notes:[
        [0,1,49,.05],[0,.18,73,.15],[.061,.18,80,.12],[.126,.18,73,.14],[.191,.20,80,.13],
        [.29,.25,85,.142],[.44,.19,73,.15],[.502,.18,80,.12],[.564,.18,73,.14],[.626,.18,80,.13],
        [.72,.17,92,.125],[.78,.17,88,.107],[.84,.16,85,.15]
      ]
    },
    nature:{
      attack:.041,tail:.46,partials:[[1,1],[2,.18],[3,.065]],finish:[64,72,79],
      notes:[[0,.60,48,.056],[0,.29,64,.12],[.16,.42,67,.11],[.30,.27,65,.10],[.40,.39,69,.13],[.44,.54,53,.052],[.57,.28,72,.14],[.68,.32,76,.09],[.76,.24,74,.11],[.84,.16,79,.10]]
    },
    wind:{
      attack:.057,tail:.43,partials:[[1,1],[2.03,.22],[3.91,.17]],finish:[74,81],
      notes:[[0,1,62,.043],[0,.35,74,.14],[.13,.28,81,.10],[.22,.37,86,.14],[.38,.31,83,.10],[.51,.40,78,.13],[.67,.31,76,.11],[.77,.23,81,.12]]
    },
    dark:{
      attack:.025,tail:.63,partials:[[1,1],[1.49,.31],[2.35,.19]],finish:[48,59],
      notes:[[0,1,48,.063],[0,.42,67,.15],[.21,.36,63,.12],[.39,.34,62,.10],[.53,.44,54,.062],[.57,.28,59,.16],[.70,.30,55,.12],[.81,.19,51,.115]]
    },
    fire:{
      attack:.016,tail:.50,partials:[[1,1],[2.03,.31],[3.36,.20]],finish:[57,64,72],
      notes:[[0,.54,45,.068],[0,.39,69,.15],[.09,.34,72,.12],[.22,.35,76,.135],[.37,.29,74,.12],[.43,.57,52,.060],[.48,.31,71,.12],[.58,.32,68,.105],[.69,.31,76,.145],[.84,.16,72,.13]]
    },
    ice:{
      attack:.006,tail:.24,partials:[[1,1],[2.38,.33],[4.16,.28]],finish:[65,77,84],
      notes:[[0,.95,53,.052],[0,.39,84,.13],[.12,.33,77,.11],[.25,.27,81,.10],[.39,.29,89,.125],[.49,.35,86,.12],[.64,.33,93,.092],[.72,.28,84,.12],[.84,.16,88,.11]]
    }
  };
  const themeFor=school=>Object.hasOwn(themes,school)?themes[school]:themes.wind;

  function voice(output,theme,note,start,length,volume){
    const pitch=440*2**((note-69)/12);
    for(const [i,[ratio,level]] of theme.partials.entries()){
      const tone=audio.createOscillator(), gain=audio.createGain();
      const span=length*(1-i*.16),end=start+span;
      const attack=Math.min(theme.attack,span*.23);
      const release=start+Math.max(attack+span*.01,span*.68);
      const peak=volume*level;
      tone.frequency.value=pitch*ratio;
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.linearRampToValueAtTime(peak,start+attack);
      gain.gain.exponentialRampToValueAtTime(peak*theme.tail,release);
      gain.gain.exponentialRampToValueAtTime(.0001,end);
      tone.connect(gain).connect(output);
      tone.start(start);tone.stop(end);
    }
  }

  function begin(cast){
    const elapsed=Math.max(0,cast.elapsed)/1000,duration=cast.duration/1000;
    const start=audio.currentTime+.006,end=start+duration-elapsed;
    const gain=audio.createGain();
    gain.gain.value=.66;
    gain.connect(audio.destination);
    const theme=themeFor(cast.card?.school);
    for(const [offset,length,note,volume] of theme.notes){
      const on=Math.max(0,offset*duration-elapsed);
      const remaining=Math.min(1,offset+length)*duration-elapsed-on;
      if(remaining>.035)voice(gain,theme,note,start+on,remaining,volume);
    }
    return {gain,end};
  }

  function completeRune(school){
    const theme=themeFor(school),start=audio.currentTime+.006;
    for(const [i,note] of theme.finish.entries()){
      voice(audio.destination,theme,note,start+i*.022,.32+i*.035,.072/(1+i*.35));
    }
  }

  function follow(cast,round){
    const stage=cast?.stage;
    const key=cast&&[round,cast.source,cast.card?.id].join("|");
    const changed=stage!==lastStage||key!==lastCast;
    if(changed){
      if(lastStage==="tracing-auto"&&key===lastCast&&stage==="rune-success"&&audio?.state==="running"){
        completeRune(cast.card?.school);
      }
      if(flow&&audio.currentTime<flow.end){
        const now=audio.currentTime;
        const level=flow.gain.gain;
        if(typeof level.cancelAndHoldAtTime==="function"){
          level.cancelAndHoldAtTime(now);
        }else{
          level.cancelScheduledValues(now);
          level.setValueAtTime(level.value,now);
        }
        level.linearRampToValueAtTime(0,now+.07);
      }
      flow=null;lastStage=stage;lastCast=key;
    }
    if(flow||stage!=="tracing-auto"||audio?.state!=="running")return;
    const remaining=(cast.duration-cast.elapsed)/1000;
    if(remaining>.12)flow=begin(cast);
  }
  window.WizardryRuneAudio={follow};
})();
