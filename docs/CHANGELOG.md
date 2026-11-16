# Changelog

## 2026-11-16 — TraceCue 0.5 First-Use Experience & Launch Readiness

- Added a dedicated responsive landing page with an interactive product journey, fictional demo, privacy disclosure, FAQs, and honest developer-preview installation links.
- Preserved Studio at `/app.html`, with automatic fictional sample import at `/app.html?demo=1`.
- Introduced skippable first-run onboarding and a manual local Chrome AI readiness check; Firebase cloud analysis still requires distinct consent.
- Added explicit extension-to-Studio browser-window handoff: a one-time origin-bound 192-bit token, review-before-transfer, confirmation-before-import, no server upload, and <=80 MB WebM with manual fallback.
- Created Chrome-compatible 16/32/48/128 icons, tests for PNG correctness, a developer installation guide, release acceptance plan, and Web Store readiness checklist.
- Public Web Store publishing, user authentication, cloud sync, team roles and full Chrome acceptance testing remain incomplete.


## 2026-11-16 — Issue clip editor and time-scoped diagnostic workspace

- Every marker now supports selectable 0/5/10-second post-capture buffer, with 5 seconds selected by default; older markers retain a zero-second buffer.
- After recording, a tester can edit each issue's start/end, preview the range, reset to marker, and regenerate only the affected clip. The full recording is unchanged.
- Captures sanitized console log/info/debug in addition to errors and warnings and summarizes fetch/XHR successes/failures with safe metadata (not bodies or headers).
- Each clip's console/network/actions/environment inspector is time-aligned, searchable, filterable and synchronized to playback.
- Long event lists paginate in the viewer, while each isolated issue export includes all captured events within the edited interval, within the session's event cap.
- Added per-issue severity, reproducibility, expected/actual fields, manual reproduction notes, environment details, and copyable Markdown drafts.
- Expanded regression tests for post-buffer duration, edit boundaries, grouped console times, redaction and untruncated exports.
- Added a comprehensive [QA product experience roadmap](QA_WORKSPACE_ROADMAP.md) informed by current QA capture tools.
- Chrome WebM recording and replay acceptance is still pending; no claim of confirmed video playback.


## 2026-11-16 — Clean recording controls and individually titled QA clips

- Chrome tab capture includes webpage overlays; recording now removes TraceCue's injected in-page mascot before MediaRecorder starts and suppresses reinjection until video has stopped. Capture fails closed if exclusion cannot be confirmed.
- Recording controls remain available in the native Chrome side panel and an optional separate popup window positioned near the browser's lower-right corner. Standard Chrome windows are not guaranteed always-on-top.
- Live sidebar now lists the title, timestamp, and lookback for each issue marker. A new mark saves a distinct issue record and clears the title input for the next one.
- Local viewer supports per-issue title editing, issue-specific tester notes, and independently downloaded WebM, Markdown, and JSON exports containing time-scoped, minimized diagnostics.
- Added test coverage for isolated issue windows, redaction, and noncolliding title-based clip filenames.
- Added a second fictional QA fixture scenario (name mismatch) to exercise two issues in one uninterrupted recording.
- **Chrome acceptance still required:** inspect actual saved video to confirm zero TraceCue overlay frames; verify sidebar/capture permissions, two saved clips and full-session continuity.


## 2026-11-16 — TraceCue 0.2 recording companion and deploy demo

- Added Chrome side panel and standalone popup-window recording workspace, plus a custom in-page floating mascot.
- Record Start/Stop remains user-initiated; markers store title, timestamp, ID and a 15/30/60/120-second lookback.
- Added local standalone WebM clipping derived from the original continuous video without overwriting it, with per-clip playback/download and storage cleanup.
- Added Studio full-WebM local import, event seek, playback highlighting and marker jumps.
- Added explicit test preconditions, expected/actual results, retest, step review, privacy and authorization checks before GitHub issue handoff.
- Verified synthetic GitHub issue API round-trip; test issue #2 created and closed.
- Created Vercel project tracecue-studio-preview and confirmed static Vite deployment READY, with a one-click fictional sample.
- Added extended CI syntax coverage for companion and clipping scripts and detailed v0.2 Chrome acceptance instructions.
- **Not yet verified in user Chrome:** new sidebar gestures, floating companion interaction and playable separate WebM clips. Public Firebase App Check domain/env not yet configured.


## 2026-11-16 — Both hybrid inference modes verified in Chrome

- Tester verified Firebase AI Logic `on_device` in TraceCue Studio using Chrome's downloaded local language model.
- Earlier `in_cloud` verification and the new `on_device` result establish both explicitly selected inference paths on the development machine.
- Local model generated an issue summary and captured technical observations; its proposed reproduction steps lacked direct EV citations and were correctly flagged as incomplete.
- Both inference modes still operate on a fictional sample QA session, not a verified production application defect.
- Added optional GitHub Issues draft handoff: reviewable, minimized text is copied locally on explicit action. Opening a destination GitHub issue form does not prefill or transmit any report content.
- Added validation tests for repository URL restrictions and evidence-only issue draft content. OAuth publishing is not implemented.


## 2026-11-16 — Live cloud inference verified and investigation quality pass

- User verified a real Firebase AI Logic `in_cloud` response displayed inside TraceCue Studio.
- Evidence-linked tentative reproduction steps, missing-information findings and regression suggestions rendered successfully.
- Derived technical signals separately from structured session metadata; model output is no longer treated as their source.
- Missing model "observed" fields remain clearly marked as missing rather than filled with invented text.
- AI confidence now reads as a self-assessment, not a reliability metric; evidence completeness flags uncited steps and unanswered questions.
- Added regression tests for these data-quality rules.
- On-device inference is the next live verification target.


## 2026-11-16 — First Firebase cloud response: inference source fix

- A live Firebase cloud analysis returned SDK `in_cloud`, but TraceCue erroneously compared it against uppercase `IN_CLOUD` and discarded the response.
- Added strict source validation for the documented lowercase `in_cloud` / `on_device` values.
- Added regression tests that accept correct sources and reject incorrect/fallback sources.
- Cloud inference is indicated by the reported source, but visible investigation output still needs verification after this fix.


## 2026-11-16 — Evidence-linked Firebase Intelligence

- Added stable evidence reference IDs, purpose-limited AI prompts, an explicit environment-log inclusion setting and clickable evidence links.
- Parsed and validated structured AI investigations without inventing absent references or treating suggested tests as executed.
- Added a raw AI response viewer alongside reviewer-friendly sections.
- Enforced strict Firebase ON_DEVICE and IN_CLOUD response-source checks.
- Added localhost-only Firebase App Check debug-provider setup and documented the required user-side Firebase configuration.
- Automated checks test evidence processing and Studio builds; live Firebase inference remains unverified.


## 2026-11-16 — Real fixture evidence provenance correction

- Uploaded report proved all three fixture actions ran, including four warnings grouped into one event.
- Improved source attribution to favor real script callsites over extension-owned observer contexts when they disagree.
- Marked page-script classification with a callsite source confidence hint; no claims of absolute attribution.
- Fixed sanitized JSON export to keep session IDs stable instead of replacing numeric IDs.
- Added regression tests for page/extension attribution conflicts.
- Chrome extension behavior after this patch requires a new local validation run.


## 2026-11-16 — Controlled fixture traceability

- Added safe, explicitly named data-testid capture without logging user input values.
- The QA fixture now displays counts of triggered scenarios so a missing warning can be diagnosed.
- Redacted extension IDs, bearer tokens and query parameters in newly recorded diagnostic strings.
- Added automated tests for sanitization; real Chrome behavior after the patch is unverified.
- Viewer and exported JSON/Markdown now redact sensitive text from earlier sessions, while keeping the local original unchanged.


## 2026-11-16 — Provenance-aware browser diagnostics

- Confirmed from a tester screenshot that some captured exceptions referenced Chrome extension scripts rather than the test application.
- Added CDP execution-context and script-origin hints for console messages, exceptions and network events.
- Separated browser-extension/isolated-world diagnostics into Environment without deleting the evidence.
- Stopped persisting raw Chrome extension IDs as URL fields in new sessions.
- Preserved legacy classification for older session exports.
- Added a controlled diagnostic classification unit test suite.
- Updated the Chrome service worker to run as an ES module.
- Real Chrome validation of this new provenance patch is still required.


## 2026-11-16 — Second live capture and evidence triage

- User verified a 41-second recording, 6.6 MB locally stored video, 24 grouped timeline events and 83 occurrences on an authorized test session.
- Separated likely Chrome extension messaging errors from application failures as environment diagnostics, retaining source hints and raw messages for review; classification is heuristic, not attribution.
- Added legacy-report classification so earlier session evidence remains useful without re-recording.
- Handled rejected content-script messages after extension reload and acknowledged extension messages.
- Added an Environment filter in the recording viewer and a dedicated Studio metric.
- Added tester-editable issue title, separate from the website's page title, so browsing sessions are not automatically reported as defects.
- Extended unit tests for environment noise and issue labeling.
- Live Firebase inference remains unverified.

## 2026-11-16 — First live capture feedback

- The user verified an authorized recording session rendered in Chrome: saved tab video and timestamped diagnostic events.
- Corrected console severity handling so repeated warnings are not presented as errors.
- Group identical diagnostic messages within a short window while retaining occurrence counts.
- Added video-start timestamp and click-to-seek timeline events, with an approximate fallback for older sessions.
- Added timeline category filters and separated errors from warnings in Studio.
- Added regression tests for legacy sessions and grouped warnings.
- Real Firebase local/cloud inference remains unverified.

## 2026-11-16 — Foundation

- Established TraceCue identity, Apache-2.0 license, and GitHub repository.
- Added Manifest V3 authorized tab recorder, offscreen video, limited events and diagnostic capture.
- Added issue marker shortcut and local evidence viewer/export.
- Added Studio with timeline, minimized evidence prompt and explicit Firebase local/cloud modes.
- Added a deliberately skipped Playwright regression-test scaffold export for engineer review.
- Added stop-on-cross-origin navigation and local recording deletion.
- Added security and technical documentation, fictional sample session and unit tests.

**Validation status:** Unit tests and source checks are planned; Chrome capture, deployment and Firebase inference are not yet verified in this GitHub environment. Do not claim a completed hackathon submission.
