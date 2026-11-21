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

  // Each theme has a melody, two supporting notes, and its own bell timbre.
  const themes={
    water:    {notes:[69,72,76,74,72,76], harmony:[57,64], finish:69, color:.21},
    earth:    {notes:[55,62,64,59,62,67], harmony:[43,50], finish:55, color:.12},
    lightning:{notes:[67,73,71,76,74,79], harmony:[55,62], finish:79, color:.30},
    nature:   {notes:[64,67,72,71,69,74], harmony:[48,55], finish:72, color:.16},
    wind:     {notes:[74,76,81,78,76,83], harmony:[62,69], finish:81, color:.16},
    dark:     {notes:[67,63,62,60,65,59], harmony:[48,55], finish:60, color:.24},
    fire:     {notes:[60,64,67,72,71,76], harmony:[48,55], finish:72, color:.28},
    ice:      {notes:[76,83,81,86,84,88], harmony:[60,67], finish:84, color:.32}
  };
  const themeFor=school=>Object.hasOwn(themes,school)?themes[school]:themes.wind;
  const frequency=note=>440*2**((note-69)/12);

  function bell(output,note,start,length,volume,color){
    const pitch=frequency(note),end=start+length;
    for(const [ratio,level,decay] of [[1,1,1],[2,.29,.67],[3.79,color,.40]]){
      const tone=audio.createOscillator(),gain=audio.createGain();
      const stop=start+length*decay;
      tone.frequency.value=pitch*ratio;
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.linearRampToValueAtTime(volume*level,start+Math.min(.024,length*.09));
      gain.gain.exponentialRampToValueAtTime(.0001,stop);
      tone.connect(gain).connect(output);
      tone.start(start);tone.stop(Math.min(end,stop));
    }
  }

  function begin(cast){
    const elapsed=Math.max(0,cast.elapsed)/1000,duration=cast.duration/1000;
    const start=audio.currentTime+.006,end=start+duration-elapsed;
    const gain=audio.createGain();
    gain.gain.value=.63;
    gain.connect(audio.destination);
    const theme=themeFor(cast.card?.school);
    const beats=[0,.15,.32,.48,.63,.78];
    for(const [i,note] of theme.notes.entries()){
      const offset=beats[i]*duration;
      if(offset+.06<elapsed)continue;
      const on=start+Math.max(0,offset-elapsed);
      bell(gain,note,on,end-on,.12+(i===0?.03:0),theme.color);
    }
    for(const [i,note] of theme.harmony.entries()){
      const offset=(i===0?.04:.40)*duration;
      const on=start+Math.max(0,offset-elapsed);
      if(end-on>.10)bell(gain,note,on,end-on,.07,theme.color*.43);
    }
    return {gain,end};
  }

  function completeRune(school){
    const theme=themeFor(school);
    bell(audio.destination,theme.finish,audio.currentTime+.006,.38,.073,theme.color);
  }

  function follow(cast,round){
    const stage=cast?.stage;
    const key=cast&&[round,cast.source,cast.card?.id].join("|");
    const changed=stage!==lastStage||key!==lastCast;
    if(changed){
      if(lastStage==="tracing-auto"&&key===lastCast&&stage==="rune-success"&&audio?.state==="running"){
        completeRune(cast.card?.school);
      }
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
