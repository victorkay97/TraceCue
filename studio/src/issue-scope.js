// TraceCue's issue-scoping contract. Preserves original EV IDs and event
// timestamps; excludes events from other issues before constructing AI prompts.
export const evidenceId=index=>"EV"+String(index+1).padStart(4,"0");
export function issueMarkers(report){
  return (report?.events||[]).map((event,index)=>({event,index,id:event.markerId||"legacy-"+index}))
    .filter(x=>x.event.kind==="issue-marker");
}
export function issueBounds(report,markerId){
  if(!markerId)return null;
  const marker=issueMarkers(report).find(x=>x.id===markerId);
  if(!marker)throw new Error("Selected issue marker was not found in this session");
  const startAt=Number.isFinite(report.videoStartedAt)?report.videoStartedAt:report.startedAt;
  const duration=Math.max(0,(report.stoppedAt-startAt)/1000);
  const e=marker.event;
  const markerSecond=Math.max(0,(e.at-startAt)/1000);
  const before=Math.max(5,Math.min(120,Number(e.lookbackSeconds)||30));
  const after=Math.max(0,Math.min(10,Number(e.postBufferSeconds)||0));
  const edited=e.clipStartSecond!==undefined||e.clipEndSecond!==undefined;
  if(edited && (!Number.isFinite(e.clipStartSecond)||!Number.isFinite(e.clipEndSecond)))
    throw Error("Invalid manually edited clip bounds");
  const clipStart=edited?e.clipStartSecond:Math.max(0,Math.min(duration,markerSecond)-before);
  const clipEnd=edited?e.clipEndSecond:Math.min(duration,markerSecond+after);
  if(clipStart<0||clipEnd>duration+0.001||clipEnd<clipStart)
    throw Error("Invalid selected issue window");
  return {marker,clipStart,clipEnd,markerSecond,
    startAt:startAt+clipStart*1000,endAt:startAt+clipEnd*1000};
}
export function eventHitsWindow(event,bounds){
  if(!bounds)return true;
  const times=Array.isArray(event.occurrenceTimes)?event.occurrenceTimes.filter(Number.isFinite):null;
  if(times?.length)return times.some(t=>t>=bounds.startAt&&t<=bounds.endAt);
  return (event.lastAt??event.at)>=bounds.startAt&&event.at<=bounds.endAt;
}
export function scopedEvidence(report,markerId=null){
  const bounds=issueBounds(report,markerId);
  const entries=report.events.map((event,index)=>({event,index}))
    .filter(({event})=>event.kind!=="issue-marker"&&eventHitsWindow(event,bounds))
    .map(({event,index})=>{
      const hits=Array.isArray(event.occurrenceTimes)&&bounds?
        event.occurrenceTimes.filter(t=>Number.isFinite(t)&&t>=bounds.startAt&&t<=bounds.endAt):null;
      return {index,id:evidenceId(index),event:{
        ...event,evidenceRef:evidenceId(index),
        ...(hits?{at:Math.min(...hits),occurrences:hits.length,
          occurrenceTimes:hits,lastAt:Math.max(...hits)}:{})
      }};
    });
  return {bounds,entries,report:{
    ...report,events:entries.map(x=>x.event),
    ...(bounds?{title:bounds.marker.event.title||report.title,
      issueTitle:bounds.marker.event.title||"Untitled issue"}:{})
  }};
}
