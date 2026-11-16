# TraceCue 0.4 — Evidence Search & QA Intelligence

**Status:** Development branch implementation, not a verified Chrome release. Updated November 16, 2026.

## Changes delivered in code

1. **Ask TraceCue:** deterministic local log search such as "Where did HTTP 500 happen?" Returns original EV identifiers, timestamps, sanitized details, actual HTTP codes and video seek actions. Nearby clicks are correlated context, not proven causes.
2. **Issue-scoped AI:** selecting a marked issue narrows Firebase prompts and GitHub drafts to that issue's edited video interval, retaining original EV identifiers. On-device text uses ONLY_ON_DEVICE. Cloud text requires consent.
3. **Video questions:** user manually selects and reviews an exported WebM or MP4 clip (maximum 12 MB), then separately authorizes cloud-only Gemini analysis. On-device video inference is unsupported; source is checked.
4. **Screenshot annotation:** capture current frame from imported full video, add arrows/rectangles/opaque masks, undo and download PNG. The original video remains unchanged and possibly sensitive.
5. **Durable recording recovery:** IndexedDB timeslice journaling and local event checkpoints. Recover interrupted sessions through a dedicated UI. Salvaged WebM may be incomplete or unplayable.
6. **Local session history:** search stored sessions by title, origin and issue; reopen them. Possible recurring failure signatures are suggestions, not verified duplicates.
7. **Suggestions and privacy:** recent captured failures can suggest issue titles; only a tester can save markers. Verbose console log/info/debug is off by default, available by explicit opt-in.

## One-pass Chrome acceptance test (not yet performed)

1. Pull feat/tracecue-foundation and reload the unpacked extension at chrome://extensions.
2. Start Studio: cd studio ; npm install ; npm run dev. Open http://127.0.0.1:5173/qa-fixture.html.
3. Start a recording through the sidebar, confirm the in-tab mascot disappears before video starts.
4. Trigger a failed save, name the issue, trigger name mismatch, mark again. Stop. Verify one complete video and two separately editable clips with correct log windows.
5. Inspect and download saved WebMs; trim a clip and confirm stale clip invalidation, regeneration and exact evidence scope.
6. Import JSON + WebM into Studio. Search "Where did HTTP 500 occur?". Select first issue then second; confirm EV IDs and timing remain accurate and unrelated failures are excluded.
7. Invoke on-device and cloud text AI separately on a selected issue. Check verified SDK inference source and that hypotheses are not claimed as root causes.
8. Capture a video frame, draw rectangle/arrow/mask, download PNG and verify the original video remains unmodified.
9. Export a small private-data-free clip and explicitly consent to cloud video analysis. Verify no unapproved upload.
10. In a non-sensitive test, interrupt capture, reopen Recover interrupted, inspect recovery warnings and video playability.
11. Open Session library, find both issues and inspect optional recurrence hints.
12. Repeat recording with verbose console logging explicitly enabled; confirm the default off state otherwise.

## Safety and outstanding scope

- Local evidence search cannot answer server root causes that were never captured.
- Video is not sent during local search or ordinary AI log investigation.
- Network capture excludes raw request/response bodies, cookies and authorization headers.
- Exported PNG privacy masks do not redact the full video.
- Interrupted recordings may be truncated or unplayable; lost frames cannot be reconstructed.
- The existing hosted fictional demo has no verified production Firebase App Check configuration for visual video inference.
- OAuth integrations, team roles, multi-browser capture, signed portable evidence bundles and real Playwright execution remain separately scoped work. They are not finished in 0.4.

## Related documents

- [Full QA product roadmap](QA_WORKSPACE_ROADMAP.md)
- [Chrome acceptance guide](V2_WORKFLOW.md)
- [Firebase video support](https://firebase.google.com/docs/ai-logic/analyze-video)
- [Firebase on-device capabilities](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started)
