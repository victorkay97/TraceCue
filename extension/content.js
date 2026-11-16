// Authorized tab observer: records only event types and safe element categories.
// Never inspect field values, text content, keystrokes, cookies or request bodies.
(() => {
  if (window.__TRACECUE_OBSERVER__) return;
  window.__TRACECUE_OBSERVER__ = true;
  const describe = node => {
    if (!(node instanceof Element)) return "unknown";
    const item = node.closest("button,a,input,select,textarea,form,[role=button]") || node;
    const name = item.tagName.toLowerCase();
    const kind = (item.getAttribute("type") || "").toLowerCase();
    const role = (item.getAttribute("role") || "").toLowerCase();
    const testId = (item.getAttribute("data-testid") || "").toLowerCase();
    // Explicit short QA label only; never log text, arbitrary IDs or input values.
    const safeTestId = /^[a-z][a-z0-9-]{0,39}$/.test(testId) ? "testid:" + testId : "";
    return [name, /^[a-z-]{1,20}$/.test(kind) ? kind : "",
      /^[a-z-]{1,20}$/.test(role) ? role : "", safeTestId].filter(Boolean).join(" ");
  };
  const send = (kind, element) => {
    try {
      // A content script may outlive its extension worker after reload or update.
      // Handle rejected messages rather than injecting noisy unchecked lastError logs.
      chrome.runtime.sendMessage({
        target:"background",kind:"interaction",event:{kind,element,at:Date.now()}
      }).catch(() => {});
    } catch { /* Extension may have stopped synchronously. */ }
  };
  document.addEventListener("click", e => send("click",describe(e.target)), true);
  document.addEventListener("submit", e => send("submit",describe(e.target)), true);
  document.addEventListener("change", e => send("change",describe(e.target)), true);
  send("page-ready","document");
})();
