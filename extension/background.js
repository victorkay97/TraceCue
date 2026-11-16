import { classifyDiagnostic, safeEvidenceUrl, redactDiagnosticText } from "./diagnostics.js";
// TraceCue service worker. Captures a single user-selected HTTP(S) tab.
// This is not a background browsing monitor. No content or telemetry is uploaded.
let session = null;
let persistTimer = null;
let pendingOffscreen = null;
const MAX_EVENTS = 4000;
const ready = chrome.storage.session.get("tracecueActive").then(({tracecueActive}) => {
  if (tracecueActive) session = {...tracecueActive,requests:new Map(),contexts:new Map()};
}).catch(() => {});

const scrub = redactDiagnosticText;
const cleanUrl = safeEvidenceUrl;
function schedulePersist() {
  if (!persistTimer) persistTimer = setTimeout(() => {
    persistTimer = null;
    persist().catch(() => {});
  },1000);
}
// Repeated diagnostic messages are counted without flooding the evidence list.
function record(kind,data={},context={}) {
  if (!session) return;
  ({kind,data} = classifyDiagnostic(kind,data,context));
  const now = Date.now();
  if (["console-warning","console-error","console-exception","environment-diagnostic"].includes(kind)) {
    const signature = JSON.stringify([kind,data.level ?? "",data.message ?? "",data.url ?? "",data.sourceHint ?? ""]);
    const recent = session.events.slice(-20).reverse().find(event =>
      event.signature === signature && now - (event.lastAt || event.at) <= 4000
    );
    if (recent) {
      recent.occurrences = (recent.occurrences || 1) + 1;
      recent.lastAt = now;
      schedulePersist();
      return;
    }
    data = {...data,signature};
  }
  if (session.events.length >= MAX_EVENTS) { session.droppedEvents++; return; }
  session.events.push({kind,at:now,...data});
  schedulePersist();
}
async function persist() {
  if (!session) return;
  const {requests,contexts,...safe} = session;
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
async function start(tab, suppliedStreamId=null) {
  if (session) return;
  if (!tab?.id || !/^https?:\/\//.test(tab.url || "")) {
    console.warn("TraceCue supports user-authorized HTTP(S) tabs only.");
    return;
  }
  session = {
    id:"tc-" + Date.now(),tabId:tab.id,title:scrub(tab.title,160),
    url:cleanUrl(tab.url),startedAt:Date.now(),events:[],droppedEvents:0,
    environment:{userAgent:navigator.userAgent,platform:navigator.platform || "unknown"},
    video:false,videoStartedAt:null,attached:false,requests:new Map(),contexts:new Map()
  };
  await persist();
  // The action click supplies the user gesture for tabCapture.
  try {
    await offscreenReady();
    const streamId = suppliedStreamId || await chrome.tabCapture.getMediaStreamId({targetTabId:tab.id});
    const reply = await chrome.runtime.sendMessage({target:"offscreen",action:"start-video",streamId,id:session.id});
    if (!reply?.ok) throw new Error(reply?.error || "Video recording could not start");
    session.video = true;
    session.videoStartedAt = reply.startedAt || null;
  } catch (e) {
    const reason=scrub(e.message);
    session=null;
    await chrome.storage.session.remove("tracecueActive");
    return {ok:false,error:"Recording could not start: "+reason};
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
  await chrome.action.setTitle({tabId:tab.id,title:"TraceCue is recording"});
  return {ok:true,sessionId:session.id};
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
    videoStored,videoStartedAt:current.videoStartedAt,droppedEvents:current.droppedEvents,
    events:current.events.map(({signature,...event}) => event)
  };
  await chrome.storage.local.set({["report:" + report.id]:report,lastReportId:report.id});
  await chrome.storage.session.remove("tracecueActive");
  try { await chrome.action.setBadgeText({tabId:current.tabId,text:""}); } catch {}
  await chrome.tabs.create({url:chrome.runtime.getURL("viewer.html?id=" + encodeURIComponent(report.id))});
  return {ok:true,reportId:report.id,videoStored};
}
// An explicit toolbar gesture opens the companion. Nothing records until Start.
chrome.action.onClicked.addListener(async tab => {
  if(!tab?.id || !/^https?:\/\//.test(tab.url||""))return;
  try{
    await chrome.sidePanel.setOptions({tabId:tab.id,path:"sidepanel.html",enabled:true});
    await chrome.sidePanel.open({tabId:tab.id});
    await observe(tab.id);
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:["companion.js"]});
  }catch(e){console.error("TraceCue companion failed",e);}
});
chrome.commands.onCommand.addListener(async command => {
  await ready;
  if (command === "mark-issue" && session) {
    record("issue-marker",{markerId:"m-"+Date.now()+"-"+session.events.length,title:"Issue marker",lookbackSeconds:30});
    await persist().catch(() => {});
  }
});
chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {
  if (message?.target !== "background") return;
  if (message.kind === "interaction" && session && sender.tab?.id === session.tabId) {
    const event = message.event || {};
    if (["click","change","submit","page-ready"].includes(event.kind)) {
      record(event.kind,{element:scrub(event.element,90)});
    }
  }
  // Acknowledge messages from current scripts; no dangling response promise.
  sendResponse({ok:true});
});
// Companion and sidebar commands; sender tab checked against active capture.
chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
  if(msg?.target!=="tracecue-control")return;
  (async()=>{
    await ready;
    const tid=sender.tab?.id || Number(msg.tabId);
    const tab=Number.isSafeInteger(tid)?await chrome.tabs.get(tid).catch(()=>null):null;
    if(msg.action==="open-sidebar"){
      if(!tab)return {ok:false,error:"No website tab"};
      await chrome.sidePanel.setOptions({tabId:tab.id,path:"sidepanel.html",enabled:true});
      await chrome.sidePanel.open({tabId:tab.id});
      return {ok:true};
    }
    if(msg.action==="status")return {
      ok:true,recording:!!session,activeOnTab:session?.tabId===tab?.id,
      startedAt:session?.startedAt??null,tabId:session?.tabId??null
    };
    if(msg.action==="start"){
      if(!tab || !/^https?:\/\//.test(tab.url||""))return {ok:false,error:"Choose an authorized website tab"};
      if(session)return {ok:false,error:"Another recording is already active"};
      return start(tab,typeof msg.streamId==="string"?msg.streamId:null);
    }
    if(msg.action==="stop"){
      if(!session || session.tabId!==tab?.id)return {ok:false,error:"No active recording for this tab"};
      return stop();
    }
    if(msg.action==="mark"){
      if(!session || session.tabId!==tab?.id)return {ok:false,error:"Start recording first"};
      const lookbackSeconds=Math.max(5,Math.min(120,Math.round(Number(msg.lookbackSeconds)||30)));
      const title=scrub(msg.title||"Issue marker",100);
      const markerId="m-"+Date.now()+"-"+session.events.length;
      record("issue-marker",{markerId,title,lookbackSeconds});
      await persist();
      return {ok:true,markerId};
    }
    return {ok:false,error:"Unknown command"};
  })().then(respond,error=>respond({ok:false,error:String(error?.message||error)}));
  return true;
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
  if (change.status === "complete" && /^https?:\/\//.test(tab.url || "")) {
    await observe(tabId);
    await chrome.scripting.executeScript({target:{tabId},files:["companion.js"]}).catch(()=>{});
  }
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
  if (method === "Runtime.executionContextCreated") {
    const context = params.context;
    if (context?.id != null) {
      session.contexts.set(context.id,{
        origin:String(context.origin || ""),name:String(context.name || ""),
        isIsolated:context.auxData?.isDefault === false
      });
      if (session.contexts.size > 200) session.contexts.clear();
    }
    return;
  }
  if (method === "Runtime.executionContextDestroyed") {
    session.contexts.delete(params.executionContextId);
    return;
  }
  if (method === "Runtime.executionContextsCleared") {
    session.contexts.clear();
    return;
  }
  if (method === "Network.requestWillBeSent") {
    const rawUrl = params.request?.url || "";
    session.requests.set(params.requestId,{
      method:params.request?.method || "?",
      url:cleanUrl(rawUrl),
      rawExtension:/^chrome-extension:\/\//i.test(rawUrl)
    });
    if (session.requests.size > 500) session.requests.clear();
  } else if (method === "Network.responseReceived") {
    const request = session.requests.get(params.requestId);
    session.requests.delete(params.requestId);
    if (params.response?.status >= 400) {
      const rawUrl = params.response?.url || "";
      record("network-failure",{
        status:params.response.status,method:request?.method || "?",
        url:request?.url || cleanUrl(rawUrl)
      },{url:request?.rawExtension ? "chrome-extension://recorded" : rawUrl,pageUrl:session.url});
    }
  } else if (method === "Network.loadingFailed") {
    const request = session.requests.get(params.requestId);
    session.requests.delete(params.requestId);
    record("network-failure",{
      method:request?.method || "?",url:request?.url || "[unknown]",
      message:scrub(params.errorText)
    },{url:request?.rawExtension ? "chrome-extension://recorded" : "",pageUrl:session.url});
  } else if (method === "Runtime.exceptionThrown") {
    const detail = params.exceptionDetails || {};
    const context = session.contexts.get(detail.executionContextId);
    const stackUrl = detail.stackTrace?.callFrames?.find(frame=>frame.url)?.url || "";
    const originUrl = detail.url || stackUrl;
    record("console-exception",{
      message:scrub(detail.text),
      url:cleanUrl(originUrl)
    },{url:detail.url,stackUrl,contextOrigin:context?.origin,
       contextName:context?.name,isIsolated:context?.isIsolated,
       pageUrl:session.url});
  } else if (method === "Runtime.consoleAPICalled" &&
             ["error","warning","warn","assert"].includes(params.type)) {
    const context = session.contexts.get(params.executionContextId);
    const stackUrl = params.stackTrace?.callFrames?.find(frame=>frame.url)?.url || "";
    const kind = ["warning","warn"].includes(params.type) ? "console-warning" : "console-error";
    record(kind,{
      level:params.type,
      message:scrub((params.args || []).map(x=>x.value ?? x.description ?? "").join(" "))
    },{stackUrl,contextOrigin:context?.origin,
       contextName:context?.name,isIsolated:context?.isIsolated,
       pageUrl:session.url});
  } else if (method === "Log.entryAdded" &&
             ["error","warning","warn"].includes(params.entry?.level)) {
    const entry = params.entry;
    const stackUrl = entry.stackTrace?.callFrames?.find(frame=>frame.url)?.url || "";
    const kind = ["warning","warn"].includes(entry.level) ? "console-warning" : "console-error";
    record(kind,{
      level:entry.level,message:scrub(entry.text),
      url:entry.url ? cleanUrl(entry.url) : undefined
    },{url:entry.url,stackUrl,pageUrl:session.url});
  }
});
