# Local setup (Windows 11 / PowerShell)

## 1. Load TraceCue Companion 0.5

1. Clone the development branch: `git clone --branch feat/tracecue-foundation https://github.com/victorkay97/TraceCue.git`.
2. In desktop Chrome open `chrome://extensions`, enable **Developer Mode** and choose **Load unpacked** → the repository's `extension/` directory.
3. Click the TraceCue toolbar icon on an HTTP(S) test page you are authorized to inspect. This opens the **sidebar**, not an automatic recording.
4. Choose **Start recording** inside the sidebar. Name an issue, choose lookback/buffer, and select **Save titled issue marker** when a problem appears.
5. Select **Stop & review**. The viewer holds your full recording, separate editable issue clips and technical event logs.
6. If available, choose **Continue in Studio**, review the data, explicitly authorize the chosen local or hosted Studio origin, then confirm the import in Studio. Larger videos can be manually imported.
7. For recordings that were interrupted, use **Recover interrupted**. For completed recordings, use the **Session library**.

Do not test with real credentials or sensitive content. Chrome's debugger permission can display a warning; DevTools attachment may conflict. All newly added browser functions need testing on the actual target Chrome installation. See [developer installation](INSTALL.md).

## Controlled QA fixture (recommended first test)

Rather than record public or sensitive websites, run TraceCue Studio locally and open:

    http://127.0.0.1:5173/qa-fixture.html

Start TraceCue on that page. Click **Simulate failed save**, **Trigger repeated console warnings**, **Trigger an uncaught exception**, and optionally **Ctrl+Shift+9** to mark an issue. Stop recording and review the video and timeline.

Expected: a deliberately failed POST request, a console error, four repeated warnings eligible for grouping, and a JavaScript exception. The exact event counts depend on Chrome and other extensions. These are synthetic test failures, not an actual customer application defect.

## 2. Run TraceCue Studio

~~~powershell
git clone --branch feat/tracecue-foundation https://github.com/victorkay97/TraceCue.git
cd TraceCue\studio
Copy-Item .env.example .env.local
npm install
npm run dev
~~~

The new product homepage is at `/`; Studio is at `/app.html` and a one-click fictional session opens at `/app.html?demo=1`. Import extension evidence locally by confirmed handoff or manual JSON+WebM files. No user account is required.

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

## Both inference modes verified — November 16, 2026

Real Chrome testing confirmed Firebase AI Logic's `in_cloud` and `on_device` source values. The Chrome local text model was first downloaded through the Prompt API and then successfully used through TraceCue Studio's `ONLY_ON_DEVICE` flow. Tests used fictional sample evidence. This does not verify a real customer-site defect.

## GitHub Issues handoff — review before publishing

After receiving a structured AI investigation, the Studio now provides a GitHub Issues draft panel. Enter a repository in `owner/repository` format. The draft contains minimized technical event signals, clearly labeled model suggestions, event IDs, missing information and review checkboxes. No video files, raw console messages, request bodies, credentials or cookies are intentionally included. Redaction is best effort: always review carefully.

1. Click **Copy issue draft**. This copies the draft locally to your clipboard; it does not send data to GitHub.
2. Click **Open GitHub Issues** to open the selected repository's new-issue form. This sends only the repository path in the URL, not the issue body.
3. Paste the title and body, remove private details, verify the defect with the engineering team, and submit manually.

This first handoff is intentionally not a GitHub Issues OAuth publishing integration. It never automatically posts to a remote service.
