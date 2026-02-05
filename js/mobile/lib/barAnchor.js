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

  const isLandscape =
    window.matchMedia?.("(orientation: landscape)")?.matches ??
    (window.innerWidth > window.innerHeight);

  const lr = logo.getBoundingClientRect();

  // Find bar (if present) so we can measure its rendered height
  const barInner = document.querySelector("#m-topbar .m-topbar__inner");
  const br = barInner?.getBoundingClientRect?.() || null;

  // Portrait: bar is 10px under logo
  // Landscape: bar is vertically centered with logo (real DOM math)
  let top;
  if (!isLandscape) {
    top = Math.round(lr.bottom + offsetPx);
  } else {
    const barH = br?.height || 0;
    top = Math.round(lr.top + Math.max(0, (lr.height - barH) / 2));
  }

  document.body.style.setProperty("--m-bar-top", `${top}px`);

  // Also expose logo width for left-padding calculations (used later)
  document.body.style.setProperty("--m-bar-pad-left", `${Math.round(lr.width)}px`);

  // once we have logo, observe it for size/layout changes
  if ("ResizeObserver" in window && !ro) {
    ro = new ResizeObserver(schedule);
    try { ro.observe(logo); } catch (_) {}
    if (barInner) { try { ro.observe(barInner); } catch (_) {} }
  }

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
