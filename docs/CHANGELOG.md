# Changelog

## 2026-11-16 — Controlled fixture traceability

- Added safe, explicitly named data-testid capture without logging user input values.
- The QA fixture now displays counts of triggered scenarios so a missing warning can be diagnosed.
- Redacted extension IDs, bearer tokens and query parameters in newly recorded diagnostic strings.
- Added automated tests for sanitization; real Chrome behavior after the patch is unverified.


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
