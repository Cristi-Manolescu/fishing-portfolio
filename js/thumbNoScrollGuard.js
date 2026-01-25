// /js/thumbNoScrollGuard.js
// When ALL thumbs fit in the viewport:
// - disable horizontal scroll (wheel / trackpad too)
// - hide & disable nav arrows (no hover ghosts)
// - reset BOTH scrollLeft AND any transform/translate rail offset (centering fix)
// - keep it synced on resize / image load

function fitsX(viewport) {
  if (!viewport) return true;
  return viewport.scrollWidth <= viewport.clientWidth + 1;
}

function getRail(mount) {
  return (
    mount.querySelector(".thumb-rail") ||
    mount.querySelector(".thumbs-rail") ||
    mount.querySelector("[data-rail]") ||
    null
  );
}

/**
 * ✅ IMPORTANT:
 * createAcasaThumbs often animates by setting transform on the rail.
 * If we don't reset it when content "fits", centering breaks.
 */
function resetRailPosition(mount) {
  const rail = getRail(mount);
  if (!rail) return;

  // Kill transform-based offset
  rail.style.transform = "translate3d(0,0,0)";
  rail.style.translate = "0 0"; // harmless if unsupported

  // Kill common custom offset storage (safe even if unused)
  delete rail.dataset.tx;
  delete rail.dataset.offset;
  delete rail.dataset.x;
  rail.style.removeProperty("--tx");
  rail.style.removeProperty("--x");
}

function setArrowsHidden(mount, hidden) {
  const left = mount.querySelector(".thumb-arrow.left");
  const right = mount.querySelector(".thumb-arrow.right");

  for (const btn of [left, right]) {
    if (!btn) continue;

    if (hidden) {
      btn.classList.add("is-hidden", "is-disabled");
      btn.setAttribute("aria-disabled", "true");
      btn.tabIndex = -1;

      // hard block hover/click ghosts
      btn.style.setProperty("pointer-events", "none", "important");
      btn.style.setProperty("visibility", "hidden", "important");
      btn.style.setProperty("opacity", "0", "important");
    } else {
      btn.classList.remove("is-hidden", "is-disabled");
      btn.removeAttribute("aria-disabled");
      btn.tabIndex = 0;

      btn.style.removeProperty("pointer-events");
      btn.style.removeProperty("visibility");
      btn.style.removeProperty("opacity");
    }
  }
}

function syncArrowDisabled(mount, viewport) {
  const left = mount.querySelector(".thumb-arrow.left");
  const right = mount.querySelector(".thumb-arrow.right");
  if (!left || !right || !viewport) return;

  if (viewport.dataset.noscroll === "1") return;

  const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const clamped = Math.max(0, Math.min(max, viewport.scrollLeft || 0));
  if (Math.abs(clamped - viewport.scrollLeft) > 0.5) viewport.scrollLeft = clamped;

  const atStart = clamped <= 0.5;
  const atEnd = clamped >= (max - 0.5);

  left.classList.toggle("is-disabled", atStart);
  right.classList.toggle("is-disabled", atEnd);

  left.setAttribute("aria-disabled", atStart ? "true" : "false");
  right.setAttribute("aria-disabled", atEnd ? "true" : "false");

  left.tabIndex = atStart ? -1 : 0;
  right.tabIndex = atEnd ? -1 : 0;
}

function lockNoScroll(viewport) {
  viewport.dataset.noscroll = "1";
  viewport.scrollLeft = 0;

  viewport.style.setProperty("overflow-x", "hidden", "important");
  viewport.style.setProperty("overscroll-behavior", "none", "important");
  viewport.style.setProperty("touch-action", "none", "important");
}

function unlockNoScroll(viewport) {
  delete viewport.dataset.noscroll;

  viewport.style.removeProperty("overflow-x");
  viewport.style.removeProperty("overscroll-behavior");
  viewport.style.removeProperty("touch-action");
}

export function installNoScrollWhenFits(mount) {
  if (!mount) return () => {};

  const viewport = mount.querySelector(".thumb-viewport");
  if (!viewport) return () => {};

  const host = mount.closest(".mid-panel-inner") || mount.parentElement || mount;

  let raf = 0;

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      applyNow();
    });
  }

  function applyNow() {
    const fits = fitsX(viewport);
    const wasFits = viewport.dataset._fits === "1";

    viewport.dataset._fits = fits ? "1" : "0";

    if (fits) {
      // ✅ When it fits, it MUST be centered => wipe any previous slide offset
      lockNoScroll(viewport);
      viewport.scrollLeft = 0;
      resetRailPosition(mount);

      // settle once more next frame (fonts/images/layout)
      requestAnimationFrame(() => {
        viewport.scrollLeft = 0;
        resetRailPosition(mount);
      });

      setArrowsHidden(mount, true);
      return;
    }

    // doesn't fit
    unlockNoScroll(viewport);
    setArrowsHidden(mount, false);

    // ✅ Critical: if we just came from "fits", reset to HOME so we don't resurrect old slide state
    if (wasFits) {
      viewport.scrollLeft = 0;
      resetRailPosition(mount);
      requestAnimationFrame(() => {
        viewport.scrollLeft = 0;
        resetRailPosition(mount);
        syncArrowDisabled(mount, viewport);
      });
      return;
    }

    // normal clamp + arrow sync
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollLeft = Math.max(0, Math.min(max, viewport.scrollLeft || 0));

    syncArrowDisabled(mount, viewport);
    requestAnimationFrame(() => syncArrowDisabled(mount, viewport));
  }

  // HARD BLOCK wheel/trackpad when locked
  function onWheel(e) {
    if (viewport.dataset.noscroll !== "1") return;

    e.preventDefault();
    e.stopPropagation();

    viewport.scrollLeft = 0;
    resetRailPosition(mount);
  }

  viewport.addEventListener("wheel", onWheel, { passive: false, capture: true });

  // Keep arrows correct during scroll when unlocked
  function onScroll() {
    if (viewport.dataset.noscroll === "1") {
      if (viewport.scrollLeft !== 0) viewport.scrollLeft = 0;
      return;
    }
    syncArrowDisabled(mount, viewport);
  }
  viewport.addEventListener("scroll", onScroll, { passive: true });

  // Observers
  const ro = new ResizeObserver(schedule);
  ro.observe(viewport);
  ro.observe(host);

  const onWinResize = () => schedule();
  window.addEventListener("resize", onWinResize, { passive: true });

  const onLoad = (e) => {
    if (e.target && e.target.tagName === "IMG") schedule();
  };
  mount.addEventListener("load", onLoad, true);

  // Initial
  applyNow();
  requestAnimationFrame(applyNow);

  return () => {
    if (raf) cancelAnimationFrame(raf);

    try { ro.disconnect(); } catch {}
    window.removeEventListener("resize", onWinResize);
    mount.removeEventListener("load", onLoad, true);

    viewport.removeEventListener("wheel", onWheel, { capture: true });
    viewport.removeEventListener("scroll", onScroll);
  };
}
