// /js/mobileAcasaFeed.js
// Mobile Acasa feed renderer
// Screen 1: intro (snap)
// Screen 2: banner carousel (snap + auto)
// Screen 3: hero feed panel (2 screens tall, free scroll inside)
// Screen 4: contact (snap)

import { resolveAcasaBannerSlides, resolveAcasaLatestList, hashFromTarget } from "./content.js";
import { buildTickerWordsHTML, setTickerHTML } from "./mobile/lib/ticker.js";
import { getScroller } from "./mobile/lib/scroller.js";
import { installIntroBrandVisibility } from "./mobile/lib/introGate.js";

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function lerp(a, b, t) { return a + (b - a) * t; }

/* -------------------------------------------
   Snap assist (skip snapping while inside feed panel)
-------------------------------------------- */

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


/* -------------------------------------------
   Text + ticker
-------------------------------------------- */

async function fetchText(url, fallback = "") {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("bad status");
    return await r.text();
  } catch {
    return fallback;
  }
}

/* -------------------------------------------
   Image fallback + preload
-------------------------------------------- */

function attachImgFallback(img, context) {
  if (!img) return;
  img.addEventListener("error", () => {
    // eslint-disable-next-line no-console
    console.warn("[img-fail]", context, { src: img.src, fallback: img.dataset.fallback || "" });
    const fb = img.dataset.fallback || "";
    if (fb && img.src !== fb) img.src = fb;
  });
  if (img.decode) img.decode().catch(() => {});
}

function preload(url) {
  if (!url) return;
  const im = new Image();
  im.decoding = "async";
  im.loading = "eager";
  im.src = url;
  if (im.decode) im.decode().catch(() => {});
}

function preloadAllSlides(slides) {
  for (const s of slides) {
    preload(s.src);
    preload(s.fallbackSrc);
  }
}

/* -------------------------------------------
   Transform carousel
-------------------------------------------- */

function installTransformCarousel(rail, track, slides, { intervalMs = 5000 } = {}) {
  if (!rail || !track) return { start() {}, stop() {}, reset() {}, destroy() {}, __preloadAll() {} };

  const n = slides.length || 1;

  let idx = 0;
  let timer = 0;
  let pausedUntil = 0;
  let hardPaused = false;

  let down = false;
  let intent = null;
  let sx = 0;
  let sy = 0;
  let startX = 0;
  let dragging = false;

  const lockPx = 12;
  const bias = 1.6;

  const w = () => rail.clientWidth || 1;

  const setIdx = (i, { animate = true } = {}) => {
    idx = ((i % n) + n) % n;
    if (!animate) track.style.transition = "none";
    track.style.transform = `translate3d(${-idx * w()}px, 0, 0)`;
    if (!animate) requestAnimationFrame(() => { track.style.transition = ""; });
  };

  const setOffsetPx = (px) => {
    track.style.transform = `translate3d(${px}px, 0, 0)`;
  };

  const reset = () => {
    pausedUntil = 0;
    hardPaused = false;
    rail.classList.remove("is-dragging");
    setIdx(0, { animate: false });
  };

  const next = () => setIdx(idx + 1);
  const prev = () => setIdx(idx - 1);

  const pauseBriefly = (ms = 2500) => { pausedUntil = Date.now() + ms; };

  const tick = () => {
    if (hardPaused) return;
    if (Date.now() < pausedUntil) return;
    next();
  };

  const start = () => {
    if (timer) return;
    timer = window.setInterval(tick, intervalMs);
  };

  const stop = ({ reset: doReset = false } = {}) => {
    if (timer) {
      window.clearInterval(timer);
      timer = 0;
    }
    if (doReset) reset();
  };

  const onResize = () => setIdx(idx, { animate: false });
  window.addEventListener("resize", onResize, { passive: true });

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    down = true;
    intent = null;
    dragging = false;

    sx = e.clientX;
    sy = e.clientY;
    startX = -idx * w();

    pauseBriefly(5000);

    try { rail.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    if (!down) return;

    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (!intent) {
      if (adx < lockPx && ady < lockPx) return;

      if (adx > ady * bias) {
        intent = "h";
        dragging = true;
        rail.classList.add("is-dragging");
      } else {
        intent = "v";
        try { rail.releasePointerCapture(e.pointerId); } catch {}
        down = false;
        return;
      }
    }

    if (intent === "h") {
      e.preventDefault();
      setOffsetPx(startX + dx);
    }
  };

  const end = () => {
    if (!down && !dragging) return;

    const wasDragging = dragging;
    down = false;
    dragging = false;
    intent = null;
    rail.classList.remove("is-dragging");

    if (!wasDragging) return;

    const m = getComputedStyle(track).transform;
    let curX = -idx * w();
    if (m && m !== "none") {
      const parts = m.match(/matrix(3d)?\((.+)\)/);
      if (parts) {
        const nums = parts[2].split(",").map((s) => parseFloat(s.trim()));
        curX = parts[1] ? nums[12] : nums[4];
      }
    }

    const delta = curX - (-idx * w());
    const thresh = Math.max(40, w() * 0.18);

    if (delta < -thresh) next();
    else if (delta > thresh) prev();
    else setIdx(idx);
  };

  rail.addEventListener("pointerdown", onPointerDown, { passive: true });
  rail.addEventListener("pointermove", onPointerMove, { passive: false });
  rail.addEventListener("pointerup", end, { passive: true });
  rail.addEventListener("pointercancel", end, { passive: true });

  setIdx(0, { animate: false });

  return {
    start,
    stop,
    reset,
    __preloadAll: () => preloadAllSlides(slides),
    destroy: () => {
      stop({ reset: true });
      window.removeEventListener("resize", onResize);
      rail.removeEventListener("pointerdown", onPointerDown);
      rail.removeEventListener("pointermove", onPointerMove);
      rail.removeEventListener("pointerup", end);
      rail.removeEventListener("pointercancel", end);
    },
  };
}

/* -------------------------------------------
   Screen 2 controller (polished)
-------------------------------------------- */

function installScreen2Controller({
  screen2,
  introEl,
  feedSentinel,
  carousel,
  onShowTicker,
  onHideTicker,
  rootEl = null,                 // ✅ NEW
}) {
  if (!screen2 || !carousel) return () => {};

  let tickerTimer = 0;
  let active2 = false;
  let preloaded = false;

  const hardReset = () => {
    onHideTicker?.();
    screen2?.classList.remove("is-live");
    carousel.stop?.({ reset: true });
  };

  const setScreen2Active = (isOn) => {
    if (isOn === active2) return;
    active2 = isOn;

    if (active2) {
      if (!preloaded) {
        preloaded = true;
        carousel.__preloadAll?.();
      }
      carousel.start?.();

      if (tickerTimer) window.clearTimeout(tickerTimer);
      tickerTimer = window.setTimeout(() => {
        onShowTicker?.();               // this adds .is-live
      }, 300);                          // ✅ your requested ~0.3s
    } else {
      carousel.stop?.({ reset: false });
      if (tickerTimer) {
        window.clearTimeout(tickerTimer);
        tickerTimer = 0;
      }
    }
  };

  const ioOpts = {
    root: rootEl || null,              // ✅ critical
    threshold: [0, 0.5, 0.98, 1],
  };

  const io2 = new IntersectionObserver((entries) => {
    const e = entries[0];
    const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.98;
    setScreen2Active(on);
  }, ioOpts);

  io2.observe(screen2);

  let io3 = null;
  if (feedSentinel) {
    io3 = new IntersectionObserver((entries) => {
      const e = entries[0];
      const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.98;
      if (on) hardReset();
    }, ioOpts);
    io3.observe(feedSentinel);
  }

  let io1 = null;
  if (introEl) {
    io1 = new IntersectionObserver((entries) => {
      const e = entries[0];
      const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.98;
      if (on) hardReset();
    }, ioOpts);
    io1.observe(introEl);
  }

  return () => {
    io2.disconnect();
    io3?.disconnect?.();
    io1?.disconnect?.();
    if (tickerTimer) window.clearTimeout(tickerTimer);
    tickerTimer = 0;
    hardReset();
  };
}



function installSoftSnapFeed(feedPanelEl, {
  cardSelector = ".m-hero-card",
  settleMs = 140,
  edgePx = 80,
  minDeltaPx = 10,
} = {}) {
  if (!feedPanelEl) return () => {};

  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (prefersReduced) return () => {};

  let t = 0;
  let lastY = window.scrollY;

  const isInsideFeed = () => {
    const y = window.scrollY;
    const top = feedPanelEl.getBoundingClientRect().top + y;
    const bottom = top + feedPanelEl.offsetHeight;

    // Inside feed, but not too close to edges (avoid fighting panel snapping)
    return y > top + edgePx && y < bottom - edgePx;
  };

  const snap = () => {
    if (!isInsideFeed()) return;

    const y = window.scrollY;
    const cards = Array.from(feedPanelEl.querySelectorAll(cardSelector));
    if (!cards.length) return;

    let bestTop = null;
    let bestDist = Infinity;

    for (const c of cards) {
      const top = c.getBoundingClientRect().top + y;
      const d = Math.abs(top - y);
      if (d < bestDist) {
        bestDist = d;
        bestTop = top;
      }
    }

    if (bestTop == null) return;
    if (Math.abs(bestTop - y) < minDeltaPx) return;

    window.scrollTo({ top: bestTop, behavior: "smooth" });
  };

  const onScroll = () => {
    const y = window.scrollY;
    // If the scroll is a big fling, don't immediately snap mid-flight
    const bigMove = Math.abs(y - lastY) > 140;
    lastY = y;

    if (t) clearTimeout(t);
    t = setTimeout(() => {
      if (!bigMove) snap();
      else {
        // for flings: wait a bit longer then snap
        setTimeout(snap, 120);
      }
    }, settleMs);
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    if (t) clearTimeout(t);
    t = 0;
  };
}


function installFeedSizingVars() {
  const apply = () => {
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const landscape = vw > vh;

    const mediaH = landscape ? (vh * (4/3)) : (vh * (3/4));
    document.documentElement.style.setProperty("--m-hero-media-h", `${mediaH.toFixed(2)}px`);
  };

  apply();
  window.addEventListener("resize", apply, { passive: true });
  window.addEventListener("orientationchange", apply, { passive: true });
  window.visualViewport?.addEventListener("resize", apply, { passive: true });

  return () => {
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", apply);
    window.visualViewport?.removeEventListener("resize", apply);
  };
}

function installBannerCrawl(rail, track, slides, { speedPxPerSec = 36 } = {}) {
  if (!rail || !track) return { start() {}, stop() {}, destroy() {} };

  let raf = 0;
  let running = false;

  let x = 0;
  let lastT = 0;

  // drag state
  let down = false;
  let intent = null; // "h" | "v"
  let sx = 0, sy = 0;
  let startX = 0;
  let dragging = false;

  let pauseUntil = 0;

  const LOCK = 10;
  const BIAS = 1.35;

  const contentW = () => track.scrollWidth || 1;
  const halfW = () => Math.max(1, contentW() / 2); // duplicated once

  const applyX = (nx) => {
    const w = halfW();
    while (nx <= -w) nx += w;
    while (nx > 0) nx -= w;
    x = nx;
    track.style.transform = `translate3d(${x}px,0,0)`;
  };

  const tick = (t) => {
    raf = 0;
    if (!running) return;

    if (!lastT) lastT = t;
    const dt = Math.min(48, t - lastT);
    lastT = t;

    if (!dragging && performance.now() > pauseUntil) {
      const step = (speedPxPerSec * dt) / 1000;
      applyX(x - step); // right -> left
    }

    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) return;
    running = true;
    lastT = 0;
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastT = 0;
  };

  const setDraggingUI = (on) => {
    rail.classList.toggle("is-dragging", !!on);
  };

  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    down = true;
    intent = null;
    dragging = false;

    sx = e.clientX;
    sy = e.clientY;
    startX = x;

    // IMPORTANT: do NOT capture here.
    // Capturing too early can steal vertical intent on some devices.
  };

  const onMove = (e) => {
    if (!down) return;

    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (!intent) {
      if (adx < LOCK && ady < LOCK) return;

      if (adx > ady * BIAS) {
        intent = "h";
        dragging = true;

        setDraggingUI(true);

        // lock native scrolling *only after* we commit to horizontal
        rail.style.touchAction = "none";

        // now capture so we keep receiving moves
        try { rail.setPointerCapture(e.pointerId); } catch {}
      } else {
        intent = "v";
        // allow vertical scroll naturally; bail out
        down = false;
        return;
      }
    }

    if (intent === "h") {
      e.preventDefault(); // critical for touch horizontal control
      applyX(startX + dx);
    }
  };

  const end = (e) => {
    if (!down && !dragging) return;

    down = false;
    const wasDragging = dragging;

    dragging = false;
    intent = null;

    setDraggingUI(false);

    // restore vertical pass-through
    rail.style.touchAction = "pan-y";

    // small cooldown so it doesn't “fight” immediately after you let go
    if (wasDragging) pauseUntil = performance.now() + 700;

    try { rail.releasePointerCapture?.(e?.pointerId); } catch {}
  };

  rail.addEventListener("pointerdown", onDown, { passive: true });
  rail.addEventListener("pointermove", onMove, { passive: false }); // must be non-passive
  rail.addEventListener("pointerup", end, { passive: true });
  rail.addEventListener("pointercancel", end, { passive: true });
  rail.addEventListener("pointerleave", end, { passive: true });

  // init
  rail.style.touchAction = "pan-y";
  applyX(0);

  return {
    start,
    stop,
    destroy: () => {
      stop();
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("pointermove", onMove);
      rail.removeEventListener("pointerup", end);
      rail.removeEventListener("pointercancel", end);
      rail.removeEventListener("pointerleave", end);

      rail.classList.remove("is-dragging");
      rail.style.touchAction = "";
      track.style.transform = "";
    },
  };
}

function startStopOnVisible(el, onStart, onStop) {
  if (!el) return () => {};
  const io = new IntersectionObserver((entries) => {
    const e = entries[0];
    const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.6;
    if (on) onStart?.();
    else onStop?.();
  }, { threshold: [0, 0.6, 1] });
  io.observe(el);
  return () => io.disconnect();
}



/* -------------------------------------------
   Render
-------------------------------------------- */

export async function renderMobileAcasaFeed({ mountId = "m-root", navigate } = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) throw new Error(`renderMobileAcasaFeed: missing #${mountId}`);

  const slides = resolveAcasaBannerSlides();
  const latest = resolveAcasaLatestList();

  const introText = await fetchText(
    "./assets/text-m/acasa.txt",
    await fetchText("./assets/text/acasa.txt", "Fire întinse și lectură plăcută!")
  );

  mount.innerHTML = `
    <section id="m-acasa">

      <div class="m-panel" id="m-acasa-intro">
       <div class="m-intro-brand" aria-label="Pescuit in Arges">
        <div class="m-brand-wrap">
         <img class="m-brand-img" src="./assets/img-m/ui/acasa/wordmark.png" alt="Pescuit in Arges" decoding="async">
         <div class="m-brand-caustics" aria-hidden="true"></div>
        </div>
       </div>

        <div class="m-down" aria-hidden="true">↓</div>
      </div>

<div class="m-panel" id="m-acasa-screen">

  <!-- ✅ TOP GLASS STRIP -->
<!-- ✅ TOP STRIP (same look as bottom strip, but taller) -->
  <div class="m-topstrip" aria-label="Acasa strip">
    <div class="m-topstrip__glass"></div>
  </div>

  <!-- ✅ BANNERS -->
  <div class="m-banner-rail" id="m-banner-rail" aria-label="Acasa banners">
    <div class="m-banner-track" id="m-banner-track">
      ${[...slides, ...slides].map((s, i) => `
        <div class="m-banner-slide">
          <img
            src="${escHtml(s.src)}"
            data-fallback="${escHtml(s.fallbackSrc || "")}"
            alt="${escHtml(s.alt || "")}"
            loading="${i < 3 ? "eager" : "lazy"}"
            decoding="async"
          >
        </div>
      `).join("")}
    </div>
  </div>

  <div class="m-ticker-overlay" aria-hidden="false">
    <p class="m-ticker-line" id="m-ticker-line"></p>
  </div>

  <div class="m-screen-divider" aria-hidden="true"></div>
  <div class="m-down" aria-hidden="true">↓</div>
</div>

      <!-- ✅ Screen 3: 2 screens tall -->
      <div class="m-panel m-feed-panel" id="m-acasa-feed-panel">
        <div id="m-feed-sentinel" style="position:absolute;top:0;left:0;right:0;height:1px;"></div>
        <div class="m-feed" id="m-acasa-feed">
          ${latest.map((x) => `
            <article class="m-hero-card">
              <button type="button" class="m-hero-btn" data-target='${escHtml(JSON.stringify(x.target || {}))}'>
                <div class="m-hero-media">
                  <img src="${escHtml(x.img)}" data-fallback="${escHtml(x.imgFallback || "")}" alt="" loading="lazy" decoding="async">
                </div>
                <div class="m-hero-cap">
                  <p class="m-hero-title">${escHtml(x.title || "")}</p>
                  <div class="m-hero-hint">Tap pentru articol →</div>
                </div>
              </button>
            </article>
          `).join("")}
        </div>
      </div>

      <div class="m-panel" id="m-acasa-contact">
        <div class="m-hero-cap">
          <p class="m-hero-title">Contact</p>
          <div class="m-hero-hint">Social media + email (urmează)</div>
        </div>
      </div>

    </section>
  `;

  // First-entry reveal for Screen 1 brand (once per hard load)
  const introEl = mount.querySelector("#m-acasa-intro");

  // ✅ Always show container when screen1 is active (handled by m-intro-on body class)
  if (introEl) introEl.classList.add("m-brand-shown");

  // ✅ Calm reveal: transition-based, triggered next frame (reliable)
  if (introEl && !sessionStorage.getItem("m_intro_brand_done")) {
    sessionStorage.setItem("m_intro_brand_done", "1");

    // next frame => transition fires (prevents "pop")
    requestAnimationFrame(() => {
      introEl.classList.add("m-brand-in");
      // caustics fade in later (prevents flash)
      window.setTimeout(() => introEl.classList.add("m-caustics-in"), 420);
    });
  } else if (introEl) {
    // On refresh/navigation: keep it visible without animation
    introEl.classList.add("m-brand-in", "m-caustics-in");
  }

const scroller = getScroller("#m-root");
const cleanupIntroBrand = installIntroBrandVisibility(introEl, { scroller });

  const rail = mount.querySelector("#m-banner-rail");
  const track = mount.querySelector("#m-banner-track");
  const screen2 = mount.querySelector("#m-acasa-screen");

  const feedPanel = mount.querySelector("#m-acasa-feed-panel");
  const feedSentinel = mount.querySelector("#m-feed-sentinel");
  const rootEl = document.getElementById("m-root");

  // Fallback wiring
  Array.from(mount.querySelectorAll("#m-banner-rail img")).forEach((img, i) => attachImgFallback(img, `banner[${i}]`));
  Array.from(mount.querySelectorAll(".m-hero-card img")).forEach((img, i) => attachImgFallback(img, `hero[${i}]`));

const carousel = installBannerCrawl(rail, track, slides, { speedPxPerSec: 36 });

// ✅ run only while Screen2 is mostly visible
const cleanupCrawlIO = startStopOnVisible(
  screen2,
  () => carousel.start?.(),
  () => carousel.stop?.()
);

const cleanupScreen2 = installScreen2Controller({
  screen2,
  introEl,
  feedSentinel,
  carousel,
  rootEl, // ✅ NEW
  onShowTicker: () => screen2?.classList.add("is-live"),
  onHideTicker: () => screen2?.classList.remove("is-live"),
});

// --- Force strip hit-testing so vertical scroll works
const topGlass = mount.querySelector(".m-topstrip__glass");
if (topGlass) topGlass.style.pointerEvents = "none";

const tickerLine = mount.querySelector("#m-ticker-line");
if (tickerLine) setTickerHTML(tickerLine, buildTickerWordsHTML(introText));


  const onClick = (e) => {
    const btn = e.target.closest?.(".m-hero-btn");
    if (!btn) return;

    let target = null;
    try { target = JSON.parse(btn.getAttribute("data-target") || "null"); } catch {}
    const hash = hashFromTarget(target);

    if (typeof navigate === "function") navigate(hash);
    else window.location.hash = hash;
  };
    mount.addEventListener("click", onClick);

  return {
    els: { introEl, screen2, feedPanel, feedSentinel },
    destroy: () => {
      mount.removeEventListener("click", onClick);
      cleanupIntroBrand?.();
      cleanupCrawlIO?.();
      carousel?.destroy?.();
    },
  };
}
