import {redactDiagnosticText,safeEvidenceUrl} from "./diagnostics.js";
import {clipBounds} from "./clipper.js";

// Each issue owns its identity, title and lookback interval, even if two clips
// overlap. This export never includes the full video or arbitrary raw payloads.
export function issueEvidence(report,marker,limit=100){
  const bounds=clipBounds(report,marker);
  const videoStart=Number.isFinite(report.videoStartedAt)?report.videoStartedAt:report.startedAt;
  const startMs=videoStart+bounds.start*1000;
  const endMs=videoStart+bounds.end*1000;
  return (report.events||[]).map((event,index)=>({event,index}))
    .filter(({event})=>event.kind!=="issue-marker" && event.at>=startMs && event.at<=endMs)
    .slice(-limit).map(({event,index})=>({
      ref:"EV"+String(index+1).padStart(4,"0"),
      second:Math.max(0,Math.round((event.at-videoStart)/100)/10),
      kind:String(event.kind||"unknown").slice(0,45),
      ...(Number.isFinite(event.status)?{status:event.status}:{}),
      ...(event.element?{element:redactDiagnosticText(event.element,80)}:{}),
      ...(event.message?{message:redactDiagnosticText(event.message,160)}:{}),
      ...(event.url?{url:safeEvidenceUrl(event.url)}:{})
    }));
}
export function issueDraft(report,marker){
  const name=redactDiagnosticText(marker.title||"Untitled issue",100);
  const bounds=clipBounds(report,marker);
  const signals=issueEvidence(report,marker);
  const notes=redactDiagnosticText(marker.testerNotes||"",1800);
  const id=String(marker.markerId||"legacy-marker").slice(0,100);
  const lines=[
    "# [QA review] "+name,
    "",
    "> Unverified testing observation. Review before sending to engineering.",
    "",
    "- Session ID: "+String(report.id||"unknown").slice(0,100),
    "- Marker ID: "+id,
    "- Clip start: +"+bounds.start.toFixed(1)+"s",
    "- Clip end: +"+bounds.end.toFixed(1)+"s",
    "- Requested lookback: "+bounds.lookback+"s",
    "",
    "## Tester notes / expected versus actual",
    notes||"Not supplied. Confirm expected and actual behavior before handoff.",
    "",
    "## Captured technical evidence in this clip window",
    ...(signals.length?signals.map(s=>{
      return "- "+s.ref+" · +"+s.second+"s · "+s.kind+
        (s.status?" · HTTP "+s.status:"")+
        (s.element?" · "+s.element:"")+
        (s.message?" · "+s.message:"")+
        (s.url?" · "+s.url:"");
    }):["- No captured technical events in this interval."]),
    "",
    "## Verification",
    "- [ ] Review all video frames and remove private information",
    "- [ ] Reproduce in an authorized test environment",
    "- [ ] Verify the expected and actual outcome",
    "- [ ] Attach only the independently reviewed clip",
    "",
    "_Exported locally by TraceCue. No issue was published automatically._"
  ];
  return lines.join("\n");
}
export function issueJson(report,marker){
  const bounds=clipBounds(report,marker);
  return {
    schema:"tracecue-issue-v1",
    sessionId:String(report.id||"").slice(0,100),
    markerId:String(marker.markerId||"").slice(0,100),
    title:redactDiagnosticText(marker.title||"Untitled issue",100),
    testerNotes:redactDiagnosticText(marker.testerNotes||"",1800),
    clip:{startSecond:bounds.start,endSecond:bounds.end,requestedLookbackSeconds:bounds.lookback},
    evidence:issueEvidence(report,marker)
  };
}
