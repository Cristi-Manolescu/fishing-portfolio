// /js/mobile/lib/dom.js
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function createCleanupBag() {
  const fns = [];
  return {
    add(fn) { if (typeof fn === "function") fns.push(fn); return fn; },
    run() {
      for (let i = fns.length - 1; i >= 0; i--) {
        try { fns[i](); } catch {}
      }
      fns.length = 0;
    },
  };
}
