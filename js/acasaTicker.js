// /js/acasaTicker.js
// Scroll container stays stable (#acasa-ticker). We only replace inner content.
// DO NOT force pointer-events inline (layout/CSS controls interactivity per section).

export async function createAcasaTicker(mountEl, opts = {}) {
  if (!mountEl) throw new Error("createAcasaTicker: mountEl missing");

  const url = opts.url ?? "./assets/text/acasa.txt";
  const fallbackText = opts.fallbackText ?? "Lorem ipsum...";

  // Keep mount as the scroll container; replace only inner content
  mountEl.innerHTML = `<div class="ticker-inner"></div>`;
  mountEl.setAttribute("aria-label", "Acasa scrolling text");

  const inner = mountEl.querySelector(".ticker-inner");

  let text = fallbackText;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = await res.text();
    text = (txt || "").trim() || fallbackText;
  } catch {
    text = fallbackText;
  }

  if (inner) inner.textContent = text;
  else mountEl.textContent = text; // fallback safety

  // Ensure scroll is enabled + "wake up" after content changes
  mountEl.style.overflowY = "auto";
  mountEl.scrollTop = 0;
  // eslint-disable-next-line no-unused-expressions
  mountEl.offsetHeight;

  return {
    setColor(hex) {
      mountEl.style.setProperty("--acasa-color", hex);
    },
    destroy() {
      // Fully reset to a non-scrollable inert container
      mountEl.scrollTop = 0;
      mountEl.style.overflowY = "";
      mountEl.innerHTML = "";
      mountEl.removeAttribute("aria-label");
    },
  };
}
