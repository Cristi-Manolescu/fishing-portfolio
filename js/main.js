// /js/main.js
import { getDom } from "./dom.js";
import { layout } from "./layout.js";
import { initInteractions, sectionKey, enterSection, transitionTo } from "./interactions.js";
import { createBackgroundManager } from "./backgrounds.js";
import { state } from "./state.js";
import { setLogoLoopAllowed, setLogoLoopEnabled, startLogoLoop } from "./logoLoop.js";

const dom = getDom();

function layoutFn() {
  layout(dom);
}

// Global kill switch (easy to disable everywhere)
const LOGO_LOOP_ENABLED = true;
setLogoLoopEnabled(LOGO_LOOP_ENABLED);

// ---- background ----
const bgEl = document.getElementById("bg");
const bg = createBackgroundManager(bgEl);

const BG_BY_LABEL = {
  "Acasa": "./assets/bg/acasa.jpg",
  "Despre mine": "./assets/bg/despre.jpg",
  "Lacuri": "./assets/bg/lacuri.jpg",
  "Partide": "./assets/bg/partide.jpg",
  "Contact": "./assets/bg/contact.jpg",
};
const BG_ORDER = ["Despre mine", "Lacuri", "Acasa", "Partide", "Contact"];

bg.set(BG_BY_LABEL); // sets per-label images into panels
bg.goTo(state.activeLabel, { immediate: true }); // positions strip


// Initial body state
document.body.dataset.section = sectionKey(state.activeLabel);

// Keep content hidden until intro reveals it
document.body.classList.add("is-intro-content-hidden");

// Bind interactions once (section changes go through transitionTo)
initInteractions(dom, layoutFn, null, async (label) => {
  await transitionTo(dom, layoutFn, bg, BG_BY_LABEL, label);
});

// ---- helpers ----
const raf = () => new Promise(requestAnimationFrame);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- intro timings (match CSS) ----
const INTRO_SLIDE_MS = 500;   // matches intro holder transition
const CONTENT_FADE_MS = 300;  // matches overlay content fade

async function runIntro() {
  // 0) Ensure stable layout before animating (match overlay 2-rAF settle)
  layoutFn();
  await raf();
  layoutFn();
  await raf();
  layoutFn();

  // Trigger legacy background reveal (mask on .background)
  document.body.classList.add("is-intro-reveal");

  // 1) Put holders offscreen (intro only)
  document.body.classList.add("is-intro-holders");

  // Now it’s safe to remove boot-intro (intro classes own transforms)
  document.body.classList.remove("boot-intro");

  // 2) Enable transitions
  await raf();
  document.body.classList.add("is-intro-holders-animate");

  // 3) Start slide in
  await raf();
  document.body.classList.remove("is-intro-holders");

  // 4) Wait slide to finish
  await sleep(INTRO_SLIDE_MS + 20);

  // 5) Cleanup animate class
  document.body.classList.remove("is-intro-holders-animate");

  // 6a) Ensure overlays have real rects BEFORE mounting widgets
  layoutFn(); await raf();
  layoutFn(); await raf();
  layoutFn();

  // 6) Mount initial section widgets (after overlays are sized)
  await enterSection(state.activeLabel);


  // 7) Strict 2-frame settle AFTER widgets exist
  layoutFn();
  await raf();
  layoutFn();
  await raf();
  layoutFn();

    // Optional: force thumbs to re-measure on first boot (guards 0x0 init edge cases)
  if (state.activeLabel === "Acasa" || state.activeLabel === "Despre mine") {
    layoutFn();
    await raf();
    layoutFn();
  }

  // Finish bg reveal (lock final state)
  document.body.classList.remove("is-intro-reveal");
  document.body.classList.add("is-bg-revealed");

  // Intro fully finished NOW
  setLogoLoopAllowed(true);

  // 8) Reveal overlay content
  document.body.classList.remove("is-intro-content-hidden");
  await sleep(CONTENT_FADE_MS);

  // Start logo loop shortly after reveal (no overlap)
  setTimeout(() => {
    if (state.hoverLabel == null) startLogoLoop(dom);
  }, 5);
}

runIntro();

// ---- resize handling (unchanged) ----
let resizeRaf = 0;
let resizeRaf2 = 0;

window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeRaf);
  cancelAnimationFrame(resizeRaf2);

  resizeRaf = requestAnimationFrame(() => {
    layoutFn();
    resizeRaf2 = requestAnimationFrame(layoutFn);
  });
});
