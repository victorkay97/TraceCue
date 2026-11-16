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
    return [name, /^[a-z-]{1,20}$/.test(kind) ? kind : "", /^[a-z-]{1,20}$/.test(role) ? role : ""].filter(Boolean).join(" ");
  };
  const send = (kind, element) => {
    try { chrome.runtime.sendMessage({target:"background",kind:"interaction",event:{kind,element,at:Date.now()}}); }
    catch { /* Extension may have stopped */ }
  };
  document.addEventListener("click", e => send("click",describe(e.target)), true);
  document.addEventListener("submit", e => send("submit",describe(e.target)), true);
  document.addEventListener("change", e => send("change",describe(e.target)), true);
  send("page-ready","document");
})();
