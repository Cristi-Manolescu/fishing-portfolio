/**
 * ============================================================
 * ACASA BANNER — LOCKED GEOMETRY MODULE
 * ============================================================
 *
 * Visual Contract:
 *  - Fixed parallelogram shape
 *  - Rounded corners via SVG path (not CSS)
 *  - Glow uses the SAME shape & transform as the mask
 *  - Images are NEVER skewed
 *
 * Geometry Rules:
 *  - W / H / R / ANG_DEG are visually approved values
 *  - baseW + skew math must stay intact
 *  - holderGroup() is the single source of transform truth
 *
 * Integration Rules:
 *  - Banner position is NOT handled here
 *  - This module only renders visuals
 *  - layout.js decides where the banner lives
 *
 * SAFE TO EDIT
 * ------------
 *  - Slide sources
 *  - Timing / fade duration
 *  - Dot behavior
 *
 * DO NOT CHANGE WITHOUT CARE
 * --------------------------
 *  - Rounded rect path math
 *  - Mask + glow alignment
 *  - Skew math (will break corners instantly)
 */

export function createAcasaBanner(mountEl, slides, opts = {}) {
  const intervalMs = opts.intervalMs ?? 5000;

  if (!mountEl) throw new Error("createAcasaBanner: mountEl missing");
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new Error("createAcasaBanner: slides must be a non-empty array");
  }

  // ===== Banner geometry (locked to your spec) =====
  const W = 800;
  const H = 125;
  const R = 15;
  const ANG_DEG = 21.8;

  const tanA = Math.tan((ANG_DEG * Math.PI) / 180);
  const skewX = tanA * H;
  const baseW = W - skewX;
  const xShift = skewX;

  const rr = `
    M ${R} 0
    H ${baseW - R}
    Q ${baseW} 0 ${baseW} ${R}
    V ${H - R}
    Q ${baseW} ${H} ${baseW - R} ${H}
    H ${R}
    Q 0 ${H} 0 ${H - R}
    V ${R}
    Q 0 0 ${R} 0
    Z
  `.trim();

  const holderGroup = (markup) => `
    <g transform="translate(${xShift}, 0) skewX(${-ANG_DEG})">
      ${markup}
    </g>
  `;

  mountEl.innerHTML = "";
  mountEl.style.width = W + "px";
  mountEl.style.height = H + "px";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const uid = Math.random().toString(16).slice(2);
  const glowFilterId = `a-strong-glow-${uid}`;
  const glowFloodId = `a-glow-flood-${uid}`;
  const maskId = `a-mask-${uid}`;

  svg.innerHTML = `
    <defs>
      <filter id="${glowFilterId}" filterUnits="objectBoundingBox"
              x="-50%" y="-50%" width="200%" height="200%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick" />
        <feGaussianBlur in="thick" stdDeviation="3" result="blur" />
        <feComposite in="blur" in2="SourceAlpha" operator="out" result="halo" />
        <feFlood id="${glowFloodId}" flood-color="rgb(255,103,1)" flood-opacity="1" result="col" />
        <feComposite in="col" in2="halo" operator="in" result="glow" />
        <feMerge><feMergeNode in="glow"/></feMerge>
      </filter>

      <mask id="${maskId}" maskUnits="userSpaceOnUse">
        <rect x="-5000" y="-5000" width="10000" height="10000" fill="black"/>
        ${holderGroup(`<path d="${rr}" fill="white"></path>`)}
      </mask>
    </defs>

    <g filter="url(#${glowFilterId})">
      ${holderGroup(`<path d="${rr}" fill="#000" fill-opacity="1"></path>`)}
    </g>

    <g mask="url(#${maskId})">
      <image id="a-img-a-${uid}" x="0" y="0" width="${W}" height="${H}"
             preserveAspectRatio="xMidYMid slice" opacity="1"></image>
      <image id="a-img-b-${uid}" x="0" y="0" width="${W}" height="${H}"
             preserveAspectRatio="xMidYMid slice" opacity="0"></image>
    </g>
  `;

  mountEl.appendChild(svg);

  const imgA = svg.querySelector(`#a-img-a-${uid}`);
  const imgB = svg.querySelector(`#a-img-b-${uid}`);
  const glowFlood = svg.querySelector(`#${glowFloodId}`);

  // ===== Dots (optional) =====
  const dotsWrap = document.getElementById("acasa-dots");
  if (dotsWrap) dotsWrap.innerHTML = "";

  const RING_R = 9;
  const C = 2 * Math.PI * RING_R;

  const dots = [];
  const dotHandlers = [];

  if (dotsWrap) {
    slides.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dot";
      btn.setAttribute("aria-label", `Slide ${i + 1}`);
      btn.innerHTML = `
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <circle class="ring-bg" cx="11" cy="11" r="${RING_R}"
                  fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2"></circle>
          <circle class="ring" cx="11" cy="11" r="${RING_R}"
                  fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="2"
                  stroke-dasharray="${C}" stroke-dashoffset="${C}"></circle>
        </svg>
      `;
      dotsWrap.appendChild(btn);

      const ring = btn.querySelector(".ring");
      dots.push({ btn, ring });

      const handler = () => show(i);
      btn.addEventListener("click", handler);
      dotHandlers.push({ btn, handler });
    });
  }

  let index = 0;
  let rafId = null;
  let destroyed = false;
  let startT = 0;
  let front = "A";

  function setActiveDot(i) {
    if (!dots.length) return;
    dots.forEach((d) => d.btn.classList.remove("is-active"));
    dots[i]?.btn.classList.add("is-active");
  }

  function setRingProgress(i, t01) {
    if (!dots.length) return;
    const d = dots[i];
    if (!d?.ring) return;
    const dash = C * (1 - t01);
    d.ring.style.strokeDashoffset = String(dash);
  }

  function resetAllRings() {
    if (!dots.length) return;
    dots.forEach((d) => d.ring && (d.ring.style.strokeDashoffset = String(C)));
  }

  function setImage(el, src) {
    el.setAttribute("href", src);
  }

  function fadeTo(i) {
    const src = slides[i].src;

    const incoming = front === "A" ? imgB : imgA;
    const outgoing = front === "A" ? imgA : imgB;

    setImage(incoming, src);

    incoming.style.transition = "opacity 450ms ease";
    outgoing.style.transition = "opacity 450ms ease";
    incoming.style.opacity = "1";
    outgoing.style.opacity = "0";

    front = front === "A" ? "B" : "A";

    setActiveDot(i);
    index = i;

    resetAllRings();
    startT = performance.now();
    tick();
  }

  function show(i) { fadeTo(i); }
  function next() { show((index + 1) % slides.length); }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function tick() {
    const now = performance.now();
    const t = Math.min(1, (now - startT) / intervalMs);
    setRingProgress(index, t);

    if (t >= 1) {
      next();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function onEnter() { stop(); }
  function onLeave() { startT = performance.now(); tick(); }

  mountEl.addEventListener("mouseenter", onEnter);
  mountEl.addEventListener("mouseleave", onLeave);

  setImage(imgA, slides[0].src);
  imgA.style.opacity = "1";
  imgB.style.opacity = "0";
  setActiveDot(0);

  startT = performance.now();
  tick();

  return {
    show,
    next,
    stop,
    start: () => { startT = performance.now(); tick(); },
    setGlow: (hex) => {
      if (glowFlood) glowFlood.setAttribute("flood-color", hex);
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stop();

      mountEl.removeEventListener("mouseenter", onEnter);
      mountEl.removeEventListener("mouseleave", onLeave);

      // remove dot listeners (clean)
      dotHandlers.forEach(({ btn, handler }) => btn.removeEventListener("click", handler));

      mountEl.innerHTML = "";
    },
  };
}
