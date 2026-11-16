import test from "node:test";
import assert from "node:assert/strict";
import {validateReport,summarize,buildPrompt,exportIssue} from "../studio/src/report.js";

const basic = () => ({
  schema:"tracecue-session-v1",id:"tc-test",startedAt:1000,stoppedAt:5000,
  title:"Fictional QA session",url:"https://demo.example/secret-account/123?token=123",
  events:[
    {kind:"click",at:2000,element:"button"},
    {kind:"network-failure",at:3000,status:500,method:"POST",
     url:"https://secret.example/users?token=leak",body:"private-body",headers:"Authorization: Bearer hidden"}
  ]
});
test("valid session is summarized",()=>{
  const report=validateReport(basic());
  assert.deepEqual(summarize(report),{events:2,errors:1,warnings:0,environment:0,interactions:1,markers:0,duration:4});
});
test("rejects unsupported schema, invalid dates, unexpected events",()=>{
  assert.throws(()=>validateReport({schema:"nope",events:[]}));
  const dates=basic();dates.stoppedAt=-2;
  assert.throws(()=>validateReport(dates));
  const kinds=basic();kinds.events.push({kind:"unsafe-extra",at:5000});
  assert.throws(()=>validateReport(kinds));
});
test("default AI prompt excludes raw URLs, headers and payloads",()=>{
  const prompt=buildPrompt(basic(),"Save button failed");
  assert.equal(prompt.includes("secret.example"),false);
  assert.equal(prompt.includes("private-body"),false);
  assert.equal(prompt.includes("Authorization"),false);
  assert.equal(prompt.includes("token=123"),false);
  assert.match(prompt,/Save button failed/);
  assert.match(prompt,/500/);
});
test("cloud prompt removes obvious private strings from notes",()=>{
  const prompt=buildPrompt(basic(),"Email alex@example.com password=abc123 Bearer z9");
  assert.equal(prompt.includes("alex@example.com"),false);
  assert.equal(prompt.includes("abc123"),false);
  assert.equal(prompt.includes("Bearer z9"),false);
});
test("issue export includes disclosure and does not claim reproduction",()=>{
  const text=exportIssue(basic(),"Expected save, actual failure",null);
  assert.match(text,/No AI analysis performed/);
  assert.match(text,/Verify suggested steps manually/);
});

test("warning-level legacy console logs are not counted as errors",()=>{
  const report=basic();
  report.events.push({
    kind:"console-error",level:"warning",at:3400,
    message:"MaxListenersExceededWarning",occurrences:11
  });
  const summary=summarize(report);
  assert.equal(summary.errors,1);
  assert.equal(summary.warnings,11);
  assert.equal(summary.events,13);
  const prompt=buildPrompt(report,"Investigate the network response");
  assert.match(prompt,/"type":"console-warning"/);
  assert.match(prompt,/"occurrences":11/);
  assert.equal(prompt.includes("secret.example"),false);
});
test("new console-warning entries stay distinct from exceptions",()=>{
  const report=basic();
  report.events.push({kind:"console-warning",level:"warn",at:3400,message:"Listener warning"});
  report.events.push({kind:"console-exception",at:3700,message:"Uncaught TypeError"});
  const summary=summarize(report);
  assert.equal(summary.errors,2);
  assert.equal(summary.warnings,1);
  assert.equal(summary.events,4);
});

test("legacy extension messaging is classified as environment, not application failure",()=>{
  const report=basic();
  report.events.push({
    kind:"console-error",level:"error",at:3400,
    message:"Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.",
    occurrences:28
  });
  const summary=summarize(report);
  assert.equal(summary.errors,1);
  assert.equal(summary.environment,28);
  assert.equal(summary.events,30);
  const prompt=buildPrompt(report,"Capture diagnostics");
  assert.match(prompt,/"type":"environment-diagnostic"/);
  assert.match(prompt,/"occurrences":28/);
});
test("actual exceptions remain failures",()=>{
  const report=basic();
  report.events.push({kind:"console-exception",at:3500,message:"Uncaught TypeError"});
  report.events.push({kind:"console-warning",at:3600,message:"Some harmless framework warning"});
  const summary=summarize(report);
  assert.equal(summary.errors,2);
  assert.equal(summary.warnings,1);
  assert.equal(summary.environment,0);
});

test("tester-provided issue title is separate from tested page title",()=>{
  const report=basic();
  report.title="Shop homepage";
  report.issueTitle="Checkout button never responds";
  const markdown=exportIssue(report,"Click did not respond",null);
  assert.match(markdown,/^# Checkout button never responds/m);
  assert.match(markdown,/Tested page: Shop homepage/);
});
test("a browsing session is not automatically labeled as a defect",()=>{
  const markdown=exportIssue(basic(),"No issue observed",null);
  assert.match(markdown,/^# Untitled QA observation/m);
  assert.doesNotMatch(markdown,/^# Fictional QA session/m);
});

test("browser-extension exceptions are classified as environment for old exports",()=>{
  const report=basic();
  report.events.push({
    kind:"console-exception",at:3400,
    url:"chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js"
  });
  const result=summarize(report);
  assert.equal(result.errors,1);
  assert.equal(result.environment,1);
});
