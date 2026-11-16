# TraceCue — QA Companion Product Specification & Experience Roadmap

**Direction:** A QA-first capture, investigation and handoff companion. Not a duplicate of Jira, Linear, or project management software.

**Product promise:** *Record once. Explain every issue with the evidence around it.*

Last reviewed: November 16, 2026. This document identifies current development status and open implementation work; no future items below should be represented as already shipped.

## Primary user workflows

### A. Prepare a test
- Identify environment (local/staging/production), application build, test account, viewport and intended test charter.
- Use low-friction controls in a native Chrome sidebar or a separate capture-excluded window. Never inject UI into a recorded webpage.
- Confirm what signals may be captured, with privacy guidance and optional capture categories.
- Begin one continuous authorized recording. Show unambiguous elapsed time and recording status.

### B. Capture issues without breaking focus
- Name each issue at the moment it is noticed; allow pre-marker lookback and +0/5/10s post-marker context.
- Mark multiple issues during a single recording. Preserve a stable marker ID and the full continuous video.
- Use keyboard-first, one-click marker flows and unobtrusive feedback outside the captured tab.
- Preserve timestamps and record sanitized browser technical signals. No silent background recording.

### C. Review each issue as a separate investigation
- Show full recording and linked per-issue video; edit start/end after recording.
- Console errors, warnings, info, debug; XHR/fetch response metadata and failures; interactions, issue markers and environment hints **must follow the edited video window**.
- Search, filter, count, and click-to-seek all captured technical signals. Don't silently truncate exports.
- Capture tester notes, expected/actual behavior, reproduction steps, severity and reproducibility **per issue**.
- After trim edits, invalidate stale saved WebMs and regenerate; unchanged full recording is source of truth.
- An issue without console entries must say "none captured," not invent errors.

### D. Investigate, verify and hand off
- Explicitly choose Firebase AI Logic on-device or cloud; cloud requires reviewed input and user consent.
- Separate facts from AI interpretations. Quote only EV IDs that exist and mark AI steps as tentative.
- Provide missing-information prompts to improve reproduction, and Playwright scaffolds marked NOT EXECUTED.
- Require a human verification/consent checklist before handing off a private issue.
- Copy/download one issue's video, logs and structured report; support repository integrations with explicit authorization, rather than replacing the team's tools.

## Capability inventory & status

| Area | Capability | Current status | Next acceptance test |
| --- | --- | --- | --- |
| Capture | Continuous one-tab WebM | Existing Chrome-tested implementation | Check mascot absent from all frames |
| Capture | Sidebar + floating window | Built; browser acceptance pending | Start/stop, multi-origin and reload |
| Capture | Multiple independently titled markers | Built; tests | Two failures in one session |
| Capture | 0/5/10s post-marker context | Built; tests | Stop early, verify clamps |
| Review | Edit exact video in/out points | Built; tests on time math | Scrub, preview, regenerate |
| Review | Independently saved WebM per issue | Built; Chrome acceptance pending | Play/download edited clips |
| Review | Linked console/network/action logs | Built; unit-tested | Confirm actual Chrome events |
| Review | Search/filter + full log export | Built | Long session evidence scoping |
| Review | Severity/repro/expected/actual | Built | Edit and export one issue |
| Investigation | Firebase cloud and on-device | Text modes previously verified locally, video cloud questions implemented but not live verified | Test video App Check and cloud-only model |
| Investigation | Per-issue AI analysis | Built: selected marker scopes prompt, original EV IDs preserved | Verify real model citations remain within selected issue |
| Investigation | Evidence completeness | Built | Missing/uncited step warnings |
| Handoff | Per-issue MD/JSON and copy | Built | Browser clipboard and files |
| Handoff | Manual GitHub Issues | Built; GitHub API test separate | Human submission from Studio |
| Handoff | OAuth publishing to GitHub/Jira/Linear | Not implemented | Explicit auth and redaction |
| Deploy | Static fictional Studio demo | Vercel READY | Production Firebase domain/env |
| Reliability | Incremental crash-resistant video storage | Built: local chunk journal and explicit partial recovery, Chrome pending | Force-close and inspect recovered video |

## TraceCue 0.4 implementation update (November 16, 2026)

Built in the development branch, subject to real Chrome acceptance unless otherwise indicated:

- Deterministic evidence search such as **"Where did HTTP 500 occur?"**, returning EV IDs, captured times and a seekable video moment. Nearby actions are chronological correlations, **not proven causes**.
- Issue-scoped Firebase AI prompts excluding unrelated issue windows with preserved EV IDs.
- Cloud-only Gemini video questions for an **explicitly selected, reviewed ≤12 MB WebM/MP4** under separate upload consent.
- Local video-frame screenshot annotation (arrows, rectangles, opaque masks, undo and PNG export).
- Durable MediaRecorder chunk journaling and locally checkpointed event reports with an **interrupted-session recovery** page. Partial playback is unverified.
- Searchable local history, possible recurrence fingerprints, opt-in verbose console data, and tester-controlled error-marker suggestions.

Still required: Chrome acceptance of media capture and recovery, privacy/audit hardening for annotations, live App Check production-domain video AI verification, OAuth-based integrations, team permissions, large-session quotas, multi-browser support, actual Playwright execution, and portable signed evidence bundles.

## Priority P0 — make today's recording workflow dependable

1. Desktop Chrome acceptance of sidebar and popup recording controls, and proof of overlay-free videos.
2. Correct start/stop timing; exact clip boundaries; stable MediaRecorder output; correct saved WebM metadata and independent deletion.
3. Robust evidence timing, including repeated log entries crossing a clip window, precise network statuses and event source attribution.
4. Strong privacy review before export, capture category toggles, credentials filtering, and honest completeness/error states.
5. One-click fictional example including two named issues; no actual user data.
6. AI source-verification regression tests so ONLY_ON_DEVICE can never silently use cloud.

## Priority P1 — make the QA specialist *enjoy* it

1. **One-click screenshot at playhead + annotation** (arrows, rectangles, blur/mask, note); editable evidence cards.
2. **Scoped AI investigation per issue**, with detected events and missing evidence; generate/verify one set of reproduction steps per marker instead of mixing multiple defects.
3. **Suggested issue markers**, based on real errors or request failures, shown as suggestions requiring tester confirmation (no auto-submission).
4. **Context-rich keyboard workflow**: mark issue, rename, navigate forward/back between incidents, and confirm clip using shortcuts.
5. **Useful test session history**: local searchable recordings and issues, tags, environment/build metadata, and ability to reopen unfinished drafts.
6. **Practical Playwright output**: selectors and steps verified against captured user interactions, code scaffold clearly marked unexecuted, then test-run integration later.
7. **Duplicate/recurrence review**: fingerprint by sanitized endpoint/error/selector + build; human approval to link matches.

## Priority P2 — team and power-user workflow, not another project manager

1. Secure opt-in GitHub Issues, Linear, Jira, Slack and email handoff with clear permissions, idempotency and audit trail.
2. Portable evidence bundle with manifest, per-issue video, console/network logs, media metadata and redaction review.
3. Team spaces, roles, retention controls, review/approve/share settings and lightweight QA review states only.
4. Multi-browser/device captures (Chrome/Edge first), reproducibility comparison across environments and builds.
5. Exploratory test charters and minimal test-run notes; integrate existing test-case suites rather than clone them.
6. Large-session reliability: stream MediaRecorder chunks into durable local storage, browser restart recovery, capture quotas, session compaction.
7. Local search and relevance ranking across historical QA evidence; must be opt-in and not silently process unrelated private sessions.

## UX principles

- **Quick to begin:** one clear Start; never start capture merely by opening TraceCue.
- **One full source, many focused incidents:** any clipped artifact links to its original full-session ID.
- **Human-in-control:** adjust time windows, redact, verify and approve before sharing.
- **No fabricated certainty:** AI-proposed defects, severity suggestions and reproduction steps are labeled and must be verified by a tester.
- **Technical transparency:** show real captured events with provenance, source confidence and timestamps; explain gaps (dropped events, unsupported APIs, inaccessible page origins).
- **Local-first privacy:** don't silently send video, credentials, unreviewed network payloads or raw console objects to cloud AI or connected tools.
- **Polished rather than crowded:** keyboard accessibility, consistent spacing/typography, search and filters, practical defaults and minimal interruptions.

## Competitive reference points (not feature-parity claims)

- Jam: https://jam.dev/ — quick video/technical-context capture and developer handoff.
- Bird Eats Bug: https://birdeatsbug.com/feature/browser-extension — browser recording and technical logs, including replay.
- Replay.io: https://docs.replay.io/reference/replay-devtools/overview — significantly deeper replayable browser runtime than a standard video recorder; don't claim TraceCue offers runtime time travel.
- Marker.io: https://marker.io/features — visual issue reporting and technical context.

**Differentiator to prove:** one continuous, consent-based capture with many independently titled, editable, technically synchronized issue packages, combined with explicitly selected local/cloud investigation and human QA verification.

## Verification discipline

GitHub Actions tests and Studio builds validate syntax and selected processing rules. They **do not prove** Chrome tab capture, WebM encoding, App Check on a deployed domain, cross-origin transitions or actual browser timing. Document a real Chrome recording for each milestone before using "verified" in a public submission.
