import test from "node:test";
import assert from "node:assert/strict";
import {evaluateReproduction} from "../studio/src/repro-audit.js";
const checked={preconditions:"QA sandbox demo account",expected:"Save should complete successfully",
 actual:"Server returned HTTP 500",stepsReviewed:true,retested:true,privacyReviewed:true,authorized:true};
const evidence=[{kind:"network-failure",id:"EV0004"}];
test("draft is blocked until tester explicitly verifies all constraints",()=>{
  const result=evaluateReproduction({expected:"Save succeeds"},evidence);
  assert.equal(result.ready,false);
  assert.ok(result.blockers.length>=5);
});
test("fully reviewed evidence and reproducible test permit manual handoff",()=>{
  const result=evaluateReproduction(checked,evidence);
  assert.equal(result.ready,true);
  assert.equal(result.blockers.length,0);
});
test("missing recorded evidence cannot be presented as verified",()=>{
  const result=evaluateReproduction(checked,[]);
  assert.equal(result.ready,false);
});
test("retest and authorization are mandatory independent of AI confidence",()=>{
  assert.equal(evaluateReproduction({...checked,retested:false},evidence).ready,false);
  assert.equal(evaluateReproduction({...checked,authorized:false},evidence).ready,false);
});
