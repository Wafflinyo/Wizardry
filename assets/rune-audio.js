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

  // Resonance entries specify material, frequency contour, time window and level.
  const schools={
    water:{
      resonances:[["glass",[235,305,268],0,1,.27],["glass",[440,610,490],.14,.72,.19],["glass",[700,940,1140],.52,.96,.12]]
    },
    earth:{
      resonances:[["stone",[100,129,116],0,1,.39],["stone",[185,150,118],.02,.39,.22],["glass",[410,332,258],.55,.96,.16]]
    },
    lightning:{
      resonances:[["stone",[250,890,570],0,.42,.18],["electric",[320,635,870],.15,1,.12],["glass",[770,1380,1010],.57,.97,.18]]
    },
    nature:{
      resonances:[["glass",[284,322,304],0,1,.22],["glass",[438,525,480],.03,.68,.23],["glass",[680,830,760],.29,.62,.17],["glass",[605,925,880],.58,.99,.21]]
    },
    wind:{
      resonances:[["glass",[350,495,635],0,1,.24],["glass",[760,605,910],.18,.87,.21],["glass",[970,1310,1035],.66,1,.17]]
    },
    dark:{
      resonances:[["stone",[202,155,105],0,1,.37],["glass",[322,266,181],.10,.91,.26],["glass",[640,424,268],.51,1,.20]]
    },
    fire:{
      resonances:[["ember",[118,290,237],0,1,.17],["stone",[260,435,390],.07,.83,.22],["glass",[650,1050,765],.53,.97,.17]]
    },
    ice:{
      resonances:[["glass",[467,480,464],0,1,.26],["glass",[1020,1030,1000],.03,.55,.20],["glass",[1480,1510,1492],.32,.89,.17],["glass",[1960,2020,2000],.59,1,.15]]
    }
  };

  function contour(param,values,start,span,fraction){
    const [first,middle,last]=values;
    const initial=fraction<.5?first*(middle/first)**(fraction*2):middle*(last/middle)**((fraction-.5)*2);
    param.setValueAtTime(initial,start);
    if(fraction<.5)param.exponentialRampToValueAtTime(middle,start+span*(.5-fraction)/(1-fraction));
    param.exponentialRampToValueAtTime(last,start+span);
  }

  function layer(output,origin,duration,elapsed,from,to,volume){
    const first=from*duration,last=to*duration;
    const span=last-Math.max(elapsed,first);
    if(span<.025)return null;
    const start=origin+Math.max(0,first-elapsed),end=start+span;
    const gain=audio.createGain();
    gain.gain.setValueAtTime(0,start);
    gain.gain.linearRampToValueAtTime(volume,start+span*.28);
    gain.gain.linearRampToValueAtTime(volume*.72,start+span*.63);
    gain.gain.linearRampToValueAtTime(0,end);
    gain.connect(output);
    return {gain,start,span,end,fraction:Math.max(0,(elapsed-first)/(last-first))};
  }

  function begin(cast){
    const elapsed=Math.max(0,cast.elapsed)/1000,duration=cast.duration/1000;
    const origin=audio.currentTime+.006,end=origin+duration-elapsed;
    const gain=audio.createGain(),filter=audio.createBiquadFilter();
    filter.type="lowpass";filter.frequency.value=4600;filter.Q.value=.25;
    gain.gain.value=.42;
    filter.connect(gain).connect(audio.destination);
    const {resonances}=schools[cast.card?.school]||schools.wind;
    for(const [character,frequencies,from,to,volume] of resonances){
      const cue=layer(filter,origin,duration,elapsed,from,to,volume);
      if(!cue)continue;
      // Inharmonic partials give each voice a ringing edge without a breath layer.
      const partials=character==="glass"?[[1,.61],[2.41,.23],[4.17,.15]]:
        character==="stone"?[[1,.69],[1.61,.23],[3.72,.12]]:
        character==="electric"?[[1,.56],[2.72,.28],[4.51,.14]]:
        [[1,.60],[1.91,.23],[3.36,.16]];
      for(const [ratio,level] of partials){
        const tone=audio.createOscillator(),mix=audio.createGain();
        tone.type=ratio===1&&character!=="glass"?"triangle":"sine";
        contour(tone.frequency,frequencies.map(hz=>hz*ratio),cue.start,cue.span,cue.fraction);
        mix.gain.setValueAtTime(level,cue.start);
        if(ratio!==1)mix.gain.exponentialRampToValueAtTime(level*.24,cue.end);
        tone.connect(mix).connect(cue.gain);
        tone.start(cue.start);tone.stop(cue.end);
      }
    }
    return {gain,end};
  }
  function follow(cast,round){
    const stage=cast?.stage;
    const key=cast&&[round,cast.source,cast.card?.id].join("|");
    const changed=stage!==lastStage||key!==lastCast;
    if(changed){
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
