// /js/bottomCaption.js
// Bottom-holder hover caption (SVG background + HTML text)

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function createBottomCaption(mount, opts = {}) {
  const cfg = {
    height: 25,
    radius: 10,
    slant: 22,
    bgOpacity: 0.8,
    ...opts,
  };

  mount.innerHTML = `
    <svg class="cap-bg" aria-hidden="true">
      <path class="cap-shape"></path>
    </svg>
    <div class="cap-text"></div>
  `;

  const svg  = mount.querySelector(".cap-bg");
  const path = mount.querySelector(".cap-shape");
  const text = mount.querySelector(".cap-text");

  if (!svg || !path || !text) {
    return { setRect() {}, show() {}, hide() {}, destroy() { mount.innerHTML = ""; } };
  }

  // Use SVG-native opacity (very reliable)
  path.setAttribute("fill", "#000");
  path.setAttribute("fill-opacity", String(cfg.bgOpacity));

function buildPath(w, h) {
  const ang = 21.8 * Math.PI / 180;
  const s = Math.round(h * Math.tan(ang));
  const r = Math.min(10, Math.floor(h / 2), Math.floor(w / 4));

  // Flipped parallelogram:
  // TL: (0, 0)
  // TR: (w - s, 0)  <-- rounded corner here
  // BR: (w, h)
  // BL: (s, h)

  const TLx = 0,     TLy = 0;
  const TRx = w - s, TRy = 0;
  const BRx = w,     BRy = h;
  const BLx = s,     BLy = h;

  // Tangent point on top edge (move left by r)
  const topTanX = TRx - r;
  const topTanY = TRy;

  // Right edge direction from TR to BR: v = (s, h)
  const len = Math.hypot(s, h);
  const ux =  s / len;
  const uy =  h / len;

  // Tangent point on right edge (move distance r along that edge)
  const rightTanX = TRx + ux * r;
  const rightTanY = TRy + uy * r;

  return [
    `M ${BLx} ${BLy}`,
    `L ${TLx} ${TLy}`,
    `L ${topTanX} ${topTanY}`,
    `Q ${TRx} ${TRy} ${rightTanX} ${rightTanY}`, // rounded TR only
    `L ${BRx} ${BRy}`,
    `L ${BLx} ${BLy}`,
    `Z`
  ].join(" ");
}

  function setRect({ left, top, width }) {
    const h = cfg.height;

    // position container
    mount.style.left = `${left}px`;
    mount.style.top = `${top}px`;
    mount.style.width = `${width}px`;
    mount.style.height = `${h}px`;

    // critical: define SVG coordinate system and set path geometry
    svg.setAttribute("viewBox", `0 0 ${width} ${h}`);
    svg.setAttribute("preserveAspectRatio", "none");

    path.setAttribute("d", buildPath(width, h));
  }

  function show(label) {
    text.textContent = label || "";
    mount.classList.add("is-visible");
  }

  function hide() {
    mount.classList.remove("is-visible");
  }

  return {
    setRect,
    show,
    hide,
    destroy() {
      mount.innerHTML = "";
    }
  };
}
