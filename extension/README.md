# TraceCue Companion 0.5 — Chrome developer preview

**User-started QA recording, issue-focused video and technical evidence.**

TraceCue is not yet on the Chrome Web Store. Begin with the [0.5 developer installation guide](../docs/INSTALL.md), or open the [fictional Studio demo](https://tracecue-studio-preview.vercel.app/app.html?demo=1) without installation.

## The tester's normal workflow

1. Install the unpacked extension and pin it in Chrome.
2. Open an HTTP(S) website you are authorized to test. Click the toolbar icon to open the native sidebar.
3. Select whether to include verbose console.log/info/debug messages (off by default); click **Start recording** explicitly.
4. Name an issue and mark a time interval. The session recording continues. Mark as many issues as necessary.
5. Click **Stop & review**. Check full video and issue-specific clips/logs; adjust start/end points and add actual-versus-expected notes.
6. Choose **Continue in Studio**. Review the consent message, select the local or approved hosted destination, and explicitly confirm import in Studio. This handoff uses browser-window messaging and has an 80 MB WebM cap. Otherwise download JSON and WebM and import manually.
7. Search HTTP failures or console messages, investigate a selected issue locally or with explicitly consented Firebase cloud AI, and verify the draft before sharing it.

## What stays local

Complete recordings, technical event reports, clips, interrupted-session checkpoints and search history are stored in the extension's browser-origin storage. The extension does not automatically upload evidence. The optional Studio transfer has no server upload; cloud AI actions are **separate**, explicit and reviewable. Screenshots and console messages may still contain secrets despite masking.

## Recovery, privacy, and limitations

- **Session library** reopens completed reports.
- **Recover interrupted** attempts to salvage checkpointed events and video chunks. Salvaged media may be incomplete or unplayable.
- **Deleting a session** removes its video and saved clips from the local reviewer's indexed database.
- **Chrome debugger** permission may show a warning, conflict with an attached DevTools session, or be blocked in some environments.
- In-tab mascot controls are removed before tab capture; the sidebar remains outside the captured video. Check the saved WebM on a real browser to verify this.
- Chrome's separate popup cannot guarantee always-on-top.
- Video redaction is not automatic. Do not record sensitive real-world sites or accounts.

**No signup or cloud workspace is included in this developer preview.**

Full acceptance instructions: [TraceCue 0.5 release](../docs/RELEASE_0_5.md).
