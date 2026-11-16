import test from "node:test";
import assert from "node:assert/strict";
import {searchSessions,sessionIssueTitles,issueFingerprint,recurrenceHints} from "../extension/session-library.js";
const a={id:"a",startedAt:10,title:"Checkout",url:"https://demo.test",events:[
 {kind:"network-failure",status:500,method:"POST",url:"https://demo.test/api/profile"},
 {kind:"issue-marker",title:"Save button failed"}]};
const b={id:"b",startedAt:20,title:"Settings",url:"https://example.test",events:[
 {kind:"network-failure",status:500,method:"POST",url:"https://demo.test/api/profile"},
 {kind:"issue-marker",title:"Profile failed"}]};
test("session library searches stored issue titles and sorts recent first",()=>{
 assert.deepEqual(searchSessions([a,b],"save button").map(r=>r.id),["a"]);
 assert.deepEqual(searchSessions([a,b],"").map(r=>r.id),["b","a"]);
 assert.deepEqual(sessionIssueTitles(a),["Save button failed"]);
});
test("conservative recurrence hints do not claim verified duplicates",()=>{
 const hints=recurrenceHints(a,[a,b]);
 assert.equal(hints.length,1);assert.equal(hints[0].sessionId,"b");
 assert.equal(issueFingerprint({kind:"click"}),null);
});
