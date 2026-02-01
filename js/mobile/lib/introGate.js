// /js/mobile/lib/introGate.js
import { observeRatio, installTopProximityClass } from "./io.js";

export function installIntroBrandVisibility(introEl, {
  scroller,
  className = "m-intro-on",
  ratio = 0.6,
  activePx = 8,
} = {}) {
  if (!introEl || !scroller) return () => {};

  // deterministic initial/resize correctness
  const cleanupTop = installTopProximityClass({
    scroller,
    el: introEl,
    className,
    activePx,
  });

  // ongoing visibility updates
  const cleanupIO = observeRatio(introEl, {
    root: scroller,
    ratio,
    onChange: (on) => document.body.classList.toggle(className, !!on),
  });

  return () => {
    cleanupIO?.();
    cleanupTop?.();
    document.body.classList.remove(className);
  };
}
