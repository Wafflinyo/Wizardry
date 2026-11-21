/* Short Web Audio cues for the auto-traced casting rune. */
(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  let audio,lastStage,lastCast,lastTap;
  const beats=8;

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

  function tap(start){
    // A short wooden knock with a quiet, tuned overtone.
    for(const [pitch,volume,decay] of [[740,.17,.066],[1480,.045,.034],[2220,.018,.020]]){
      const tone=audio.createOscillator(),gain=audio.createGain();
      tone.frequency.value=pitch;
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(volume,start+.003);
      gain.gain.exponentialRampToValueAtTime(.0001,start+decay);
      tone.connect(gain).connect(audio.destination);
      tone.start(start);tone.stop(start+decay);
    }
  }
  function follow(cast,round){
    const stage=cast?.stage;
    const key=cast&&[round,cast.source,cast.card?.id].join("|");
    if(stage!==lastStage||key!==lastCast){
      lastStage=stage;lastCast=key;lastTap=-1;
    }
    if(audio?.state!=="running"||stage!=="tracing-auto")return;
    const beat=Math.min(beats-1,Math.floor(beats*cast.elapsed/Math.max(1,cast.duration)));
    if(beat<=lastTap)return;
    lastTap=beat;
    tap(audio.currentTime+.006);
  }
  window.WizardryRuneAudio={follow};
})();
