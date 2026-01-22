/**
 * ============================================================
 * INTERACTIONS & SECTION LIFECYCLE
 * ============================================================
 *
 * This file controls:
 *  - Button hover and click behavior
 *  - Section transitions
 *  - Creation / destruction of section-specific widgets
 *
 * CORE RULES
 * ----------
 * 1) STATE IS AUTHORITATIVE
 *    - state.activeLabel defines the active section
 *    - DOM reflects state, never the other way around
 *
 * 2) SECTION ENTER / LEAVE MUST BE SYMMETRIC
 *    - Every "Enter" MUST have a matching "Leave"
 *
 * 3) LAYOUT IS CALLED AFTER STATE CHANGES
 *    - layoutFn() is invoked only after state updates
 *    - layoutFn() handles ALL geometry changes
 */

import { state } from "./state.js";
import { THEME } from "./theme.js";
import { createAcasaBanner } from "./acasaBanner.js";
import { createAcasaTicker } from "./acasaTicker.js";
import { createAcasaThumbs } from "./acasaThumbs.js";
import { createBottomCaption } from "./bottomCaption.js";
import { pauseLogoLoop, startLogoLoop } from "./logoLoop.js";
import { createPhotoSystemOverlay } from "./photoSystemOverlay.js";
import { createLacuriSection } from "./lacuriSection.js";

export let bottomCaptionApi = null;
let acasaBannerApi = null;
let acasaTickerApi = null;
let acasaThumbsApi = null;
let photoOverlayApi = null;
let lacuriApi = null;
let bottomSwapToken = 0;


const ACASA_HEX = "#ff6701";

// ------------------------------
// Bottom thumbnails data by section
// ------------------------------
const THUMBS_BY_SECTION = {
  "Acasa": [
    { id: "despre-1", title: "Despre mine", img: "./assets/banner/slide1.jpg" },
    { id: "lacuri-1", title: "Lacuri",      img: "./assets/banner/slide2.jpg" },
    { id: "partide-1", title: "Partide",    img: "./assets/banner/slide3.jpg" },
    { id: "contact-1", title: "Contact",    img: "./assets/banner/slide4.jpg" },
    { id: "despre-2", title: "Despre mine", img: "./assets/banner/slide5.jpg" },
    { id: "lacuri-2", title: "Lacuri",      img: "./assets/banner/slide2.jpg" },
    { id: "partide-2", title: "Partide",    img: "./assets/banner/slide3.jpg" },
    { id: "contact-2", title: "Contact",    img: "./assets/banner/slide4.jpg" },
  ],

  "Despre mine": [
    { id: "despre-1", title: "Despre mine", img: "./assets/photo/photo1.jpg" },
    { id: "lacuri-1", title: "Lacuri",      img: "./assets/photo/photo2.jpg" },
    { id: "partide-1", title: "Partide",    img: "./assets/photo/photo3.jpg" },
    { id: "contact-1", title: "Contact",    img: "./assets/photo/photo4.jpg" },
    { id: "despre-2", title: "Despre mine", img: "./assets/photo/photo5.jpg" },
    { id: "lacuri-2", title: "Lacuri",      img: "./assets/photo/photo6.jpg" },
    { id: "despre-1b", title: "Despre mine", img: "./assets/photo/photo1.jpg" },
    { id: "lacuri-1b", title: "Lacuri",      img: "./assets/photo/photo2.jpg" },
    { id: "partide-1b", title: "Partide",    img: "./assets/photo/photo3.jpg" },
    { id: "contact-1b", title: "Contact",    img: "./assets/photo/photo4.jpg" },
    { id: "despre-2b", title: "Despre mine", img: "./assets/photo/photo5.jpg" },
    { id: "lacuri-2b", title: "Lacuri",      img: "./assets/photo/photo6.jpg" },
  ],

  "Lacuri": [],
  "Partide": [],
  "Contact": [],
};

const SECTION_BY_LABEL = {
  "Acasa": "acasa",
  "Despre mine": "despre",
  "Lacuri": "lacuri",
  "Partide": "partide",
  "Contact": "contact",
};

export const sectionKey = (label) => SECTION_BY_LABEL[label] || "acasa";

// ✅ hard reset ticker inline styles so the next section can re-position cleanly
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

// ------------------------------
// Overlay resize sync (keep behavior: PS needs re-layout on resize)
// ------------------------------
window.addEventListener("resize", () => {
  if (state.overlay?.type === "photo") photoOverlayApi?.layout?.();
});

// Background vertical order (top -> bottom)
const BG_ORDER = ["Despre mine", "Lacuri", "Acasa", "Partide", "Contact"];

function bgPath(fromLabel, toLabel) {
  const a = BG_ORDER.indexOf(fromLabel);
  const b = BG_ORDER.indexOf(toLabel);
  if (a === -1 || b === -1 || a === b) return [];
  const step = b > a ? 1 : -1;
  const path = [];
  for (let i = a + step; step > 0 ? i <= b : i >= b; i += step) path.push(BG_ORDER[i]);
  return path;
}

// Direction mapping for a single hop (kept for locked rule parity)
function hopDir(fromLabel, toLabel) {
  const a = BG_ORDER.indexOf(fromLabel);
  const b = BG_ORDER.indexOf(toLabel);
  return b > a ? "up" : "down";
}

const raf = () => new Promise(requestAnimationFrame);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForNonZeroRect(el, tries = 20) {
  for (let i = 0; i < tries; i++) {
    await raf();
    const r = el.getBoundingClientRect();
    if (r.width > 50 && r.height > 20) return true;
  }
  return false;
}

// Global UI accent sync
function syncUiAccent(label) {
  const hex = (THEME?.[label]?.hex) || THEME?._normal?.hex || ACASA_HEX;
  document.body.style.setProperty("--ui-accent", hex);
}

// ------------------------------
// Acasa Banner
// ------------------------------
function acasaBannerEnter() {
  const mount = document.getElementById("acasa-banner");
  if (!mount) return;

  if (!acasaBannerApi) {
    acasaBannerApi = createAcasaBanner(
      mount,
      [
        { src: "./assets/banner/slide1.jpg", caption: "Bine ai venit!", alt: "Slide 1" },
        { src: "./assets/banner/slide2.jpg", caption: "Lacuri • Tehnici • Capturi", alt: "Slide 2" },
        { src: "./assets/banner/slide3.jpg", caption: "Povești din teren", alt: "Slide 3" },
        { src: "./assets/banner/slide4.jpg", caption: "Povești din teren", alt: "Slide 4" },
        { src: "./assets/banner/slide5.jpg", caption: "Povești din teren", alt: "Slide 5" },
      ],
      { intervalMs: 5000 }
    );
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

// ------------------------------
// Acasa Ticker
// ------------------------------
async function acasaTickerEnter() {
  const mount = document.getElementById("acasa-ticker");
  if (!mount) return;

  mount.dataset.mode = "acasa";

  if (!acasaTickerApi) {
    acasaTickerApi = await createAcasaTicker(mount, {
      url: "./assets/text/acasa.txt",
      fallbackText: "Fire întinse și lectură plăcută!"
    });
  }

  mount.style.setProperty("--acasa-color", ACASA_HEX);
}

async function acasaTickerEnterDespre() {
  const mount = document.getElementById("acasa-ticker");
  if (!mount) return;

  mount.dataset.mode = "despre";

  if (!acasaTickerApi) {
    acasaTickerApi = await createAcasaTicker(mount, {
      url: "./assets/text/despre.txt",
      fallbackText: "Despre mine..."
    });
  }

  mount.style.setProperty("--acasa-color", THEME?.["Despre mine"]?.hex || ACASA_HEX);
}

function acasaTickerLeave() {
  acasaTickerApi?.destroy?.();
  acasaTickerApi = null;

  const mount = document.getElementById("acasa-ticker");
  if (mount) delete mount.dataset.mode;
}

// ------------------------------
// Acasa Thumbs
// ------------------------------
function acasaThumbsEnter(label = state.activeLabel) {
  const mount = document.getElementById("acasa-thumbs");
  if (!mount) return;

  const items = THUMBS_BY_SECTION[label] || [];

  acasaThumbsApi?.destroy?.();
  acasaThumbsApi = null;

  acasaThumbsApi = createAcasaThumbs(mount, items, {
    onHover: (title) => bottomCaptionApi?.show(title),
    onLeave: () => bottomCaptionApi?.hide(),
    onClickThumb: ({ id, item }) => handleThumbClick(label, id, item),
  });
}

function acasaThumbsLeave() {
  acasaThumbsApi?.destroy?.();
  acasaThumbsApi = null;
}

async function swapBottomThumbs(items, labelForClicks = "Lacuri") {
  const my = ++bottomSwapToken;

  // animate OUT
  document.body.classList.add("is-bottom-thumbs-swap");

  // wait for CSS transition (matches 260ms)
  await sleep(260);

  if (my !== bottomSwapToken) return;

  // rebuild while hidden
  acasaThumbsEnterItems(items, labelForClicks);

  // animate IN next frame
  await raf();
  if (my !== bottomSwapToken) return;

  document.body.classList.remove("is-bottom-thumbs-swap");
}


function handleThumbClick(sectionLabel, thumbId, item) {
  state.lastThumbClick = { sectionLabel, thumbId };

  if (sectionLabel === "Acasa") {
    // future link
    return;
  }

  if (sectionLabel === "Despre mine" || sectionLabel === "Lacuri" || sectionLabel === "Partide") {
    openPhotoOverlay(sectionLabel, thumbId, item);
  }
}

function acasaThumbsEnterItems(items, labelForClicks = "Lacuri") {
  const mount = document.getElementById("acasa-thumbs");
  if (!mount) return;

  acasaThumbsApi?.destroy?.();
  acasaThumbsApi = null;

  acasaThumbsApi = createAcasaThumbs(mount, items, {
    onHover: (title) => bottomCaptionApi?.show(title),
    onLeave: () => bottomCaptionApi?.hide(),
    onClickThumb: ({ id, item }) => handleThumbClick(labelForClicks, id, item),
  });
}

// ------------------------------
// Photo Overlay
// ------------------------------
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

  // ✅ NEW: Lacuri subsection -> use currently active lake thumbs (1..9)
  if (sectionLabel === "Lacuri" && state.lacuri?.mode === "sub" && state.lacuri?.activeSubId) {
    const lakeId = state.lacuri.activeSubId;

    const items = Array.from({ length: 9 }, (_, k) => ({
      src: `./assets/lacuri/${lakeId}/${k + 1}.jpg`,
    }));

    const idx = Math.max(
      0,
      Math.min(8, parseInt(String(thumbId).split("-").pop(), 10) - 1 || 0)
    );

    photoOverlayApi.open({
      accentHex: THEME?.["Lacuri"]?.hex || null,
      items,
      index: idx,
    });

    return;
  }

  // (existing logic unchanged below)
  const list = THUMBS_BY_SECTION[sectionLabel] || null;

  let items = [];
  if (Array.isArray(list) && list.length) {
    items = list.filter((x) => x?.img).map((x) => ({ src: x.img }));
  } else if (item?.img) {
    items = [{ src: item.img }];
  }

  let idx = 0;
  if (Array.isArray(list) && list.length) {
    const found = list.findIndex((x) => x?.id === thumbId);
    idx = found >= 0 ? found : 0;
  }

  const accentHex = THEME?.[sectionLabel]?.hex || null;

  photoOverlayApi.open({ accentHex, items, index: idx });
}


function closePhotoOverlay() {
  state.overlay = null;
  document.body.classList.remove("is-bottom-thumbs-out");
  photoOverlayApi?.close?.();
  document.body.classList.remove("is-photo-open");
}

// ------------------------------
// Section lifecycle exports
// ------------------------------
export function leaveSection(label) {
  closePhotoOverlay();

  if (label === "Acasa") {
    bottomCaptionApi?.hide();
    acasaBannerLeave();
    acasaTickerLeave();
    acasaDotsLeave();
    acasaThumbsLeave();
    return;
  }

  if (label === "Despre mine") {
    bottomCaptionApi?.hide();
    acasaTickerLeave();
    acasaThumbsLeave();
    return;
  }

if (label === "Lacuri") {
  bottomCaptionApi?.hide();
  document.body.classList.remove("is-lacuri-home");

  lacuriApi?.leave?.();
  lacuriApi = null;

  acasaThumbsLeave();
  return;
}

}

export async function enterSection(label) {
  if (label === "Acasa") {
    acasaBannerEnter();
    acasaThumbsEnter(label);
    await acasaTickerEnter();
    return;
  }

  if (label === "Despre mine") {
    acasaThumbsEnter(label);
    await acasaTickerEnterDespre();
    return;
  }

if (label === "Lacuri") {
  bottomCaptionApi?.hide();

  // Hide bottom thumbs on Lacuri HOME
  document.body.classList.add("is-lacuri-home");

  const stage = document.getElementById("lacuri-stage");
  if (stage) {
    lacuriApi = createLacuriSection(stage, {
onHome: () => {
  document.body.classList.add("is-lacuri-home");
  document.body.classList.remove("is-bottom-thumbs-swap");
  acasaThumbsLeave();
},
      onSubEnter: () => {
        document.body.classList.remove("is-lacuri-home");
      },
onSubThumbs: (thumbs) => {
  swapBottomThumbs(thumbs, "Lacuri");
},

    });
    lacuriApi.enter();
  }

  return;
}

  // Later: Partide/Contact
}

// ------------------------------
// Transition (used by orchestrator)
// ------------------------------
export async function transitionTo(dom, layoutFn, bg, bgByLabel, nextLabel) {
  const prevLabel = state.activeLabel;
  if (nextLabel === prevLabel) return;

  if (state._isTransitioning) return;
  state._isTransitioning = true;

  const HOLDERS_MS = 300;

  // 1) Freeze hover + pause loops
  state.hoverLabel = null;
  pauseLogoLoop(dom);
  closePhotoOverlay();

  // reset ticker immediately when switching sections
  resetTickerForSectionChange();

  document.body.classList.add("is-intro-content-hidden");
  document.body.classList.add("is-section-transitioning");

  // 2) Leave widgets
  leaveSection(prevLabel);

  // 3) Slide OUT
  document.body.classList.add("is-section-out");
  await sleep(HOLDERS_MS + 20);

  // 4) Background hop chain (while offscreen)
  const hops = bgPath(prevLabel, nextLabel);
  let cur = prevLabel;

  for (const hop of hops) {
    const dir = hopDir(cur, hop); // kept for locked mental model
    void dir;

    // ✅ IMPORTANT: go to the hop, not always nextLabel
    await bg.goTo(hop);
    cur = hop;
  }

  // 5) Apply FINAL state + theme + glow color WHILE OFFSCREEN
  state.activeLabel = nextLabel;
  document.body.dataset.section = sectionKey(nextLabel);
  syncUiAccent(nextLabel);

  layoutFn();
  await raf();

  // 6) Slide IN
  document.body.classList.remove("is-section-out");
  await sleep(HOLDERS_MS + 20);

  await raf();
  document.body.classList.remove("is-section-transitioning");

  // 7) Mount widgets
  await enterSection(nextLabel);

  // 8) Strict settle
  layoutFn(); await raf();
  layoutFn(); await raf();
  layoutFn();

  document.body.classList.remove("is-intro-content-hidden");

  if (state.hoverLabel == null) startLogoLoop(dom);

  state._isTransitioning = false;
}

// ------------------------------
// Interactions init
// ------------------------------
export function initInteractions(dom, layoutFn, orchestrator = null, onSectionChange = null) {
  const svg = dom.svg;

  // Logo loop idle gate
  const IDLE_MS = 1800;
  let idleT = null;

  function bumpIdle() {
    pauseLogoLoop(dom);
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      if (state.hoverLabel == null) startLogoLoop(dom);
    }, IDLE_MS);
  }

  // Ensure Global Caption exists
  if (!bottomCaptionApi) {
    const capMount = document.getElementById("bottom-caption");
    if (capMount) bottomCaptionApi = createBottomCaption(capMount);
  }

  // Initial sync
  document.body.dataset.section = sectionKey(state.activeLabel);
  syncUiAccent(state.activeLabel);
  if (state.activeLabel !== "Acasa") acasaDotsLeave();

  // Hover
  svg.addEventListener("pointermove", (e) => {
    const hit = e.target.closest(".btn-hit");
    const next = hit ? hit.getAttribute("data-label") : null;
    if (next !== state.hoverLabel) {
      state.hoverLabel = next;
      layoutFn();
      bumpIdle();
    }
  });

  svg.addEventListener("pointerleave", () => {
    if (state.hoverLabel !== null) {
      state.hoverLabel = null;
      layoutFn();
    }
    bumpIdle();
  });

  // Click Navigation
  svg.addEventListener("click", (e) => {
    const hit = e.target.closest(".btn-hit");
    bumpIdle();
    if (!hit) return;

    const next = hit.getAttribute("data-label");
    if (next === state.activeLabel) return;

    resetTickerForSectionChange();

    if (orchestrator) {
      syncUiAccent(next);
      onSectionChange?.(next);
      orchestrator.goTo(next);
      return;
    }

    // Manual fallback path
    const prev = state.activeLabel;

    if (onSectionChange) {
      onSectionChange(next);
      return;
    }

    leaveSection(prev);

    state.activeLabel = next;
    document.body.dataset.section = sectionKey(next);
    syncUiAccent(next);

    enterSection(next);
    layoutFn();
    bumpIdle();
  });
}
