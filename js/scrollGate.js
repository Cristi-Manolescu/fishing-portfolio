// /js/scrollGate.js
// Global "no page scroll" gate used in mid-stage sections.
// IMPORTANT:
// - Fully reversible (disable removes listeners)
// - Must NOT block wheel scrolling inside intended scroll areas (ticker, overlays, inputs)

let enabled = false;

const OPTS_WHEEL = { passive: false, capture: true };
const OPTS_KEY = { capture: true };

function normTarget(t) {
  // Wheel/key events can sometimes report weird targets (text nodes etc.)
  if (!t) return null;
  if (t.nodeType === 3) return t.parentElement; // TEXT_NODE
  return t instanceof Element ? t : null;
}

function isAllowedTarget(raw) {
  const t = normTarget(raw);
  if (!t) return false;

  // Inputs should always work
  if (t.closest("input, textarea, select, [contenteditable='true']")) return true;

  // ✅ Allow scrolling / interaction inside overlay (PhotoSystem)
  if (t.closest(".ps-overlay, #overlay-root")) return true;

  // ✅ Allow scrolling inside Acasa overlay ticker (Acasa-only)
  if (t.closest("#acasa-ticker")) return true;

  // ✅ Allow scrolling inside PanelTicker (Partide / Despre / others)
  // - .pt-scroll is the actual scroll container
  // - .panel-ticker is the mount wrapper used by sectionWithSubsubsections
  if (t.closest(".pt-scroll, .panel-ticker")) return true;

  // ✅ If you ever embed other tickers as scroll containers
  if (t.closest(".acasa-ticker, .lacuri-ticker")) return true;

  // ✅ Allow anything inside stage mounts (safe: they are isolated and expected to be interactive)
  // This prevents edge cases where events originate from inner spans/SVGs inside the stage.
  if (t.closest("#partide-stage, #despre-stage, #galerie-stage")) return true;

  // ✅ Allow anything inside the mid overlay (banner/ticker/dots layer)
  // (still harmless, but stage tickers no longer depend on it)
  if (t.closest("#mid-content")) return true;

  return false;
}

function onWheel(e) {
  if (!enabled) return;
  if (isAllowedTarget(e.target)) return;

  if (e.cancelable) e.preventDefault();
  e.stopPropagation();
}

function onTouchMove(e) {
  if (!enabled) return;
  if (isAllowedTarget(e.target)) return;

  if (e.cancelable) e.preventDefault();
  e.stopPropagation();
}

function onKeyDown(e) {
  if (!enabled) return;
  if (isAllowedTarget(e.target)) return;

  const k = e.key;
  const scrollKeys = [
    "ArrowUp", "ArrowDown",
    "PageUp", "PageDown",
    "Home", "End",
    " ",
  ];

  if (scrollKeys.includes(k)) {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
  }
}

export function enableScrollGate() {
  if (enabled) return;
  enabled = true;

  document.documentElement.classList.add("is-scroll-gated");

  window.addEventListener("wheel", onWheel, OPTS_WHEEL);
  window.addEventListener("touchmove", onTouchMove, OPTS_WHEEL);
  window.addEventListener("keydown", onKeyDown, OPTS_KEY);
}

export function disableScrollGate() {
  if (!enabled) return;
  enabled = false;

  document.documentElement.classList.remove("is-scroll-gated");

  window.removeEventListener("wheel", onWheel, OPTS_WHEEL);
  window.removeEventListener("touchmove", onTouchMove, OPTS_WHEEL);
  window.removeEventListener("keydown", onKeyDown, OPTS_KEY);
}
