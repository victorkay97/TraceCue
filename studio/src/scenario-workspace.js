import {
  sessionContext,scenarioIds,tenantsForScenario,scenarioSummary,
  replaceOrAddReport,normalizeScenarioInput
} from "./scenario-model.js";

// Import several independent recordings. Never combine their raw videos,
// invent synchronized clocks, auto-publish, or send tenant evidence to AI.
export function mountScenarioWorkspace(root,{validateReport,onInspect,saveText,getCurrentReport}){
  root.innerHTML=[
    '<div class="panel-head"><div><span class="eyebrow">MULTI-ACTOR QA · LOCAL PREVIEW</span><h2>Scenario workspace</h2></div><span class="badge">No cloud sync</span></div>',
    '<p class="muted small">Compare recordings made by different roles and computers. They stay independent: separate session IDs, evidence references and videos. Import only sessions you are authorized to review.</p>',
    '<div class="scenario-actions"><label class="scenario-upload">↑ Import actor session JSONs<input id="scenarioFiles" type="file" accept=".json,application/json" multiple hidden></label>',
    '<button id="scenarioDemo" type="button" class="ghost">Try fictional multi-actor example</button><button id="scenarioClear" type="button" class="ghost">Clear comparison</button></div>',
    '<p class="scenario-status" id="scenarioStatus" role="status">Import a session or load the fictional multi-actor example.</p>',
    '<details class="scenario-assign"><summary>Assign or correct scenario labels on the current recording</summary>',
    '<p class="muted small">Works with older recordings too. Labels are local QA metadata, not actual app credentials, security roles or verified permissions.</p>',
    '<div class="scenario-assignment-grid"><label>Shared scenario ID<input id="scenarioId" placeholder="enrollment-run-01" maxlength="48" spellcheck="false"></label>',
    '<label>Tenant alias<input id="scenarioTenant" placeholder="school-a" maxlength="48" spellcheck="false"></label>',
    '<label>Actor role<input id="scenarioRole" placeholder="Administrator" maxlength="50"></label>',
    '<label>Actor alias<input id="scenarioActor" placeholder="admin-1" maxlength="60"></label></div>',
    '<button id="scenarioAssign" type="button" class="ghost">Apply labels to current session locally</button></details>',
    '<div class="scenario-filters"><label>Test scenario<select id="scenarioPicker" aria-label="Select test scenario"></select></label>',
    '<label>Tenant boundary<select id="tenantPicker" aria-label="Select tenant"></select></label></div>',
    '<label class="scenario-cross"><input type="checkbox" id="crossTenant"><span>Explicitly include imported evidence from other tenants in this local comparison. I am authorized to compare them.</span></label>',
    '<p class="scenario-clock-note">Different PCs may have inaccurate or drifting clocks. Times shown below are relative to each participant recording, not a proven global order. Correlated events do not establish root cause.</p>',
    '<div class="scenario-overview" id="scenarioActors"></div>',
    '<div class="scenario-events-head"><strong>Captured signals per actor</strong><button id="scenarioExport" type="button" class="ghost">Export reviewed summary (.json)</button></div>',
    '<div class="scenario-events" id="scenarioEvents"></div>',
    '<p class="muted small">Exports contain scenario labels, event kinds, statuses and timestamps only—no full videos, request bodies, authentication data or raw console messages. No cross-tenant sharing happens automatically.</p>'
  ].join("");
  const $=id=>root.querySelector("#"+id);
  let reports=[],selectedScenario="",selectedTenant="",crossTenant=false;
  const el=(tag,className,content)=>{
    const node=document.createElement(tag);node.className=className||"";
    if(content!==undefined)node.textContent=String(content);
    return node;
  };
  const option=(value,label)=>{
    const node=el("option","",label);node.value=value;return node;
  };
  const empty=(target,message)=>{
    target.replaceChildren(el("p","muted small",message));
  };
  function currentLabels(){
    const report=getCurrentReport();
    if(!report){
      for(const id of ["scenarioId","scenarioTenant","scenarioRole","scenarioActor"])$(id).value="";
      return;
    }
    const c=sessionContext(report);
    $("scenarioId").value=c?.scenarioId||"";
    $("scenarioTenant").value=c?.tenantAlias||"";
    $("scenarioRole").value=c?.actorRole||"";
    $("scenarioActor").value=c?.actorAlias||"";
  }
  function render({preserveStatus=false}={}){
    const ids=scenarioIds(reports);
    if(!ids.includes(selectedScenario)){
      selectedScenario=ids[0]||"";crossTenant=false;
    }
    const tenants=tenantsForScenario(reports,selectedScenario);
    if(!tenants.includes(selectedTenant)){
      selectedTenant=tenants[0]||"";crossTenant=false;
    }
    $("scenarioPicker").replaceChildren(...(ids.length?
      ids.map(id=>option(id,id)):[option("","No scenarios available")]));
    $("scenarioPicker").value=selectedScenario;
    $("tenantPicker").replaceChildren(...(tenants.length?
      tenants.map(id=>option(id,id)):[option("","No tenant selected")]));
    $("tenantPicker").value=selectedTenant;
    $("scenarioPicker").disabled=ids.length<2;
    $("tenantPicker").disabled=tenants.length<2;
    $("crossTenant").checked=crossTenant;
    $("crossTenant").disabled=tenants.length<2;
    const summary=scenarioSummary(reports,{
      scenarioId:selectedScenario,tenantAlias:selectedTenant,allowOtherTenants:crossTenant
    });
    $("scenarioExport").disabled=!summary.sessionCount;
    const actors=$("scenarioActors"),events=$("scenarioEvents");
    actors.replaceChildren();events.replaceChildren();
    if(!summary.sessionCount){
      empty(actors,"No labeled sessions in the selected tenant. Import reports from participating roles, or assign the current recording a scenario and tenant alias.");
      empty(events,"No captured scenario events available.");
    }else{
      for(const record of summary.records){
        const card=el("article","scenario-actor-card");
        const heading=el("div","scenario-actor-head");
        const icon=el("span","scenario-actor-icon",record.actorRole?.slice(0,1).toUpperCase()||"A");
        const labels=el("div","scenario-actor-labels");
        labels.append(el("strong","",record.actorRole),el("small","",record.actorAlias+" · "+record.tenantAlias));
        heading.append(icon,labels);card.append(heading);
        const stats=el("p","scenario-actor-stats",
          record.totalEvents+" captured event groups · "+record.errors+" recorded failures · "+
          record.issueMarkers+" issue markers");
        const open=el("button","ghost","Open actor's evidence ↗");
        open.type="button";
        open.addEventListener("click",()=>{
          const report=reports.find(r=>r.id===record.id);
          if(report){
            onInspect(report);
            $("scenarioStatus").textContent="Opened "+record.actorAlias+
              ". Attach that actor's original WebM when available; no other actor video was merged.";
          }
        });
        card.append(stats,open);actors.append(card);
        const section=el("section","scenario-signal-group");
        section.append(el("h3","",record.actorRole+" · "+record.actorAlias));
        section.append(el("p","muted small",
          record.tenantAlias+" · "+new Date(record.startedAt).toLocaleString()+
          " (computer clock, not synchronized)"));
        const list=el("div","scenario-signal-list");
        if(!record.signals.length){
          list.append(el("p","muted small","No noteworthy captured events in this participant session."));
        }
        for(const signal of record.signals){
          const line=el("div","scenario-signal-row");
          line.append(el("span","scenario-time","+"+signal.relativeSecond.toFixed(1)+"s"));
          const badge=el("span","scenario-signal-kind"+(
            ["network-failure","console-error","console-exception"].includes(signal.kind)?" is-failure":""),
            signal.kind+(signal.status?" · HTTP "+signal.status:""));
          line.append(badge,el("code","scenario-ref",signal.ref));
          if(signal.title)line.append(el("span","scenario-marker-title",signal.title));
          list.append(line);
        }
        section.append(list);events.append(section);
      }
    }
    if(!preserveStatus)$("scenarioStatus").textContent=
      reports.length+" session"+(reports.length===1?"":"s")+
      " in this browser's temporary comparison · "+summary.sessionCount+
      " shown for "+(crossTenant?"all explicitly included tenants":selectedTenant||"no tenant")+".";
  }
  function addReport(report){
    reports=replaceOrAddReport(reports,report);
    const c=sessionContext(report);
    if(c && (!selectedScenario||!scenarioIds(reports).includes(selectedScenario))){
      selectedScenario=c.scenarioId;selectedTenant=c.tenantAlias;crossTenant=false;
    }
    render();
    currentLabels();
  }
  function addReports(items){
    const backup=reports;
    let count=0;
    try{
      for(const report of items){
        reports=replaceOrAddReport(reports,report);
        count++;
      }
      const last=items.at(-1),ctx=last?sessionContext(last):null;
      if(ctx && !selectedScenario){
        selectedScenario=ctx.scenarioId;selectedTenant=ctx.tenantAlias;
      }
      crossTenant=false;render();
      $("scenarioStatus").textContent=count+" local actor session"+(count===1?"":"s")+
        " imported. No recording or log data was uploaded.";
    }catch(error){
      reports=backup;render();
      $("scenarioStatus").textContent="Import rejected without partial changes: "+error.message;
      throw error;
    }
  }
  $("scenarioFiles").addEventListener("change",async event=>{
    const files=Array.from(event.target.files||[]);
    try{
      if(files.length>24)throw Error("Import up to 24 session files at a time.");
      const items=[];
      for(const file of files){
        if(file.size>5_000_000)throw Error(file.name+" exceeds 5 MB.");
        items.push(validateReport(JSON.parse(await file.text())));
      }
      if(items.length)addReports(items);
    }catch(error){
      $("scenarioStatus").textContent="Could not import: "+error.message;
    }finally{event.target.value="";}
  });
  $("scenarioDemo").addEventListener("click",async()=>{
    try{
      const reply=await fetch("/demo-multi-actor.json",{cache:"no-store"});
      if(!reply.ok)throw Error("Fictional multi-actor fixture is unavailable");
      const body=await reply.json();
      if(!Array.isArray(body.sessions))throw Error("Invalid scenario demonstration");
      addReports(body.sessions.map(validateReport));
      $("scenarioStatus").textContent="Loaded fictional, privacy-safe multi-actor evidence. No real accounts were used.";
    }catch(error){$("scenarioStatus").textContent=error.message;}
  });
  $("scenarioClear").addEventListener("click",()=>{
    reports=[];selectedScenario="";selectedTenant="";crossTenant=false;render();
    $("scenarioStatus").textContent="Local comparison cleared. Recordings imported in the main Studio remain unchanged.";
  });
  $("scenarioAssign").addEventListener("click",()=>{
    const current=getCurrentReport();
    if(!current){
      $("scenarioStatus").textContent="Import or open a recording before assigning role/tenant labels.";return;
    }
    try{
      const ctx=normalizeScenarioInput({
        scenarioId:$("scenarioId").value,tenantAlias:$("scenarioTenant").value,
        actorRole:$("scenarioRole").value,actorAlias:$("scenarioActor").value
      });
      current.testContext=ctx; // explicit local annotation; no cloud writes
      selectedScenario=ctx.scenarioId;selectedTenant=ctx.tenantAlias;crossTenant=false;
      addReport(current);
      $("scenarioStatus").textContent="Current session assigned to "+ctx.scenarioId+" / "+ctx.tenantAlias+
        " for local comparison. These labels remain local to this Studio browser until you explicitly export a scenario summary.";
    }catch(error){$("scenarioStatus").textContent="Labels not saved: "+error.message;}
  });
  $("scenarioPicker").addEventListener("change",()=>{
    selectedScenario=$("scenarioPicker").value;selectedTenant="";crossTenant=false;render();
  });
  $("tenantPicker").addEventListener("change",()=>{
    selectedTenant=$("tenantPicker").value;crossTenant=false;render();
  });
  $("crossTenant").addEventListener("change",()=>{
    if($("crossTenant").checked&&!window.confirm(
      "Include independently imported records from other tenants in this local comparison? "+
      "Proceed only if you are authorized to inspect all of them. No cloud sharing occurs."
    )){
      $("crossTenant").checked=false;return;
    }
    crossTenant=$("crossTenant").checked;render();
  });
  $("scenarioExport").addEventListener("click",()=>{
    const output=scenarioSummary(reports,{
      scenarioId:selectedScenario,tenantAlias:selectedTenant,allowOtherTenants:crossTenant
    });
    saveText("tracecue-scenario-"+(selectedScenario||"local")+".json",
      JSON.stringify(output,null,2),"application/json");
    $("scenarioStatus").textContent="Local summary downloaded. This is not a merged video or verified global timeline.";
  });
  render();
  return {addReport,addReports,list:()=>reports.slice(),refreshCurrent:currentLabels};
}
