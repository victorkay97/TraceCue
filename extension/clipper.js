// Local WebM clip generator. The complete MediaRecorder file is never modified.
// Re-encoding via HTMLVideoElement.captureStream plays the selected window in
// real time. Keep this tab open until the clip generation finishes.
export function clipBounds(report,marker,durationSeconds=Infinity) {
  if(!report || marker?.kind!=="issue-marker" || !Number.isFinite(marker.at))
    throw new Error("Expected a recorded issue marker");
  const videoStart=Number.isFinite(report.videoStartedAt)?report.videoStartedAt:report.startedAt;
  const lookback=Math.max(5,Math.min(120,Number(marker.lookbackSeconds)||30));
  const markerSecond=Math.max(0,(marker.at-videoStart)/1000);
  const limit=Number.isFinite(durationSeconds)?Math.max(0,durationSeconds):Infinity;
  const end=Math.min(markerSecond,limit);
  const start=Math.max(0,end-lookback);
  if(end-start<0.05)throw new Error("Issue was marked before usable video began");
  return {start,end,duration:end-start,lookback};
}
export function clipKey(sessionId,markerId) {
  const safe=value=>String(value||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,100);
  if(!safe(sessionId)||!safe(markerId))throw new Error("Clip key missing identifiers");
  return "clip:"+safe(sessionId)+":"+safe(markerId);
}
export function clipFileName(sessionId,markerId) {
  return clipKey(sessionId,markerId).replaceAll(":","-")+".webm";
}
const once=(target,event,timeout=10000)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(new Error(event+" timed out"));},timeout);
  const done=()=>{cleanup();resolve();};
  const fail=()=>{cleanup();reject(target.error||new Error("Playback failed"));};
  const cleanup=()=>{clearTimeout(timer);target.removeEventListener(event,done);target.removeEventListener("error",fail);};
  target.addEventListener(event,done,{once:true});target.addEventListener("error",fail,{once:true});
});
export async function createClipFromVideo(videoBlob,range,onProgress=()=>{}) {
  if(!(videoBlob instanceof Blob) || !videoBlob.size)throw new Error("Full recording is missing");
  if(!Number.isFinite(range.start)||!Number.isFinite(range.end)||range.end<=range.start)
    throw new Error("Invalid clip bounds");
  const element=document.createElement("video");
  element.muted=true;element.playsInline=true;element.preload="auto";
  element.style.cssText="position:fixed;left:-99999px;top:0;width:320px;height:180px;opacity:0.01;pointer-events:none";
  document.body.append(element);
  const url=URL.createObjectURL(videoBlob);
  let stream=null,recorder=null,timer=null;
  try{
    element.src=url;
    await once(element,"loadedmetadata",20000);
    if(!Number.isFinite(element.duration))throw new Error("The recorded video has no usable duration");
    const start=Math.min(range.start,Math.max(0,element.duration-.1));
    const end=Math.min(range.end,element.duration);
    if(end<=start+.05)throw new Error("Clip is outside the recording");
    element.currentTime=start;
    await once(element,"seeked",20000);
    // Chrome captureStream delivers the tab-video frames while playing the
    // selected interval. It does NOT return a cheap byte slice of a WebM file.
    if(typeof element.captureStream!=="function")
      throw new Error("This Chrome version cannot extract independent WebM clips");
    stream=element.captureStream();
    const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ?
      "video/webm;codecs=vp8" : "video/webm";
    recorder=new MediaRecorder(stream,{mimeType:mime});
    const chunks=[];
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
    const stopped=new Promise((resolve,reject)=>{
      recorder.onstop=()=>resolve(new Blob(chunks,{type:mime}));
      recorder.onerror=e=>reject(e.error||new Error("Clip encoding failed"));
    });
    recorder.start(500);
    await element.play();
    await new Promise((resolve,reject)=>{
      const deadline=setTimeout(()=>{cleanup();reject(new Error("Clip rendering timed out"));},Math.ceil((end-start+10)*1000));
      const tick=()=>{
        onProgress(Math.min(1,Math.max(0,(element.currentTime-start)/(end-start))));
        if(element.currentTime>=end-.04 || element.ended){cleanup();resolve();}
      };
      const cleanup=()=>{clearTimeout(deadline);element.removeEventListener("timeupdate",tick);};
      element.addEventListener("timeupdate",tick);
      tick();
    });
    element.pause();if(recorder.state!=="inactive")recorder.stop();
    const blob=await stopped;
    if(!blob.size)throw new Error("Encoded clip is empty");
    onProgress(1);
    return blob;
  }finally{
    element.pause();
    if(recorder?.state==="recording")recorder.stop();
    stream?.getTracks().forEach(track=>track.stop());
    element.remove();
    URL.revokeObjectURL(url);
    if(timer)clearTimeout(timer);
  }
}
