# Privacy and security design — development status

**Do not test this prototype with banking portals, production customer data, passwords, health records, or real financial transactions.**

## Implemented boundaries

- Explicit click to start/stop capture; visible REC badge.
- Selected tab only, no global browser history collection.
- No page text, typed characters, raw input values, cookies, request or response bodies, or authorization headers intentionally captured.
- Debugger logs and failed HTTP status are limited; string masking is **best effort, not guaranteed**.
- Video, local report JSON and reviewer notes remain in extension-origin browser storage until exported.
- Studio import does not upload session JSON.
- Firebase cloud analysis is manual and requires an affirmative checkbox after reviewing editable text.
- No cloud fallback from on-device-only inference. Actual Firebase SDK inference-source must be reported.

## Still required before real-world use

- Validate the implemented cross-origin navigation stop under redirects and rapid navigation in real Chrome.
- Field and screen redaction controls, durable retention / purge UI and storage quota.
- Robust secret scanner for console messages and paths.
- Threat-model review for malicious web pages, extension messages and prompt injections.
- Consent design for participants other than the tester.
- Integration OAuth tokens, access control and encrypted storage (not yet present).
- Full browser integration tests and Chrome Web Store permission review.

## Operational policy

Capture only environments the tester is authorized to inspect. Never send reports or recordings to third parties without reviewing the contents and obtaining any necessary organizational authorization.
