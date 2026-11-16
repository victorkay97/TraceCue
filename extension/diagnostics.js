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
function sameOrigin(raw,page) {
  if (!raw || !page) return false;
  try {
    const a=new URL(raw), b=new URL(page);
    return ["http:","https:"].includes(a.protocol) && a.origin === b.origin;
  } catch { return false; }
}
// A concrete script callsite is stronger than the execution environment that
// observed it. Attribution remains an estimate and never establishes a bug.
export function classifyDiagnostic(kind,data={},context={}) {
  if (!["console-warning","console-error","console-exception","console-info","console-debug","network-failure","network-response","environment-diagnostic"].includes(kind))
    return {kind,data};
  const callsite=context.stackUrl || context.url || "";
  const pageCallsite=sameOrigin(callsite,context.pageUrl);
  const runtimeMessage=isRuntimeMessage(data.message);
  const extensionCallsite=isExtension(callsite);
  const internalCallsite=isBrowser(callsite);
  const extensionContext=isExtension(context.contextOrigin) || isExtension(context.contextName);
  const internalContext=isBrowser(context.contextOrigin);
  const isolated=context.isIsolated === true;
  if (pageCallsite && !runtimeMessage && kind !== "environment-diagnostic") {
    const effectiveKind=kind === "console-error" && ["warning","warn"].includes(data.level) ?
      "console-warning" : kind;
    return {kind:effectiveKind,data:{...data,
      sourceHint:"page-script",sourceConfidence:"callsite"}};
  }
  const external=extensionCallsite || internalCallsite || extensionContext ||
    internalContext || isolated || runtimeMessage || kind === "environment-diagnostic";
  if (external) {
    const sourceHint=extensionCallsite || extensionContext ? "browser-extension" :
      internalCallsite || internalContext ? "browser-internal" :
      isolated ? "isolated-world" :
      runtimeMessage ? "possible-extension-messaging" : data.sourceHint || "environment";
    return {kind:"environment-diagnostic",data:{
      ...data,originalKind:data.originalKind || kind,sourceHint,
      sourceConfidence: extensionCallsite || internalCallsite ? "callsite" : "context"
    }};
  }
  if (kind === "console-error" && ["warning","warn"].includes(data.level))
    return {kind:"console-warning",data:{...data,originalKind:kind}};
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
