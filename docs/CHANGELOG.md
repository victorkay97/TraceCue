# Changelog

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
