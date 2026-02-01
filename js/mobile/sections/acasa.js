import { getScroller } from "../lib/scroller.js";
import { installHeroParallax } from "../lib/parallax.js";
import { installLiveClass } from "../lib/liveState.js";

import { renderMobileAcasaFeed } from "../../mobileAcasaFeed.js";

import { installSnapAssist, installViewportStabilizer } from "../lib/scrolling.js";


export async function startMobileAcasa({ navigate } = {}) {
  const scroller = getScroller("#m-root");

const rendered = await renderMobileAcasaFeed({
  mountId: "m-root",
  navigate,
  scroller,
});

  const { carousel } = rendered.api || {};

  const vs = installViewportStabilizer({
  scroller,
  panelSelector: "#m-acasa .m-panel",
  settleMs: 260,
});

const cleanupSnap = installSnapAssist({
  scroller,
  panelSelector: "#m-acasa .m-panel",
  freeScrollEl: rendered.els.feedPanel,
  shouldSkip: () => vs.isResizing() || scroller.dataset.dragLock === "1",
  settleMs: 140,
  durationMs: 520,
});

const cleanupScreen2Live = installLiveClass({
  scroller,
  targetEl: rendered.els.screen2,
  className: "is-live",

  // stable “live” with hysteresis
  enterRatio: 0.86,
  enterDelayMs: 300,
  exitRatio: 0.62,
  exitDelayMs: 260,
  minOnMs: 600,

  // ✅ carousel follows the same live truth as ticker
  onEnter: () => carousel?.start?.(),
  onExit: () => carousel?.stop?.(),
});


  const cleanupParallax = installHeroParallax(
    rendered.els.feedPanel,
    { scroller }
  );

return () => {
  cleanupParallax?.();
  cleanupSnap?.();
  vs?.destroy?.();
  cleanupScreen2Live?.();
  rendered.destroy?.();
};

}
