// /js/mobile/lib/scroller.js

export function getScroller(sel = "#m-root") {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`Mobile scroller contract broken: missing ${sel}`);
  return el;
}

/**
 * Temporarily freeze scrolling on a scroller.
 * axis:
 *  - "y" => lock vertical (recommended for horizontal drags)
 *  - "x" => lock horizontal (rare)
 *  - "both" => lock both
 */
export function freezeScroller(scroller, { axis = "y" } = {}) {
  if (!scroller) return;

  // idempotent
  if (scroller.dataset._freeze === "1") return;
  scroller.dataset._freeze = "1";
  scroller.dataset._freezeAxis = axis;

  // remember prior inline styles (do NOT read computed)
  scroller.dataset._prevOverflowX = scroller.style.overflowX || "";
  scroller.dataset._prevOverflowY = scroller.style.overflowY || "";

  if (axis === "y" || axis === "both") scroller.style.overflowY = "hidden";
  if (axis === "x" || axis === "both") scroller.style.overflowX = "hidden";

  // contract for other systems (snap assist)
  scroller.dataset.dragLock = "1";
}

export function unfreezeScroller(scroller) {
  if (!scroller) return;

  if (scroller.dataset._freeze !== "1") return;
  scroller.dataset._freeze = "0";

  scroller.style.overflowX = scroller.dataset._prevOverflowX || "";
  scroller.style.overflowY = scroller.dataset._prevOverflowY || "";

  delete scroller.dataset._prevOverflowX;
  delete scroller.dataset._prevOverflowY;
  delete scroller.dataset._freezeAxis;

  delete scroller.dataset.dragLock;
  delete scroller.dataset._freeze;
}
