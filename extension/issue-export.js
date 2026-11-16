import {redactDiagnosticText,safeEvidenceUrl} from "./diagnostics.js";
import {issueWindow,clipEvents,eventCaption} from "./clip-evidence.js";

// Each issue owns its identity, title and lookback interval, even if two clips
// overlap. This export never includes the full video or arbitrary raw payloads.
export function issueEvidence(report,marker,limit=Infinity){
  return clipEvents(report,marker,{limit});
}
export function issueDraft(report,marker){
  const name=redactDiagnosticText(marker.title||"Untitled issue",100);
  const bounds=issueWindow(report,marker);
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
    "- Post-marker buffer: "+bounds.postBuffer+"s",
    "- Trimmed manually: "+(bounds.edited?"Yes":"No"),
    "- Severity (tester-rated): "+redactDiagnosticText(marker.severity||"unrated",20),
    "- Reproducibility (tester-reported): "+redactDiagnosticText(marker.reproducibility||"not-retested",25),
    "",
    "## Expected behavior",
    redactDiagnosticText(marker.expectedBehavior||"Not provided",1500),
    "",
    "## Actual behavior",
    redactDiagnosticText(marker.actualBehavior||"Not provided",1500),
    "",
    "## Tester reproduction steps",
    redactDiagnosticText(marker.reproductionSteps||"Not provided",1500),
    "",
    "## Additional tester notes",
    notes||"Not supplied. Confirm expected and actual behavior before handoff.",
    "",
    "## Time-aligned console, network, actions and environment evidence",
    "Events shown are captured metadata/log excerpts, not raw network bodies or headers.",
    ...(signals.length?signals.map(e=>
      "- "+e.ref+" · video +"+e.second+"s · clip +"+e.clipSecond+"s · "+eventCaption(e)
    ):["- No captured technical events in this clip interval."]),
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
  const bounds=issueWindow(report,marker);
  return {
    schema:"tracecue-issue-v1",
    sessionId:String(report.id||"").slice(0,100),
    markerId:String(marker.markerId||"").slice(0,100),
    title:redactDiagnosticText(marker.title||"Untitled issue",100),
    testerNotes:redactDiagnosticText(marker.testerNotes||"",1800),
    severity:redactDiagnosticText(marker.severity||"unrated",20),
    reproducibility:redactDiagnosticText(marker.reproducibility||"not-retested",25),
    expectedBehavior:redactDiagnosticText(marker.expectedBehavior||"",1500),
    actualBehavior:redactDiagnosticText(marker.actualBehavior||"",1500),
    reproductionSteps:redactDiagnosticText(marker.reproductionSteps||"",1500),
    clip:{
      startSecond:bounds.start,endSecond:bounds.end,
      requestedLookbackSeconds:bounds.lookback,postBufferSeconds:bounds.postBuffer,
      manuallyTrimmed:bounds.edited
    },
    evidence:issueEvidence(report,marker)
  };
}
