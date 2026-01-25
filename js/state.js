// /js/state.js
export const state = {
  hoverLabel: null,
  activeLabel: "Acasa",
  DEFAULT_MAIN_TOP_VIEWPORT: null,
  GRID_COMPRESSED: false,

  overlay: null,

  lastThumbClick: null,
  _isTransitioning: false,

  // Generic subsection engine state (used by sectionWithSubsections.js)
  subsections: {
    active: null,           // active subsection id (e.g. "vidraru1")
    hover: null,
    _isTransitioning: false,
    _token: 0,
  },

  // Back-compat / specific Lacuri state (still used by overlay logic)
  lacuri: {
    activeSub: "lista",
    hoverSub: null,
    _isSubTransitioning: false,
    _token: 0,

    // NEW: used by overlay resolver when in Lacuri sub
    mode: "home",           // "home" | "sub"
    activeSubId: null,
  },
};
