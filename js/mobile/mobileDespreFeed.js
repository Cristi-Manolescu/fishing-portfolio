// /js/mobile/mobileDespreFeed.js
import * as Content from "../content.js?v=despreFeedOnly-v3";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

export async function mobileDespreFeed({ mountId, navigate } = {}) {
  const root = document.getElementById(mountId);
  if (!root) throw new Error("mobileDespreFeed: missing mount");

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

      <div class="m-panel m-despre__s1" data-panel="despre-1"></div>

      <div class="m-panel m-despre__s2" data-panel="despre-2">
        <div class="m-despre__s2bar" aria-hidden="true"></div>
        <div class="m-despre__s2bg" aria-hidden="true"></div>

        <div class="m-despre__glassInner">
          <div class="m-despre__ticker">
            <p class="m-despre__tL">${esc(tLeft)}</p>
            <p class="m-despre__tR">${esc(tRight)}</p>
          </div>
        </div>

        <div class="m-despre__s2sep" aria-hidden="true"></div>
      </div>

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
                      const subId = t?.target?.subId ?? "";
                      return `
                        <button class="m-despre__thumb" type="button"
                          data-col="${col}"
                          data-subid="${esc(subId)}">

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

      <div class="m-panel m-despre__s4" data-panel="despre-4">
        <div class="m-despre__contactStub">
          <h2 class="m-despre__contactTitle">Contact</h2>
        </div>
      </div>

    </section>
  `;

  const els = {
    section: root.querySelector("#m-despre"),
    screen1: root.querySelector(".m-despre__s1"),
    screen2: root.querySelector(".m-despre__s2"),
    screen3: root.querySelector(".m-despre__s3"),
    screen4: root.querySelector(".m-despre__s4"),
  };

  const onClick = (e) => {
    const btn = e.target.closest("[data-subid]");
    if (!btn) return;

    const subId = btn.getAttribute("data-subid");
    if (!subId) return;

    navigate?.({ type: "despre", subId, articleId: subId });
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
