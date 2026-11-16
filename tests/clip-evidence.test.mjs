import test from "node:test";
import assert from "node:assert/strict";
import {clipEvents,issueWindow,evidenceCategory} from "../extension/clip-evidence.js";
const report={startedAt:1000,videoStartedAt:1000,stoppedAt:50000,events:[
 {kind:"console-info",at:10000,message:"Starting save",occurrences:1,occurrenceTimes:[10000]},
 {kind:"console-warning",at:14000,lastAt:17200,occurrences:3,occurrenceTimes:[14000,16200,17200],message:"Missing field"},
 {kind:"network-failure",at:20000,status:500,method:"POST",url:"https://demo.test/api/profile?token=abc"},
 {kind:"console-debug",at:25000,message:"Bearer abc123"},
 {kind:"click",at:40000,element:"button"},
 {kind:"issue-marker",at:23000,lookbackSeconds:10,postBufferSeconds:5}
]};
const marker=report.events[5];
test("clip evidence includes logs, network failures, and post-marker events within exact window",()=>{
 const events=clipEvents(report,marker);
 assert.deepEqual(events.map(e=>e.kind),["console-warning","network-failure","console-debug"]);
 assert.equal(events[0].occurrences,3);
 assert.equal(events[1].status,500);
 assert.equal(events[1].url,"https://demo.test/api/profile");
 assert.doesNotMatch(JSON.stringify(events),/token=abc|abc123/);
 assert.equal(issueWindow(report,marker).start,12);
 assert.equal(issueWindow(report,marker).end,27);
});
test("edited boundaries change the evidence selection, not just the displayed video",()=>{
 const events=clipEvents(report,{...marker,clipStartSecond:24,clipEndSecond:43});
 assert.deepEqual(events.map(e=>e.kind),["console-debug","click"]);
});
test("a grouped console warning counts only repeated occurrences inside the interval",()=>{
 const events=clipEvents(report,{...marker,clipStartSecond:15,clipEndSecond:15.7});
 assert.equal(events.length,1);
 assert.equal(events[0].occurrences,1);
 assert.equal(events[0].second,15.2);
});
test("first/last source flags remain filterable",()=>{
 assert.equal(evidenceCategory("console-info"),"console");
 assert.equal(evidenceCategory("network-response"),"network");
 assert.equal(evidenceCategory("click"),"actions");
});

test("large clip interval exports every captured event instead of a hidden 200-item cap",()=>{
 const expanded={...report,events:Array.from({length:310},(_,index)=>({
   kind:"console-info",at:2000+index*100,message:"safe log "+index
 }))};
 const marker={kind:"issue-marker",at:39000,lookbackSeconds:60,postBufferSeconds:5};
 assert.equal(clipEvents(expanded,marker).length,310);
 assert.equal(clipEvents(expanded,marker,{limit:150}).length,150);
});
