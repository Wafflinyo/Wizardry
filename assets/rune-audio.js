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

  // Resonance entries specify material, frequency contour, time window and level.
  // Texture entries specify filter type, frequency contour, time window and level.
  const schools={
    water:{
      resonances:[["glass",[235,305,268],0,1,.27],["glass",[440,610,490],.14,.72,.19],["glass",[700,940,1140],.52,.96,.12]],
      textures:[["bandpass",[470,880,520],0,1,.25]]
    },
    earth:{
      resonances:[["stone",[100,129,116],0,1,.39],["stone",[185,150,118],.02,.39,.22],["glass",[410,332,258],.55,.96,.16]],
      textures:[["lowpass",[490,310,200],0,.55,.30],["bandpass",[660,510,310],.48,.98,.23]]
    },
    lightning:{
      resonances:[["stone",[250,890,570],0,.42,.18,33],["electric",[320,635,870],.15,1,.12,41],["glass",[770,1380,1010],.57,.97,.18,28]],
      textures:[["highpass",[1100,2200,1500],0,1,.13],["bandpass",[1800,4300,2400],.66,.95,.21]]
    },
    nature:{
      resonances:[["glass",[284,322,304],0,1,.22],["glass",[438,525,480],.03,.68,.23,5],["glass",[680,830,760],.29,.62,.17,7],["glass",[605,925,880],.58,.99,.21,6]],
      textures:[["bandpass",[445,730,600],.10,.96,.10]]
    },
    wind:{
      resonances:[["glass",[350,495,635],0,1,.24,5],["glass",[760,605,910],.18,.87,.21,8],["glass",[970,1310,1035],.66,1,.17,6]],
      textures:[["bandpass",[630,1520,960],0,1,.27]]
    },
    dark:{
      resonances:[["stone",[202,155,105],0,1,.37,11],["glass",[322,266,181],.10,.91,.26],["glass",[640,424,268],.51,1,.20,8]],
      textures:[["lowpass",[750,355,210],0,1,.21]]
    },
    fire:{
      resonances:[["ember",[118,290,237],0,1,.17],["stone",[260,435,390],.07,.83,.22],["glass",[650,1050,765],.53,.97,.17]],
      textures:[["bandpass",[610,1500,1020],0,1,.29],["highpass",[3200,5300,2900],.24,.61,.095]]
    },
    ice:{
      resonances:[["glass",[467,480,464],0,1,.26],["glass",[1020,1030,1000],.03,.55,.20],["glass",[1480,1510,1492],.32,.89,.17],["glass",[1960,2020,2000],.59,1,.15]],
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
    gain.gain.value=.72;
    filter.connect(gain).connect(audio.destination);
    const {resonances,textures}=schools[cast.card?.school]||schools.wind;

    for(const [character,frequencies,from,to,volume,motion] of resonances){
      const cue=layer(filter,origin,duration,elapsed,from,to,volume*1.55);
      if(!cue)continue;
      // Broad, inharmonic resonances respond to coarse grains, like rubbed metal or stone.
      const source=audio.createBufferSource();
      source.buffer=noiseBuffer();source.loop=true;
      const spread=character==="glass"?1.73:character==="stone"?2.31:3.17;
      for(const [scale,width,level] of [[1,2.6,1],[spread,3.8,.56]]){
        const resonance=audio.createBiquadFilter(),mix=audio.createGain();
        resonance.type="bandpass";
        resonance.Q.value=width;
        contour(resonance.frequency,frequencies.map(hz=>hz*scale),cue.start,cue.span,cue.fraction);
        mix.gain.value=level;
        source.connect(resonance).connect(mix).connect(cue.gain);
      }
      if(motion){
        const flutter=audio.createOscillator(),depth=audio.createGain();
        flutter.frequency.value=motion*1.29;
        depth.gain.value=volume*.085;
        flutter.connect(depth).connect(cue.gain.gain);
        flutter.start(cue.start);flutter.stop(cue.end);
      }
      source.start(cue.start,(from*1.71+frequencies[0]/1000)%1);
      source.stop(cue.end);
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
