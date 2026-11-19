import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../studio/studio-v2.html",import.meta.url),"utf8");
const code=readFileSync(new URL("../studio/src/studio-v2.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../studio/src/studio-v2.css",import.meta.url),"utf8");
const vite=readFileSync(new URL("../studio/vite.config.js",import.meta.url),"utf8");
test("Studio V2 has a separate reversible entry and reuses the real engine",()=>{
 assert.match(page,/\/src\/studio-v2\.js/);
 assert.match(vite,/studioV2:resolve/);
 assert.match(code,/import "\.\/main\.js"/);
 assert.match(code,/document\.getElementById\("evidence"\)/);
 assert.match(code,/document\.getElementById\("queryWorkspace"\)/);
 assert.match(code,/document\.getElementById\("intelligence"\)/);
 assert.match(code,/document\.getElementById\("scenarios"\)/);
 assert.match(code,/document\.getElementById\("githubHandoff"\)/);
});
test("Studio V2 isolates tasks and retains consent and demo import",()=>{
 for(const x of ["overview","sessions","issues","investigate","reports","settings"])
  assert.match(code,new RegExp('view\\("'+x+'"'));
 assert.match(code,/document\.getElementById\("loadDemo"\)\.click/);
 assert.match(code,/document\.getElementById\("file"\)\.click/);
 assert.match(code,/document\.getElementById\("consent"\)/);
 assert.match(code,/MutationObserver/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
});
