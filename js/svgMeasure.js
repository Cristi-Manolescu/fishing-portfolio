export function getTopRightCornerY(d, svgForMeasure, samples = 1400) {
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", d);
  p.setAttribute("fill", "none");
  svgForMeasure.appendChild(p);

  const L = p.getTotalLength();

  let maxX = -Infinity;
  let pts = [];

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * L;
    const pt = p.getPointAtLength(t);
    pts.push(pt);
    if (pt.x > maxX) maxX = pt.x;
  }

  const EPS = 0.6;
  let minY = Infinity;

  for (const pt of pts) {
    if (Math.abs(pt.x - maxX) <= EPS) {
      if (pt.y < minY) minY = pt.y;
    }
  }

  p.remove();
  return { maxX, minY };
}

export function getPathBBoxInSvg(d, svgEl) {
  const tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
  tmp.setAttribute("d", d);
  svgEl.appendChild(tmp);
  const bb = tmp.getBBox();
  tmp.remove();
  return bb;
}
