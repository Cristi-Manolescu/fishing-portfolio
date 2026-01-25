// /js/panelTicker.js
async function fetchText(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`fetchText failed: ${r.status}`);
  return (await r.text()).trim();
}

export async function createPanelTicker(mountEl, {
  url = "",
  fallbackText = "",
} = {}) {
  if (!mountEl) throw new Error("createPanelTicker: mountEl missing");

  mountEl.innerHTML = `
    <div class="pt-root">
      <div class="pt-scroll" tabindex="0">
        <div class="pt-text"></div>
      </div>
    </div>
  `;

  const textEl = mountEl.querySelector(".pt-text");

  function setText(str) {
    const s = (str || fallbackText || "").trim();
    // keep paragraphs / line breaks if your .txt has them
    textEl.textContent = s;
  }

  try {
    if (url) setText(await fetchText(url));
    else setText(fallbackText);
  } catch {
    setText(fallbackText);
  }

  return {
    setText,
    destroy() {
      mountEl.innerHTML = "";
    },
  };
}
