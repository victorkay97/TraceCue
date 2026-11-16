# Local setup (Windows 11 / PowerShell)

## 1. Load TraceCue Companion

1. Clone this repository, or download its source as a ZIP.
2. Open Chrome Desktop at chrome://extensions and enable Developer Mode.
3. Choose **Load unpacked** and select the extension/ directory.
4. Open a test application you control or are authorized to inspect.
5. Click TraceCue's toolbar icon to start capture. A REC badge appears.
6. Reproduce a defect and press Ctrl+Shift+9 to mark it if desired.
7. Click the toolbar icon again to stop. Review the evidence locally.
8. Export the JSON, and optionally the video / Markdown issue draft.

Do not test with real credentials or sensitive content. Chrome's debugger permission presents a warning. If DevTools is already attached, some diagnostics may be unavailable.

## Controlled QA fixture (recommended first test)

Rather than record public or sensitive websites, run TraceCue Studio locally and open:

    http://127.0.0.1:5173/qa-fixture.html

Start TraceCue on that page. Click **Simulate failed save**, **Trigger repeated console warnings**, **Trigger an uncaught exception**, and optionally **Ctrl+Shift+9** to mark an issue. Stop recording and review the video and timeline.

Expected: a deliberately failed POST request, a console error, four repeated warnings eligible for grouping, and a JavaScript exception. The exact event counts depend on Chrome and other extensions. These are synthetic test failures, not an actual customer application defect.

## 2. Run TraceCue Studio

~~~powershell
git clone https://github.com/victorkay97/TraceCue.git
cd TraceCue\studio
Copy-Item .env.example .env.local
npm install
npm run dev
~~~

Import the extension JSON, or use **studio/samples/example-session.json** to inspect the UI with explicitly *fictional* evidence.

## 3. Configure Firebase hybrid inference

1. Create a Firebase project and Web app via https://console.firebase.google.com.
2. Enable **AI Services → AI Logic** with the Gemini Developer API provider.
3. In **Security → App Check**, register your web app and enforce App Check for AI Logic.
4. In production, configure reCAPTCHA v3 or another supported production attestation provider, with the correct authorized domain.
5. Set only public web config fields and the reCAPTCHA **public site key** in studio/.env.local. Never commit service-account credentials.
6. Local development requires the official App Check debug-provider flow. Use a privately registered debug token; do not commit it, hardcode it in the project, or ship it in production. Do not loosen production reCAPTCHA domains to allow untrusted localhost origins.
7. Use Chrome Desktop version 139+, enable chrome://flags/#prompt-api-for-gemini-nano-multimodal-input if required, restart, and prepare the local model.
8. In Studio, import a session and click **Analyze on device**. A successful response must explicitly say ON_DEVICE.
9. To test cloud inference, review and optionally edit the exact text, tick the consent box, then click **Analyze in cloud**. Check for IN_CLOUD.

Firebase official guide: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started

## 4. Run checks

~~~powershell
cd ..
npm test
cd studio
npm run build
~~~

A working Firebase project is not included. Until actual keys and App Check are configured, AI buttons show a transparent error rather than fake output.
