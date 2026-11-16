import "./onboarding.css";
const KEY="tracecue.onboarding.0.5";
const STEPS=[
 {eyebrow:"WELCOME TO YOUR QA WORKSPACE",title:"A complete bug report starts here.",body:"TraceCue keeps browser evidence together, so you don't need to reconstruct every failed interaction from memory.",target:"",cta:"Start with a fictional session"},
 {eyebrow:"STEP 1 OF 3 · CAPTURE",title:"Record once. Mark each issue.",body:"Open the Chrome companion from the browser toolbar. Its sidebar records only when you press Start, and each marker creates a separate issue window.",target:"evidence",cta:"See the evidence timeline"},
 {eyebrow:"STEP 2 OF 3 · INVESTIGATE",title:"Ask about actual captured signals.",body:"Search for HTTP 500 or a console exception. Your results retain original event references; AI explanations remain hypotheses until confirmed.",target:"queryWorkspace",cta:"Find the investigation tools"},
 {eyebrow:"STEP 3 OF 3 · SHARE",title:"Verify before sharing.",body:"Review expected versus actual behavior and tester authorization. You decide when to export, copy, or submit an issue.",target:"intelligence",cta:"Finish guide"}
];
export function initStudioOnboarding({loadDemo,openSection}){
  const trigger=document.getElementById("showGuide");
  const node=document.createElement("aside");node.className="tc-guide";node.hidden=true;
  node.setAttribute("role","dialog");node.setAttribute("aria-modal","false");
  node.setAttribute("aria-labelledby","tc-guide-title");
  node.innerHTML='<div class="guide-top"><span id="guideEyebrow"></span><button id="guideClose" type="button" aria-label="Close guide">×</button></div><div class="guide-progress" aria-label="Onboarding progress"></div><h3 id="tc-guide-title"></h3><p id="guideBody"></p><div class="guide-actions"><button id="guideBack" type="button" class="guide-ghost">Back</button><button id="guideSkip" type="button" class="guide-ghost">Skip for now</button><button id="guideNext" type="button" class="guide-main"></button></div>';
  document.body.append(node);
  let stage=0;
  const $=id=>node.querySelector("#"+id);
  const save=()=>{try{localStorage.setItem(KEY,"complete");}catch{}};
  function close(){node.hidden=true;save();trigger?.focus();}
  function draw(){
    const current=STEPS[stage];
    $("guideEyebrow").textContent=current.eyebrow;
    $("tc-guide-title").textContent=current.title;
    $("guideBody").textContent=current.body;
    $("guideNext").textContent=current.cta+" →";
    $("guideBack").hidden=stage===0;
    const progress=node.querySelector(".guide-progress");progress.replaceChildren();
    STEPS.forEach((_,i)=>{
      const bar=document.createElement("span");
      if(i<=stage)bar.className="complete";
      progress.append(bar);
    });
  }
  function show(){stage=0;draw();node.hidden=false;$("guideNext").focus();}
  $("guideClose").addEventListener("click",close);
  $("guideSkip").addEventListener("click",close);
  $("guideBack").addEventListener("click",()=>{stage=Math.max(0,stage-1);draw();});
  $("guideNext").addEventListener("click",()=>{
    if(stage===0)loadDemo?.();
    if(stage>=STEPS.length-1){close();return;}
    stage++;
    draw();
    if(STEPS[stage].target)openSection?.(STEPS[stage].target);
  });
  node.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();close();}
  });
  trigger?.addEventListener("click",show);
  // The demo link opens an immediate sample: don't cover it with a guide.
  const autoDemo=new URLSearchParams(location.search).has("demo");
  let completed=false;try{completed=localStorage.getItem(KEY)==="complete";}catch{}
  if(!completed&&!autoDemo)show();
  return {show,close};
}
