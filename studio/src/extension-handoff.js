// A deliberate, local browser-to-browser transfer from a TraceCue extension
// review page. No fetch/upload, localStorage report copy or cloud AI request.
const VALID_EXTENSION=/^chrome-extension:\/\/[a-p]{32}$/;
export function readHandoffFragment(fragment){
  const values=new URLSearchParams(String(fragment||"").replace(/^#/,""));
  const token=values.get("tracecue-transfer");
  const extension=values.get("extension");
  if(!token&&!extension)return null;
  if(!/^[a-f0-9]{48}$/.test(token||"")||!/^[a-p]{32}$/.test(extension||""))
    return {invalid:true};
  return {token,extension,origin:"chrome-extension://"+extension};
}
export function initExtensionHandoff({validateReport,onAccept}){
  const param=readHandoffFragment(location.hash);
  if(!param)return;
  // Remove the capability URL immediately so it is not accidentally copied.
  try{history.replaceState(null,"",location.pathname+location.search);}catch{}
  const panel=document.createElement("aside");
  panel.className="tc-transfer-notice";panel.setAttribute("role","status");
  panel.setAttribute("aria-live","polite");
  panel.innerHTML='<strong>Incoming TraceCue session</strong><p id="transferMessage">Establishing a private browser handoff…</p><div class="transfer-actions"><button id="acceptTransfer" disabled>Import session locally</button><button id="rejectTransfer" class="ghost">Cancel</button></div>';
  document.body.append(panel);
  const $=id=>panel.querySelector("#"+id);
  let received=null;
  let accepted=false;
  const done=()=>{window.removeEventListener("message",handle);panel.remove();};
  $("rejectTransfer").addEventListener("click",done);
  if(param.invalid){
    $("transferMessage").textContent="Invalid transfer link. Reopen it from the extension reviewer.";
    return;
  }
  let timeout=setTimeout(()=>{
    if(!received)$("transferMessage").textContent="No session arrived. Keep the extension review window open and try again.";
  },15000);
  function handle(event){
    if(event.origin!==param.origin)return;
    const data=event.data;
    if(!data||data.type!=="tracecue.handoff.payload.v1"||data.token!==param.token)return;
    try{
      const serialized=JSON.stringify(data.report);
      if(serialized.length>5_000_000)throw Error("Session JSON exceeds the 5 MB import limit.");
      const report=validateReport(data.report);
      const video=data.video instanceof Blob?data.video:null;
      if(video && (video.size>80*1024*1024||!video.type.includes("webm")))
        throw Error("Video cannot be transferred safely. Use manual WebM import.");
      received={report,video};
      $("acceptTransfer").disabled=false;
      $("transferMessage").textContent=report.events.length+" captured event groups from "+(report.title||"session")+
        (video?" · full WebM "+(video.size/1048576).toFixed(1)+" MB":" · no video attached")+
        ". This local import will not upload evidence or invoke cloud AI.";
      clearTimeout(timeout);
    }catch(error){
      received=null;$("transferMessage").textContent="Transfer rejected: "+error.message;
    }
  }
  window.addEventListener("message",handle);
  $("acceptTransfer").addEventListener("click",()=>{
    if(!received||accepted)return;
    try{
      accepted=true;
      onAccept(received.report,received.video);
      done();
    }catch(error){
      accepted=false;$("transferMessage").textContent="Import failed: "+error.message;
    }
  });
  if(!window.opener){
    $("transferMessage").textContent="This Studio tab has no source review window. Reopen from TraceCue's session reviewer.";
    return;
  }
  // Ready message carries only a nonce. An extension opener requires '*' as
  // targetOrigin in some Chromium builds. No evidence is sent in this message.
  window.opener.postMessage({type:"tracecue.handoff.ready.v1",token:param.token},"*");
}
