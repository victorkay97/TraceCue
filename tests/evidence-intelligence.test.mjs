import test from "node:test";
import assert from "node:assert/strict";
import {evidenceCatalog,prepareInvestigation,parseInvestigation,structuredToMarkdown,recordedObservations,evidenceCoverage} from "../studio/src/evidence-intelligence.js";
const fixture=()=>({
  schema:"tracecue-session-v1",id:"test",startedAt:1000,stoppedAt:9000,
  events:[
    {kind:"environment-diagnostic",at:1100,occurrences:25,message:"Extension"},
    {kind:"click",at:2000,element:"button testid:fixture-failed-save"},
    {kind:"network-failure",at:2100,status:404,method:"POST",url:"https://private.test/?token=abc"},
    {kind:"console-error",at:2200,message:"https://private.test/?token=abc"},
    {kind:"click",at:3000,element:"button testid:fixture-warnings"},
    {kind:"console-warning",at:3100,occurrences:4,message:"Warning"},
    {kind:"console-exception",at:4100,message:"Uncaught"}
  ]
});
test("catalog has stable evidence IDs and excludes extension noise",()=>{
  const c=evidenceCatalog(fixture());
  assert.deepEqual(c.map(x=>x.id),["EV0002","EV0003","EV0004","EV0005","EV0006","EV0007"]);
  assert.equal(c[1].status,404);
  assert.equal(c[4].occurrences,4);
});
test("privacy-minimized prompt includes evidence, not logs, URLs or secrets",()=>{
  const p=prepareInvestigation(fixture(),"alex@example.com password=abc123").prompt;
  assert.match(p,/EV0003/);
  assert.match(p,/fixture-failed-save/);
  assert.doesNotMatch(p,/private.test|abc123|alex@example.com/);
});
test("environment entries require explicit inclusion",()=>{
  assert.equal(evidenceCatalog(fixture(),{includeEnvironment:true})[0].id,"EV0001");
});
test("unsupported AI evidence citations are dropped",()=>{
  const raw=JSON.stringify({title:"Save failed",summary:"HTTP 404",observed:"Failed request",
    reproductionSteps:[{step:"Click save",evidenceIds:["EV0002","EV0003","EV9999"]}],
    missingInformation:[],hypotheses:[],regressionChecks:[],confidence:"medium"});
  const parsed=parseInvestigation(raw,["EV0002","EV0003"]).structured;
  assert.deepEqual(parsed.reproductionSteps[0].evidenceIds,["EV0002","EV0003"]);
  assert.doesNotMatch(structuredToMarkdown(parsed),/EV9999/);
});
test("malformed model output is not fabricated into a structured result",()=>{
  assert.equal(parseInvestigation("This is a bug",[]).structured,null);
});

test("captured signals contain only structured diagnostic facts",()=>{
  const recorded=recordedObservations(evidenceCatalog(fixture()));
  assert.equal(recorded.some(x=>x.description.includes("HTTP 404")),true);
  assert.equal(recorded.some(x=>x.description.includes("console error")),true);
  assert.equal(recorded.some(x=>x.description.includes("Extension")),false);
  assert.equal(recorded.find(x=>x.id==="EV0003").description,"HTTP 404 recorded for POST request at +1.1s");
});
test("a missing AI observed field stays blank and lowers evidence completeness",()=>{
  const json=JSON.stringify({
    title:"Proposed defect",summary:"HTTP 404 observed",
    reproductionSteps:[{step:"Click save",evidenceIds:["EV0002"]}],
    missingInformation:["Expected result"],confidence:"high"
  });
  const result=parseInvestigation(json,["EV0002"]).structured;
  assert.equal(result.observed,"");
  const quality=evidenceCoverage(result);
  assert.equal(quality.status,"incomplete");
  assert.equal(quality.issues.some(x=>x.includes("did not provide")),true);
});
test("model high confidence is not treated as independently verified accuracy",()=>{
  const coverage=evidenceCoverage({
    observed:"Recorded error",confidence:"high",
    reproductionSteps:[{step:"Click",evidenceIds:[]}],
    missingInformation:["Expected behavior"]
  });
  assert.equal(coverage.status,"incomplete");
  assert.equal(coverage.issues.some(x=>x.includes("do not cite")),true);
});
