/* Short Web Audio cues for the auto-traced casting rune. */
(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  let audio,grain,flow,lastStage,lastCast;
  // Fundamental, pitch rise, modulation ratio and depth, brightness, accent, texture.
  const voices={
    water:     [330,1.25,1.0,.28, 740,1900,2.01,.24,0],
    earth:     [168,1.08,1.5,.47, 430,1150,2.00,.16,0],
    lightning: [310,1.45,2.7,.74,1250,3500,3.02,.24,.22],
    nature:    [392,1.17,2.0,.17, 710,2300,1.50,.36,0],
    wind:      [470,1.31,1.0,.12,1150,2800,2.00,.20,0],
    dark:      [218,.85, 1.4,.65, 680,1340,1.43,.36,0],
    fire:      [256,1.31,1.8,.49, 810,2770,2.15,.17,.17],
    ice:       [520,1.10,3.1,.36,1500,3350,2.32,.39,0]
  };

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

  function begin(cast){
    const elapsed=Math.max(0,cast.elapsed)/1000,duration=cast.duration/1000;
    const remaining=duration-elapsed;
    const start=audio.currentTime+.006,end=start+remaining;
    const [pitch,rise,ratio,depth,low,high,accentRatio,accentLevel,texture]=voices[cast.card?.school]||voices.wind;
    const gain=audio.createGain(),filter=audio.createBiquadFilter();
    filter.type="lowpass";
    filter.Q.value=.4;
    filter.frequency.setValueAtTime(low,start);
    filter.frequency.exponentialRampToValueAtTime(high,start+remaining*.88);
    filter.frequency.exponentialRampToValueAtTime(high*.74,end);
    filter.connect(gain).connect(audio.destination);

    gain.gain.setValueAtTime(0,start);
    const strokes=window.WIZARDRY_ELEMENT_TRACE_V45?.timingFor(cast.card?.school)||[{start:0,end:1}];
    for(const stroke of strokes){
      const on=start+Math.max(0,stroke.start*duration-elapsed);
      const off=start+stroke.end*duration-elapsed;
      const span=off-on;
      if(span<.018)continue;
      const level=.075+.11*stroke.end;
      gain.gain.setValueAtTime(0,on);
      gain.gain.linearRampToValueAtTime(level*.58,on+Math.min(.055,span*.3));
      gain.gain.linearRampToValueAtTime(level,off-Math.min(.055,span*.25));
      gain.gain.linearRampToValueAtTime(0,off);
    }

    // Each school has its own harmonic color and pitch motion, with the same stroke timing.
    const carrier=audio.createOscillator(),modulator=audio.createOscillator();
    const modulation=audio.createGain(),body=audio.createGain(),accent=audio.createOscillator(),spark=audio.createGain();
    for(const [tone,frequency] of [[carrier,pitch],[modulator,pitch*ratio],[accent,pitch*accentRatio]]){
      tone.frequency.setValueAtTime(frequency,start);
      tone.frequency.exponentialRampToValueAtTime(frequency*rise,start+remaining*.78);
      tone.frequency.exponentialRampToValueAtTime(frequency*(1+(rise-1)*.68),end);
      tone.start(start);tone.stop(end+.08);
    }
    modulation.gain.setValueAtTime(pitch*depth*.38,start);
    modulation.gain.linearRampToValueAtTime(pitch*depth,end);
    modulator.connect(modulation).connect(carrier.frequency);
    body.gain.value=.48;
    carrier.connect(body).connect(filter);
    spark.gain.setValueAtTime(accentLevel*.30,start);
    spark.gain.linearRampToValueAtTime(accentLevel,start+remaining*.71);
    spark.gain.linearRampToValueAtTime(accentLevel*.48,end);
    accent.connect(spark).connect(filter);

    if(texture){
      if(!grain){
        grain=audio.createBuffer(1,Math.ceil(audio.sampleRate*3),audio.sampleRate);
        const data=grain.getChannelData(0);
        let seed=2077;
        for(let i=0;i<data.length;i++){
          seed=(Math.imul(seed,1664525)+1013904223)>>>0;
          data[i]=seed/2147483648-1;
        }
      }
      const air=audio.createBufferSource(),color=audio.createBiquadFilter(),mix=audio.createGain();
      air.buffer=grain;air.loop=true;
      color.type="bandpass";color.frequency.value=high*.8;color.Q.value=.85;
      mix.gain.value=texture;
      air.connect(color).connect(mix).connect(filter);
      air.start(start);air.stop(end);
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
