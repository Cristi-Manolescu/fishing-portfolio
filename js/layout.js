/**
 * ============================================================
 * LAYOUT SYSTEM — SINGLE SOURCE OF TRUTH
 * ============================================================
 *
 * This file controls:
 *  - All geometry and positioning for:
 *      • middle holder SVG
 *      • logo holder
 *      • bottom holder
 *      • Acasa HTML overlays (banner, dots, ticker)
 *
 * IMPORTANT CONCEPTS
 * ------------------
 * 1) SVG is the MASTER
 *    - All HTML overlays are positioned relative to #main-svg
 *    - HTML never drives geometry; it only follows SVG
 *
 * 2) TWO-PASS SETTLE STRATEGY (INTENTIONAL)
 *    - layout() runs immediately
 *    - requestAnimationFrame() syncs overlay after DOM settles
 *    - Second rAF handles browser resize / scrollbar jitter
 *
 * 3) OPTICAL CORRECTIONS
 *    - Some X offsets (e.g. OPTICAL_X = 62 * scale) are intentional
 *    - They compensate for asymmetric silhouettes
 *    - These values are VISUAL, not mathematical — do not "fix" them
 *
 * SAFE TO EDIT
 * ------------
 *  - Numeric constants if visuals need tuning
 *  - acasaContentWidth() constraints
 *  - Vertical gaps (top/below spacing)
 *
 * DO NOT CHANGE WITHOUT CARE
 * --------------------------
 *  - centerX / centerW derivation
 *  - svgLeft logic (keeps glow inside viewport)
 *  - Two-frame overlay sync logic
 *
 * If something looks wrong after changes:
 *  - Check for conflicts between SVG geometry and HTML overlays
 *  - Visual correctness > mathematical purity
 */

import { renderLogo } from "./logoHolder.js";
import { renderMiddle } from "./middleHolder.js";
import { renderBottom } from "./bottomHolder.js";
import { bottomCaptionApi } from "./interactions.js";

// ============================
// Acasa overlay config (single source of truth)
// ============================
const ACASA_UI = {
  opticalXBase: 62, // scaled by metrics.scale
  safeRightPad: 0,

  topGap: 50,
  bannerH: 125,
  belowGap: 15,
  tickerH: 150,

  baseW: 800,
  minW: 420,
  safeGutter: 360,

  dotsRightOffset: 190,
  dotsBottomOffset: 40,
};

// Avoid piling requestAnimationFrames during hover/resize
let raf1 = 0;
let raf2 = 0;
let psResizeRaf1 = 0;
let psResizeRaf2 = 0;

export function layout(dom) {
  const windowWidth = document.documentElement.clientWidth;

  // ===== MIDDLE HOLDER METRICS (keep identical to your working script) =====
  const HOLDER_HEIGHT = 400;
  const RIGHT_VISIBLE_HEIGHT = 350;
  const VERTICAL_PADDING = 37.5;
  const MIN_CENTER_WIDTH = 150;

  const CENTER_TOP = 12.5;
  const CENTER_H = 350;

  const LEFT_H = 737, LEFT_W = 321;
  const RIGHT_H = 500, RIGHT_W = 857;
  const RIGHT_BOTTOM_LEFT_ANCHOR_Y = 464;

  const scale = RIGHT_VISIBLE_HEIGHT / RIGHT_H;

  const leftWidth = LEFT_W * scale;
  const leftHeight = LEFT_H * scale;
  const rightWidth = RIGHT_W * scale;

  const minSvgWidth = leftWidth + rightWidth + MIN_CENTER_WIDTH;
  const svgWidth = Math.max(minSvgWidth, windowWidth - 200);

  // Keep the whole right silhouette + glow inside the viewport
  const svgLeft = windowWidth - svgWidth - ACASA_UI.safeRightPad;

  const rightTop = VERTICAL_PADDING;
  const rightAnchorPixelY = RIGHT_BOTTOM_LEFT_ANCHOR_Y * scale;
  const leftTop = rightTop + rightAnchorPixelY - leftHeight;

  const leftX = 0;
  const rightX = svgWidth - rightWidth;
  const centerX = leftWidth;
  const centerW = Math.max(svgWidth - leftWidth - rightWidth, MIN_CENTER_WIDTH);

  const LEFT_D = `
M 321.0005 350
C 321.0005 479.1101 321.0005 607.7202 321 737
C 319 737 318 737 317 737
C 240.1254 736.909 163.3122 736.9174 86.499 736.8992
C 71.9779 736.8958 64.2949 731.4938 62.6523 718.3058
C 61.9561 712.7159 63.5791 706.3574 65.7178 700.9716
C 80.2288 664.4294 95.1385 628.0455 109.958 591.626
C 154.9735 480.9991 199.9975 370.3757 245.0433 259.7611
C 251.1696 244.7173 262.8055 236.9931 279.0291 237.0008
C 292.6918 237.0072 306.3544 237.0297 320 237
C 320 237 320 237 321 237
C 321.0005 274.6556 321.0005 312.0778 321.0005 350 Z
`.trim();

  const RIGHT_D = `
M 1057 273
C 1177 273 1296 273 1415 273
C 1429.9817 273.0969 1437.6259 278.3125 1439.3339 291.6497
C 1440.0492 297.2346 1438.431 303.5991 1436.3022 308.9883
C 1423.8093 340.6161 1410.8691 372.0673 1398.048 403.5651
C 1351.0721 518.9711 1304.0935 634.3759 1257.0887 749.7702
C 1250.6042 765.6894 1239.5845 773.0009 1222.452 773.0009
C 1105.9686 773.0009 989.4852 772.9608 873.0021 773.1026
C 866.1561 773.111 861.8259 770.9954 858.9797 764.5674
C 855.4266 756.543 850.8668 748.9697 847.1181 741.024
C 845.5009 737.5963 844 737 839 737
C 755.8795 736.5154 672 737 588 737
C 586 737 584 737 582 737
C 582.1756 569.9422 582.1756 403.8322 582 237
C 583 237 585 237 586 237
C 600.6257 236.9917 615.4582 237.1153 630 237
C 636.0932 236.8728 639.8359 238.8922 642.4107 244.3863
C 647.0468 254.2785 652.3555 263.8555 657 273
C 791 273 924 273 1057 273 Z
`.trim();

  const CENTER_D = `M 0 0 H ${centerW} V ${CENTER_H} H 0 Z`;

  const metrics = {
    svgWidth, svgLeft,
    leftX, leftTop, scale,
    rightX, rightTop,
    centerX, centerW,
    CENTER_TOP, CENTER_H,
    HOLDER_HEIGHT,
    LEFT_D, RIGHT_D, CENTER_D,
  };

  // 1) render middle (also returns glowHex)
  const { glowHex } = renderMiddle(dom, metrics);

  // 2) render logo
  const logoInfo = renderLogo(dom, glowHex);

  // 3) render bottom
  const { bottomSvgHeight } = renderBottom(dom, windowWidth, glowHex);

  // 4) vertical grid (locked behavior)
  {
    const MIN_GAP = 25;
    const LOGO_GAP = 25;

    const BOTTOM_CLEARANCE_NORMAL = 8;
    const BOTTOM_CLEARANCE_MIN = -250;

    const { wrapper, svg, bottomSvg } = dom;
    const wrapperRect = wrapper.getBoundingClientRect();

    const middleBodyBottomLocal = CENTER_TOP + CENTER_H;

    function bottomTopViewport(bottomOffsetPx) {
      return (window.innerHeight - bottomOffsetPx) - bottomSvgHeight;
    }

    const minTopViewport = (logoInfo.logoBottomViewport + LOGO_GAP) - CENTER_TOP;

    const defaultTopViewport =
      (window.innerHeight / 2) - (CENTER_H / 2) - CENTER_TOP;

    let bottomOffset = BOTTOM_CLEARANCE_NORMAL;

    let targetTopViewport = defaultTopViewport;
    if (targetTopViewport < minTopViewport) targetTopViewport = minTopViewport;

    let gapAtTarget =
      bottomTopViewport(bottomOffset) - (targetTopViewport + middleBodyBottomLocal);

    if (gapAtTarget < MIN_GAP) {
      const requiredBottomTop = (targetTopViewport + middleBodyBottomLocal) + MIN_GAP;
      const maxAllowedBottomOffset =
        window.innerHeight - bottomSvgHeight - requiredBottomTop;

      bottomOffset = Math.min(bottomOffset, maxAllowedBottomOffset);
      bottomOffset = Math.max(bottomOffset, BOTTOM_CLEARANCE_MIN);
    }

    svg.style.top = Math.round(targetTopViewport - wrapperRect.top) + "px";
    bottomSvg.style.bottom = Math.round(bottomOffset) + "px";
  }

  // 5) Schedule overlay syncing (2-frame settle, without piling)
  scheduleAcasaOverlaySync(dom, metrics);
}

// --------------------
// Overlay helpers
// --------------------
export function syncMidOverlayToMainSvg(dom) {
  const svg = dom.svg;
  const overlay = dom.midContent;
  if (!svg || !overlay) return;

  const r = svg.getBoundingClientRect();

  // set constants once (no visual impact, reduces style churn)
  if (!overlay.dataset._synced) {
    overlay.style.position = "fixed";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "10";
    overlay.dataset._synced = "1";
  }

  overlay.style.left = `${Math.round(r.left)}px`;
  overlay.style.top = `${Math.round(r.top)}px`;
  overlay.style.width = `${Math.round(r.width)}px`;
  overlay.style.height = `${Math.round(r.height)}px`;
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function acasaContentWidth(metrics) {
  const w = Math.min(ACASA_UI.baseW, metrics.svgWidth - ACASA_UI.safeGutter);
  return Math.max(ACASA_UI.minW, Math.round(w));
}

function acasaAnchor(dom, metrics) {
  const svgRect = dom.svg.getBoundingClientRect();
  const opticalX = Math.round(ACASA_UI.opticalXBase * metrics.scale);

  const cx = svgRect.left + (metrics.svgWidth / 2) + opticalX;
  const bannerTop = svgRect.top + ACASA_UI.topGap;

  return { svgRect, cx, bannerTop };
}

export function positionAcasaBanner(dom, metrics) {
  const banner = document.getElementById("acasa-banner");
  if (!banner) return;
  if (document.body.dataset.section !== "acasa") return;

  const { cx, bannerTop } = acasaAnchor(dom, metrics);
  const w = acasaContentWidth(metrics);

  banner.style.position = "fixed";
  banner.style.left = `${Math.round(cx)}px`;
  banner.style.top = `${Math.round(bannerTop)}px`;
  banner.style.transform = "translateX(-50%)";

  banner.style.width = `${w}px`;
  banner.style.height = `${ACASA_UI.bannerH}px`;
}

export function positionAcasaTicker(dom, metrics) {
  const el = document.getElementById("acasa-ticker");
  if (!el) return;
  if (document.body.dataset.section !== "acasa") return;

  const { cx, bannerTop } = acasaAnchor(dom, metrics);
  const w = acasaContentWidth(metrics);

  const tickerTop = bannerTop + ACASA_UI.bannerH + ACASA_UI.belowGap;

  el.style.position = "fixed";
  el.style.left = `${Math.round(cx)}px`;
  el.style.top = `${Math.round(tickerTop)}px`;
  el.style.transform = "translateX(-50%)";

  el.style.width = `${w}px`;
  el.style.height = `${ACASA_UI.tickerH}px`;
}

export const DESPRE_UI = {
  tickerH: 300,
  maxW: 900,
  minW: 520,
  sidePad: 400,
  topNudge: 0,
};

export const LACURI_UI = {
  stageH: 340,

  maxW: 1120,
  minW: 780,
  sidePad: 320,

  // vertical placement relative to svg center
  stageTopNudge: 10,
};


export function positionDespreTicker(dom, metrics) {
  const el = document.getElementById("acasa-ticker");
  if (!el) return;
  if (document.body.dataset.section !== "despre") return;

  const svg = dom.svg;
  if (!svg) return;

  const r = svg.getBoundingClientRect();
  if (r.width < 50 || r.height < 50) return;

  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const top = cy - DESPRE_UI.tickerH / 2 + DESPRE_UI.topNudge;

  const safeW = Math.max(0, r.width - DESPRE_UI.sidePad);
  const w = Math.max(240, Math.min(DESPRE_UI.maxW, Math.round(safeW)));

  el.style.position = "fixed";
  el.style.left = `${Math.round(cx)}px`;
  el.style.top = `${Math.round(top)}px`;
  el.style.transform = "translateX(-50%)";

  el.style.width = `${w}px`;
  el.style.height = `${DESPRE_UI.tickerH}px`;
}


export function positionLacuriStage(dom, metrics) {
  const el = document.getElementById("lacuri-stage");
  if (!el) return;
  if (document.body.dataset.section !== "lacuri") return;

  const svg = dom.svg;
  if (!svg) return;

  const r = svg.getBoundingClientRect();
  if (r.width < 50 || r.height < 50) return;

  const cx = r.left + r.width / 2;

  // ✅ Use the MIDDLE BODY center (not full SVG center)
  const bodyCenterY = r.top + (metrics.CENTER_TOP + metrics.CENTER_H / 2);

  const safeW = Math.max(0, r.width - LACURI_UI.sidePad);
  const w = clamp(Math.round(safeW), LACURI_UI.minW, LACURI_UI.maxW);

  const top = Math.round(bodyCenterY - LACURI_UI.stageH / 2 + LACURI_UI.stageTopNudge);

  el.style.position = "fixed";
  el.style.left = `${Math.round(cx)}px`;
  el.style.top = `${top}px`;
  el.style.transform = "translateX(-50%)";
  el.style.width = `${w}px`;
  el.style.height = `${LACURI_UI.stageH}px`;
  el.style.pointerEvents = "";      // allow interaction only in lacuri via CSS
  el.style.overflow = "hidden";
  el.style.zIndex = "19";
}


export function positionAcasaDots(dom, metrics) {
  const dots = document.getElementById("acasa-dots");
  if (!dots) return;
  if (document.body.dataset.section !== "acasa") return;

  const { svgRect } = acasaAnchor(dom, metrics);

  const x = svgRect.right - ACASA_UI.dotsRightOffset;
  const y = svgRect.bottom - ACASA_UI.dotsBottomOffset;

  dots.style.left = `${Math.round(x)}px`;
  dots.style.top  = `${Math.round(y)}px`;
  dots.style.transform = "translateX(-100%)";
}

function positionBottomOverlay() {
  const el = document.getElementById("bottom-content");
  const svg = document.getElementById("bottom-svg");
  if (!el || !svg) return;

  const r = svg.getBoundingClientRect();

  const padLeft  = 110;
  const padRight = 110;

  const thumbH = 110;
  const barH = thumbH;

  const left = r.left + padLeft;
  const top  = r.top + (r.height - barH) / 2 + 10;
  const width = Math.max(0, r.width - padLeft - padRight);
  const height = barH;

  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  el.style.width = `${Math.round(width)}px`;
  el.style.height = `${Math.round(height)}px`;
}

function positionBottomCaptionOverlay() {
  const el = document.getElementById("bottom-caption");
  const svg = document.getElementById("bottom-svg");
  if (!el || !svg) return;

  const r = svg.getBoundingClientRect();

  const left = r.left + 320;
  const right = r.right - 15;
  const width = Math.max(0, right - left);

  const CAP_H = 5;
  const top = r.top + CAP_H;

  bottomCaptionApi?.setRect({
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(width),
  });
}

function scheduleAcasaOverlaySync(dom, metrics) {
  cancelAnimationFrame(raf1);
  cancelAnimationFrame(raf2);

  const runPass = () => {
    syncMidOverlayToMainSvg(dom);

    if (document.body.dataset.section === "acasa") {
      positionAcasaBanner(dom, metrics);
      positionAcasaDots(dom, metrics);
      positionAcasaTicker(dom, metrics);
    }

    if (document.body.dataset.section === "despre") {
      positionDespreTicker(dom, metrics);
    }

    if (document.body.dataset.section === "lacuri") {
      positionLacuriStage(dom, metrics);
    } 
    positionBottomOverlay();
    positionBottomCaptionOverlay();
  };

  raf1 = requestAnimationFrame(() => {
    runPass();
    raf2 = requestAnimationFrame(runPass);
  });
}
