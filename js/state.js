// /js/state.js
export const state = {
  hoverLabel: null,
  activeLabel: "Acasa",

  DEFAULT_MAIN_TOP_VIEWPORT: null,
  GRID_COMPRESSED: false,

  overlay: null,

  lastThumbClick: null,
  _isTransitioning: false,

  // Generic subsection engine state
  subsections: {
    active: null,           // "home" | "group" | "subsub"
    hover: null,
    _isTransitioning: false,
    _token: 0,
  },

  // Section-specific states
  despre: {
    mode: "home",           // "home" | "sub"
    subId: null,
  },

  partide: {
    mode: "home",           // "home" | "group" | "subsub"
    groupId: null,
    subId: null,
  },
};
