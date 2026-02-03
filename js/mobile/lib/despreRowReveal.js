// ./js/mobile/lib/despreRowReveal.js
// Row reveal for Despre Screen 3.
// - Reveals rows on-demand using IntersectionObserver
// - Landscape-friendly: treats 1-row viewport as "full height" condition
// - Latches rows (never yo-yo)

function isLandscape() {
  return window.matchMedia?.("(orientation: landscape)")?.matches;
}

function getViewportRect(scroller) {
  const r = scroller.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, height: r.height };
}

function isRowFullyVisible(scroller, rowEl, slackPx = 1) {
  const vr = getViewportRect(scroller);
  const rr = rowEl.getBoundingClientRect();
  return rr.top >= vr.top - slackPx && rr.bottom <= vr.bottom + slackPx;
}

export function installDespreRowReveal({
  scroller,
  rootEl,                 // rendered.els.screen3 or rendered.els.section
  rowsSelector = ".m-despre__row",
} = {}) {
  if (!scroller || !rootEl) return () => {};

  const rows = Array.from(rootEl.querySelectorAll(rowsSelector));
  if (!rows.length) return () => {};

  const revealed = new WeakSet();

  const revealRow = (row) => {
    if (!row || revealed.has(row)) return;
    revealed.add(row);
    row.classList.add("is-revealed");
  };

  // ✅ Initial trigger:
  // Reveal first row as soon as Screen 3 is active AND the row fits fully.
  const primeFirstRow = () => {
    const first = rows[0];
    if (!first) return;

    // Portrait: we require full visibility (fits entirely).
    // Landscape: also require full visibility, but that's the single-row condition.
    if (isRowFullyVisible(scroller, first, 1)) revealRow(first);
  };

  // Observer config:
  // - Portrait: stricter threshold so it feels like "row enters the viewport as a whole"
  // - Landscape: looser threshold because each row is a full "scene"
  const mkObserver = () => {
    const landscape = isLandscape();

    const threshold = landscape ? 0.55 : 0.92;
    const rootMargin = landscape ? "0px 0px -10% 0px" : "0px 0px -4% 0px";

    return new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;

          // Portrait: require near-full row visibility
          // Landscape: treat a single row view as sufficient
          if (e.intersectionRatio >= threshold) {
            revealRow(e.target);
          }
        }
      },
      {
        root: scroller,
        threshold: [threshold],
        rootMargin,
      }
    );
  };

  let io = mkObserver();
  rows.forEach((r) => io.observe(r));

  // Handle orientation changes: rebuild observer thresholds/rootMargin
  const onResize = () => {
    try { io.disconnect(); } catch (_) {}
    io = mkObserver();
    rows.forEach((r) => io.observe(r));
    primeFirstRow();
  };

  // Prime after first paint(s)
  primeFirstRow();
  requestAnimationFrame(primeFirstRow);

  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    try { io.disconnect(); } catch (_) {}
  };
}
