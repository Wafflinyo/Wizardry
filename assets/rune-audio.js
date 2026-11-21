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

  function begin(remaining){
    const start=audio.currentTime+.006,end=start+remaining;
    const gain=audio.createGain(),filter=audio.createBiquadFilter();
    filter.type="lowpass";
    filter.Q.value=.4;
    filter.frequency.setValueAtTime(620,start);
    filter.frequency.exponentialRampToValueAtTime(1950,start+remaining*.88);
    filter.frequency.exponentialRampToValueAtTime(1300,end);
    filter.connect(gain).connect(audio.destination);

    gain.gain.setValueAtTime(0,start);
    gain.gain.linearRampToValueAtTime(.06,start+remaining*.20);
    gain.gain.linearRampToValueAtTime(.17,start+remaining*.8);
    gain.gain.linearRampToValueAtTime(.18,start+remaining*.90);
    gain.gain.linearRampToValueAtTime(0,end);

    // Sustain one voicing and gradually brighten it over the whole trace.
    for(const [type,pitch,level] of [["triangle",261.63,.52],["sine",392,.23],["triangle",523.25,.14],["sine",659.25,.08]]){
      const tone=audio.createOscillator(),mix=audio.createGain();
      tone.type=type;
      tone.frequency.value=pitch;
      mix.gain.value=level;
      tone.connect(mix).connect(filter);
      tone.start(start);tone.stop(end+.08);
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
    if(remaining>.12)flow=begin(remaining);
  }
  window.WizardryRuneAudio={follow};
})();
