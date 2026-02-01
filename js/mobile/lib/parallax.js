// /js/mobile/lib/parallax.js
export function installHeroParallax(feedPanelEl, {
  scroller,
  imgSelector = ".m-hero-media img",
} = {}) {
  if (!feedPanelEl || !scroller) return () => {};

  const getImgs = () => Array.from(feedPanelEl.querySelectorAll(imgSelector));
  if (!getImgs().length) return () => {};

  let raf = 0;
  let running = false;

  let lastY = scroller.scrollTop || 0;
  let dir = 1; // 1 down, -1 up

  const update = () => {
    raf = 0;
    if (!running) return;

    const y = scroller.scrollTop || 0;
    if (y !== lastY) dir = (y > lastY) ? 1 : -1;
    lastY = y;

    const vh = scroller.clientHeight || window.innerHeight || 1;

    for (const img of getImgs()) {
      const media = img.closest(".m-hero-media");
      if (!media) continue;

      const r = media.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (vh * 0.9 + r.height)));
      const max = Math.max(28, r.height * 0.18);

      let ty = (1 - p) * max + (p * -max);
      if (dir < 0) ty = -ty;

      img.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
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
      const e = entries[0];
      const on = !!e && e.isIntersecting;
      if (on) start();
      else stop();
    },
    { root: scroller, threshold: [0, 0.01, 0.1] }
  );

  io.observe(feedPanelEl);

  const kick = window.setTimeout(() => start(), 60);

  return () => {
    window.clearTimeout(kick);
    io.disconnect();
    stop();
    for (const img of getImgs()) img.style.transform = "";
  };
}
