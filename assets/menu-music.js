/* One music transport for menus and battles. */
(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  const storageKey="wizardry.menuMusic.muted";
  const period=30;
  const tracks={
    menu:{url:"./assets/wizardry-menu-theme.m4a",volume:.56,offset:0},
    battle:{url:"./assets/wizardry-battle-theme-v2.m4a",volume:.47,offset:0}
  };
  let muted=false,context,playing,unlocked=false;
  try{muted=localStorage.getItem(storageKey)==="1";}catch{}
  const selectedTrack=()=>document.body.dataset.screen==="battle"?tracks.battle:tracks.menu;

  function pause(){
    if(!playing)return;
    const {track,source,gain,started}=playing;
    track.offset=(track.offset+Math.max(0,context.currentTime-started))%source.loopEnd;
    playing=null;
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setTargetAtTime(0,context.currentTime,.012);
    source.stop(context.currentTime+.055);
  }

  function load(track){
    if(track.buffer||track.loading)return;
    track.loading=fetch(track.url)
      .then(response=>{if(!response.ok)throw Error("Music unavailable");return response.arrayBuffer();})
      .then(bytes=>context.decodeAudioData(bytes))
      .then(decoded=>{track.buffer=decoded;sync();})
      .catch(()=>{})
      .finally(()=>{track.loading=null;});
  }

  function sync(){
    const control=document.querySelector("[data-menu-music]");
    if(control){
      control.textContent=muted?"Music Off":"Music On";
      control.setAttribute("aria-pressed",String(!muted));
    }
    const track=selectedTrack();
    if(playing&&(playing.track!==track||document.hidden||muted))pause();
    if(track===tracks.menu)tracks.battle.offset=0;
    if(!unlocked||document.hidden||muted||!context)return;
    if(!track.buffer){load(track);return;}
    if(playing||context.state!=="running")return;
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=track.buffer;source.loop=true;source.loopEnd=Math.min(period,track.buffer.duration);
    gain.gain.setValueAtTime(0,context.currentTime);
    gain.gain.setTargetAtTime(track.volume,context.currentTime,.071);
    source.connect(gain).connect(context.destination);
    playing={track,source,gain,started:context.currentTime};
    source.start(0,track.offset%source.loopEnd);
  }

  function unlock(){
    if(document.hidden||muted)return;
    try{
      if(!context){context=new Audio();context.addEventListener("statechange",sync);}
      unlocked=true;
      if(context.state!=="running")context.resume().then(sync).catch(()=>{});
      sync();
      load(tracks.battle);
    }catch{}
  }

  document.addEventListener("click",event=>{
    if(event.target.closest("[data-menu-music]")){
      muted=!muted;
      try{localStorage.setItem(storageKey,muted?"1":"0");}catch{}
      sync();
    }
    unlock();
  },{capture:true});
  document.addEventListener("visibilitychange",sync);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:["data-screen"]});
  window.WizardryMenuMusic={sync};
})();
