// /js/mobile/views/articlePanelView.js
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

export async function articlePanelView({
  mountId = "m-root",
  scroller,
  navigate,
  header,
  textUrl,
  images = [],
} = {}) {
  const root = document.getElementById(mountId);
  if (!root) throw new Error("articlePanelView: missing mount");
  if (!scroller) throw new Error("articlePanelView: missing scroller");

  // lock root scroll (Article is one-screen)
  const prevOverflowY = scroller.style.overflowY || "";
  const prevScrollTop = scroller.scrollTop || 0;
  try {
    scroller.scrollTop = 0;
    scroller.style.overflowY = "hidden";
  } catch (_) {}

  const backLabel = String(header?.backLabel || "Back");
  const title = String(header?.title || "");
  const backTarget = header?.backTarget || { type: "acasa" };
  const accent = String(header?.accent || "rgba(255,255,255,0)");

  const returnKey = header?.returnKey ? String(header.returnKey) : "";
  const returnValue = header?.returnValue ? String(header.returnValue) : "";

    // ✅ Detach article overlay from scroller padding contract (critical)
  const prevPadTop = scroller?.style?.paddingTop || "";
  const prevPadBottom = scroller?.style?.paddingBottom || "";
  try {
    scroller.style.paddingTop = "0px";
    scroller.style.paddingBottom = "0px";
  } catch (_) {}


  const text = await fetchText(textUrl, "...");

  root.innerHTML = `
    <section id="m-articlePanel" class="m-articlePanel" data-open="0">

      <div class="m-bar m-bar--articlePanel" data-accent style="--bar-accent: ${esc(accent)}">
        <div class="m-bar__inner m-bar__inner--3">
          <button class="m-bar__back m-articlePanel__back" type="button">${esc(backLabel)}</button>
          <div class="m-bar__title">${esc(title)}</div>

          <!-- same visual style as Back -->
          <button class="m-bar__back m-articlePanel__toggle" type="button" aria-label="Foto">
            <span class="m-articlePanel__toggleFoto">Foto</span>
            <span class="m-articlePanel__toggleX" aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      <!-- Content area BELOW the bar (no overlap) -->
      <div class="m-articlePanel__content">

        <div class="m-articlePanel__textPane">
          <div class="m-articlePanel__textGlass">
            <div class="m-articlePanel__textScroll">
              <p>${esc(text)}</p>
            </div>
          </div>
        </div>

        <aside class="m-articlePanel__galleryPane" aria-hidden="true">
          <div class="m-articlePanel__galleryGlass">
            <div class="m-articlePanel__galleryScroll">
              ${(Array.isArray(images) ? images : []).map((src) => `
                <figure class="m-articlePanel__img">
                  <img src="${esc(src)}" alt="" loading="lazy" decoding="async" />
                </figure>
              `).join("")}
            </div>
          </div>
        </aside>

      </div>

    </section>
  `;

  const els = {
    section: root.querySelector("#m-articlePanel"),
    barInner: root.querySelector("#m-articlePanel .m-bar__inner"),
    back: root.querySelector(".m-articlePanel__back"),
    toggle: root.querySelector(".m-articlePanel__toggle"),
    galleryPane: root.querySelector(".m-articlePanel__galleryPane"),
    textScroll: root.querySelector(".m-articlePanel__textScroll"),
  };

  const barEl = els.section?.querySelector(".m-bar");

  const syncBarMetrics = () => {
    if (!barEl) return;

    const r = barEl.getBoundingClientRect();

    const bottom = Math.round(r.bottom);
    const h = Math.round(r.height);

    if (h > 0) document.body.style.setProperty("--m-bar-h", `${h}px`);

    // ✅ content must start at the BOTTOM edge of the bar
    if (bottom > 0) document.body.style.setProperty("--m-article-top", `${bottom}px`);
  };

  // run a few times to survive late layout/anchors
  syncBarMetrics();
  requestAnimationFrame(syncBarMetrics);
  setTimeout(syncBarMetrics, 60);
  setTimeout(syncBarMetrics, 220);

  window.addEventListener("resize", syncBarMetrics);
  window.addEventListener("orientationchange", syncBarMetrics);


  // initial state: text scroll enabled
  if (els.textScroll) els.textScroll.style.overflowY = "auto";

  let open = false;

  const setOpen = (on) => {
    open = !!on;

    // ✅ state on the SECTION so CSS can toggle Foto/X reliably
    els.section?.setAttribute("data-open", open ? "1" : "0");

    if (els.galleryPane) els.galleryPane.setAttribute("aria-hidden", open ? "false" : "true");

    // lock text scrolling while gallery open
    if (els.textScroll) {
      els.textScroll.style.overflowY = open ? "hidden" : "auto";
    }
  };

  const onClick = (e) => {
    if (e.target.closest(".m-articlePanel__toggle")) {
      setOpen(!open);
      return;
    }

    if (e.target.closest(".m-articlePanel__back")) {
      setOpen(false);
      if (returnKey) {
        try { sessionStorage.setItem(returnKey, returnValue || "1"); } catch (_) {}
      }
      navigate?.(backTarget);
    }
  };

  els.section?.addEventListener("click", onClick);

  return {
    els,
    api: { setOpen },
    destroy() {
      els.section?.removeEventListener("click", onClick);

        window.removeEventListener("resize", syncBarMetrics);
        window.removeEventListener("orientationchange", syncBarMetrics);
        document.body.style.removeProperty("--m-article-top");



      try { scroller.style.paddingTop = prevPadTop; } catch (_) {}
      try { scroller.style.paddingBottom = prevPadBottom; } catch (_) {}


      // cleanup bar height var only if you want; safe to keep too
      // document.body.style.removeProperty("--m-bar-h");

      root.innerHTML = "";

      try { scroller.style.overflowY = prevOverflowY; } catch (_) {}
      try { scroller.scrollTop = prevScrollTop; } catch (_) {}
    },
  };
}
