# Build sequence — November 16–30, 2026

The competition deadline is 2026-11-30 23:00 WAT. This schedule is ambitious; working evidence flow comes before decorative scope.

## Track A — Reliable capture

- Verify Chrome extension action, offscreen recording, debugger, event observer and markers on the user's actual Chrome environment.
- Address cross-origin navigation and long-session recovery.
- Add explicit recording permissions UI, retention/deletion, better redaction and self-test mode.
- Evaluate rrweb for DOM replay, subject to privacy design.

## Track B — Analysis / Firebase

- Configure Firebase project, Gemini Developer API provider and App Check.
- Verify ON_DEVICE and IN_CLOUD from actual SDK results on the target machine.
- Link analysis statements to timestamped events.
- Add missing-reproduction-data indicators and draft Playwright test scaffolds.

## Track C — Studio and handoff

- Full session list, persistence and searchable timeline.
- Video + events synchronized on one timeline.
- Local issue draft and GitHub Issues outbound integration first.
- Exports to Markdown/JSON and share via email; Jira, Slack and Discord afterward.

## Competition submission gate

- Public Apache-2.0 code and documented new vs reused work.
- Verified run of real local and cloud Firebase inference using supported Chrome.
- App Check enforced and production-ready for a deployed test host.
- Three-minute public demonstration showing actual recordings and both inference modes.
- Tested accessible project link, explanation of limitations, and Devpost entry.

## Not yet implemented

Authenticated teams, hosted storage, advanced multi-project metrics, Playwright automatic replay, third-party OAuth integrations, CI deployment. Never label these features complete before implementing and testing them.
