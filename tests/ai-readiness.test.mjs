import test from "node:test";
import assert from "node:assert/strict";
import {checkLocalModelAvailability,localReadinessLabel} from "../studio/src/ai-readiness.js";
test("local model check specifies English and never contacts cloud",async()=>{
 let called=0;const model={availability:async options=>{
  called++;assert.equal(options.expectedOutputs[0].languages[0],"en");return "available";
 }};
 assert.equal(await checkLocalModelAvailability(model),"available");
 assert.equal(called,1);
 assert.match(localReadinessLabel("downloadable"),/download/);
});
test("unsupported browsers return an honest unavailable state",async()=>{
 assert.equal(await checkLocalModelAvailability(null),"unavailable");
 assert.match(localReadinessLabel("unavailable"),/unavailable/);
});
