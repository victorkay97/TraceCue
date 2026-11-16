import {clipBounds,clipKey,clipFileName,createClipFromVideo} from "./clipper.js";
import {issueDraft,issueJson} from "./issue-export.js";
import {redactDiagnosticText} from "./diagnostics.js";
// Independent local clip manager; full recording is never modified.
export async function setupClipViewer({report,id,videoBlob,video,openDb,download,seekEvent,saveReport,onMarkerUpdated=()=>{}}){
  const $=x=>document.getElementById(x);
  const markers=report.events.map((event,index)=>({event,index})).filter(x=>x.event.kind==="issue-marker");
  const saved=new Map(),status=new Map();
  let busy=false,previewUrl=null;
  const idFor=x=>x.event.markerId||"legacy-"+x.index;
  const label=x=>String(x.event.title||"Issue marker").slice(0,100);
  const keyFor=x=>clipKey(id,idFor(x));
  function rangeFor(marker){
    const duration=Number.isFinite(video.duration)?video.duration:
      Math.max(0,(report.stoppedAt-(report.videoStartedAt||report.startedAt))/1000);
    return clipBounds(report,marker.event,duration);
  }
  async function getClip(key){
    const db=await openDb();
    try{return await new Promise((resolve,reject)=>{
      const request=db.transaction("recordings","readonly").objectStore("recordings").get(key);
      request.onsuccess=()=>resolve(request.result||null);
      request.onerror=()=>reject(request.error);
    });}finally{db.close();}
  }
  async function putClip(key,blob){
    const db=await openDb();
    try{await new Promise((resolve,reject)=>{
      const tx=db.transaction("recordings","readwrite");
      tx.objectStore("recordings").put(blob,key);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error);
    });}finally{db.close();}
  }
  const control=(name,handler)=>{
    const button=document.createElement("button");button.textContent=name;
    button.className="secondary";button.addEventListener("click",handler);return button;
  };
  function preview(key){
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    previewUrl=URL.createObjectURL(saved.get(key));
    $("clipPreview").src=previewUrl;$("clipPreview").hidden=false;
    $("clipPreview").scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  function render(){
    const container=$("clipList");container.replaceChildren();
    $("clipCount").textContent=markers.length+" marker"+(markers.length===1?"":"s");
    if(!markers.length){
      const empty=document.createElement("p");empty.className="muted tiny";
      empty.textContent="No issue markers. Mark a problem during your next recording to create a clip.";
      container.append(empty);
    }
    for(const marker of markers){
      const key=keyFor(marker),row=document.createElement("div");
      row.className="clip-row";
      const details=document.createElement("div");details.className="clip-meta";
      const title=document.createElement("strong");title.textContent=label(marker);
      const note=document.createElement("small");
      let range=null;try{range=rangeFor(marker);}catch{}
      note.textContent=range?"+"+range.start.toFixed(1)+"s to +"+range.end.toFixed(1)+"s in full recording":
        "No usable video interval";
      const state=document.createElement("small");state.className="clip-state";
      state.textContent=status.get(key)||(saved.has(key)?"Saved locally":"Not generated yet");
      // Each marked issue is an independently editable record, not a single
      // session-wide title. Updates preserve the marker ID and stored clip key.
      const titleLabel=document.createElement("label");
      titleLabel.className="clip-field-label";titleLabel.textContent="Issue title";
      const titleInput=document.createElement("input");
      titleInput.className="clip-title-input";titleInput.maxLength=100;
      titleInput.value=label(marker);
      titleInput.setAttribute("aria-label","Issue clip title");
      titleInput.addEventListener("change",async()=>{
        marker.event.title=redactDiagnosticText(titleInput.value.trim()||"Untitled issue",100);
        titleInput.value=marker.event.title;
        if(Array.isArray(report.clips)){
          for(const item of report.clips)if(item.markerId===idFor(marker))item.title=marker.event.title;
        }
        await saveReport(report);
        onMarkerUpdated();
        render();
      });
      const notesLabel=document.createElement("label");
      notesLabel.className="clip-field-label";notesLabel.textContent="Tester notes / expected versus actual";
      const notesInput=document.createElement("textarea");
      notesInput.className="clip-notes";notesInput.rows=2;notesInput.maxLength=1800;
      notesInput.value=marker.event.testerNotes||"";
      notesInput.placeholder="Expected: …  Actual: …  Steps to reproduce: …";
      notesInput.addEventListener("change",async()=>{
        marker.event.testerNotes=redactDiagnosticText(notesInput.value.trim(),1800);
        await saveReport(report);
        onMarkerUpdated();
      });
      details.append(title,note,state,titleLabel,titleInput,notesLabel,notesInput);
      row.append(details);
      const buttons=document.createElement("div");buttons.className="clip-controls";
      buttons.append(control("Seek",()=>seekEvent(marker.event)));
      if(saved.has(key)){
        buttons.append(control("Play clip",()=>preview(key)));
        buttons.append(control("Save clip",()=>download(saved.get(key),clipFileName(id,idFor(marker),label(marker)))));
      }else{
        const generate=control("Generate clip",()=>generateClip(marker));
        generate.disabled=busy||!range||!videoBlob;
        buttons.append(generate);
      }
      const safeFileBase=()=>clipFileName(id,idFor(marker),label(marker)).replace(/\.webm$/,"");
      buttons.append(control("Issue draft (.md)",()=>{
        const markdown=issueDraft(report,marker.event);
        download(new Blob([markdown],{type:"text/markdown"}),safeFileBase()+".md");
      }));
      buttons.append(control("Issue data (.json)",()=>{
        const json=issueJson(report,marker.event);
        download(new Blob([JSON.stringify(json,null,2)],{type:"application/json"}),safeFileBase()+".json");
      }));
      row.append(buttons);container.append(row);
    }
    $("retryClips").hidden=!videoBlob||markers.every(x=>saved.has(keyFor(x)));
  }
  async function generateClip(marker){
    if(busy||!videoBlob)return;
    busy=true;const key=keyFor(marker);
    try{
      const bounds=rangeFor(marker);
      status.set(key,"Rendering locally…");render();
      const blob=await createClipFromVideo(videoBlob,bounds,progress=>{
        $("clipStatus").textContent="Generating "+label(marker)+": "+Math.round(progress*100)+"%";
      });
      await putClip(key,blob);
      saved.set(key,blob);
      status.set(key,"Saved "+(blob.size/1048576).toFixed(1)+" MB");
      report.clips=(report.clips||[]).filter(x=>x.markerId!==idFor(marker));
      report.clips.push({markerId:idFor(marker),title:label(marker),startSecond:bounds.start,
        endSecond:bounds.end,requestedLookbackSeconds:bounds.lookback,videoStored:true});
      await saveReport(report);
      $("clipStatus").textContent="Clip saved locally. Full recording preserved.";
    }catch(e){
      status.set(key,"Failed: "+e.message);
      $("clipStatus").textContent="Clip error: "+e.message;
    }finally{busy=false;render();}
  }
  $("retryClips").addEventListener("click",async()=>{
    for(const marker of markers)if(!saved.has(keyFor(marker)))await generateClip(marker);
  });
  for(const marker of markers){
    try{const blob=await getClip(keyFor(marker));if(blob)saved.set(keyFor(marker),blob);}
    catch(e){status.set(keyFor(marker),"Storage unavailable: "+e.message);}
  }
  render();
  // Create the first three separate files automatically. More may be created
  // explicitly to avoid unexpectedly rendering many minutes of video.
  if(videoBlob)for(const marker of markers.slice(0,3)){
    if(!saved.has(keyFor(marker)))await generateClip(marker);
  }
  if(markers.length>3 && !($("retryClips").hidden))
    $("clipStatus").textContent="First three markers processed; select Generate remaining clips.";
  window.addEventListener("beforeunload",()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);});
}
