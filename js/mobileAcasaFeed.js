// /js/mobileAcasaFeed.js
// Mobile Acasa feed renderer
// Screen 1: intro (snap)
// Screen 2: banner carousel (snap + auto)
// Screen 3: hero feed panel (2 screens tall, free scroll inside)
// Screen 4: contact (snap)

import { resolveAcasaBannerSlides, resolveAcasaLatestList, hashFromTarget } from "./content.js";

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

function installSnapAssist({
  panelSelector = ".m-panel",
  freeScrollSelector = null, // ✅ new
  lockMs = 500,
  settleMs = 140,
  durationMs = 520,
  minDeltaPx = 6,
} = {}) {
  const getPanels = () => Array.from(document.querySelectorAll(panelSelector));

  let settleT = 0;
  let lockT = 0;
  let locked = false;

  let raf = 0;
  let animating = false;
  let lastUserTs = 0;

  const setPointerLock = (on) => {
    document.documentElement.style.pointerEvents = on ? "none" : "";
    document.body.style.pointerEvents = on ? "none" : "";
  };

  const lock = () => {
    if (locked) return;
    locked = true;
    setPointerLock(true);
    lockT = window.setTimeout(() => {
      setPointerLock(false);
      locked = false;
    }, lockMs);
  };

  const stopAnim = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    animating = false;
  };

  const userInteracted = () => {
    lastUserTs = performance.now();
    stopAnim();
  };

  window.addEventListener("wheel", userInteracted, { passive: true });
  window.addEventListener("touchstart", userInteracted, { passive: true });
  window.addEventListener("pointerdown", userInteracted, { passive: true });

  const animateScrollTo = (targetY) => {
    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < minDeltaPx) return;

    const startT = performance.now();
    animating = true;

    const step = (now) => {
      if (now - lastUserTs < 80) {
        stopAnim();
        return;
      }

      const t = Math.min(1, (now - startT) / durationMs);
      const e = easeInOutCubic(t);
      window.scrollTo(0, startY + delta * e);

      if (t < 1) raf = requestAnimationFrame(step);
      else {
        stopAnim();
        lock();
      }
    };

    raf = requestAnimationFrame(step);
  };

  const isInsideFreeScroll = () => {
    if (!freeScrollSelector) return false;
    const el = document.querySelector(freeScrollSelector);
    if (!el) return false;

    const y = window.scrollY;
    const top = el.getBoundingClientRect().top + y;
    const bottom = top + el.offsetHeight;

    // If we're inside the feed panel but not near its edges, do NOT snap.
    const edge = Math.min(140, (window.innerHeight || 800) * 0.18);
    return y > top + edge && y < bottom - edge;
  };

  const snapToNearest = () => {
    if (animating) return;
    if (isInsideFreeScroll()) return; // ✅ key

    const panels = getPanels();
    if (!panels.length) return;

    const y = window.scrollY;
    let bestTop = null;
    let bestDist = Infinity;

    for (const p of panels) {
      const top = p.getBoundingClientRect().top + y;
      const d = Math.abs(top - y);
      if (d < bestDist) {
        bestDist = d;
        bestTop = top;
      }
    }

    if (bestTop == null) return;
    animateScrollTo(bestTop);
  };

  const onScroll = () => {
    if (settleT) clearTimeout(settleT);
    settleT = setTimeout(snapToNearest, settleMs);
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", userInteracted);
    window.removeEventListener("touchstart", userInteracted);
    window.removeEventListener("pointerdown", userInteracted);

    if (settleT) clearTimeout(settleT);
    if (lockT) clearTimeout(lockT);
    stopAnim();
    setPointerLock(false);
  };
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

function buildTickerWordsHTML(text) {
  const raw = String(text || "").trim();
  const firstLine =
    raw.split("\n").map((s) => s.trim()).filter(Boolean)[0] ||
    "Fire întinse și lectură plăcută!";

  const words = firstLine.split(/\s+/).filter(Boolean);
  const stepMs = 55;

  return words
    .map((w, i) => {
      const safe = w.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const delay = i * stepMs;
      return `<span class="m-word" style="animation-delay:${delay}ms">${safe}</span>`;
    })
    .join(" ");
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
  introEl,        // ✅ NEW
  feedSentinel,
  carousel,
  onShowTicker,
  onHideTicker
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
      tickerTimer = window.setTimeout(() => onShowTicker?.(), 1000);
    } else {
      carousel.stop?.({ reset: false });
      if (tickerTimer) {
        window.clearTimeout(tickerTimer);
        tickerTimer = 0;
      }
      // keep ticker state during transition
    }
  };

  const io2 = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.98;
      setScreen2Active(on);
    },
    { threshold: [0, 0.5, 0.98, 1] }
  );
  io2.observe(screen2);

  // When feed sentinel is fully visible => safe to hide ticker + reset
  let io3 = null;
  if (feedSentinel) {
    io3 = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.98;
        if (on) hardReset();
      },
      { threshold: [0, 0.5, 0.98, 1] }
    );
    io3.observe(feedSentinel);
  }

  // ✅ NEW: When Screen 1 is fully visible (scrolling up) => same hard reset
  let io1 = null;
  if (introEl) {
    io1 = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.98;
        if (on) hardReset();
      },
      { threshold: [0, 0.5, 0.98, 1] }
    );
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

/* -------------------------------------------
   ✅ Scroll-linked inner parallax for hero images
   - Same direction for all
   - Alternating based on scroll direction (down vs up)
-------------------------------------------- */

function installHeroParallax(feedPanelEl) {
  if (!feedPanelEl) return () => {};

  const imgs = () => Array.from(feedPanelEl.querySelectorAll(".m-hero-media img"));
  if (!imgs().length) return () => {};

  let raf = 0;
  let running = false;

  let lastY = window.scrollY;
  let dir = 1; // 1 = scrolling down, -1 = up

  const update = () => {
    raf = 0;
    if (!running) return;

    const y = window.scrollY;
    if (y !== lastY) dir = (y > lastY) ? 1 : -1;
    lastY = y;

    const vh = window.innerHeight || 1;
    const list = imgs();

    for (const img of list) {
      const media = img.closest(".m-hero-media");
      if (!media) continue;

      const r = media.getBoundingClientRect();

      // progress 0..1 (center-weighted so it moves across the whole viewport span)
      const p = Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (vh * 0.9 + r.height)));

      // stronger drift so it's visible
      const max = Math.max(32, r.height * 0.22);

      // base drift: entering => +max, leaving => -max
      let ty = (1 - p) * max + (p * -max);

      // reverse when scrolling direction reverses
      if (dir < 0) ty = -ty;

      img.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
    }

    // keep running while visible (avoids "no movement" due to scroll/snap quirks)
    raf = requestAnimationFrame(update);
  };

  const start = () => {
    if (running) return;
    running = true;
    if (!raf) raf = requestAnimationFrame(update);
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  // Run only when feed panel is actually on screen
  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      const on = !!e && e.isIntersecting;
      if (on) start();
      else stop();
    },
    { threshold: [0, 0.01, 0.1] }
  );

  io.observe(feedPanelEl);

  // Also kick once after images decode (first entry)
  window.setTimeout(() => start(), 60);

  return () => {
    io.disconnect();
    stop();
    for (const img of imgs()) img.style.transform = "";
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

function installIntroBrandVisibility(introEl) {
  if (!introEl) return () => {};

  const cls = "m-intro-on";

  const setOn = (on) => {
    document.body.classList.toggle(cls, !!on);
  };

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.98;
      setOn(on);
    },
    { threshold: [0, 0.5, 0.98, 1] }
  );

  io.observe(introEl);

  return () => {
    io.disconnect();
    document.body.classList.remove(cls);
  };
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
        <div class="m-banner-rail" id="m-banner-rail" aria-label="Acasa banners">
          <div class="m-banner-track" id="m-banner-track">
            ${slides.map((s, i) => `
              <div class="m-banner-slide">
                <img
                  src="${escHtml(s.src)}"
                  data-fallback="${escHtml(s.fallbackSrc || "")}"
                  alt="${escHtml(s.alt || "")}"
                  loading="${i < 2 ? "eager" : "lazy"}"
                  decoding="async"
                >
              </div>
            `).join("")}
          </div>
        </div>

        <div class="m-ticker-overlay">
          <p class="m-ticker-line" id="m-ticker-line"></p>
        </div>

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

  const cleanupIntroBrand = installIntroBrandVisibility(introEl);

  // ✅ Snap assist for panels, but DO NOT snap while inside feed panel
  const cleanupSnap = installSnapAssist({
    panelSelector: "#m-acasa .m-panel",
    freeScrollSelector: "#m-acasa-feed-panel",
    lockMs: 500,
    settleMs: 140,
    durationMs: 520,
  });

  const rail = mount.querySelector("#m-banner-rail");
  const track = mount.querySelector("#m-banner-track");
  const screen2 = mount.querySelector("#m-acasa-screen");

  const feedPanel = mount.querySelector("#m-acasa-feed-panel");
  const feedSentinel = mount.querySelector("#m-feed-sentinel");

  // Fallback wiring
  Array.from(mount.querySelectorAll("#m-banner-rail img")).forEach((img, i) => attachImgFallback(img, `banner[${i}]`));
  Array.from(mount.querySelectorAll(".m-hero-card img")).forEach((img, i) => attachImgFallback(img, `hero[${i}]`));

  const carousel = installTransformCarousel(rail, track, slides, { intervalMs: 5000 });

  const tickerLine = mount.querySelector("#m-ticker-line");
  if (tickerLine) tickerLine.innerHTML = buildTickerWordsHTML(introText);

  screen2?.classList.remove("is-live");

  const cleanupScreen2 = installScreen2Controller({
    screen2,
    introEl,        // ✅ NEW: allow reset when Screen 1 is active
    feedSentinel,
    carousel,
    onShowTicker: () => screen2?.classList.add("is-live"),
    onHideTicker: () => screen2?.classList.remove("is-live"),
  });

  // ✅ Parallax inside the feed panel
  const cleanupParallax = installHeroParallax(feedPanel);

  const cleanupFeedSnap = installSoftSnapFeed(feedPanel);

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

  return () => {
    mount.removeEventListener("click", onClick);
    cleanupIntroBrand?.();
    cleanupParallax?.();
    cleanupFeedSnap?.();
    cleanupSnap?.();
    cleanupScreen2?.();
    carousel?.destroy?.();
  };
}
