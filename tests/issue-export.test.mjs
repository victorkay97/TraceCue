import test from "node:test";
import assert from "node:assert/strict";
import {issueDraft,issueJson,issueEvidence} from "../extension/issue-export.js";
const report={
  id:"tc-demo",startedAt:1000,videoStartedAt:1000,stoppedAt:120000,
  events:[
    {kind:"click",at:6000,element:"button"},
    {kind:"network-failure",at:8000,status:500,url:"https://demo.test/api/user?token=abc"},
    {kind:"issue-marker",at:10000,markerId:"m1",title:"Name mismatch",lookbackSeconds:15},
    {kind:"click",at:38000,element:"a"},
    {kind:"console-error",at:43000,message:"Authorization Bearer SECRET123"},
    {kind:"issue-marker",at:45000,markerId:"m2",title:"Save button not responding",lookbackSeconds:15}
  ]
};
test("multiple named issues retain independent windows and evidence",()=>{
 const first=issueJson(report,report.events[2]);
 const second=issueJson(report,report.events[5]);
 assert.equal(first.title,"Name mismatch");
 assert.equal(second.title,"Save button not responding");
 assert.equal(first.clip.startSecond,0);
 assert.equal(first.clip.endSecond,9);
 assert.equal(second.clip.startSecond,29);
 assert.equal(second.clip.endSecond,44);
 assert.equal(first.evidence.some(x=>x.kind==="network-failure"),true);
 assert.equal(first.evidence.some(x=>x.kind==="console-error"),false);
 assert.equal(second.evidence.some(x=>x.kind==="console-error"),true);
 assert.equal(second.evidence.some(x=>x.kind==="network-failure"),false);
});
test("issue export redacts secrets and strips URL query strings",()=>{
 const draft=issueDraft(report,report.events[5]);
 assert.doesNotMatch(draft,/SECRET123/);
});
test("issue exports exclude tokens in captured messages",()=>{
 const draft=issueDraft(report,report.events[5]);
 assert.doesNotMatch(draft,/SECRET123/);
 assert.match(draft,/Bearer \[REDACTED\]/);
 const first=issueJson(report,report.events[2]);
 assert.doesNotMatch(JSON.stringify(first),/token=abc/);
});
