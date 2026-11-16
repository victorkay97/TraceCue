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
  upload.addEventListener("change",event=>{
    const file=event.target.files?.[0];if(!file || !report)return;
    if(!file.name.toLowerCase().endsWith(".webm") && !file.type.includes("webm")){
      status.textContent="Choose a WebM recording downloaded from the companion.";return;
    }
    if(file.size>1_000_000_000){status.textContent="WebM exceeds the 1GB local preview limit.";return;}
    if(currentUrl)URL.revokeObjectURL(currentUrl);
    currentUrl=URL.createObjectURL(file);urls.push(currentUrl);
    video.src=currentUrl;video.hidden=false;video.load();
    status.textContent=file.name+" · "+(file.size/1048576).toFixed(1)+" MB · local browser preview";
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
  return {configure,seek,clear,hasVideo:()=>!!currentUrl};
}
