# Architecture and product boundaries

## Core principle

TraceCue is an evidence-first QA companion. It does not own sprint planning, engineering tickets, or team chat. It captures authorized testing sessions and turns them into reviewable evidence and AI-supported investigation.

~~~text
[Tester]
  | explicit user action
[Chrome Companion]
  | tabCapture video in offscreen document -> local IndexedDB
  | interaction categories & selected Chrome debugger diagnostics -> local chrome.storage
  | export JSON / Markdown / .webm
  v
[Studio] -- import JSON and review local event timeline
  |-- ONLY_ON_DEVICE via Firebase AI Logic -> browser-local inference
  |-- consent gate + ONLY_IN_CLOUD via Firebase AI Logic -> cloud inference
  |-- export reviewed investigation
  v
[Existing tools: GitHub / Jira / Slack / Discord / email] (planned adapters)
~~~

## Data contract: tracecue-session-v1

- Identity: id, title, tested origin, startedAt, stoppedAt.
- Local recording: video stored under session id in extension IndexedDB.
- Diagnostics: array of timestamped events with limited structured metadata.
- Environment: browser user-agent and platform.
- Reviewer notes: optional local text field, present in exported JSON.
- AI analysis: separate artifact, with SDK-reported inference source; never fabricate local/cloud status.

## Trust boundaries

1. User-facing browser content is untrusted and can contain secrets or prompt injection text.
2. The extension can only start on a user-selected HTTP(S) tab; no background global browser access.
3. Chrome debugger is powerful; only enable for explicit QA sessions.
4. A video can contain sensitive pixels even when event text is minimized.
5. Studio preview is local and offline-capable after asset load; Firebase inference is opt-in and separate.
6. Cloud inference is *never* an automatic fallback for a private report.
7. AI report is an analytical suggestion and not evidence that a bug was reproduced.

## Design decisions

- Keep extension and Studio separate to avoid mixing debugger permissions and Firebase App Check attestation.
- Prefer direct API capabilities supported by Chrome 116+ rather than a custom screen encoder.
- For now, exchange reports via JSON export/import. Authenticated Hub sync is later.
- Root license Apache-2.0 and no GPL component code merged.
- Default AI prompt omits URLs, raw console texts, request headers/bodies and videos.

## Known technical risks

- Browser gestures and tab capture permissions in real Chrome; verify on user-owned Windows 11 development machine.
- MV3 service-worker suspension and long-session storage semantics; recover serialized session state, but full long-session behavior remains unverified.
- DevTools and chrome.debugger attachment are mutually disruptive.
- Tab navigation and privacy redaction need further hardening.
- No claim of end-to-end tested Firebase local/cloud execution until credentials and App Check are configured.
