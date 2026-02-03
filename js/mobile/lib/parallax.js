// /js/mobile/lib/parallax.js
export function installHeroParallax(feedPanelEl, { scroller } = {}) {
  if (!feedPanelEl || !scroller) return () => {};

  const imgs = () => Array.from(feedPanelEl.querySelectorAll(".m-hero-media img"));
  if (!imgs().length) return () => {};

  let raf = 0;
  let running = false;

  // ✅ store smoothed state per element
  const state = new WeakMap(); // img -> { cur:number }

  const update = () => {
    raf = 0;
    if (!running) return;

    const vh = scroller.clientHeight || window.innerHeight || 1;

    for (const img of imgs()) {
      const media = img.closest(".m-hero-media");
      if (!media) continue;

      const r = media.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (vh * 0.9 + r.height)));
      const max = Math.max(28, r.height * 0.18);

      // ✅ stable mapping (no direction flip)
      const target = (1 - p) * max + (p * -max);

      const s = state.get(img) || { cur: target };
      // ✅ smoothing factor (higher = snappier, lower = smoother)
      s.cur = s.cur + (target - s.cur) * 0.18;
      state.set(img, s);

     const py = `${s.cur.toFixed(2)}px`;
     img.style.setProperty("--py", py);             // new (CSS-var)
     img.style.transform = `translate3d(0, ${py}, 0)`; // legacy (inline)


    }

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

  const io = new IntersectionObserver(
    (entries) => {
      const on = !!entries[0] && entries[0].isIntersecting;
      if (on) start();
      else stop();
    },
    { root: scroller, threshold: [0, 0.01, 0.1] }
  );

  io.observe(feedPanelEl);

  const kick = setTimeout(() => start(), 60);

  return () => {
    clearTimeout(kick);
    io.disconnect();
    stop();
      for (const img of imgs()) {
      img.style.removeProperty("--py");
      img.style.transform = "";
    }
  };
}



export function installParallax({
  rootEl,
  scroller,
  imgSelector = ".m-parallax-media img",
} = {}) {
  if (!rootEl || !scroller) return () => {};

  const imgs = () => Array.from(rootEl.querySelectorAll(imgSelector));
  if (!imgs().length) return () => {};

  let raf = 0;
  let running = false;

  const state = new WeakMap(); // img -> { cur:number }

  const update = () => {
    raf = 0;
    if (!running) return;

    const vh = scroller.clientHeight || window.innerHeight || 1;

    for (const img of imgs()) {
      const media = img.closest(".m-parallax-media") || img.parentElement;
      if (!media) continue;

      const r = media.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (vh * 0.9 + r.height)));
      const max = Math.max(28, r.height * 0.18);

      const target = (1 - p) * max + (p * -max);

      const s = state.get(img) || { cur: target };
      s.cur = s.cur + (target - s.cur) * 0.18;
      state.set(img, s);

     const py = `${s.cur.toFixed(2)}px`;
     img.style.setProperty("--py", py);
     img.style.transform = `translate3d(0, ${py}, 0)`;

    }

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

  const io = new IntersectionObserver(
    (entries) => {
      // any visibility -> run
      const anyOn = entries.some((e) => e.isIntersecting);
      if (anyOn) start();
      else stop();
    },
    { root: scroller, threshold: [0, 0.01, 0.1] }
  );

  // Observe each media wrapper (stable + cheap)
  const observed = new Set();
  for (const img of imgs()) {
    const media = img.closest(".m-parallax-media");
    if (media && !observed.has(media)) {
      observed.add(media);
      io.observe(media);
    }
  }

  const kick = setTimeout(() => start(), 60);

  return () => {
    clearTimeout(kick);
    io.disconnect();
    stop();
     for (const img of imgs()) {
     img.style.removeProperty("--py");
      img.style.transform = "";
   }
  };
}
