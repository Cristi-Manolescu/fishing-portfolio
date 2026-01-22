export const state = {
  hoverLabel: null,
  activeLabel: "Acasa",
  DEFAULT_MAIN_TOP_VIEWPORT: null,
  GRID_COMPRESSED: false,

  overlay: null,

  lastThumbClick: null,
  _isTransitioning: false,

  // NEW: Lacuri nested nav
  lacuri: {
    activeSub: "lista",     // default subsection when entering Lacuri
    hoverSub: null,         // optional: for subnav hover styling
    _isSubTransitioning: false,
    _token: 0,              // cancels stale transitions
  },
};
