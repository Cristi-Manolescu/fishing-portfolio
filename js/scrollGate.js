// /js/scrollGate.js
// Global "no page scroll" gate used in sections like Lacuri.
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

  // ✅ Allow anything inside the mid overlay (ticker lives there)
  // This prevents “target mismatch” when ticker is rebuilt / contains spans / etc.
  if (t.closest("#mid-content")) return true;

  // Allow scrolling inside tickers (Acasa/Despre + Lacuri sub ticker)
  if (t.closest("#acasa-ticker, .acasa-ticker, .lacuri-ticker")) return true;

  // Allow scrolling / interaction inside overlay (PhotoSystem)
  if (t.closest(".ps-overlay, #overlay-root")) return true;

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
