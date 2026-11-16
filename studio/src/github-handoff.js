import {sanitizeForAI,recordedObservations,evidenceCoverage} from "./evidence-intelligence.js";

function clean(input,limit=350) {
  return sanitizeForAI(String(input ?? ""),limit).replace(/[\u0000-\u001f\u007f]/g," ").trim();
}
const item = value => "- "+clean(value,360);
export function githubIssueUrl(repository) {
  const value=String(repository??"").trim();
  const pattern=/^([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/([A-Za-z0-9_.-]{1,100})$/;
  const found=value.match(pattern);
  if(!found || found[2]==="." || found[2]===".." || found[2].startsWith(".")) return null;
  return "https://github.com/"+found[1]+"/"+found[2]+"/issues/new";
}
/**
 * A privacy-minimized draft; no recording bytes, raw diagnostics, URL, payloads,
 * cookies or session storage. It is never sent to GitHub by this function.
 */
export function buildGitHubIssueDraft(report,model,catalog=[],inferenceSource="unknown") {
  if(!report || !model)throw new Error("An imported session and structured investigation are required.");
  const source=["on_device","in_cloud"].includes(inferenceSource)?inferenceSource:"unknown";
  const title=clean(model.title||"QA observation",100)||"QA observation";
  const recorded=recordedObservations(catalog);
  const coverage=evidenceCoverage(model);
  const steps=(model.reproductionSteps||[]).slice(0,12).map((step,i)=>
    (i+1)+". "+clean(step.step,250)+" "+
    (step.evidenceIds?.length?"("+step.evidenceIds.filter(x=>/^EV\d{4,}$/.test(x)).join(", ")+")":
     "(uncited AI suggestion — verify manually)"));
  const lines=[
    "> Draft created by TraceCue. Review all content before sharing. No bug is independently verified.",
    "",
    "## Captured technical signals",
    ...recorded.map(x=>"- "+clean(x.description)+" ("+x.id+")"),
    ...(recorded.length?[]:["- None in the selected evidence catalogue"]),
    "",
    "## AI-proposed summary (not verified)",
    clean(model.summary,900)||"Not supplied.",
    "",
    "## Model observations (unverified)",
    clean(model.observed,900)||"Not supplied. See recorded signals above.",
    "",
    "## Tentative reproduction steps",
    ...(steps.length?steps:["No grounded reproduction steps provided."]),
    "",
    "## Missing information",
    ...(model.missingInformation?.length ? model.missingInformation.slice(0,12).map(item) :
      ["- Not listed by AI; assess prerequisites and expected behavior manually."]),
    "",
    "## Hypotheses — not verified",
    ...(model.hypotheses?.length?model.hypotheses.slice(0,12).map(item):["- None suggested."]),
    "",
    "## Suggested regression checks — NOT RUN",
    ...(model.regressionChecks?.length?model.regressionChecks.slice(0,12).map(item):["- None suggested."]),
    "",
    "## Evidence review status",
    "- "+(coverage.status==="incomplete"?"Incomplete — needs investigation":"Human review required"),
    ...coverage.issues.map(item),
    "- AI self-rated confidence: "+clean(model.confidence,20)+" (not an independent reliability metric)",
    "- Inference source: "+source,
    "- Captured on: "+new Date(report.startedAt).toISOString(),
    "- Note: event identifiers refer to the local TraceCue recording. The video is not attached.",
    "",
    "## Before submitting",
    "- [ ] Remove private or confidential information",
    "- [ ] Check expected vs actual behavior and confirm the issue is reproducible",
    "- [ ] Confirm target repository access and obtain approval to share evidence",
    "- [ ] Attach only intentionally reviewed and approved evidence",
    ""
  ];
  return {title:"[QA review] "+title,body:lines.join("\n")};
}
