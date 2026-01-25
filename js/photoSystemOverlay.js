// /js/photoSystemOverlay.js
// Standalone overlay SVG (no scaling). Geometry is translated only.
// open({ items: [{src} | {type:"youtube", id} ...], index, accentHex })
// - Holder adapts to media aspect + window padding constraints.
// - Holder never shrinks below MIN_HOLDER_{W,H} (prevents cap overlap).
// - If mins require it, holder may overflow viewport, staying centered.
// - Navigation arrows slide current frame out + next frame in.
// - Close button: Contact-style deco (grey normal, theme on hover/press).
// - Layer order: fill → media → glow → stroke → UI
// - Slide: next frame built/sized offscreen; no “resize while centered” during slide.

import { buildPhotoHolder9Slice } from "./photoSystemGeometry.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const imgCache = new Map();

function el(name, attrs = {}) {
  const n = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    n.setAttribute(k, String(v));
  }
  return n;
}

function addHitRect(g, w, h) {
  const r = el("rect", {
    x: 0,
    y: 0,
    width: w,
    height: h,
    fill: "rgba(0,0,0,0)",
    "pointer-events": "all",
  });
  g.insertBefore(r, g.firstChild);
  return r;
}

function snap25(y) {
  return Math.round(y / 25) * 25;
}

function fitRect(maxW, maxH, aspect) {
  if (!isFinite(aspect) || aspect <= 0) aspect = 1000 / 800;
  const boxAspect = maxW / maxH;

  let w, h;
  if (boxAspect > aspect) {
    h = maxH;
    w = h * aspect;
  } else {
    w = maxW;
    h = w / aspect;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function loadImg(src) {
  if (!src) return Promise.reject(new Error("Missing image src"));
  if (imgCache.has(src)) return imgCache.get(src);

  const p = new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`Failed to load ${src}`));
    im.src = src;
  });

  imgCache.set(src, p);
  return p;
}

function normalizeItem(it) {
  if (!it) return null;
  if (it.type === "youtube") return it;
  if (it.src) return { type: "image", src: it.src };
  return it;
}

function itemAspect(it) {
  if (!it) return 1000 / 800;
  if (it.type === "youtube") return it.aspect || (16 / 9);
  return null; // image -> measured from natural
}

function youtubeEmbedUrl(id, { autoplay = 0, mute = 0 } = {}) {
  const params = new URLSearchParams({
    autoplay: String(autoplay ? 1 : 0),
    mute: String(mute ? 1 : 0),
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

// Window padding (soft). Holder may overflow if mins require it.
const PAD_X = 100;
const PAD_Y = 50;

// Image inset inside holder
const IMG_INSET = { left: 10, right: 10, top: 35, bottom: 10 };

// Priority 0: no-overlap mins (image mins + inset)
const MIN_IMG_W = 450;
const MIN_IMG_H = 350;
const MIN_HOLDER_W = MIN_IMG_W + IMG_INSET.left + IMG_INSET.right;
const MIN_HOLDER_H = MIN_IMG_H + IMG_INSET.top + IMG_INSET.bottom;

// Animation
const SLIDE_MS = 320;

// NAV arrows
const NAV_ARROW_SIZE = 25;
const NAV_ARROW_GAP = 20;
const NAV_Y_FROM_BOTTOM = -20; // 20px below BR bottom edge
const NAV_X_FROM_RIGHT = 40;   // 40px left of BR right edge

// Close button (locked)
const BTN_BASE_W = 115;
const BTN_W = 132.5;
const BTN_H = 25;
const BTN_SX = BTN_W / BTN_BASE_W;
const BTN_NORMAL_HEX = "#8e8e8e";

const BTN_PAD_RIGHT = 15;
const BTN_PAD_TOP = 10;
const BTN_Y_NUDGE = -11;

function computeHolderSize(aspect, vw, vh) {
  const maxWSoft = Math.max(0, vw - 2 * PAD_X);
  const maxHSoft = Math.max(0, vh - 2 * PAD_Y);

  const { w: Wfit, h: Hfit } = fitRect(maxWSoft, maxHSoft, aspect);

  let W = Wfit;
  let H = Hfit;

  if (W < MIN_HOLDER_W) {
    W = MIN_HOLDER_W;
    H = Math.round(W / aspect);
  }
  if (H < MIN_HOLDER_H) {
    H = MIN_HOLDER_H;
    W = Math.round(H * aspect);
  }

  // second pass for rounding
  if (W < MIN_HOLDER_W) {
    W = MIN_HOLDER_W;
    H = Math.round(W / aspect);
  }
  if (H < MIN_HOLDER_H) {
    H = MIN_HOLDER_H;
    W = Math.round(H * aspect);
  }

  return { W, H };
}

export function createPhotoSystemOverlay(mount, { onRequestClose } = {}) {
  // Root wrapper inside #overlay-root
  const wrap = document.createElement("div");
  wrap.className = "ps-overlay";

  // SVG fills screen; viewBox is the viewport; we translate a center group
  const svg = el("svg", {
    class: "ps-svg",
    width: "100%",
    height: "100%",
    viewBox: "0 0 1000 1000",
    preserveAspectRatio: "xMidYMid meet",
  });

  const defs = el("defs");
  svg.appendChild(defs);

  // -------------------------
  // Filters (global)
  // -------------------------
  const innerId = `ps-inner-${Math.random().toString(16).slice(2)}`;
  const innerFilter = el("filter", {
    id: innerId,
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%",
    filterUnits: "objectBoundingBox",
  });
  innerFilter.innerHTML = `
    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
    <feOffset dx="0" dy="2" result="off"/>
    <feComposite in="off" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inner"/>
    <feColorMatrix in="inner" type="matrix"
      values="0 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0.55 0" result="shadow"/>
    <feComposite in="shadow" in2="SourceGraphic" operator="over"/>
  `;
  defs.appendChild(innerFilter);

  const glowId = `ps-glow-${Math.random().toString(16).slice(2)}`;
  const glowFilter = el("filter", {
    id: glowId,
    x: "-50%",
    y: "-50%",
    width: "200%",
    height: "200%",
    filterUnits: "objectBoundingBox",
  });
  glowFilter.innerHTML = `
    <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick"/>
    <feGaussianBlur in="thick" stdDeviation="3" result="blur"/>
    <feComposite in="blur" in2="SourceAlpha" operator="out" result="halo"/>
    <feFlood id="ps-glow-flood" flood-color="#ff6701" flood-opacity="1" result="col"/>
    <feComposite in="col" in2="halo" operator="in" result="glow"/>
    <feMerge><feMergeNode in="glow"/></feMerge>
  `;
  defs.appendChild(glowFilter);

  const strokeId = `ps-stroke-${Math.random().toString(16).slice(2)}`;
  const strokeFilter = el("filter", {
    id: strokeId,
    x: "-50%",
    y: "-50%",
    width: "200%",
    height: "200%",
    filterUnits: "objectBoundingBox",
  });
  strokeFilter.innerHTML = `
    <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="dil"/>
    <feComposite in="dil" in2="SourceAlpha" operator="out" result="ring"/>
    <feFlood id="ps-stroke-flood" flood-color="#ff6701" flood-opacity="1" result="col"/>
    <feComposite in="col" in2="ring" operator="in" result="coloredRing"/>
    <feMerge><feMergeNode in="coloredRing"/></feMerge>
  `;
  defs.appendChild(strokeFilter);

  // -------------------------
  // Close button defs
  // -------------------------
  const btnShapeId = `ps-btn-shape-${Math.random().toString(16).slice(2)}`;
  defs.appendChild(
    el("path", {
      id: btnShapeId,
      d: `
        M 0 0
        L 96.91 0
        A 8 8 0 0 1 103.96 4.24
        L 115 25
        L 13.29 25
        Z
      `.trim(),
    })
  );

  const btnClipId = `ps-btn-clip-${Math.random().toString(16).slice(2)}`;
  const btnClip = el("clipPath", { id: btnClipId });
  btnClip.appendChild(el("use", { href: `#${btnShapeId}` }));
  defs.appendChild(btnClip);

  const cpContactId = `ps-cp-contact-${Math.random().toString(16).slice(2)}`;
  const cpContact = el("clipPath", { id: cpContactId, clipPathUnits: "userSpaceOnUse" });
  cpContact.appendChild(el("rect", { x: -50, y: -50, width: 300, height: 82 }));
  cpContact.appendChild(el("rect", { x: 92, y: -50, width: 200, height: 300 }));
  defs.appendChild(cpContact);

  // Theme shadow (updated only when accent changes)
  const contactShadowThemeId = `ps-contact-shadow-theme-${Math.random().toString(16).slice(2)}`;
  const contactShadowTheme = el("filter", {
    id: contactShadowThemeId,
    x: "-60%",
    y: "-300%",
    width: "220%",
    height: "600%",
  });
  contactShadowTheme.innerHTML = `
    <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="#ff6701" flood-opacity="1"/>
    <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="#ff6701" flood-opacity="1"/>
  `;
  defs.appendChild(contactShadowTheme);

  // Grey shadow
  const contactShadowGreyId = `ps-contact-shadow-grey-${Math.random().toString(16).slice(2)}`;
  const contactShadowGrey = el("filter", {
    id: contactShadowGreyId,
    x: "-60%",
    y: "-300%",
    width: "220%",
    height: "600%",
  });
  contactShadowGrey.innerHTML = `
    <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="${BTN_NORMAL_HEX}" flood-opacity="1"/>
    <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="${BTN_NORMAL_HEX}" flood-opacity="1"/>
  `;
  defs.appendChild(contactShadowGrey);

  function makeContactDeco() {
    const LINE_T = 2;
    const INSET = 3;

    const insetPx = INSET + LINE_T / 2;
    const insetXLocal = insetPx / BTN_SX;
    const insetY = insetPx;

    const g = el("g", { "clip-path": `url(#${btnClipId})` });
    const inner = el("g", { transform: `translate(${-insetXLocal} ${insetY})` });

    const shG = el("g", {
      "clip-path": `url(#${cpContactId})`,
      filter: `url(#${contactShadowGreyId})`,
    });

    const shUse = el("use", {
      href: `#${btnShapeId}`,
      fill: "none",
      stroke: BTN_NORMAL_HEX,
      "stroke-width": LINE_T,
      "vector-effect": "non-scaling-stroke",
    });
    shG.appendChild(shUse);

    const lnG = el("g", { "clip-path": `url(#${cpContactId})` });
    const lnUse = el("use", {
      href: `#${btnShapeId}`,
      fill: "none",
      stroke: BTN_NORMAL_HEX,
      "stroke-width": LINE_T,
      "vector-effect": "non-scaling-stroke",
    });
    lnG.appendChild(lnUse);

    inner.appendChild(shG);
    inner.appendChild(lnG);
    g.appendChild(inner);

    return { g, shG, shUse, lnUse };
  }

  // -------------------------
  // Stage & frames
  // -------------------------
  const gStage = el("g", { class: "ps-stage" });
  svg.appendChild(gStage);

  const gCenter = el("g", { class: "ps-center" });
  gStage.appendChild(gCenter);

  const gSlide = el("g", { class: "ps-slide" });
  gCenter.appendChild(gSlide);

  let gCurrent = el("g", { class: "ps-frame ps-frame-current" });
  gSlide.appendChild(gCurrent);

  // -------------------------
  // Per-frame defs management (clipPaths)
  // -------------------------
  function createFrameDefs() {
    const ownerId = `ps-frame-defs-${Math.random().toString(16).slice(2)}`;
    const gDefsOwner = el("g", { "data-frame-defs": ownerId });
    defs.appendChild(gDefsOwner);

    const clipId = `ps-clip-${Math.random().toString(16).slice(2)}`;
    const clip = el("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
    const clipRect = el("rect", { x: 0, y: 0, width: 1, height: 1, rx: 10, ry: 10 });
    clip.appendChild(clipRect);
    gDefsOwner.appendChild(clip);

    return {
      gDefsOwner,
      clipId,
      clipRect,
      destroy() {
        gDefsOwner.remove();
      },
    };
  }

  function setCenterTransform(vw, vh) {
    const cx = Math.round(vw / 2);
    const cy = snap25(Math.round(vh / 2));
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    gCenter.setAttribute("transform", `translate(${cx}, ${cy})`);
  }

  // -------------------------
  // Frame rendering
  // -------------------------
  async function renderFrame(gFrame, item, { deferMedia = false } = {}) {
    gFrame.innerHTML = "";

    const it = normalizeItem(item);
    if (!it) throw new Error("renderFrame(): missing item");

    const frameDefs = createFrameDefs();

    const gFill = el("g", { class: "ps-fill" });
    const gMedia = el("g", { class: "ps-media" });
    const gGlow = el("g", { class: "ps-glow" });
    const gStroke = el("g", { class: "ps-stroke-ring" });
    const gUi = el("g", { class: "ps-ui" });

    gFrame.appendChild(gFill);
    gFrame.appendChild(gMedia);
    gFrame.appendChild(gGlow);
    gFrame.appendChild(gStroke);
    gFrame.appendChild(gUi);

    gFill.setAttribute("pointer-events", "none");
    gMedia.setAttribute("pointer-events", "none");
    gGlow.setAttribute("pointer-events", "none");
    gStroke.setAttribute("pointer-events", "none");
    gUi.setAttribute("pointer-events", "all");

    gGlow.setAttribute("filter", `url(#${glowId})`);
    gStroke.setAttribute("filter", `url(#${strokeId})`);

    let aspect = itemAspect(it);

    let im = null;
    if (it.type === "image") {
      im = await loadImg(it.src);
      aspect = im.naturalWidth / im.naturalHeight;
    }
    if (!isFinite(aspect) || aspect <= 0) aspect = 1000 / 800;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { W, H } = computeHolderSize(aspect, vw, vh);

    buildPhotoHolder9Slice(gFill, { W, H, mode: "fill" });

    gGlow.innerHTML = gFill.innerHTML;
    gStroke.innerHTML = gFill.innerHTML;

    const imgX = IMG_INSET.left;
    const imgY = IMG_INSET.top;
    const imgW = Math.max(1, Math.round(W - IMG_INSET.left - IMG_INSET.right));
    const imgH = Math.max(1, Math.round(H - IMG_INSET.top - IMG_INSET.bottom));

    frameDefs.clipRect.setAttribute("x", imgX);
    frameDefs.clipRect.setAttribute("y", imgY);
    frameDefs.clipRect.setAttribute("width", imgW);
    frameDefs.clipRect.setAttribute("height", imgH);
    frameDefs.clipRect.setAttribute("rx", 10);
    frameDefs.clipRect.setAttribute("ry", 10);

    let mediaCtrl = null;

    if (it.type === "image") {
      gMedia.setAttribute("clip-path", `url(#${frameDefs.clipId})`);
      gMedia.setAttribute("filter", `url(#${innerId})`);

      const imgEl = el("image", {
        x: imgX,
        y: imgY,
        width: imgW,
        height: imgH,
        preserveAspectRatio: "xMidYMid slice",
        href: it.src,
      });
      gMedia.appendChild(imgEl);

      mediaCtrl = { activate() {}, stop() {} };
    }

    if (it.type === "youtube") {
      gMedia.setAttribute("pointer-events", "all");

      const fo = el("foreignObject", { x: imgX, y: imgY, width: imgW, height: imgH });
      fo.setAttribute("pointer-events", "all");

      const host = document.createElement("div");
      host.style.width = "100%";
      host.style.height = "100%";
      host.style.borderRadius = "10px";
      host.style.overflow = "hidden";
      host.style.background = "black";
      host.style.pointerEvents = "auto";

      let iframe = null;

      function mountIframe() {
        if (iframe) return;
        iframe = document.createElement("iframe");
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.style.border = "0";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.src = youtubeEmbedUrl(it.id, { autoplay: 0, mute: 0 });
        host.appendChild(iframe);
      }

      function unmountIframe() {
        if (!iframe) return;
        iframe.src = "about:blank";
        iframe.remove();
        iframe = null;
      }

      if (!deferMedia) mountIframe();

      fo.appendChild(host);
      gMedia.appendChild(fo);

      mediaCtrl = {
        activate() { mountIframe(); },
        stop() { unmountIframe(); },
      };
    }

    return { frameDefs, aspect, W, H, gUi, mediaCtrl };
  }

  // -------------------------
  // UI attached only to CURRENT
  // -------------------------
  let closeBtnG = null;
  let closeDeco = null;
  let navLeftG = null;
  let navRightG = null;

  let closeHover = false;
  let closeDown = false;

  function refreshCloseDeco(currentAccent) {
    if (!closeBtnG || !closeDeco) return;

    const active = closeHover || closeDown;
    const hex = active ? currentAccent : BTN_NORMAL_HEX;

    closeDeco.shG.setAttribute(
      "filter",
      `url(#${active ? contactShadowThemeId : contactShadowGreyId})`
    );

    closeDeco.shUse.setAttribute("stroke", hex);
    closeDeco.lnUse.setAttribute("stroke", hex);
  }

  function positionUi(W, H) {
    if (closeBtnG) {
      const btnX = Math.round(W - BTN_PAD_RIGHT - BTN_W);
      const btnY = Math.round(BTN_PAD_TOP + BTN_Y_NUDGE);
      closeBtnG.setAttribute("transform", `translate(${btnX}, ${btnY}) scale(${BTN_SX}, 1)`);
    }

    if (navLeftG && navRightG) {
      const navY = Math.round(H - NAV_ARROW_SIZE - NAV_Y_FROM_BOTTOM);
      const navRightX = Math.round(W - NAV_X_FROM_RIGHT - NAV_ARROW_SIZE);
      const navLeftX = Math.round(navRightX - NAV_ARROW_GAP - NAV_ARROW_SIZE);

      navLeftG.setAttribute("transform", `translate(${navLeftX}, ${navY})`);
      navRightG.setAttribute("transform", `translate(${navRightX}, ${navY})`);
    }
  }

  function buildUiInto(gUi, W, H, currentAccent) {
    gUi.innerHTML = "";

    closeBtnG = el("g", { class: "ps-close-btn btn-hit", "data-role": "ps-close" });
    closeBtnG.setAttribute("pointer-events", "all");
    addHitRect(closeBtnG, BTN_BASE_W, BTN_H);

    closeBtnG.appendChild(el("use", { href: `#${btnShapeId}`, fill: "#000" }));

    closeDeco = makeContactDeco();
    closeBtnG.appendChild(closeDeco.g);

    const t = el("text", {
      x: 57.5,
      y: 14.2,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      class: "btn-label",
    });
    t.textContent = "Close";
    closeBtnG.appendChild(t);

    closeBtnG.addEventListener("pointerenter", () => {
      closeHover = true;
      refreshCloseDeco(currentAccent);
    });
    closeBtnG.addEventListener("pointerleave", () => {
      closeHover = false;
      closeDown = false;
      refreshCloseDeco(currentAccent);
    });
    closeBtnG.addEventListener("pointerdown", () => {
      closeDown = true;
      refreshCloseDeco(currentAccent);
    });
    closeBtnG.addEventListener("pointercancel", () => {
      closeDown = false;
      refreshCloseDeco(currentAccent);
    });

    gUi.appendChild(closeBtnG);

    navLeftG = el("g", { class: "ps-nav btn-hit", "data-role": "ps-nav-left" });
    navRightG = el("g", { class: "ps-nav btn-hit", "data-role": "ps-nav-right" });

    navLeftG.setAttribute("pointer-events", "all");
    navRightG.setAttribute("pointer-events", "all");

    addHitRect(navLeftG, NAV_ARROW_SIZE, NAV_ARROW_SIZE);
    addHitRect(navRightG, NAV_ARROW_SIZE, NAV_ARROW_SIZE);

    function makeNavCircle() {
      return el("circle", {
        cx: NAV_ARROW_SIZE / 2,
        cy: NAV_ARROW_SIZE / 2,
        r: NAV_ARROW_SIZE / 2,
        fill: "rgba(0,0,0,0.6)",
        stroke: "var(--ps-accent,#ff6701)",
        "stroke-width": 1,
      });
    }

    navLeftG.appendChild(makeNavCircle());
    navRightG.appendChild(makeNavCircle());

    function makeArrowPath(dir) {
      const g = el("g", {
        transform: "translate(12.5 12.5) scale(0.7) translate(-12.5 -12.5)",
      });

      g.appendChild(
        el("path", {
          d: dir === "left" ? "M 18 9 L 10 12.5 L 18 16" : "M 7 9 L 15 12.5 L 7 16",
          fill: "none",
          stroke: "var(--ps-accent,#ff6701)",
          "stroke-width": 2,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        })
      );

      return g;
    }

    navLeftG.appendChild(makeArrowPath("left"));
    navRightG.appendChild(makeArrowPath("right"));

    gUi.appendChild(navLeftG);
    gUi.appendChild(navRightG);

    positionUi(W, H);
    refreshCloseDeco(currentAccent);
  }

  // -------------------------
  // Mount
  // -------------------------
  wrap.appendChild(svg);
  mount.appendChild(wrap);

  // -------------------------
  // State
  // -------------------------
  let isOpen = false;
  let isSliding = false;

  let items = [];
  let index = 0;

  let currentAccent = "#ff6701";

  let cur = {
    frameDefs: null,
    aspect: null,
    W: 0,
    H: 0,
    gUi: null,
    mediaCtrl: null,
  };

  let opToken = 0;
  const bumpToken = () => { opToken++; };


  function setAccent(hex) {
    currentAccent = hex || currentAccent;
    wrap.style.setProperty("--ps-accent", currentAccent);

    const gf = svg.querySelector("#ps-glow-flood");
    const sf = svg.querySelector("#ps-stroke-flood");
    if (gf) gf.setAttribute("flood-color", currentAccent);
    if (sf) sf.setAttribute("flood-color", currentAccent);

    // update theme shadow filter only when accent changes
    contactShadowTheme.innerHTML = `
      <feDropShadow dx="0" dy="-2" stdDeviation="2.2" flood-color="${currentAccent}" flood-opacity="1"/>
      <feDropShadow dx="0" dy="10" stdDeviation="6.5" flood-color="${currentAccent}" flood-opacity="1"/>
    `;

    refreshCloseDeco(currentAccent);
  }

  function setOpen(next) {
    isOpen = !!next;
    wrap.toggleAttribute("data-open", isOpen);

    // Gate pointer events at overlay-root level (your CSS relies on this)
    mount.classList.toggle("is-open", isOpen);

    // Do NOT set inline pointer-events here (avoid fighting CSS)
  }

  function syncViewport() {
    if (!isOpen) return;
    setCenterTransform(window.innerWidth, window.innerHeight);
  }

  function onGlobalPointerUp() {
    if (!closeDown) return;
    closeDown = false;
    refreshCloseDeco(currentAccent);
  }
  window.addEventListener("pointerup", onGlobalPointerUp, { passive: true });

  function onKey(e) {
    if (e.key === "Escape") onRequestClose?.();
  }
  window.addEventListener("keydown", onKey);

  // -------------------------
  // Input routing (single handler)
  // -------------------------
  function findRoleFromEvent(e) {
    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    for (const n of path) {
      if (!n || !n.getAttribute) continue;
      const role = n.getAttribute("data-role");
      if (role) return role;
    }
    return null;
  }

function onSvgPointerDown(e) {
  const role = findRoleFromEvent(e);
  console.log("[PS] pointerdown role:", role);
  if (!role) return;

  e.preventDefault();
  e.stopPropagation();

  if (role === "ps-close") { onRequestClose?.(); return; }
  if (role === "ps-nav-left") { console.log("[PS] slide -1"); slide(-1); return; }
  if (role === "ps-nav-right") { console.log("[PS] slide +1"); slide(+1); return; }
}

  svg.addEventListener("pointerdown", onSvgPointerDown, { passive: false });

  // -------------------------
  // Rebuild current frame
  // -------------------------
  async function rebuildCurrentFromIndex() {
    const my = opToken;

    const it = normalizeItem(items[index]);
    if (!it) return;

    cur.mediaCtrl?.stop?.();
    cur.frameDefs?.destroy?.();

    const rendered = await renderFrame(gCurrent, it, { deferMedia: false });
    if (my !== opToken || !isOpen) {  // ✅ cancelled or closed
      rendered?.mediaCtrl?.stop?.();
      rendered?.frameDefs?.destroy?.();
      return;
    }

    cur.frameDefs = rendered.frameDefs;
    cur.aspect = rendered.aspect;
    cur.W = rendered.W;
    cur.H = rendered.H;
    cur.gUi = rendered.gUi;
    cur.mediaCtrl = rendered.mediaCtrl;

    setCenterTransform(window.innerWidth, window.innerHeight);

    gCurrent.setAttribute(
      "transform",
      `translate(${Math.round(-cur.W / 2)}, ${Math.round(-cur.H / 2)})`
    );

    buildUiInto(cur.gUi, cur.W, cur.H, currentAccent);

    gSlide.style.transition = "";
    gSlide.setAttribute("transform", "translate(0,0)");
  }

  // -------------------------
  // Slide animation
  // -------------------------
  async function slide(dir) {
  if (!isOpen || isSliding || !items.length) return;

  const my = opToken;

  const nextIndex = (index + dir + items.length) % items.length;
  if (nextIndex === index) return;

  isSliding = true;

  let gNext = null;
  let nextRendered = null;
  let gNextWrap = null;

  try {
    gNext = el("g", { class: "ps-frame ps-frame-next" });

    const nextItem = normalizeItem(items[nextIndex]);
    nextRendered = await renderFrame(gNext, nextItem, { deferMedia: true });

    if (my !== opToken || !isOpen) return;

    setCenterTransform(window.innerWidth, window.innerHeight);

    gCurrent.setAttribute(
      "transform",
      `translate(${Math.round(-cur.W / 2)}, ${Math.round(-cur.H / 2)})`
    );
    gNext.setAttribute(
      "transform",
      `translate(${Math.round(-nextRendered.W / 2)}, ${Math.round(-nextRendered.H / 2)})`
    );

    const travel = Math.max(cur.W, nextRendered.W) + 80;

    gNextWrap = el("g", { class: "ps-next-wrap" });
    gNextWrap.appendChild(gNext);
    gSlide.appendChild(gNextWrap);

    gNextWrap.setAttribute("transform", `translate(${dir > 0 ? travel : -travel}, 0)`);

    gSlide.style.transition = "";
    gSlide.setAttribute("transform", "translate(0,0)");
    gSlide.getBBox?.();

    gSlide.style.transition = `transform ${SLIDE_MS}ms ease`;

    await new Promise((r) => requestAnimationFrame(r));
    if (my !== opToken || !isOpen) return;

    gSlide.setAttribute("transform", `translate(${dir > 0 ? -travel : travel}, 0)`);

    await new Promise((r) => setTimeout(r, SLIDE_MS + 30));
    if (my !== opToken || !isOpen) return;

    // cleanup old
    cur.mediaCtrl?.stop?.();
    cur.frameDefs?.destroy?.();
    gCurrent.remove();

    // promote
    gCurrent = gNext;

    gNextWrap.remove();
    gSlide.appendChild(gCurrent);

    gSlide.style.transition = "";
    gSlide.setAttribute("transform", "translate(0,0)");

    index = nextIndex;
    cur.frameDefs = nextRendered.frameDefs;
    cur.aspect = nextRendered.aspect;
    cur.W = nextRendered.W;
    cur.H = nextRendered.H;
    cur.gUi = nextRendered.gUi;
    cur.mediaCtrl = nextRendered.mediaCtrl;

    buildUiInto(cur.gUi, cur.W, cur.H, currentAccent);
    cur.mediaCtrl?.activate?.();

    setCenterTransform(window.innerWidth, window.innerHeight);
    gCurrent.setAttribute(
      "transform",
      `translate(${Math.round(-cur.W / 2)}, ${Math.round(-cur.H / 2)})`
    );
  } catch (err) {
    console.error("[PS] slide() failed:", err, {
      dir,
      index,
      nextIndex,
      nextItem: items[nextIndex],
    });

    // Clean any partial next frame
    try { nextRendered?.mediaCtrl?.stop?.(); } catch {}
    try { nextRendered?.frameDefs?.destroy?.(); } catch {}
    try { gNextWrap?.remove?.(); } catch {}

    // IMPORTANT: unlock so arrows don’t become “dead”
  } finally {
    isSliding = false;
  }
}

  // -------------------------
  // Public API
  // -------------------------
  async function open({ accentHex, src, items: nextItems, index: nextIndex = 0 } = {}) {
    console.log("[PS] open() nextItems:", nextItems?.length, "index:", nextIndex, nextItems);
    bumpToken();
    const my = opToken;
    if (accentHex) setAccent(accentHex);

    // Back-compat: open({ src })
    if (src && (!Array.isArray(nextItems) || nextItems.length === 0)) {
      nextItems = [{ src }];
      nextIndex = 0;
    }

    if (Array.isArray(nextItems)) items = nextItems.slice();
    index = Math.max(0, Math.min((items.length || 1) - 1, nextIndex | 0));

    // Ensure CSS gating takes effect
    setOpen(true);

    if (my !== opToken) return;

    if (!items.length || !normalizeItem(items[index])) {
      console.warn("[photoSystemOverlay] open(): missing items/src", { src, nextItems, nextIndex, items });
      syncViewport();
      return;
    }

    await rebuildCurrentFromIndex();
    if (my !== opToken || !isOpen) return;
    syncViewport();
  }

  function close() {
    bumpToken();            // ✅ cancel in-flight async work
    isSliding = false;      // ✅ unlock if a slide was mid-flight
    setOpen(false);
    cur.mediaCtrl?.stop?.();
  }


  async function layout() {
    if (!isOpen) return;
    if (isSliding) return;
    if (!items.length || !normalizeItem(items[index])) return;
    await rebuildCurrentFromIndex();
    syncViewport();
  }

  return {
    open,
    close,
    layout,
    syncViewport,
    setAccent,
    destroy() {
      bumpToken();          // ✅ cancel in-flight async work
      isSliding = false;

      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerup", onGlobalPointerUp);
      svg.removeEventListener("pointerdown", onSvgPointerDown);

      cur.mediaCtrl?.stop?.();
      cur.frameDefs?.destroy?.();
      wrap.remove();
    },
  };
}
