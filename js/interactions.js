/**
 * ============================================================
 * INTERACTIONS & SECTION LIFECYCLE
 * ============================================================
 */

import { state } from "./state.js";
import { THEME } from "./theme.js";
import { CONTENT, resolveBottomThumbs, resolveTicker, resolvePhotoOverlayItems } from "./content.js";

import { createAcasaBanner } from "./acasaBanner.js";
import { createAcasaTicker } from "./acasaTicker.js";
import { createAcasaThumbs } from "./acasaThumbs.js";
import { createBottomCaption } from "./bottomCaption.js";
import { pauseLogoLoop, startLogoLoop } from "./logoLoop.js";
import { createPhotoSystemOverlay } from "./photoSystemOverlay.js";
import { createDespreSection } from "./despreSection.js";
import { createGalerieSection } from "./galerieSection.js";
import { enableScrollGate, disableScrollGate } from "./scrollGate.js";
import { createPartideSection } from "./partideSection.js";
import { createContactSection } from "./contactSection.js";


export let bottomCaptionApi = null;

let acasaBannerApi = null;
let acasaTickerApi = null;
let acasaThumbsApi = null;

let photoOverlayApi = null;

let despreApi = null;
let galerieApi = null;
let partideApi = null;
let contactApi = null;

let bottomSwapToken = 0;

const ACASA_HEX = "#ff6701";

// Label -> key
const SECTION_BY_LABEL = {
  "Acasa": "acasa",
  "Despre mine": "despre",
  "Partide": "partide",
  "Galerie": "galerie",
  "Contact": "contact",
};

export const sectionKey = (label) => SECTION_BY_LABEL[label] || "acasa";

/* ------------------------------
   Bottom caption (init once)
------------------------------ */
function ensureBottomCaption() {
  if (bottomCaptionApi) return bottomCaptionApi;

  // Prefer a dedicated mount if you have one
  const mount =
    document.getElementById("bottom-caption") ||
    document.getElementById("bottom-content") ||
    document.body;

  try {
    bottomCaptionApi = createBottomCaption(mount);
  } catch {
    // Keep app running even if caption fails
    bottomCaptionApi = null;
  }
  return bottomCaptionApi;
}

/* ------------------------------
   Ticker reset (keeps locked behavior)
------------------------------ */
function resetTickerForSectionChange() {
  const el = document.getElementById("acasa-ticker");
  if (!el) return;

  el.style.position = "";
  el.style.left = "";
  el.style.top = "";
  el.style.width = "";
  el.style.height = "";
  el.style.transform = "";

  delete el.dataset.mode;
}

/* ------------------------------
   Overlay resize sync (PS needs re-layout on resize)
------------------------------ */
window.addEventListener("resize", () => {
  if (state.overlay?.type === "photo") photoOverlayApi?.layout?.();
});

// Background vertical order (top -> bottom)
const BG_ORDER = ["Despre mine", "Partide", "Acasa", "Galerie", "Contact"];

function bgPath(fromLabel, toLabel) {
  const a = BG_ORDER.indexOf(fromLabel);
  const b = BG_ORDER.indexOf(toLabel);
  if (a === -1 || b === -1 || a === b) return [];
  const step = b > a ? 1 : -1;
  const path = [];
  for (let i = a + step; step > 0 ? i <= b : i >= b; i += step) path.push(BG_ORDER[i]);
  return path;
}

function hopDir(fromLabel, toLabel) {
  const a = BG_ORDER.indexOf(fromLabel);
  const b = BG_ORDER.indexOf(toLabel);
  return b > a ? "up" : "down";
}

const raf = () => new Promise(requestAnimationFrame);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function syncMidPanelWidthFromAcasaTicker() {
  const ref = document.getElementById("acasa-ticker");
  if (!ref) return;

  const w = Math.round(ref.getBoundingClientRect().width);
  if (w > 0) document.documentElement.style.setProperty("--mid-panel-w", `${w}px`);
}

// Global UI accent sync
function syncUiAccent(label) {
  const hex = (THEME?.[label]?.hex) || THEME?._normal?.hex || ACASA_HEX;
  document.body.style.setProperty("--ui-accent", hex);
}

/* ------------------------------
   Acasa Banner
------------------------------ */
function acasaBannerEnter() {
  const mount = document.getElementById("acasa-banner");
  if (!mount) return;

  if (!acasaBannerApi) {
    acasaBannerApi = createAcasaBanner(mount, CONTENT.acasa.bannerSlides, { intervalMs: 5000 });
  } else {
    acasaBannerApi.start?.();
  }

  const dots = document.getElementById("acasa-dots");
  if (dots) dots.style.setProperty("--dot-color", ACASA_HEX);
}

function acasaBannerLeave() {
  acasaBannerApi?.destroy?.();
  acasaBannerApi = null;
}

function acasaDotsLeave() {
  const dots = document.getElementById("acasa-dots");
  if (dots) dots.innerHTML = "";
}

/* ------------------------------
   Ticker enter (Acasa only per new rule)
------------------------------ */
async function tickerEnterFor(label) {
  const mount = document.getElementById("acasa-ticker");
  if (!mount) return;

  mount.dataset.mode = (label === "Despre mine") ? "despre" : "acasa";

  const t = resolveTicker(label);
  if (!t) return;

  acasaTickerApi?.destroy?.();
  acasaTickerApi = await createAcasaTicker(mount, t);

  const hex = (label === "Despre mine")
    ? (THEME?.["Despre mine"]?.hex || ACASA_HEX)
    : ACASA_HEX;

  mount.style.setProperty("--acasa-color", hex);
}

function acasaTickerLeave() {
  acasaTickerApi?.destroy?.();
  acasaTickerApi = null;

  const mount = document.getElementById("acasa-ticker");
  if (mount) {
    delete mount.dataset.mode;
    mount.innerHTML = "";
  }
}

/* ------------------------------
   Bottom thumbs
------------------------------ */
function acasaThumbsEnterForActiveSection() {
  const items = resolveBottomThumbs(state);
  acasaThumbsEnterItems(items, state.activeLabel);
}

function acasaThumbsEnterItems(items, labelForClicks) {
  const mount = document.getElementById("acasa-thumbs");
  if (!mount) return;

  ensureBottomCaption();

  acasaThumbsApi?.destroy?.();
  acasaThumbsApi = null;

  acasaThumbsApi = createAcasaThumbs(mount, items || [], {
    onHover: (title) => bottomCaptionApi?.show?.(title),
    onLeave: () => bottomCaptionApi?.hide?.(),
    onClickThumb: ({ id, item }) => handleThumbClick(labelForClicks, id, item),
  });
}

function acasaThumbsLeave() {
  acasaThumbsApi?.destroy?.();
  acasaThumbsApi = null;
}

async function swapBottomThumbs(items, labelForClicks = "Partide") {
  const my = ++bottomSwapToken;

  document.body.classList.add("is-bottom-thumbs-swap");
  await sleep(260);
  if (my !== bottomSwapToken) return;

  state.bottomThumbs = items || [];
  state.bottomThumbsLabel = labelForClicks;

  acasaThumbsEnterItems(items, labelForClicks);

  await raf();
  if (my !== bottomSwapToken) return;

  document.body.classList.remove("is-bottom-thumbs-swap");
}

function handleThumbClick(sectionLabel, thumbId, item) {
  state.lastThumbClick = { sectionLabel, thumbId };

  if (sectionLabel === "Acasa") return;

  if (sectionLabel === "Despre mine" || sectionLabel === "Galerie" || sectionLabel === "Partide") {
    openPhotoOverlay(sectionLabel, thumbId, item);
  }
}

/* ------------------------------
   Photo Overlay
------------------------------ */
function openPhotoOverlay(sectionLabel, thumbId, item) {
  state.overlay = { type: "photo", sectionLabel, thumbId };
  document.body.classList.add("is-bottom-thumbs-out");

  const root = document.getElementById("overlay-root");
  if (!root) return;

  document.body.classList.add("is-photo-open");

  if (!photoOverlayApi) {
    photoOverlayApi = createPhotoSystemOverlay(root, {
      onRequestClose: () => closePhotoOverlay(),
    });
  }

  const resolved = resolvePhotoOverlayItems({ sectionLabel, thumbId, item, state });
  if (!resolved) return;

  photoOverlayApi.open({
    accentHex: resolved.accentHex ?? (THEME?.[sectionLabel]?.hex || null),
    items: resolved.items,
    index: resolved.index,
  });
}

function openYouTubeOverlay(sectionLabel, youtubeId, accentHex) {
  state.overlay = { type: "photo", sectionLabel, thumbId: youtubeId };
  document.body.classList.add("is-bottom-thumbs-out");
  document.body.classList.add("is-photo-open");

  const root = document.getElementById("overlay-root");
  if (!root) return;

  if (!photoOverlayApi) {
    photoOverlayApi = createPhotoSystemOverlay(root, {
      onRequestClose: () => closePhotoOverlay(),
    });
  }

  photoOverlayApi.open({
    accentHex,
    items: [
      { type: "youtube", id: "AAA" },
      { type: "youtube", id: "BBB" },
      { type: "youtube", id: "CCC" },
    ],
    index: 0,
  });
}

function closePhotoOverlay() {
  state.overlay = null;

  document.body.classList.remove("is-bottom-thumbs-out");
  document.body.classList.remove("is-photo-open");

  const root = document.getElementById("overlay-root");
  if (root) {
    root.classList.remove("is-open");
    root.innerHTML = "";
    root.style.pointerEvents = "none";
  }

  photoOverlayApi?.destroy?.();
  photoOverlayApi = null;
}

/* ------------------------------
   Section lifecycle exports
------------------------------ */
export function leaveSection(label) {
  closePhotoOverlay();
  disableScrollGate();

  if (state.subsections) {
    state.subsections.active = null;
    state.subsections._token += 1;
    state.subsections._isTransitioning = false;
  }

  if (label === "Acasa") {
    bottomCaptionApi?.hide?.();
    acasaBannerLeave();
    acasaTickerLeave();
    acasaDotsLeave();
    acasaThumbsLeave();
    return;
  }

  if (label === "Despre mine") {
    bottomCaptionApi?.hide?.();
    despreApi?.leave?.();
    despreApi = null;
    acasaThumbsLeave();
    return;
  }

  if (label === "Galerie") {
    bottomCaptionApi?.hide?.();
    galerieApi?.leave?.();
    galerieApi = null;
    acasaThumbsLeave();
    return;
  }

  if (label === "Partide") {
    bottomCaptionApi?.hide?.();
    document.body.classList.remove("is-partide-home");
    partideApi?.leave?.();
    partideApi = null;
    acasaThumbsLeave();
    return;
  }
    if (label === "Contact") {
    bottomCaptionApi?.hide?.();
    contactApi?.leave?.();
    contactApi = null;
    return;
  }
}

export async function enterSection(label) {
  ensureBottomCaption();

  if (label === "Acasa") {
    disableScrollGate();
    acasaBannerEnter();
    acasaThumbsEnterForActiveSection();
    await tickerEnterFor("Acasa");
    return;
  }

  if (label === "Despre mine") {
    enableScrollGate();
    bottomCaptionApi?.hide?.();

    const stage = document.getElementById("despre-stage");
    if (stage) {
      despreApi = createDespreSection(stage, {
        onHome: () => {
          if (!state.despre) state.despre = {};
          state.despre.mode = "home";
          state.despre.subId = null;
          acasaThumbsLeave();
        },

        onSubEnter: (sub) => {
          if (!state.despre) state.despre = {};
          state.despre.mode = "sub";
          state.despre.subId = sub?.id ?? null;
        },

        onSubThumbs: (thumbs) => {
          swapBottomThumbs(thumbs, "Despre mine");
        },
      });

      despreApi.enter();
    }
    return;
  }

  if (label === "Partide") {
    enableScrollGate();
    bottomCaptionApi?.hide?.();

    document.body.classList.add("is-partide-home");

    const stage = document.getElementById("partide-stage");
    if (stage) {
      partideApi = createPartideSection(stage, {
        onHome: () => {
          document.body.classList.add("is-partide-home");
          document.body.classList.remove("is-bottom-thumbs-swap");
          acasaThumbsLeave();

          if (state.partide) {
            state.partide.mode = "home";
            state.partide.groupId = null;
            state.partide.subId = null;
          }
        },

        onGroupEnter: (group) => {
          document.body.classList.remove("is-partide-home");
          if (!state.partide) state.partide = {};
          state.partide.mode = "group";
          state.partide.groupId = group?.id ?? null;
          state.partide.subId = null;
          acasaThumbsLeave();
        },

        onSubsubEnter: (sub) => {
          document.body.classList.remove("is-partide-home");
          if (!state.partide) state.partide = {};
          state.partide.mode = "subsub";
          state.partide.subId = sub?.id ?? null;
        },

        onSubsubThumbs: (thumbs) => {
          swapBottomThumbs(thumbs, "Partide");
        },
      });

      partideApi.enter();
    }
    return;
  }

  if (label === "Galerie") {
    disableScrollGate();
    bottomCaptionApi?.hide?.();

    acasaThumbsEnterForActiveSection();

    const stage = document.getElementById("galerie-stage");
    if (stage) {
      galerieApi = createGalerieSection(stage, {
        onOpenVideo: ({ youtubeId }) =>
          openYouTubeOverlay("Galerie", youtubeId, THEME?.["Galerie"]?.hex || null),
      });
      galerieApi.enter();
    }
    return;
  }

   if (label === "Contact") {
    disableScrollGate();
    bottomCaptionApi?.hide?.();

    // Ensure bottom thumbs don't remain mounted
    acasaThumbsLeave();

    const stage = document.getElementById("contact-stage");
    if (stage) {
contactApi = createContactSection(stage, {
  emailTo: "cristi_manolescu86@yahoo.com",
  socials: {
    facebook: "https://www.facebook.com/ShyshyBMF?locale=ro_RO",
    instagram: "https://www.instagram.com/cristianmihaimanolescu/",
    youtube: "",
    github: "",
  },
});


      contactApi.enter();
    }
    return;
  }
}

/* ------------------------------
   Transition (used by orchestrator)
------------------------------ */
export async function transitionTo(dom, layoutFn, bg, bgByLabel, nextLabel) {
  const prevLabel = state.activeLabel;
  if (nextLabel === prevLabel) return;

  if (state._isTransitioning) return;
  state._isTransitioning = true;

  const HOLDERS_MS = 300;

  state.hoverLabel = null;
  pauseLogoLoop(dom);
  closePhotoOverlay();
  resetTickerForSectionChange();

  document.body.classList.add("is-intro-content-hidden");
  document.body.classList.add("is-section-transitioning");

  leaveSection(prevLabel);

  document.body.classList.add("is-section-out");
  await sleep(HOLDERS_MS + 20);

  const hops = bgPath(prevLabel, nextLabel);
  let cur = prevLabel;

  for (const hop of hops) {
    const dir = hopDir(cur, hop);
    void dir;
    await bg.goTo(hop);
    cur = hop;
  }

  state.activeLabel = nextLabel;
  document.body.dataset.section = sectionKey(nextLabel);
  syncUiAccent(nextLabel);

  layoutFn();
  await raf();
  syncMidPanelWidthFromAcasaTicker();

  document.body.classList.remove("is-section-out");
  await sleep(HOLDERS_MS + 20);

  await raf();
  document.body.classList.remove("is-section-transitioning");

  await enterSection(nextLabel);

  layoutFn(); await raf();
  layoutFn();

  document.body.classList.remove("is-intro-content-hidden");

  if (state.hoverLabel == null) startLogoLoop(dom);

  state._isTransitioning = false;
}

/* ------------------------------
   Interactions init
------------------------------ */
export function initInteractions(dom, layoutFn, orchestrator = null, onSectionChange = null) {
  ensureBottomCaption();

  const svg = dom.svg;

  const IDLE_MS = 1800;
  let idleT = null;

  function bumpIdle() {
    pauseLogoLoop(dom);
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      if (state.hoverLabel == null) startLogoLoop(dom);
    }, IDLE_MS);
  }

  let hoverRaf = 0;
  const requestLayout = () => {
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      layoutFn();
    });
  };

  let lastX = 0;
  let lastY = 0;

  function getHoverLabelFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const hit = el.closest?.(".btn-hit");
    return hit ? hit.getAttribute("data-label") : null;
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
    },
    { passive: true }
  );

  svg.addEventListener("pointermove", () => {
    const next = getHoverLabelFromPoint(lastX, lastY);
    if (next !== state.hoverLabel) {
      state.hoverLabel = next;
      requestLayout();
      bumpIdle();
    }
  });

  svg.addEventListener("pointerleave", () => {
    if (state.hoverLabel !== null) {
      state.hoverLabel = null;
      requestLayout();
    }
    bumpIdle();
  });

  const hoverWatchdog = window.setInterval(() => {
    if (state.hoverLabel == null) return;

    const next = getHoverLabelFromPoint(lastX, lastY);
    if (next == null) {
      state.hoverLabel = null;
      requestLayout();
    }
  }, 120);

  window.addEventListener("blur", () => {
    if (state.hoverLabel != null) {
      state.hoverLabel = null;
      requestLayout();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.hoverLabel != null) {
      state.hoverLabel = null;
      requestLayout();
    }
  });

  svg.addEventListener("click", async (e) => {
    const hit = e.target.closest(".btn-hit");
    bumpIdle();
    if (!hit) return;

    const next = hit.getAttribute("data-label");
    if (next === state.activeLabel) return;

    if (state.hoverLabel != null) {
      state.hoverLabel = null;
      requestLayout();
    }

    resetTickerForSectionChange();

    if (orchestrator) {
      syncUiAccent(next);
      onSectionChange?.(next);
      orchestrator.goTo(next);
      return;
    }

    const prev = state.activeLabel;

    if (onSectionChange) {
      onSectionChange(next);
      return;
    }

    leaveSection(prev);

    state.activeLabel = next;
    document.body.dataset.section = sectionKey(next);
    syncUiAccent(next);

    await enterSection(next);

    layoutFn();
    await new Promise(requestAnimationFrame);
    layoutFn();

    bumpIdle();
  });

  void hoverWatchdog;
}
