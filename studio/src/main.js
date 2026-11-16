import "./styles.css";
import { validateReport,summarize,eventKind,buildPrompt,exportIssue,saveText } from "./report.js";
import { investigate } from "./firebase-ai.js";
import { generatePlaywrightDraft } from "./playwright-draft.js";

let session = null;
let analysis = null;
let view = "all";
const app = document.getElementById("app");
app.innerHTML = [
  '<div class="shell">',
  '<aside class="side">',
    '<div class="brand"><span class="brand-mark">T<span>·</span></span><div><strong>TraceCue</strong><small>Studio</small></div></div>',
    '<div class="side-group">WORKSPACE</div>',
    '<a href="#overview" class="nav selected">◫ &nbsp; Overview</a>',
    '<a href="#evidence" class="nav">▤ &nbsp; Evidence timeline</a>',
    '<a href="#intelligence" class="nav">✦ &nbsp; Intelligence</a>',
    '<div class="side-bottom"><div class="privacy-symbol">◈</div><strong>Local by default</strong><p>Imported evidence stays inside this browser unless you explicitly approve cloud analysis.</p><a href="https://firebase.google.com/docs/ai-logic/hybrid/web/get-started" target="_blank" rel="noreferrer">Firebase hybrid setup ↗</a></div>',
  '</aside>',
  '<div class="content">',
    '<header class="topbar"><div><span class="crumb">QA workspace / <strong>Session overview</strong></span></div><span class="state">● Development preview</span></header>',
    '<main>',
      '<section class="hero" id="overview"><div><span class="eyebrow">TRACE EVERY DEFECT</span><h1>Understand what happened.<br><em>Not what was remembered.</em></h1><p>Bring a browser testing session into TraceCue. Review the evidence locally, then decide whether an AI-assisted investigation is useful.</p></div><label class="upload">↑ &nbsp; Import session JSON<input type="file" id="file" accept="application/json,.json" hidden></label></section>',
      '<section class="metrics"><div class="metric"><small>Event occurrences</small><b id="events">—</b><span>From imported session</span></div><div class="metric"><small>Failures</small><b id="errors">—</b><span>Exceptions and failed requests</span></div><div class="metric"><small>Warnings</small><b id="warnings">—</b><span>Potentially noncritical diagnostics</span></div><div class="metric"><small>Interactions</small><b id="actions">—</b><span>User actions</span></div><div class="metric"><small>Duration</small><b id="duration">—</b><span>Seconds captured</span></div></section>',
      '<div class="two">',
        '<section class="panel" id="evidence"><div class="panel-head"><div><span class="eyebrow">CAPTURED SESSION</span><h2>Evidence timeline</h2></div><span class="badge" id="sessionBadge">No session imported</span></div>',
        '<div id="sessionMeta" class="meta">Import a session from the TraceCue Chrome companion to see its synchronized actions, failures, and issue markers.</div>',
        '<div class="tabs"><button data-view="all" class="selected">All events</button><button data-view="errors">Failures</button><button data-view="warnings">Warnings</button><button data-view="markers">Issue markers</button></div>',
        '<div id="timeline" class="timeline"><div class="empty">No evidence loaded yet.</div></div></section>',
        '<section class="panel" id="intelligence"><div class="panel-head"><div><span class="eyebrow">FIREBASE AI LOGIC</span><h2>Investigation workspace</h2></div><span class="badge">Hybrid AI</span></div>',
        '<div class="tip"><strong>No silent cloud upload.</strong> Run strictly on-device, or inspect and approve the exact text sent to cloud AI.</div>',
        '<label for="notes">Tester observation / expected result</label><textarea id="notes" rows="4" placeholder="Expected: saving the profile succeeds. Actual: save request fails and the UI does not update."></textarea>',
        '<label for="prompt">AI input · editable privacy review</label><textarea id="prompt" rows="10" placeholder="Import a TraceCue JSON to generate a minimized analysis prompt."></textarea>',
        '<label class="consent"><input id="consent" type="checkbox"><span>I reviewed this text and authorize sending it to Firebase cloud inference.</span></label>',
        '<div class="actions"><button id="device" disabled>Analyze on device</button><button id="cloud" class="ghost" disabled>Analyze in cloud</button></div>',
        '<p id="aiStatus" class="status-text">No model has been invoked.</p>',
        '<div id="aiResult" class="output">Analysis output will appear here only after a real AI response.</div>',
        '<button id="export" class="download" disabled>↓ &nbsp; Download investigation (.md)</button>',
        '<button id="playwright" class="download" disabled>↓ &nbsp; Draft Playwright test (.spec.ts)</button>',
        '</section>',
      '</div>',
      '<footer>TraceCue Studio · Evidence-first QA · No task-management features or fabricated AI results.</footer>',
    '</main>',
  '</div></div>'
].join("");
const $ = id => document.getElementById(id);
const noHtml = (tag,cls,value) => {const el=document.createElement(tag);el.className=cls;el.textContent=value;return el;};

function syncPrompt() {
  if (!session) return;
  $("prompt").value = buildPrompt(session,$("notes").value);
  $("consent").checked = false;
  analysis = null;
  $("export").disabled = true;
  $("aiResult").textContent = "A new prompt is ready. No AI request has been made.";
}
function renderTimeline() {
  const area = $("timeline");area.replaceChildren();
  if (!session) {area.append(noHtml("div","empty","No evidence loaded yet."));return;}
  const matches = session.events.filter(e => view === "all" ||
    (view === "errors" && ["network-failure","console-error","console-exception"].includes(eventKind(e))) ||
    (view === "warnings" && ["console-warning","warning"].includes(eventKind(e))) ||
    (view === "markers" && eventKind(e) === "issue-marker"));
  if (!matches.length) {area.append(noHtml("div","empty","No events in this category."));return;}
  for (const e of matches.slice(0,400)) {
    const kind = eventKind(e);
    const row = noHtml("div","event" + (["network-failure","console-error","console-exception"].includes(kind) ? " bad" : ""),"");
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
$("prompt").addEventListener("input",() => {
  $("consent").checked = false;analysis = null;$("export").disabled = true;
  $("aiStatus").textContent = "Prompt edited. Review it again before cloud analysis.";
});
$("file").addEventListener("change",async event => {
  try {
    const file=event.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) throw new Error("Maximum supported JSON size is 5MB.");
    const data = validateReport(JSON.parse(await file.text()));
    session=data;analysis=null;
    const s=summarize(data);
    $("events").textContent=s.events;
    $("errors").textContent=s.errors;
    $("warnings").textContent=s.warnings;
    $("actions").textContent=s.interactions;
    $("duration").textContent=s.duration + "s";
    $("sessionBadge").textContent="Imported · local";
    $("sessionMeta").textContent=(data.title || data.id) + " · " + new Date(data.startedAt).toLocaleString() +
      " · " + (data.url || "Unknown origin");
    $("notes").value=(data.testerNotes || "").slice(0,2500);
    $("device").disabled=false;$("cloud").disabled=false;$("playwright").disabled=false;
    $("aiStatus").textContent="Evidence imported locally. AI has not been invoked.";
    renderTimeline();syncPrompt();
  } catch (error) {
    $("aiStatus").textContent="Import failed: " + error.message;
  } finally { event.target.value = ""; }
});
async function analyze(mode) {
  if (!session) return;
  if (mode === "cloud" && !$("consent").checked) {
    $("aiStatus").textContent="Approve the exact input text before cloud inference.";
    return;
  }
  if (!$("prompt").value.trim()) return;
  const prompt=$("prompt").value;
  $("device").disabled=true;$("cloud").disabled=true;$("export").disabled=true;
  $("aiResult").textContent="";
  $("aiStatus").textContent=mode === "device" ? "Preparing local model…" : "Invoking cloud model with approved text…";
  try {
    const result=await investigate(prompt,mode,message=>{$("aiStatus").textContent=message;});
    analysis=result;
    $("aiResult").textContent=result.text;
    $("aiStatus").textContent="Verified SDK inference source: " + result.source + " · " + result.at;
    $("export").disabled=false;
  } catch(error) {
    $("aiStatus").textContent="AI unavailable: " + error.message;
    $("aiResult").textContent="No simulated output was substituted.";
  } finally {$("device").disabled=false;$("cloud").disabled=false;}
}
$("device").addEventListener("click",()=>analyze("device"));
$("cloud").addEventListener("click",()=>analyze("cloud"));
$("export").addEventListener("click",() => {
  if (!session) return;
  saveText("tracecue-" + session.id + "-investigation.md",
    exportIssue(session,$("notes").value,analysis),"text/markdown");
});

$("playwright").addEventListener("click",() => {
  if (!session) return;
  saveText("tracecue-" + session.id + ".spec.ts",generatePlaywrightDraft(session),"text/plain");
});
