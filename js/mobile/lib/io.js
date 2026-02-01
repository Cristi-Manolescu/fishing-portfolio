// /js/mobile/lib/io.js

export function observeRatio(el, {
  root = null,
  ratio = 0.6,
  threshold = null,
  onChange,
} = {}) {
  if (!el || !("IntersectionObserver" in window)) return () => {};

  const th = threshold || [0, 0.25, ratio, 0.9, 1];

  const io = new IntersectionObserver((entries) => {
    const e = entries[0];
    const on = !!e && e.isIntersecting && e.intersectionRatio >= ratio;
    onChange?.(on, e);
  }, { root, threshold: th });

  io.observe(el);
  return () => io.disconnect();
}

/**
 * Deterministic “active at top” check for a panel inside a scroller.
 * Useful to set initial state without waiting for IO to fire.
 */
export function installTopProximityClass({
  scroller,
  el,
  className,
  activePx = 8,
  axis = "y",
} = {}) {
  if (!scroller || !el || !className) return () => {};

  const apply = () => {
    const y = scroller.scrollTop || 0;
    const top = el.offsetTop || 0;
    const on = axis === "y" ? (Math.abs(y - top) <= activePx) : false;
    document.body.classList.toggle(className, on);
  };

  // initial (iOS-friendly double-tap)
  requestAnimationFrame(apply);
  const t = setTimeout(apply, 60);

  // keep it correct after viewport changes
  const vv = window.visualViewport;
  vv?.addEventListener("resize", apply, { passive: true });
  window.addEventListener("resize", apply, { passive: true });
  window.addEventListener("orientationchange", apply, { passive: true });

  return () => {
    clearTimeout(t);
    vv?.removeEventListener("resize", apply);
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", apply);
  };
}
