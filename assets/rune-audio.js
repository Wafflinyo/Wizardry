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

  function begin(cast){
    const elapsed=Math.max(0,cast.elapsed)/1000,duration=cast.duration/1000;
    const remaining=duration-elapsed;
    const start=audio.currentTime+.006,end=start+remaining;
    const gain=audio.createGain(),filter=audio.createBiquadFilter();
    filter.type="lowpass";
    filter.Q.value=.4;
    filter.frequency.setValueAtTime(620,start);
    filter.frequency.exponentialRampToValueAtTime(1950,start+remaining*.88);
    filter.frequency.exponentialRampToValueAtTime(1300,end);
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

    // The same bright voicing continues across the short gaps between strokes.
    for(const [type,pitch,level] of [["triangle",311.13,.52],["sine",466.16,.23],["triangle",622.25,.14],["sine",739.99,.08]]){
      const tone=audio.createOscillator(),mix=audio.createGain();
      tone.type=type;
      tone.frequency.setValueAtTime(pitch,start);
      tone.frequency.exponentialRampToValueAtTime(pitch*1.045,end);
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
    if(remaining>.12)flow=begin(cast);
  }
  window.WizardryRuneAudio={follow};
})();
