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
4. In production, configure Google Cloud Fraud Defense (reCAPTCHA Enterprise) with a score-based website key and the correct authorized production domain. Classic reCAPTCHA v3 is deprecated.
5. Set only public web config fields and the Fraud Defense **website key ID** in `VITE_APPCHECK_SITE_KEY` in studio/.env.local. Do not use a classic reCAPTCHA v3 secret key. Never commit service-account credentials.
6. Local development requires the official App Check debug-provider flow. Use a privately registered debug token; do not commit it, hardcode it in the project, or ship it in production. Do not loosen production reCAPTCHA domains to allow untrusted localhost origins.
7. Use Chrome Desktop version 139+, enable chrome://flags/#prompt-api-for-gemini-nano-multimodal-input if required, restart, and prepare the local model.
8. In Studio, import a session and click **Analyze on device**. A successful response must have Firebase SDK inferenceSource `on_device`.
9. To test cloud inference, review and optionally edit the exact text, tick the consent box, then click **Analyze in cloud**. Check for Firebase SDK inferenceSource `in_cloud`.

Firebase official guide: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started

## 4. Run checks

~~~powershell
cd ..
npm test
cd studio
npm run build
~~~

A working Firebase project is not included. Until actual keys and App Check are configured, AI buttons show a transparent error rather than fake output.


## TraceCue Intelligence — first live Firebase test

1. In Firebase Console, create a Firebase project and register a **Web app** for TraceCue Studio.
2. Go to **AI Services → AI Logic**, choose the Gemini Developer API, and complete its guided setup.
3. Confirm **Security → App Check → APIs → Firebase AI Logic** is **Enforced**.
4. Copy the public Firebase web configuration fields into studio/.env.local (copy studio/.env.example to create it).
5. For local development, Studio activates the App Check debug provider only on localhost in a Vite development build. Check Chrome's DevTools Console for the App Check debug token, then register the token privately in Firebase Console → App Check → Apps → Manage debug tokens. Never commit the token or add localhost to reCAPTCHA's production allowed domains.
6. Reload Studio. Import the redacted JSON from TraceCue Companion.
7. In the Intelligence panel, the evidence catalogue assigns stable EV identifiers to action/failure events; browser-extension environment noise is excluded by default.
8. Review the generated minimized prompt. Click **Analyze on device** and verify that Studio displays SDK source **on_device**. No cloud fallback occurs.
9. To run the cloud model, review the exact editable prompt, grant explicit consent, then click **Analyze in cloud** and verify SDK source **in_cloud**. The consent checkbox resets after a successful run.
10. A valid structured result can propose reproduction steps citing EV event IDs; the UI only links IDs present in the imported report. Raw model text remains accessible for transparency. The regression suggestions are not executed tests.

On-device inference needs supported desktop Chrome (139+) with the Prompt API enabled, sufficient free disk space, and a local model download. Chrome v157 alone does not guarantee on-device model availability. The SDK supports text and JPEG/PNG images, not video input, so TraceCue sends a minimized text event catalogue rather than the recording itself.

For an initial check, use the synthetic file at studio/samples/example-session.json. You may also import your own TraceCue export, but do not share recordings containing private data.

Official Firebase hybrid guide: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
Official inference configuration: https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options


## App Check provider update (November 2026)

Firebase now warns that classic reCAPTCHA is deprecated. TraceCue Studio uses `ReCaptchaEnterpriseProvider` from `firebase/app-check` rather than `ReCaptchaV3Provider`. In Firebase Console → App Check → Apps → TraceCue Studio, choose **Fraud Defense (formerly reCAPTCHA Enterprise)**. Create a **score-based Web key** in the same project's [Google Cloud Fraud Defense console](https://console.cloud.google.com/security/recaptcha) for the actual deployment domain. Register the **key ID/site key** in Firebase App Check (do NOT paste the classic reCAPTCHA secret there). In `studio/.env.local`, set `VITE_APPCHECK_SITE_KEY` to the same Fraud Defense key ID. Local development uses the App Check debug provider as described above; keep production domain verification enabled. The older classic reCAPTCHA keys can be retired separately.


## Firebase SDK inference source values

The SDK's `InferenceMode.ONLY_ON_DEVICE` and `InferenceMode.ONLY_IN_CLOUD` constants select where inference must run, but `result.response.inferenceSource` returns the lowercase values `on_device` or `in_cloud`. TraceCue validates the lowercase values strictly. This was corrected after the first live cloud test, where the service responded with `in_cloud` but older TraceCue code incorrectly rejected it as a failed request. See `tests/inference-source.test.mjs`.

## Correct Chrome Prompt API availability check (English)

The bare `LanguageModel.availability()` call can warn when expected output languages are omitted. Use these options to match TraceCue's on-device inference:

~~~javascript
const languageOptions = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }]
};
console.log("Prompt API status:", await LanguageModel.availability(languageOptions));
~~~

If `downloadable`, the local-model download can be initiated from an explicit user action:

~~~javascript
const localSession = await LanguageModel.create({
  ...languageOptions,
  monitor(m) {
    m.addEventListener("downloadprogress", e => console.log("Downloaded:",Math.round(e.loaded*100)+"%"));
  }
});
console.log("Local language model ready.");
localSession.destroy();
~~~

TraceCue now passes the English text parameters through `onDeviceParams.createOptions` in ONLY_ON_DEVICE mode. Content-script console messages from unrelated extensions do not establish model readiness.
