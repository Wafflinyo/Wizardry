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
    const start=audio.currentTime+.006;
    const end=start+remaining;
    const gain=audio.createGain();
    gain.gain.setValueAtTime(0,start);
    gain.gain.linearRampToValueAtTime(.15,start+Math.min(.16,remaining*.4));
    gain.gain.setValueAtTime(.15,end-Math.min(.18,remaining*.4));
    gain.gain.linearRampToValueAtTime(0,end);
    gain.connect(audio.destination);

    // Blend soft harmonics into a single sustained, slightly airy note.
    for(const [pitch,level] of [[440,.71],[660,.16],[880,.095],[1320,.035]]){
      const tone=audio.createOscillator(),partial=audio.createGain();
      tone.frequency.value=pitch;
      partial.gain.value=level;
      tone.connect(partial).connect(gain);
      tone.start(start);tone.stop(end+.10);
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
