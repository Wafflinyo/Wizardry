/* One music transport across every menu. Combat uses its own audio cues. */
(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  const storageKey="wizardry.menuMusic.muted";
  const period=30;
  let muted=false,context,buffer,loading,source,gain,offset=0,started=0;
  try{muted=localStorage.getItem(storageKey)==="1";}catch{}
  const inMenu=()=>document.body.dataset.screen!=="battle";
  const canPlay=()=>inMenu()&&!document.hidden&&!muted;

  function pause(){
    if(!source)return;
    offset=(offset+Math.max(0,context.currentTime-started))%source.loopEnd;
    const old=source;
    source=null;
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setTargetAtTime(0,context.currentTime,.012);
    old.stop(context.currentTime+.055);
  }

  function sync(){
    const control=document.querySelector("[data-menu-music]");
    if(control){
      control.textContent=muted?"Music Off":"Music On";
      control.setAttribute("aria-pressed",String(!muted));
    }
    if(!canPlay()){pause();return;}
    if(source||!buffer||context?.state!=="running")return;
    source=context.createBufferSource();gain=context.createGain();
    source.buffer=buffer;source.loop=true;source.loopEnd=Math.min(period,buffer.duration);
    gain.gain.setValueAtTime(0,context.currentTime);
    gain.gain.setTargetAtTime(.56,context.currentTime,.071);
    source.connect(gain).connect(context.destination);
    started=context.currentTime;
    source.start(0,offset%source.loopEnd);
  }

  function unlock(){
    if(!canPlay())return;
    try{
      if(!context){context=new Audio();context.addEventListener("statechange",sync);}
      if(context.state!=="running")context.resume().then(sync).catch(()=>{});
      if(!buffer&&!loading){
        loading=fetch("./assets/wizardry-menu-theme.m4a")
          .then(response=>{if(!response.ok)throw Error("Music unavailable");return response.arrayBuffer();})
          .then(bytes=>context.decodeAudioData(bytes))
          .then(decoded=>{buffer=decoded;sync();})
          .catch(()=>{})
          .finally(()=>{loading=null;});
      }
      sync();
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
