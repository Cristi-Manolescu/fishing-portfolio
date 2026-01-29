// /js/mobileAcasaFeed.js
// Mobile Acasa feed renderer (Screen 1..9)
// No desktop engines touched. Uses content.js as single source.

import { resolveAcasaBannerSlides, resolveAcasaLatestList, hashFromTarget } from "./content.js";

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* -------------------------------------------
   FB-like snap: ease-in-out scroll animation
-------------------------------------------- */

// slow -> fast -> slow
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function installSnapAssist({
  panelSelector = ".m-panel",
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

  const snapToNearest = () => {
    if (animating) return;

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
    raw.split("\n").map(s => s.trim()).filter(Boolean)[0] ||
    "Fire întinse și lectură plăcută!";

  const words = firstLine.split(/\s+/).filter(Boolean);
  const stepMs = 55;

  return words.map((w, i) => {
    const safe = w.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const delay = i * stepMs;
    return `<span class="m-word" style="animation-delay:${delay}ms">${safe}</span>`;
  }).join(" ");
}

/* -------------------------------------------
   Banner auto-carousel (Screen 2)
-------------------------------------------- */

function installAutoCarousel(rail, { intervalMs = 5000 } = {}) {
  if (!rail) return { start() {}, stop() {}, destroy() {}, pause() {} };

  let timer = 0;
  let pausedUntil = 0;
  let hardPaused = false;

  const slideW = () => rail.clientWidth || 1;

  const goNext = () => {
    const w = slideW();
    const max = rail.scrollWidth - w;
    const next = rail.scrollLeft + w;
    const target = next > max + 2 ? 0 : next;
    rail.scrollTo({ left: target, behavior: "smooth" });
  };

  const pauseBriefly = (ms = 2500) => { pausedUntil = Date.now() + ms; };

  const tick = () => {
    if (hardPaused) return;
    if (Date.now() < pausedUntil) return;

    const w = slideW();
    const off = rail.scrollLeft % w;
    const nearSnap = off < 2 || off > w - 2;
    if (nearSnap) goNext();
  };

  const start = () => {
    if (timer) return;
    timer = window.setInterval(tick, intervalMs);
  };

  const stop = () => {
    if (!timer) return;
    window.clearInterval(timer);
    timer = 0;
  };

  const pause = (on) => { hardPaused = !!on; if (on) pauseBriefly(4000); };

  const onPointerDown = () => pauseBriefly(4000);
  const onTouchStart = () => pauseBriefly(5000);
  const onWheel = () => pauseBriefly(4000);
  const onScroll = () => pauseBriefly(1200);

  rail.addEventListener("pointerdown", onPointerDown, { passive: true });
  rail.addEventListener("touchstart", onTouchStart, { passive: true });
  rail.addEventListener("wheel", onWheel, { passive: true });
  rail.addEventListener("scroll", onScroll, { passive: true });

  return {
    start,
    stop,
    pause,
    destroy: () => {
      stop();
      rail.removeEventListener("pointerdown", onPointerDown);
      rail.removeEventListener("touchstart", onTouchStart);
      rail.removeEventListener("wheel", onWheel);
      rail.removeEventListener("scroll", onScroll);
    },
  };
}

function installScreen2Controller({ screen2, auto, onShowTicker, onHideTicker }) {
  if (!screen2) return () => {};

  let tickerTimer = 0;
  let active = false;

  const setActive = (isOn) => {
    if (isOn === active) return;
    active = isOn;

    if (active) {
      auto.start?.();
      tickerTimer = window.setTimeout(() => onShowTicker?.(), 1000);
    } else {
      auto.stop?.();
      if (tickerTimer) window.clearTimeout(tickerTimer);
      tickerTimer = 0;
      onHideTicker?.();
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      const on = !!e && e.isIntersecting && e.intersectionRatio >= 0.98;
      setActive(on);
    },
    { threshold: [0, 0.5, 0.98, 1] }
  );

  io.observe(screen2);

  return () => {
    io.disconnect();
    if (tickerTimer) window.clearTimeout(tickerTimer);
    tickerTimer = 0;
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

  const intro = await fetchText(
    "./assets/text-m/acasa.txt",
    await fetchText("./assets/text/acasa.txt", "Fire întinse și lectură plăcută!")
  );

  mount.innerHTML = `
    <section id="m-acasa">

      <div class="m-panel" id="m-acasa-intro">
        <div class="m-down" aria-hidden="true">↓</div>
      </div>

      <div class="m-panel" id="m-acasa-screen">
        <div class="m-banner-rail" id="m-banner-rail" aria-label="Acasa banners">
          ${slides.map(s => `
            <div class="m-banner-slide">
              <img src="${escHtml(s.src)}" alt="${escHtml(s.alt || "")}" loading="lazy" decoding="async">
            </div>
          `).join("")}
        </div>

        <div class="m-ticker-overlay">
          <p class="m-ticker-line" id="m-ticker-line"></p>
        </div>

        <div class="m-down" aria-hidden="true">↓</div>
      </div>

      ${latest.map(x => `
        <div class="m-panel m-hero-panel">
          <button type="button" class="m-panel-btn" data-target='${escHtml(JSON.stringify(x.target || {}))}'>
            <div class="m-media">
              <img src="${escHtml(x.img)}" alt="" loading="lazy" decoding="async">
            </div>

            <div class="m-hero-cap">
              <p class="m-hero-title">${escHtml(x.title || "")}</p>
              <div class="m-hero-hint">Tap pentru articol →</div>
            </div>
          </button>

          <div class="m-down" aria-hidden="true">↓</div>
        </div>
      `).join("")}

      <div class="m-panel" id="m-acasa-contact">
        <div class="m-hero-cap">
          <p class="m-hero-title">Contact</p>
          <div class="m-hero-hint">Social media + email (urmează)</div>
        </div>
      </div>

    </section>
  `;

  const cleanupSnap = installSnapAssist({
    panelSelector: "#m-acasa .m-panel",
    lockMs: 500,
    settleMs: 140,
    durationMs: 520,
  });

const rail = mount.querySelector("#m-banner-rail");
const auto = installAutoCarousel(rail, { intervalMs: 5000 });

const screen2 = mount.querySelector("#m-acasa-screen");

  const tickerLine = mount.querySelector("#m-ticker-line");
  if (tickerLine) tickerLine.innerHTML = buildTickerWordsHTML(intro);

  screen2?.classList.remove("is-live");

  const cleanupScreen2 = installScreen2Controller({
    screen2,
    auto,
    onShowTicker: () => screen2?.classList.add("is-live"),
    onHideTicker: () => screen2?.classList.remove("is-live"),
  });

  const onClick = (e) => {
    const btn = e.target.closest?.(".m-panel-btn");
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
    cleanupSnap?.();
    cleanupScreen2?.();
    auto?.destroy?.();
  };
}
