// logoLoop.js
let enabled = true;     // global kill switch
let allowed = false;    // becomes true only after intro fully finished
let running = false;

let lastDom = null;     // remembers dom so global disable/enable can stop safely
let startedOnce = false;

export function setLogoLoopEnabled(v) {
  enabled = !!v;
  if (!enabled) stopLogoLoop();
}

export function setLogoLoopAllowed(v) {
  allowed = !!v;
  if (!allowed) stopLogoLoop();
}

export function startLogoLoop(dom) {
  lastDom = dom || lastDom;
  if (!enabled || !allowed) return;

  const svg = lastDom?.logoSvg;
  if (!svg) return;

  // Next times: just unpause (avoids stacking animation instances)
if (!startedOnce) {
  const pngReveal = svg.querySelector("#logo-png-reveal");
  if (pngReveal?.beginElement) pngReveal.beginElement();

  const anim1 = svg.querySelector("#logo-sweep-anim");
  if (anim1?.beginElement) anim1.beginElement();

  startedOnce = true;
}

  svg.unpauseAnimations?.();
  running = true;
}

export function stopLogoLoop(dom) {
  lastDom = dom || lastDom;

  const svg = lastDom?.logoSvg;
  if (!svg) return;

  svg.pauseAnimations?.();
  running = false;
}

export function pauseLogoLoop(dom) {
  // pause immediately on activity, even if we haven't "startedOnce" yet
  lastDom = dom || lastDom;

  const svg = lastDom?.logoSvg;
  if (!svg) return;

  svg.pauseAnimations?.();
  running = false;
}

export function resumeLogoLoop(dom) {
  // Only resumes if it was already started. If not started, call startLogoLoop instead.
  lastDom = dom || lastDom;
  if (!enabled || !allowed) return;

  const svg = lastDom?.logoSvg;
  if (!svg) return;

  if (!startedOnce) {
    startLogoLoop(lastDom);
    return;
  }

  svg.unpauseAnimations?.();
  running = true;
}
