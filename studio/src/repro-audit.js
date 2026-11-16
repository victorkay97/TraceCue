// A human QA attestation gate, not automatic proof that a defect exists.
export function evaluateReproduction(input={},catalog=[]){
  const blockers=[];
  const trimmed=key=>String(input[key]||"").trim();
  if(trimmed("preconditions").length<8)blockers.push("Document test prerequisites and account/state.");
  if(trimmed("expected").length<8)blockers.push("Describe the expected outcome.");
  if(trimmed("actual").length<8)blockers.push("Describe the observed outcome.");
  if(input.stepsReviewed!==true)blockers.push("Confirm reproduction steps were manually checked.");
  if(input.retested!==true)blockers.push("Repeat the test and confirm the outcome, or keep it as a draft.");
  if(input.privacyReviewed!==true)blockers.push("Confirm the report was reviewed for private information.");
  if(input.authorized!==true)blockers.push("Confirm permission to test and share evidence.");
  if(!catalog.some(x=>["network-failure","console-error","console-exception",
    "click","submit","issue-marker"].includes(x.kind)))
    blockers.push("Import relevant, timestamped capture evidence.");
  return {ready:blockers.length===0,blockers,
    label:blockers.length===0?"Ready for human-reviewed handoff":"Needs "+blockers.length+" verification item"+(blockers.length===1?"":"s")};
}
