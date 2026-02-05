// /js/mobile/views/articlePanelView.js
import { setMobileHeaderState } from "../mobileHeader.js";

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

  // ✅ Tell unified header to enter “article mode”
  setMobileHeaderState({
    accent,
    showBack: true,
    backLabel,
    backTarget,
    showTitle: true,
    title,
    showGallery: true,
    galleryOpen: false,
  });

  const text = await fetchText(textUrl, "...");

  root.innerHTML = `
    <section id="m-articlePanel" class="m-articlePanel" data-open="0">

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
    galleryPane: root.querySelector(".m-articlePanel__galleryPane"),
    textScroll: root.querySelector(".m-articlePanel__textScroll"),
  };

  let open = false;

  const setOpen = (on) => {
    open = !!on;
    els.section?.setAttribute("data-open", open ? "1" : "0");

    if (els.galleryPane) els.galleryPane.setAttribute("aria-hidden", open ? "false" : "true");

    // lock text scrolling while gallery open
    if (els.textScroll) els.textScroll.style.overflowY = open ? "hidden" : "auto";

    // sync header Foto/X
    setMobileHeaderState({ galleryOpen: open });
  };

  // initial
  if (els.textScroll) els.textScroll.style.overflowY = "auto";

  // ✅ Header → Article communication (gallery toggle)
  const onToggle = (e) => {
    const want = !!e?.detail?.open;
    setOpen(want);
  };

  // ✅ Back is handled by header itself via navigate(backTarget),
  // but we must write return memory BEFORE route changes.
  const onHashChange = () => {
    // If we are leaving article route, store return marker once
    if (returnKey) {
      try { sessionStorage.setItem(returnKey, returnValue || "1"); } catch (_) {}
    }
    window.removeEventListener("hashchange", onHashChange);
  };

  window.addEventListener("m:gallery-toggle", onToggle);
  window.addEventListener("hashchange", onHashChange);

  return {
    els,
    api: { setOpen },
    destroy() {
      window.removeEventListener("m:gallery-toggle", onToggle);
      window.removeEventListener("hashchange", onHashChange);

      root.innerHTML = "";

      // Restore scroll
      try { scroller.style.overflowY = prevOverflowY; } catch (_) {}
      try { scroller.scrollTop = prevScrollTop; } catch (_) {}
    },
  };
}
