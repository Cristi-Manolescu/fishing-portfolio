/**
 * ============================================================
 * ACASA TICKER — CONTENT LOADER
 * ============================================================
 *
 * Purpose:
 *  - Load long-form text from external files
 *  - Display it inside the middle holder overlay
 *
 * Design Rules:
 *  - NO background
 *  - NO border
 *  - NO glow
 *  - Only scrollbar is visible and themed
 *
 * Content Rules:
 *  - Text should live in external files when possible
 *  - This enables:
 *      • future articles
 *      • easy CMS-like updates
 *      • localization
 *
 * SAFE TO EDIT
 * ------------
 *  - Text file paths
 *  - Typography via CSS
 *
 * DO NOT CHANGE WITHOUT CARE
 * --------------------------
 *  - overflow behavior
 *  - destroy() cleanup
 */

export async function createAcasaTicker(mountEl, opts = {}) {
  if (!mountEl) throw new Error("createAcasaTicker: mountEl missing");

  const url = opts.url ?? "./assets/text/acasa.txt";
  const fallbackText = opts.fallbackText ?? "Lorem ipsum...";

  mountEl.innerHTML = "";
  mountEl.setAttribute("aria-label", "Acasa scrolling text");

  // Load external text
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = await res.text();
    mountEl.textContent = txt.trim() || fallbackText;
  } catch (e) {
    // If the file path is wrong, you still see content
    mountEl.textContent = fallbackText;
  }

  return {
    setColor: (hex) => mountEl.style.setProperty("--acasa-color", hex),
    destroy: () => { mountEl.innerHTML = ""; }
  };
}
