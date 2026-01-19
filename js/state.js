export const state = {
  hoverLabel: null,
  activeLabel: "Acasa",
  DEFAULT_MAIN_TOP_VIEWPORT: null,
  GRID_COMPRESSED: false,

  // NEW: overlay state for Photo System / Photo reveal
  overlay: null, // null | { type:"photo", sectionLabel, thumbId }

  // optional debug
  lastThumbClick: null,

  // already used in interactions.js, nice to declare explicitly
  _isTransitioning: false,
};
