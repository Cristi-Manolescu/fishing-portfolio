// /js/mobile/lib/barAnchor.js
// Sets --m-bar-top based on actual .m-logo chip position.
// Requirement: fixed exactly 10px below the logo (portrait + landscape).

export function installBarAnchor({
  logoSelector = ".m-logo",
  offsetPx = 10,
} = {}) {
  let raf = 0;
  let ro = null;

  const set = () => {
    raf = 0;
    const logo = document.querySelector(logoSelector);
    if (!logo) return;

    const r = logo.getBoundingClientRect();
    const top = Math.round(r.bottom + offsetPx);

    document.body.style.setProperty("--m-bar-top", `${top}px`);
  };

  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(set);
  };

  // prime
  schedule();

  if ("ResizeObserver" in window) {
    ro = new ResizeObserver(schedule);
    const logo = document.querySelector(logoSelector);
    if (logo) ro.observe(logo);
  }

  window.addEventListener("resize", schedule);
  window.addEventListener("orientationchange", schedule);

  return () => {
    window.removeEventListener("resize", schedule);
    window.removeEventListener("orientationchange", schedule);
    if (ro) { try { ro.disconnect(); } catch (_) {} }
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    document.body.style.removeProperty("--m-bar-top");
  };
}
