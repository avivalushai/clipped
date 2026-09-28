// Visit and click counts for the website, in Amplitude (EU). Nothing about the
// plugin or anyone's boards: event names and a few short labels, no cookies, no
// IP addresses. On localhost nothing is sent — events land in window.__events
// so the page can be checked without polluting the numbers.
(() => {
  const KEY = "d398601f6186e479a6344b8b0719db87";
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const page = location.pathname.endsWith("install.html") ? "install_guide" : "landing";
  let send;

  if (local) {
    window.__events = [];
    send = (name, props) => window.__events.push({ name, ...props });
  } else {
    const start = () => {
      const a = window.amplitude;
      if (!a) return;
      a.init(KEY, {
        serverZone: "EU",
        identityStorage: "localStorage",
        trackingOptions: { ipAddress: false },
        autocapture: { pageViews: true, sessions: true, attribution: false, formInteractions: false, fileDownloads: false, elementInteractions: false },
      });
    };
    if (window.amplitude) start(); else addEventListener("load", start);
    send = (name, props) => window.amplitude && window.amplitude.track(name, props);
  }

  const track = (name, props = {}) => { try { send(name, { page, ...props }); } catch (e) { /* counting never breaks the page */ } };
  const where = (el) => (el.closest("header") ? "header" : el.closest("footer") ? "footer" : el.closest(".hero, .guide-hero") ? "hero" : "page");
  const clip = (s) => (s || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const METHOD = { "p-shell": "terminal", "p-slash": "claude_code", "p-ask": "ask_claude" };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("a, button");
    if (!el) return;
    if (el.getAttribute("role") === "tab") return track("Install method chosen", { method: METHOD[el.getAttribute("aria-controls")] || clip(el.textContent) });
    if (el.classList.contains("copy")) {
      const panel = el.closest('[role="tabpanel"]');
      const route = el.closest(".route");
      return track("Install command copied", {
        method: panel ? METHOD[panel.id] || panel.id : route ? clip(route.querySelector("h3")?.textContent) : clip(el.closest("section")?.id),
      });
    }
    if (el.classList.contains("nav-cta")) return track("Install button clicked", { where: where(el) });
    const href = el.getAttribute("href") || "";
    if (/install\.html$/.test(href)) return track("Install guide opened", { where: where(el) });
    if (href.includes("github.com/avivalushai/clipped")) return track("GitHub clicked", { where: where(el) });
  }, true);

  document.addEventListener("toggle", (e) => {
    const d = e.target;
    if (d.tagName === "DETAILS" && d.open) track("FAQ opened", { question: clip(d.querySelector("summary")?.textContent) });
  }, true);
})();
