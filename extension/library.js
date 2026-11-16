import {searchSessions,sessionIssueTitles,recurrenceHints} from "./session-library.js";
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
