# TraceCue 0.5 — First-Use Experience & Launch Readiness

**Development branch:** \`feat/tracecue-foundation\`  
**Milestone:** First-use product journey, distribution transparency, and remote preparation before live browser acceptance.

## Implementation

1. **Marketing entry point:** The Vite site now serves a responsive product homepage at \`/\`, with accessible navigation, live fictional evidence preview, interactive four-step workflow, feature explanation, FAQs, and honest Chrome preview download guidance.
2. **Studio remains intact:** Existing Studio is at \`/app.html\`. \`/app.html?demo=1\` loads the fictional two-issue session without an account, Chrome extension, credentials, or cloud AI.
3. **First-use onboarding:** A short, skippable guide introduces capture, evidence, investigation and verified handoff. The guide can be reopened; it never auto-records or auto-uploads.
4. **AI decision guide:** Studio distinguishes private on-device analysis from consent-based cloud inference. The local model readiness check is explicitly user-triggered; it never silently falls back to cloud.
5. **Local extension → Studio transfer:** From the extension's video reviewer, testers can explicitly approve and initiate a browser-to-browser handoff. A fresh 192-bit token binds a one-time session to a known target origin; the target asks for confirmation before import. Reports are sanitized best-effort. WebM transfer is capped at 80 MB; larger videos still require manual import. No server transfer occurs during this handoff.
6. **Distribution preparation:** Chrome-compatible extension icon sizes, working copy for Store review, permission explanations, a public preview privacy notice, and accurate install steps.

## Known limits

- The public marketing site is a developer preview. **No Chrome Web Store listing or account sign-up exists yet.** Do not change this language until real launch conditions are met.
- Only the configured local origin and stable TraceCue Vercel preview origin are allowed for browser handoff. The popup handshake can fail in some Chrome configurations; manual JSON + WebM import remains available.
- Browser-window transfer requires user authorization, the extension reviewer to remain open, and a genuine destination Studio page. It does not redact the video.
- Firebase AI cloud inference on a deployed host still requires production App Check domain and public Firebase configuration, plus live tests.
- New clipping, video synchronization, recovery, annotated screenshots, and local transfer require **desktop Chrome acceptance tests**. CI-only success cannot verify their behavior.
- Mandatory authentication, cloud sync, teams, billing, and OAuth publishing are deferred until they provide clear value and security foundations.

## First-use acceptance checklist (execute on Chrome desktop)

1. Open the website root and verify responsive landing navigation, interactive stage preview, privacy disclosures, working demo link, and **no fake Chrome Web Store install link**.
2. Open \`/app.html?demo=1\`; confirm the fictional two-issue session loads automatically, no login is required and AI doesn't claim results without a real Firebase call.
3. Open \`/app.html\` normally in a fresh browser profile. Confirm the short onboarding can be completed, skipped, and reopened from the sidebar.
4. Choose **Check my local AI readiness**. Confirm accurate Chrome availability states and no cloud fallback.
5. Record an authorized fixture session from the extension sidebar. Confirm tab video excludes the in-page companion widget.
6. Mark two titled issues, stop, and open the review page. Confirm continuous original WebM, separate clips and real event timestamps.
7. Choose Continue in Studio, explicitly approve local transfer, select the running local Studio, and confirm the new tab asks before importing. Verify both JSON and <=80 MB WebM arrive. Confirm no network upload occurred.
8. Repeat from extension reviewer to the approved hosted preview, checking any browser popup restrictions and fallback behavior.
9. Test video >80 MB and rejected/expired handoff: show an honest error/manual import path rather than falsely claiming the video arrived.
10. Search logs and run strictly device/cloud AI with separate opt-ins in a configured local Studio.
11. Test interrupted recording recovery and deletion in a disposable test browser profile; no real customer data.
12. Inspect Chrome developer tools, build logs and privacy changes. Fix errors **before** Chrome Web Store submission.

## Release gates (not yet satisfied)

- Tested end-to-end recording → mark → review → import → investigate → export on actual Chrome.
- Verified WebM playability, local handoff, privacy and large-session behavior.
- Production-hosted Firebase AI Logic with authorized App Check domain.
- Store screenshots/policies review and approved Chrome Web Store listing.
- A real-user usability session demonstrating that first useful bug report can be completed without guidance.

Related: [Install guide](INSTALL.md) · [Store readiness](WEB_STORE_READINESS.md) · [Security notes](SECURITY.md) · [QA roadmap](QA_WORKSPACE_ROADMAP.md).
