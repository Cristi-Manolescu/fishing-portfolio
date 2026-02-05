// /js/mobile/mobileDespreArticle.js
import * as Content from "../content.js?v=despreArticlePanel-v3";
import { articlePanelView } from "./views/articlePanelView.js";
import { setMobileHeaderState } from "./mobileHeader.js";

/**
 * Despre Article (panel system)
 * - Uses unified global header (m-header) via setMobileHeaderState()
 * - Keeps URL refresh-safe: #/despre/:subId/:articleId
 * - Keeps return-to-thumb memory
 */
export async function mobileDespreArticleView({
  mountId = "m-root",
  scroller,
  navigate,
  subId,
  articleId,
} = {}) {
  const data = Content.resolveDespreArticlePanelData?.({ subId, articleId });

  if (!data) {
    navigate?.({ type: "despre" });
    return { els: {}, api: {}, destroy() {} };
  }

  // --- Mount view first (so we can bind to its API / DOM) ---
  const rendered = await articlePanelView({
    mountId,
    scroller,
    navigate,
    header: {
      backLabel: "Despre",
      title: data.title,
      backTarget: { type: "despre" },
      accent: "var(--despre-accent)",

      // ✅ navigation memory (return to the thumb that launched it)
      returnKey: "m_despre_return_sub",
      returnValue: String(subId || ""),
    },
    textUrl: data.textUrl,
    images: data.images,
  });

  // --- Helpers (VERY defensive; avoids regressions if internals change) ---
  const api = rendered?.api || {};
  const els = rendered?.els || {};

  const goBack = () => {
    // keep memory behavior handled by articlePanelView (if it does it)
    // but if not, we set it here too (safe + idempotent)
    try { sessionStorage.setItem("m_despre_return_sub", String(subId || "")); } catch (_) {}
    navigate?.({ type: "despre" });
  };

  const findLocalGalleryToggle = () => {
    // common selectors if the panel view has its own toggle button
    return (
      els.galleryBtn ||
      els.galleryToggle ||
      els.section?.querySelector?.("[data-gallery-toggle]") ||
      els.section?.querySelector?.(".m-article__galleryBtn") ||
      els.section?.querySelector?.(".m-gallery__toggle") ||
      null
    );
  };

  const setHeader = (isGalleryOpen) => {
    // We send a “rich” state object. Extra props are harmless if your
    // setMobileHeaderState ignores them.
    setMobileHeaderState?.({
      // context / tint
      sectionLabel: "Despre mine",
      accent: "var(--despre-accent)",

      // left side
      showBack: true,
      backLabel: "Despre",
      title: String(data.title || "Despre"),

      // right side
      showGallery: true,
      galleryLabel: isGalleryOpen ? "X" : "Foto",

      // handlers
      onBack: goBack,
      onGallery: () => {
        // Prefer API toggle if available, else click local toggle
        if (typeof api.toggleGallery === "function") {
          api.toggleGallery();
          return;
        }
        const btn = findLocalGalleryToggle();
        btn?.click?.();
      },
    });
  };

  // Initial header state
  setHeader(false);

  // --- Keep header label in sync with gallery open/close ---
  // Preferred: use explicit API hooks if your articlePanelView provides them.
  let unbind = null;

  if (typeof api.onGalleryChange === "function") {
    // Expected signature: api.onGalleryChange((open:boolean)=>{}) => unsubscribe
    try {
      unbind = api.onGalleryChange((open) => setHeader(!!open));
    } catch (_) {}
  } else if (typeof api.onGalleryOpen === "function" || typeof api.onGalleryClose === "function") {
    // If your API exposes these events, we wrap them.
    const prevOpen = api.onGalleryOpen;
    const prevClose = api.onGalleryClose;

    api.onGalleryOpen = (...args) => {
      try { prevOpen?.(...args); } catch (_) {}
      setHeader(true);
    };
    api.onGalleryClose = (...args) => {
      try { prevClose?.(...args); } catch (_) {}
      setHeader(false);
    };
  } else {
    // Fallback: observe attribute/class changes on the article root
    // (if your panel toggles something like .is-gallery-open)
    const host = els.section || document.getElementById(mountId);
    if (host && "MutationObserver" in window) {
      const mo = new MutationObserver(() => {
        const open =
          host.classList?.contains("is-gallery-open") ||
          host.querySelector?.(".is-gallery-open") ||
          false;
        setHeader(!!open);
      });
      try {
        mo.observe(host, { attributes: true, subtree: true, attributeFilter: ["class"] });
        unbind = () => { try { mo.disconnect(); } catch (_) {} };
      } catch (_) {}
    }
  }

  return {
    ...rendered,
    destroy() {
      try { unbind?.(); } catch (_) {}
      // Reset header to section-level state (no back/gallery) after leaving article
      try {
        setMobileHeaderState?.({
          sectionLabel: "Despre mine",
          accent: "var(--despre-accent)",
          showBack: false,
          title: "Despre mine",
          showGallery: false,
        });
      } catch (_) {}
      try { rendered?.destroy?.(); } catch (_) {}
    },
  };
}
