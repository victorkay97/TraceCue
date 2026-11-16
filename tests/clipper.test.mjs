import test from "node:test";
import assert from "node:assert/strict";
import {clipBounds,clipKey,clipFileName} from "../extension/clipper.js";
const report={id:"tc-1",startedAt:1000,videoStartedAt:2500};
test("30-second lookback is anchored to video start, not page event clock",()=>{
 const range=clipBounds(report,{kind:"issue-marker",at:62500,lookbackSeconds:30},120);
 assert.deepEqual(range,{start:30,end:60,duration:30,lookback:30});
});
test("lookback clamps to the beginning and available video duration",()=>{
 const early=clipBounds(report,{kind:"issue-marker",at:9500,lookbackSeconds:30},60);
 assert.equal(early.start,0);assert.equal(early.end,7);
 const later=clipBounds(report,{kind:"issue-marker",at:100000,lookbackSeconds:60},70);
 assert.equal(later.end,70);assert.equal(later.start,10);
});
test("clip range rejects missing markers and markers before video starts",()=>{
 assert.throws(()=>clipBounds(report,{kind:"click",at:10000}));
 assert.throws(()=>clipBounds(report,{kind:"issue-marker",at:1000}));
});
test("independent clip names cannot contain file traversal",()=>{
 assert.equal(clipKey("tc-1","m-42"),"clip:tc-1:m-42");
 assert.equal(clipFileName("tc-1","../../m-42"),"clip-tc-1-m-42.webm");
});
