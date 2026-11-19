# TraceCue 0.6 Phase 1 — Local Multi-Actor Test Scenarios

**Status:** Development implementation with CI-backed model tests. Chrome recording, Vercel UI and cross-PC import require live acceptance before public claims.

## What this solves

Complex applications require testing administrator, employee, student, supervisor and other roles, sometimes on separate machines and under different tenant organizations. TraceCue now lets testers **tag independent authorized recordings** with a common scenario ID, an anonymized tenant alias, a role label and a fictional actor alias. After stopping, import the separately exported session JSON files into the **Multi-actor scenarios** workspace in Studio.

**This phase does not:** issue credentials, sign into target systems, test without authorization, live-sync multiple computers, merge videos, or prove tenant permission boundaries from a status code alone.

## Scenario metadata contract

Session JSON retains its existing \`tracecue-session-v1\` schema. Optional \`testContext\` metadata is:

\`\`\`json
{
  "scenarioId": "enrollment-run-01",
  "tenantAlias": "school-a",
  "actorRole": "Administrator",
  "actorAlias": "admin-1"
}
\`\`\`

- A standalone session omits \`testContext\` or uses \`null\` and behaves as before.
- \`scenarioId\`: a shared **3–48 character** slug across participating recordings.
- \`tenantAlias\`: a **2–48 character** anonymized alias. Never enter a real tenant secret or private record key.
- \`actorRole\` and \`actorAlias\`: short plain-text labels for the simulated/test role, **not** authentication grants.
- Session IDs remain unique to each capture. The app being tested still controls its own accounts and permissions.

## What's available in TraceCue Studio

- **Multi-actor scenarios** navigation and a new comparison workspace.
- Import **multiple** session JSON files from different testers/computers, or choose **Try fictional multi-actor example**.
- Assign or correct scenario labels on a loaded standalone recording for this browser's local comparison.
- Group sessions by scenario, tenant, actor role and actor alias.
- View independently captured failures, issue markers and user-action metadata; each link keeps the original session ID and EV number.
- Review one actor's original recording with **Open actor's evidence**. Attach that actor's WebM separately if available. Video never merges automatically.
- Download a minimal scenario **summary** JSON containing only actor metadata, event types, statuses, session-relative timestamps and evidence references—**not** raw console messages, request bodies, stored videos or credentials.
- Clear the temporary comparison without deleting the original browser evidence.

## Tenant isolation rules

A scenario can legitimately involve several tenant aliases. By default, the comparison displays only **one selected tenant**. The tester must explicitly enable the other-tenant view and confirm authorization before combining evidence across imported tenants in this browser. This is a local review safeguard, **not a server-side authorization system**; there are no team accounts or security roles yet.

No scenario-wide AI prompt is generated automatically. The existing Firebase investigator remains scoped to the **one selected session / issue** and requires the usual text consent. Multi-actor signals are not silently sent to cloud AI.

## Clock and identity limitations

Recordings from different laptops may have different wall-clock times. Their timestamps are **not guaranteed synchronized**. TraceCue displays per-session relative seconds and the machine's reported recording time, with a warning against treating cross-machine ordering as verified causal evidence. Reproduction should be tested independently.

## One-pass demo

1. Open \`https://tracecue-studio-preview.vercel.app/app.html?demo=1\` or local Studio at \`http://127.0.0.1:5173/app.html\`.
2. Open **Multi-actor scenarios**, then click **Try fictional multi-actor example**.
3. Confirm three actors under \`school-a\`: Administrator, Student, and Lecturer. The default comparison must **exclude** \`school-b\`.
4. Select \`school-b\` to see only that student's 403 response. This is an **expected isolation result** in the fictional data—not automatically a confirmed defect.
5. Enable cross-tenant comparison and acknowledge the authorization prompt. Four role sessions should then be visible.
6. Return the checkbox to off. Confirm only the selected tenant remains in scope.
7. Open a student session's original evidence and inspect the existing per-session timeline. The failed HTTP 500 should keep its original EV identifier within that session.
8. Export the summary and verify it contains **no raw console messages, video, tokens or request bodies**.
9. Create one real controlled recording with a shared scenario ID, role and tenant alias. Repeat on another machine if available. Export both session JSON files from their Chrome reviewers, import both into Studio and check role grouping. Never use production credentials or sensitive real-world tenants.

## Planned later phases

**Phase 2 — Collaboration:** secure optional accounts, explicit group invitations, user/org membership, signed short-lived upload permissions, encrypted cloud storage, retention/delete controls, participant consent, role-based review, and auditable evidence sharing. Design security and permission enforcement **before** opening cross-device storage.

**Phase 3 — Role and tenant regression:** Playwright browser-context orchestration for isolated authorized test accounts, permissions matrix, reproducibility across roles, cross-tenant negative tests, automated comparison and verified test execution. Never claim that comparing 403/500 responses alone proves isolation or root cause.

## Important status

Automated Node tests validate metadata, per-actor evidence IDs, cross-tenant exclusion by default and the fictional dataset. Chrome MV3 recording, inter-machine clocks, video replay, Web Store installation and actual cross-PC collaboration are not automatically verified by these tests.

Related: [0.5 first-use release](RELEASE_0_5.md) · [QA roadmap](QA_WORKSPACE_ROADMAP.md) · [Chrome setup](INSTALL.md).
