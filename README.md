# TraceCue

**Every bug has a trail.** TraceCue is a permission-based QA evidence and intelligence platform: a Chrome companion captures an authorized testing session; TraceCue Studio helps reviewers inspect what happened, understand defects, and send actionable reports to their existing engineering tools.

> **Status:** Active development for Firebase #BuildHybridAI 2026. Original tab capture and text inference sources (`on_device`, `in_cloud`) were previously verified in Chrome. TraceCue 0.6 Phase 1 multi-actor scenarios alongside 0.5 capture and first-use experience, clip renderer, recovery, annotations, issue-scoped queries and visual cloud inference require live browser acceptance; compilation does not prove end-to-end video behavior.

## Product boundaries

TraceCue **is not** a Jira, Linear, or ClickUp clone. It owns **sessions, evidence, QA investigations, and quality insights**. Tickets, assignments, sprints, and delivery stay with the teams' existing tools.

## Repositories / components

- **extension/** — Chrome MV3 native sidebar/companion, permissioned recording with durable IndexedDB chunks and local recovery, individually editable issue clips, opt-in verbose diagnostics, a searchable session library and a local review/export workspace.
- **studio/** — Vite workspace with optional multi-actor scenarios grouped by tenant and role, issue-scoped Firebase AI, deterministic queries over captured logs (including HTTP statuses), opt-in cloud-only video questions, synchronized events/video, screenshot annotation and human-reviewed handoffs.
- **tests/** — capture/report unit tests.
- **docs/** — system design, security boundaries, setup and hackathon progress.

## Development

Chrome extension: open `chrome://extensions`, enable Developer mode, select **Load unpacked**, and choose the **extension** directory. Click TraceCue's toolbar icon on an authorized HTTP(S) tab to open its sidebar and pre-recording floating mascot. **During recording, the in-page mascot is removed before capture starts**, so it cannot appear in the saved tab video; the native Chrome sidebar and optional separate floating controls window remain available. Start and stop explicitly; mark the preceding 15/30/60/120 seconds as independently titled issue clips. The viewer keeps the full session intact, supports per-clip title/notes editing and independent Markdown/JSON issue drafts, and renders individual WebM clips locally; clip rendering plays the selected interval in real time. A separate Chrome popup cannot promise always-on-top, but sidebar controls remain out of the tab video. Local recordings never upload themselves.

TraceCue Studio (Node 20+):

~~~powershell
cd studio
Copy-Item .env.example .env.local
npm install
npm run dev
~~~

Open the Vite homepage at `/` and use the no-account demo at `/app.html?demo=1`, or open Studio at `/app.html` and import a redacted session JSON plus its full WebM. Click any evidence event to seek to the matching video moment. For a controlled recorder test, open `http://127.0.0.1:5173/qa-fixture.html` while Studio's Vite dev server is running; see the setup guide. To enable AI, configure your own Firebase web app with Firebase AI Logic and App Check. See [the setup guide](docs/SETUP.md).

## TraceCue 0.5 first use and local handoff

TraceCue now has a responsive homepage, a standalone Studio route, a skippable onboarding guide and clearer private-on-device vs explicit-cloud AI choices. On the extension's review page, **Continue in Studio** can securely offer a user-reviewed session and a WebM up to 80 MB directly to a selected Studio browser window with a one-time handshake. No account or server upload is needed for that handoff; manual JSON/WebM import remains the reliable fallback until Chrome acceptance testing.

For new testers, use the [developer installation guide](docs/INSTALL.md). For a public release, see the [store readiness checklist](docs/WEB_STORE_READINESS.md), including accurate permissions and privacy disclosures.

## Privacy rules

Only test applications you are authorized to inspect. Captured tab video can visibly include confidential information, and console diagnostics can inadvertently contain secrets. Use disposable test accounts, review recordings before sharing, and never record passwords, payment cards, or real customer records. The extension does not transmit evidence to a server. Cloud text inference requires explicit consent for a minimized, reviewed prompt. Optional visual inference separately requires choosing and approving an exported video clip, which is sent to Firebase cloud AI. On-device-only inference does not accept video.

## Licensing

Apache License 2.0; see [LICENSE](LICENSE). See [third-party decisions](docs/THIRD_PARTY.md) before reusing external code.

## TraceCue Studio public demo

[Open the TraceCue homepage](https://tracecue-studio-preview.vercel.app/) or [launch the fictional Studio demonstration](https://tracecue-studio-preview.vercel.app/app.html?demo=1). Vercel confirmed that the development-branch build is ready. The public demo includes fictional QA evidence and no private recordings. It does **not** yet have production Firebase credentials or App Check domain registration; local Firebase hybrid inference was verified separately. See [the current acceptance workflow](docs/V2_WORKFLOW.md) before claiming the newly added clipping/companion features are browser-verified. See also the [QA specialist's product roadmap](docs/QA_WORKSPACE_ROADMAP.md) for prioritized research, usability and reliability work. See [TraceCue 0.5 first-use release notes](docs/RELEASE_0_5.md) and [Chrome Web Store readiness](docs/WEB_STORE_READINESS.md).

## Multi-actor QA scenarios (0.6 Phase 1)

Test the same authorized application as an administrator, student, lecturer or other role—even from different computers—using one shared **scenario ID** and anonymized tenant/actor labels in the extension sidebar. Each completed recording retains its original video and EV references. Import several exported session JSON files in Studio's **Multi-actor scenarios** workspace to compare captured signals per role, with **tenant isolation enabled by default**.

For immediate evaluation, open [Studio](https://tracecue-studio-preview.vercel.app/app.html) and click **Try fictional multi-actor example**. The four fictional sessions include three actors in school A and one in school B. Cross-tenant comparison is a deliberate, confirmed local action; no real-time cloud collaboration, live device orchestration or automatic credentials are implied. See [0.6 Phase 1 notes](docs/RELEASE_0_6.md).

## Hackathon progress

This is **not** yet a completed competition entry. The new companion and clip workflow need Chrome acceptance testing. Keep the final public code, required source license, Firebase App Check setup, local/cloud inference demonstration, demo video, and Devpost submission requirements in view. Contest rules: https://firebasehybridaihackathon.devpost.com/rules.
