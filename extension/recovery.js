const $=id=>document.getElementById(id);
const send=(action,more={})=>chrome.runtime.sendMessage({target:"tracecue-control",action,...more});
async function refresh(){
  const list=$("recoveryList");list.replaceChildren();
  $("recoveryStatus").textContent="Checking locally saved drafts…";
  const result=await send("list-drafts");
  if(!result?.ok){$("recoveryStatus").textContent=result?.error||"Cannot load local drafts.";return;}
  const drafts=result.drafts||[];
  if(!drafts.length){
    $("recoveryStatus").textContent="No interrupted sessions found. Completed recordings remain available through Last session.";
    return;
  }
  $("recoveryStatus").textContent=drafts.length+" locally checkpointed session"+(drafts.length===1?"":"s")+".";
  for(const draft of drafts){
    const row=document.createElement("article");row.className="recovery-item";
    const info=document.createElement("div");
    const name=document.createElement("strong");name.textContent=draft.title||"QA session";
    const date=document.createElement("small");
    date.textContent="Started "+new Date(draft.startedAt).toLocaleString()+
      " · Last checkpoint "+new Date(draft.checkpointAt||draft.startedAt).toLocaleString()+
      " · "+draft.events+" captured event groups";
    info.append(name,date);
    const button=document.createElement("button");
    button.className="secondary";button.textContent=draft.active?"Stop current recording first":"Recover saved evidence";
    button.disabled=!!draft.active;
    button.addEventListener("click",async()=>{
      if(!confirm("Recover this incomplete session? Video playback is not guaranteed."))return;
      button.disabled=true;$("recoveryStatus").textContent="Recovering locally stored video chunks and events…";
      try{
        const outcome=await send("recover-draft",{id:draft.id});
        if(!outcome?.ok)throw Error(outcome?.error||"Recovery failed");
        await chrome.tabs.create({url:chrome.runtime.getURL("viewer.html?id="+encodeURIComponent(outcome.reportId))});
        $("recoveryStatus").textContent=outcome.message||"Recovered; inspect the incomplete evidence.";
        await refresh();
      }catch(error){
        button.disabled=false;$("recoveryStatus").textContent="Recovery error: "+error.message;
      }
    });
    row.append(info,button);list.append(row);
  }
}
$("refresh").addEventListener("click",()=>refresh().catch(e=>{$("recoveryStatus").textContent=e.message;}));
refresh().catch(e=>{$("recoveryStatus").textContent=e.message;});
