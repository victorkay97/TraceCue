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


## Measured parity refinement — 19 November 2026

The landing now uses the supplied HI Playground audit as a geometric reference, not a source of branding or copied content. Desktop layout: 1200px max container with 64px insets, 72px header, 30/36px Geist 600 hero, 28px CTAs with 12/16px labels, 48px showcase icons and 16/24px feature titles. Below 1024px: 52px header, 16px insets, 18/21.6px hero, accessible mobile navigation drawer, scroll-snap example cards and arrow-key pagination. Body copy continues to use Inter, and TraceCue's green/teal accent remains distinct from Playground's purple. The product preview is simplified by hiding duplicated counters/recent labels and foregrounding captured evidence. The fictional playback, sample evidence search, privacy and installation flows remain unchanged. Runtime screenshot parity and interactive verification remain outstanding.


## Hero and footer refinement (19 November 2026)

At desktop widths **1160px and up**, the existing hero introduction is exposed as CSS grid contents: the left column holds the actual TraceCue product example while the supporting paragraph sits beside it, vertically centered on the right, below the headline. Narrower layouts retain the stacked/reference-safe structure to protect the interactive recording/evidence preview's minimum legibility.

The illustrated background footer image is replaced with a **real, free-to-use Unsplash photograph** of a development workspace by **Ilias Haddad**, photo [6fPimawrebk](https://unsplash.com/photos/a-computer-desk-with-two-monitors-and-a-keyboard-6fPimawrebk), served through Unsplash's photo CDN. A restrained dark overlay preserves the white footer card's prominence and a visible credit links to the photographer. The original vector remains in source history but is no longer used as the footer background. Photo delivery currently requires access to images.unsplash.com; the fallback is a dark solid color.
