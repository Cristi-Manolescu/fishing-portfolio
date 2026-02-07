// ./js/mobile/sections/acasa.js

import { getScroller } from "../lib/scroller.js";
import { installHeroParallax } from "../lib/parallax.js";
import { resolveBgByLabel, BG_ORDER } from "../../content.js";
import { createBackgroundManager } from "../../backgrounds.js";

import { renderMobileAcasaFeed } from "../mobileAcasaFeed.js";

import { installSnapAssist, installViewportStabilizer } from "../lib/scrolling.js";

// NEW: header state setter
import { setMobileHeaderState } from "../mobileHeader.js";


export async function startMobileAcasa({ navigate } = {}) {
function setBg(label) {
  const bgEl = document.getElementById("bg");
  if (!bgEl) return;

  const BG_BY_LABEL = resolveBgByLabel();
  const bg = createBackgroundManager(bgEl, { order: BG_ORDER });

  bg.set(BG_BY_LABEL);
  bg.goTo(label, { immediate: true });
}

  const scroller = getScroller("#m-root");

  const rendered = await renderMobileAcasaFeed({
    mountId: "m-root",
    navigate,
    scroller,
  });

  setBg("Acasa");

  const { carousel } = rendered.api || {};

  // initial header state for Acasa (parent)
  setMobileHeaderState({
    accent: "var(--acasa-accent)",
    showBack: false,
    showTitle: true,
    title: "Acasă", // temporary search placeholder
    showGallery: false,
    galleryOpen: false,
  });

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


  const cleanupParallax = installHeroParallax(
    rendered.els.feedPanel,
    { scroller }
  );


  /* ============================
     NEW: active-panel watcher (nearest-panel -> authoritative)
     - solves:
       * tiny overshoot causing carousel stop
       * Safari IO unreliability
       * landscape inconsistencies
     ============================ */

  const panelsSelector = "#m-acasa .m-panel";
  const getPanels = () => Array.from(document.querySelectorAll(panelsSelector));
  let activeIndex = -1;
  let settleTimer = 0;
  const SETTLE_MS = 140; // mirrors snap assist settle (keeps behavior consistent)

  function nearestPanelIndex() {
    const list = getPanels();
    if (!list.length) return 0;
    const y = scroller.scrollTop || 0;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < list.length; i++) {
      const top = list[i].offsetTop;
      const d = Math.abs(top - y);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  function viewportCoverRatio(el) {
  if (!el) return 0;
  const y = scroller.scrollTop || 0;
  const vh = scroller.clientHeight || window.innerHeight || 1;

  const top = el.offsetTop || 0;
  const h = el.offsetHeight || 0;
  const bottom = top + h;

  const viewTop = y;
  const viewBottom = y + vh;

  const overlap = Math.max(0, Math.min(viewBottom, bottom) - Math.max(viewTop, top));
  // ratio of the viewport height that is covered by this panel
  return overlap / vh;
}

  function applyPanelStateForIndex(idx) {
  const list = getPanels();
  const el = list[idx];
  if (!el) return;

  // Map panel id -> header state & carousel control
  // ids: "m-acasa-intro", "m-acasa-screen", "m-acasa-feed-panel", "m-acasa-contact"
  const id = el.id || "";

  if (id === "m-acasa-intro") {
    // Panel 1: Intro
    document.body.classList.remove("m-bar-hidden");

    setMobileHeaderState({
      accent: "var(--acasa-accent)",
      showBack: false,
      showTitle: true,
      title: "Acasă",
      showGallery: false,
      galleryOpen: false,
    });

    try { carousel?.stop?.(); } catch (_) {}
    rendered.els.screen2?.classList.remove("is-live");

  } else if (id === "m-acasa-screen") {
    // Panel 2: Banners (cinematic) => hide global bar
    document.body.classList.add("m-bar-hidden");

    setMobileHeaderState({
      accent: "var(--acasa-accent)",
      showBack: false,
      showTitle: false,
      title: "",
      showGallery: false,
      galleryOpen: false,
    });

    try { carousel?.start?.(); } catch (_) {}
    rendered.els.screen2?.classList.add("is-live");

  } else if (id === "m-acasa-feed-panel") {
    // Panel 3: Feed => show global bar
    document.body.classList.remove("m-bar-hidden");

    setMobileHeaderState({
      accent: "var(--acasa-accent)",
      showBack: false,
      showTitle: true,
      title: "Caută în ultimele",
      showGallery: false,
      galleryOpen: false,
    });

    try { carousel?.stop?.(); } catch (_) {}
    rendered.els.screen2?.classList.remove("is-live");

  } else if (id === "m-acasa-contact") {
    // Panel 4: Contact placeholder => show global bar
    document.body.classList.remove("m-bar-hidden");

    const fully = isPanelFullySnapped(el, { epsPx: 6 });
    if (fully) {
      setMobileHeaderState({
        accent: "var(--acasa-accent)",
        showBack: false,
        showTitle: true,
        title: "Contact",
        showGallery: false,
        galleryOpen: false,
      });
    }

    try { carousel?.stop?.(); } catch (_) {}
    rendered.els.screen2?.classList.remove("is-live");

  } else {
    // default fallback (keep acasa)
    document.body.classList.remove("m-bar-hidden");

    setMobileHeaderState({
      accent: "var(--acasa-accent)",
      showBack: false,
      showTitle: true,
      title: "Acasă",
      showGallery: false,
      galleryOpen: false,
    });

    try { carousel?.stop?.(); } catch (_) {}
    rendered.els.screen2?.classList.remove("is-live");
  }
}


  function isPanelFullySnapped(panelEl, { epsPx = 6 } = {}) {
  if (!panelEl) return false;
  const y = scroller.scrollTop || 0;
  const top = panelEl.offsetTop || 0;
  return Math.abs(y - top) <= epsPx;
}


  function scheduleActiveUpdate() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      settleTimer = 0;
const idx = nearestPanelIndex();
if (idx !== activeIndex) {
  activeIndex = idx;
  applyPanelStateForIndex(idx);
}

// --- Screen 4 polish override (only in Screen 3/4 zone) ---
const feedEl = document.getElementById("m-acasa-feed-panel");
const contactEl = document.getElementById("m-acasa-contact");

if (feedEl && contactEl) {
  const y = scroller.scrollTop || 0;

  const feedTop = feedEl.offsetTop || 0;
  const contactTop = contactEl.offsetTop || 0;

  // Only apply this override once we are in/after Screen 3 territory.
  // This prevents forcing the feed title on Screen 1/2.
  if (y >= feedTop - 2) {
    // 1) scrolling UP: as soon as we're above Screen 4 top, revert to Screen 3 title
    if (y < contactTop - 2) {
      setMobileHeaderState({
        accent: "var(--acasa-accent)",
        showBack: false,
        showTitle: true,
        title: "Caută în ultimele",
        showGallery: false,
        galleryOpen: false,
      });
    } else {
      // 2) scrolling DOWN: switch to Contact only when Screen 4 covers ~the whole viewport
      const cover = viewportCoverRatio(contactEl);
      if (cover >= 0.98) {
        setMobileHeaderState({
          accent: "var(--acasa-accent)",
          showBack: false,
          showTitle: true,
          title: "Contact",
          showGallery: false,
          galleryOpen: false,
        });
      }
    }
  }
}
    }, SETTLE_MS);
  }

  // initial run (after layout)
  scheduleActiveUpdate();

  // listen to scroller so we can detect nearest panel after user scroll / snap
  scroller.addEventListener("scroll", scheduleActiveUpdate, { passive: true });

  // also react when viewport stabilizer signals (when orientation/visual viewport changes)
  const protoVs = vs || null;
  // we can schedule an immediate update when stabilizer begins/ends - keep it simple:
  // call update after a short delay to re-align
  const onStabilize = () => { if (settleTimer) clearTimeout(settleTimer); settleTimer = setTimeout(() => { settleTimer = 0; const idx = nearestPanelIndex(); if (idx !== activeIndex) { activeIndex = idx; try { applyPanelStateForIndex(idx); } catch(_){} } }, 160); };
  window.addEventListener("orientationchange", onStabilize, { passive: true });
  window.addEventListener("resize", onStabilize, { passive: true });

  // --- cleanup handle
  const cleanup = () => {
    cleanupParallax?.();
    cleanupSnap?.();
    vs?.destroy?.();
    rendered.destroy?.();

    scroller.removeEventListener("scroll", scheduleActiveUpdate);
    window.removeEventListener("orientationchange", onStabilize);
    window.removeEventListener("resize", onStabilize);

    document.body.classList.remove("m-bar-hidden");

    if (settleTimer) { clearTimeout(settleTimer); settleTimer = 0; }
  };

  // expose the cleanup from the returned function
  return cleanup;
}
