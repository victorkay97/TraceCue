# TraceCue

**Every bug has a trail.** TraceCue is a permission-based QA evidence and intelligence platform: a Chrome companion captures an authorized testing session; TraceCue Studio helps reviewers inspect what happened, understand defects, and send actionable reports to their existing engineering tools.

> **Status:** Active development for Firebase #BuildHybridAI 2026. Tab recording and both Firebase inference sources (`on_device`, `in_cloud`) have been verified in Chrome. The new floating companion, issue-clip exporter and synchronized Studio video inspector require their own Chrome acceptance tests.

## Product boundaries

TraceCue **is not** a Jira, Linear, or ClickUp clone. It owns **sessions, evidence, QA investigations, and quality insights**. Tickets, assignments, sprints, and delivery stay with the teams' existing tools.

## Repositories / components

- **extension/** — Chrome MV3 floating mascot and native sidebar, permissioned full-session recording, timed issue markers, local WebM clip generation, browser diagnostics and video reviewer.
- **studio/** — Vite workspace for importing session JSON and full WebM, seeking synchronized timeline events, reviewing AI investigations, producing a skipped Playwright regression scaffold and preparing human-verified GitHub issue drafts.
- **tests/** — capture/report unit tests.
- **docs/** — system design, security boundaries, setup and hackathon progress.

## Development

Chrome extension: open `chrome://extensions`, enable Developer mode, select **Load unpacked**, and choose the **extension** directory. Click TraceCue's toolbar icon on an authorized HTTP(S) tab to open its sidebar and floating in-page mascot. Start and stop the recording explicitly; mark the preceding 15/30/60/120 seconds as independent issue clips. The viewer keeps the full session intact and renders clip WebMs locally; clip rendering plays the selected interval in real time. Local recordings never upload themselves.

TraceCue Studio (Node 20+):

~~~powershell
cd studio
Copy-Item .env.example .env.local
npm install
npm run dev
~~~

Open the Vite URL and click **Try fictional demo**, or import the redacted JSON plus the full WebM from the extension. Click any evidence event to seek to the matching video moment. For a controlled recorder test, open `http://127.0.0.1:5173/qa-fixture.html` while Studio's Vite dev server is running; see the setup guide. To enable AI, configure your own Firebase web app with Firebase AI Logic and App Check. See [the setup guide](docs/SETUP.md).

## Privacy rules

Only test applications you are authorized to inspect. Captured tab video can visibly include confidential information, and console diagnostics can inadvertently contain secrets. Use disposable test accounts, review recordings before sharing, and never record passwords, payment cards, or real customer records. The extension does not transmit evidence to a server. Cloud AI requires a separate explicit consent step and receives a minimized, reviewable text payload.

## Licensing

Apache License 2.0; see [LICENSE](LICENSE). See [third-party decisions](docs/THIRD_PARTY.md) before reusing external code.

## TraceCue Studio public demo

[Open the fictional Studio demonstration](https://tracecue-studio-preview.vercel.app/). Vercel confirmed that the development-branch build is ready. The public demo includes fictional QA evidence and no private recordings. It does **not** yet have production Firebase credentials or App Check domain registration; local Firebase hybrid inference was verified separately. See [the 0.2 workflow](docs/V2_WORKFLOW.md) before claiming the newly added clipping/companion features are browser-verified.

## Hackathon progress

This is **not** yet a completed competition entry. The new companion and clip workflow need Chrome acceptance testing. Keep the final public code, required source license, Firebase App Check setup, local/cloud inference demonstration, demo video, and Devpost submission requirements in view. Contest rules: https://firebasehybridaihackathon.devpost.com/rules.
