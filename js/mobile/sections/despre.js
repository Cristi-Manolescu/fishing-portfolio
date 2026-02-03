// ./js/mobile/sections/despre.js
import { getScroller } from "../lib/scroller.js";
import { installLiveClass } from "../lib/liveState.js";
import { installSnapAssist, installViewportStabilizer } from "../lib/scrolling.js";
import { resolveBgByLabel, BG_ORDER } from "../../content.js";
import { createBackgroundManager } from "../../backgrounds.js";
import { installDespreRowReveal } from "../lib/despreRowReveal.js";
import { onRouteChange, parseHash } from "../../router.js";
import { mobileDespreArticleView } from "../mobileDespreArticle.js";
import { installParallax } from "../lib/parallax.js";

import { mobileDespreFeed } from "../mobileDespreFeed.js";

export async function startMobileDespre({ navigate } = {}) {
  const scroller = getScroller("#m-root");

  let stopRoute = null;

  // current active render handles
  let rendered = null;     // feed OR article (both return {els, api, destroy})
  let cleanup = null;      // feed-only cleanups (snap/live/reveal/vs/etc)
  let cleanupParallax = null;

  function destroyActive() {
    try { cleanupParallax?.(); } catch (_) {}
    cleanupParallax = null;

    try { cleanup?.(); } catch (_) {}
    cleanup = null;

    try { rendered?.destroy?.(); } catch (_) {}
    rendered = null;
  }

  // One-shot restore: return to top of Screen 3
  function maybeRestoreToS3() {
    let flag = null;
    try { flag = sessionStorage.getItem("m_despre_return"); } catch (_) {}

    if (flag !== "s3") return;

    try { sessionStorage.removeItem("m_despre_return"); } catch (_) {}

    const s3 = document.querySelector("#m-despre .m-despre__s3");
    if (!s3) return;

    // scroll so S3 top aligns in scroller
    const top = s3.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTop = Math.max(0, Math.round(top));
  }

  async function renderFeed() {
    destroyActive();

    // hard reset scroll position is OK for feed render
    if (scroller.scrollTop !== 0) scroller.scrollTop = 0;

    rendered = await mobileDespreFeed({
      mountId: "m-root",
      navigate,
      scroller,
    });

    // Background: keep as-is
    const bgEl = document.getElementById("bg");
    if (bgEl) {
      const BG_BY_LABEL = resolveBgByLabel();
      const bg = createBackgroundManager(bgEl, { order: BG_ORDER });
      bg.set(BG_BY_LABEL);
      bg.goTo("Despre mine", { immediate: true });
    }

    // --- your existing feed-only wiring (unchanged) ---
    const vs = installViewportStabilizer({
      scroller,
      panelSelector: "#m-despre .m-panel",
      settleMs: 260,
    });

    let ro = null;
    let rafId = 0;

    function syncDespreStripVars() {
      const img = document.querySelector(".m-logo__img");
      if (!img) return false;
      const h = Math.round(img.getBoundingClientRect().height);
      if (!h || h < 12) return false;
      document.body.style.setProperty("--m-logo-h", `${h}px`);
      return true;
    }

    function primeDespreStripVars() {
      if (syncDespreStripVars()) return;
      let tries = 0;
      const tick = () => {
        tries++;
        if (syncDespreStripVars() || tries >= 20) return;
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    primeDespreStripVars();

    const img = document.querySelector(".m-logo__img");
    if (img && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => syncDespreStripVars());
      ro.observe(img);
    }

    window.addEventListener("resize", syncDespreStripVars);
    window.addEventListener("orientationchange", syncDespreStripVars);

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

  onEnter: () => {
    // Screen2 local reveal only
    rendered.els.screen2?.classList.add("is-revealed");

    // ❌ DO NOT touch the global bar anymore:
    // rendered.els.bar?.classList.add("m-bar--empty", "m-bar--sep5");
  },

  onExit: () => {
    // Keep Screen2 stable; remove only local mutations if you want:
    // rendered.els.screen2?.classList.remove("is-revealed");

    // ❌ DO NOT touch the global bar anymore:
    // rendered.els.bar?.classList.remove("m-bar--empty", "m-bar--sep5");
  },
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
      window.removeEventListener("resize", syncDespreStripVars);
      window.removeEventListener("orientationchange", syncDespreStripVars);
      if (ro) {
        try { ro.disconnect(); } catch (_) {}
      }
      if (rafId) cancelAnimationFrame(rafId);

      cleanupSnap?.();
      vs?.destroy?.();
      cleanupS2Live?.();
      cleanupS3Live?.();
      cleanupRowReveal?.();
    };

    // ✅ handle “return to S3”
    maybeRestoreToS3();
  }

  async function renderArticle(route) {
    destroyActive();

    rendered = await mobileDespreArticleView({
      mountId: "m-root",
      scroller,
      navigate,
      subId: route.subId,
      articleId: route.articleId,
    });

    // ✅ parallax for article content images
    cleanupParallax = installParallax({
      rootEl: rendered.els.section,
      scroller,
      imgSelector: ".m-parallax-media img",
    });
  }

  async function applyRoute(route) {
    // We only handle Despre routes here; bootMobile will swap controller on type change.
    if (!route || route.type !== "despre") return;

    if (route.subId && route.articleId) {
      await renderArticle(route);
    } else {
      await renderFeed();
    }
  }

  stopRoute = onRouteChange((r) => {
    // fire and forget; renders are deterministic and isolated
    applyRoute(r);
  });

  // initial render
  await applyRoute(parseHash(window.location.hash));

  return () => {
    try { stopRoute?.(); } catch (_) {}
    destroyActive();
  };
}
