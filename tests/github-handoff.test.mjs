import test from "node:test";
import assert from "node:assert/strict";
import {githubIssueUrl,buildGitHubIssueDraft} from "../studio/src/github-handoff.js";

const report={startedAt:1794834000000,events:[],url:"https://private.test/?apiKey=hidden"};
const analysis={
 title:"Profile Save Failure",summary:"Request failed with a 500 error",
 observed:"",confidence:"low",missingInformation:["Expected behavior"],
 hypotheses:["Server issue possible"],regressionChecks:["Repeat with test data"],
 reproductionSteps:[{step:"Click save",evidenceIds:["EV0003"]},
  {step:"Find the private control",evidenceIds:[]}]
};
const catalog=[
 {id:"EV0004",kind:"network-failure",second:6.3,method:"POST",status:500,occurrences:1},
 {id:"EV0005",kind:"console-error",second:6.5,occurrences:1},
 {id:"EV0006",kind:"issue-marker",second:10,occurrences:1}
];
test("builds non-publishing issue draft with recorded evidence and limitations",()=>{
 const draft=buildGitHubIssueDraft(report,analysis,catalog,"on_device");
 assert.match(draft.title,/Profile Save Failure/);
 assert.match(draft.body,/HTTP 500 recorded for POST request/);
 assert.match(draft.body,/EV0004/);
 assert.match(draft.body,/uncited AI suggestion/);
 assert.match(draft.body,/Inference source: on_device/);
 assert.match(draft.body,/Human review|Incomplete/);
 assert.match(draft.body,/NOT RUN/);
});
test("draft excludes secret URLs and raw payloads",()=>{
 const mutated={...analysis,summary:"Bearer secret123 https://private.test/path?token=abcd"};
 const draft=buildGitHubIssueDraft(report,mutated,catalog,"in_cloud");
 assert.doesNotMatch(draft.body,/secret123|private\.test|token=abcd|apiKey=hidden/);
});
test("only valid GitHub repository destinations are used",()=>{
 assert.equal(githubIssueUrl("victorkay97/TraceCue"),"https://github.com/victorkay97/TraceCue/issues/new");
 assert.equal(githubIssueUrl("https://github.com/victorkay97/TraceCue"),null);
 assert.equal(githubIssueUrl("bad repo/x"),null);
 assert.equal(githubIssueUrl("owner/../target"),null);
});
