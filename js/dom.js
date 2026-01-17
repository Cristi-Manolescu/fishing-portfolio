export function getDom() {
  return {
    wrapper: document.getElementById("wrapper"),

    // middle svg
    svg: document.getElementById("main-svg"),
    gFill: document.getElementById("fill-layer"),
    gGlow: document.getElementById("glow-layer"),
    gFillMask: document.getElementById("fill-mask-shapes"),
    gBtns: document.getElementById("buttons-layer"),

    // bottom svg
    bottomSvg: document.getElementById("bottom-svg"),
    gBottomFill: document.getElementById("b-fill-layer"),
    gBottomGlow: document.getElementById("b-glow-layer"),
    gBottomFillMask: document.getElementById("b-fill-mask-shapes"),

 // logo svg
logoSvg: document.getElementById("logo-svg"),
gLogoFill: document.getElementById("l-fill-layer"),
gLogoGlow: document.getElementById("l-glow-layer"),
gLogoFillMask: document.getElementById("l-fill-mask-shapes"),
gLogoLayer: document.getElementById("l-logo-layer"),

midContent: document.getElementById("mid-content"),

  };
}
