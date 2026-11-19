import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {searchQaEvidence} from "../studio/src/qa-query.js";
const html=readFileSync(new URL("../studio/index.html",import.meta.url),"utf8");
const style=readFileSync(new URL("../studio/src/landing.css",import.meta.url),"utf8");
const script=readFileSync(new URL("../studio/src/landing.js",import.meta.url),"utf8");
const sample=JSON.parse(readFileSync(new URL("../studio/public/demo-session.json",import.meta.url),"utf8"));
test("V2 homepage has independent, working product journeys without a forced signup",()=>{
 assert.match(html,/href="\/app\.html\?demo=1"/);
 assert.match(html,/id="what-it-does"/);
 assert.match(html,/id="how-it-works"/);
 assert.match(html,/id="sample-search-form"/);
 assert.match(html,/id="privacy"/);
 assert.match(html,/id="feature-stage"/);
 assert.match(html,/developer installation guide/i);
 assert.doesNotMatch(html,/chrome\.google\.com\/webstore\/detail/);
 assert.doesNotMatch(html,/required signup|create account to continue/i);
});
test("four feature tabs are keyboard accessible and map to implemented UI states",()=>{
 const states=["capture","mark","search","report"];
 for(const name of states){
  assert.match(html,new RegExp('data-feature="'+name+'"'));
  assert.match(script,new RegExp('(^|\\\\s)'+name+':\\\\s*\\\\{'));
 }
 assert.match(script,/ArrowRight/);
 assert.match(script,/aria-selected/);
 assert.match(script,/prefers-reduced-motion/);
});
test("the landing search uses the production deterministic evidence engine on actual demo fixture",()=>{
 assert.match(script,/import \{searchQaEvidence\}/);
 assert.match(script,/fetch\("\/demo-session\.json"/);
 const fail=searchQaEvidence(sample,"HTTP 500");
 assert.equal(fail.total,1);
 assert.equal(fail.matches[0].id,"EV0004");
 const mismatch=searchQaEvidence(sample,"name mismatch");
 assert.ok(mismatch.matches.some(e=>e.kind==="console-error"));
});
test("light theme and responsive breakpoints retain privacy, animation and motion accessibility",()=>{
 assert.match(style,/color-scheme:light/);
 assert.match(style,/@media\(max-width:560px\)/);
 assert.match(style,/prefers-reduced-motion/);
 assert.match(style,/\.policy-content/);
 assert.match(style,/\.sample-search/);
});
