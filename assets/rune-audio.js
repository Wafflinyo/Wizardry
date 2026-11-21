/* Short Web Audio cues for the auto-traced casting rune. */
(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  let audio,paper,flow,lastStage,lastCast;

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
    gain.gain.linearRampToValueAtTime(.33,start+Math.min(.16,remaining*.4));
    gain.gain.setValueAtTime(.33,end-Math.min(.18,remaining*.4));
    gain.gain.linearRampToValueAtTime(0,end);
    gain.connect(audio.destination);

    // Airy friction is the body of the stroke. A moving resonance follows its pressure.
    if(!paper){
      paper=audio.createBuffer(1,Math.ceil(audio.sampleRate*2),audio.sampleRate);
      const samples=paper.getChannelData(0);
      let seed=1789,previous=0;
      for(let i=0;i<samples.length;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const white=seed/2147483648-1;
        previous=.40*previous+.60*white;
        samples[i]=previous;
      }
    }
    const stroke=audio.createBufferSource(),resonance=audio.createBiquadFilter();
    stroke.buffer=paper;stroke.loop=true;
    resonance.type="bandpass";resonance.Q.value=.72;
    const pressure=audio.createGain();
    const positions=[0,.17,.34,.51,.68,.84,1];
    const centers=[1180,1770,1380,2050,1570,2260,1580];
    const weights=[.58,.93,.69,1,.76,.94,.63];
    resonance.frequency.setValueAtTime(centers[0],start);
    pressure.gain.setValueAtTime(weights[0],start);
    for(let i=1;i<positions.length;i++){
      const at=start+remaining*positions[i];
      resonance.frequency.linearRampToValueAtTime(centers[i],at);
      pressure.gain.linearRampToValueAtTime(weights[i],at);
    }
    stroke.connect(resonance).connect(pressure).connect(gain);
    stroke.start(start);stroke.stop(end+.1);

    // A quiet gliding overtone gives the friction a magical edge.
    const shimmer=audio.createOscillator(),mix=audio.createGain();
    mix.gain.value=.14;
    shimmer.frequency.setValueAtTime(805,start);
    shimmer.frequency.exponentialRampToValueAtTime(1130,start+remaining*.58);
    shimmer.frequency.exponentialRampToValueAtTime(930,end);
    shimmer.connect(mix).connect(gain);
    shimmer.start(start);shimmer.stop(end+.10);
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
