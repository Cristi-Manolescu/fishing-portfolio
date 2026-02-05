// /js/mobile/lib/barAnchor.js
// Sets --m-bar-top based on actual .m-logo chip position.
// Requirement: fixed exactly 10px below the logo (portrait + landscape).
// ✅ Late-bind: survives logo injected after boot.

export function installBarAnchor({
  logoSelector = ".m-logo",
  offsetPx = 10,
} = {}) {
  let raf = 0;
  let ro = null;
  let mo = null;
  let stopped = false;

  const set = () => {
    raf = 0;
    if (stopped) return;

    const logo = document.querySelector(logoSelector);
    if (!logo) return;

    const r = logo.getBoundingClientRect();
    const top = Math.round(r.bottom + offsetPx);
    document.body.style.setProperty("--m-bar-top", `${top}px`);

    // once we have logo, observe it for size/layout changes
    if ("ResizeObserver" in window && !ro) {
      ro = new ResizeObserver(schedule);
      try { ro.observe(logo); } catch (_) {}
    }

    // if we were waiting via MutationObserver, we can stop
    if (mo) { try { mo.disconnect(); } catch (_) {} mo = null; }
  };

  const schedule = () => {
    if (raf || stopped) return;
    raf = requestAnimationFrame(set);
  };

  // ✅ If logo isn’t in DOM yet, watch for it
  const ensureLogoExists = () => {
    if (document.querySelector(logoSelector)) return;
    if ("MutationObserver" in window && !mo) {
      mo = new MutationObserver(() => schedule());
      try { mo.observe(document.documentElement, { childList: true, subtree: true }); } catch (_) {}
    }
  };

  // prime
  ensureLogoExists();
  schedule();

  window.addEventListener("resize", schedule);
  window.addEventListener("orientationchange", schedule);

  return () => {
    stopped = true;
    window.removeEventListener("resize", schedule);
    window.removeEventListener("orientationchange", schedule);

    if (mo) { try { mo.disconnect(); } catch (_) {} mo = null; }
    if (ro) { try { ro.disconnect(); } catch (_) {} ro = null; }
    if (raf) cancelAnimationFrame(raf);
    raf = 0;

    document.body.style.removeProperty("--m-bar-top");
  };
}
