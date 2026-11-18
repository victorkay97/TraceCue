import "./styles.css";
import { validateReport,summarize,eventKind,buildPrompt,exportIssue,saveText } from "./report.js";
import { investigate } from "./firebase-ai.js";
import {prepareInvestigation,parseInvestigation,structuredToMarkdown} from "./evidence-intelligence.js";
import {renderEvidenceCatalog,renderInvestigation} from "./intelligence-view.js";
import { generatePlaywrightDraft } from "./playwright-draft.js";
import {buildGitHubIssueDraft,githubIssueUrl} from "./github-handoff.js";
import {createVideoInspector} from "./synchronized-video.js";
import {evaluateReproduction} from "./repro-audit.js";
import {sanitizeForAI} from "./evidence-intelligence.js";
import {scopedEvidence} from "./issue-scope.js";
import {mountQaWorkspace} from "./query-workspace.js";
import {createFrameAnnotator} from "./frame-annotator.js";
import {initStudioOnboarding} from "./onboarding.js";
import {initExtensionHandoff} from "./extension-handoff.js";
import {checkLocalModelAvailability,localReadinessLabel} from "./ai-readiness.js";
import {mountScenarioWorkspace} from "./scenario-workspace.js";

let session = null;
let analysis = null;
let view = "all";
let evidence = [];
let activeRequest = 0;
const hasFirebase=Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_APP_ID && import.meta.env.VITE_APPCHECK_SITE_KEY);
const app = document.getElementById("app");
app.innerHTML = [
  '<div class="shell">',
  '<aside class="side">',
    '<div class="brand"><span class="brand-mark">T<span>·</span></span><div><strong>TraceCue</strong><small>Studio</small></div></div>',
    '<div class="side-group">WORKSPACE</div>',
    '<a href="#overview" class="nav selected">◫ &nbsp; Overview</a>',
    '<a href="#evidence" class="nav">▤ &nbsp; Evidence timeline</a>',
    '<a href="#scenarios" class="nav">♧ &nbsp; Multi-actor scenarios</a>',
    '<a href="#intelligence" class="nav">✦ &nbsp; Intelligence</a>',
    '<button id="showGuide" type="button" class="nav nav-guide">? &nbsp; First-use guide</button>',
    '<a href="/" class="nav nav-home">↖ &nbsp; Back to website</a>',
    '<div class="side-bottom"><div class="privacy-symbol">◈</div><strong>Local by default</strong><p>Imported evidence stays inside this browser unless you explicitly approve cloud analysis.</p><a href="https://firebase.google.com/docs/ai-logic/hybrid/web/get-started" target="_blank" rel="noreferrer">Firebase hybrid setup ↗</a></div>',
  '</aside>',
  '<div class="content">',
    '<header class="topbar"><div><span class="crumb">QA workspace / <strong>Session overview</strong></span></div><div class="topbar-actions"><span class="state">● Development preview</span><button id="showGuideTop" class="topbar-guide" type="button">Guide</button><a href="/" class="topbar-home">Home ↗</a></div></header>',
    '<main>',
      '<section class="hero" id="overview"><div><span class="eyebrow">TRACE EVERY DEFECT</span><h1>Understand what happened.<br><em>Not what was remembered.</em></h1><p>Bring a browser testing session into TraceCue. Review the evidence locally, then decide whether an AI-assisted investigation is useful.</p><p class="demo-label">Public demo is fictional and does not represent an actual customer defect.</p></div><div class="hero-actions"><button id="loadDemo" class="demo-button">Try fictional demo</button><label class="upload">↑ &nbsp; Import session JSON<input type="file" id="file" accept="application/json,.json" hidden></label></div></section>',
      '<section class="metrics"><div class="metric"><small>Event occurrences</small><b id="events">—</b><span>From imported session</span></div><div class="metric"><small>Failures</small><b id="errors">—</b><span>Exceptions and failed requests</span></div><div class="metric"><small>Warnings</small><b id="warnings">—</b><span>Potentially noncritical diagnostics</span></div><div class="metric"><small>Environment</small><b id="environment">—</b><span>Possible extension-related messages</span></div><div class="metric"><small>Interactions</small><b id="actions">—</b><span>User actions</span></div><div class="metric"><small>Duration</small><b id="duration">—</b><span>Seconds captured</span></div></section>',
      '<section id="scenarios" class="panel qa-scenario-panel" aria-label="Multi-actor scenario comparison"></section>',
      '<section id="queryWorkspace" class="panel qa-query-panel" aria-label="Ask TraceCue evidence interrogation"></section>',
      '<div class="two">',
        '<section class="panel" id="evidence"><div class="panel-head"><div><span class="eyebrow">CAPTURED SESSION</span><h2>Evidence timeline</h2></div><span class="badge" id="sessionBadge">No session imported</span></div>',
        '<div id="sessionMeta" class="meta">Import a session from the TraceCue Chrome companion to see its synchronized actions, failures, and issue markers.</div>',
        '<div class="video-inspector"><div class="video-top"><strong>Full recording · synchronized</strong><label class="video-upload">↑ Attach full WebM<input id="videoUpload" type="file" accept="video/webm,.webm" hidden></label></div>',
        '<p id="videoStatus" class="muted">Import a complete WebM to synchronize recorded events.</p><video id="fullVideo" controls playsinline hidden></video>',
        '<div class="video-markers" id="videoMarkers"></div><p class="muted small">The video stays in this browser. Event timestamps are aligned to the actual video start.</p></div><section class="frame-annotator" id="frameAnnotator"></section>',
        '<div class="tabs"><button data-view="all" class="selected">All events</button><button data-view="errors">Failures</button><button data-view="warnings">Warnings</button><button data-view="environment">Environment</button><button data-view="markers">Issue markers</button></div>',
        '<div id="timeline" class="timeline"><div class="empty">No evidence loaded yet.</div></div></section>',
        '<section class="panel" id="intelligence"><div class="panel-head"><div><span class="eyebrow">FIREBASE AI LOGIC</span><h2>Investigation workspace</h2></div><span class="badge">Hybrid AI</span></div>',
        '<div class="tip"><strong>No silent cloud upload.</strong> Run strictly on-device, or inspect and approve the exact text sent to cloud AI.</div>',
        '<div class="ai-mode-guide"><div class="ai-mode-entry"><span class="ai-mode-icon">⌁</span><div><strong>On-device first</strong><p>Your text stays on your device when a compatible Chrome local model is available.</p></div></div><div class="ai-mode-entry"><span class="ai-mode-icon">↗</span><div><strong>Cloud is optional</strong><p>Only reviewed text is sent to Firebase after your explicit approval.</p></div></div></div>',
        '<div class="local-readiness"><button type="button" id="checkDevice" class="readiness-button">Check my local AI readiness</button><span id="deviceStatus" role="status">Model availability not checked.</span></div>',
        '<label for="notes">Tester observation / expected result</label><textarea id="notes" rows="4" placeholder="Expected: saving the profile succeeds. Actual: save request fails and the UI does not update."></textarea>',
        '<label class="consent"><input id="includeEnvironment" type="checkbox"><span>Include extension/environment signals in AI prompt (excluded by default)</span></label>',
        '<div id="evidenceCatalog" class="evidence-catalog"></div>',
        '<label for="prompt">AI input · editable privacy review</label><textarea id="prompt" rows="10" placeholder="Import a TraceCue JSON to generate a minimized analysis prompt."></textarea>',
        '<label class="consent"><input id="consent" type="checkbox"><span>I reviewed this text and authorize sending it to Firebase cloud inference.</span></label>',
        '<div class="actions"><button id="device" disabled>Analyze on device</button><button id="cloud" class="ghost" disabled>Analyze in cloud</button></div>',
        '<p id="aiStatus" class="status-text">No model has been invoked.</p>',
        '<div id="structuredResult" class="insight-stack"></div>',
        '<details class="raw-response"><summary>View raw model response</summary><div id="aiResult" class="output">No AI response yet.</div></details>',
        '<button id="export" class="download" disabled>↓ &nbsp; Download investigation (.md)</button>',
        '<button id="playwright" class="download" disabled>↓ &nbsp; Draft Playwright test (.spec.ts)</button>',
        '<section class="handoff" id="githubHandoff">',
          '<div class="eyebrow">ENGINEERING HANDOFF</div><h3>GitHub Issues draft</h3>',
          '<p>Copy a minimized draft for review. Nothing is published or uploaded to GitHub automatically.</p>',
          '<label for="githubRepo">Target repository (owner/repository)</label>',
          '<input id="githubRepo" spellcheck="false" autocomplete="off" placeholder="owner/repository">',
          '<div class="audit"><strong>Human reproduction review</strong><p>These checks are tester attestations, not AI-generated proof.</p>',
          '<label for="reproPreconditions">Prerequisites / test account state</label><textarea id="reproPreconditions" rows="2" placeholder="Sandbox environment, test account and initial state"></textarea>',
          '<label for="reproExpected">Expected result</label><textarea id="reproExpected" rows="2" placeholder="What should happen?"></textarea>',
          '<label for="reproActual">Actual result</label><textarea id="reproActual" rows="2" placeholder="What did you observe?"></textarea>',
          '<label class="consent"><input id="reproSteps" type="checkbox"><span>I manually checked each reproduction step</span></label>',
          '<label class="consent"><input id="reproRetest" type="checkbox"><span>I retested the issue and confirmed the result</span></label>',
          '<label class="consent"><input id="reproPrivacy" type="checkbox"><span>I reviewed the draft for sensitive information</span></label>',
          '<label class="consent"><input id="reproAuthorized" type="checkbox"><span>I am authorized to test and share this evidence</span></label>',
          '<p id="reproStatus" role="status" class="status-text">Complete the review before sharing an issue draft.</p></div>',
          '<label for="issuePreview">Review issue draft</label>',
          '<textarea id="issuePreview" rows="9" readonly placeholder="Analyze a session to prepare a draft."></textarea>',
          '<div class="actions"><button id="copyGitHub" disabled>Copy issue draft</button><button id="openGitHub" class="ghost" disabled>Open GitHub Issues</button></div>',
          '<p id="handoffStatus" class="status-text">Only reviewed text is copied; videos and raw session data are not sent.</p>',
        '</section>',
        '</section>',
      '</div>',
      '<footer>TraceCue Studio · Evidence-first QA · No task-management features or fabricated AI results.</footer>',
    '</main>',
  '</div></div>'
].join("");
const $ = id => document.getElementById(id);
const noHtml = (tag,cls,value) => {const el=document.createElement(tag);el.className=cls;el.textContent=value;return el;};
const videoInspector=createVideoInspector({video:$("fullVideo"),upload:$("videoUpload"),status:$("videoStatus"),markers:$("videoMarkers")});
const annotator=createFrameAnnotator($("frameAnnotator"),{video:$("fullVideo"),getSession:()=>session});
const qaWorkspace=mountQaWorkspace($("queryWorkspace"),{
  getSession:()=>session,hasFirebase,
  seek:event=>videoInspector.seek(event),
  onSelect:()=>{if(session)syncPrompt();}
});
const selectedReport=()=>scopedEvidence(session,qaWorkspace.getMarkerId()).report;
const scenarioWorkspace=mountScenarioWorkspace($("scenarios"),{
  validateReport,saveText,getCurrentReport:()=>session,
  onInspect:report=>{
    applyReport(report);
    $("evidence").scrollIntoView({behavior:"smooth",block:"start"});
  }
});

function evidenceRef(index){return "EV"+String(index+1).padStart(4,"0");}
function focusEvidence(id){
  const idx=Number(id.replace(/^EV/,""))-1;
  if(session?.events[idx])videoInspector.seek(session.events[idx]);
  view="all";
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("selected",b.dataset.view==="all"));
  renderTimeline();
  const entry=document.getElementById("event-"+id);
  if(entry){
    entry.classList.add("evidence-highlight");
    entry.scrollIntoView({behavior:"smooth",block:"center"});
  }
}
function resetAnalysis(message){
  analysis=null;
  $("export").disabled=true;
  $("copyGitHub").disabled=true;
  $("issuePreview").value="";
  $("handoffStatus").textContent="No current AI investigation. Nothing was sent to GitHub.";
  if(typeof currentAudit==="function")refreshGitHubDraft();
  // If a prompt is edited while a request is running, discard the stale result
  // and allow a fresh request instead of leaving the buttons disabled.
  if(session){
    $("device").disabled=!hasFirebase;
    $("cloud").disabled=!hasFirebase;
  }
  $("structuredResult").replaceChildren();
  $("aiResult").textContent=message;
}
function syncPrompt() {
  if(!session)return;
  const scoped=scopedEvidence(session,qaWorkspace.getMarkerId());
  const testerNotes=scoped.bounds?.marker.event.testerNotes||"";
  const prepared=prepareInvestigation(scoped.report,
    [$("notes").value,testerNotes].filter(Boolean).join("\n"),
    {includeEnvironment:$("includeEnvironment").checked});
  evidence=prepared.catalog;
  $("prompt").value=prepared.prompt;
  $("consent").checked=false;
  activeRequest++;
  resetAnalysis("Evidence prompt ready. No AI call has been made.");
  renderEvidenceCatalog($("evidenceCatalog"),evidence,focusEvidence);
}
function renderTimeline() {
  const area = $("timeline");area.replaceChildren();
  if (!session) {area.append(noHtml("div","empty","No evidence loaded yet."));return;}
  const matches = session.events.map((event,index)=>({event,index})).filter(({event:e}) => view === "all" ||
    (view === "errors" && ["network-failure","console-error","console-exception"].includes(eventKind(e))) ||
    (view === "warnings" && ["console-warning","warning"].includes(eventKind(e))) ||
    (view === "environment" && eventKind(e) === "environment-diagnostic") ||
    (view === "markers" && eventKind(e) === "issue-marker"));
  if (!matches.length) {area.append(noHtml("div","empty","No events in this category."));return;}
  for (const {event:e,index} of matches.slice(0,400)) {
    const kind = eventKind(e);
    const row = noHtml("div","event" + (["network-failure","console-error","console-exception"].includes(kind) ? " bad" : ""),"");
    row.id="event-"+evidenceRef(index);
    row.title="Click to seek the full video to this event";
    row.tabIndex=0;
    row.setAttribute("role","button");
    row.addEventListener("click",()=>videoInspector.seek(e));
    row.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){event.preventDefault();videoInspector.seek(e);}
    });
    row.append(noHtml("time","time","+" + ((e.at-session.startedAt)/1000).toFixed(1) + "s"));
    const box=document.createElement("div");
    box.append(noHtml("strong","",kind + (e.occurrences > 1 ? " ×" + e.occurrences : "")));
    const pieces=[e.element,e.message,e.status,e.url].filter(Boolean);
    box.append(noHtml("p","",pieces.join(" · ").slice(0,350)));
    row.append(box);area.append(row);
  }
}
document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click",() => {
  view = button.dataset.view;
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("selected",b===button));
  renderTimeline();
}));
$("notes").addEventListener("input",syncPrompt);
$("includeEnvironment").addEventListener("change",syncPrompt);
$("prompt").addEventListener("input",() => {
  $("consent").checked=false;activeRequest++;
  resetAnalysis("Prompt edited; previous output is no longer current.");
  $("aiStatus").textContent = "Prompt edited. Review it again before cloud analysis.";
});
function applyReport(data){
    session=data;analysis=null;
    for(const id of ["reproPreconditions","reproExpected","reproActual"])$(id).value="";
    for(const id of ["reproSteps","reproRetest","reproPrivacy","reproAuthorized"])$(id).checked=false;
    videoInspector.configure(data);
    annotator.clear();
    qaWorkspace.refresh();
    scenarioWorkspace.addReport(data);
    const s=summarize(data);
    $("events").textContent=s.events;
    $("errors").textContent=s.errors;
    $("warnings").textContent=s.warnings;
    $("environment").textContent=s.environment;
    $("actions").textContent=s.interactions;
    $("duration").textContent=s.duration + "s";
    $("sessionBadge").textContent="Imported · local";
    $("sessionMeta").textContent=(data.title || data.id) + " · " + new Date(data.startedAt).toLocaleString() +
      " · " + (data.url || "Unknown origin");
    $("notes").value=(data.testerNotes || "").slice(0,2500);
    $("device").disabled=!hasFirebase;$("cloud").disabled=!hasFirebase;$("playwright").disabled=false;
    $("aiStatus").textContent=hasFirebase?"Evidence imported locally. AI has not been invoked.":"Local evidence preview ready. Firebase AI requires an authorized domain and production configuration.";
    renderTimeline();syncPrompt();
}
$("loadDemo").addEventListener("click",async()=>{
  try{
    const response=await fetch("/demo-session.json");
    if(!response.ok)throw new Error("Fictional demo file unavailable");
    const report=validateReport(await response.json());
    applyReport(report);
    $("aiStatus").textContent=hasFirebase?"Synthetic demo loaded; not a real-world defect.":"Synthetic demo loaded; not a real-world defect. Firebase AI disabled until production configuration is added.";
  }catch(error){$("aiStatus").textContent="Demo load failed: "+error.message;}
});
$("file").addEventListener("change",async event => {
  try {
    const file=event.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) throw new Error("Maximum supported JSON size is 5MB.");
    const data = validateReport(JSON.parse(await file.text()));
    applyReport(data);
  } catch (error) {
    $("aiStatus").textContent="Import failed: " + error.message;
  } finally { event.target.value = ""; }
});
async function analyze(mode) {
  if(!session)return;
  if(!hasFirebase){$("aiStatus").textContent="Firebase AI is not configured for this deployed preview.";return;}
  if(mode==="cloud"&&!$("consent").checked){
    $("aiStatus").textContent="Review and explicitly authorize the text sent to cloud AI.";return;
  }
  const prompt=$("prompt").value;
  if(!prompt.trim())return;
  const serial=++activeRequest;
  $("device").disabled=true;$("cloud").disabled=true;$("export").disabled=true;
  $("structuredResult").replaceChildren();
  $("aiResult").textContent="No response received.";
  $("aiStatus").textContent=mode==="device"?"Preparing local model…":"Invoking approved Firebase cloud model…";
  try{
    const result=await investigate(prompt,mode,message=>{
      if(serial===activeRequest)$("aiStatus").textContent=message;
    });
    if(serial!==activeRequest)return;
    const parsed=parseInvestigation(result.text,evidence.map(x=>x.id));
    analysis={...result,structured:parsed.structured};
    $("aiResult").textContent=result.text;
    renderInvestigation($("structuredResult"),parsed.structured,focusEvidence,evidence);
    $("aiStatus").textContent="Verified SDK source "+result.source+" · "+result.at+
      (parsed.reason?" · "+parsed.reason+"; raw output retained":" · evidence references verified");
    $("export").disabled=false;
    refreshGitHubDraft();
    $("consent").checked=false;
  }catch(error){
    if(serial!==activeRequest)return;
    resetAnalysis("No simulated response was substituted.");
    $("aiStatus").textContent="Firebase AI unavailable: "+error.message;
  }finally{
    if(serial===activeRequest){
      $("device").disabled=!hasFirebase;$("cloud").disabled=!hasFirebase;
    }
  }
}
const reproFields=["reproPreconditions","reproExpected","reproActual",
  "reproSteps","reproRetest","reproPrivacy","reproAuthorized"];
function currentAudit(){
  return {
    preconditions:$("reproPreconditions").value,expected:$("reproExpected").value,
    actual:$("reproActual").value,
    stepsReviewed:$("reproSteps").checked,
    retested:$("reproRetest").checked,
    privacyReviewed:$("reproPrivacy").checked,
    authorized:$("reproAuthorized").checked
  };
}
function refreshGitHubDraft(){
  const audit=currentAudit();
  const gate=evaluateReproduction(audit,evidence);
  $("reproStatus").textContent=gate.label+
    (gate.blockers.length?" — "+gate.blockers.join(" "):" · Human-reviewed; not independently verified.");
  $("copyGitHub").disabled=!analysis?.structured||!gate.ready;
  $("openGitHub").disabled=!analysis?.structured||!gate.ready||!githubIssueUrl($("githubRepo").value);
  if(!session || !analysis?.structured){
    $("issuePreview").value="";return;
  }
  const draft=buildGitHubIssueDraft(selectedReport(),analysis.structured,evidence,analysis.source);
  const review=[
    "## Tester attestation (self-reported)",
    "- Prerequisites: "+sanitizeForAI(audit.preconditions,600),
    "- Expected: "+sanitizeForAI(audit.expected,600),
    "- Actual: "+sanitizeForAI(audit.actual,600),
    "- Steps reviewed: "+(audit.stepsReviewed?"Yes":"Not yet"),
    "- Retested: "+(audit.retested?"Yes":"Not yet"),
    "- Sensitive information reviewed: "+(audit.privacyReviewed?"Yes":"Not yet"),
    "- Authorization confirmed: "+(audit.authorized?"Yes":"Not yet"),
    ""
  ].join("\n");
  $("issuePreview").value=draft.title+"\n\n"+review+"\n"+draft.body;
  $("handoffStatus").textContent=gate.ready?
    "Ready for explicit manual review in GitHub. Nothing has been transmitted.":
    "Draft preview only; complete tester verification before copying or opening GitHub.";
}
reproFields.forEach(id=>$(id).addEventListener("input",refreshGitHubDraft));

$("githubRepo").addEventListener("input",()=>{
  const url=githubIssueUrl($("githubRepo").value);
  $("openGitHub").disabled=!url||!evaluateReproduction(currentAudit(),evidence).ready||!analysis?.structured;
  $("handoffStatus").textContent=url?"Repository format valid. Opening it does not submit a report.":
    "Enter a GitHub repository in owner/repository format.";
});
$("copyGitHub").addEventListener("click",async()=>{
  if(!session||!analysis?.structured||!evaluateReproduction(currentAudit(),evidence).ready)return;
  try{
    await navigator.clipboard.writeText($("issuePreview").value);
    $("handoffStatus").textContent="Draft copied locally. Review its content before pasting or submitting.";
  }catch(err){
    $("handoffStatus").textContent="Clipboard failed: "+err.message+". Select the draft manually to copy it.";
  }
});
$("openGitHub").addEventListener("click",()=>{
  const url=githubIssueUrl($("githubRepo").value);
  if(!url||!analysis?.structured||!evaluateReproduction(currentAudit(),evidence).ready)return;
  window.open(url,"_blank","noopener,noreferrer");
  $("handoffStatus").textContent="GitHub issue form opened. No report text or recording was transmitted by TraceCue.";
});

$("device").addEventListener("click",()=>analyze("device"));
$("cloud").addEventListener("click",()=>analyze("cloud"));
$("export").addEventListener("click",() => {
  if (!session) return;
  saveText("tracecue-" + session.id + "-investigation.md",
    exportIssue(selectedReport(),$("notes").value,analysis)+
      (analysis?.structured?"\n\n"+structuredToMarkdown(analysis.structured):""),"text/markdown");
});

$("playwright").addEventListener("click",() => {
  if (!session) return;
  saveText("tracecue-" + session.id + ".spec.ts",generatePlaywrightDraft(selectedReport()),"text/plain");
});


// TraceCue 0.5: explicit onboarding and optional, browser-local handoff.
// Neither operation starts recording or submits any data to cloud inference.
initStudioOnboarding({
  loadDemo:()=>$("loadDemo").click(),
  openSection:id=>document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"})
});
initExtensionHandoff({
  validateReport,
  onAccept:(report,video)=>{
    applyReport(report);
    if(video)videoInspector.attachVideoBlob(video,"Transferred full recording");
    $("sessionBadge").textContent="Extension handoff · local";
    $("aiStatus").textContent="Reviewed extension evidence transferred locally. No AI model has been invoked.";
    $("overview").scrollIntoView({behavior:"smooth",block:"start"});
  }
});
$("checkDevice").addEventListener("click",async()=>{
  $("deviceStatus").textContent="Checking compatible local language-model support…";
  try{
    const status=await checkLocalModelAvailability(globalThis.LanguageModel);
    $("deviceStatus").textContent=localReadinessLabel(status);
  }catch(error){
    $("deviceStatus").textContent="Local model check failed: "+error.message;
  }
});
if(new URLSearchParams(location.search).has("demo") && !location.hash.includes("tracecue-transfer")){
  $("loadDemo").click();
}
