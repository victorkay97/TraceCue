import "./landing.css";
import {searchQaEvidence} from "./qa-query.js";

const root=document.getElementById("landing");
const featureStates={
  capture:{
    index:"01 / CAPTURE", title:"Don't lose the moments before the bug.",
    description:"Record a full authorized test session, even when several issues appear along the way.",
    proof:"One session, multiple issues",
    html:[
      '<div class="stage-window"><div class="stage-bar"><span class="window-dots"><i></i><i></i><i></i></span><span>TraceCue Companion</span><span class="stage-window-tag">Recording</span></div>',
      '<div class="capture-stage"><div class="capture-session"><div class="capture-rec"><span></span> REC <b>02:41</b></div><strong>Checkout flow · exploratory test</strong><p>Recording authorized browser tab</p></div>',
      '<div class="capture-timeline"><span class="timeline-line"></span><span class="timeline-node n1"></span><span class="timeline-node n2"></span><span class="timeline-node n3"></span><span class="timeline-node n4"></span><div class="timeline-flags"><span>Issue marked</span><span>Network failure</span></div></div>',
      '<div class="capture-stats"><div><strong>1</strong><span>Full recording</span></div><div><strong>2</strong><span>Issue markers</span></div><div><strong>24</strong><span>Event groups</span></div></div></div></div>'
    ].join("")
  },
  mark:{
    index:"02 / MARK",title:"Name the issue while it's still fresh.",
    description:"Save the seconds around an error, then adjust the start and end during review.",
    proof:"Editable clips, original video intact",
    html:[
      '<div class="stage-window"><div class="stage-bar"><span class="window-dots"><i></i><i></i><i></i></span><span>Issue 01 · Profile save</span><span class="stage-window-tag">Clip editor</span></div>',
      '<div class="mark-stage"><div class="mark-issue"><span>ISSUE NAME</span><strong>Profile save returned HTTP 500</strong><small>Marked at 01:16.4 in full recording</small></div>',
      '<div class="mark-ruler"><span>00:46</span><span>01:00</span><span>01:16</span><span>01:22</span></div><div class="mark-timeline"><span></span><div class="mark-range"><i></i><b></b></div></div>',
      '<div class="mark-controls"><div><span>CLIP START</span><strong>00:46.4</strong></div><div><span>CLIP END</span><strong>01:21.4</strong></div><span class="mark-button">Preview interval <svg class="icon"><use href="#icon-play"/></svg></span></div></div></div>'
    ].join("")
  },
  search:{
    index:"03 / INVESTIGATE",title:"Find the signal behind the symptom.",
    description:"Search captured HTTP failures, console messages and actions by time, without inventing a root cause.",
    proof:"Original event IDs and recorded times",
    html:[
      '<div class="stage-window"><div class="stage-bar"><span class="window-dots"><i></i><i></i><i></i></span><span>Ask TraceCue</span><span class="stage-window-tag">Local search</span></div>',
      '<div class="investigate-stage"><div class="investigate-input"><svg class="icon"><use href="#icon-search"/></svg><span>Where did HTTP 500 occur?</span><b>Find</b></div>',
      '<span class="stage-subline">1 captured match in this fictional session</span><div class="investigate-result"><div><span class="result-badge">HTTP 500</span><span>EV0004 · +6.3s</span></div>',
      '<strong>POST /api/profile</strong><p>Recorded network failure. A related click occurred at +6.0s.</p><span class="result-disclaimer"><svg class="icon"><use href="#icon-shield"/></svg> Correlation is not proof of a server-side cause.</span></div></div></div>'
    ].join("")
  },
  report:{
    index:"04 / REPORT",title:"Give engineering something useful.",
    description:"Keep the issue title, selected clip, related logs and tester-verified observations together.",
    proof:"Human-reviewed evidence handoff",
    html:[
      '<div class="stage-window"><div class="stage-bar"><span class="window-dots"><i></i><i></i><i></i></span><span>Engineering handoff</span><span class="stage-window-tag">Draft ready</span></div>',
      '<div class="report-stage"><div class="report-title"><span class="report-check"><svg class="icon"><use href="#icon-check"/></svg></span><div><span>ISSUE DRAFT</span>',
      '<strong>Profile save returns HTTP 500</strong><small>Needs tester review before submission</small></div></div>',
      '<div class="report-checklist"><div><svg class="icon"><use href="#icon-check"/></svg><span>Focused video clip</span><b>Attached locally</b></div>',
      '<div><svg class="icon"><use href="#icon-check"/></svg><span>Network failure</span><b>EV0004</b></div>',
      '<div><svg class="icon"><use href="#icon-check"/></svg><span>Console error</span><b>EV0005</b></div>',
      '<div><svg class="icon"><use href="#icon-check"/></svg><span>Expected vs actual</span><b>Tester entered</b></div></div>',
      '<div class="report-footer"><span>Markdown · JSON</span><span>Review before sharing <svg class="icon"><use href="#icon-arrow"/></svg></span></div></div></div>'
    ].join("")
  }
};
const tabs=Array.from(root.querySelectorAll(".feature-tab"));
const stage=root.querySelector("#feature-stage");
const panel=root.querySelector("#feature-panel");
let stageSequence=0;
function selectFeature(name,{focus=false}={}){
  const item=featureStates[name];if(!item)return;
  for(const tab of tabs){
    const active=tab.dataset.feature===name;
    tab.classList.toggle("is-active",active);
    tab.setAttribute("aria-selected",String(active));
    tab.tabIndex=active?0:-1;
    if(active&&focus)tab.focus();
  }
  panel.setAttribute("aria-labelledby","feature-tab-"+name);
  root.querySelector("#feature-index").textContent=item.index;
  root.querySelector("#feature-title").textContent=item.title;
  root.querySelector("#feature-description").textContent=item.description;
  root.querySelector("#feature-proof").textContent=item.proof;
  root.querySelector("#feature-pagination").textContent=item.index.slice(0,2)+" / 04";
  const sequence=++stageSequence;
  stage.classList.remove("stage-entered");
  stage.innerHTML=item.html; // All four templates are authored constants, never user-provided.
  requestAnimationFrame(()=>{if(sequence===stageSequence)stage.classList.add("stage-entered");});
}
const showcase=root.querySelector("#what-it-does");
const pinned=showcase?.querySelector(".showcase-sticky");
const order=["capture","mark","search","report"];
const canScrollFeatures=()=>window.innerWidth>760&&
 !window.matchMedia("(prefers-reduced-motion: reduce)").matches&&pinned;
let activeFeature="capture";
const originalSelectFeature=selectFeature;
selectFeature=(name,options={})=>{activeFeature=name;originalSelectFeature(name,options);};
function showFeature(index,{focus=false}={}){
 const next=order[Math.max(0,Math.min(order.length-1,index))];
 if(canScrollFeatures()){
  const stickyTop=parseFloat(getComputedStyle(pinned).top)||100;
  const track=Math.max(1,showcase.offsetHeight-pinned.offsetHeight);
  const top=showcase.getBoundingClientRect().top+window.scrollY;
  // Direct jump avoids racing through the other three stages on click.
  window.scrollTo({top:Math.max(0,top-stickyTop+track*((index+.5)/order.length)),behavior:"auto"});
 }
 selectFeature(next,{focus});
}
tabs.forEach((tab,index)=>{
 tab.addEventListener("click",()=>showFeature(index));
 tab.addEventListener("keydown",event=>{
  if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
  event.preventDefault();
  const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:
    (index+(["ArrowUp","ArrowLeft"].includes(event.key)?-1:1)+tabs.length)%tabs.length;
  showFeature(next,{focus:true});
 });
});
selectFeature("capture");
let featureFrame=false;
function updateFeatureOnScroll(){
 if(!canScrollFeatures()||!showcase)return;
 const stickyTop=parseFloat(getComputedStyle(pinned).top)||100;
 const rect=showcase.getBoundingClientRect();
 if(rect.bottom<stickyTop||rect.top>window.innerHeight)return;
 const track=Math.max(1,showcase.offsetHeight-pinned.offsetHeight);
 const progress=Math.max(0,Math.min(.9999,(stickyTop-rect.top)/track));
 const index=Math.min(order.length-1,Math.floor(progress*order.length));
 if(order[index]!==activeFeature)selectFeature(order[index]);
}
window.addEventListener("scroll",()=>{
 if(featureFrame)return;
 featureFrame=true;
 requestAnimationFrame(()=>{featureFrame=false;updateFeatureOnScroll();});
},{passive:true});
window.addEventListener("resize",updateFeatureOnScroll);
updateFeatureOnScroll();

const previewDetails={
 click:{time:"00:06.0",progress:"30%",insight:"The tester clicked Save changes at 00:06.0. TraceCue keeps the UI action so the next event has context."},
 "500":{time:"00:06.3",progress:"31.5%",insight:"A profile save request returned HTTP 500 at 00:06.3, shortly after the Save changes action."},
 error:{time:"00:06.5",progress:"32.5%",insight:"A console error followed the failed request at 00:06.5. The report links it to the exact moment."}
};
root.querySelectorAll("[data-preview-event]").forEach(button=>button.addEventListener("click",()=>{
 const detail=previewDetails[button.dataset.previewEvent]||previewDetails["500"];
 root.querySelectorAll("[data-preview-event]").forEach(el=>{
  const active=el===button;
  el.classList.toggle("highlighted",active);
  el.setAttribute("aria-pressed",String(active));
 });
 root.querySelector("#hero-player-time").textContent=detail.time;
 const progress=root.querySelector("#hero-track-progress");
 if(progress)progress.style.width=detail.progress;
 const insight=root.querySelector("#hero-evidence-insight");
 if(insight)insight.textContent=detail.insight;
}));
root.querySelectorAll("[data-preview-event]").forEach(button=>
 button.setAttribute("aria-pressed",String(button.dataset.previewEvent==="500")));


const previewButtons=Array.from(root.querySelectorAll("[data-preview-event]"));
const previewPlay=root.querySelector("#hero-preview-play");
let previewTimer=null;
let previewIndex=1;
let previewManuallyPaused=false;
function setPreviewPlaying(playing){
 if(previewTimer){window.clearInterval(previewTimer);previewTimer=null;}
 if(playing){
  previewTimer=window.setInterval(()=>{
   previewIndex=(previewIndex+1)%previewButtons.length;
   previewButtons[previewIndex]?.click();
  },3700);
 }
 if(previewPlay){
  previewPlay.setAttribute("aria-pressed",String(playing));
  previewPlay.setAttribute("aria-label",(playing?"Pause":"Play")+" fictional event timeline");
  const icon=previewPlay.querySelector("use");
  if(icon)icon.setAttribute("href",playing?"#icon-pause":"#icon-play");
 }
}
previewPlay?.addEventListener("click",()=>{
 previewManuallyPaused=!!previewTimer;
 setPreviewPlaying(!previewTimer);
});
previewButtons.forEach((button,index)=>button.addEventListener("click",event=>{
 previewIndex=index;
 if(event.isTrusted&&previewTimer){
  previewManuallyPaused=true;
  setPreviewPlaying(false);
 }
}));
if("IntersectionObserver" in window){
 const observer=new IntersectionObserver(entries=>{
  const visible=entries.some(e=>e.isIntersecting);
  if(visible&&!previewManuallyPaused&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
   setPreviewPlaying(true);
  else if(!visible) setPreviewPlaying(false);
 },{threshold:.15});
 const hero=root.querySelector(".hero-product");
 if(hero)observer.observe(hero);
}

const form=root.querySelector("#sample-search-form");
const field=root.querySelector("#sample-query");
const output=root.querySelector("#sample-result-body");
const count=root.querySelector("#sample-count");
let sample=null;
function renderSearch(query){
  output.replaceChildren();
  if(!sample){
    count.textContent="Sample data unavailable";
    const p=document.createElement("p");
    p.textContent="The fictional sample didn't load. You can still explore Studio.";
    output.append(p);return;
  }
  const result=searchQaEvidence(sample,query,{limit:8});
  count.textContent=result.total+" recorded match"+(result.total===1?"":"es");
  if(!result.total){
    const p=document.createElement("p");p.className="result-empty";
    p.textContent="No captured event matched that query. That doesn't mean a failure never happened.";
    output.append(p);return;
  }
  for(const hit of result.matches){
    const row=document.createElement("div");row.className="result-row";
    const time=document.createElement("span");time.className="result-row-time";
    time.textContent="+"+hit.second.toFixed(1)+"s";
    const context=document.createElement("div");context.className="result-row-context";
    const kind=document.createElement("span");kind.className="result-row-kind";
    kind.textContent=hit.kind+(hit.status?" · HTTP "+hit.status:"");
    const detail=document.createElement("strong");detail.textContent=hit.detail||hit.kind;
    const ref=document.createElement("small");ref.textContent=hit.id+" · recorded event";
    context.append(kind,detail,ref);row.append(time,context);output.append(row);
  }
}
form.addEventListener("submit",event=>{event.preventDefault();renderSearch(field.value.trim());});
root.querySelectorAll("[data-query]").forEach(button=>button.addEventListener("click",()=>{
  field.value=button.dataset.query;renderSearch(field.value);
}));
fetch("/demo-session.json",{cache:"force-cache"}).then(async response=>{
  if(!response.ok)throw Error("Sample not available");
  const data=await response.json();
  if(data.schema!=="tracecue-session-v1"||!Array.isArray(data.events))throw Error("Invalid sample");
  sample=data;
  renderSearch(field.value);
}).catch(()=>renderSearch(field.value));

// Sections stay visible without scroll-dependent reveal gating.
