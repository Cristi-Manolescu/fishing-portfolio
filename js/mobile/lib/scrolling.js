// /js/mobile/lib/scrolling.js

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Panel snap assist for a single scroller (NOT window).
 * - Snaps only when already near a panel top (SNAP_ZONE).
 * - Skips while inside free scroll area (e.g., feed).
 * - Cancels if user interacts again (capture-phase listeners).
 */
export function installSnapAssist({
  scroller,
  panelSelector = ".m-panel",
  freeScrollEl = null,
  freeScrollSelector = null, // optional, for convenience
  shouldSkip = null,
  settleMs = 140,
  durationMs = 520,
  minDeltaPx = 6,
} = {}) {
  if (!scroller) return () => {};

  const getPanels = () => Array.from(document.querySelectorAll(panelSelector));

  let settleT = 0;
  let raf = 0;
  let animating = false;
  let lastUserTs = 0;

  const stopAnim = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    animating = false;
  };

  const userInteracted = () => {
    lastUserTs = performance.now();
    stopAnim();
  };

  // capture-phase so touches inside ticker/banner always cancel snap
  window.addEventListener("wheel", userInteracted, { passive: true, capture: true });
  window.addEventListener("touchstart", userInteracted, { passive: true, capture: true });
  window.addEventListener("touchmove", userInteracted, { passive: true, capture: true });
  window.addEventListener("pointerdown", userInteracted, { passive: true, capture: true });
  window.addEventListener("pointermove", userInteracted, { passive: true, capture: true });

  const getY = () => scroller.scrollTop || 0;
  const getVH = () => scroller.clientHeight || window.innerHeight;

  const setScrollTop = (y) => {
    if (typeof scroller.scrollTo === "function") scroller.scrollTo({ top: y, left: 0, behavior: "auto" });
    else scroller.scrollTop = y;
  };

  const animateScrollTo = (targetY) => {
    const startY = getY();
    const delta = targetY - startY;
    if (Math.abs(delta) < minDeltaPx) return;

    const startT = performance.now();
    animating = true;

    const step = (now) => {
      // if user touches again, abort
      if (now - lastUserTs < 120) {
        stopAnim();
        return;
      }

      const t = Math.min(1, (now - startT) / durationMs);
      const e = easeInOutCubic(t);
      setScrollTop(startY + delta * e);

      if (t < 1) raf = requestAnimationFrame(step);
      else stopAnim();
    };

    raf = requestAnimationFrame(step);
  };

  const resolveFreeScrollEl = () => freeScrollEl || (freeScrollSelector ? document.querySelector(freeScrollSelector) : null);

  const isInsideFreeScroll = () => {
    const el = resolveFreeScrollEl();
    if (!el) return false;

    const top = el.offsetTop; // stable inside same scroller
    const y = getY();
    return y >= top - 10;
  };

  const snapToNearest = () => {
    if (animating) return;
    if (shouldSkip?.()) return;
    if (isInsideFreeScroll()) return;

    const panels = getPanels();
    if (!panels.length) return;

    const y = getY();
    const vh = getVH();
    const SNAP_ZONE = vh * 0.12;

    let bestTop = null;
    let bestDist = Infinity;

    for (const p of panels) {
      const top = p.offsetTop;
      const d = Math.abs(top - y);
      if (d < bestDist) { bestDist = d; bestTop = top; }
    }

    if (bestTop == null) return;
    if (bestDist > SNAP_ZONE) return;

    animateScrollTo(bestTop);
  };

  const onScroll = () => {
    if (settleT) clearTimeout(settleT);
    settleT = setTimeout(snapToNearest, settleMs);
  };

  scroller.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    scroller.removeEventListener("scroll", onScroll);

    window.removeEventListener("wheel", userInteracted, { capture: true });
    window.removeEventListener("touchstart", userInteracted, { capture: true });
    window.removeEventListener("touchmove", userInteracted, { capture: true });
    window.removeEventListener("pointerdown", userInteracted, { capture: true });
    window.removeEventListener("pointermove", userInteracted, { capture: true });

    if (settleT) clearTimeout(settleT);
    stopAnim();
  };
}


/**
 * Keeps the user anchored to the nearest panel during iOS visualViewport changes.
 * Returns { isResizing, destroy } like your original.
 */
export function installViewportStabilizer({
  scroller,
  panelSelector = ".m-panel",
  settleMs = 260,
} = {}) {
  if (!scroller) return { isResizing: () => false, destroy() {} };

  const panels = () => Array.from(document.querySelectorAll(panelSelector));

  let resizing = false;
  let t = 0;
  let lastAnchorIndex = 0;

  const getY = () => scroller.scrollTop || 0;

  const nearestPanelIndex = () => {
    const list = panels();
    if (!list.length) return 0;

    const y = getY();
    let best = 0;
    let bestDist = Infinity;

    for (let i = 0; i < list.length; i++) {
      const top = list[i].offsetTop;
      const d = Math.abs(top - y);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  };

  const snapToIndexImmediate = (i) => {
    const list = panels();
    if (!list.length) return;
    const idx = Math.max(0, Math.min(list.length - 1, i | 0));
    const top = list[idx].offsetTop;
    scroller.scrollTo({ top, left: 0, behavior: "auto" });
  };

  const begin = () => {
    lastAnchorIndex = nearestPanelIndex();
    resizing = true;

    if (t) clearTimeout(t);
    t = setTimeout(() => {
      snapToIndexImmediate(lastAnchorIndex);
      resizing = false;
      t = 0;
    }, settleMs);
  };

  const vv = window.visualViewport;
  vv?.addEventListener("resize", begin, { passive: true });
  window.addEventListener("orientationchange", begin, { passive: true });
  window.addEventListener("resize", begin, { passive: true });

  return {
    isResizing: () => resizing,
    destroy: () => {
      vv?.removeEventListener("resize", begin);
      window.removeEventListener("orientationchange", begin);
      window.removeEventListener("resize", begin);
      if (t) clearTimeout(t);
      t = 0;
      resizing = false;
    },
  };
}
