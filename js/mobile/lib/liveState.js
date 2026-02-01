// /js/mobile/lib/liveState.js
export function installLiveClass({
  scroller,
  targetEl,
  className = "is-live",

  // When to turn ON
  enterRatio = 0.85,
  enterDelayMs = 300,  // your existing "showDelayMs" behavior

  // When to turn OFF (hysteresis: lower than enterRatio)
  exitRatio = 0.60,
  exitDelayMs = 240,   // prevents twitchy off when you barely peek next panel

  // Optional: keep ON for at least this long after turning on
  minOnMs = 0,
  onEnter = null,   // ✅ NEW
  onExit = null,    // ✅ NEW
} = {}) {
  if (!scroller || !targetEl) return () => {};

  let on = targetEl.classList.contains(className);
  let tOn = 0;
  let tOff = 0;
  let turnedOnAt = 0;

  const clearTimers = () => {
    if (tOn) { clearTimeout(tOn); tOn = 0; }
    if (tOff) { clearTimeout(tOff); tOff = 0; }
  };

const setOnNow = () => {
  clearTimers();
  if (on) return;
  on = true;
  turnedOnAt = performance.now();
  targetEl.classList.add(className);
  onEnter?.(); // ✅ NEW
};

const setOffNow = () => {
  clearTimers();
  if (!on) return;
  on = false;
  targetEl.classList.remove(className);
  onExit?.(); // ✅ NEW
};

  const scheduleOn = () => {
    if (on) return;
    if (tOn) return;
    if (tOff) { clearTimeout(tOff); tOff = 0; }

    tOn = setTimeout(() => {
      tOn = 0;
      setOnNow();
    }, Math.max(0, enterDelayMs));
  };

  const scheduleOff = () => {
    if (!on && !tOn) return;
    if (tOff) return;
    if (tOn) { clearTimeout(tOn); tOn = 0; }

    const waitMinOn = on && minOnMs > 0
      ? Math.max(0, minOnMs - (performance.now() - turnedOnAt))
      : 0;

    tOff = setTimeout(() => {
      tOff = 0;
      setOffNow();
    }, Math.max(exitDelayMs, waitMinOn));
  };

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      const r = e?.intersectionRatio ?? 0;

      // Hysteresis:
      // - turn on only when strongly visible
      // - turn off only when clearly not visible
      if (r >= enterRatio) scheduleOn();
      else if (r <= exitRatio) scheduleOff();
      // between exitRatio..enterRatio: do nothing (stable zone)
    },
    {
      root: scroller,
      threshold: [0, exitRatio, 0.72, enterRatio, 0.92, 1],
    }
  );

  io.observe(targetEl);

  return () => {
    clearTimers();
    targetEl.classList.remove(className);
    io.disconnect();
  };
}
