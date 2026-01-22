import { state } from "./state.js";
import { THEME } from "./theme.js";
import { createAcasaThumbs } from "./acasaThumbs.js";
import { createAcasaTicker } from "./acasaTicker.js";

const LACURI = Array.from({ length: 5 }, (_, i) => {
  const id = `vidraru${i + 1}`;
  return {
    id,
    title: id,
    heroImg: `./assets/lacuri/${id}.jpg`,
    tickerUrl: `./assets/text/lacuri/${id}.txt`,
    thumbs: Array.from({ length: 9 }, (_, k) => ({
      id: `${id}-${k + 1}`,
      title: `${id} • ${k + 1}`,
      img: `./assets/lacuri/${id}/${k + 1}.jpg`,
    })),
  };
});

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
      if (state.lacuri?._token !== token) return finish();
      if (e.propertyName === "transform" || e.propertyName === "translate") finish();
    };
    el.addEventListener("transitionend", onEnd);
    setTimeout(finish, msFallback);
  });
}

export function createLacuriSection(stageMount, { onHome, onSubEnter, onSubThumbs } = {}) {
  if (!stageMount) throw new Error("lacuri-stage mount missing");

  let heroThumbsApi = null;
  let tickerApi = null;
  let curPanel = null;

  function setMode(mode) {
    if (!state.lacuri) state.lacuri = {};
    state.lacuri.mode = mode;
  }

  function findIndexById(id) {
    return Math.max(0, LACURI.findIndex((x) => x.id === id));
  }

  function buildHeroPanel() {
    const panel = document.createElement("div");
    panel.className = "lacuri-panel";
    panel.dataset.panel = "home";

    panel.innerHTML = `
     <div class="lacuri-hero acasa-thumbs" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;"></div>
    `;

    const heroMount = panel.querySelector(".lacuri-hero");
    const items = LACURI.map((x) => ({ id: x.id, title: x.title, img: x.heroImg }));

    // Big thumbs = reuse existing widget at bigger scale
heroThumbsApi = createAcasaThumbs(heroMount, items, {
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

  async function buildSubPanel(lake) {
    const panel = document.createElement("div");
    panel.className = "lacuri-panel";
    panel.dataset.panel = "sub";
    panel.dataset.sub = lake.id;

    panel.innerHTML = `
      <button class="lacuri-nav left" type="button" aria-label="Back">‹</button>
      <button class="lacuri-nav right" type="button" aria-label="Next">›</button>
      <div class="acasa-ticker lacuri-ticker"></div>
    `;

    panel.querySelector(".lacuri-nav.left")?.addEventListener("click", () => {
      goHome({ dir: "left" });
    });

    panel.querySelector(".lacuri-nav.right")?.addEventListener("click", () => {
      const idx = findIndexById(lake.id);
      const next = LACURI[(idx + 1) % LACURI.length];
      goSub(next.id, { dir: "right" });
    });

    const tickerMount = panel.querySelector(".lacuri-ticker");
    if (tickerMount) {
      // new ticker instance per sub change (simple and safe)
      tickerApi?.destroy?.();
      tickerApi = await createAcasaTicker(tickerMount, {
        url: lake.tickerUrl,
        fallbackText: lake.title,
      });
      // tint scrollbar etc. (same var your ticker uses)
      tickerMount.style.setProperty("--acasa-color", THEME["Lacuri"]?.hex || "#efac45");
    }

    return panel;
  }

  async function slideTo(nextPanel, { dir = "right" } = {}) {
    const token = ++state.lacuri._token;
    state.lacuri._isSubTransitioning = true;

    const sign = dir === "left" ? -1 : 1;

    // init next offscreen
    nextPanel.style.transform = `translateX(${sign * 110}%)`;
    nextPanel.style.opacity = "0";
    stageMount.appendChild(nextPanel);

    // force layout
    void nextPanel.offsetWidth;

    if (curPanel) {
      curPanel.style.transform = `translateX(${sign * -110}%)`;
      curPanel.style.opacity = "0";
    }

    nextPanel.style.transform = "translateX(0%)";
    nextPanel.style.opacity = "1";

    await waitTransitionEndOnce(nextPanel, token, 560);
    if (state.lacuri._token !== token) return;

    try { curPanel?.remove(); } catch {}
    curPanel = nextPanel;
    curPanel.style.transform = "";
    curPanel.style.opacity = "";

    state.lacuri._isSubTransitioning = false;
  }

  async function goHome({ dir = "left" } = {}) {
    if (state.activeLabel !== "Lacuri") return;
    setMode("home");
    state.lacuri.activeSubId = null;

    // bottom thumbs hidden on Lacuri home
    onHome?.();

    heroThumbsApi?.destroy?.();
    heroThumbsApi = null;

    const panel = buildHeroPanel();
    await slideTo(panel, { dir });
  }

  async function goSub(id, { dir = "right" } = {}) {
    if (state.activeLabel !== "Lacuri") return;
    const lake = LACURI.find((x) => x.id === id);
    if (!lake) return;

    setMode("sub");
    state.lacuri.activeSubId = id;

    onSubEnter?.(lake);       // tells outside to show bottom thumbs
    onSubThumbs?.(lake.thumbs);

    // destroy hero widget (it’s in the old panel)
    heroThumbsApi?.destroy?.();
    heroThumbsApi = null;

    const panel = await buildSubPanel(lake);
    await slideTo(panel, { dir });
  }

  function enter() {
    if (!state.lacuri) state.lacuri = { mode: "home", activeSubId: null, _token: 0, _isSubTransitioning: false };
    stageMount.innerHTML = "";
    curPanel = null;

    // default: home
    setMode("home");
    state.lacuri.activeSubId = null;

    const panel = buildHeroPanel();
    stageMount.appendChild(panel);
    curPanel = panel;

    // hide bottom thumbs on home
    onHome?.();
  }

  function leave() {
    state.lacuri?._token && (state.lacuri._token += 1);
    state.lacuri && (state.lacuri._isSubTransitioning = false);

    tickerApi?.destroy?.();
    tickerApi = null;

    heroThumbsApi?.destroy?.();
    heroThumbsApi = null;

    stageMount.innerHTML = "";
    curPanel = null;
  }

  return { enter, leave, goHome, goSub };
}
