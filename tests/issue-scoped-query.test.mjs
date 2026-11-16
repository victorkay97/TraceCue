import test from "node:test";
import assert from "node:assert/strict";
import {scopedEvidence,issueBounds} from "../studio/src/issue-scope.js";
import {searchQaEvidence,buildQaQuestionPrompt} from "../studio/src/qa-query.js";
const report={
  schema:"tracecue-session-v1",id:"t",startedAt:1000,stoppedAt:60000,videoStartedAt:1000,
  events:[
    {kind:"click",at:5000,element:"Save"},
    {kind:"network-failure",at:8500,status:500,method:"POST",message:"Server error"},
    {kind:"issue-marker",at:10000,markerId:"one",title:"Save failed",lookbackSeconds:10,postBufferSeconds:5},
    {kind:"network-response",at:33000,status:200,method:"GET",url:"https://example.test/success?token=abc"},
    {kind:"console-error",at:41000,message:"Profile mismatch"},
    {kind:"issue-marker",at:44000,markerId:"two",title:"Wrong profile",lookbackSeconds:12,postBufferSeconds:5}
  ]
};
test("scoped evidence preserves original EV references and excludes other bugs",()=>{
 const a=scopedEvidence(report,"one");
 assert.deepEqual(a.entries.map(x=>x.id),["EV0001","EV0002"]);
 const b=scopedEvidence(report,"two");
 assert.deepEqual(b.entries.map(x=>x.id),["EV0004","EV0005"]);
 assert.equal(issueBounds(report,"two").clipStart,31);
});
test("HTTP 500 log query retrieves the exact captured event, not an invented cause",()=>{
 const found=searchQaEvidence(report,"where did error 500 happen",{markerId:"one"});
 assert.equal(found.total,1);assert.equal(found.matches[0].id,"EV0002");
 assert.equal(found.matches[0].second,7.5);
 assert.match(found.explanation,/video/);
 const causes=searchQaEvidence(report,"why error 500",{markerId:"one"});
 assert.match(causes.explanation,/not the verified server-side root cause/);
});
test("querying missing HTTP errors produces an honest no-result state",()=>{
 const found=searchQaEvidence(report,"find 503",{markerId:"one"});
 assert.equal(found.total,0);
 assert.match(found.explanation,/No matching event/);
});
test("querying a different issue does not leak the other issue into the AI prompt",()=>{
 const text=buildQaQuestionPrompt(report,"HTTP 500",{markerId:"two"}).prompt;
 assert.doesNotMatch(text,/EV0002/);
 assert.doesNotMatch(text,/Profile mismatch/); // query matches nothing
});
