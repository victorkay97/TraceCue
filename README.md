# TraceCue

**Every bug has a trail.** TraceCue is a permission-based QA evidence and intelligence platform: a Chrome companion captures an authorized testing session; TraceCue Studio helps reviewers inspect what happened, understand defects, and send actionable reports to their existing engineering tools.

> **Status:** Active development for Firebase #BuildHybridAI 2026. Initial foundation only. Browser recording and live Firebase inference must be validated in Chrome before making hackathon functionality claims.

## Product boundaries

TraceCue **is not** a Jira, Linear, or ClickUp clone. It owns **sessions, evidence, QA investigations, and quality insights**. Tickets, assignments, sprints, and delivery stay with the teams' existing tools.

## Repositories / components

- **extension/** — user-triggered Chrome MV3 QA companion, local tab video, browser events, console and network diagnostics, local evidence viewer.
- **studio/** — Vite browser workspace for importing JSON evidence, reviewing a timeline, and explicitly invoking Firebase AI Logic on-device or in the cloud.
- **tests/** — capture/report unit tests.
- **docs/** — system design, security boundaries, setup and hackathon progress.

## Development

Chrome extension: open chrome://extensions, enable Developer mode, select **Load unpacked**, and choose the **extension** directory. Click its icon on a non-sensitive HTTP(S) application you are authorized to test to start/stop capture. Local recordings never upload themselves. Use the optional keyboard shortcut to mark a bug during capture.

TraceCue Studio (Node 20+):

~~~powershell
cd studio
Copy-Item .env.example .env.local
npm install
npm run dev
~~~

Open the Vite URL, import a TraceCue session JSON from the extension viewer, and inspect the local timeline. To enable AI, configure your own Firebase web app with Firebase AI Logic and App Check. See [the setup guide](docs/SETUP.md).

## Privacy rules

Only test applications you are authorized to inspect. Captured tab video can visibly include confidential information, and console diagnostics can inadvertently contain secrets. Use disposable test accounts, review recordings before sharing, and never record passwords, payment cards, or real customer records. The extension does not transmit evidence to a server. Cloud AI requires a separate explicit consent step and receives a minimized, reviewable text payload.

## Licensing

Apache License 2.0; see [LICENSE](LICENSE). See [third-party decisions](docs/THIRD_PARTY.md) before reusing external code.

## Hackathon progress

This is **not** yet a completed competition entry. Keep the final public code, required source license, Firebase App Check setup, local/cloud inference demonstration, demo video, and Devpost submission requirements in view. Contest rules: https://firebasehybridaihackathon.devpost.com/rules.
