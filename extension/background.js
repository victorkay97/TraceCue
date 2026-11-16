// TraceCue service worker. Captures a single user-selected HTTP(S) tab.
// This is not a background browsing monitor. No content or telemetry is uploaded.
let session = null;
let persistTimer = null;
let pendingOffscreen = null;
const MAX_EVENTS = 4000;
const ready = chrome.storage.session.get("tracecueActive").then(({tracecueActive}) => {
  if (tracecueActive) session = {...tracecueActive,requests:new Map()};
}).catch(() => {});

function scrub(value,max=220) {
  return String(value ?? "").slice(0,max)
    .replace(/Bearer\s+\S+/gi,"Bearer [REDACTED]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[EMAIL]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g,"[NUMBER]")
    .replace(/(?:token|password|secret|api[_-]?key)\s*[:=]\s*\S+/gi,"[REDACTED]");
}
function cleanUrl(raw) {
  try {
    const url = new URL(raw);
    // URLs may contain identifiers even in the path; limit them aggressively.
    return url.origin + url.pathname.split("/").map(part => {
      if (!part) return "";
      return /^[a-zA-Z_-]{1,35}$/.test(part) ? part : "[id]";
    }).join("/");
  } catch { return "[unknown]"; }
}
function record(kind,data={}) {
  if (!session) return;
  if (session.events.length >= MAX_EVENTS) { session.droppedEvents++; return; }
  session.events.push({kind,at:Date.now(),...data});
  if (!persistTimer) persistTimer = setTimeout(() => {
    persistTimer = null;
    persist().catch(() => {});
  },1000);
}
async function persist() {
  if (!session) return;
  const {requests,...safe} = session;
  await chrome.storage.session.set({tracecueActive:safe});
}
async function offscreenReady() {
  const url = chrome.runtime.getURL("offscreen.html");
  const contexts = await chrome.runtime.getContexts({contextTypes:["OFFSCREEN_DOCUMENT"],documentUrls:[url]});
  if (contexts.length) return;
  if (!pendingOffscreen) {
    pendingOffscreen = chrome.offscreen.createDocument({
      url:"offscreen.html",reasons:["USER_MEDIA"],justification:"Record a user-activated QA tab locally."
    }).finally(() => { pendingOffscreen = null; });
  }
  await pendingOffscreen;
}
async function observe(tabId) {
  try { await chrome.scripting.executeScript({target:{tabId},files:["content.js"]}); }
  catch (e) { record("warning",{message:"Page observer unavailable: " + scrub(e.message)}); }
}
async function start(tab) {
  if (session) return;
  if (!tab?.id || !/^https?:\/\//.test(tab.url || "")) {
    console.warn("TraceCue supports user-authorized HTTP(S) tabs only.");
    return;
  }
  session = {
    id:"tc-" + Date.now(),tabId:tab.id,title:scrub(tab.title,160),
    url:cleanUrl(tab.url),startedAt:Date.now(),events:[],droppedEvents:0,
    environment:{userAgent:navigator.userAgent,platform:navigator.platform || "unknown"},
    video:false,attached:false,requests:new Map()
  };
  await persist();
  // The action click supplies the user gesture for tabCapture.
  try {
    await offscreenReady();
    const streamId = await chrome.tabCapture.getMediaStreamId({targetTabId:tab.id});
    const reply = await chrome.runtime.sendMessage({target:"offscreen",action:"start-video",streamId,id:session.id});
    if (!reply?.ok) throw new Error(reply?.error || "Video recording could not start");
    session.video = true;
  } catch (e) {
    record("warning",{message:"Video unavailable: " + scrub(e.message)});
  }
  try {
    await chrome.debugger.attach({tabId:tab.id},"1.3");
    session.attached = true;
    for (const method of ["Network.enable","Runtime.enable","Log.enable"]) {
      try { await chrome.debugger.sendCommand({tabId:tab.id},method); }
      catch (e) { record("warning",{message:method + ": " + scrub(e.message)}); }
    }
  } catch (e) { record("warning",{message:"Debugger unavailable: " + scrub(e.message)}); }
  await observe(tab.id);
  record("capture-started",{video:session.video});
  await persist();
  await chrome.action.setBadgeBackgroundColor({tabId:tab.id,color:"#D94841"});
  await chrome.action.setBadgeText({tabId:tab.id,text:"REC"});
  await chrome.action.setTitle({tabId:tab.id,title:"TraceCue recording — click to stop"});
}
async function stop() {
  if (!session) return;
  record("capture-stopped");
  const current = session;
  session = null;
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
  if (current.attached) {
    try { await chrome.debugger.detach({tabId:current.tabId}); } catch {}
  }
  let videoStored = false;
  if (current.video) {
    try {
      const outcome = await chrome.runtime.sendMessage({target:"offscreen",action:"stop-video",id:current.id});
      videoStored = outcome?.ok === true;
      if (!videoStored) current.events.push({kind:"warning",at:Date.now(),message:"Video storage failed"});
    } catch { current.events.push({kind:"warning",at:Date.now(),message:"Video storage unavailable"}); }
  }
  const report = {
    schema:"tracecue-session-v1",id:current.id,title:current.title,url:current.url,
    startedAt:current.startedAt,stoppedAt:Date.now(),environment:current.environment,
    videoStored,droppedEvents:current.droppedEvents,events:current.events
  };
  await chrome.storage.local.set({["report:" + report.id]:report,lastReportId:report.id});
  await chrome.storage.session.remove("tracecueActive");
  try { await chrome.action.setBadgeText({tabId:current.tabId,text:""}); } catch {}
  await chrome.tabs.create({url:chrome.runtime.getURL("viewer.html?id=" + encodeURIComponent(report.id))});
}
chrome.action.onClicked.addListener(async tab => {
  await ready;
  try { if (session) await stop(); else await start(tab); }
  catch (e) { console.error("TraceCue recording failed",e); }
});
chrome.commands.onCommand.addListener(async command => {
  await ready;
  if (command === "mark-issue" && session) {
    record("issue-marker",{message:"Tester marked a possible defect"});
    await persist().catch(() => {});
  }
});
chrome.runtime.onMessage.addListener((message,sender) => {
  if (message?.target !== "background") return;
  if (message.kind === "heartbeat") return;
  if (message.kind === "interaction" && session && sender.tab?.id === session.tabId) {
    const event = message.event || {};
    if (!["click","change","submit","page-ready"].includes(event.kind)) return;
    record(event.kind,{element:scrub(event.element,90)});
  }
});
chrome.tabs.onUpdated.addListener(async (tabId,change,tab) => {
  await ready;
  if (session?.tabId !== tabId) return;
  // The tester consented only to the origin active when recording began.
  // A redirect to another origin ends capture immediately instead of silently following it.
  if (change.url) {
    let oldOrigin, newOrigin;
    try { oldOrigin = new URL(session.url).origin; newOrigin = new URL(change.url).origin; }
    catch { newOrigin = null; }
    if (!newOrigin || newOrigin !== oldOrigin) {
      record("warning",{message:"Recording stopped because the tab navigated to a different origin."});
      await stop();
      return;
    }
  }
  if (change.status === "complete" && /^https?:\/\//.test(tab.url || "")) await observe(tabId);
});
chrome.tabs.onRemoved.addListener(async tabId => { await ready; if (session?.tabId === tabId) await stop(); });
chrome.debugger.onDetach.addListener(async (source,reason) => {
  await ready;
  if (session && source.tabId === session.tabId) {
    session.attached = false;
    record("warning",{message:"Debugger detached: " + scrub(reason)});
  }
});
chrome.debugger.onEvent.addListener(async (source,method,params) => {
  await ready;
  if (!session || source.tabId !== session.tabId) return;
  if (method === "Network.requestWillBeSent") {
    session.requests.set(params.requestId,{method:params.request?.method || "?",url:cleanUrl(params.request?.url)});
    if (session.requests.size > 500) session.requests.clear();
  } else if (method === "Network.responseReceived") {
    const request = session.requests.get(params.requestId);
    session.requests.delete(params.requestId);
    if (params.response?.status >= 400) record("network-failure",{
      status:params.response.status,method:request?.method || "?",
      url:request?.url || cleanUrl(params.response?.url)
    });
  } else if (method === "Network.loadingFailed") {
    const request = session.requests.get(params.requestId);
    session.requests.delete(params.requestId);
    record("network-failure",{method:request?.method || "?",url:request?.url || "[unknown]",message:scrub(params.errorText)});
  } else if (method === "Runtime.exceptionThrown") {
    record("console-exception",{message:scrub(params.exceptionDetails?.text),url:cleanUrl(params.exceptionDetails?.url)});
  } else if (method === "Runtime.consoleAPICalled" && ["error","warning","assert"].includes(params.type)) {
    // Console strings can contain secrets. Keep messages shortened and redacted.
    record("console-error",{level:params.type,message:scrub((params.args || []).map(x => x.value ?? x.description ?? "").join(" "))});
  } else if (method === "Log.entryAdded" && ["error","warning"].includes(params.entry?.level)) {
    record("console-error",{level:params.entry.level,message:scrub(params.entry.text)});
  }
});
