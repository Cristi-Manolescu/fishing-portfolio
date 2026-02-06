// /js/mobile/mobileDespreFeed.js
import * as Content from "../content.js?v=despreFeedOnly-v3";

const RESTORE_KEY = "m:despre:feedRestore"; // sessionStorage JSON

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

function getScroller() {
  return document.getElementById("m-root") || document.scrollingElement || document.documentElement;
}

function saveRestoreState({ lastSubId } = {}) {
  try {
    const scroller = getScroller();
    const scrollTop = scroller?.scrollTop ?? 0;
    const payload = {
      v: 1,
      ts: Date.now(),
      scrollTop: Math.max(0, Math.round(scrollTop)),
      lastSubId: String(lastSubId || ""),
      // one-shot restore marker (we clear after applying)
      pending: true,
    };
    sessionStorage.setItem(RESTORE_KEY, JSON.stringify(payload));
  } catch {}
}

function readRestoreState() {
  try {
    const raw = sessionStorage.getItem(RESTORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

function clearPendingRestore() {
  try {
    const data = readRestoreState();
    if (!data) return;
    data.pending = false;
    sessionStorage.setItem(RESTORE_KEY, JSON.stringify(data));
  } catch {}
}

function applyRestoreState({ root } = {}) {
  const data = readRestoreState();
  if (!data || !data.pending) return;

  const scroller = getScroller();

  // 1) Restore scroll position
  try {
    scroller.scrollTop = Number(data.scrollTop || 0);
  } catch {}

  // 2) Nudge the last thumb into view + highlight (best-effort)
  const lastSubId = String(data.lastSubId || "");
  if (lastSubId) {
    const btn = root?.querySelector?.(`.m-despre__thumb[data-subid="${CSS.escape(lastSubId)}"]`);
    if (btn) {
      // If it’s not in view, gently bring it in
      try {
        btn.scrollIntoView({ block: "center", inline: "nearest" });
      } catch {}

      // Quick highlight pulse (CSS-free: inline class)
      btn.classList.add("is-last");
      setTimeout(() => btn.classList.remove("is-last"), 650);
    }
  }

  // One-shot: don’t keep jumping on future visits
  clearPendingRestore();
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
  const heroS2 = Content.resolveDespreFeedHeroImg?.() || "";


  root.innerHTML = `
    <section id="m-despre" class="m-despre">

      <div class="m-panel m-despre__s1" data-panel="despre-1">
        <div class="m-down" aria-hidden="true">↓</div>
      </div>


      <div class="m-panel m-despre__s2" data-panel="despre-2">
       <div class="m-despre__s2hero" aria-hidden="true"
            style="background-image:url('${esc(heroS2)}')"></div>

       <div class="m-despre__tickerOverlay" aria-hidden="false">
        <div class="m-despre__ticker">
         <p class="m-despre__tL">${esc(tLeft)}</p>
         <p class="m-despre__tR">${esc(tRight)}</p>
       </div>
      </div>

      <div class="m-down" aria-hidden="true">↓</div>
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

  // ✅ Apply restore AFTER DOM is in place
  // Use rAF so layout is ready before scrollIntoView, etc.
  requestAnimationFrame(() => applyRestoreState({ root }));

  const onClick = (e) => {
    const btn = e.target.closest("[data-subid]");
    if (!btn) return;

    const subId = btn.getAttribute("data-subid");
    if (!subId) return;

    // ✅ Save restore state BEFORE navigating away
    saveRestoreState({ lastSubId: subId });

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
