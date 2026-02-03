// ./js/mobile/lib/rowReveal.js
// Row-based reveal for a scroll container (NOT window).
// - Uses IntersectionObserver with root = scroller
// - Reveals a row only when its full height can fit in the viewport area
// - No “yo-yo”: once revealed, it stays revealed

export function installRowReveal({
  scroller,
  containerEl,
  rowSelector = ".m-despre__row",
  revealedClass = "is-revealed",
} = {}) {
  if (!scroller) throw new Error("installRowReveal: scroller missing");
  if (!containerEl) throw new Error("installRowReveal: containerEl missing");

  const rows = Array.from(containerEl.querySelectorAll(rowSelector));
  if (!rows.length) return { destroy() {} };

  let io = null;
  let rowH = 0;
  let gap = 0;
  let raf = 0;

  function readMetrics() {
    const r0 = rows.find((r) => r.isConnected);
    if (!r0) return;

    const rect = r0.getBoundingClientRect();
    rowH = Math.max(1, Math.round(rect.height));

    // Try to read gap from CSS var (--gap) on container, fallback 3
    const cs = getComputedStyle(containerEl);
    const v = parseFloat(cs.getPropertyValue("--gap"));
    gap = Number.isFinite(v) ? v : 3;
  }

  function fitsInViewport(rowEl) {
    // “available space below >= row height (+ gap)”
    const rowRect = rowEl.getBoundingClientRect();
    const rootRect = scroller.getBoundingClientRect();
    const viewportH = rootRect.height;

    // row top relative to root viewport
    const top = rowRect.top - rootRect.top;

    // needs enough room from row top to viewport bottom
    return top >= 0 && (top + rowH + gap) <= viewportH + 0.5;
  }

  function reveal(rowEl) {
    if (!rowEl || rowEl.classList.contains(revealedClass)) return;
    rowEl.classList.add(revealedClass);
  }

  function scheduleCheck() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      // reveal any rows that now fit (useful after resize / address bar settle)
      for (const row of rows) {
        if (row.classList.contains(revealedClass)) continue;
        if (fitsInViewport(row)) reveal(row);
        else break; // keep it sequential top->bottom
      }
    });
  }

  function setupIO() {
    if (io) try { io.disconnect(); } catch (_) {}
    io = null;

    readMetrics();

    // Make "enter viewport" stricter by shrinking the effective bottom edge:
    // row triggers only when its top is above (viewportBottom - rowH - gap)
    const bottomMargin = Math.ceil(rowH + gap);
    const rootMargin = `0px 0px -${bottomMargin}px 0px`;

    io = new IntersectionObserver(
      (entries) => {
        // Maintain strict top->bottom order: reveal only the first unrevealed row that qualifies
        for (const row of rows) {
          if (row.classList.contains(revealedClass)) continue;

          // only reveal if row is intersecting AND it fits entirely
          const entry = entries.find((e) => e.target === row);
          const isOnScreen = entry ? entry.isIntersecting : false;

          if (isOnScreen && fitsInViewport(row)) {
            reveal(row);
            // after revealing one, schedule another check (maybe next one also fits)
            scheduleCheck();
          }
          break;
        }
      },
      {
        root: scroller,
        threshold: 0.01,
        rootMargin,
      }
    );

    for (const row of rows) io.observe(row);

    // Initial pass (first row should trigger as soon as Screen 3 becomes active AND fits)
    scheduleCheck();
  }

  // Resize / address bar changes
  const onResize = () => {
    setupIO();
  };

  setupIO();
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });

  return {
    checkNow: scheduleCheck,
    destroy() {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (raf) cancelAnimationFrame(raf);
      if (io) try { io.disconnect(); } catch (_) {}
    },
  };
}
