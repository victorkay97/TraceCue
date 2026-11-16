import test from "node:test";
import assert from "node:assert/strict";
import {newHandoffToken,studioTarget,studioAllowedOrigin,transferTarget,MAX_HANDOFF_VIDEO_BYTES} from "../extension/studio-handoff.js";
import {readHandoffFragment} from "../studio/src/extension-handoff.js";
const id="abcdefghijklmnopabcdefghijklmnop";
const token="a".repeat(48);
test("handoff URL binds an approved origin to an extension identity and random nonce",()=>{
 const origin=studioTarget("local");
 assert.equal(studioAllowedOrigin(origin),true);
 assert.equal(studioAllowedOrigin("https://evil.example"),false);
 const url=transferTarget(origin,token,id);
 assert.match(url,/#tracecue-transfer=/);
 assert.equal(readHandoffFragment(new URL(url).hash).token,token);
 assert.equal(readHandoffFragment(new URL(url).hash).origin,"chrome-extension://"+id);
 assert.throws(()=>transferTarget("https://evil.example",token,id));
});
test("invalid handoff tokens and extension IDs are rejected",()=>{
 assert.deepEqual(readHandoffFragment("#tracecue-transfer=bad&extension=none"),{invalid:true});
 assert.equal(readHandoffFragment("#welcome"),null);
 assert.throws(()=>transferTarget(studioTarget("preview"),token,"invalid"));
 const fake={getRandomValues(bytes){bytes.fill(5);}};
 assert.equal(newHandoffToken(fake),"05".repeat(24));
 assert.equal(MAX_HANDOFF_VIDEO_BYTES,83886080);
});
