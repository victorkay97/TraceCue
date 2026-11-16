import { redactDiagnosticText, safeEvidenceUrl } from "./diagnostics.js";
import {setupClipViewer} from "./clip-viewer.js";
// Local extension session viewer. Never fetches from remote hosts.
const $ = id => document.getElementById(id);
const id = new URLSearchParams(location.search).get("id");
const item = await chrome.storage.local.get("report:" + id);
const report = item["report:" + id];
if (!report) {
  $("title").textContent = "Recording not found";
  throw new Error("Missing TraceCue report");
}
$("title").textContent = report.title || "Untitled QA session";
$("meta").textContent = new Date(report.startedAt).toLocaleString() + " · " +
  report.url + " · " + Math.round((report.stoppedAt-report.startedAt)/1000) + "s";
// Legacy sessions may have stored warning-level entries under console-error.
const normalizedKind = event => {
  if (event.kind === "environment-diagnostic" ||
      ["browser-extension","browser-internal","isolated-world"].includes(event.sourceHint) ||
      /^chrome-extension:\/\//i.test(event.url || "") ||
      event.url === "[browser-extension]") return "environment-diagnostic";
  if (["console-error","console-warning","console-exception","network-failure"].includes(event.kind)) {
    // Include older reports: previous versions recorded extension messaging as app errors.
    if (/unchecked runtime\.lastError/i.test(event.message || "") &&
        /could not establish connection|receiving end does not exist|message port closed/i.test(event.message || "")) {
      return "environment-diagnostic";
    }
  }
  if (event.kind === "console-error" && ["warning","warn"].includes(event.level)) return "console-warning";
  return event.kind;
};
const occurrences = event => Number.isInteger(event.occurrences) && event.occurrences > 0 ?
  event.occurrences : 1;
const totalOccurrences = report.events.reduce((n,e)=>n+occurrences(e),0);
$("count").textContent = report.events.length + " grouped events" +
  (totalOccurrences !== report.events.length ? " · " + totalOccurrences + " occurrences" : "");
const categories = new Map();
for (const event of report.events) {
  const kind = normalizedKind(event);
  categories.set(kind,(categories.get(kind)||0)+occurrences(event));
}
for (const [kind,count] of categories) {
  const element = document.createElement("span");
  element.className = "pill";
  element.textContent = kind + ": " + count;
  $("summary").append(element);
}
const timeline = $("timeline");
let filter = "all";
function seekEvent(event) {
  const video = $("video");
  if (!videoBlob || !video.src) return;
  const origin = Number.isFinite(report.videoStartedAt) ?
    report.videoStartedAt : report.startedAt;
  const elapsed = Math.max(0,(event.at-origin)/1000);
  const target = Number.isFinite(video.duration) ?
    Math.min(elapsed,Math.max(0,video.duration-0.01)) : elapsed;
  video.currentTime = target;
  video.scrollIntoView({behavior:"smooth",block:"center"});
}
function showEvent(event) {
  const kind = normalizedKind(event);
  switch(filter) {
    case "errors":return ["console-error","console-exception","network-failure"].includes(kind);
    case "warnings":return ["console-warning","warning"].includes(kind);
    case "environment":return kind === "environment-diagnostic";
    case "actions":return ["click","change","submit","page-ready"].includes(kind);
    case "markers":return kind === "issue-marker";
    default:return true;
  }
}
function renderTimeline() {
  timeline.replaceChildren();
  const visible = report.events.filter(showEvent);
  if (visible.length === 0) {
    const empty=document.createElement("p");
    empty.className="muted";
    empty.textContent="No events in this category.";
    timeline.append(empty);
    return;
  }
  for (const event of visible) {
    const kind=normalizedKind(event);
    const row=document.createElement("button");
    row.type="button";
    row.className="event event-jump" +
      (["console-error","console-exception","network-failure"].includes(kind) ? " failure" : "") +
      (["console-warning","warning"].includes(kind) ? " warn" : "") +
      (kind === "environment-diagnostic" ? " environment" : "") +
      (kind === "issue-marker" ? " marker" : "");
    row.title="Jump to this event in the recording";
    row.addEventListener("click",()=>seekEvent(event));
    const time=document.createElement("time");
    time.textContent="+"+Math.max(0,(event.at-report.startedAt)/1000).toFixed(1)+"s";
    const info=document.createElement("span");
    const title=document.createElement("strong");
    title.textContent=kind;
    info.append(title);
    if(occurrences(event)>1) {
      const repeat=document.createElement("span");
      repeat.className="repeat";
      repeat.textContent="×"+occurrences(event);
      info.append(repeat);
    }
    const desc=document.createElement("p");
    desc.textContent=Object.entries(event)
      .filter(([key])=>!["at","lastAt","kind","occurrences","signature"].includes(key))
      .map(([key,value])=>key+": "+redactDiagnosticText(value,400)).join(" · ");
    info.append(desc);
    row.append(time,info);
    timeline.append(row);
  }
}
document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click",()=>{
  filter=button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(control=>{
    const active=control===button;
    control.classList.toggle("active",active);
    control.setAttribute("aria-pressed",String(active));
  });
  renderTimeline();
}));
renderTimeline();
$("issueTitle").value = report.issueTitle || "";
$("issueTitle").addEventListener("input",() => {
  report.issueTitle = $("issueTitle").value.slice(0,160);
  chrome.storage.local.set({["report:" + id]:report}).catch(console.error);
});
$("notes").value = report.testerNotes || "";
$("notes").addEventListener("input",() => {
  report.testerNotes = $("notes").value.slice(0,2500);
  chrome.storage.local.set({["report:" + id]:report}).catch(console.error);
});
let videoBlob = null;
function openDb() {
  return new Promise((resolve,reject) => {
    const req = indexedDB.open("tracecue-videos",1);
    req.onupgradeneeded = () => req.result.createObjectStore("recordings");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
try {
  const db = await openDb();
  videoBlob = await new Promise((resolve,reject) => {
    const tx = db.transaction("recordings","readonly");
    const get = tx.objectStore("recordings").get(id);
    get.onsuccess = () => resolve(get.result);
    get.onerror = () => reject(get.error);
  });
  db.close();
  if (videoBlob) {
    $("video").src = URL.createObjectURL(videoBlob);
    $("videoStatus").textContent = (videoBlob.size/1024/1024).toFixed(1) + " MB · stored locally";
  } else {
    $("video").hidden = true;
    $("videoStatus").textContent = "No video found; event evidence may be available.";
  }
} catch (error) {
  $("videoStatus").textContent = "Video unavailable: " + error.message;
}
window.addEventListener("beforeunload",() => {if ($("video").src) URL.revokeObjectURL($("video").src);});
function download(blob,name) {
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;a.click();
  setTimeout(() => URL.revokeObjectURL(url),5000);
}
$("saveVideo").disabled = !videoBlob;
$("saveVideo").addEventListener("click",()=>videoBlob && download(videoBlob,id + ".webm"));
// Sanitize copies on export, including reports captured by older TraceCue builds.
function safeExport(value,key="") {
  if (typeof value === "string") {
    if (["id","schema","kind","sourceHint","sourceConfidence","originalKind","level","platform"].includes(key))
      return value;
    if (key === "url") return safeEvidenceUrl(value);
    return redactDiagnosticText(value,2500);
  }
  if (Array.isArray(value)) return value.map(entry=>safeExport(entry));
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k,entry])=>[k,safeExport(entry,k)]));
  return value;
}
$("saveJson").addEventListener("click",() =>
  download(new Blob([JSON.stringify(safeExport(report),null,2)],{type:"application/json"}),id + ".json"));
$("saveMarkdown").addEventListener("click",() => {
  const safeReport = safeExport(report);
  const lines = [
    "# " + (safeReport.issueTitle || "Untitled QA observation"),"",
    "**Tested page:** " + (safeReport.title || "Unknown page"),
    "**Tested origin:** " + safeReport.url,
    "**Recorded:** " + new Date(safeReport.startedAt).toISOString(),"",
    "## Expected and actual behaviour","",safeReport.testerNotes || "(Add tester notes)","",
    "## Evidence timeline","",
    ...safeReport.events.map(e=>"- +" + ((e.at-safeReport.startedAt)/1000).toFixed(1) + "s — " +
      e.kind + ": " + [e.element,e.message,e.url,e.status].filter(Boolean).join(" · ")),"",
    "## Reproduction checklist","",
    "- [ ] Confirm prerequisites, account state, and test data",
    "- [ ] Verify every step against the recording",
    "- [ ] Reproduce the issue in an authorized environment","",
    "## Privacy review","",
    "- [ ] Remove sensitive information from recordings before sharing"
  ];
  download(new Blob([lines.join("\n")],{type:"text/markdown"}),id + ".md");
});

$("deleteSession").addEventListener("click",async () => {
  if (!confirm("Delete this session, including its locally stored video and events? This cannot be undone.")) return;
  try {
    const db = await openDb();
    await new Promise((resolve,reject) => {
      const tx = db.transaction("recordings","readwrite");
      const store=tx.objectStore("recordings");
      store.delete(id);
      // Remove separately saved issue clips as part of the same transaction.
      const cursor=store.openCursor();
      cursor.onsuccess=()=>{
        const entry=cursor.result;
        if(!entry)return;
        if(typeof entry.key==="string"&&entry.key.startsWith("clip:"+id+":"))entry.delete();
        entry.continue();
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    await chrome.storage.local.remove(["report:" + id,"lastReportId"]);
    if ($("video").src) URL.revokeObjectURL($("video").src);
    $("video").removeAttribute("src");
    $("video").hidden = true;
    $("timeline").replaceChildren();
    $("title").textContent = "Local session deleted";
    $("meta").textContent = "The video and event report have been removed from extension storage.";
    document.querySelectorAll("button").forEach(button => button.disabled = true);
  } catch(error) {
    alert("Could not delete the complete session: " + error.message);
  }
});


setupClipViewer({
  report,id,videoBlob,video:$("video"),openDb,download,seekEvent,onMarkerUpdated:renderTimeline,
  saveReport:async updated=>chrome.storage.local.set({["report:"+id]:updated})
}).catch(error=>{
  $("clipStatus").textContent="Clip viewer unavailable: "+error.message;
});
