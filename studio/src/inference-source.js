// Firebase AI Logic's actual InferenceSource values are lowercase.
// Keep the check strict: an on-device request must never silently accept cloud inference.
// Reference: https://firebase.google.com/docs/reference/js/ai#inferencesource
export const INFERENCE_SOURCES = Object.freeze({
  device:"on_device",
  cloud:"in_cloud"
});
export function assertInferenceSource(mode,source) {
  const expected=INFERENCE_SOURCES[mode];
  if (!expected) throw new Error("Unsupported inference mode: "+String(mode));
  if (source !== expected) {
    throw new Error(
      mode==="device" ?
        "Privacy protection: requested on-device inference but SDK reported "+String(source) :
        "Expected cloud inference but SDK reported "+String(source)
    );
  }
  return source;
}
