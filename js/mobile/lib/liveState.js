// /js/mobile/lib/liveState.js
export function installLiveClass({
  scroller,
  targetEl,
  className = "is-live",
  showDelayMs = 300,
  liveRatio = 0.6,
} = {}) {
  if (!scroller || !targetEl) return () => {};

  let t = 0;
  let live = false;

  const setLive = (on) => {
    if (on === live) return;
    live = on;

    if (t) {
      clearTimeout(t);
      t = 0;
    }

    if (live) {
      t = setTimeout(
        () => targetEl.classList.add(className),
        showDelayMs
      );
    } else {
      targetEl.classList.remove(className);
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      const on = !!e && e.isIntersecting && e.intersectionRatio >= liveRatio;
      setLive(on);
    },
    {
      root: scroller,
      threshold: [0, 0.25, liveRatio, 0.9, 1],
    }
  );

  io.observe(targetEl);

  return () => {
    if (t) clearTimeout(t);
    targetEl.classList.remove(className);
    io.disconnect();
  };
}
