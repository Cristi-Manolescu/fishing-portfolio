// /js/thumbNoScrollGuard.js
export function installNoScrollWhenFits(mount) {
  if (!mount) return () => {};

  const viewport = mount.querySelector(".thumb-viewport");
  const rail = mount.querySelector(".thumb-rail");
  if (!viewport || !rail) return () => {};

  const leftArrow = mount.querySelector(".thumb-arrow.left");
  const rightArrow = mount.querySelector(".thumb-arrow.right");

  const EPS = 2;

  // Persist across apply() calls
  let lastFits = null;

  const setArrow = (btn, off) => {
    if (!btn) return;
    btn.classList.toggle("is-hidden", off);
    btn.classList.toggle("is-disabled", off);
    btn.tabIndex = off ? -1 : 0;
    btn.setAttribute("aria-disabled", off ? "true" : "false");
  };

  const apply = () => {
    const fits = rail.scrollWidth <= viewport.clientWidth + EPS;

    // Lock/unlock scrolling behavior
    if (fits) {
      viewport.style.overflowX = "hidden";
      viewport.scrollLeft = 0;
      viewport.dataset.noscroll = "1";
    } else {
      viewport.style.overflowX = "";
      delete viewport.dataset.noscroll;
    }

    // Hide/disable arrows when everything fits
    setArrow(leftArrow, fits);
    setArrow(rightArrow, fits);

    // ✅ If we JUST transitioned into "fits", reset paging transform in acasaThumbs.js
    if (fits && lastFits === false) {
      mount.dispatchEvent(new CustomEvent("thumbs:reset", { bubbles: true }));
    }

    lastFits = fits;
  };

  // ---- block interaction when it fits ----
  const onWheel = (e) => {
    if (viewport.dataset.noscroll === "1") {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
  };

  const onPointerDown = (e) => {
    if (viewport.dataset.noscroll === "1") {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
  };

  viewport.addEventListener("wheel", onWheel, { passive: false });
  viewport.addEventListener("pointerdown", onPointerDown, { passive: false });

  // ---- IMPORTANT: resize re-check even if RO doesn't fire ----
  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      apply();
      // second pass catches late layout (fonts / scrollbar / DOM updates)
      requestAnimationFrame(apply);
    });
  };

  // 1) Initial passes
  apply();
  schedule();

  // 2) ResizeObserver
  const ro = new ResizeObserver(schedule);
  ro.observe(viewport);
  ro.observe(rail);

  // 3) Window resize (covers fixed-width viewport cases)
  window.addEventListener("resize", schedule, { passive: true });

  // 4) Thumb images finishing load can change scrollWidth
  const onImgLoad = (e) => {
    const t = e.target;
    if (t && t.tagName === "IMG") schedule();
  };
  mount.addEventListener("load", onImgLoad, true);

  // 5) Re-check when rail children change (subsection swaps etc.)
  const mo = new MutationObserver(schedule);
  mo.observe(rail, { childList: true, subtree: true });

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    mo.disconnect();
    window.removeEventListener("resize", schedule);
    mount.removeEventListener("load", onImgLoad, true);
    viewport.removeEventListener("wheel", onWheel);
    viewport.removeEventListener("pointerdown", onPointerDown);
  };
}
