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
  });

  const vs = installViewportStabilizer({
  scroller,
  panelSelector: "#m-acasa .m-panel",
  settleMs: 260,
});

const cleanupSnap = installSnapAssist({
  scroller,
  panelSelector: "#m-acasa .m-panel",
  freeScrollEl: rendered.els.feedPanel, // ✅ pass element directly (no selector query)
  shouldSkip: () => vs.isResizing(),
  settleMs: 140,
  durationMs: 520,
});


  const cleanupTickerLive = installLiveClass({
    scroller,
    targetEl: rendered.els.screen2,
    className: "is-live",
    showDelayMs: 300,
    liveRatio: 0.6,
  });

  const cleanupParallax = installHeroParallax(
    rendered.els.feedPanel,
    { scroller }
  );

  return () => {
    cleanupParallax?.();
    cleanupTickerLive?.();
    rendered.destroy?.();
    cleanupSnap?.();
    vs?.destroy?.();
  };
}
