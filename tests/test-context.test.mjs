import test from "node:test";
import assert from "node:assert/strict";
import {normalizeTestContext,contextLabel} from "../extension/test-context.js";
test("legacy single-actor sessions remain valid without a scenario",()=>{
 assert.equal(normalizeTestContext(null),null);
 assert.equal(normalizeTestContext({}),null);
 assert.match(contextLabel(null),/standalone/);
});
test("stable scenario and tenant aliases preserve distinct roles",()=>{
 const x=normalizeTestContext({scenarioId:"Enrollment_Run_01",tenantAlias:"school_a",
  actorRole:"Administrator",actorAlias:"admin-1"});
 assert.deepEqual(x,{scenarioId:"enrollment_run_01",tenantAlias:"school_a",
  actorRole:"Administrator",actorAlias:"admin-1"});
});
test("reject missing tenant IDs, scenario IDs and secret-like identifiers",()=>{
 assert.throws(()=>normalizeTestContext({actorRole:"Student"}),/Scenario ID/);
 assert.throws(()=>normalizeTestContext({scenarioId:"run-01",tenantAlias:"",actorRole:"Student",actorAlias:"user-1"}),/Tenant alias/);
 assert.throws(()=>normalizeTestContext({scenarioId:"run-01",tenantAlias:"tenant-x",actorRole:"Student",actorAlias:""}),/role/);
 assert.equal(normalizeTestContext({scenarioId:"run-01",tenantAlias:"tenant-x",
  actorRole:"Student",actorAlias:"user@example.com"}).actorAlias,"[EMAIL]");
});
