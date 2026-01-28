// /js/acasaSearch.js
import { searchArticles } from "./content.js";
import { navigate } from "./router.js";

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function ensureHostAboveThumbs() {
  // Always mount in BODY (never inside SVG)
  let overlay = document.body.querySelector(".bottom-ui-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "bottom-ui-overlay";
    document.body.appendChild(overlay);
  }

  let host = overlay.querySelector("#acasa-search");
  if (!host) {
    host = document.createElement("div");
    host.id = "acasa-search";
    overlay.appendChild(host);
  }

  return host;
}


function render(host) {
host.innerHTML = `
  <div class="acasa-searchbar" role="search">
    <div class="acasa-searchbar__row">
      <div class="acasa-searchbar__field">
        <input
          id="acasa-search-input"
          class="acasa-searchbar__input"
          type="search"
          inputmode="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="Caută…"
          aria-label="Caută articol"
        />
      </div>
    </div>
    <div class="acasa-searchbar__meta" aria-live="polite"></div>
  </div>
`;

return {
  input: host.querySelector("#acasa-search-input"),
  meta: host.querySelector(".acasa-searchbar__meta"),
};
}


function targetToNavigateArg(t) {
  // Your navigate() accepts objects like {type:"despre", subId:"..."}
  if (!t?.type) return { type: "acasa" };

  if (t.type === "despre") return t.subId ? { type: "despre", subId: t.subId } : { type: "despre" };
  if (t.type === "partide") return t.subId ? { type: "partide", subId: t.subId } : { type: "partide" };
  if (t.type === "galerie") return { type: "galerie" };
  if (t.type === "contact") return { type: "contact" };
  if (t.type === "acasa") return { type: "acasa" };

  return { type: "acasa" };
}

export function createAcasaSearch({
  thumbsMount,
  showThumbs,      // (items, labelForClicks) => void
  restoreLatest,   // () => void
} = {}) {
  if (!thumbsMount) throw new Error("createAcasaSearch: thumbsMount missing");
  if (typeof showThumbs !== "function") throw new Error("createAcasaSearch: showThumbs missing");
  if (typeof restoreLatest !== "function") throw new Error("createAcasaSearch: restoreLatest missing");

  const host = ensureHostAboveThumbs(thumbsMount);

  // ✅ Choose the real "bottom holder" element as positioning reference.
// Pick the most stable element you have. Start with the actual SVG if that’s the holder.
const bottomRef =
  document.getElementById("bottom-svg") ||
  document.getElementById("bottom-holder") ||
  document.querySelector("#bottom-stage") ||
  document.getElementById("acasa-thumbs")?.closest("svg") ||
  document.getElementById("acasa-thumbs")?.parentElement;

let rafId = 0;
let settleUntil = 0;

function syncToBottomTopLeft() {
  if (!bottomRef) return;

  const r = bottomRef.getBoundingClientRect();
  const x = Math.round(r.left + window.scrollX + 60);
  const y = Math.round(r.top + window.scrollY + 12.5);

  host.style.left = `${x}px`;
  host.style.top = `${y}px`;
}

function cancelLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

function settleLoop() {
  syncToBottomTopLeft();

  // keep following for a short window while layout is “settling”
  if (performance.now() < settleUntil) {
    rafId = requestAnimationFrame(settleLoop);
  } else {
    cancelLoop();
  }
}

function startSettle(ms = 220) {
  settleUntil = performance.now() + ms;
  if (!rafId) rafId = requestAnimationFrame(settleLoop);
}


// Initial placement + settle for the first paint
startSettle(300);

// On resize: follow for a bit (your layout changes across frames)
const onResize = () => startSettle(350);

// On scroll: update immediately (scroll doesn't “settle” like resize)
const onScroll = () => syncToBottomTopLeft();

window.addEventListener("resize", onResize, { passive: true });
window.addEventListener("scroll", onScroll, { passive: true });


  if (!host) return { destroy() {} };

const ui = render(host);

if (!ui.input) {
  console.warn("AcasaSearch: missing input in render()");
  return { destroy() { host.remove(); } };
}

let destroyed = false;

  let results = [];
  let active = -1;

  function setMeta(text) {
    ui.meta.textContent = text || "";
  }

  function applyHighlight() {
    // best-effort highlight: depends on thumb markup
    const links = thumbsMount.querySelectorAll("a,button,.thumb-item");
    links.forEach((el) => el.classList.remove("is-search-active"));
    if (active < 0) return;
    const el = links[active];
    if (el) el.classList.add("is-search-active");
  }

  function toThumbItems(articleResults) {
    // Match your BOTTOM_THUMBS item shape:
    // { id, title, img, target }
    return articleResults.map((a) => ({
      id: a.id,
      title: a.title,
      img: a.img,       // .avif only
      target: a.target, // {type, subId?}
    }));
  }

  const run = debounce(() => {
    if (destroyed) return;

    const q = ui.input.value.trim();
    if (!q) {
      results = [];
      active = -1;
      setMeta("");
      restoreLatest();
      return;
    }

    results = searchArticles(q, { limit: 18 });
    active = results.length ? 0 : -1;

    if (!results.length) {
      setMeta("Niciun rezultat.");
      restoreLatest();
      return;
    }

    setMeta(`${results.length} rezultat${results.length === 1 ? "" : "e"}.`);
    // labelForClicks MUST be "Acasa" so your click handler deep-links
    showThumbs(toThumbItems(results), "Acasa");
    requestAnimationFrame(applyHighlight);
  }, 90);

  function clear({ focus = true } = {}) {
    ui.input.value = "";
    results = [];
    active = -1;
    setMeta("");
    restoreLatest();
    if (focus) ui.input.focus();
  }

  function openActive() {
    if (!results.length) return;
    const idx = active >= 0 ? active : 0;
    const a = results[idx];
    if (!a) return;

    navigate(targetToNavigateArg(a.target));
    clear({ focus: false });
  }

  function onKeyDown(e) {
    const k = e.key;

    if (k === "Escape") {
      e.preventDefault();
      clear({ focus: true });
      return;
    }

    if (k === "Enter") {
      if (results.length === 1 || active >= 0) {
        e.preventDefault();
        openActive();
      }
      return;
    }

    // optional highlight navigation
    if (k === "ArrowRight" || k === "ArrowDown") {
      if (!results.length) return;
      e.preventDefault();
      active = (active + 1) % results.length;
      applyHighlight();
      return;
    }
    if (k === "ArrowLeft" || k === "ArrowUp") {
      if (!results.length) return;
      e.preventDefault();
      active = (active - 1 + results.length) % results.length;
      applyHighlight();
      return;
    }
  }

  ui.input.addEventListener("input", run);
  ui.input.addEventListener("keydown", onKeyDown);

  setMeta("");

return {
  focus() {
    ui.input?.focus();
  },
  destroy() {
    destroyed = true;
    ui.input?.removeEventListener("input", run);
    ui.input?.removeEventListener("search", run);
    ui.input?.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    cancelLoop();
    host.remove();
  },
};
}
