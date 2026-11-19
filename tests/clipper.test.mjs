import test from "node:test";
import assert from "node:assert/strict";
import {clipBounds,clipKey,clipFileName} from "../extension/clipper.js";
const report={id:"tc-1",startedAt:1000,videoStartedAt:2500};
test("30-second lookback is anchored to video start, not page event clock",()=>{
 const range=clipBounds(report,{kind:"issue-marker",at:62500,lookbackSeconds:30},120);
 assert.deepEqual(range,{start:30,end:60,duration:30,lookback:30,postBuffer:0,edited:false});
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

test("clip filenames preserve distinct issue titles and immutable marker IDs",()=>{
 const one=clipFileName("tc-1","m1","Name mismatch");
 const two=clipFileName("tc-1","m2","Name mismatch");
 assert.match(one,/name-mismatch\.webm$/);
 assert.notEqual(one,two);
 assert.equal(clipFileName("tc-1","m3","../?secret\\unsafe"),"clip-tc-1-m3-secret-unsafe.webm");
});

test("five- and ten-second post-marker buffers preserve preceding lookback",()=>{
  const m={kind:"issue-marker",at:62500,lookbackSeconds:30,postBufferSeconds:5};
  assert.deepEqual(clipBounds(report,m,120),{
    start:30,end:65,duration:35,lookback:30,postBuffer:5,edited:false
  });
  assert.equal(clipBounds(report,{...m,postBufferSeconds:10},120).end,70);
});
test("post-marker interval clamps to actual recording end without inventing frames",()=>{
  const range=clipBounds(report,{kind:"issue-marker",at:62500,lookbackSeconds:30,postBufferSeconds:10},63);
  assert.equal(range.start,30);
  assert.equal(range.end,63);
});
test("tester-edited boundaries override the initial lookback and post-buffer",()=>{
  const marker={kind:"issue-marker",at:62500,lookbackSeconds:30,postBufferSeconds:5,
    clipStartSecond:12.5,clipEndSecond:71.2};
  const bounds=clipBounds(report,marker,120);
  assert.equal(bounds.start,12.5);
  assert.equal(bounds.end,71.2);
  assert.equal(bounds.edited,true);
  assert.equal(clipBounds(report,marker,64).end,64);
  assert.throws(()=>clipBounds(report,{...marker,clipStartSecond:80,clipEndSecond:40},120),/no usable/);
  assert.throws(()=>clipBounds(report,{...marker,clipEndSecond:undefined},120),/Both custom/);
});
