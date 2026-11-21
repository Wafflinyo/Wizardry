/* Short Web Audio cues for the auto-traced casting rune. */
(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  let audio,noise,output,lastStage,lastCast,lastSpark;
  const spacing=[0,.11,.21,.32,.39,.49,.58,.64,.72,.78,.85,.90,.95];

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

  function initialize(){
    output=audio.createGain();
    output.gain.value=.46;
    output.connect(audio.destination);
    noise=audio.createBuffer(1,Math.ceil(audio.sampleRate*.12),audio.sampleRate);
    const data=noise.getChannelData(0);
    let seed=52783;
    for(let i=0;i<data.length;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      data[i]=seed/2147483648-1;
    }
  }
  function voice(source,filter,start,length,volume){
    const gain=audio.createGain();
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume,start+.004);
    gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    source.connect(filter||gain);
    if(filter)filter.connect(gain);
    gain.connect(output);
    source.start(start);source.stop(start+length);
  }
  function crackle(start,frequency,volume){
    const source=audio.createBufferSource();
    source.buffer=noise;
    const filter=audio.createBiquadFilter();
    filter.type="bandpass";filter.frequency.value=frequency;filter.Q.value=.72;
    voice(source,filter,start,.085,volume);
  }
  function glint(start,frequency,end,length,volume){
    const source=audio.createOscillator();
    source.frequency.setValueAtTime(frequency,start);
    source.frequency.exponentialRampToValueAtTime(end,start+length);
    voice(source,null,start,length,volume);
  }
  function follow(cast,round){
    const stage=cast?.stage;
    const key=cast&&[round,cast.source,cast.card?.id].join("|");
    const changed=stage!==lastStage||key!==lastCast;
    if(changed){lastStage=stage;lastCast=key;lastSpark=-1;}
    if(audio?.state!=="running")return;
    if(stage!=="tracing-auto"&&stage!=="rune-success"&&stage!=="rune-fail")return;
    if(!output)initialize();
    const now=audio.currentTime+.006;
    if(stage==="tracing-auto"){
      const progress=cast.elapsed/Math.max(1,cast.duration);
      let spark=lastSpark;
      while(spark+1<spacing.length&&progress>=spacing[spark+1])spark++;
      if(spark<=lastSpark)return;
      lastSpark=spark;
      const pitch=1350+spark*106+(spark%3)*185;
      crackle(now,pitch+1100,.115+spark*.005);
      glint(now,pitch,pitch*.84,.055,.028);
    }else if(changed&&cast.elapsed<320){
      if(stage==="rune-success"){
        crackle(now,4400,.20);
        glint(now,1175,1568,.21,.090);
        glint(now+.045,1976,2349,.26,.040);
        glint(now+.09,3136,2637,.18,.023);
      }else{
        crackle(now,980,.15);
        glint(now,520,165,.17,.052);
      }
    }
  }
  window.WizardryRuneAudio={follow};
})();
