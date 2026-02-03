// /js/mobile/lib/articleTextReveal.js
export function installArticleTextReveal({
  scroller,
  rootEl,
  selector = ".m-article__text",
  revealClass = "is-revealed",
  threshold = 0.25,
} = {}) {
  if (!scroller || !rootEl) return () => {};

  const items = Array.from(rootEl.querySelectorAll(selector));
  if (!items.length) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add(revealClass);
        io.unobserve(e.target); // enter once
      }
    },
    { root: scroller, threshold: [0, threshold, 0.5, 1] }
  );

  for (const el of items) io.observe(el);

  return () => {
    try { io.disconnect(); } catch (_) {}
  };
}
