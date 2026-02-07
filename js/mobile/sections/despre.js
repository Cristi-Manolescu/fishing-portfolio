// ./js/mobile/sections/despre.js
import { getScroller } from "../lib/scroller.js";
import { installLiveClass } from "../lib/liveState.js";
import { installSnapAssist, installViewportStabilizer } from "../lib/scrolling.js";
import { resolveBgByLabel, BG_ORDER } from "../../content.js";
import { createBackgroundManager } from "../../backgrounds.js";
import { installDespreRowReveal } from "../lib/despreRowReveal.js";
import { setMobileHeaderState } from "../mobileHeader.js";

import { onRouteChange, parseHash } from "../../router.js";
import { mobileDespreFeed } from "../mobileDespreFeed.js";
import { mobileDespreArticleView } from "../mobileDespreArticle.js";

export async function startMobileDespre({ navigate } = {}) {
  const scroller = getScroller("#m-root");

  // ✅ Despre FEED uses global bar overlay; do NOT keep scroller top padding contract
const _prevPadTop = scroller?.style?.paddingTop || "";
const _prevPadBottom = scroller?.style?.paddingBottom || "";
try {
  scroller.style.paddingTop = "0px";
  scroller.style.paddingBottom = "0px";
} catch (_) {}


  let stopRoute = null;

  let rendered = null; // { els, api, destroy }
  let cleanup = null;  // feed-only cleanups

  function destroyActive() {
    try { cleanup?.(); } catch (_) {}
    cleanup = null;

    try { rendered?.destroy?.(); } catch (_) {}
    rendered = null;
  }

  function setBg(label) {
    const bgEl = document.getElementById("bg");
    if (!bgEl) return;
    const BG_BY_LABEL = resolveBgByLabel();
    const bg = createBackgroundManager(bgEl, { order: BG_ORDER });
    bg.set(BG_BY_LABEL);
    bg.goTo(label, { immediate: true });
  }

  function maybeRestoreThumb() {
    let subId = "";
    try { subId = sessionStorage.getItem("m_despre_return_sub") || ""; } catch (_) {}
    if (!subId) return;

    try { sessionStorage.removeItem("m_despre_return_sub"); } catch (_) {}

    // Find thumb by attribute
    const btns = Array.from(document.querySelectorAll("#m-despre [data-subid]"));
    const btn = btns.find((b) => String(b.getAttribute("data-subid") || "") === String(subId));
    if (!btn) return;

    // Scroll within #m-root so the thumb is visible (center-ish)
    const rootR = scroller.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    const top = r.top - rootR.top + scroller.scrollTop;
    const target = Math.max(0, Math.round(top - scroller.clientHeight * 0.35));
    scroller.scrollTop = target;
  }

  async function renderFeed() {
    destroyActive();
    try { scroller.style.paddingTop = "0px"; scroller.style.paddingBottom = "0px"; } catch (_) {}

    // hard reset: article may have locked scroller inline
try { scroller.style.overflowY = ""; } catch (_) {}
try { scroller.style.overflow = ""; } catch (_) {}


    if (scroller.scrollTop !== 0) scroller.scrollTop = 0;

    rendered = await mobileDespreFeed({
      mountId: "m-root",
      navigate,
      scroller,
    });

    setMobileHeaderState({
  accent: "var(--despre-accent)",
  showBack: false,
  showTitle: true,
  title: "Despre mine",
  showGallery: false,
  galleryOpen: false,
});


    setBg("Despre mine");

    const vs = installViewportStabilizer({
      scroller,
      panelSelector: "#m-despre .m-panel",
      settleMs: 260,
    });

    const cleanupSnap = installSnapAssist({
      scroller,
      panelSelector: "#m-despre .m-panel",
      freeScrollEl: rendered.els.screen3,
      shouldSkip: () => vs.isResizing() || scroller.dataset.dragLock === "1",
      settleMs: 140,
      durationMs: 520,
    });

    const cleanupS2Live = installLiveClass({
      scroller,
      targetEl: rendered.els.screen2,
      className: "is-live",
      enterRatio: 0.82,
      enterDelayMs: 220,
      exitRatio: 0.56,
      exitDelayMs: 200,
      minOnMs: 500,
      onEnter: () => rendered.els.screen2?.classList.add("is-revealed"),
    });

    const cleanupS3Live = installLiveClass({
      scroller,
      targetEl: rendered.els.screen3,
      className: "is-live",
      enterRatio: 0.28,
      enterDelayMs: 180,
      exitRatio: 0.16,
      exitDelayMs: 180,
      minOnMs: 500,
      onEnter: () => rendered.api?.onScreen3Enter?.(),
      onExit: () => rendered.api?.onScreen3Exit?.(),
    });

    const cleanupRowReveal = installDespreRowReveal({
      scroller,
      rootEl: rendered.els.screen3,
      rowsSelector: ".m-despre__row",
    });

    cleanup = () => {
      cleanupSnap?.();
      vs?.destroy?.();
      cleanupS2Live?.();
      cleanupS3Live?.();
      cleanupRowReveal?.();
    };

    // ✅ restore scroll focus after returning from an article
    // Run after a frame so layout is ready
    requestAnimationFrame(() => {
      try { maybeRestoreThumb(); } catch (_) {}
    });
  }

  async function renderArticle(route) {
    destroyActive();

    if (scroller.scrollTop !== 0) scroller.scrollTop = 0;

rendered = await mobileDespreArticleView({
  mountId: "m-root",
  scroller,
  navigate,
  subId: route.subId,
  articleId: route.articleId || "main", // ✅ optional internal id
});

    setBg("Despre mine");
  }

  // articlePanelView already sets header state, so this can be omitted.
// keep only if you want to enforce Despre accent:
setMobileHeaderState({ accent: "var(--despre-accent)" });


async function applyRoute(route) {
  if (!route || route.type !== "despre") return;

  // ✅ MOBILE: if subId exists, that's the article view
  if (route.subId) {
    await renderArticle(route); // route.articleId ignored for now
    return;
  }

  // ✅ no subId => feed
  await renderFeed();
}


  stopRoute = onRouteChange((r) => {
    if (r?.type !== "despre") return;
    applyRoute(r);
  });

  await applyRoute(parseHash(window.location.hash));

return () => {
  try { stopRoute?.(); } catch (_) {}
  destroyActive();
  try { scroller.style.paddingTop = _prevPadTop; } catch (_) {}
  try { scroller.style.paddingBottom = _prevPadBottom; } catch (_) {}
};
}
