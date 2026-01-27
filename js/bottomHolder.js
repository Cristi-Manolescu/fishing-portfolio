import { getTopRightCornerY, getPathBBoxInSvg } from "./svgMeasure.js";

export function setBottomGlowColor(hex) {
  const flood = document.getElementById("b-glow-flood");
  if (flood) flood.setAttribute("flood-color", hex);
}

export function renderBottom(dom, windowWidth, glowHex) {
  const {
    bottomSvg, gBottomFill, gBottomGlow, gBottomFillMask
  } = dom;

  // constants (same as your working build)
  const BOTTOM_TOTAL_HEIGHT = 175;
  const BOTTOM_MIN_CENTER_W = 150;
  const BOTTOM_BOTTOM_MARGIN = 8;
  const BOTTOM_RIGHT_MARGIN = 200;

  const BOTTOM_LEFT_D = `
M 449 551 C 360 551 271 551 183 551 C 167.9623 550.8967 160.3218 545.5399 158.6589 532.3272 C 157.9554 526.7381 159.5793 520.3799 161.7088 514.9888 C 174.2021 483.3599 187.1436 451.9078 199.9609 420.407 C 214.9704 383.5188 229.9858 346.633 245.0429 309.7642 C 251.1882 294.717 262.802 286.9991 279.0334 286.9991 C 395.688 286.9989 512.3426 287.0392 628.997 286.8969 C 635.8447 286.8886 640.1647 289.0122 643.0204 295.432 C 646.722 303.7534 651.3536 311.6564 655.3195 319.8677 C 656.6479 322.6181 658 323 661 323 C 675 323 688 323 702 323 C 702 399 702 475 702 551 C 618 551 534 551 449 551
`.trim();

  const BOTTOM_RIGHT_D = `
M 1324 323.0919 C 1355 323 1384 323 1414 323 C 1417 323 1419.7582 323.3975 1422.3635 323.8401 C 1434.7271 325.9409 1442.736 336.981 1439.1523 348.9384 C 1435.2156 362.0746 1429.9808 374.8485 1424.8564 387.5972 C 1405.9955 434.5207 1386.9713 481.3786 1367.9524 528.2384 C 1361.8455 543.2848 1350.1951 551.0013 1333.9838 551.0014 C 1314.8491 551.0016 1295.7145 551.0014 1276 551 C 1276 475 1276 399 1276 323 C 1292 323 1308 323 1324 323.0919
`.trim();

  // measure
  const bbL = getPathBBoxInSvg(BOTTOM_LEFT_D, bottomSvg);
  const bbR = getPathBBoxInSvg(BOTTOM_RIGHT_D, bottomSvg);

  // left scale (master)
  const leftScale = (bbL.height > 0) ? (BOTTOM_TOTAL_HEIGHT / bbL.height) : 1;
  const leftBottWidth  = bbL.width * leftScale;
  const leftBottHeight = bbL.height * leftScale;

  const bottomSvgHeight = BOTTOM_TOTAL_HEIGHT + (BOTTOM_BOTTOM_MARGIN * 2);
  bottomSvg.setAttribute("height", bottomSvgHeight);

  const baselineY = bottomSvgHeight - BOTTOM_BOTTOM_MARGIN;

  const bottomLeftTopY = baselineY - leftBottHeight;
  const bottomLeftX = 0;

  // true top-right corner y
  const tr = getTopRightCornerY(BOTTOM_LEFT_D, bottomSvg);
  const leftTopRightCornerY_svg =
    bottomLeftTopY + leftScale * (tr.minY - bbL.y);

  // right scale derived from alignment
  const requiredRightHeight = baselineY - leftTopRightCornerY_svg;
  const rightScale = (bbR.height > 0) ? (requiredRightHeight / bbR.height) : 1;

  const rightBottWidth  = bbR.width * rightScale;
  const minBottWidth = leftBottWidth + rightBottWidth + BOTTOM_MIN_CENTER_W;
  const bottomSvgWidth = Math.max(minBottWidth, windowWidth - BOTTOM_RIGHT_MARGIN);

  bottomSvg.setAttribute("width", bottomSvgWidth);

  // layout x
  const bottomRightMostX = bottomSvgWidth;
  const bottomRightX = bottomRightMostX - rightBottWidth;

  const bottomCenterX = bottomLeftX + leftBottWidth;
  const bottomCenterW = Math.max(bottomRightX - bottomCenterX, BOTTOM_MIN_CENTER_W);

  // vertical alignment
  const bottomRightTopY = leftTopRightCornerY_svg;
  const bottomCenterTopY = bottomRightTopY;
  const bottomCenterH = baselineY - bottomCenterTopY;

  const BOTTOM_CENTER_D = `M 0 0 H ${bottomCenterW} V ${bottomCenterH} H 0 Z`;

  // fill
  gBottomFill.innerHTML = `
    <rect x="0" y="0" width="${bottomSvgWidth}" height="${bottomSvgHeight}"
          fill="url(#b-glassGrad)" mask="url(#b-fill-mask)"></rect>
  `;

  gBottomFillMask.innerHTML = `
    <g transform="translate(${bottomLeftX}, ${bottomLeftTopY}) scale(${leftScale}) translate(${-bbL.x}, ${-bbL.y})">
      <path d="${BOTTOM_LEFT_D}"></path>
    </g>

    <g transform="translate(${bottomCenterX}, ${bottomCenterTopY})">
      <path d="${BOTTOM_CENTER_D}"></path>
    </g>

    <g transform="translate(${bottomRightX}, ${bottomRightTopY}) scale(${rightScale}) translate(${-bbR.x}, ${-bbR.y})">
      <path d="${BOTTOM_RIGHT_D}"></path>
    </g>

    <rect x="${bottomCenterX - 1}" y="${bottomCenterTopY}" width="2" height="${bottomCenterH}" fill="white"></rect>
    <rect x="${bottomCenterX + bottomCenterW - 1}" y="${bottomCenterTopY}" width="2" height="${bottomCenterH}" fill="white"></rect>
  `;

  gBottomGlow.innerHTML = `
    <g transform="translate(${bottomLeftX}, ${bottomLeftTopY}) scale(${leftScale}) translate(${-bbL.x}, ${-bbL.y})">
      <path fill="#000" fill-opacity="1" d="${BOTTOM_LEFT_D}"></path>
    </g>

    <g transform="translate(${bottomCenterX}, ${bottomCenterTopY})">
      <path fill="#000" fill-opacity="1" d="${BOTTOM_CENTER_D}"></path>
    </g>

    <g transform="translate(${bottomRightX}, ${bottomRightTopY}) scale(${rightScale}) translate(${-bbR.x}, ${-bbR.y})">
      <path fill="#000" fill-opacity="1" d="${BOTTOM_RIGHT_D}"></path>
    </g>
  `;

  // seam glow blocks
  const seamThicknessBottom = 24;
  const seamYBottom = bottomCenterTopY + 1;
  const seamHBottom = Math.max(0, bottomCenterH - 2);

const s1 = document.getElementById("b-block-seam-1");
const s2 = document.getElementById("b-block-seam-2");

if (s1 && s2) {
  s1.setAttribute("x", bottomCenterX - seamThicknessBottom / 2);
  s1.setAttribute("y", seamYBottom);
  s1.setAttribute("width", seamThicknessBottom);
  s1.setAttribute("height", seamHBottom);

  s2.setAttribute("x", bottomCenterX + bottomCenterW - seamThicknessBottom / 2);
  s2.setAttribute("y", seamYBottom);
  s2.setAttribute("width", seamThicknessBottom);
  s2.setAttribute("height", seamHBottom);
}

  // theme glow
  setBottomGlowColor(glowHex);

  return { bottomSvgHeight };
}
