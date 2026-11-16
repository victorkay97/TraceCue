// TraceCue diagnostic provenance utilities. No browser APIs, safe for unit tests.
// Attribution is a best-effort hint, never a verified claim about a third-party bug.
const isExtension = value => /^chrome-extension:\/\//i.test(String(value || ""));
const isBrowser = value => /^(chrome|devtools|chrome-untrusted):\/\//i.test(String(value || ""));
const isRuntimeMessage = text =>
  /unchecked runtime\.lastError/i.test(String(text || "")) &&
  /could not establish connection|receiving end does not exist|message port closed/i.test(String(text || ""));

export function safeEvidenceUrl(raw) {
  try {
    const url = new URL(raw);
    if (isExtension(raw)) return "[browser-extension]";
    if (isBrowser(raw)) return "[browser-internal]";
    if (!["http:","https:"].includes(url.protocol)) return "[non-web resource]";
    return url.origin + url.pathname.split("/").map(part => {
      if (!part) return "";
      return /^[a-zA-Z_-]{1,35}$/.test(part) ? part : "[id]";
    }).join("/");
  } catch { return "[unknown]"; }
}
export function classifyDiagnostic(kind, data={}, context={}) {
  if (!["console-warning","console-error","console-exception","network-failure","environment-diagnostic"].includes(kind)) {
    return {kind,data};
  }
  const refs = [context.url,context.stackUrl,context.contextOrigin,context.contextName,
    data.url, data.stackUrl];
  const extensionSource = refs.some(isExtension) || data.sourceHint === "browser-extension";
  const browserSource = refs.some(isBrowser) || data.sourceHint === "browser-internal";
  const isolated = context.isIsolated === true;
  const runtimeMessage = isRuntimeMessage(data.message);
  const external = extensionSource || browserSource || isolated || runtimeMessage ||
    kind === "environment-diagnostic";
  if (external) {
    const sourceHint = extensionSource ? "browser-extension" :
      browserSource ? "browser-internal" : isolated ? "isolated-world" :
      runtimeMessage ? "possible-extension-messaging" : data.sourceHint || "environment";
    return {kind:"environment-diagnostic",data:{
      ...data,originalKind:data.originalKind || kind,sourceHint
    }};
  }
  if (kind === "console-error" && ["warn","warning"].includes(data.level)) {
    return {kind:"console-warning",data:{...data,originalKind:kind}};
  }
  return {kind,data};
}

export function redactDiagnosticText(value,max=220) {
  const str=String(value ?? "")
    .replace(/chrome-extension:\/\/[^\s"'<>]+/gi,"[browser-extension]")
    .replace(/Bearer\s+\S+/gi,"Bearer [REDACTED]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[EMAIL]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g,"[NUMBER]")
    .replace(/(?:token|password|secret|api[_-]?key)\s*[:=]\s*\S+/gi,"[REDACTED]")
    .replace(/https?:\/\/[^\s"'<>]+/gi,url=>safeEvidenceUrl(url));
  return str.slice(0,max);
}
