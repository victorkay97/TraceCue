// Local WebM clip generator. The complete MediaRecorder file is never modified.
// Re-encoding via HTMLVideoElement.captureStream plays the selected window in
// real time. Keep this tab open until the clip generation finishes.
export function clipBounds(report,marker,durationSeconds=Infinity) {
  if(!report || marker?.kind!=="issue-marker" || !Number.isFinite(marker.at))
    throw new Error("Expected a recorded issue marker");
  const videoStart=Number.isFinite(report.videoStartedAt)?report.videoStartedAt:report.startedAt;
  const lookback=Math.max(5,Math.min(120,Number(marker.lookbackSeconds)||30));
  // Older markers have no post-buffer and retain their original behavior.
  const postBuffer=marker.postBufferSeconds===undefined?0:
    Math.max(0,Math.min(10,Number(marker.postBufferSeconds)||0));
  const markerSecond=Math.max(0,(marker.at-videoStart)/1000);
  const limit=Number.isFinite(durationSeconds)?Math.max(0,durationSeconds):Infinity;
  const edited=marker.clipStartSecond!==undefined || marker.clipEndSecond!==undefined;
  if(edited && (!Number.isFinite(marker.clipStartSecond)||!Number.isFinite(marker.clipEndSecond)))
    throw new Error("Both custom clip boundaries must be valid numbers");
  const start=edited?marker.clipStartSecond:Math.max(0,Math.min(markerSecond,limit)-lookback);
  const end=Math.min(edited?marker.clipEndSecond:markerSecond+postBuffer,limit);
  if(start<0 || !Number.isFinite(start) || end-start<0.05 || start>=limit)
    throw new Error("Issue clip window has no usable recorded video");
  return {start,end,duration:end-start,lookback,postBuffer,edited};
}
export function clipKey(sessionId,markerId) {
  const safe=value=>String(value||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,100);
  if(!safe(sessionId)||!safe(markerId))throw new Error("Clip key missing identifiers");
  return "clip:"+safe(sessionId)+":"+safe(markerId);
}
export function clipFileName(sessionId,markerId,title="") {
  const slug=String(title||"").normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60);
  // Include the immutable marker ID to prevent collisions between identically
  // titled issues and preserve a stable association with the full recording.
  const base=clipKey(sessionId,markerId).replaceAll(":","-");
  return base+(slug?"-"+slug:"")+".webm";
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
    // Browser-recorded WebM may report Infinity until its duration metadata
    // is indexed. Use the session's known endpoint and let seek/playback fail
    // explicitly if this Chrome build cannot seek the resulting blob.
    const recordedEnd=Number.isFinite(element.duration)?element.duration:range.end;
    const start=Math.min(range.start,Math.max(0,recordedEnd-.1));
    const end=Math.min(range.end,recordedEnd);
    if(end<=start+.05)throw new Error("Clip is outside the recording");
    // Seeking to zero on a fresh element might not dispatch a seeked event.
    if(Math.abs(element.currentTime-start)>.015){
      const settled=once(element,"seeked",20000);
      element.currentTime=start;
      await settled;
    }else element.currentTime=start;
    // Chrome captureStream delivers the tab-video frames while playing the
    // selected interval. It does NOT return a cheap byte slice of a WebM file.
    if(typeof element.captureStream!=="function")
      throw new Error("This Chrome version cannot extract independent WebM clips");
    stream=element.captureStream();
    await element.play();
    if(!stream.getVideoTracks().length)throw new Error("No captured video track available for clip generation");
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
