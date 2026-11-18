import test from "node:test";
import assert from "node:assert/strict";
import {normalizeTestContext} from "../extension/test-context.js";
import {sessionContext,scenarioIds,tenantsForScenario,actorSessions,actorSignals,scenarioSummary,replaceOrAddReport} from "../studio/src/scenario-model.js";
function report(id,tenant,role,start){
 return {schema:"tracecue-session-v1",id,title:"Fictional QA session",startedAt:start,
  stoppedAt:start+20000,videoStartedAt:start,testContext:normalizeTestContext({
    scenarioId:"enrollment-01",tenantAlias:tenant,actorRole:role,actorAlias:role.toLowerCase()+"-1"
  }),events:[
   {kind:"click",at:start+1500,element:"button"},
   {kind:"network-failure",at:start+2400,status:500},
   {kind:"issue-marker",at:start+3000,title:"Enrollment failed"}
 ]};
}
const admin=report("tc-1000000000001","school-a","Administrator",100000);
const student=report("tc-1000000000002","school-a","Student",110000);
const outsider=report("tc-1000000000003","school-b","Student",120000);
test("extension scenario labels are accepted by Studio model; legacy is standalone",()=>{
 assert.equal(sessionContext(admin).actorRole,"Administrator");
 assert.equal(sessionContext({id:"old",events:[]}),null);
 assert.deepEqual(scenarioIds([student,admin,outsider]),["enrollment-01"]);
 assert.deepEqual(tenantsForScenario([student,admin,outsider],"enrollment-01"),["school-a","school-b"]);
});
test("default compare excludes another tenant, even inside same scenario",()=>{
 const included=actorSessions([outsider,student,admin],{scenarioId:"enrollment-01",tenantAlias:"school-a"});
 assert.deepEqual(included.map(x=>x.id),[admin.id,student.id]);
 const summary=scenarioSummary([outsider,student,admin],{scenarioId:"enrollment-01",tenantAlias:"school-a"});
 assert.equal(summary.sessionCount,2);
 assert.equal(summary.records.some(r=>r.tenantAlias==="school-b"),false);
 assert.equal(JSON.stringify(summary).includes(outsider.id),false);
 assert.equal(summary.crossTenantComparison,false);
});
test("explicit local cross-tenant comparison remains labeled and warns about clock drift",()=>{
 const summary=scenarioSummary([admin,outsider],{scenarioId:"enrollment-01",tenantAlias:"school-a",allowOtherTenants:true});
 assert.equal(summary.sessionCount,2);
 assert.equal(summary.crossTenantComparison,true);
 assert.match(summary.clockWarning,/drift/);
});
test("independent event IDs prevent collision; no merged video or cause assertion",()=>{
 const a=actorSignals(admin),b=actorSignals(student);
 assert.equal(a[1].ref,admin.id+"/EV0002");
 assert.notEqual(a[1].ref,b[1].ref);
 assert.equal(a[1].relativeSecond,2.4);
 assert.equal(scenarioSummary([admin,student],{scenarioId:"enrollment-01",tenantAlias:"school-a"}).records[0].signals[1].status,500);
});
test("reimports replace same session, invalid labels and arbitrary overcapacity are rejected",()=>{
 assert.equal(replaceOrAddReport([admin],{...admin,title:"new"}).length,1);
 assert.throws(()=>sessionContext({...admin,testContext:{scenarioId:"../../other"}}),/invalid/);
 assert.throws(()=>replaceOrAddReport([admin],student,1),/limit/);
});

test("the real fictional multi-actor fixture contains separate tenants and real schema shape",async()=>{
 const {readFileSync}=await import("node:fs");
 const {validateReport}=await import("../studio/src/report.js");
 const raw=JSON.parse(readFileSync(new URL("../studio/public/demo-multi-actor.json",import.meta.url),"utf8"));
 assert.equal(raw.schema,"tracecue-multi-actor-fixture-v1");
 assert.equal(raw.sessions.length,4);
 const reports=raw.sessions.map(validateReport);
 assert.deepEqual(tenantsForScenario(reports,"enrollment-demo-01"),["school-a","school-b"]);
 const visible=scenarioSummary(reports,{scenarioId:"enrollment-demo-01",tenantAlias:"school-a"});
 assert.equal(visible.sessionCount,3);
 assert.equal(visible.records.some(r=>r.tenantAlias==="school-b"),false);
});
test("report import rejects malformed scenario roles before data is added",async()=>{
 const {validateReport}=await import("../studio/src/report.js");
 assert.throws(()=>validateReport({...admin,testContext:{scenarioId:"bad",tenantAlias:"school-a"}}),/invalid/);
});
