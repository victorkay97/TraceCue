import test from "node:test";
import assert from "node:assert/strict";
import {assertInferenceSource,INFERENCE_SOURCES} from "../studio/src/inference-source.js";

test("Firebase SDK lowercase in_cloud is valid for approved cloud mode",()=>{
  assert.equal(assertInferenceSource("cloud","in_cloud"),"in_cloud");
  assert.equal(INFERENCE_SOURCES.cloud,"in_cloud");
});
test("Firebase SDK lowercase on_device is valid for local-only mode",()=>{
  assert.equal(assertInferenceSource("device","on_device"),"on_device");
  assert.equal(INFERENCE_SOURCES.device,"on_device");
});
test("local mode must reject cloud inference, never silently fallback",()=>{
  assert.throws(()=>assertInferenceSource("device","in_cloud"),/Privacy protection/);
});
test("cloud mode must reject device inference",()=>{
  assert.throws(()=>assertInferenceSource("cloud","on_device"),/Expected cloud inference/);
});
test("unknown sources, incorrect casing and modes are rejected",()=>{
  assert.throws(()=>assertInferenceSource("cloud","IN_CLOUD"));
  assert.throws(()=>assertInferenceSource("device",null));
  assert.throws(()=>assertInferenceSource("unknown","in_cloud"));
});
