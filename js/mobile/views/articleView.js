// /js/mobile/views/articleView.js
// Generic Article overlay view (uses #m-root as the ONLY scroller)
// - Renders generic markup: #m-article + .m-article__*
// - Handles back navigation + one-shot return flag
// - Loads text blocks by URL (force-cache)
// - Keeps parallax hook: .m-parallax-media img

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

/**
 * @param {Object} opts
 * @param {string} opts.mountId
 * @param {HTMLElement} opts.scroller
 * @param {Function} opts.navigate
 * @param {Object} opts.header
 * @param {string} opts.header.backLabel    Button label (e.g. "Despre", "Partide")
 * @param {string} opts.header.title        Article title (already resolved)
 * @param {Object} opts.header.backTarget   navigate() target for back
 * @param {string} [opts.header.returnKey]  sessionStorage key (optional)
 * @param {string} [opts.header.returnValue] sessionStorage value (optional)
 * @param {Array}  opts.blocks
 *   - { type:"image", src, caption?, parallax? }
 *   - { type:"text", url }
 */
export async function articleView({
  mountId = "m-root",
  scroller,
  navigate,
  header,
  blocks,
} = {}) {
  const root = document.getElementById(mountId);
  if (!root) throw new Error("articleView: missing mount");

// ✅ Temporarily remove global scroller padding so hero can start at true top:0
  const prevPadTop = scroller?.style?.paddingTop || "";
  try { scroller.style.paddingTop = "0px"; } catch (_) {}


  const backLabel = String(header?.backLabel || "Back");
  const title = String(header?.title || "");
  const backTarget = header?.backTarget || { type: "acasa" };
  const returnKey = header?.returnKey ? String(header.returnKey) : "";
  const returnValue = header?.returnValue ? String(header.returnValue) : "";

  const safeBlocks = Array.isArray(blocks) ? blocks : [];

  // Preload all text blocks
  const textByUrl = new Map();
  for (const b of safeBlocks) {
    if (b?.type === "text" && b.url) {
      textByUrl.set(b.url, await fetchText(b.url, "..."));
    }
  }

  // --- Extract hero (full-screen background) ---
  let heroSrc = "";
  let heroIndex = -1;

  for (let i = 0; i < safeBlocks.length; i++) {
    const b = safeBlocks[i];
    if (!b) continue;

    if (b.type === "hero" && b.src) {
      heroSrc = String(b.src);
      heroIndex = i;
      break;
    }

    if (b.type === "image" && b.isHero && b.src) {
      heroSrc = String(b.src);
      heroIndex = i;
      break;
    }
  }

  

  const renderBlocks = safeBlocks.filter((_, i) => i !== heroIndex);

  root.innerHTML = `
    <section id="m-article" class="m-article">

      <div class="m-bar m-bar--article" data-accent style="--bar-accent: ${esc(header?.accent || "rgba(255,255,255,0.00)")}">
        <div class="m-bar__inner">
          <button class="m-bar__back m-article__back" type="button">${esc(backLabel)}</button>
          <div class="m-bar__title">${esc(title)}</div>
        </div>
      </div>

      ${heroSrc ? `
        <div class="m-article__hero" style="background-image:url('${esc(heroSrc)}')"></div>
      ` : ""}

      <main class="m-article__body">
        ${renderBlocks
          .map((b) => {
            if (!b || !b.type) return "";

            if (b.type === "image") {
              const cap = b.caption ? `<div class="m-article__cap">${esc(b.caption)}</div>` : "";
              const par = b.parallax ? " data-parallax='1' " : "";
              return `
                <figure class="m-article__block m-article__img"${par}>
                  <div class="m-article__media m-parallax-media">
                    <img src="${esc(b.src)}" alt="" loading="lazy" decoding="async" />
                  </div>
                  ${cap}
                </figure>
              `;
            }

            if (b.type === "text") {
              const t = textByUrl.get(b.url) || "";
              return `
                <section class="m-article__block m-article__text">
                  <p>${esc(t)}</p>
                </section>
              `;
            }

            if (b.type === "next") {
              const bg = b.src ? `style="background-image:url('${esc(b.src)}')"` : "";
              const label = b.label ? esc(b.label) : "Următorul articol";
              return `
                <button class="m-article__block m-article__next" type="button" ${bg} data-next="1">
                  <span class="m-article__nextLabel">${label}</span>
                </button>
              `;
            }

            return "";
          })
          .join("")}
      </main>
    </section>
  `;


  const els = {
    section: root.querySelector("#m-article"),
    back: root.querySelector(".m-article__back"),
  };

  const onClick = (e) => {
    const nextBtn = e.target.closest("[data-next='1']");
    if (nextBtn) {
      const t = nextBtn.getAttribute("data-target");
      if (t) {
        try { navigate?.(JSON.parse(t)); } catch (_) {}
      }
      return;
    }

    if (e.target.closest(".m-article__back")) {
      if (returnKey) {
        try { sessionStorage.setItem(returnKey, returnValue || "1"); } catch (_) {}
      }
      navigate?.(backTarget);
    }
  };

  els.section?.addEventListener("click", onClick);

// ✅ Ensure top BEFORE wiring observers
try { scroller.scrollTop = 0; } catch (_) {}

let cleanupReveal = null;
let cleanupParallax = null;

// ✅ Install observers next frame so layout/scroll settles
await new Promise((r) => requestAnimationFrame(r));

// Reveal text blocks as you scroll (enter once)
const { installArticleTextReveal } = await import("../lib/articleTextReveal.js");
cleanupReveal = installArticleTextReveal({
  scroller,
  rootEl: els.section,
});

// Parallax for article content images
const { installParallax } = await import("../lib/parallax.js");
cleanupParallax = installParallax({
  rootEl: els.section,
  scroller,
  imgSelector: ".m-parallax-media img",
});

 return {
    els,
    api: {},
    destroy() {
      els.section?.removeEventListener("click", onClick);
      cleanupReveal?.();
      cleanupParallax?.();
      try { scroller.style.paddingTop = prevPadTop; } catch (_) {}
      root.innerHTML = "";
    }, 
  };
}
