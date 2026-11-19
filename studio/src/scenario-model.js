// Pure, local-only multi-actor investigation model. One independent video and
// EV namespace per session. Cross-tenant evidence is hidden unless the tester
// deliberately opens that comparison in their own browser.
const scenarioPattern=/^[a-z0-9][a-z0-9_-]{2,47}$/;
const tenantPattern=/^[a-z0-9][a-z0-9_-]{1,47}$/;
export function sessionContext(report){
  const c=report?.testContext;
  if(c==null)return null; // backwards compatibility with all 0.1–0.5 recordings
  if(typeof c!=="object"||Array.isArray(c)||
     !scenarioPattern.test(c.scenarioId)||
     !tenantPattern.test(c.tenantAlias)||
     typeof c.actorRole!=="string"||!c.actorRole.trim()||c.actorRole.length>50||
     typeof c.actorAlias!=="string"||!c.actorAlias.trim()||c.actorAlias.length>60)
    throw Error("Session contains invalid multi-actor context; review labels before comparison.");
  return {scenarioId:c.scenarioId,tenantAlias:c.tenantAlias,
    actorRole:c.actorRole,actorAlias:c.actorAlias};
}
export function scenarioKey(report){
  return sessionContext(report)?.scenarioId||null;
}
export function scenarioIds(reports){
  return [...new Set(reports.map(scenarioKey).filter(Boolean))].sort();
}
export function tenantsForScenario(reports,scenarioId){
  return [...new Set(reports.filter(r=>scenarioKey(r)===scenarioId)
    .map(r=>sessionContext(r).tenantAlias))].sort();
}
export function actorSessions(reports,{scenarioId,tenantAlias,allowOtherTenants=false}={}){
  if(!scenarioId)return [];
  return reports.filter(r=>{
    const c=sessionContext(r);
    return c?.scenarioId===scenarioId&&(allowOtherTenants||c.tenantAlias===tenantAlias);
  }).sort((a,b)=>a.startedAt-b.startedAt);
}
export const actorEvidenceRef=(report,index)=>String(report.id)+"/EV"+String(index+1).padStart(4,"0");
export function actorSignals(report,{limit=40}={}){
  const c=sessionContext(report);
  if(!c)return [];
  const interesting=new Set(["issue-marker","network-failure","console-error",
    "console-exception","console-warning","click","submit","change"]);
  return (report.events||[]).map((event,index)=>({event,index}))
   .filter(({event})=>interesting.has(event.kind))
   .slice(0,Math.max(1,Math.min(1000,limit)))
   .map(({event,index})=>({
     sessionId:report.id,tenantAlias:c.tenantAlias,actorRole:c.actorRole,
     actorAlias:c.actorAlias,ref:actorEvidenceRef(report,index),kind:event.kind,
     relativeSecond:Math.max(0,(event.at-(report.videoStartedAt||report.startedAt))/1000),
     capturedClock:event.at,
     status:Number.isInteger(event.status)?event.status:null,
     title:event.kind==="issue-marker"?String(event.title||"Issue marker").slice(0,100):null
   }));
}
export function scenarioSummary(reports,{scenarioId,tenantAlias,allowOtherTenants=false}={}){
  const included=actorSessions(reports,{scenarioId,tenantAlias,allowOtherTenants});
  const records=included.map(report=>({
    id:report.id,startedAt:report.startedAt,
    ...sessionContext(report),totalEvents:report.events.length,
    errors:report.events.filter(e=>["network-failure","console-error","console-exception"].includes(e.kind)).length,
    issueMarkers:report.events.filter(e=>e.kind==="issue-marker").length,
    signals:actorSignals(report,{limit:60})
  }));
  return {schema:"tracecue-scenario-summary-v1",scenarioId:scenarioId||null,
    tenantAlias:allowOtherTenants?null:(tenantAlias||null),
    crossTenantComparison:allowOtherTenants,sessionCount:records.length,
    clockWarning:"Different computer clocks may drift. Timestamps are independent; order across machines is approximate and not proof of causation.",
    records};
}
export function replaceOrAddReport(reports,report,max=24){
  if(!report||!Array.isArray(report.events)||!report.id)throw Error("Invalid QA session");
  sessionContext(report); // validate labels before mutating the workspace
  const next=reports.filter(r=>r.id!==report.id);
  if(next.length>=max)throw Error("Local comparison limit reached. Remove a session before importing more.");
  next.push(report);
  return next;
}

export function normalizeScenarioInput(input){
  const x=input&&typeof input==="object"?input:{};
  const limited=(value,max)=>String(value||"").trim().slice(0,max)
    .replace(/Bearer\s+\S+/gi,"[REDACTED]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[EMAIL]")
    .replace(/(?:password|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi,"[REDACTED]");
  const context={
    scenarioId:limited(x.scenarioId,48).toLowerCase(),
    tenantAlias:limited(x.tenantAlias,48).toLowerCase(),
    actorRole:limited(x.actorRole,50),
    actorAlias:limited(x.actorAlias,60)
  };
  sessionContext({testContext:context});
  return context;
}
