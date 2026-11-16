# Changelog

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
