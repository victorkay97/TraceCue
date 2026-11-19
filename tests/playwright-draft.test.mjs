import test from "node:test";
import assert from "node:assert/strict";
import {generatePlaywrightDraft} from "../studio/src/playwright-draft.js";

test("generates a disabled draft with event timestamps",()=>{
  const s={title:"Save request fails",url:"https://example.test/profile",
    startedAt:1000,events:[{kind:"click",at:2000,element:"button"},
    {kind:"network-failure",at:2500,status:500}]};
  const draft=generatePlaywrightDraft(s);
  assert.match(draft,/test.skip/);
  assert.match(draft,/https:\/\/example\.test/);
  assert.match(draft,/\+1\.0s/);
  assert.match(draft,/TODO: implement stable role/);
});
test("does not interpolate untrusted raw JavaScript into the test",()=>{
  const s={title:'fail"); process.exit(1); //',url:"javascript:alert(1)",
    startedAt:0,events:[{kind:"console-error",at:1,message:"unexpected\nprocess.exit(1)"}]};
  const draft=generatePlaywrightDraft(s);
  assert.match(draft,/test.skip/);
  assert.doesNotMatch(draft,/javascript:alert/);
  assert.doesNotMatch(draft,/process\.exit\(1\)/);
});
