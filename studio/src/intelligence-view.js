import { recordedObservations,evidenceCoverage } from "./evidence-intelligence.js";
// Render only text nodes and explicitly wired event-reference links.
// AI output is untrusted content: never inject it as markup.
const text=(tag,value,cls="")=>{
  const el=document.createElement(tag);el.textContent=value;el.className=cls;return el;
};
function button(value,callback){
  const b=text("button",value,"evidence-pill");b.type="button";b.addEventListener("click",callback);return b;
}
export function renderEvidenceCatalog(target,catalog,openEvidence){
  target.replaceChildren();
  target.append(text("div",catalog.length+" referenced events in this AI request","catalog-heading"));
  if(!catalog.length){target.append(text("p","No usable events in this session."));return;}
  for(const e of catalog.slice(0,70)){
    target.append(button(e.id+" · "+e.kind+" · +"+e.second+"s",()=>openEvidence(e.id)));
  }
}
function section(parent,title,entries){
  const s=text("section","","insight-section");
  s.append(text("h3",title));
  for(const entry of entries)s.append(text("p",entry));
  parent.append(s);
}
export function renderInvestigation(target,analysis,openEvidence,catalog=[]){
  target.replaceChildren();
  if(!analysis)return;
  const head=text("section","","insight-section");
  head.append(text("small","AI-PROPOSED · NOT A VERIFIED DEFECT","eyebrow"));
  head.append(text("h3",analysis.title));
  head.append(text("p",analysis.summary));
  head.append(text("small","AI self-rated confidence: "+analysis.confidence+" (not an independently validated accuracy score)","confidence-label"));
  target.append(head);
  // Recorded metadata and model interpretations are different sources of truth.
  const captured=recordedObservations(catalog);
  const verified=text("section","","insight-section");
  verified.append(text("h3","Recorded signals · TraceCue evidence"));
  verified.append(text("small","Captured technical events only; not proof of a product defect."));
  if(!captured.length)verified.append(text("p","No diagnostic events in the selected AI evidence."));
  for(const item of captured){
    const row=text("div","","structured-step");
    row.append(text("p",item.description));
    row.append(button(item.id,()=>openEvidence(item.id)));
    verified.append(row);
  }
  target.append(verified);
  section(target,"AI-observed behavior",analysis.observed?
    [analysis.observed]:["Not provided by the model. Refer to the recorded signals above."]);
  const coverage=evidenceCoverage(analysis);
  section(target,"Evidence completeness",[
    coverage.status==="incomplete"?"Incomplete; further review required.":"Review still required before claiming a defect.",
    ...coverage.issues
  ]);
  const steps=text("section","","insight-section");
  steps.append(text("h3","Tentative reproduction steps"));
  if(!analysis.reproductionSteps.length)steps.append(text("p","No proposed steps."));
  analysis.reproductionSteps.forEach((entry,index)=>{
    const item=text("div","","structured-step");
    item.append(text("p",String(index+1)+". "+entry.step));
    for(const id of entry.evidenceIds)item.append(button(id,()=>openEvidence(id)));
    if(!entry.evidenceIds.length)item.append(text("small","No verified event citation"));
    steps.append(item);
  });
  target.append(steps);
  section(target,"Missing information",analysis.missingInformation.length?analysis.missingInformation:["Not listed"]);
  section(target,"Unverified hypotheses",analysis.hypotheses.length?analysis.hypotheses:["Not listed"]);
  section(target,"Regression checks — not executed",analysis.regressionChecks.length?analysis.regressionChecks:["Not listed"]);
}
