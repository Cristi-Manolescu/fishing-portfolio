// /js/svgMeasure.js

const SVG_NS = "http://www.w3.org/2000/svg";

// Finds the right-most x on the path and returns the smallest y among points near that x.
// NOTE: "samples" is a quality/perf knob. 800–1400 is fine.
export function getTopRightCornerY(d, svgForMeasure, samples = 1400) {
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", d);
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", "none");

  svgForMeasure.appendChild(p);

  try {
    const L = p.getTotalLength();

    // Adaptive EPS based on path width (fallback to 0.6 if bbox fails)
    let eps = 0.6;
    try {
      const bb = p.getBBox();
      // ~0.1% of width, clamped
      eps = Math.max(0.4, Math.min(1.2, bb.width * 0.001));
    } catch {
      // keep default eps
    }

    let maxX = -Infinity;
    let minY = Infinity;

    // One pass: track current maxX, and keep minY among points within eps of that maxX.
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * L;
      const pt = p.getPointAtLength(t);

      if (pt.x > maxX + eps) {
        // New "right-most neighborhood" → reset minY for that neighborhood
        maxX = pt.x;
        minY = pt.y;
      } else if (Math.abs(pt.x - maxX) <= eps) {
        if (pt.y < minY) minY = pt.y;
      }
    }

    return { maxX, minY };
  } finally {
    p.remove();
  }
}

export function getPathBBoxInSvg(d, svgEl) {
  const tmp = document.createElementNS(SVG_NS, "path");
  tmp.setAttribute("d", d);
  tmp.setAttribute("fill", "none");
  tmp.setAttribute("stroke", "none");

  svgEl.appendChild(tmp);

  try {
    // getBBox requires the element to be in the DOM (you already do that ✅)
    return tmp.getBBox();
  } finally {
    tmp.remove();
  }
}