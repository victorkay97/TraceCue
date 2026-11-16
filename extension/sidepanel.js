const $=id=>document.getElementById(id);
let tabId=Number(new URLSearchParams(location.search).get("tab"))||null;
let seconds=30;
const send=(action,more={})=>chrome.runtime.sendMessage({target:"tracecue-control",action,tabId,...more});
async function resolveTab(){
  if(tabId){const tab=await chrome.tabs.get(tabId).catch(()=>null);if(tab)return tab;}
  const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
  if(tab&&/^https?:\/\//.test(tab.url||"")){tabId=tab.id;return tab;}
  return null;
}
const clock=ms=>{const s=Math.floor(Math.max(0,ms)/1000);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");};
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
}
document.querySelectorAll("[data-seconds]").forEach(button=>button.addEventListener("click",()=>{
  seconds=Number(button.dataset.seconds);
  document.querySelectorAll("[data-seconds]").forEach(b=>b.classList.toggle("selected",b===button));
}));
$("start").addEventListener("click",async()=>{
  try{
    const tab=tabId?{id:tabId}:await resolveTab();
    if(!tab)throw Error("Select an authorized website tab");
    $("message").textContent="Starting tab capture…";
    const streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:tab.id});
    const result=await send("start",{streamId});
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
  const result=await send("mark",{title:$("issueTitle").value.trim()||"Issue marker",lookbackSeconds:seconds}).catch(e=>({ok:false,error:e.message}));
  $("message").textContent=result?.ok?"Marker added. Previous "+seconds+" seconds selected for a clip.":(result?.error||"Mark failed");
});
$("window").addEventListener("click",async()=>{
  await resolveTab();
  await chrome.windows.create({url:chrome.runtime.getURL("sidepanel.html?tab="+tabId),type:"popup",width:440,height:740});
});
$("review").addEventListener("click",async()=>{
  const x=await chrome.storage.local.get("lastReportId");
  if(x.lastReportId)await chrome.tabs.create({url:chrome.runtime.getURL("viewer.html?id="+encodeURIComponent(x.lastReportId))});
  else $("message").textContent="No completed session yet.";
});
setInterval(()=>refresh().catch(()=>{}),1200);
refresh().catch(e=>{$("message").textContent=e.message;});