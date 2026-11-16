import {searchSessions,sessionIssueTitles,recurrenceHints,localEvidenceKeys} from "./session-library.js";
const $=id=>document.getElementById(id);
let reports=[];
async function load(){
  $("libraryStatus").textContent="Loading local recordings…";
  const data=await chrome.storage.local.get(null);
  reports=Object.entries(data).filter(([key,r])=>key.startsWith("report:")&&r?.id&&Array.isArray(r.events))
    .map(([,report])=>report);
  draw();
}
function draw(){
  const visible=searchSessions(reports,$("searchSessions").value);
  const container=$("libraryList");container.replaceChildren();
  $("libraryStatus").textContent=visible.length+" matching QA session"+(visible.length===1?"":"s")+" saved locally.";
  for(const report of visible){
    const card=document.createElement("article");card.className="library-item";
    const info=document.createElement("div");
    const title=document.createElement("strong");title.textContent=report.title||"QA session";
    const date=document.createElement("small");
    date.textContent=new Date(report.startedAt).toLocaleString()+
      " · "+Math.round((report.stoppedAt-report.startedAt)/1000)+"s"+
      (report.recovered?" · Interrupted evidence":"");
    const host=document.createElement("small");host.textContent=report.url||"Unknown origin";
    const tags=document.createElement("div");tags.className="library-tags";
    const issues=sessionIssueTitles(report);
    for(const name of issues.slice(0,8)){
      const pill=document.createElement("span");pill.textContent=name;tags.append(pill);
    }
    if(issues.length>8){
      const more=document.createElement("span");more.textContent="+"+(issues.length-8)+" more";tags.append(more);
    }
    const similar=recurrenceHints(report,reports);
    if(similar.length){
      const hint=document.createElement("small");hint.className="library-hint";
      hint.textContent=similar.length+" other session(s) have matching failure fingerprints; review manually.";
      info.append(hint);
    }
    info.prepend(title,date,host,tags);
    const open=document.createElement("button");open.className="secondary";open.textContent="Open evidence";
    open.addEventListener("click",()=>chrome.tabs.create({
      url:chrome.runtime.getURL("viewer.html?id="+encodeURIComponent(report.id))
    }));
    card.append(info,open);container.append(card);
  }
}
$("searchSessions").addEventListener("input",draw);
$("refresh").addEventListener("click",()=>load().catch(e=>{$("libraryStatus").textContent=e.message;}));
load().catch(e=>{$("libraryStatus").textContent="Library unavailable: "+e.message;});

$("clearAllLocal").addEventListener("click",async()=>{
  const btn=$("clearAllLocal"),status=$("privacyStatus");
  const state=await chrome.runtime.sendMessage({target:"tracecue-control",action:"status"}).catch(()=>null);
  if(state?.recording){status.textContent="Stop your active recording before deleting local evidence.";return;}
  if(!confirm("Delete ALL local TraceCue reports, drafts, recordings and clips? This cannot be undone."))return;
  if(!confirm("Final confirmation: permanently erase local TraceCue evidence from this Chrome profile?"))return;
  btn.disabled=true;status.textContent="Deleting local browser evidence…";
  try{
    const db=await new Promise((resolve,reject)=>{
      const request=indexedDB.open("tracecue-videos",1);
      request.onupgradeneeded=()=>{
        if(!request.result.objectStoreNames.contains("recordings"))
          request.result.createObjectStore("recordings");
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction("recordings","readwrite");
        tx.objectStore("recordings").clear();
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
      });
    }finally{db.close();}
    const all=await chrome.storage.local.get(null);
    const keys=localEvidenceKeys(all);
    if(keys.length)await chrome.storage.local.remove(keys);
    status.textContent="Local reports and video/clip storage cleared. Previously exported copies were not affected.";
    $("searchSessions").value="";
    await load();
  }catch(error){status.textContent="Could not complete deletion: "+error.message+". Inspect remaining data and retry.";}
  finally{btn.disabled=false;}
});
