/* Progressive Studio V2 shell: all original controls keep their original event
   handlers and IDs. The original app.html remains the production-safe fallback. */
import "./main.js";
import "./studio-v2.css";

const app=document.getElementById("app");
app.classList.add("tc-v2");
const shell=app.querySelector(".shell");
const side=shell.querySelector(".side");
const content=shell.querySelector(".content");
const oldTopbar=content.querySelector(".topbar");
const main=content.querySelector("main");
const cache=document.createElement("div");
cache.className="tc-v2-legacy-cache";
cache.hidden=true;
app.append(cache);
for(const child of [...side.children])cache.append(child);
for(const child of [...main.children])cache.append(child);
cache.append(oldTopbar);

function icon(type){
 const shapes={
  overview:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  sessions:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 8 5 4-5 4z"/>',
  issues:'<path d="M5 21V4m0 1c5-3 9 3 14 0v11c-5 3-9-3-14 0"/>',
  investigate:'<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 5 5M11 8v6m-3-3h6"/>',
  reports:'<path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v6h6M9 13h7m-7 4h7"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M10 2h4l.7 2.5 2 .8L19 4l3 3-1.3 2.3.8 2L24 12v1l-2.5.7-.8 2L22 18l-3 3-2.3-1.3-2 .8L14 23h-4l-.7-2.5-2-.8L5 21l-3-3 1.3-2.3-.8-2L0 13v-1l2.5-.7.8-2L2 7l3-3 2.3 1.3 2-.8z" transform="translate(1 0) scale(.92)"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  shield:'<path d="m12 2 8 4v6c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  close:'<path d="M5 5 19 19M19 5 5 19"/>',
  moon:'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 2-2.5 2.1-2.5 4m0 3h.01"/>'
 };
 return '<svg aria-hidden="true" class="v2-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+(shapes[type]||shapes.overview)+'</svg>';
}
const destinations=[
 ["overview","Overview","Recent work and next actions"],
 ["sessions","Sessions","Recording, events and scenario comparisons"],
 ["issues","Issues","Search and isolate captured issues"],
 ["investigate","Investigate","Evidence-led analysis and AI controls"],
 ["reports","Reports","Tester review and engineering handoff"],
 ["settings","Settings","Workspace preferences and privacy"]
];
const brand=document.createElement("header");
brand.className="v2-outside-brand";
brand.innerHTML='<a href="/" aria-label="TraceCue home"><span class="v2-mark" aria-hidden="true">T.</span><span>TraceCue</span><span class="v2-brand-suffix">Studio</span></a><span class="v2-preview-note">Workspace preview · V2</span>';
app.insertBefore(brand,shell);
side.innerHTML='<div class="v2-side-top"><div class="v2-side-title">Workspace <span class="v2-side-dot"></span></div><button class="v2-menu-close" type="button" aria-label="Close navigation">'+icon("close")+'</button></div><div class="v2-side-divider"></div><nav aria-label="Studio sections" class="v2-navigation"></nav><div class="v2-side-foot"><div class="v2-local-note">'+icon("shield")+'<span><strong>Local-first workspace</strong><small>No automatic cloud uploads</small></span></div><div class="v2-theme-row"><button type="button" class="v2-theme-light" aria-label="Use light theme">'+icon("sun")+' Light</button><button type="button" class="v2-theme-dark" aria-label="Use dark theme">'+icon("moon")+' Dark</button></div><a class="v2-site-link" href="/">Back to website '+icon("arrow")+'</a></div>';
const nav=side.querySelector(".v2-navigation");
for(const [key,label] of destinations){
 const button=document.createElement("button");
 button.type="button";button.className="v2-nav-button";button.dataset.view=key;
 button.innerHTML=icon(key)+'<span>'+label+'</span>';
 nav.append(button);
}
const overlay=document.createElement("div");
overlay.className="v2-menu-backdrop";overlay.hidden=true;
shell.append(overlay);
content.innerHTML='<div class="v2-mobile-bar"><button class="v2-menu-open" type="button" aria-label="Open workspace navigation" aria-controls="v2-navigation" aria-expanded="false">'+icon("menu")+'</button><span>TraceCue Studio</span><span class="v2-mobile-local">Local</span></div><header class="v2-workspace-top"><div class="v2-crumb">TraceCue <span>/</span> <strong id="v2-crumb-title">Overview</strong></div><div class="v2-top-actions"><span class="v2-local-indicator">'+icon("shield")+' Local by default</span><button type="button" id="v2-help" class="v2-quiet-btn">'+icon("help")+' Guide</button><button type="button" id="v2-top-import" class="v2-quiet-btn">'+icon("upload")+' Import JSON</button></div></header>';
main.className="v2-viewport";
content.append(main);

function view(key,title,description){
 const node=document.createElement("section");
 node.className="v2-view";node.id="v2-view-"+key;node.dataset.screen=key;node.hidden=true;
 node.innerHTML='<div class="v2-view-intro"><div><p class="v2-eyebrow">TRACE CUE / '+key.toUpperCase()+'</p><h1>'+title+'</h1><p>'+description+'</p></div></div>';
 main.append(node);return node;
}
const views={
 overview:view("overview","Good testing leaves good evidence.","Everything you need to review an issue, without the clutter."),
 sessions:view("sessions","Your sessions","Review the recording and the events connected to each moment."),
 issues:view("issues","Find an issue","Search captured events, filter by issue, and jump to the moment."),
 investigate:view("investigate","Investigate with context","Ground findings in the evidence, then choose whether AI would help."),
 reports:view("reports","Prepare a handoff","Review what you observed before sharing anything with engineering."),
 settings:view("settings","Workspace settings","Understand local storage, AI permissions, and this preview.")
};

const overviewContent=document.createElement("div");
overviewContent.className="v2-overview-content";
overviewContent.innerHTML='<div class="v2-start-card"><div class="v2-start-copy"><span class="v2-kicker">START WITH EVIDENCE</span><h2>From a test session to a clear report.</h2><p>Open the fictional example to explore a complete, safe QA workflow. Or import a session captured with TraceCue Companion.</p><div class="v2-start-actions"><button id="v2-try-demo" class="v2-primary-btn" type="button">Explore sample session '+icon("arrow")+'</button><button id="v2-import" class="v2-quiet-btn" type="button">'+icon("upload")+' Import session</button></div></div><div class="v2-start-graphic" aria-hidden="true"><div class="v2-visual-header"><span></span><span></span><span></span></div><div class="v2-visual-row"><span class="v2-visual-dot"></span><div><b>01:06 · Save changes</b><small>Interaction captured</small></div></div><div class="v2-visual-row"><span class="v2-visual-dot is-error"></span><div><b>01:06 · HTTP 500</b><small>Related network failure</small></div></div><div class="v2-visual-line"></div></div></div><div class="v2-section-label">PICK UP WHERE YOU LEFT OFF</div><div class="v2-recent"><div class="v2-recent-icon">'+icon("sessions")+'</div><div class="v2-recent-info"><strong id="v2-session-title">No session loaded</strong><span id="v2-session-sub">Open the sample or import a session to begin.</span></div><button class="v2-link-btn" id="v2-open-session" type="button">Open '+icon("chevron")+'</button></div><div class="v2-section-label">YOUR WORKFLOW</div><div class="v2-quick-grid"><button type="button" data-open-view="sessions"><span>'+icon("sessions")+'</span><strong>Review a session</strong><small>Playback and synchronized timeline</small>'+icon("arrow")+'</button><button type="button" data-open-view="issues"><span>'+icon("issues")+'</span><strong>Find an issue</strong><small>Search and scope the evidence</small>'+icon("arrow")+'</button><button type="button" data-open-view="reports"><span>'+icon("reports")+'</span><strong>Prepare a report</strong><small>Tester checks and GitHub draft</small>'+icon("arrow")+'</button></div>';
views.overview.append(overviewContent);

const sessionTabs=document.createElement("div");
sessionTabs.className="v2-tabs";sessionTabs.setAttribute("role","tablist");sessionTabs.setAttribute("aria-label","Session views");
sessionTabs.innerHTML='<button type="button" role="tab" id="v2-tab-recording" aria-controls="v2-session-recording" aria-selected="true">Recording & evidence</button><button type="button" role="tab" id="v2-tab-scenarios" aria-controls="v2-session-scenarios" aria-selected="false">Compare actors</button>';
views.sessions.append(sessionTabs);
const recordPanel=document.createElement("div");
recordPanel.id="v2-session-recording";recordPanel.className="v2-session-panel";recordPanel.setAttribute("role","tabpanel");recordPanel.setAttribute("aria-labelledby","v2-tab-recording");
const scenarioPanel=document.createElement("div");
scenarioPanel.id="v2-session-scenarios";scenarioPanel.className="v2-session-panel";scenarioPanel.setAttribute("role","tabpanel");scenarioPanel.setAttribute("aria-labelledby","v2-tab-scenarios");scenarioPanel.hidden=true;
views.sessions.append(recordPanel,scenarioPanel);
recordPanel.append(document.getElementById("evidence"));
scenarioPanel.append(document.getElementById("scenarios"));
function setSessionTab(name){
 const showScenario=name==="scenarios";
 scenarioPanel.hidden=!showScenario;recordPanel.hidden=showScenario;
 for(const tab of sessionTabs.querySelectorAll('[role="tab"]')){
  const active=tab.id==="v2-tab-"+name;
  tab.setAttribute("aria-selected",String(active));tab.tabIndex=active?0:-1;
 }
}
sessionTabs.addEventListener("click",e=>{const t=e.target.closest('[role="tab"]');if(t)setSessionTab(t.id.endsWith("scenarios")?"scenarios":"recording");});
sessionTabs.addEventListener("keydown",e=>{
 if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();
 const name=e.key==="ArrowLeft"||e.key==="Home"?"recording":"scenarios";
 setSessionTab(name);document.getElementById("v2-tab-"+name).focus();
});
setSessionTab("recording");
views.issues.append(document.getElementById("queryWorkspace"));
const aiPanel=document.getElementById("intelligence");
views.investigate.append(aiPanel);
const handoff=document.getElementById("githubHandoff");
const reportActions=document.createElement("div");
reportActions.className="v2-report-actions";
const exportButton=document.getElementById("export");
const playwrightButton=document.getElementById("playwright");
reportActions.append(exportButton,playwrightButton);
views.reports.append(reportActions,handoff);
const prompt=document.getElementById("prompt");
const promptLabel=aiPanel.querySelector('label[for="prompt"]');
const promptConsent=document.getElementById("consent")?.closest(".consent");
const advanced=document.createElement("details");advanced.className="v2-advanced";
advanced.innerHTML='<summary>Review the exact AI input and privacy choices</summary>';
if(promptLabel)advanced.append(promptLabel);
if(prompt)advanced.append(prompt);
if(promptConsent)advanced.append(promptConsent);
const aiAction=aiPanel.querySelector(".actions");
if(aiAction)aiAction.before(advanced);
const settingsContent=document.createElement("div");
settingsContent.className="v2-settings-grid";
settingsContent.innerHTML='<article class="v2-settings-card"><div class="v2-setting-icon">'+icon("shield")+'</div><h2>Evidence stays local first.</h2><p>Imported session JSON and attached recordings stay in the current browser unless you explicitly authorize another action. Review any output before sharing.</p><a href="/privacy.html">Read privacy disclosure '+icon("arrow")+'</a></article><article class="v2-settings-card"><div class="v2-setting-icon">'+icon("investigate")+'</div><h2>AI only when you ask.</h2><p>On-device analysis depends on browser model availability. Cloud analysis requires a separate review and permission step, and is unavailable without Firebase configuration.</p><button type="button" data-open-view="investigate">Open analysis controls '+icon("arrow")+'</button></article><article class="v2-settings-card"><div class="v2-setting-icon">'+icon("help")+'</div><h2>Need the original interface?</h2><p>Studio V2 is an interface preview. The original dashboard and all its existing behaviors remain available while this redesign is evaluated.</p><a href="/app.html?demo=1">Open original Studio '+icon("arrow")+'</a></article>';
views.settings.append(settingsContent);

let active="overview";
function setView(key){
 if(!views[key])return;
 active=key;
 for(const [name,node] of Object.entries(views))node.hidden=name!==key;
 for(const button of nav.querySelectorAll(".v2-nav-button")){
  const selected=button.dataset.view===key;
  button.classList.toggle("selected",selected);button.setAttribute("aria-current",selected?"page":"false");
 }
 document.getElementById("v2-crumb-title").textContent=destinations.find(d=>d[0]===key)?.[1]||key;
 main.scrollTop=0;
 closeMenu();
}
nav.addEventListener("click",e=>{const button=e.target.closest("[data-view]");if(button)setView(button.dataset.view);});
app.addEventListener("click",e=>{
 const button=e.target.closest("[data-open-view]");if(button)setView(button.dataset.openView);
});
document.getElementById("v2-open-session").addEventListener("click",()=>{setSessionTab("recording");setView("sessions");});
document.getElementById("v2-try-demo").addEventListener("click",()=>{document.getElementById("loadDemo").click();setSessionTab("recording");setView("sessions");});
function openImport(){document.getElementById("file").click();}
document.getElementById("v2-import").addEventListener("click",openImport);
document.getElementById("v2-top-import").addEventListener("click",openImport);
document.getElementById("v2-help").addEventListener("click",()=>document.getElementById("showGuideTop")?.click());
document.getElementById("evidenceCatalog")?.addEventListener("click",()=>{setSessionTab("recording");setView("sessions");},true);

function updateSessionSummary(){
 const badge=document.getElementById("sessionBadge").textContent;
 const hasSession=/(imported|handoff)/i.test(badge);
 const meta=document.getElementById("sessionMeta").textContent;
 document.getElementById("v2-session-title").textContent=hasSession?meta.split(" · ")[0]||"Current session":"No session loaded";
 document.getElementById("v2-session-sub").textContent=hasSession?("Evidence available · "+document.getElementById("events").textContent+" events · "+document.getElementById("errors").textContent+" failures"):"Open the sample or import a session to begin.";
}
const summaryWatch=new MutationObserver(updateSessionSummary);
for(const id of ["sessionBadge","sessionMeta","events","errors"])
 summaryWatch.observe(document.getElementById(id),{subtree:true,childList:true,characterData:true});
updateSessionSummary();

const menuOpen=content.querySelector(".v2-menu-open");
const menuClose=side.querySelector(".v2-menu-close");
let previousFocus=null;
function openMenu(){
 previousFocus=document.activeElement;
 side.classList.add("v2-side-open");overlay.hidden=false;
 menuOpen.setAttribute("aria-expanded","true");menuClose.focus();
}
function closeMenu(){
 side.classList.remove("v2-side-open");overlay.hidden=true;
 menuOpen.setAttribute("aria-expanded","false");
 if(previousFocus&&typeof previousFocus.focus==="function"){previousFocus.focus();previousFocus=null;}
}
menuOpen.addEventListener("click",openMenu);
menuClose.addEventListener("click",closeMenu);
overlay.addEventListener("click",closeMenu);
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&side.classList.contains("v2-side-open")){closeMenu();return;}
 if(e.key!=="Tab"||!side.classList.contains("v2-side-open"))return;
 const elements=[...side.querySelectorAll('button:not([disabled]),a[href]')].filter(el=>getComputedStyle(el).display!=="none");
 const first=elements[0],last=elements[elements.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
window.addEventListener("resize",()=>{if(innerWidth>800)closeMenu();});
const themeLight=side.querySelector(".v2-theme-light");
const themeDark=side.querySelector(".v2-theme-dark");
function applyTheme(theme){
 const value=theme==="dark"?"dark":"light";
 app.dataset.theme=value;
 themeLight.setAttribute("aria-pressed",String(value==="light"));
 themeDark.setAttribute("aria-pressed",String(value==="dark"));
 try{localStorage.setItem("tracecue-studio-v2-theme",value);}catch{}
}
themeLight.addEventListener("click",()=>applyTheme("light"));
themeDark.addEventListener("click",()=>applyTheme("dark"));
let savedTheme="light";
try{savedTheme=localStorage.getItem("tracecue-studio-v2-theme")||"light";}catch{}
applyTheme(savedTheme);
setView(new URLSearchParams(location.search).get("screen")||"overview");
