# TraceCue Companion

This is a **developer prototype**. Load the entire extension directory unpacked through Chrome Desktop at chrome://extensions.

## Usage

1. Open an HTTP(S) page you own or have explicit permission to test. Use a disposable account and non-sensitive data.
2. Click the TraceCue toolbar icon to **start**. The icon displays REC while active.
3. Reproduce the issue. Press **Ctrl+Shift+9** (macOS: Command+Shift+9) to add an issue marker; browser shortcuts can be changed at chrome://extensions/shortcuts.
4. Click the icon again to **stop**. TraceCue opens a local review page.
5. Review the captured video and events. Edit tester notes. Download a session JSON, an issue draft, and optionally a video.
6. In TraceCue Studio, import the JSON for local review and optional Firebase analysis.

## Capabilities and boundaries

- Captures the selected tab's video using Chrome tabCapture and an offscreen document, when supported.
- Listens for permitted click/change/submit event categories, not input values or typed text.
- Tries Chrome debugger APIs for console and failed network diagnostics. Debugger access may conflict with DevTools.
- No automatic remote upload, cloud storage, credential capture, HTTP payload capture or per-keystroke logging.
- Does not claim that recorded events are a complete or deterministic reproduction recipe.
- Console messages and recordings can still contain secrets; never use real customer or payment data.

## To validate on a real machine

Test a successful recording, denied/unsupported video capture, debugger attach failure, page navigation, tab closure, hotkey issue marker, video export, JSON import and review. Browser behavior has not been verified in the assistant's isolated code environment.
