// /js/acasaThumbs.js
// Thumbnails strip (deterministic paging, no native scroll)

const DEFAULTS = {
  thumbW: 90,
  thumbH: 110,
  radius: 10,
  gap: 12,

  edgePad: 10,
  arrowSize: 34,
  arrowGap: 10,
  safety: 20,

  animMs: 260,

  eagerCount: 6,          // first N thumbs load eagerly
  highPriorityCount: 2,   // first N thumbs get fetchpriority="high"


  // ✅ NEW
  captionMode: "hover", // "hover" | "inline" | "none"
};

function clampInt(n, min, max) {
  return Math.max(min, Math.min(max, n | 0));
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createAcasaThumbs(mount, items = [], opts = {}) {
  if (!mount) return { destroy() {} };

  const cfg = { ...DEFAULTS, ...opts };

  // Callbacks
  const onHover = cfg.onHover || null;
  const onLeave = cfg.onLeave || null;
  const onClickThumb = cfg.onClickThumb || null;

  // ✅ NEW
  const captionMode = cfg.captionMode; // "hover" | "inline" | "none"

  // Per-instance state
  let visibleCount = 1;
  let index = 0;
  let maxIndex = 0;
  let cellPx = cfg.thumbW + cfg.gap;

  // CSS vars
  mount.style.setProperty("--thumb-w", `${cfg.thumbW}px`);
  mount.style.setProperty("--thumb-h", `${cfg.thumbH}px`);
  mount.style.setProperty("--thumb-r", `${cfg.radius}px`);
  mount.style.setProperty("--thumb-gap", `${cfg.gap}px`);

  // Build DOM
  mount.innerHTML = `
    <button class="thumb-arrow left" type="button" aria-label="Scroll left">‹</button>
    <div class="thumb-viewport" aria-label="Latest posts">
      <div class="thumb-rail"></div>
    </div>
    <button class="thumb-arrow right" type="button" aria-label="Scroll right">›</button>
  `;

  const viewport = mount.querySelector(".thumb-viewport");
  const rail = mount.querySelector(".thumb-rail");
  const leftBtn = mount.querySelector(".thumb-arrow.left");
  const rightBtn = mount.querySelector(".thumb-arrow.right");

  if (!viewport || !rail) return { destroy() {} };

  // Build thumbs
  rail.innerHTML = items
    .map((it, idx) => {
      const rawTitle = it?.title || `Item ${idx + 1}`;
      const title = escHtml(rawTitle);
      const eager = idx < (cfg.eagerCount ?? 0);
const high = idx < (cfg.highPriorityCount ?? 0);

const img = it?.img
  ? `<img
       src="${it.img}"
       alt="${title}"
       loading="${eager ? "eager" : "lazy"}"
       decoding="async"
       ${high ? 'fetchpriority="high"' : ""}
     >`
  : "";

      const dataId = it?.id ?? idx;

      const inlineCap =
        captionMode === "inline"
          ? `<span class="thumb-cap">${title}</span>`
          : "";

      return `
        <button class="thumb" type="button" data-id="${dataId}" title="${title}">
          ${img}
          ${inlineCap}
        </button>
      `;
    })
    .join("");

  // Hover caption (LOCKED behavior) ✅ ONLY when captionMode === "hover"
  function onPointerMove(e) {
    const t = e.target.closest(".thumb");
    if (!t) return;
    const title = t.getAttribute("title") || "";
    onHover?.(title);
  }

  function onPointerLeave() {
    onLeave?.();
  }

  if (captionMode === "hover") {
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerleave", onPointerLeave);
  }

  // Rail movement
  rail.style.willChange = "transform";
  rail.style.transition = `transform ${cfg.animMs}ms ease`;
  rail.style.transform = "translateX(0px)";

  function measureCell() {
    const thumbs = rail.querySelectorAll(".thumb");
    if (thumbs.length >= 2) {
      const a = thumbs[0].offsetLeft;
      const b = thumbs[1].offsetLeft;
      const d = b - a;
      if (d > 0) cellPx = d;
    } else {
      cellPx = cfg.thumbW + cfg.gap;
    }
  }

    // --- External reset hook (used by no-scroll guard when everything fits) ---
  function resetToStart() {
    index = 0;
    applyIndex("none");
  }

  function onResetEvent() {
    resetToStart();
  }

  // Listen on mount so any helper can bubble an event to it
  mount.addEventListener("thumbs:reset", onResetEvent);


  function canWheelPage() {
    return items.length > visibleCount;
  }

  function updateArrows() {
    const canScroll = canWheelPage();

    if (!canScroll) {
      leftBtn?.classList.add("is-hidden");
      rightBtn?.classList.add("is-hidden");
            // ✅ optional: ensure we are not left translated
      if (index !== 0) {
        index = 0;
        applyIndex("none");
      }
      return;
    }

    

    leftBtn?.classList.remove("is-hidden");
    rightBtn?.classList.remove("is-hidden");
    leftBtn?.classList.toggle("is-disabled", index <= 0);
    rightBtn?.classList.toggle("is-disabled", index >= maxIndex);
  }

  function applyIndex(behavior = "anim") {
    index = clampInt(index, 0, maxIndex);
    const x = Math.round(-index * cellPx);

    if (behavior === "none") {
      const prev = rail.style.transition;
      rail.style.transition = "none";
      rail.style.transform = `translateX(${x}px)`;
      rail.offsetHeight;
      rail.style.transition = prev;
    } else {
      rail.style.transform = `translateX(${x}px)`;
    }

    updateArrows();
  }

  function page(dir) {
    index += dir * visibleCount;
    applyIndex("anim");
  }

  function onArrowLeft(e) {
    e.preventDefault();
    e.stopPropagation();
    page(-1);
  }

  function onArrowRight(e) {
    e.preventDefault();
    e.stopPropagation();
    page(1);
  }

  leftBtn?.addEventListener("click", onArrowLeft);
  rightBtn?.addEventListener("click", onArrowRight);

  let wheelAccum = 0;
  let wheelTimer = 0;

  function onWheel(e) {
    if (!canWheelPage()) return;

    const dx = Math.abs(e.deltaX);
    const dy = Math.abs(e.deltaY);

    if (dy > dx) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      wheelAccum += e.deltaY;

      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        const threshold = 60;
        if (wheelAccum > threshold) page(1);
        else if (wheelAccum < -threshold) page(-1);
        wheelAccum = 0;
      }, 80);
    }
  }

  viewport.addEventListener("wheel", onWheel, { passive: false });

  function layoutFromHostWidth(hostWidth) {
    measureCell();

    const reserved = 2 * (cfg.arrowSize + cfg.arrowGap) + cfg.safety;
    const totalAvail = Math.max(0, hostWidth - reserved);
    const innerAvail = Math.max(0, totalAvail - 2 * cfg.edgePad);

    visibleCount = clampInt(Math.floor(innerAvail / cellPx), 1, 999);

    const innerExact = Math.round(visibleCount * cellPx - cfg.gap);
    const totalExact = Math.max(0, innerExact + 2 * cfg.edgePad);

    viewport.style.width = `${totalExact}px`;
    viewport.style.height = `${cfg.thumbH}px`;
    viewport.style.paddingLeft = `${cfg.edgePad}px`;
    viewport.style.paddingRight = `${cfg.edgePad}px`;
    viewport.style.boxSizing = "border-box";

    maxIndex = Math.max(0, items.length - visibleCount);
    index = clampInt(index, 0, maxIndex);
    applyIndex("none");
  }

  const host = mount.parentElement || mount;
  const ro = new ResizeObserver(() => {
    const r = host.getBoundingClientRect();
    layoutFromHostWidth(r.width);
  });
  ro.observe(host);

  requestAnimationFrame(() => {
    const r = host.getBoundingClientRect();
    layoutFromHostWidth(r.width);
  });

  function onClick(e) {
    const btn = e.target.closest(".thumb");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const idx = items.findIndex((it, i) => String(it?.id ?? i) === String(id));
    const item = idx >= 0 ? items[idx] : null;

    onClickThumb?.({ id, idx, item, event: e });
  }

  mount.addEventListener("click", onClick);

  return {
    destroy() {
      ro.disconnect();
      mount.removeEventListener("click", onClick);
      viewport.removeEventListener("wheel", onWheel);
      leftBtn?.removeEventListener("click", onArrowLeft);
      rightBtn?.removeEventListener("click", onArrowRight);
      mount.removeEventListener("thumbs:reset", onResetEvent);


      // ✅ only remove these if we added them
      if (captionMode === "hover") {
        mount.removeEventListener("pointermove", onPointerMove);
        mount.removeEventListener("pointerleave", onPointerLeave);
      }

      clearTimeout(wheelTimer);
      mount.innerHTML = "";
    },
  };
}
