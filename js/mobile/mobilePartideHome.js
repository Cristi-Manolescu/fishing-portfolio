// ./js/mobile/mobilePartideHome.js
//
// Stable “scroll-acceleration / catch-up” image reveal:
// - NO direction branches
// - NO revealed state machine
// - Uses scroller-local coordinates (scrollTop + clientHeight)
// - Uses offsetTop chains (not getBoundingClientRect) to avoid threshold jitter
// - Runs on rAF while any images are near viewport (smooth on tiny scrolls)
//
// Tuning:
// - FIXED_A_PX controls how “fast” the catch-up feels (bigger = more travel)
// - REL_A_FACTOR controls relative offset (0.4 * imageHeight)
// - By default we blend: A = min(FIXED_A_PX, REL_A_FACTOR * imageHeight)
//   (best across portrait + landscape, and still easy to tune)

import { resolvePartideLakesForMobile } from "../content.js";
import { getScroller } from "./lib/scroller.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function fetchText(url, fallbackText = "") {
  if (!url) return String(fallbackText || "");
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.text()).trim();
  } catch {
    return String(fallbackText || "");
  }
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// offsetTop-to-document (layout coords, stable)
function offsetTopToDoc(el) {
  let y = 0;
  let cur = el;
  while (cur) {
    y += (cur.offsetTop || 0);
    cur = cur.offsetParent;
  }
  return y;
}

export async function mobilePartideHome({ mountId = "m-root", navigate, scroller = null } = {}) {
  const root = document.getElementById(mountId);
  if (!root) throw new Error("mobilePartideHome: missing mount");
  if (!scroller) scroller = getScroller("#m-root");

  // ---------- TUNING ----------
  const FIXED_A_PX = 300;      // change this if you want faster/slower catch-up
  const REL_A_FACTOR = 0.40;   // 0.4H behavior
  const GAP_TEXT_TO_IMG = 40;  // your layout rule (used only for measuring, not driving motion)
  const END_PADDING_PX = 0;    // optional: add if you want “final” slightly later (usually 0)

  // Smoothing for transform/opacity (stable tiny scrolls)
  const SMOOTH_K = 0.18;       // 0.12 smoother, 0.22 snappier

  const lakes = resolvePartideLakesForMobile() || [];

  const texts = {};
  for (const l of lakes) {
    texts[l.id] = await fetchText(l.lakeTextUrl, "");
  }

  root.innerHTML = `
    <section id="m-partide" class="m-partide">

      <div class="m-panel" id="m-partide-s1">
        <div class="m-down" aria-hidden="true">↓</div>
      </div>

      <div class="m-panel" id="m-partide-s2">
        <div class="m-partide__glass">
          <div class="m-partide__lakes">
            ${lakes.map((l) => `
              <article class="m-lake" data-lake="${esc(l.id)}">
                <button type="button" class="m-lake__btn" data-lake="${esc(l.id)}">
                  <header class="m-lake__head">
                    <h2 class="m-lake__title">${esc(l.title)}</h2>
                  </header>

                  <div class="m-lake__text">
                    <p>${esc(texts[l.id] || "")}</p>
                  </div>

                  <div class="m-lake__media">
                    <img src="${esc(l.heroImg || "")}" alt="" loading="lazy" decoding="async">
                  </div>
                </button>
              </article>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="m-panel" id="m-partide-s3">
        <div class="m-hero-cap">
          <p class="m-hero-title">Contact</p>
          <div class="m-hero-hint">Social media + email (urmează)</div>
        </div>
      </div>

    </section>
  `;

  const els = {
    section: root.querySelector("#m-partide"),
  };

  // ----------------------------
  // Title reveal (delayed 0.5s)
  // ----------------------------
  const lakesEls = () => Array.from(root.querySelectorAll("#m-partide-s2 .m-lake"));
  const tTitle = new WeakMap();

  const ioText = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const lake = e.target.closest(".m-lake");
      if (!lake) continue;

      if (e.isIntersecting) {
        if (lake.classList.contains("is-in")) continue;
        if (tTitle.get(lake)) continue;

        const t = setTimeout(() => {
          tTitle.delete(lake);
          lake.classList.add("is-in");
        }, 500);

        tTitle.set(lake, t);
      } else {
        const t = tTitle.get(lake);
        if (t) { clearTimeout(t); tTitle.delete(lake); }
      }
    }
  }, { root: scroller, threshold: [0, 0.05, 0.15] });

  for (const lake of lakesEls()) {
    const text = lake.querySelector(".m-lake__text");
    if (text) ioText.observe(text);
  }

  // -----------------------------------------
  // Image “catch-up” acceleration (stable)
  // -----------------------------------------
  //
  // Concept:
  // - Each image starts with translateY = A (e.g. 300px down)
  // - Let avail = viewportBottomY - mediaTopY
  //   (how much vertical space is available from media top to viewport bottom)
  // - When avail <= 0      -> ty = A (fully “out”)
  // - When avail >= imgH   -> ty = 0 (final position)
  // - In-between: ty follows a non-linear curve (ease) so it “accelerates”
  //
  // This is direction-agnostic: scrolling up/down naturally reverses it.

  const activeMedia = new Set(); // media elements near viewport
  const state = new WeakMap();   // img -> { curTy:number, A:number, imgH:number }

  let raf = 0;
  let running = false;

  // cache scroller doc top for offset conversion; update on layout changes
  let scrollerDocTop = offsetTopToDoc(scroller);

  function topInScroller(el) {
    // convert stable document layout coords -> scroller local coords
    return offsetTopToDoc(el) - scrollerDocTop;
  }

  function ensureState(img, media) {
    let st = state.get(img);
    if (st) return st;

    const imgH = Math.max(1, media.clientHeight || media.getBoundingClientRect().height || 1);
    const A = Math.min(FIXED_A_PX, imgH * REL_A_FACTOR); // “best default” across portrait/landscape

    st = { curTy: A, A, imgH };
    state.set(img, st);

    img.style.setProperty("--m-img-ty", `${A.toFixed(2)}px`);
    img.style.setProperty("--m-img-op", "0");

    return st;
  }

  function measureAll() {
    // refresh conversion baseline
    scrollerDocTop = offsetTopToDoc(scroller);

    // also refresh A/imgH for any active items (orientation/layout changes)
    for (const media of activeMedia) {
      const img = media.querySelector("img");
      if (!img) continue;

      const st = ensureState(img, media);

      const imgH = Math.max(1, media.clientHeight || media.getBoundingClientRect().height || 1);
      st.imgH = imgH;
      st.A = Math.min(FIXED_A_PX, imgH * REL_A_FACTOR);
      if (st.curTy > st.A) st.curTy = st.A;
    }
  }

  function computeTargetTy({ A, imgH }, mediaTopY, viewportBottomY) {
    const avail = viewportBottomY - mediaTopY;

    if (avail <= 0) return A;

    const end = Math.max(1, imgH + END_PADDING_PX);

    // If A is accidentally >= end (very small media), degrade safely
    if (A >= end - 1) {
      return avail >= end ? 0 : A;
    }

    // progress from A..end
    const p = clamp01((avail - A) / (end - A));
    const e = easeOutCubic(p);     // acceleration feel
    return (1 - e) * A;            // A -> 0
  }

  function tick() {
    raf = 0;
    if (!running) return;

    const viewportBottomY = (scroller.scrollTop || 0) + (scroller.clientHeight || 1);

    for (const media of activeMedia) {
      const img = media.querySelector("img");
      if (!img) continue;

      const st = ensureState(img, media);

      // stable, layout-based position (no rect jitter)
      const mediaTopY = topInScroller(media);

      const target = computeTargetTy(st, mediaTopY, viewportBottomY);

      // smooth toward target for tiny scrolls (prevents micro-jumps)
      st.curTy = st.curTy + (target - st.curTy) * SMOOTH_K;

      // apply
      const ty = Math.max(0, Math.min(st.A, st.curTy));
      img.style.setProperty("--m-img-ty", `${ty.toFixed(2)}px`);
      img.style.setProperty("--m-img-op", String(clamp01(1 - ty / st.A).toFixed(3)));
    }

    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Activate only nearby media blocks (performance)
  const ioMedia = new IntersectionObserver((entries) => {
    let changed = false;

    for (const e of entries) {
      const media = e.target;
      if (e.isIntersecting) {
        if (!activeMedia.has(media)) {
          activeMedia.add(media);
          changed = true;

          const img = media.querySelector("img");
          if (img) {
            // ensure state now; remeasure after image loads too
            ensureState(img, media);
            img.addEventListener("load", measureAll, { once: true });
          }
        }
      } else {
        if (activeMedia.delete(media)) changed = true;
      }
    }

    if (changed) {
      measureAll();
      if (activeMedia.size) start();
      else stop();
    }
  }, {
    root: scroller,
    threshold: [0, 0.01],
    rootMargin: "300px 0px 300px 0px",
  });

  for (const m of root.querySelectorAll("#m-partide-s2 .m-lake__media")) {
    ioMedia.observe(m);
  }

  // keep measurements fresh on viewport/layout changes
  const onResize = () => {
    measureAll();
    if (activeMedia.size) start();
  };
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });

  // scrolling: we don’t compute here; we just ensure rAF is running while active
  const onScroll = () => {
    if (activeMedia.size) start();
  };
  scroller.addEventListener("scroll", onScroll, { passive: true });

  // init once
  measureAll();
  if (activeMedia.size) start();

  // Click -> navigate
  const onClick = (e) => {
    const btn = e.target.closest?.("[data-lake]");
    if (!btn) return;
    const lakeId = btn.getAttribute("data-lake");
    if (!lakeId) return;
    navigate?.({ type: "partide", groupId: lakeId });
  };
  els.section?.addEventListener("click", onClick);

  return {
    els,
    api: {},
    destroy() {
      els.section?.removeEventListener("click", onClick);

      try { ioText.disconnect(); } catch (_) {}
      try { ioMedia.disconnect(); } catch (_) {}

      try {
        for (const lake of lakesEls()) {
          const t = tTitle.get(lake);
          if (t) clearTimeout(t);
        }
      } catch (_) {}

      try { window.removeEventListener("resize", onResize); } catch (_) {}
      try { window.removeEventListener("orientationchange", onResize); } catch (_) {}
      try { scroller.removeEventListener("scroll", onScroll); } catch (_) {}

      stop();
      activeMedia.clear();

      root.innerHTML = "";
    },
  };
}
