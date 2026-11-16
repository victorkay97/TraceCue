# Install TraceCue Companion — Development Preview

**TraceCue 0.5 • Windows/macOS/Linux Chrome desktop • Developer/testing use only**

TraceCue is **not yet available in the Chrome Web Store**. The buttons on the public landing page do not claim otherwise. This installation uses Chrome's Developer Mode, which is appropriate for authorized QA testing but is not an ordinary consumer installation path.

## Option A: Explore the public demo (no extension, account, or configuration required)

Open **https://tracecue-studio-preview.vercel.app/app.html?demo=1**.

- The session is explicitly **fictional**, including its HTTP 500 and name-mismatch signals.
- Search errors, select an issue interval, inspect the evidence list, and explore the Studio UI.
- The public preview does not automatically enable Firebase AI. Cloud and local AI require compatible configuration and the relevant browser capabilities.

## Option B: Install the developer extension

1. Open a terminal and check that Git is installed.
2. Clone the TraceCue development branch:

   ```powershell
   git clone --branch feat/tracecue-foundation https://github.com/victorkay97/TraceCue.git
   cd TraceCue
   ```

   Or open the [development branch on GitHub](https://github.com/victorkay97/TraceCue/tree/feat/tracecue-foundation), choose **Code → Download ZIP**, extract it, and find the `extension` directory.

3. In **Chrome desktop**, open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the extracted `extension` directory containing `manifest.json`.
4. Confirm the TraceCue Companion icon appears. Pin it using Chrome's extension toolbar.
5. Start the local Studio fixture (recommended first):

   ```powershell
   cd studio
   npm install
   npm run dev
   ```

   Open `http://127.0.0.1:5173/qa-fixture.html`.

6. Click the TraceCue toolbar icon to open the native sidebar. Only **Start recording** begins capture. Run a fictional failure, name an issue, mark it, and choose **Stop & review**.
7. Inspect the video, issue clips, and redacted diagnostics inside the extension viewer. **Do not test real credentials, customer data, banking portals, or production applications.**

## Continue in TraceCue Studio

From the extension viewer, find **Continue in Studio**, review the evidence, choose **Local Studio** or **Hosted preview**, tick the privacy/authorization checkbox, then click **Open reviewed session in Studio**. In the new Studio tab, confirm **Import session locally**.

- The browser-window transfer uses a short-lived one-time handshake; it does not upload evidence to a server or start AI analysis.
- Review the full video and logs **before** clicking Transfer. Console masking is best effort.
- If your full WebM exceeds 80 MB or is not available, the session JSON may transfer without the video. You can attach the WebM manually from the Studio video importer.
- If the browser blocks the window handshake or the Studio page is unavailable, use **Export redacted JSON** and **Save video**, then import both files in Studio.
- The source extension review tab must remain open until the destination acknowledges the import.

## What the browser permissions mean

- `activeTab`: access the tab the tester intentionally selects.
- `tabCapture`: record the selected tab's visible contents.
- `debugger`: collect console/network metadata for the authorized tab; Chrome may display a prominent debugger warning or reject attachment if DevTools is already active.
- `scripting`: observe sanitized click/change/submit categories and keep the companion UI out of the recorded tab.
- `offscreen`: run the user-started media recorder when the service worker cannot host it.
- `storage`: persist local evidence, clips and recovery drafts.
- `sidePanel`: provide capture controls outside the tab video.

## Troubleshooting

- If Chrome denies tabCapture from the in-page mascot, start from the **native sidebar** instead.
- If recording appears interrupted, use **Recover interrupted** from the sidebar. Partial video may be unplayable; inspect what survived.
- If you don't see the latest controls, return to `chrome://extensions`, select **Reload**, then refresh the test tab.
- If Studio is running locally but not reachable, run `npm run dev` from `studio`; it uses port 5173 by default.
- A successful repository CI build does **not** prove the browser capture or cross-window transfer works. Test this version on Chrome before using it with colleagues.

**Never paste Firebase App Check debug tokens, service-account secrets, or authentication headers into screenshots or public issues.**
