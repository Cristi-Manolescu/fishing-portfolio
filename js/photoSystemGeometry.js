// /js/photoSystemGeometry.js
// Builds your 9-slice holder into a given <g> using ONLY translate (no scaling)

const SVG_NS = "http://www.w3.org/2000/svg";

function el(name, attrs = {}) {
  const n = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    n.setAttribute(k, String(v));
  }
  return n;
}

// Your exact path data (UNCHANGED)
const D_TL = `M 233 252 C 189 252 145 252 101 252 C 101 250 101 249 101 248 C 101 208 101 167 101 127 C 101 112 112 101 127 101 C 184 101 242 101 299 101 C 300 101 301 101 301 101 C 301 151 301 201 301 252 C 279 252 256 252 233 252`;

const D_TR = `M 621 252 C 581 252 541 252 502 252 C 502 201 502 152 502 101 C 518 101 534 101 549 101 C 552 101 554.6461 103.3264 555.7642 105.1913 C 559.0081 110.6021 561.91 116.2545 564.4759 122.0213 C 565.9376 125.3063 568 126 571 126 C 605 126 639 126 673 126 C 691 126 701 136 701 154 C 701 185 701 216 701 246 C 701 248 701 250 701 252 C 674 252 648 252 621 252`;

const D_BL = `M 264 526 C 219 526 174 526 130 526 C 117 526 101 522 101 502 C 101 468 101 435 101 401 C 168 401 235 401 301 401 C 301 443 301 484 301 526 C 289 526 277 526 264 526`;

const D_BR = `M 662 401 C 675 401 688 401 701 401 C 701 402 701 403 701 405 C 701 445 701 485 701 525 C 701 536 696.3253 544.3268 686.2139 549.0488 C 683.7454 550.2017 681 551 678 551 C 643 551 607 551 572 551 C 567 551 564.2249 549.5661 562.3322 545.3506 C 559.9489 540.0424 556.8884 535.0391 554.4868 529.738 C 553.1714 526.8345 551.3897 526.0584 548 526 C 533 526 517 526 502 526 C 502 485 502 443 502 401 C 555 401 608 401 662 401`;

function toInt(n, fallback) {
  const x = Number(n);
  return Number.isFinite(x) ? (x | 0) : fallback;
}

function clampNonNeg(n) {
  return n < 0 ? 0 : n;
}

/**
 * Build the holder at 0,0 in LOCAL coordinates.
 * No scaling: only translate the 4 corner paths into position.
 * The other 5 slices are adaptive rectangles.
 */
export function buildPhotoHolder9Slice(gRoot, opts = {}) {
  if (!gRoot) return null;
  gRoot.innerHTML = "";

  // Keep geometry exactly as before (just hardened inputs)
  const W = toInt(opts.W ?? 1000, 1000);
  const H = toInt(opts.H ?? 800, 800);

  const mode = opts.mode ?? "fill"; // "fill" | "stroke"
  const isFill = mode === "fill";

  // Asymmetric caps: TR/BR are 199px wide in your path data
  const capL = 200;
  const capR = 199;

  const topH = 150;
  const bottomH = 125;

  const midH = clampNonNeg(H - topH - bottomH);
  const bottomTop = topH + midH;
  const midW = clampNonNeg(W - capL - capR);

  const mkPath = (d) =>
    el("path", {
      d,
      class: isFill ? "ps-fillshape" : "ps-stroke",
      fill: isFill ? "#000" : "none",
    });

  const BLEED = 1; // internal seam overlap only (do NOT grow outside holder)

  // directional bleed helper: expands only where needed
  function mkRectB(x, y, w, h, bL, bT, bR, bB) {
    const xx = x - (bL ? BLEED : 0);
    const yy = y - (bT ? BLEED : 0);
    const ww = w + (bL ? BLEED : 0) + (bR ? BLEED : 0);
    const hh = h + (bT ? BLEED : 0) + (bB ? BLEED : 0);

    // Keep exactly the same rounding style as your version
    const rx = Math.round(xx);
    const ry = Math.round(yy);
    const rw = Math.max(0, Math.round(ww));
    const rh = Math.max(0, Math.round(hh));

    return el("rect", {
      x: rx,
      y: ry,
      width: rw,
      height: rh,
      class: isFill ? "ps-fillshape" : "ps-stroke",
      fill: isFill ? "#000" : "none",
    });
  }

  // ============================
  // Corner groups (translate only) — UNCHANGED geometry
  // ============================

  // TL at (0,0)
  const gTL = el("g", { transform: "translate(-101,-101)" });
  gTL.appendChild(mkPath(D_TL));
  gRoot.appendChild(gTL);

  // TR at (W - capR, 0)
  const gTR = el("g", { transform: `translate(${W - capR},0) translate(-502,-101)` });
  gTR.appendChild(mkPath(D_TR));
  gRoot.appendChild(gTR);

  // BL at (0, bottomTop)
  const gBL = el("g", { transform: `translate(0,${bottomTop}) translate(-101,-401)` });
  gBL.appendChild(mkPath(D_BL));
  gRoot.appendChild(gBL);

  // BR at (W - capR, bottomTop)
  const gBR = el("g", { transform: `translate(${W - capR},${bottomTop}) translate(-502,-401)` });
  gBR.appendChild(mkPath(D_BR));
  gRoot.appendChild(gBR);

  // ============================
  // 5 slice rects — SAME bleed rules as your file
  // ============================

  // Top-middle: bleed L/R + DOWN only (avoid growing above y=0)
  gRoot.appendChild(mkRectB(capL, 0, midW, topH, true, false, true, true));

  // Middle-left: bleed UP/DOWN + RIGHT only (avoid growing outside x=0)
  gRoot.appendChild(mkRectB(0, topH, capL, midH, false, true, true, true));

  // Middle-center: bleed all directions (internal seams only)
  gRoot.appendChild(mkRectB(capL, topH, midW, midH, true, true, true, true));

  // Middle-right: bleed UP/DOWN + LEFT only (avoid growing outside right edge)
  gRoot.appendChild(mkRectB(W - capR, topH, capR, midH, true, true, false, true));

  // Bottom-middle: bleed L/R + UP only (avoid growing below bottom edge)
  gRoot.appendChild(mkRectB(capL, bottomTop, midW, bottomH, true, true, true, false));

  return { W, H, capL, capR, topH, midH, bottomH, bottomTop, midW };
}
