import {normalizeTestContext,contextLabel} from "./test-context.js";
const $=id=>document.getElementById(id);
let tabId=Number(new URLSearchParams(location.search).get("tab"))||null;
let seconds=30;
let postSeconds=5;
const send=(action,more={})=>chrome.runtime.sendMessage({target:"tracecue-control",action,tabId,...more});
// First launch offers concise guidance; established users can reopen it.
chrome.storage.local.get("tracecueHasSeenGuide").then(data=>{
  if(!data.tracecueHasSeenGuide)$("firstRunSteps").open=true;
}).catch(()=>{});
$("firstRunSteps").addEventListener("toggle",()=>{
  if(!$("firstRunSteps").open)
    chrome.storage.local.set({tracecueHasSeenGuide:true}).catch(()=>{});
});
async function resolveTab(){
  if(tabId){const tab=await chrome.tabs.get(tabId).catch(()=>null);if(tab)return tab;}
  const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
  if(tab&&/^https?:\/\//.test(tab.url||"")){tabId=tab.id;return tab;}
  return null;
}
const clock=ms=>{const s=Math.floor(Math.max(0,ms)/1000);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");};
let lastMarkersFingerprint="";
let lastSuggestionsFingerprint="";
function renderSuggestions(items=[]){
  const signature=JSON.stringify(items);
  if(signature===lastSuggestionsFingerprint)return;
  lastSuggestionsFingerprint=signature;
  const area=$("suggestionList");area.replaceChildren();
  if(!items.length){
    const p=document.createElement("p");p.className="hint";p.textContent="No recent unmarked failure signals.";
    area.append(p);return;
  }
  for(const item of items){
    const button=document.createElement("button");
    button.type="button";button.className="suggestion-button";
    button.textContent=item.title+" · +"+item.second.toFixed(1)+"s";
    button.addEventListener("click",()=>{
      $("issueTitle").value=item.title;
      $("message").textContent="Suggestion loaded. Edit the title, then choose Save titled issue marker.";
      $("issueTitle").focus();
    });
    area.append(button);
  }
}

function renderIssueHistory(markers=[],startedAt=null){
  const fingerprint=JSON.stringify(markers);
  if(fingerprint===lastMarkersFingerprint)return;
  lastMarkersFingerprint=fingerprint;
  const list=$("issueList");list.replaceChildren();
  $("issueCount").textContent=markers.length+" saved";
  if(!markers.length){
    const empty=document.createElement("li");
    empty.textContent="No issue marked yet.";
    empty.className="no-marker";list.append(empty);return;
  }
  for(const marker of markers){
    const row=document.createElement("li");
    const title=document.createElement("strong");
    title.textContent=marker.title||"Untitled issue";
    const time=document.createElement("small");
    const timeFromStart=Number.isFinite(startedAt)?Math.max(0,(marker.at-startedAt)/1000):null;
    time.textContent=(timeFromStart==null?"":("+"+timeFromStart.toFixed(1)+"s · "))+
      "previous "+(marker.lookbackSeconds||30)+"s · next "+(marker.postBufferSeconds??0)+"s";
    row.append(title,time);list.append(row);
  }
}
async function refresh(){
  const tab=await resolveTab();
  if(!tab){$("message").textContent="Select an authorized HTTP(S) tab and reopen TraceCue.";return;}
  const info=await send("status").catch(()=>null);
  const recording=info?.activeOnTab===true;
  $("indicator").textContent=recording?"● Recording":info?.recording?"Busy on another tab":"Idle";
  $("indicator").classList.toggle("recording",recording);
  $("start").disabled=!!info?.recording;
  $("stop").disabled=!recording;$("mark").disabled=!recording;
  $("timer").textContent=clock(recording?Date.now()-info.startedAt:0);
  $("captureInfoLogs").disabled=!!info?.recording;
  for(const field of ["scenarioId","tenantAlias","actorRole","actorAlias"])
    $(field).disabled=!!info?.recording;
  if(recording&&info.testContext){
    $("scenarioStatus").textContent="Active: "+contextLabel(info.testContext);
  }else if(!info?.recording){
    $("scenarioStatus").textContent="Standalone session unless a scenario is specified.";
  }
  renderSuggestions(info?.suggestions||[]);
  renderIssueHistory(info?.markers||[],info?.startedAt??null);
}
document.querySelectorAll("[data-seconds]").forEach(button=>button.addEventListener("click",()=>{
  seconds=Number(button.dataset.seconds);
  document.querySelectorAll("[data-seconds]").forEach(b=>b.classList.toggle("selected",b===button));
}));
document.querySelectorAll("[data-post]").forEach(button=>button.addEventListener("click",()=>{
  postSeconds=Number(button.dataset.post);
  document.querySelectorAll("[data-post]").forEach(b=>b.classList.toggle("selected",b===button));
}));
$("start").addEventListener("click",async()=>{
  try{
    const tab=tabId?{id:tabId}:await resolveTab();
    if(!tab)throw Error("Select an authorized website tab");
    const testContext=normalizeTestContext({
      scenarioId:$("scenarioId").value,tenantAlias:$("tenantAlias").value,
      actorRole:$("actorRole").value,actorAlias:$("actorAlias").value
    });
    $("message").textContent=testContext?
      "Starting recording for "+contextLabel(testContext)+"…":"Starting standalone tab capture…";
    const streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:tab.id});
    const result=await send("start",{streamId,captureInfoLogs:$("captureInfoLogs").checked,testContext});
    if(!result?.ok)throw Error(result?.error||"Could not start");
    $("message").textContent="Recording continuously. Mark issues without stopping.";
  }catch(e){$("message").textContent="Start failed: "+e.message;}
  await refresh();
});
$("stop").addEventListener("click",async()=>{
  $("message").textContent="Finalizing complete recording…";
  const result=await send("stop").catch(e=>({ok:false,error:e.message}));
  $("message").textContent=result?.ok?"Saved locally. Review opens in a new tab.":result?.error||"Could not stop";
  await refresh();
});
$("mark").addEventListener("click",async()=>{
  const title=$("issueTitle").value.trim()||"Untitled issue";
  const result=await send("mark",{title,lookbackSeconds:seconds,postBufferSeconds:postSeconds}).catch(e=>({ok:false,error:e.message}));
  if(result?.ok){
    $("message").textContent="Saved: "+title+" · "+seconds+"s before and "+postSeconds+"s after. Full recording continues.";
    $("issueTitle").value="";
  }else $("message").textContent=result?.error||"Mark failed";
  await refresh();
});
$("window").addEventListener("click",async()=>{
  const tab=await resolveTab();
  if(!tab){$("message").textContent="Select an authorized website tab.";return;}
  const owner=await chrome.windows.get(tab.windowId).catch(()=>null);
  const width=390,height=640;
  const placement={};
  if(owner && Number.isFinite(owner.left)&&Number.isFinite(owner.top)
    && Number.isFinite(owner.width)&&Number.isFinite(owner.height)){
    placement.left=Math.round(owner.left+Math.max(0,owner.width-width-18));
    placement.top=Math.round(owner.top+Math.max(0,owner.height-height-45));
  }
  await chrome.windows.create({
    url:chrome.runtime.getURL("sidepanel.html?tab="+tab.id+"&floating=1"),
    type:"popup",width,height,...placement
  }).catch(e=>{$("message").textContent="Could not open floating controls: "+e.message;});
});
$("recover").addEventListener("click",async()=>{
  await chrome.tabs.create({url:chrome.runtime.getURL("recovery.html")});
});
$("library").addEventListener("click",async()=>{
  await chrome.tabs.create({url:chrome.runtime.getURL("library.html")});
});
$("review").addEventListener("click",async()=>{
  const x=await chrome.storage.local.get("lastReportId");
  if(x.lastReportId)await chrome.tabs.create({url:chrome.runtime.getURL("viewer.html?id="+encodeURIComponent(x.lastReportId))});
  else $("message").textContent="No completed session yet.";
});
setInterval(()=>refresh().catch(()=>{}),1200);
refresh().catch(e=>{$("message").textContent=e.message;});