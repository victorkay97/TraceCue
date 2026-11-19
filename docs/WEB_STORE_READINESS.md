# TraceCue Chrome Web Store readiness

**Status: preparation only — do not submit until desktop Chrome testing and privacy review pass.**

## Listing concept (copy to review)

**Product name:** TraceCue — QA Companion  
**Category:** Developer Tools / Productivity (confirm currently available options in Chrome Web Store dashboard)  
**Short description:** Capture QA sessions, mark bugs, and inspect synchronized video, network, and console evidence.  
**Expanded description (working draft):**

> TraceCue helps software testers understand and communicate bugs without rebuilding the testing session from memory. Record an authorized browser tab, mark independently titled issues, and review the video alongside captured console and network metadata. Trim clips around an issue, document expected and actual behavior, and prepare evidence-linked reports for engineering. Local-first review and human verification are central to the workflow. Cloud AI features, where configured, require explicit approval.

Do **not** advertise it as a full runtime debugger, a zero-configuration AI root-cause detector, a cross-browser tool, a verified secure enterprise system, or an automatically publishing Jira/GitHub integration.

## Available work completed remotely

- [x] Chrome Manifest V3 extension with \`16, 32, 48, 128\`-pixel PNG icons and a matching SVG source.
- [x] Readable per-permission explanations in \`docs/INSTALL.md\`.
- [x] A dedicated product landing page, fictional sample, Studio route and public preview disclosure.
- [x] A developer installation and onboarding journey requiring no user account.
- [x] Local privacy-by-default and explicit cloud-AI consent in the interface.
- [x] Basic local session deletion and recovery tools.

## Mandatory before a public Web Store submission

- [ ] Test all requested Chrome permissions and tabCapture/debugger behavior on a real Chrome installation.
- [ ] Verify no TraceCue mascot or controls appear in recorded video, on initial load or navigations.
- [ ] Inspect long sessions, clip integrity, storage errors and recovery without hiding missing evidence.
- [ ] Test local handoff from the extension to local and hosted Studio; verify transfer fallback when popups or large videos prevent handoff.
- [ ] Create real screenshots from tested UI for the store listing. **Do not use illustration/mockups as screenshots of features that have not been tested.**
- [ ] Audit console/video redaction and finalize accurate privacy/data-use disclosures (including Firebase AI Logic where enabled).
- [ ] Publish and legally review a permanent privacy policy, including data retention, user rights, and contact information.
- [ ] Check Chrome Web Store's single-purpose, limited-use and \`debugger\` permission policies. Consider whether debugger permission can be requested/activated more narrowly in a future version.
- [ ] Review extension manifest title, short description, icon and version for release (currently explicitly a development preview).
- [ ] Register a Chrome Web Store developer account and complete its verification and one-time registration fee.
- [ ] Package extension files with \`manifest.json\` at ZIP root, upload and complete the official store declaration and review process.
- [ ] Test approved installation via its **actual** Chrome Web Store URL before the landing page claims a one-click installation.

Official links: [Developer registration](https://developer.chrome.com/docs/webstore/register) · [Program policies](https://developer.chrome.com/docs/webstore/program-policies/policies) · [Publishing guide](https://developer.chrome.com/docs/webstore/publish).

## Permission & data checklist

| Permission | Why TraceCue uses it | Review concern |
| --- | --- | --- |
| activeTab | Explicit permission for selected site | No broad browsing monitoring |
| scripting | Sanitized interaction event observers and UI cleanup | Avoid reading sensitive text/typed values |
| tabCapture | Tab video for authorized QA sessions | Only with explicit start and visible indicator |
| offscreen | Local MediaRecorder and durable chunks | Recover partials honestly |
| debugger | Console / network metadata from selected tab | Prominent warning, elevated privilege, conflicts with DevTools |
| storage | Local video, reports, clips and checkpoints | Retention, deletion, quota, local compromise |
| sidePanel | Out-of-tab capture controls | Do not interfere with the user's page |

The store's data-use statements and public privacy notice must describe **actual behavior**. They cannot claim that browser-captured video or console messages are guaranteed to be free of private information.

## Distribution decision

For the hackathon and limited tester group, provide a clear **developer preview** installation guide and a no-account interactive fictional demo. For general users, wait for an approved Chrome Web Store listing. Do not link a fake Chrome Web Store install URL.
