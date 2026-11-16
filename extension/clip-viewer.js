import {clipBounds,clipKey,clipFileName,createClipFromVideo} from "./clipper.js";
import {issueDraft,issueJson} from "./issue-export.js";
import {clipEvents,evidenceCategory,eventCaption,recordedDuration} from "./clip-evidence.js";
import {redactDiagnosticText} from "./diagnostics.js";

// Local issue workspace. Clip edits never modify the complete recording.
export async function setupClipViewer({
  report,id,videoBlob,video,openDb,download,seekEvent,saveReport,
  onMarkerUpdated=()=>{}
}){
  const $=x=>document.getElementById(x);
  const markers=report.events.map((event,index)=>({event,index}))
    .filter(x=>x.event.kind==="issue-marker");
  const saved=new Map(),status=new Map();
  let busy=false,previewUrl=null,previewMarkerId=null,rangePlayback=null;
  const idFor=x=>x.event.markerId||"legacy-"+x.index;
  const label=x=>String(x.event.title||"Issue marker").slice(0,100);
  const keyFor=x=>clipKey(id,idFor(x));
  const caption=(title,cls="")=>{
    const node=document.createElement("small");node.textContent=title;node.className=cls;return node;
  };
  const button=(label,handler)=>{
    const el=document.createElement("button");el.type="button";el.textContent=label;
    el.className="secondary";el.addEventListener("click",handler);return el;
  };
  const duration=()=>Number.isFinite(video.duration)&&video.duration>0 ?
    Math.min(video.duration,recordedDuration(report)):recordedDuration(report);
  const rangeFor=marker=>clipBounds(report,marker.event,duration());

  async function inRecordings(mode,worker){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction("recordings",mode);
        const store=tx.objectStore("recordings");
        const req=worker(store);
        let value=null;
        if(req){req.onsuccess=()=>{value=req.result;};req.onerror=()=>reject(req.error);}
        tx.oncomplete=()=>resolve(value);
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      });
    }finally{db.close();}
  }
  const getClip=key=>inRecordings("readonly",store=>store.get(key));
  const putClip=(key,blob)=>inRecordings("readwrite",store=>store.put(blob,key));
  const deleteClip=key=>inRecordings("readwrite",store=>store.delete(key));

  function stopRangePlayback(){
    if(rangePlayback){
      video.removeEventListener("timeupdate",rangePlayback);
      rangePlayback=null;
    }
  }
  function previewRange(marker){
    const range=rangeFor(marker);
    stopRangePlayback();
    video.currentTime=range.start;
    rangePlayback=()=>{
      if(video.currentTime>=range.end-0.04){
        video.pause();stopRangePlayback();
      }
    };
    video.addEventListener("timeupdate",rangePlayback);
    video.play().catch(error=>{
      stopRangePlayback();
      $("clipStatus").textContent="Video preview unavailable: "+error.message;
    });
    video.scrollIntoView({behavior:"smooth",block:"center"});
  }
  function previewClip(marker){
    const blob=saved.get(keyFor(marker));
    if(!blob)return;
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    previewUrl=URL.createObjectURL(blob);
    previewMarkerId=idFor(marker);
    $("clipPreview").src=previewUrl;
    $("clipPreview").hidden=false;
    $("clipPreview").scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  // Clip-preview playback and its captured log rows use the same source-video clock.
  $("clipPreview").addEventListener("timeupdate",()=>{
    if(!previewMarkerId)return;
    const marker=markers.find(x=>idFor(x)===previewMarkerId);
    if(!marker)return;
    let range;try{range=rangeFor(marker);}catch{return;}
    const absolute=range.start+$("clipPreview").currentTime;
    for(const row of document.querySelectorAll(".clip-evidence-row")){
      if(row.dataset.markerId!==previewMarkerId)continue;
      const second=Number(row.dataset.second);
      row.classList.toggle("clip-evidence-active",Math.abs(second-absolute)<0.8);
    }
  });

  function addEvidencePanel(container,marker){
    const details=document.createElement("details");details.className="clip-evidence";
    const summary=document.createElement("summary");
    const items=clipEvents(report,marker.event,{durationSeconds:duration()});
    summary.textContent="Technical evidence · "+items.length+" captured event"+(items.length===1?"":"s");
    details.append(summary);
    const note=caption("Video-aligned, redacted metadata. Includes console output, network responses/failures and actions actually captured; no request bodies, authentication headers or cookies.");
    details.append(note);
    const filters=document.createElement("div");filters.className="clip-evidence-filters";
    const select=document.createElement("select");
    select.setAttribute("aria-label","Filter issue evidence");
    for(const [value,text] of [
      ["all","All events"],["console","Console logs"],["network","Network"],
      ["actions","Actions"],["environment","Environment"],["other","Other"]
    ]){
      const option=document.createElement("option");option.value=value;
      option.textContent=text;select.append(option);
    }
    const search=document.createElement("input");
    search.type="search";search.className="clip-evidence-search";
    search.placeholder="Search logs, statuses and actions…";
    search.setAttribute("aria-label","Search captured issue logs");
    filters.append(select,search);details.append(filters);
    const list=document.createElement("div");list.className="clip-evidence-list";details.append(list);
    const more=button("Show more captured events",()=>{visibleLimit+=150;draw();});
    more.classList.add("clip-log-more");
    details.append(more);
    let visibleLimit=150;
    const draw=()=>{
      list.replaceChildren();
      const query=search.value.trim().toLowerCase();
      const visible=items.filter(item=>
        (select.value==="all"||evidenceCategory(item.kind)===select.value) &&
        (!query||eventCaption(item).toLowerCase().includes(query))
      );
      if(!visible.length){
        const p=document.createElement("p");p.className="muted tiny";p.textContent="No captured events for this filter and time window.";
        list.append(p);
      }
      more.hidden=visible.length<=visibleLimit;
      for(const e of visible.slice(0,visibleLimit)){
        const row=button("+"+e.clipSecond.toFixed(1)+"s · "+eventCaption(e),()=>{
          const captured=report.events.find((event,index)=>"EV"+String(index+1).padStart(4,"0")===e.ref);
          if(captured)seekEvent({...captured,at:e.at});
          if(previewMarkerId===idFor(marker)&&saved.has(keyFor(marker))){
            $("clipPreview").currentTime=e.clipSecond;
          }
        });
        row.classList.add("clip-evidence-row");
        row.dataset.second=String(e.second);
        row.dataset.markerId=idFor(marker);
        row.title="Seek to this signal in the complete recording";
        list.append(row);
      }
    };
    select.addEventListener("change",()=>{visibleLimit=150;draw();});
    search.addEventListener("input",()=>{visibleLimit=150;draw();});
    details.addEventListener("toggle",()=>{
      if(details.open&&list.childElementCount===0)draw();
    });
    container.append(details);
  }

  function render(){
    const container=$("clipList");container.replaceChildren();
    $("clipCount").textContent=markers.length+" issue"+(markers.length===1?"":"s");
    if(!markers.length){
      const empty=document.createElement("p");empty.className="muted tiny";
      empty.textContent="No issue markers. Name and mark a problem during your next recording.";
      container.append(empty);
    }
    for(const marker of markers){
      const key=keyFor(marker);
      const row=document.createElement("article");row.className="clip-row";
      const details=document.createElement("div");details.className="clip-meta";
      const title=document.createElement("strong");title.textContent=label(marker);
      const range=(()=>{try{return rangeFor(marker);}catch{return null;}})();
      const timing=caption(range?
        "+"+range.start.toFixed(1)+"s to +"+range.end.toFixed(1)+"s · "+
        (range.edited?"trimmed manually":"marker window with "+range.postBuffer+"s after"):
        "Invalid or unavailable clip interval");
      const state=caption(status.get(key)||(saved.has(key)?"Clip saved locally":"Clip not generated yet"),"clip-state");
      const titleLabel=document.createElement("label");titleLabel.className="clip-field-label";
      titleLabel.textContent="Issue title";
      const titleInput=document.createElement("input");titleInput.className="clip-title-input";
      titleInput.maxLength=100;titleInput.value=label(marker);
      titleInput.setAttribute("aria-label","Issue clip title");
      titleInput.addEventListener("change",async()=>{
        marker.event.title=redactDiagnosticText(titleInput.value.trim()||"Untitled issue",100);
        if(Array.isArray(report.clips))for(const item of report.clips)
          if(item.markerId===idFor(marker))item.title=marker.event.title;
        await saveReport(report);onMarkerUpdated();render();
      });
      const notesLabel=document.createElement("label");notesLabel.className="clip-field-label";
      notesLabel.textContent="Tester notes / expected versus actual";
      const notesInput=document.createElement("textarea");notesInput.className="clip-notes";
      notesInput.rows=2;notesInput.maxLength=1800;
      notesInput.value=marker.event.testerNotes||"";
      notesInput.placeholder="Expected: …  Actual: …  Steps to reproduce: …";
      notesInput.addEventListener("change",async()=>{
        marker.event.testerNotes=redactDiagnosticText(notesInput.value.trim(),1800);
        await saveReport(report);onMarkerUpdated();
      });
      // Standard QA fields are per issue, never per entire session.
      const qa=document.createElement("div");qa.className="clip-qa-fields";
      const selectField=(key,heading,choices)=>{
        const wrap=document.createElement("label");wrap.className="clip-field-label";
        wrap.textContent=heading;
        const select=document.createElement("select");select.className="clip-qa-select";
        for(const [value,title] of choices){
          const option=document.createElement("option");
          option.value=value;option.textContent=title;select.append(option);
        }
        select.value=marker.event[key]||choices[0][0];
        select.addEventListener("change",async()=>{
          marker.event[key]=select.value;
          await saveReport(report);onMarkerUpdated();
        });
        wrap.append(select);qa.append(wrap);
      };
      const textField=(key,heading,hint)=>{
        const wrap=document.createElement("label");wrap.className="clip-field-label";
        wrap.textContent=heading;
        const textarea=document.createElement("textarea");
        textarea.className="clip-qa-input";textarea.rows=2;textarea.maxLength=1500;
        textarea.value=marker.event[key]||"";textarea.placeholder=hint;
        textarea.addEventListener("change",async()=>{
          marker.event[key]=redactDiagnosticText(textarea.value.trim(),1500);
          await saveReport(report);onMarkerUpdated();
        });
        wrap.append(textarea);qa.append(wrap);
      };
      selectField("severity","Impact / severity",[
        ["unrated","Not rated"],["blocker","Blocker"],["critical","Critical"],
        ["major","Major"],["minor","Minor"],["trivial","Trivial"]
      ]);
      selectField("reproducibility","Reproducibility",[
        ["not-retested","Not retested"],["always","Always"],
        ["intermittent","Intermittent"],["once","Observed once"]
      ]);
      textField("expectedBehavior","Expected behavior","What should the application have done?");
      textField("actualBehavior","Actual behavior","What happened instead?");
      textField("reproductionSteps","Reproduction steps","Record any extra setup or steps not obvious in the video.");
      details.append(title,timing,state,titleLabel,titleInput,notesLabel,notesInput,qa);
      row.append(details);

      const editor=document.createElement("div");editor.className="clip-trimmer";
      const heading=caption("TRIM CLIP · SECONDS FROM FULL VIDEO","clip-field-label");
      const timeFields=document.createElement("div");timeFields.className="clip-time-fields";
      const field=(name,value)=>{
        const label=document.createElement("label");label.textContent=name;
        const input=document.createElement("input");input.type="number";
        input.min="0";input.max=String(duration());input.step="0.1";
        input.value=Number(value||0).toFixed(1);
        label.append(input);timeFields.append(label);
        return input;
      };
      const startInput=field("Start",range?.start||0);
      const endInput=field("End",range?.end||0);
      const editorStatus=document.createElement("p");
      editorStatus.className="clip-edit-status";editorStatus.setAttribute("role","status");
      const editorActions=document.createElement("div");editorActions.className="clip-controls";
      const invalidate=async()=>{
        await deleteClip(key);
        saved.delete(key);
        status.set(key,"Trim saved — regenerate this video clip");
        report.clips=(report.clips||[]).filter(item=>item.markerId!==idFor(marker));
        if(previewMarkerId===idFor(marker)){
          $("clipPreview").pause();$("clipPreview").removeAttribute("src");
          $("clipPreview").hidden=true;previewMarkerId=null;
          if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
        }
      };
      const applyTrim=button("Apply trim",async()=>{
        if(busy)return;
        const start=Number(startInput.value),end=Number(endInput.value),max=duration();
        if(!startInput.value.trim()||!endInput.value.trim()||
          !Number.isFinite(start)||!Number.isFinite(end)||
          start<0||end>max+0.001||end-start<0.1){
          editorStatus.textContent="Enter a valid start and end inside the complete recording.";
          return;
        }
        const proposed={...marker.event,clipStartSecond:start,clipEndSecond:end};
        try{clipBounds(report,proposed,max);}catch(error){
          editorStatus.textContent=error.message;return;
        }
        if(marker.event.clipStartSecond===start&&marker.event.clipEndSecond===end){
          editorStatus.textContent="These trim boundaries are already saved.";return;
        }
        marker.event.clipStartSecond=start;
        marker.event.clipEndSecond=end;
        await invalidate();
        await saveReport(report);
        onMarkerUpdated();
        $("clipStatus").textContent="Issue trim saved. Logs and exported reports now match the new interval.";
        render();
      });
      const reset=button("Reset to marker",async()=>{
        if(busy)return;
        delete marker.event.clipStartSecond;delete marker.event.clipEndSecond;
        await invalidate();await saveReport(report);onMarkerUpdated();render();
      });
      const playback=button("Preview interval",()=>previewRange(marker));
      playback.disabled=!range||!videoBlob;
      editorActions.append(applyTrim,reset,playback);
      editor.append(heading,timeFields,editorActions,editorStatus);
      row.append(editor);

      const controls=document.createElement("div");controls.className="clip-controls";
      controls.append(button("Seek to marker",()=>seekEvent(marker.event)));
      if(saved.has(key)){
        controls.append(button("Play saved clip",()=>previewClip(marker)));
        controls.append(button("Save WebM",()=>download(
          saved.get(key),clipFileName(id,idFor(marker),label(marker))
        )));
      }else{
        const generate=button("Generate video clip",()=>generateClip(marker));
        generate.disabled=busy||!range||!videoBlob;
        controls.append(generate);
      }
      const base=()=>clipFileName(id,idFor(marker),label(marker)).replace(/\.webm$/,"");
      controls.append(button("Copy report",async()=>{
        try{
          await navigator.clipboard.writeText(issueDraft(report,marker.event));
          $("clipStatus").textContent="Copied "+label(marker)+" issue draft. Review it before sharing.";
        }catch(error){
          $("clipStatus").textContent="Clipboard unavailable: "+error.message+". Download the Markdown instead.";
        }
      }));
      controls.append(button("Issue report (.md)",()=>{
        download(new Blob([issueDraft(report,marker.event)],{type:"text/markdown"}),base()+".md");
      }));
      controls.append(button("Evidence (.json)",()=>{
        download(new Blob([JSON.stringify(issueJson(report,marker.event),null,2)],
          {type:"application/json"}),base()+".json");
      }));
      row.append(controls);
      if(range)addEvidencePanel(row,marker);
      container.append(row);
    }
    $("retryClips").hidden=!videoBlob||markers.every(x=>saved.has(keyFor(x)));
  }

  async function generateClip(marker){
    if(busy||!videoBlob)return;
    busy=true;const key=keyFor(marker);
    try{
      const bounds=rangeFor(marker);
      status.set(key,"Rendering locally…");render();
      const blob=await createClipFromVideo(videoBlob,bounds,fraction=>{
        $("clipStatus").textContent="Generating "+label(marker)+": "+Math.round(fraction*100)+"%";
      });
      await putClip(key,blob);saved.set(key,blob);
      status.set(key,"Saved "+(blob.size/1048576).toFixed(1)+" MB");
      report.clips=(report.clips||[]).filter(x=>x.markerId!==idFor(marker));
      report.clips.push({markerId:idFor(marker),title:label(marker),
        startSecond:bounds.start,endSecond:bounds.end,
        requestedLookbackSeconds:bounds.lookback,
        postBufferSeconds:bounds.postBuffer,manuallyTrimmed:bounds.edited,videoStored:true});
      await saveReport(report);
      $("clipStatus").textContent="Clip saved locally. Original recording and evidence remain intact.";
    }catch(error){
      status.set(key,"Failed: "+error.message);
      $("clipStatus").textContent="Clip could not be generated: "+error.message;
    }finally{busy=false;render();}
  }

  $("retryClips").addEventListener("click",async()=>{
    for(const marker of markers)if(!saved.has(keyFor(marker)))await generateClip(marker);
  });
  for(const marker of markers){
    try{
      const blob=await getClip(keyFor(marker));
      if(!blob)continue;
      const metadata=(report.clips||[]).find(x=>x.markerId===idFor(marker));
      const window=rangeFor(marker);
      // Never show a stale saved video if trim boundaries changed.
      if(metadata && (Math.abs(metadata.startSecond-window.start)>0.05||
         Math.abs(metadata.endSecond-window.end)>0.05)){
        await deleteClip(key);
        status.set(key,"Old clip removed; regenerate for edited range");
      }else saved.set(key,blob);
    }catch(error){status.set(key,"Storage error: "+error.message);}
  }
  render();
  if(videoBlob)for(const marker of markers.slice(0,3)){
    if(!saved.has(keyFor(marker)))await generateClip(marker);
  }
  if(markers.length>3 && !$("retryClips").hidden){
    $("clipStatus").textContent="First three issues processed; generate remaining clips when ready.";
  }
  window.addEventListener("beforeunload",()=>{
    stopRangePlayback();
    if(previewUrl)URL.revokeObjectURL(previewUrl);
  });
}
