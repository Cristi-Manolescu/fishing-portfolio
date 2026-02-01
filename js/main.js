import { getDom } from "./dom.js";
import { layout } from "./layout.js";
import {
  initInteractions,
  sectionKey,
  enterSection,
  transitionTo,
  syncUiAccent,
  applyPendingDeepLinkInActiveSection
} from "./interactions.js";
import { createBackgroundManager } from "./backgrounds.js";
import { state } from "./state.js";
import { resolveBgByLabel, BG_ORDER } from "./content.js";
import { setLogoLoopAllowed, setLogoLoopEnabled, startLogoLoop } from "./logoLoop.js";
import { onRouteChange, parseHash, toHash, navigate } from "./router.js";

import { initMobileHeader } from "./mobileHeader.js";
import { bootMobile } from "./mobile/mobileBoot.js"; // ✅ NEW


async function init() {
const mh = initMobileHeader({ navigate, onRouteChange });

/* -----------------------
   MOBILE BOOT (ONLY)
------------------------ */
if (mh.enabled) {
  let root = document.getElementById("m-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "m-root";
    root.className = "m-root";
    document.body.appendChild(root);
  }

  const bgEl = document.getElementById("bg");
  if (bgEl) {
    const BG_BY_LABEL = resolveBgByLabel();
    const bg = createBackgroundManager(bgEl, { order: BG_ORDER });
    bg.set(BG_BY_LABEL);
    bg.goTo("Acasa", { immediate: true });
  }

  document.body.classList.add("is-bg-revealed");
  document.body.classList.remove("boot-intro", "is-intro-content-hidden");

  bootMobile({ navigate, onRouteChange });
}

/* -----------------------
   DESKTOP BOOT (ONLY)
------------------------ */
if (!mh.enabled) {
  const dom = getDom();

  function layoutFn() {
    layout(dom);
  }

  let introDone = false;
  let pendingRoute = null;

  // Global kill switch
  const LOGO_LOOP_ENABLED = true;
  setLogoLoopEnabled(LOGO_LOOP_ENABLED);

  const BG_BY_LABEL = resolveBgByLabel();

  // ---- background ----
  const bgEl = document.getElementById("bg");
  const bg = createBackgroundManager(bgEl, { order: BG_ORDER });

  // ✅ Boot from URL hash (no transition on refresh)
  const initialRoute = parseHash();
  pendingRoute = initialRoute;

  state.activeLabel = routeToLabel(initialRoute);
  document.body.dataset.section = sectionKey(state.activeLabel);
  primeDeepLinkFromRoute(initialRoute);

  syncUiAccent(state.activeLabel);

  bg.set(BG_BY_LABEL);
  bg.goTo(state.activeLabel, { immediate: true });

  document.body.dataset.section = sectionKey(state.activeLabel);
  document.body.classList.add("is-intro-content-hidden");

  // Bind interactions once
  initInteractions(dom, layoutFn, null, async (label) => {
    await transitionTo(dom, layoutFn, bg, BG_BY_LABEL, label);

    // ✅ Keep URL in sync (silent)
    if (label === "Acasa") setUrlSilently({ type: "acasa" });
    else if (label === "Despre mine") setUrlSilently({ type: "despre" });
    else if (label === "Partide") setUrlSilently({ type: "partide" });
    else if (label === "Galerie") setUrlSilently({ type: "galerie" });
    else if (label === "Contact") setUrlSilently({ type: "contact" });
  });

  function setUrlSilently(target) {
    const next = toHash(target);
    const cur = window.location.hash || "";
    if (cur === next) return;
    history.replaceState(null, "", next);
  }

  function routeToLabel(r) {
    if (!r) return "Acasa";
    if (r.type === "acasa") return "Acasa";
    if (r.type === "despre") return "Despre mine";
    if (r.type === "partide") return "Partide";
    if (r.type === "galerie") return "Galerie";
    if (r.type === "contact") return "Contact";
    return "Acasa";
  }

  function primeDeepLinkFromRoute(r) {
    if (r?.type === "despre" && r?.subId) {
      state.pendingDeepLink = { label: "Despre mine", subId: r.subId };
      return;
    }
    if (r?.type === "partide" && r?.subId) {
      state.pendingDeepLink = { label: "Partide", subId: r.subId };
      return;
    }
    state.pendingDeepLink = null;
  }

  async function applyRoute(r) {
    const nextLabel = routeToLabel(r);

    if (r?.type === "despre" && r?.subId) {
      state.pendingDeepLink = { label: "Despre mine", subId: r.subId };
    } else if (r?.type === "partide" && r?.subId) {
      state.pendingDeepLink = { label: "Partide", subId: r.subId };
    } else {
      state.pendingDeepLink = null;
    }

    if (!introDone) return;

    if (state.activeLabel !== nextLabel) {
      await transitionTo(dom, layoutFn, bg, BG_BY_LABEL, nextLabel);
    } else {
      const hasDeep =
        (r.type === "despre" && r.subId) ||
        (r.type === "partide" && r.subId);

      if (hasDeep) {
        await enterSection(nextLabel);
        layoutFn();
      }
    }
  }

  onRouteChange((r) => {
    pendingRoute = r;
    if (!introDone) return;
    applyRoute(r);
  });

  // ---- helpers ----
  const raf = () => new Promise(requestAnimationFrame);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const INTRO_SLIDE_MS = 500;
  const CONTENT_FADE_MS = 300;

  async function runIntro() {
    layoutFn(); await raf();
    layoutFn(); await raf();
    layoutFn();

    document.body.classList.add("is-intro-reveal");
    document.body.classList.add("is-intro-holders");
    document.body.classList.remove("boot-intro");

    await raf();
    document.body.classList.add("is-intro-holders-animate");

    await raf();
    document.body.classList.remove("is-intro-holders");

    await sleep(INTRO_SLIDE_MS + 20);
    document.body.classList.remove("is-intro-holders-animate");

    layoutFn(); await raf();
    layoutFn(); await raf();
    layoutFn();

    await enterSection(state.activeLabel);
    await applyPendingDeepLinkInActiveSection({ immediate: true });

    layoutFn(); await raf();
    layoutFn(); await raf();
    layoutFn();

    await raf();

    if (state.activeLabel === "Acasa" || state.activeLabel === "Despre mine") {
      layoutFn(); await raf();
      layoutFn();
    }

    introDone = true;

    document.body.classList.remove("is-intro-reveal");
    document.body.classList.add("is-bg-revealed");

    setLogoLoopAllowed(true);

    document.body.classList.remove("is-intro-content-hidden");
    await sleep(CONTENT_FADE_MS);

    setTimeout(() => {
      if (state.hoverLabel == null) startLogoLoop(dom);
    }, 5);
  }

  runIntro();

  // ---- resize handling ----
  let resizeRaf = 0;
  let resizeRaf2 = 0;

  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    cancelAnimationFrame(resizeRaf2);

    resizeRaf = requestAnimationFrame(() => {
      layoutFn();
      resizeRaf2 = requestAnimationFrame(() => {
        layoutFn();
      });
    });
  });
}
}

init();
