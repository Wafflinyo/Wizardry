/* Short Web Audio cues for the auto-traced casting rune. */
(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  let audio,grain,flow,lastStage,lastCast;
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

  // Tone entries specify waveform, pitch contour, time window and level.
  // Texture entries specify filter type, frequency contour, time window and level.
  const schools={
    water:{
      tones:[["sine",[235,305,268],0,1,.27],["sine",[440,610,490],.14,.72,.19],["sine",[700,940,1140],.52,.96,.12]],
      textures:[["bandpass",[470,880,520],0,1,.25]]
    },
    earth:{
      tones:[["triangle",[100,129,116],0,1,.39],["triangle",[185,150,118],.02,.39,.22],["sine",[410,332,258],.55,.96,.16]],
      textures:[["lowpass",[490,310,200],0,.55,.30],["bandpass",[660,510,310],.48,.98,.23]]
    },
    lightning:{
      tones:[["triangle",[250,890,570],0,.42,.18,33],["square",[320,635,870],.15,1,.12,41],["sine",[770,1380,1010],.57,.97,.18,28]],
      textures:[["highpass",[1100,2200,1500],0,1,.13],["bandpass",[1800,4300,2400],.66,.95,.21]]
    },
    nature:{
      tones:[["sine",[284,322,304],0,1,.22],["sine",[438,525,480],.03,.68,.23,5],["sine",[680,830,760],.29,.62,.17,7],["sine",[605,925,880],.58,.99,.21,6]],
      textures:[["bandpass",[445,730,600],.10,.96,.10]]
    },
    wind:{
      tones:[["sine",[350,495,635],0,1,.24,5],["sine",[760,605,910],.18,.87,.21,8],["sine",[970,1310,1035],.66,1,.17,6]],
      textures:[["bandpass",[630,1520,960],0,1,.27]]
    },
    dark:{
      tones:[["triangle",[202,155,105],0,1,.37,11],["sine",[322,266,181],.10,.91,.26],["sine",[640,424,268],.51,1,.20,8]],
      textures:[["lowpass",[750,355,210],0,1,.21]]
    },
    fire:{
      tones:[["sawtooth",[118,290,237],0,1,.17],["triangle",[260,435,390],.07,.83,.22],["sine",[650,1050,765],.53,.97,.17]],
      textures:[["bandpass",[610,1500,1020],0,1,.29],["highpass",[3200,5300,2900],.24,.61,.095]]
    },
    ice:{
      tones:[["sine",[467,480,464],0,1,.26],["sine",[1020,1030,1000],.03,.55,.20],["sine",[1480,1510,1492],.32,.89,.17],["sine",[1960,2020,2000],.59,1,.15]],
      textures:[["highpass",[2700,3900,3000],.37,1,.10]]
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

  function noiseBuffer(){
    if(!grain){
      grain=audio.createBuffer(1,Math.ceil(audio.sampleRate*3),audio.sampleRate);
      const data=grain.getChannelData(0);
      let seed=2077;
      for(let i=0;i<data.length;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        data[i]=seed/2147483648-1;
      }
    }
    return grain;
  }

  function begin(cast){
    const elapsed=Math.max(0,cast.elapsed)/1000,duration=cast.duration/1000;
    const origin=audio.currentTime+.006,end=origin+duration-elapsed;
    const gain=audio.createGain(),filter=audio.createBiquadFilter();
    filter.type="lowpass";filter.frequency.value=4600;filter.Q.value=.25;
    gain.gain.value=.40;
    filter.connect(gain).connect(audio.destination);
    const {tones,textures}=schools[cast.card?.school]||schools.wind;

    for(const [type,pitches,from,to,volume,motion] of tones){
      const cue=layer(filter,origin,duration,elapsed,from,to,volume);
      if(!cue)continue;
      const tone=audio.createOscillator();
      tone.type=type;
      contour(tone.frequency,pitches,cue.start,cue.span,cue.fraction);
      if(motion){
        const modulator=audio.createOscillator(),depth=audio.createGain();
        modulator.frequency.value=motion;
        depth.gain.value=pitches[0]*(motion>20?.20:.025);
        modulator.connect(depth).connect(tone.frequency);
        modulator.start(cue.start);modulator.stop(cue.end);
      }
      tone.connect(cue.gain);
      tone.start(cue.start);tone.stop(cue.end);
    }

    for(const [type,frequencies,from,to,volume] of textures){
      const cue=layer(filter,origin,duration,elapsed,from,to,volume);
      if(!cue)continue;
      const noise=audio.createBufferSource(),color=audio.createBiquadFilter();
      noise.buffer=noiseBuffer();noise.loop=true;
      color.type=type;color.Q.value=.65;
      contour(color.frequency,frequencies,cue.start,cue.span,cue.fraction);
      noise.connect(color).connect(cue.gain);
      noise.start(cue.start);noise.stop(cue.end);
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
