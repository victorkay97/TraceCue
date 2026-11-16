import test from "node:test";
import assert from "node:assert/strict";
import {evidenceCatalog,prepareInvestigation,parseInvestigation,structuredToMarkdown} from "../studio/src/evidence-intelligence.js";
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
