import { state } from "./state.js";
import { THEME, LABELS_LTR, DRAW_ORDER, resolveStyle } from "./theme.js";

export function setHolderGlowColor(hex) {
  const flood = document.getElementById("glow-flood");
  if (flood) flood.setAttribute("flood-color", hex);
}

// keep this “harmless” early call behavior (your current code has it)
export function setBottomGlowColor_legacy(hex) {
  const flood = document.getElementById("bottom-glow-flood");
  if (flood) flood.setAttribute("flood-color", hex);
}

export function renderMiddle(dom, metrics) {
  const {
    svgWidth, svgLeft,
    leftX, leftTop, scale,
    rightX, rightTop,
    centerX, centerW,
    CENTER_TOP, CENTER_H,
    HOLDER_HEIGHT,
    LEFT_D, RIGHT_D, CENTER_D
  } = metrics;

  const { svg, gFill, gGlow, gFillMask, gBtns } = dom;

  // apply svg size/pos (LOCKED behavior)
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", 400); // locked holder height for middle canvas
  svg.style.left = svgLeft + "px";

  // buttons (LOCKED visuals)
  const BTN_BASE_W = 115;
  const BUTTON_W = 122.5;
  const OVERLAP = 17;
  const RIGHT_SHAPE_RIGHT_GAP = 15;
  const EXTRA_TOP_OFFSET = -25;

  const step = BUTTON_W - OVERLAP;
  const totalW = BUTTON_W + 4 * step;
  const stackRightX = svgWidth - RIGHT_SHAPE_RIGHT_GAP;
  const stackLeftX  = stackRightX - totalW;

  const btnY = rightTop + EXTRA_TOP_OFFSET;
  const sx = BUTTON_W / BTN_BASE_W;

  const xByLabel = {};
  for (let i = 0; i < LABELS_LTR.length; i++) {
    xByLabel[LABELS_LTR[i]] = stackLeftX + i * step;
  }

  const labelX = 57.5;
  const labelY = 14.2;

  function stripDeco(style) {
    return `
      <g>
        <g filter="url(#${style.barFilter})">
          <g clip-path="url(#top-strip-band)">
            <use href="#btn-shape" fill="${style.hex}" />
          </g>
        </g>

        <g clip-path="url(#btn-clip)">
          <g clip-path="url(#top-strip-band)">
            <use href="#btn-shape" fill="${style.hex}" />
          </g>
        </g>
      </g>
    `;
  }

  function contactDeco(style) {
  const LINE_T = 2;
  const INSET = 3;

  const insetPx = INSET + (LINE_T / 2);
  const insetXLocal = insetPx / sx;
  const insetY = insetPx;

  // NOTE: cp-contact-visible is now defined ONCE in index.html <defs>
  // (same geometry as before: top band + right edge)
  return `
    <g clip-path="url(#btn-clip)">
      <g transform="translate(${-insetXLocal} ${insetY})">
        <g clip-path="url(#cp-contact-visible)" filter="url(#${style.contactFilter})">
          <use href="#btn-shape"
               fill="none"
               stroke="${style.hex}"
               stroke-width="${LINE_T}"
               vector-effect="non-scaling-stroke"/>
        </g>

        <g clip-path="url(#cp-contact-visible)">
          <use href="#btn-shape"
               fill="none"
               stroke="${style.hex}"
               stroke-width="${LINE_T}"
               vector-effect="non-scaling-stroke"/>
        </g>
      </g>
    </g>
  `;
}

  let btnOut = "";
  for (const label of DRAW_ORDER) {
    const x = xByLabel[label];
    const style = resolveStyle(label);
    const deco = (label === "Contact") ? contactDeco(style) : stripDeco(style);

    btnOut += `
      <g class="btn-hit" data-label="${label}"
         transform="translate(${x}, ${btnY}) scale(${sx}, 1)">
        <use href="#btn-base-black"></use>
        ${deco}
        <text class="btn-label"
              x="${labelX}" y="${labelY}"
              text-anchor="middle" dominant-baseline="middle">
          ${label}
        </text>
      </g>
    `;
  }
  gBtns.innerHTML = btnOut;

  // glow follows state
  const glowHex = (state.activeLabel && THEME[state.activeLabel]) ? THEME[state.activeLabel].hex
                : (state.hoverLabel && THEME[state.hoverLabel]) ? THEME[state.hoverLabel].hex
                : THEME._normal.hex;

  setHolderGlowColor(glowHex);
  setBottomGlowColor_legacy(glowHex); // keep harmless call

  // fill mask (LOCKED seam technique)
  const MASK_SEAM_OVERLAP = 2;

  gFillMask.innerHTML = `
    <g transform="translate(${leftX}, ${leftTop}) scale(${scale})">
      <path d="${LEFT_D}"></path>
    </g>

    <g transform="translate(${centerX - MASK_SEAM_OVERLAP}, ${CENTER_TOP})">
      <path d="M 0 0 H ${centerW + MASK_SEAM_OVERLAP * 2} V ${CENTER_H} H 0 Z"></path>
    </g>

    <g transform="translate(${rightX}, ${rightTop}) scale(${scale}) translate(-582 -273)">
      <path d="${RIGHT_D}"></path>
    </g>
  `;

  // gradient fill
  gFill.innerHTML = `
    <rect x="0" y="0" width="${svgWidth}" height="${HOLDER_HEIGHT}"
          fill="url(#holder-glassGrad)" mask="url(#fill-mask)"></rect>
  `;

  // glow seam blockers (LOCKED behavior)
  {
    const seamThickness = 32;
    const seamY = Math.round(CENTER_TOP + 1);
    const seamH = Math.round(CENTER_H - 2);

    const seamX1g = Math.round(centerX - seamThickness / 2);
    const seamX2g = Math.round(centerX + centerW - seamThickness / 2);

    const seam1 = document.getElementById("block-seam-1");
    const seam2 = document.getElementById("block-seam-2");

    seam1.setAttribute("x", seamX1g);
    seam1.setAttribute("y", seamY);
    seam1.setAttribute("width", seamThickness);
    seam1.setAttribute("height", seamH);

    seam2.setAttribute("x", seamX2g);
    seam2.setAttribute("y", seamY);
    seam2.setAttribute("width", seamThickness);
    seam2.setAttribute("height", seamH);
  }

  // glow alpha content
  gGlow.innerHTML = `
    <g transform="translate(${leftX}, ${leftTop}) scale(${scale})">
      <path fill="#000" fill-opacity="1" d="${LEFT_D}"></path>
    </g>

    <g transform="translate(${centerX}, ${CENTER_TOP})">
      <path fill="#000" fill-opacity="1" d="${CENTER_D}"></path>
    </g>

    <g transform="translate(${rightX}, ${rightTop}) scale(${scale}) translate(-582 -273)">
      <path fill="#000" fill-opacity="1" d="${RIGHT_D}"></path>
    </g>
  `;

  return { glowHex };
}
