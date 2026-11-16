// TraceCue floating companion: injected only after user explicitly opens the extension.
(()=>{
if(document.getElementById("tracecue-companion-root"))return;
const host=document.createElement("div");host.id="tracecue-companion-root";
host.style.cssText="position:fixed!important;right:22px!important;bottom:22px!important;z-index:2147483647!important;pointer-events:auto!important";
const shadow=host.attachShadow({mode:"closed"});
const style=document.createElement("style");style.textContent="*{box-sizing:border-box}.wrap{font:13px/1.45 Inter,system-ui,sans-serif;color:#e4f3f3;position:relative}button{font:inherit;cursor:pointer;border:0}.bubble{position:relative;width:58px;height:58px;border:3px solid #f3ffff;border-radius:20px;background:#b7e9e0;color:#164249;box-shadow:0 7px 32px #0008,inset -9px -7px #7ebdb9;display:grid;place-content:center;transform:rotate(-4deg)}.bubble:hover{transform:rotate(0) scale(1.05)}.eyes{font-size:22px;font-weight:1000;letter-spacing:6px;padding-left:6px;height:17px;line-height:20px}.smile{font-size:28px;line-height:19px;text-align:center}.rec{position:absolute;width:14px;height:14px;border-radius:100%;background:#f06a68;right:-4px;top:-4px;border:3px solid #fff;display:none}.rec.active{display:block;animation:pulse 1.3s infinite}@keyframes pulse{50%{box-shadow:0 0 0 6px #f06a682d}}.sheet{width:310px;background:#11222f;border:1px solid #45616a;border-radius:17px;padding:17px;box-shadow:0 20px 70px #000b;position:absolute;right:0;bottom:73px;max-height:min(560px,80vh);overflow:auto}.sheet[hidden]{display:none}.top{display:flex;justify-content:space-between;align-items:center;gap:12px}.brand{font-size:16px;font-weight:800}.status{font-size:10px;color:#abd3cb;border:1px solid #365b52;background:#20352f;padding:5px 8px;border-radius:15px}.status.recording{color:#ffd4cf;background:#4b272a}.sheet p{color:#a8bdc7;font-size:12px;line-height:1.5}.label{color:#b1cbd1;font-size:11px;font-weight:700;display:block;margin:12px 0 6px}.sheet input{font:inherit;color:#ebf5f5;background:#091922;padding:10px;border:1px solid #3d5866;border-radius:9px;width:100%}.choices{display:flex;gap:5px}.choices button{background:#253b49;color:#e2edef;border:1px solid #3c5a68;border-radius:8px;font-weight:700;padding:7px 10px}.choices button.selected{background:#bce5df;color:#153c40}.actions{display:flex;gap:7px;margin:12px 0}.actions button{padding:10px 12px;border-radius:9px;background:#bedfdc;color:#143c3d;font-weight:750;flex:1}.actions button[disabled],button[disabled]{opacity:.45;cursor:default}.actions .stop{background:#66333b;color:#ffe4df}.mark{display:block;width:100%;padding:11px;background:#2c4a58;color:#e7f8f3;border:1px solid #4a737e;border-radius:9px;font-weight:800}.panelLink{font-size:11px;text-decoration:underline;color:#aee6db;background:none;padding:5px 0;margin-top:9px}.msg{font-size:11px;min-height:18px;margin:10px 0 0}.timer{font-size:12px;color:#8edacb;font-variant-numeric:tabular-nums;margin-top:3px}";
const root=document.createElement("div");root.className="wrap";root.innerHTML="<section class=\"sheet\" hidden><div class=\"top\"><span class=\"brand\">TraceCue Companion</span><span class=\"status\">Idle</span></div><p>Record continuously. Mark a moment without interrupting the full session.</p><div class=\"timer\">00:00</div><div class=\"actions\"><button class=\"start\">● Record</button><button class=\"stop\" disabled>■ Stop</button></div><label class=\"label\" for=\"tracecue-title\">Issue title</label><input id=\"tracecue-title\" maxlength=\"100\" placeholder=\"What went wrong?\"><span class=\"label\">Save previous</span><div class=\"choices\"><button data-lookback=\"15\">15s</button><button data-lookback=\"30\" class=\"selected\">30s</button><button data-lookback=\"60\">60s</button><button data-lookback=\"120\">2m</button></div><button class=\"mark\" disabled>◈ Mark & clip</button><button class=\"panelLink\">Open full sidebar</button><p class=\"msg\" role=\"status\" aria-live=\"polite\">Waiting for your action.</p></section><button class=\"bubble\" aria-label=\"Toggle TraceCue QA companion\" title=\"TraceCue QA Companion\"><span class=\"eyes\">••</span><span class=\"smile\">⌣</span><span class=\"rec\"></span></button>";
shadow.append(style,root);(document.documentElement||document.body).append(host);
const $=sel=>root.querySelector(sel);
const send=(action,more={})=>chrome.runtime.sendMessage({target:"tracecue-control",action,...more});
let seconds=30;
const clock=ms=>{const s=Math.floor(Math.max(0,ms)/1000);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");};
const message=value=>{$(".msg").textContent=value;};
async function refresh(){
  const status=await send("status");
  const active=!!status?.activeOnTab;
  $(".status").textContent=active?"● Recording":status?.recording?"Recording another tab":"Idle";
  $(".status").classList.toggle("recording",active);
  $(".rec").classList.toggle("active",active);
  $(".start").disabled=!!status?.recording;$(".stop").disabled=!active;$(".mark").disabled=!active;
  $(".timer").textContent=clock(active?Date.now()-status.startedAt:0);
}
$(".bubble").addEventListener("click",()=>{
  $(".sheet").hidden=!$(".sheet").hidden;
  if(!$(".sheet").hidden)refresh().catch(()=>{});
});
root.querySelectorAll("[data-lookback]").forEach(button=>button.addEventListener("click",()=>{
  seconds=Number(button.dataset.lookback);
  root.querySelectorAll("[data-lookback]").forEach(b=>b.classList.toggle("selected",b===button));
}));
$(".start").addEventListener("click",async()=>{
  message("Requesting capture…");
  const result=await send("start").catch(e=>({ok:false,error:e.message}));
  message(result?.ok?"Recording locally. Use Mark to isolate an issue.":(result?.error||"Could not start")+" — try sidebar Start if Chrome requires a direct extension gesture.");
  await refresh();
});
$(".stop").addEventListener("click",async()=>{
  message("Saving complete recording…");
  const result=await send("stop").catch(e=>({ok:false,error:e.message}));
  message(result?.ok?"Full recording saved. Opening review.":result?.error||"Could not stop");
  await refresh();
});
$(".mark").addEventListener("click",async()=>{
  const result=await send("mark",{title:$("#tracecue-title").value.trim()||"Issue marker",lookbackSeconds:seconds}).catch(e=>({ok:false,error:e.message}));
  message(result?.ok?"Marked. Previous "+seconds+"s selected for a separate clip.":result?.error||"Mark failed");
});
$(".panelLink").addEventListener("click",async()=>{
  const result=await send("open-sidebar").catch(e=>({ok:false,error:e.message}));
  message(result?.ok?"Sidebar opened.":"Use the TraceCue toolbar icon to open the sidebar.");
});
chrome.runtime.onMessage.addListener(msg=>{if(msg?.target==="tracecue-ui")refresh().catch(()=>{});});
setInterval(()=>refresh().catch(()=>{}),1800);refresh().catch(()=>{});
})();