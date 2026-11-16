import {issueMarkers} from "./issue-scope.js";
import {searchQaEvidence,buildQaQuestionPrompt} from "./qa-query.js";
import {investigate,investigateVideo} from "./firebase-ai.js";
const option=(value,title)=>{const o=document.createElement("option");o.value=value;o.textContent=title;return o;};
export function mountQaWorkspace(root,{getSession,onSelect,seek,hasFirebase=false}){
  root.innerHTML=[
    '<div class="panel-head"><div><span class="eyebrow">EVIDENCE-FIRST SEARCH</span><h2>Ask TraceCue</h2></div><span class="badge">Local retrieval + Hybrid AI</span></div>',
    '<p class="muted small">Find a 500 error, failed endpoint, console message, or the recorded moment of an action. Search works without AI.</p>',
    '<div class="query-grid"><label>Investigation scope<select id="qaScope"></select></label>',
    '<label>Search captured evidence<input id="qaQuestion" type="search" maxlength="300" placeholder="Where did HTTP 500 occur?"></label></div>',
    '<div class="actions"><button id="qaSearch">Find evidence</button><button id="qaDevice" disabled>Ask on-device AI</button><button id="qaCloud" class="ghost" disabled>Ask cloud AI</button></div>',
    '<label class="consent"><input type="checkbox" id="qaCloudConsent"><span>I reviewed the query and its cited evidence and approve sending this text to Firebase cloud AI.</span></label>',
    '<div id="qaQueryStatus" role="status" class="status-text">Import a QA session to search its evidence.</div>',
    '<div id="qaResults" class="query-results" aria-live="polite"></div>',
    '<details class="query-ai-output"><summary>AI answer · source verified</summary><pre id="qaAnswer">No AI query has been run.</pre></details>',
    '<div class="video-query"><strong>Ask about visible video content</strong>',
    '<p class="muted small">Visual AI is cloud-only. Choose and review an exported issue WebM or MP4 clip under 12 MB. A visual AI answer is a hypothesis, not a verified defect.</p>',
    '<label>Select a reviewed clip<input id="qaVideoFile" type="file" accept="video/webm,video/mp4,.webm,.mp4"></label>',
    '<label>Question about the clip<input id="qaVideoQuestion" type="text" maxlength="500" placeholder="When did the save button become unresponsive?"></label>',
    '<label class="consent"><input id="qaVideoConsent" type="checkbox"><span>I reviewed this entire video for private data and approve sending it to Firebase cloud AI.</span></label>',
    '<button id="qaVideoAsk" class="ghost" disabled>Ask Gemini about selected video</button>',
    '<p id="qaVideoStatus" role="status" class="status-text">No video has been shared.</p>',
    '<pre id="qaVideoAnswer" class="query-answer">No visual AI analysis yet.</pre></div>'
  ].join("");
  const $=id=>root.querySelector("#"+id);
  let selectedId="",requestToken=0;
  const makeButton=(name,handler)=>{
    const b=document.createElement("button");b.type="button";b.textContent=name;
    b.addEventListener("click",handler);return b;
  };
  const invalidate=()=>{
    requestToken++;$("qaCloudConsent").checked=false;$("qaVideoConsent").checked=false;
    $("qaAnswer").textContent="No AI query has been run for these inputs.";
    $("qaVideoAnswer").textContent="No visual AI response for these inputs.";
  };
  const refresh=()=>{
    const report=getSession();
    $("qaScope").replaceChildren(option("","Entire session"));
    if(report)for(const m of issueMarkers(report))
      $("qaScope").append(option(m.id,(m.event.title||"Untitled issue")+" · "+m.id));
    selectedId="";$("qaScope").value="";$("qaQuestion").value="";
    $("qaResults").replaceChildren();$("qaVideoFile").value="";
    $("qaQueryStatus").textContent=report?"Search or select an issue to narrow the evidence.":"Import a session first.";
    $("qaDevice").disabled=!report||!hasFirebase;
    $("qaCloud").disabled=!report||!hasFirebase;
    $("qaVideoAsk").disabled=!report||!hasFirebase;
    invalidate();onSelect("");
  };
  const doSearch=()=>{
    if(!getSession())return;
    try{
      const data=searchQaEvidence(getSession(),$("qaQuestion").value,{markerId:selectedId});
      const target=$("qaResults");target.replaceChildren();
      $("qaQueryStatus").textContent=data.explanation;
      if(!data.total){const p=document.createElement("p");p.className="muted small";p.textContent="No recorded match. This does not prove a failure never occurred.";target.append(p);}
      for(const e of data.matches){
        const b=makeButton("+"+e.second.toFixed(1)+"s · "+e.id+" · "+e.kind+
          (e.status?" · HTTP "+e.status:"")+(e.detail?" · "+e.detail:""),
          ()=>seek({...e,at:e.at}));
        b.className="query-result";b.title="Jump to the recorded event if a video is attached";
        target.append(b);
      }
      if(data.total>data.matches.length){
        const p=document.createElement("p");p.className="muted small";
        p.textContent="Showing "+data.matches.length+" of "+data.total+" matches. Refine the query.";
        target.append(p);
      }
      return data;
    }catch(error){$("qaQueryStatus").textContent="Search failed: "+error.message;return null;}
  };
  $("qaScope").addEventListener("change",()=>{
    selectedId=$("qaScope").value;invalidate();$("qaResults").replaceChildren();
    $("qaQueryStatus").textContent=selectedId?"Issue interval selected.":"Entire session selected.";
    onSelect(selectedId);
  });
  $("qaQuestion").addEventListener("input",invalidate);
  $("qaSearch").addEventListener("click",doSearch);
  $("qaQuestion").addEventListener("keydown",event=>{
    if(event.key==="Enter"){event.preventDefault();doSearch();}
  });
  async function runTextAi(mode){
    const report=getSession(),question=$("qaQuestion").value.trim();
    if(!report||!question){$("qaQueryStatus").textContent="Enter a specific QA question.";return;}
    if(!hasFirebase){$("qaQueryStatus").textContent="Firebase not configured for this preview.";return;}
    if(mode==="cloud"&&!$("qaCloudConsent").checked){
      $("qaQueryStatus").textContent="Review and authorize the cloud text request.";return;
    }
    const token=++requestToken;
    const context=buildQaQuestionPrompt(report,question,{markerId:selectedId});
    if(!context.total){
      $("qaQueryStatus").textContent="No captured events matched this question; try a broader query. AI will not invent missing evidence.";
      return;
    }
    doSearch();$("qaAnswer").textContent="Analyzing selected evidence…";
    $("qaAnswer").closest("details").open=true;
    $("qaDevice").disabled=true;$("qaCloud").disabled=true;
    try{
      const result=await investigate(context.prompt,mode,message=>{
        if(token===requestToken)$("qaQueryStatus").textContent=message;
      });
      if(token!==requestToken)return;
      $("qaAnswer").textContent=result.text;
      $("qaQueryStatus").textContent="Verified Firebase source: "+result.source+". The analysis is not a verified root cause.";
      $("qaCloudConsent").checked=false;
    }catch(error){
      if(token===requestToken){
        $("qaAnswer").textContent="No simulated response substituted.";
        $("qaQueryStatus").textContent="AI query unavailable: "+error.message;
      }
    }finally{
      if(token===requestToken){
        $("qaDevice").disabled=false;$("qaCloud").disabled=false;
      }
    }
  }
  $("qaDevice").addEventListener("click",()=>runTextAi("device"));
  $("qaCloud").addEventListener("click",()=>runTextAi("cloud"));
  for(const key of ["qaVideoFile","qaVideoQuestion"])$(key).addEventListener("input",()=>{
    invalidate();$("qaVideoStatus").textContent="Video not submitted; review the file.";
  });
  $("qaVideoAsk").addEventListener("click",async()=>{
    if(!getSession())return;
    if(!$("qaVideoConsent").checked){
      $("qaVideoStatus").textContent="Explicit video cloud consent is required.";return;
    }
    const file=$("qaVideoFile").files?.[0];
    if(!file){$("qaVideoStatus").textContent="Select an exported video clip first.";return;}
    if(!hasFirebase){$("qaVideoStatus").textContent="Firebase AI is not configured.";return;}
    const token=++requestToken;
    $("qaVideoAsk").disabled=true;
    try{
      const result=await investigateVideo(file,$("qaVideoQuestion").value.trim(),message=>{
        if(token===requestToken)$("qaVideoStatus").textContent=message;
      });
      if(token!==requestToken)return;
      $("qaVideoAnswer").textContent=result.text;
      $("qaVideoStatus").textContent="Verified cloud source: "+result.source+". Timestamps refer to the uploaded clip; verify model observations.";
    }catch(error){
      if(token===requestToken){
        $("qaVideoAnswer").textContent="No visual AI response produced.";
        $("qaVideoStatus").textContent="Video analysis failed: "+error.message;
      }
    }finally{
      if(token===requestToken){
        $("qaVideoAsk").disabled=false;$("qaVideoConsent").checked=false;
      }
    }
  });
  return {refresh,getMarkerId:()=>selectedId};
}
