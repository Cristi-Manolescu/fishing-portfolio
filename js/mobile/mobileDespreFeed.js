// ./js/mobile/mobileDespreFeed.js
import * as Content from "../content.js?v=despreTickerParts-v1";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wordsToSpans(text) {
  const parts = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  return parts
    .map((w, i) => `<span class="m-despre__w" style="--w:${i}">${esc(w)}</span>`)
    .join(" ");
}

async function fetchText(url, fallbackText = "") {
  if (!url) return String(fallbackText || "");
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.text()).trim();
  } catch {
    return String(fallbackText || "");
  }
}

function chunkRows(items, size = 2) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function mobileDespreFeed({ mountId, navigate, scroller } = {}) {
  const root = document.getElementById(mountId);
  if (!root) throw new Error("mobileDespreFeed: missing mount");

  const title = "Despre mine";

  const cards = Content.resolveDespreHeroCards?.() || [];
  const thumbs = cards;

  const parts = Content.resolveDespreTickerParts?.() || {
    left: { url: null, fallbackText: "..." },
    right: { url: null, fallbackText: "..." },
  };

  const tLeft = await fetchText(parts.left?.url, parts.left?.fallbackText);
  const tRight = await fetchText(parts.right?.url, parts.right?.fallbackText);

  root.innerHTML = `
    <section id="m-despre" class="m-despre">

      <!-- Global fixed bar for the whole section (10px under logo) -->
      <div class="m-bar m-bar--despre" data-accent style="--bar-accent: var(--despre-accent)">
        <div class="m-bar__inner">
          <div></div>
          <div class="m-bar__title">Despre mine</div>
        </div>
      </div>

      <!-- Screen 1 (clean: NO legacy strip/title) -->
      <div class="m-panel m-despre__s1" data-panel="despre-1"></div>

      <!-- Screen 2 -->
      <div class="m-panel m-despre__s2" data-panel="despre-2">

        <!-- Local (non-fixed) top bar: anchored to screen container (top:0) -->
        <div class="m-despre__s2bar" aria-hidden="true"></div>

        <!-- Screen 2 background = Screen 4 recipe -->
        <div class="m-despre__s2bg" aria-hidden="true"></div>

        <div class="m-despre__glassInner">
          <div class="m-despre__ticker">
            <p class="m-despre__tL">${esc(tLeft)}</p>
            <p class="m-despre__tR">${esc(tRight)}</p>
          </div>
        </div>

        <!-- Local bottom separator: 5px -->
        <div class="m-despre__s2sep" aria-hidden="true"></div>
      </div>

      <!-- Screen 3 -->
      <div class="m-panel m-despre__s3" data-panel="despre-3">
        <div class="m-despre__hero">
          ${chunkRows(thumbs, 2)
            .map((rowItems, rowIndex) => {
              const mod = rowIndex % 4;
              return `
                <div class="m-despre__row" data-row="${rowIndex}" data-mod="${mod}">
                  ${rowItems
                    .map((t, colIndex) => {
                      const col = colIndex === 0 ? "l" : "r";
                      return `
                        <button class="m-despre__thumb" type="button"
                          data-col="${col}"
                          data-subid="${esc(t.target?.subId)}">

                          <span class="m-despre__thumbImg" style="background-image:url('${esc(t.img)}')">
                            <span class="m-despre__thumbCap">${esc(t.title)}</span>
                          </span>

                        </button>
                      `;
                    })
                    .join("")}
                </div>
              `;
            })
            .join("")}
        </div>
      </div>

      <!-- Screen 4 -->
      <div class="m-panel m-despre__s4" data-panel="despre-4">
        <div class="m-despre__end">
          <p class="m-despre__endText">Vrei să vorbim?</p>
          <button class="m-despre__goContact" type="button">Mergi la Contact</button>
        </div>
      </div>

    </section>
  `;

const els = {
  section: root.querySelector("#m-despre"),
  bar: root.querySelector(".m-bar"),
  screen1: root.querySelector(".m-despre__s1"),
  screen2: root.querySelector(".m-despre__s2"),
  screen3: root.querySelector(".m-despre__s3"),
  screen4: root.querySelector(".m-despre__s4"),
  goContact: root.querySelector(".m-despre__goContact"),
};


  const onClick = (e) => {
    const btn = e.target.closest("[data-subid]");
    if (btn) {
      const subId = btn.getAttribute("data-subid");
      navigate?.({ type: "despre", subId, articleId: subId });
      return;
    }
    if (e.target.closest(".m-despre__goContact")) {
      navigate?.({ type: "contact" });
      return;
    }
  };

  els.section?.addEventListener("click", onClick);

  const api = {
  onScreen3Enter() {
    els.screen3?.classList.add("is-ready");
    els.section?.classList.add("is-intro");
  },
  onScreen3Exit() {},
};

  return {
    els,
    api,
    destroy() {
      els.section?.removeEventListener("click", onClick);
      root.innerHTML = "";
    },
  };
}
