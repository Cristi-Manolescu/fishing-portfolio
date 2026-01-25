// /js/sectionWithSubsections.js
import { state } from "./state.js";
import { createAcasaThumbs } from "./acasaThumbs.js";
import { createAcasaTicker } from "./acasaTicker.js";

function waitTransitionEndOnce(el, token, msFallback = 520) {
  return new Promise((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", onEnd);
      resolve();
    };

    const onEnd = (e) => {
      if (state.subsections?._token !== token) return finish();
      if (e.propertyName === "transform" || e.propertyName === "translate") finish();
    };

    el.addEventListener("transitionend", onEnd);
    setTimeout(finish, msFallback);
  });
}

/**
 * createSectionWithSubsections(stageMount, {
 *   sectionLabel,
 *   getItems: () => [{id,title,heroImg,tickerUrl,thumbs:[...]}...],
 *   accentHex,
 *   onHome: () => {},
 *   onSubEnter: (item) => {},
 *   onSubThumbs: (thumbs) => {},
 * })
 */
export function createSectionWithSubsections(stageMount, cfg = {}) {
  if (!stageMount) throw new Error("sectionWithSubsections: stage mount missing");

  const {
    sectionLabel = "",
    getItems,
    accentHex = "#ff6701",
    onHome,
    onSubEnter,
    onSubThumbs,
  } = cfg;

  let heroThumbsApi = null;
  let tickerApi = null;
  let curPanel = null;

  function items() {
    const arr = typeof getItems === "function" ? getItems() : [];
    return Array.isArray(arr) ? arr : [];
  }

  function findIndexById(id) {
    return Math.max(0, items().findIndex((x) => x.id === id));
  }

  function setMode(mode, activeId = null) {
    // generic
    if (!state.subsections) state.subsections = { active: null, hover: null, _isTransitioning: false, _token: 0 };
    state.subsections.active = activeId;

    // section-specific (Lacuri uses this for overlay)
    if (sectionLabel === "Lacuri") {
      if (!state.lacuri) state.lacuri = {};
      state.lacuri.mode = mode;
      state.lacuri.activeSubId = activeId;
    }
  }

  function buildHeroPanel() {
    const panel = document.createElement("div");
    panel.className = "lacuri-panel"; // keep your existing CSS class naming
    panel.dataset.panel = "home";

    panel.innerHTML = `
      <div class="lacuri-hero acasa-thumbs" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;"></div>
    `;

    const heroMount = panel.querySelector(".lacuri-hero");
    const heroItems = items().map((x) => ({ id: x.id, title: x.title, img: x.heroImg }));

    heroThumbsApi = createAcasaThumbs(heroMount, heroItems, {
      thumbW: 200,
      thumbH: 300,
      radius: 14,
      gap: 18,
      edgePad: 18,
      arrowSize: 42,
      arrowGap: 14,
      safety: 30,
      animMs: 320,
      onHover: null,
      onLeave: null,
      onClickThumb: ({ id }) => goSub(id, { dir: "right" }),
    });

    return panel;
  }

  async function buildSubPanel(entry) {
    const panel = document.createElement("div");
    panel.className = "lacuri-panel";
    panel.dataset.panel = "sub";
    panel.dataset.sub = entry.id;

    panel.innerHTML = `
      <button class="lacuri-nav left" type="button" aria-label="Back">‹</button>
      <button class="lacuri-nav right" type="button" aria-label="Next">›</button>
      <div class="acasa-ticker lacuri-ticker"></div>
    `;

    panel.querySelector(".lacuri-nav.left")?.addEventListener("click", () => {
      goHome({ dir: "left" });
    });

    panel.querySelector(".lacuri-nav.right")?.addEventListener("click", () => {
      const idx = findIndexById(entry.id);
      const arr = items();
      const next = arr[(idx + 1) % arr.length];
      goSub(next.id, { dir: "right" });
    });

    const tickerMount = panel.querySelector(".lacuri-ticker");
    if (tickerMount) {
      tickerApi?.destroy?.();
      tickerApi = await createAcasaTicker(tickerMount, {
        url: entry.tickerUrl,
        fallbackText: entry.title,
      });
      tickerMount.style.setProperty("--acasa-color", accentHex);
    }

    return panel;
  }

  async function slideTo(nextPanel, { dir = "right" } = {}) {
    const token = ++state.subsections._token;
    state.subsections._isTransitioning = true;

    const sign = dir === "left" ? -1 : 1;

    nextPanel.style.transform = `translateX(${sign * 110}%)`;
    nextPanel.style.opacity = "0";
    stageMount.appendChild(nextPanel);

    // force layout
    // eslint-disable-next-line no-unused-expressions
    nextPanel.offsetWidth;

    if (curPanel) {
      curPanel.style.transform = `translateX(${sign * -110}%)`;
      curPanel.style.opacity = "0";
    }

    nextPanel.style.transform = "translateX(0%)";
    nextPanel.style.opacity = "1";

    await waitTransitionEndOnce(nextPanel, token, 560);
    if (state.subsections._token !== token) return;

    try { curPanel?.remove(); } catch {}
    curPanel = nextPanel;

    curPanel.style.transform = "";
    curPanel.style.opacity = "";

    state.subsections._isTransitioning = false;
  }

  async function goHome({ dir = "left" } = {}) {
    if (state.activeLabel !== sectionLabel) return;

    setMode("home", null);
    onHome?.();

    heroThumbsApi?.destroy?.();
    heroThumbsApi = null;

    const panel = buildHeroPanel();
    await slideTo(panel, { dir });
  }

  async function goSub(id, { dir = "right" } = {}) {
    if (state.activeLabel !== sectionLabel) return;

    const entry = items().find((x) => x.id === id);
    if (!entry) return;

    setMode("sub", id);

    onSubEnter?.(entry);
    onSubThumbs?.(entry.thumbs);

    heroThumbsApi?.destroy?.();
    heroThumbsApi = null;

    const panel = await buildSubPanel(entry);
    await slideTo(panel, { dir });
  }

  function enter() {
    if (!state.subsections) state.subsections = { active: null, hover: null, _isTransitioning: false, _token: 0 };
    stageMount.innerHTML = "";
    curPanel = null;

    setMode("home", null);
    onHome?.();

    const panel = buildHeroPanel();
    stageMount.appendChild(panel);
    curPanel = panel;
  }

  function leave() {
    state.subsections._token += 1;
    state.subsections._isTransitioning = false;

    tickerApi?.destroy?.();
    tickerApi = null;

    heroThumbsApi?.destroy?.();
    heroThumbsApi = null;

    stageMount.innerHTML = "";
    curPanel = null;

    // clear section-specific overlay hint
    if (sectionLabel === "Lacuri" && state.lacuri) {
      state.lacuri.mode = "home";
      state.lacuri.activeSubId = null;
    }
  }

  return { enter, leave, goHome, goSub };
}
