import {clipBounds} from "./clipper.js";
import {redactDiagnosticText,safeEvidenceUrl} from "./diagnostics.js";

// Compute one canonical, absolute-time evidence window for a saved issue.
// It is shared by the viewer and both Markdown and JSON issue exports.
export function recordedDuration(report) {
  const start=Number.isFinite(report.videoStartedAt)?report.videoStartedAt:report.startedAt;
  const elapsed=Math.max(0,(report.stoppedAt-start)/1000);
  return Number.isFinite(report.videoDurationSeconds)&&report.videoDurationSeconds>0 ?
    Math.min(elapsed,report.videoDurationSeconds):elapsed;
}
export function issueWindow(report,marker,duration=recordedDuration(report)){
  const bounds=clipBounds(report,marker,duration);
  const origin=Number.isFinite(report.videoStartedAt)?report.videoStartedAt:report.startedAt;
  return {...bounds,origin,
    startMs:origin+bounds.start*1000,endMs:origin+bounds.end*1000};
}
const clean=(v,max=200)=>redactDiagnosticText(v,max);
export function clipEvents(report,marker,{limit=Infinity,durationSeconds}={}) {
  const window=issueWindow(report,marker,durationSeconds??recordedDuration(report));
  const result=[];
  for(const [index,event] of (report.events||[]).entries()){
    if(event.kind==="issue-marker")continue;
    // Grouped console entries can straddle a clip boundary. New captures store
    // each occurrence timestamp to attribute repeats to the right clip.
    const points=Array.isArray(event.occurrenceTimes)?
      event.occurrenceTimes.filter(Number.isFinite):null;
    const inRange=points?.filter(ms=>ms>=window.startMs&&ms<=window.endMs);
    const approximate=!points && Number(event.occurrences||1)>1;
    const first=points?.length?Math.min(...points):event.at;
    const last=points?.length?Math.max(...points):(event.lastAt??event.at);
    if(points ? !inRange.length : last<window.startMs||first>window.endMs)continue;
    const time=points?Math.min(...inRange):Math.max(first,window.startMs);
    result.push({
      ref:"EV"+String(index+1).padStart(4,"0"),
      at:time,
      second:Math.max(0,Math.round((time-window.origin)/100)/10),
      clipSecond:Math.max(0,Math.round((time-window.startMs)/100)/10),
      kind:String(event.kind||"unknown").slice(0,48),
      occurrences:points?inRange.length:Math.max(1,Math.min(100000,Number(event.occurrences)||1)),
      approximate:approximate && first<window.startMs,
      ...(Number.isFinite(event.status)?{status:event.status}:{}),
      ...(event.method?{method:clean(event.method,15)}:{}),
      ...(event.level?{level:clean(event.level,15)}:{}),
      ...(event.resourceType?{resourceType:clean(event.resourceType,18)}:{}),
      ...(Number.isFinite(event.durationMs)?{durationMs:event.durationMs}:{}),
      ...(event.sourceHint?{sourceHint:clean(event.sourceHint,50)}:{}),
      ...(event.element?{element:clean(event.element,90)}:{}),
      ...(event.message?{message:clean(event.message,220)}:{}),
      ...(event.url?{url:safeEvidenceUrl(event.url)}:{})
    });
    if(result.length>=limit)break;
  }
  return result.sort((a,b)=>a.at-b.at);
}
export function evidenceCategory(kind) {
  if(["console-error","console-warning","console-exception","console-info","console-debug"].includes(kind))return "console";
  if(["network-failure","network-response"].includes(kind))return "network";
  if(["click","change","submit","page-ready"].includes(kind))return "actions";
  if(["environment-diagnostic"].includes(kind))return "environment";
  return "other";
}
export function eventCaption(item) {
  return [item.kind,
    item.method,
    item.status ? "HTTP "+item.status:null,
    item.durationMs!==undefined ? item.durationMs+" ms":null,
    item.message||item.element||item.url||"",
    item.occurrences>1?"×"+item.occurrences:null,
    item.approximate?"Approximate timing on older session":null
  ].filter(Boolean).join(" · ");
}
