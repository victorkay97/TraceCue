// TraceCue Studio synchronous video inspector. No upload, fetch or remote storage.
export function createVideoInspector({video,upload,status,markers}){
  let currentUrl=null,report=null;
  const urls=[];
  function clear(){
    video.pause();video.removeAttribute("src");video.load();video.hidden=true;
    for(const url of urls)URL.revokeObjectURL(url);
    urls.length=0;currentUrl=null;report=null;
    markers.replaceChildren();
    status.textContent="Import a complete WebM to synchronize recorded events.";
    upload.value="";
  }
  function configure(session){
    clear();
    report=session;
    const markerEvents=session.events.map((e,index)=>({event:e,index}))
      .filter(x=>x.event.kind==="issue-marker");
    if(!markerEvents.length){
      const text=document.createElement("span");
      text.className="muted";text.textContent="No issue markers in this session.";
      markers.append(text);
    }
    for(const {event,index} of markerEvents){
      const button=document.createElement("button");button.className="video-marker";
      const relative=(event.at-session.startedAt)/1000;
      button.textContent=(event.title||"Issue marker")+" · +"+Math.max(0,relative).toFixed(1)+"s";
      button.addEventListener("click",()=>seek(event));
      markers.append(button);
    }
  }
  function offset(event){
    if(!report)return 0;
    const origin=Number.isFinite(report.videoStartedAt)?report.videoStartedAt:report.startedAt;
    return Math.max(0,(event.at-origin)/1000);
  }
  function seek(event){
    if(!report)return;
    if(!currentUrl){status.textContent="Import the matching full WebM to seek to a video event.";return;}
    let target=offset(event);
    if(Number.isFinite(video.duration))target=Math.min(target,Math.max(0,video.duration-.025));
    try{video.currentTime=target;video.scrollIntoView({behavior:"smooth",block:"center"});}
    catch(error){status.textContent="Seeking failed: "+error.message;}
  }
  function attachVideoBlob(blob,name="Transferred full recording"){
    if(!report)throw new Error("Import a session before attaching video.");
    if(!(blob instanceof Blob)||!blob.size||blob.size>1_000_000_000||
      !blob.type.includes("webm"))throw new Error("A supported WebM video is required.");
    if(currentUrl)URL.revokeObjectURL(currentUrl);
    currentUrl=URL.createObjectURL(blob);urls.push(currentUrl);
    video.src=currentUrl;video.hidden=false;video.load();
    status.textContent=name+" · "+(blob.size/1048576).toFixed(1)+" MB · local browser preview";
  }
  upload.addEventListener("change",event=>{
    const file=event.target.files?.[0];if(!file || !report)return;
    try{attachVideoBlob(file,file.name);}
    catch(error){status.textContent=error.message;}
  });
  video.addEventListener("timeupdate",()=>{
    if(!currentUrl || !report)return;
    const videoTime=video.currentTime;
    const base=Number.isFinite(report.videoStartedAt)?report.videoStartedAt:report.startedAt;
    const approximate=base+videoTime*1000;
    let nearest=null,distance=2500;
    report.events.forEach((event,index)=>{
      const delta=Math.abs(event.at-approximate);
      if(delta<distance){distance=delta;nearest=index;}
    });
    document.querySelectorAll(".event.video-active").forEach(x=>x.classList.remove("video-active"));
    if(nearest!==null)document.getElementById("event-EV"+String(nearest+1).padStart(4,"0"))?.classList.add("video-active");
  });
  window.addEventListener("beforeunload",clear);
  return {configure,seek,clear,attachVideoBlob,hasVideo:()=>!!currentUrl};
}
