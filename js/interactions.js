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
 *    - Acasa creates:
 *        • banner
 *        • dots
 *        • ticker
 *      All must be destroyed on leave
 *
 * 3) LAYOUT IS CALLED AFTER STATE CHANGES
 *    - layoutFn() is invoked only after state updates
 *    - layoutFn() handles ALL geometry changes
 *
 * SAFE TO EDIT
 * ------------
 *  - Section enter/leave logic
 *  - Asset paths (images, text)
 *  - Timing (intervalMs, async loading)
 *
 * DO NOT CHANGE WITHOUT CARE
 * --------------------------
 *  - sectionKey mapping
 *  - Order of: leave → state update → enter → layoutFn()
 *
 * If something leaks or duplicates:
 *  - Check destroy() is called
 *  - Ensure mount.innerHTML = "" is used on leave
 */

import { state } from "./state.js";
import { THEME } from "./theme.js";
import { createAcasaBanner } from "./acasaBanner.js";
import { createAcasaTicker } from "./acasaTicker.js";
import { createAcasaThumbs } from "./acasaThumbs.js";
import { createBottomCaption } from "./bottomCaption.js";
import { pauseLogoLoop, startLogoLoop, setLogoLoopAllowed } from "./logoLoop.js";

export let bottomCaptionApi = null;
let acasaBannerApi = null;
let acasaTickerApi = null;
let acasaThumbsApi = null;

const ACASA_HEX = "#ff6701";

const SECTION_BY_LABEL = {
  "Acasa": "acasa",
  "Despre mine": "despre",
  "Lacuri": "lacuri",
  "Partide": "partide",
  "Contact": "contact",
};

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

// Direction mapping for a single hop (see locked rule)
function hopDir(fromLabel, toLabel) {
  const a = BG_ORDER.indexOf(fromLabel);
  const b = BG_ORDER.indexOf(toLabel);
  // moving down the list => current slides up, next comes from bottom => dir="up"
  return b > a ? "up" : "down";
}

const raf = () => new Promise(requestAnimationFrame);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  if (!acasaTickerApi) {
    acasaTickerApi = await createAcasaTicker(mount, {
      url: "./assets/text/acasa.txt",
      fallbackText: "Fire întinse și lectură plăcută!"
    });
  }
  mount.style.setProperty("--acasa-color", ACASA_HEX);
}

function acasaTickerLeave() {
  acasaTickerApi?.destroy?.();
  acasaTickerApi = null;
}

// ------------------------------
// Acasa Thumbs
// ------------------------------
function acasaThumbsEnter() {
  const mount = document.getElementById("acasa-thumbs");
  if (!mount) return;

  if (!acasaThumbsApi) {
    acasaThumbsApi = createAcasaThumbs(mount, [
      { id: "despre-1", title: "Despre mine", img: "./assets/banner/slide1.jpg" },
      { id: "lacuri-1", title: "Lacuri",      img: "./assets/banner/slide2.jpg" },
      { id: "partide-1", title: "Partide",    img: "./assets/banner/slide3.jpg" },
      { id: "contact-1", title: "Contact",    img: "./assets/banner/slide4.jpg" },
      { id: "lacuri-2", title: "Lacuri 2",    img: "./assets/banner/slide5.jpg" },
      { id: "partide-2", title: "Partide 2",  img: "./assets/banner/slide1.jpg" },
      { id: "despre-2", title: "Despre 2",    img: "./assets/banner/slide2.jpg" },
      { id: "lacuri-3", title: "Lacuri 3",    img: "./assets/banner/slide3.jpg" },
      { id: "partide-3", title: "Partide 3",  img: "./assets/banner/slide4.jpg" },
      { id: "contact-2", title: "Contact 2",  img: "./assets/banner/slide5.jpg" },
      { id: "lacuri-4", title: "Lacuri 4",    img: "./assets/banner/slide1.jpg" },
      { id: "partide-4", title: "Partide 4",  img: "./assets/banner/slide2.jpg" },
    ], {
onHover: (title) => {
  if (document.body.dataset.section !== "acasa") return;
  bottomCaptionApi?.show(title);
},
onLeave: () => {
  bottomCaptionApi?.hide();
},

    });
  }
}

function acasaThumbsLeave() {
  acasaThumbsApi?.destroy?.();
  acasaThumbsApi = null;
}

// ------------------------------
// Section lifecycle exports
// ------------------------------
export function leaveSection(label) {
  if (label === "Acasa") {
    bottomCaptionApi?.hide();   // ✅ NEW
    acasaBannerLeave();
    acasaTickerLeave();
    acasaDotsLeave();
    acasaThumbsLeave();
  }
}


export async function enterSection(label) {
  if (label === "Acasa") {
    // Fire all initialization in parallel
    acasaBannerEnter();
    acasaThumbsEnter();
    // Await ticker last so it doesn't block local DOM setup (Thumbs/Banner)
    await acasaTickerEnter();
  }
}

export const sectionKey = (label) => SECTION_BY_LABEL[label] || "acasa";

export async function transitionTo(dom, layoutFn, bg, bgByLabel, nextLabel) {
  const prevLabel = state.activeLabel;
  if (nextLabel === prevLabel) return;

  // Lock interactions during transition
  if (state._isTransitioning) return;
  state._isTransitioning = true;

const HOLDERS_MS = 300;

// 1) Freeze hover + pause loops
state.hoverLabel = null;
pauseLogoLoop(dom);

// Hide overlay content during transition
document.body.classList.add("is-intro-content-hidden");

// NEW: hide glows during transition for perf
document.body.classList.add("is-section-transitioning");

// 2) Leave widgets
leaveSection(prevLabel);

// 3) Slide OUT (glows already hidden)
document.body.classList.add("is-section-out");
await sleep(HOLDERS_MS + 20);

// 4) Background hop chain (while offscreen)
const hops = bgPath(prevLabel, nextLabel);
let cur = prevLabel;
for (const hop of hops) {
  const dir = hopDir(cur, hop);
  await bg.goTo(nextLabel);
  cur = hop;
}

// 5) Apply FINAL state + theme + glow color WHILE OFFSCREEN
state.activeLabel = nextLabel;
document.body.dataset.section = sectionKey(nextLabel);
syncUiAccent(nextLabel);

// Force CSS var -> SVG styles to commit while still offscreen
layoutFn();
await raf();

// Slide IN
document.body.classList.remove("is-section-out");
await sleep(HOLDERS_MS + 20);

// Force one paint AFTER slide-in before showing glows
await raf();

// Now reveal glows (no 1-frame old color flash)
document.body.classList.remove("is-section-transitioning");

// 8) Mount widgets (after holders are in place)
await enterSection(nextLabel);

// 9) Strict 2-frame settle
layoutFn();
await raf();
layoutFn();
await raf();
layoutFn();

// 10) Reveal content
document.body.classList.remove("is-intro-content-hidden");

// 11) Resume idle gate logic (only if truly idle)
  if (state.hoverLabel == null) startLogoLoop(dom);

  state._isTransitioning = false;
}

// ------------------------------
// Interactions init
// ------------------------------
export function initInteractions(dom, layoutFn, orchestrator = null, onSectionChange = null) {
  const svg = dom.svg;
    // ------------------------------
  // Logo loop idle gate (local, safe)
  // ------------------------------
  const IDLE_MS = 1800;
  let idleT = null;

  function bumpIdle() {
    // any activity pauses immediately and schedules a later resume
    pauseLogoLoop(dom);
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      // idle means: no hover target (and intro-allowed already true)
      if (state.hoverLabel == null) startLogoLoop(dom);
    }, IDLE_MS);
  }

  // 1. Ensure Global Caption is ready
  if (!bottomCaptionApi) {
    const capMount = document.getElementById("bottom-caption");
    if (capMount) bottomCaptionApi = createBottomCaption(capMount);
  }

  // 2. Initial State sync
  document.body.dataset.section = sectionKey(state.activeLabel);
  syncUiAccent(state.activeLabel);
  if (state.activeLabel !== "Acasa") acasaDotsLeave();
  // 3. Pointer events
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


  // 4. Click Navigation
  svg.addEventListener("click", (e) => {
    const hit = e.target.closest(".btn-hit");
    bumpIdle();
    if (!hit) return;

    const next = hit.getAttribute("data-label");
    if (next === state.activeLabel) return;

    if (orchestrator) {
      syncUiAccent(next);
      onSectionChange?.(next);
      orchestrator.goTo(next);
      return;
    }

    // Manual Fallback
    const prev = state.activeLabel;
    if (onSectionChange) {
  onSectionChange(next); // main will run the async transition
  return;
}
else{    
  leaveSection(prev);

    state.activeLabel = next;
    document.body.dataset.section = sectionKey(next);
    syncUiAccent(next);
    onSectionChange?.(next);

    enterSection(next);
    layoutFn();
    bumpIdle();}
  });
}