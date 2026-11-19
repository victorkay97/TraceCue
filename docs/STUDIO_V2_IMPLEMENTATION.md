# TraceCue Studio V2 — staged application-shell implementation

**Basis:** uploaded Playground application audit, interaction audit, design tokens and twenty screenshots dated 19 November 2026. The separately listed `tracecue-studio-v2-blueprint.md` was not included in the uploaded files, so this is an initial reversible implementation, not acceptance of the missing blueprint.

## Access and rollback

- **New page:** `/studio-v2.html` on the TraceCue preview branch.
- **Original page:** `/app.html` remains untouched and is the fallback.
- The V2 entry imports the existing `main.js` and then reorganizes mounted controls into views. The evidence, session, AI, scenario and GitHub workflow engines are reused without changing their semantics.

## Design mappings

Reference measured desktop 1440×900: 212px rail, #FAFAFA outer shell, #F5F5F5 nested surfaces, #FFFFFF cards, #F2F2F2 dividers, 16px shell radius, Geist typography. TraceCue preserves its own green accent and meets stronger text-contrast requirements. Responsive reflow removes the fixed 900px tablet minimum that was present in the reference.

- **Overview:** intro + primary fictional demo and JSON import; recently loaded session status; three action cards
- **Sessions:** recording/video and event timeline; separate Compare actors tab for existing multi-actor scenario editor
- **Issues:** existing issue-scoped QA search workspace
- **Investigate:** existing Firebase AI flow with reviewer notes, on-device/cloud decisions, evidence catalog and a collapsed prompt/consent preview
- **Reports:** original download/export controls, GitHub handoff and tester verification checks
- **Settings:** truthful information and links to privacy and legacy Studio; no claim that unsupported account settings are implemented

## Privacy and capability rules

The UI does not trigger capture, cloud inference or GitHub posting automatically. `main.js` continues to validate imported JSON and handle the fictional sample, video synchronization, evidence scoping, Firebase gating and explicit human attestation. The V2 shell moves original DOM nodes rather than cloning or replacing them, preserving their event listeners and element IDs.

## Required verification before replacing app.html

1. Validate `npm test` and `npm --prefix studio run build` in CI.
2. Browser-test original and V2 fictional-demo load, session import, video attach, selected marker search, on-device/cloud consent state and GitHub disabled gates.
3. Compare captured desktop snapshots at 1440,1280,1036 and tablet/mobile at 768,390,320. Specifically inspect 320px overflow and mobile navigation focus containment.
4. Test extension handoff through the V2 URL with actual Chrome authorization; do not claim it works from this source-only pass.
5. Confirm dark mode legibility across complex nested existing widgets. Dark theme in V2 is a preview and may require another dedicated visual polish pass.
6. Do not merge V2 into the main Studio route until user acceptance.
