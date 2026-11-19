import test from "node:test";
import assert from "node:assert/strict";
import { classifyDiagnostic, safeEvidenceUrl, redactDiagnosticText } from "../extension/diagnostics.js";

test("Chrome extension exceptions become environment diagnostics",()=>{
  const result=classifyDiagnostic("console-exception",{message:"Uncaught (in promise)"},
    {url:"chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js"});
  assert.equal(result.kind,"environment-diagnostic");
  assert.equal(result.data.originalKind,"console-exception");
  assert.equal(result.data.sourceHint,"browser-extension");
});
test("isolated script context is not attributed to the page",()=>{
  const result=classifyDiagnostic("console-warning",{message:"warning"},{isIsolated:true});
  assert.equal(result.kind,"environment-diagnostic");
  assert.equal(result.data.sourceHint,"isolated-world");
});
test("genuine page exception and failed network request stay failures",()=>{
  assert.equal(classifyDiagnostic("console-exception",{message:"Uncaught TypeError"},
    {url:"http://127.0.0.1:5173/qa-fixture.html"}).kind,"console-exception");
  assert.equal(classifyDiagnostic("network-failure",{status:404},
    {url:"http://127.0.0.1:5173/__tracecue_fixture_expected_404__"}).kind,"network-failure");
});
test("runtime.lastError with missing message receiver is only a source hint",()=>{
  const result=classifyDiagnostic("console-error",{
    message:"Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist."
  });
  assert.equal(result.kind,"environment-diagnostic");
  assert.equal(result.data.sourceHint,"possible-extension-messaging");
});
test("private script IDs, query params, and identifiers are not exported as URLs",()=>{
  assert.equal(safeEvidenceUrl("chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/inpage.js"),"[browser-extension]");
  assert.equal(safeEvidenceUrl("https://test.example/account/12345?token=private"),"https://test.example/account/[id]");
});
test("unknown warnings are preserved rather than silently suppressed",()=>{
  assert.equal(classifyDiagnostic("console-warning",{message:"Unknown warning"}).kind,"console-warning");
});

test("removes browser extension IDs from console messages",()=>{
  const clean=redactDiagnosticText("chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js:9");
  assert.equal(clean.includes("nkbihfbeogaeaoehlefnkodbefgpgknn"),false);
  assert.match(clean,/\[browser-extension\]/);
});
test("redacts bearer tokens and query strings in diagnostics",()=>{
  const clean=redactDiagnosticText("Bearer abc123 at https://example.test/profile?token=secret");
  assert.equal(clean.includes("abc123"),false);
  assert.equal(clean.includes("secret"),false);
});

test("page-script callsite outranks extension-controlled observer context",()=>{
  const result=classifyDiagnostic("console-warning",{level:"warning",message:"TraceCue fixture warning"},{
    stackUrl:"http://127.0.0.1:5173/qa-fixture.html",
    contextOrigin:"chrome-extension://injected-extension",isIsolated:true,
    pageUrl:"http://127.0.0.1:5173/[id]"
  });
  assert.equal(result.kind,"console-warning");
  assert.equal(result.data.sourceHint,"page-script");
  assert.equal(result.data.sourceConfidence,"callsite");
});
test("fixture console error remains an application log with page callsite",()=>{
  const result=classifyDiagnostic("console-error",{level:"error",message:"TraceCue fixture HTTP 404"},{
    stackUrl:"http://127.0.0.1:5173/qa-fixture.html",
    contextOrigin:"chrome-extension://injected-extension",
    pageUrl:"http://127.0.0.1:5173/[id]"
  });
  assert.equal(result.kind,"console-error");
});
test("extension callsite remains environment even when context is page origin",()=>{
  const result=classifyDiagnostic("console-warning",{message:"Extension warning"},{
    stackUrl:"chrome-extension://injected-extension/inpage.js",
    contextOrigin:"http://127.0.0.1:5173",
    pageUrl:"http://127.0.0.1:5173/qa-fixture.html"
  });
  assert.equal(result.kind,"environment-diagnostic");
  assert.equal(result.data.sourceHint,"browser-extension");
});
