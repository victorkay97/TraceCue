import test from "node:test";
import assert from "node:assert/strict";
import {chunkKey,chunkPrefix,draftKey,metaKey,describeRecovery} from "../extension/recording-keys.js";
test("chunks are naturally ordered in IndexedDB lexicographic key order",()=>{
 assert.ok(chunkKey("tc-1234567890123",2)<chunkKey("tc-1234567890123",11));
 assert.ok(chunkKey("tc-1234567890123",11).startsWith(chunkPrefix("tc-1234567890123")));
 assert.equal(draftKey("tc-1234567890123"),"draft:tc-1234567890123");
 assert.equal(metaKey("tc-1234567890123"),"recording-meta:tc-1234567890123");
});
test("incomplete session explicitly warns that video playback is unverified",()=>{
 const state=describeRecovery({chunks:3,bytes:1024,hasFinal:false});
 assert.equal(state.recoverable,true);
 assert.equal(state.partial,true);
 assert.match(state.description,/not guaranteed/);
 assert.equal(describeRecovery({chunks:0,bytes:0,hasFinal:false}).recoverable,false);
 assert.throws(()=>chunkKey("../../a",0));
});
