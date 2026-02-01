// /js/mobile/lib/scroller.js
export function getScroller(selector = "#m-root") {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Mobile scroller contract broken: missing ${selector}`);
  return el;
}

export function freezeScroller(scroller) {
  if (!scroller) return;
  scroller.dataset._prevOverflowY = scroller.style.overflowY || "";
  scroller.style.overflowY = "hidden";
}

export function unfreezeScroller(scroller) {
  if (!scroller) return;
  const prev = scroller.dataset._prevOverflowY ?? "";
  scroller.style.overflowY = prev;
  delete scroller.dataset._prevOverflowY;
}
