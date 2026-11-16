import "./landing.css";
const root=document.getElementById("landing");
root.innerHTML=String.raw\`
<div class="landing-page">
  <div class="announcement"><span class="announcement-dot"></span>TraceCue 0.5 developer preview <span class="ann-sep">·</span> No account required to try the demo</div>
  <nav class="site-nav" aria-label="Primary navigation">
    <a class="site-logo" href="/" aria-label="TraceCue home"><span class="site-brand-icon">T<span>·</span></span><span>TraceCue</span></a>
    <div class="nav-links"><a href="#how">How it works</a><a href="#features">Features</a><a href="#privacy">Privacy</a><a href="#faq">FAQ</a></div>
    <a class="nav-app" href="/app.html?demo=1">Open Studio <span aria-hidden="true">↗</span></a>
  </nav>
  <main>
    <section class="site-hero" id="top">
      <div class="hero-glow"></div>
      <div class="hero-inner">
        <div class="hero-copy">
          <div class="hero-eyebrow"><span class="pulse-dot"></span> Built for people who find the bugs</div>
          <h1>Every bug leaves a trail.<br><em>Find it.</em></h1>
          <p class="hero-desc">Record your testing session once. Mark every issue as it happens. Then follow the video, console logs, and network evidence to understand what went wrong.</p>
          <div class="hero-ctas"><a class="btn primary" href="/app.html?demo=1">Explore the interactive demo <span aria-hidden="true">↗</span></a><a class="btn secondary" href="#install">Get the Chrome companion <span aria-hidden="true">↓</span></a></div>
          <div class="hero-micro"><span class="micro-icon">✓</span> Local-first recording <span class="micro-divider">·</span> <span class="micro-icon">✓</span> No signup to explore <span class="micro-divider">·</span> <span class="micro-icon">✓</span> Cloud AI only with consent</div>
        </div>
        <div class="hero-visual" role="img" aria-label="Illustrative TraceCue evidence workspace with a fictional failed HTTP 500 request, video timeline, and a synchronized console log.">
          <div class="mock-window">
            <div class="mock-topbar"><div class="window-dots"><i></i><i></i><i></i></div><span>TraceCue / QA workspace</span><span class="mock-state">● Local preview</span></div>
            <div class="mock-body"><div class="mock-heading"><div><span class="mini-eyebrow">SESSION / FICTIONAL DEMO</span><strong>Profile save investigation</strong></div><span class="mock-chip">Evidence linked</span></div>
              <div class="mock-video"><div class="mock-frame"><span class="frame-title">Profile settings</span><div class="form-line w80"></div><div class="form-line w60"></div><div class="form-button">Save changes</div><span class="frame-caption">Fictional browser capture</span></div><div class="video-control"><span>▶</span><div class="video-progress"><i></i><b></b></div><span>00:06 / 00:42</span></div></div>
              <div class="mock-log-head"><span>Captured evidence</span><span>Console · Network · Actions</span></div>
              <div class="mock-event"><span class="mock-time">00:06.0</span><span class="event-symbol click">↖</span><div><strong>Save changes clicked</strong><small>EV0003 · browser interaction</small></div></div>
              <div class="mock-event is-error"><span class="mock-time">00:06.3</span><span class="event-symbol err">!</span><div><strong>POST /api/profile <span class="error-code">HTTP 500</span></strong><small>EV0004 · recorded network failure</small></div></div>
              <div class="mock-footer">Observed evidence <span>≠</span> guessed root cause</div>
            </div>
          </div>
          <div class="floating-proof"><span class="proof-asterisk">✳</span><span><strong>One session. Many issues.</strong><small>Every moment, with its context.</small></span></div>
        </div>
      </div>
    </section>
    <section class="site-trust"><div>BUILD FOR WHAT REALLY MATTERS</div><p>Less reconstruction. More investigation. Better conversations between QA and engineering.</p></section>
    <section class="site-section workflow" id="how">
      <div class="section-intro"><p class="overline">THE WORKFLOW</p><h2>From “something broke”<br>to <em>here's exactly when.</em></h2><p>TraceCue keeps the complete session, then turns each marked moment into a focused investigation.</p></div>
      <div class="workflow-layout"><div class="steps" role="tablist" aria-label="TraceCue workflow stages">
        <button type="button" class="step active" role="tab" aria-selected="true" data-step="0"><span>01</span><div><strong>Capture once</strong><small>Start an authorized tab recording. Continue testing without restarting for each bug.</small></div></button>
        <button type="button" class="step" role="tab" aria-selected="false" data-step="1"><span>02</span><div><strong>Mark the moment</strong><small>Give issues names and save video before and after the marker.</small></div></button>
        <button type="button" class="step" role="tab" aria-selected="false" data-step="2"><span>03</span><div><strong>Follow the evidence</strong><small>Search for HTTP 500, review logs and video, and investigate with consent-based AI.</small></div></button>
        <button type="button" class="step" role="tab" aria-selected="false" data-step="3"><span>04</span><div><strong>Hand off with clarity</strong><small>Verify steps and share a human-reviewed issue report.</small></div></button>
      </div><div class="stage-preview" id="stagePreview" role="tabpanel" aria-live="polite"><span class="stage-label">01 / RECORD</span><div class="stage-icon">●</div><h3>Capture the whole story.</h3><p>One continuous tab recording preserves context across a testing session.</p><div class="stage-foot"><span>00:00</span><div class="stage-bar"><i></i></div><span>04:21</span></div></div></div>
    </section>
    <section class="site-section feature-section" id="features"><div class="section-intro"><p class="overline">BUILT AROUND EVIDENCE</p><h2>The context engineers<br><em>usually have to ask for.</em></h2><p>Capture real signals, then decide what they mean. TraceCue distinguishes recorded facts from AI hypotheses.</p></div>
      <div class="feature-grid">
        <article class="feature-card"><div class="feature-icon">◉</div><h3>One session. Multiple bugs.</h3><p>Mark separate, titled issues without breaking the full recording. Each gets its own adjustable video window.</p><span>Video and issue markers ↗</span></article>
        <article class="feature-card"><div class="feature-icon">{ }</div><h3>Logs you can actually query.</h3><p>Find console errors, HTTP failures and recorded interactions with original timestamps and event references.</p><span>Deterministic local search ↗</span></article>
        <article class="feature-card"><div class="feature-icon">✳</div><h3>Two AI paths. Your choice.</h3><p>Use supported on-device text models, or explicitly approve Firebase cloud analysis when you need it.</p><span>No silent cloud fallback ↗</span></article>
        <article class="feature-card"><div class="feature-icon">↗</div><h3>A report worth acting on.</h3><p>Annotate a frame, document expected and actual behavior, and prepare a reviewed engineering handoff.</p><span>Human verification first ↗</span></article>
      </div>
    </section>
    <section class="site-section privacy-section" id="privacy"><div class="privacy-card"><div><p class="overline">PRIVACY IS A FEATURE</p><h2>Your evidence stays yours.</h2><p>Recording and review start in your browser. TraceCue does not automatically upload full videos or publish issues. Cloud AI requires a deliberate decision and reviewed evidence.</p><a class="text-link" href="/privacy.html">How data is handled <span aria-hidden="true">↗</span></a></div><div class="privacy-graphic"><div class="privacy-ring"><span>⌁</span></div><div class="privacy-mini">Local evidence <strong>● Stored in browser</strong></div><div class="privacy-mini">Cloud analysis <strong>○ Opt-in only</strong></div></div></div></section>
    <section class="site-section install-section" id="install"><div class="install-panel"><div class="install-copy"><p class="overline">CHROME COMPANION</p><h2>Ready to explore TraceCue?</h2><p>The public Chrome Web Store release is not available yet. You can try a fictional session in Studio now or install the unpacked developer build on a test browser.</p><div class="hero-ctas"><a class="btn primary" href="/app.html?demo=1">Try the Studio demo ↗</a><a class="btn secondary" href="https://github.com/victorkay97/TraceCue/blob/feat/tracecue-foundation/docs/INSTALL.md" target="_blank" rel="noopener noreferrer">Developer install guide ↗</a></div><small>No account required · Use authorized test pages only</small></div><div class="install-status"><span class="status-overline">EXTENSION DISTRIBUTION</span><div><span class="store-icon">◫</span><strong>Chrome Web Store</strong></div><span class="store-pending">Public release pending review</span><p>We won't send you to a nonexistent install listing.</p></div></div></section>
    <section class="site-section faq-section" id="faq"><div class="section-intro"><p class="overline">GOOD QUESTIONS</p><h2>Before you get started.</h2></div><div class="faq-list">
      <details><summary>Do I need to create an account?<span>+</span></summary><p>No. The fictional demo and local recording workflow do not require registration. Cloud sync and team accounts are future capabilities.</p></details>
      <details><summary>Does TraceCue record every website automatically?<span>+</span></summary><p>No. The tester must explicitly start recording an authorized HTTP(S) tab. Browser permissions may require Chrome approval.</p></details>
      <details><summary>Does AI know the cause of a bug?<span>+</span></summary><p>It can explain captured signals and suggest hypotheses. TraceCue doesn't claim to know a server-side root cause unless sufficient evidence supports it.</p></details>
      <details><summary>Can I install it from the Chrome Web Store?<span>+</span></summary><p>Not yet. The Chrome extension is a developer preview. Follow the documented unpacked-install path on a controlled test browser, or explore Studio with fictional evidence.</p></details>
      <details><summary>Is this production-ready?<span>+</span></summary><p>No. TraceCue is under active development. The new recording controls, video clips and recovery features still need complete desktop Chrome acceptance testing.</p></details>
    </div></section>
    <section class="site-final"><p class="overline">TRACE THE MOMENT. KEEP THE CONTEXT.</p><h2>Less guesswork.<br><em>More confidence.</em></h2><a class="btn primary" href="/app.html?demo=1">Open the interactive demo ↗</a></section>
  </main>
  <footer class="site-footer"><div><a class="site-logo footer-logo" href="/"><span class="site-brand-icon">T<span>·</span></span><span>TraceCue</span></a><p>Evidence-first QA, built for the people behind quality software.</p></div><div class="footer-links"><a href="/app.html">Studio</a><a href="/privacy.html">Privacy</a><a href="https://github.com/victorkay97/TraceCue" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://github.com/victorkay97/TraceCue/blob/feat/tracecue-foundation/docs/INSTALL.md" target="_blank" rel="noopener noreferrer">Install guide</a></div><span>© 2026 TraceCue · Developer preview</span></footer>
</div>\`;
const previews=[
 {label:"01 / RECORD",symbol:"●",title:"Capture the whole story.",description:"A continuous, permissioned recording keeps the context across multiple issues.",time:"04:21",fill:"34%"},
 {label:"02 / MARK",symbol:"⚑",title:"Name the moment it went wrong.",description:"Give each incident a title and select the context before and after it.",time:"00:30",fill:"64%"},
 {label:"03 / INVESTIGATE",symbol:"⌕",title:"Find the real signal.",description:"Seek directly to recorded network failures and console events. AI hypotheses stay labeled.",time:"EV0004",fill:"76%"},
 {label:"04 / HANDOFF",symbol:"✓",title:"Make the next step obvious.",description:"Review reproduction steps and privacy before sharing each issue with engineering.",time:"Reviewed",fill:"100%"}
];
const selection=document.getElementById("stagePreview");
root.querySelectorAll("[data-step]").forEach(button=>button.addEventListener("click",()=>{
  root.querySelectorAll("[data-step]").forEach(b=>{
    const selected=b===button;b.classList.toggle("active",selected);b.setAttribute("aria-selected",String(selected));
  });
  const step=previews[Number(button.dataset.step)];
  selection.replaceChildren();
  const eyebrow=document.createElement("span");eyebrow.className="stage-label";eyebrow.textContent=step.label;
  const icon=document.createElement("div");icon.className="stage-icon";icon.textContent=step.symbol;
  const heading=document.createElement("h3");heading.textContent=step.title;
  const p=document.createElement("p");p.textContent=step.description;
  const foot=document.createElement("div");foot.className="stage-foot";
  const first=document.createElement("span");first.textContent="00:00";
  const bar=document.createElement("div");bar.className="stage-bar";
  const fill=document.createElement("i");fill.style.width=step.fill;bar.append(fill);
  const last=document.createElement("span");last.textContent=step.time;
  foot.append(first,bar,last);
  selection.append(eyebrow,icon,heading,p,foot);
}));
