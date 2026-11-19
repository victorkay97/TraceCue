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
  assert.ok(script.includes(name+":{"),"Missing feature state: "+name);
  assert.ok(html.includes('data-feature="'+name+'"'),"Missing feature tab: "+name);
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

test("Playground-audited landing calibrates typography and mobile interactions",()=>{
 assert.match(style,/HI Playground audit/);
 assert.match(style,/max-width:1200px;padding-inline:64px/);
 assert.match(style,/font:600 30px\/36px/);
 assert.match(style,/height:28px;min-height:28px/);
 assert.match(style,/@media\(max-width:1023px\)/);
 assert.match(style,/scroll-snap-type:x mandatory/);
 assert.match(html,/id="mobile-menu-toggle"/);
 assert.match(html,/id="mobile-menu-panel"/);
 assert.match(html,/id="feature-mobile-track"/);
 assert.match(script,/function openMobileMenu/);
 assert.match(script,/mobileTrack\.addEventListener\("keydown"/);
});

test("hero keeps copy above full-width product and shifts aside farther right",()=>{
 assert.match(style,/@media\(min-width:1024px\)/);
 assert.match(style,/\.hero\.frame\{display:block\}/);
 assert.match(style,/\.hero-intro\{\s*display:grid;/);
 assert.match(style,/grid-template-columns:minmax\(0,1fr\) minmax\(0,390px\)/);
 assert.match(style,/\.hero-aside\{[\s\S]*?justify-self:end/);
 assert.match(style,/\.hero-product\{grid-column:auto;grid-row:auto;width:100%/);
 assert.doesNotMatch(style,/\.hero-intro\{display:contents\}/);
 assert.match(style,/photo-1777978404260-d1adfd1bd6ee/);
 assert.doesNotMatch(style,/photo-1712628956639-638ad87c988e/);
 assert.match(html,/Photo: Narbeh Arakil \/ Unsplash/);
});
