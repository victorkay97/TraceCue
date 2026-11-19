# TraceCue Landing Page V2 — Editorial product experience

**Status:** Implemented on \`feat/tracecue-foundation\`. Automated Vite/Node build validated; desktop Chrome visual and interaction acceptance pending.

## Why this redesign

The reference provided by the product owner was a full-page Playground screenshot and a 14-second recording of the site's hero, an interactive four-icon feature selector, scroll transitions, three-step explanation, privacy treatment and expressive footer. TraceCue V2 draws from the **restraint and product-first presentation**, not the reference's artwork, copy, typography assets, or purple brand color.

## Design decisions

- Light/white editorial canvas with charcoal text and restrained TraceCue green-teal accents.
- Centered 1140px content grid, compact header, split headline/supporting text, and a larger flat product demonstration.
- A miniature QA evidence inspector built around the **same fictionally recorded HTTP 500 event** as Studio's sample data (not a screenshot of a verified customer session).
- A stable four-tab feature showcase with Capture → Mark → Investigate → Report, mouse and arrow-key support, quiet 320ms transitions and no autoplay.
- Three concrete process illustrations, not an interchangeable grid of marketing cards.
- An interactive example that executes TraceCue's real \`searchQaEvidence\` logic over \`/demo-session.json\`, without sending logs or video to any model.
- A dark, contrasting privacy section with accurate consent language, and an original vector evidence-trail footer with a large TraceCue wordmark.
- Explicit preview/developer install CTAs; no invented Chrome Web Store listing or forced signup.
- Mobile/tablet layouts, keyboard focus indicators, semantic navigation, reduced-motion support, and a preserved separately styled privacy page.

## Validation

Run \`npm test\` in the repository root and \`npm --prefix studio run build\`. The landing-specific regression test checks navigation and CTA paths, four feature tabs, breakpoint/reduced-motion support, working sample search and the fictional event reference (EV0004).

### Remaining browser acceptance

1. Visit \`https://tracecue-studio-preview.vercel.app/\` in actual desktop Chrome and confirm section spacing/typography, no clipped layouts and correct site copy.
2. Click each feature icon and verify the stage updates without moving surrounding UI; use ArrowUp/ArrowDown/Home/End to test keyboard interaction.
3. Query \`HTTP 500\`, \`console error\`, and \`name mismatch\`. Check response IDs and errors. No Firebase request should occur from this on-page search.
4. Verify that the main CTAs open \`/app.html?demo=1\` and that the developer install guide correctly discloses unpacked extension installation.
5. Test 1440px, 1024px, 768px, 390px and 320px viewport widths. Pay particular attention to feature rail, example search field, Studio illustration and footer wordmark.
6. Verify \`/privacy.html\` matches the light design and all disclosures remain readable.
7. Enable reduced motion and check that transitions/reveals do not block content.
8. Review the published preview against the original Playground video, checking fidelity of restraint, spacing and interaction quality **without copying its branding**.

**Scope discipline:** This change does not modify Studio AI, Chrome recording/permissions, authentication or multi-actor scenario logic.
