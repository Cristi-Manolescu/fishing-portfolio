// /js/mobile/lib/ticker.js
function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildTickerWordsHTML(text, {
  fallback = "Fire întinse și lectură plăcută!",
  stepMs = 55,
  lineIndex = 0,
} = {}) {
  const raw = String(text || "").trim();
  const lines = raw.split("\n").map((s) => s.trim()).filter(Boolean);
  const firstLine = lines[lineIndex] || lines[0] || fallback;

  const words = firstLine.split(/\s+/).filter(Boolean);

  return words
    .map((w, i) => {
      const safe = escHtml(w);
      const delay = i * stepMs;
      return `<span class="m-word" style="animation-delay:${delay}ms">${safe}</span>`;
    })
    .join(" ");
}

export function setTickerHTML(lineEl, html) {
  if (!lineEl) return;
  lineEl.innerHTML = html || "";
}
