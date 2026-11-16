// Intentionally generates a skipped test scaffold, not an executable replay.
// Captured element categories lack stable selectors and test data; an engineer must review.
function safe(value,max=110) {
  return String(value ?? "").replace(/[\r\n\u2028\u2029]/g," ")
    .replace(/[^a-zA-Z0-9 _\-]/g,"").slice(0,max);
}
export function generatePlaywrightDraft(report) {
  let origin="http://localhost:3000";
  try {
    const u=new URL(report.url);
    if (["https:","http:"].includes(u.protocol)) origin=u.origin;
  } catch {}
  const timeline=report.events.filter(e=>[
    "click","change","submit","page-ready","network-failure","console-error","console-exception","issue-marker"
  ].includes(e.kind)).slice(0,80).map(e=>{
    const seconds=Math.max(0,(e.at-report.startedAt)/1000).toFixed(1);
    return "  // +" + seconds + "s | " + safe(e.kind) +
      " | " + safe(e.element || e.message || e.status || "");
  });
  const testTitle=safe(report.title || "reproduce captured defect");
  return [
    "// TraceCue draft generated from recorded evidence.",
    "// THIS TEST IS SKIPPED ON PURPOSE. Review selectors, data and assertions first.",
    "// No captured click is assumed to be replayable without an engineer selecting a stable locator.",
    'import { test, expect } from "@playwright/test";',"",
    "test.skip(" + JSON.stringify(testTitle) + ", async ({ page }) => {",
    "  await page.goto(" + JSON.stringify(origin) + ");",
    "  // TODO: set up a safe test account and required preconditions.",
    "  // Captured evidence timeline:",
    ...timeline,
    "  // TODO: implement stable role/test-id selectors for the steps above.",
    "  // TODO: add an assertion proving the expected result and a regression failure.",
    "  // Remove test.skip only when the test is safe and independently reviewed.",
    "});",""
  ].join("\n");
}
