// /js/sectionWithSubsubsections.js
import { state } from "./state.js";
import { createAcasaThumbs } from "./acasaThumbs.js";
import { createAcasaTicker } from "./acasaTicker.js";
import { installNoScrollWhenFits } from "./thumbNoScrollGuard.js";
import { createPanelTicker } from "./panelTicker.js";

/* -------------------------
   Shared helpers (module)
-------------------------- */

function normLabel(s) {
  return String(s || "").trim().toLowerCase();
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function getAcasaTickerWidthPx() {
  const ref = document.getElementById("acasa-ticker");
  if (!ref) return 0;
  const r = ref.getBoundingClientRect();
  return Math.round(r.width);
}

function syncRailWidthFromAcasaTicker() {
  const w = getAcasaTickerWidthPx();
  if (!w) return;
  document.documentElement.style.setProperty("--mid-rail-w", `${w}px`);
}

function unlockWidth(el) {
  if (!el) return;
  el.style.removeProperty("width");
  el.style.removeProperty("min-width");
  el.style.removeProperty("max-width");
}

/**
 * Force the thumbs viewport to show ONLY whole thumbs (no partial).
 * Quantizes viewport width to 1..maxThumbs based on available rail width.
 */
function installWholeThumbViewport(
  mount,
  { maxThumbs = 3, thumbW = 200, gap = 18, edgePad = 18 } = {}
) {
  if (!mount) return () => {};

  const viewport = mount.querySelector(".thumb-viewport");
  if (!viewport) return () => {};

  const apply = () => {
    const host = mount.closest(".mid-panel-inner") || mount.parentElement || mount;
    const avail = Math.round(host.getBoundingClientRect().width);

    // needed(n) = 2*edgePad + n*thumbW + (n-1)*gap
    const nFit = Math.floor((avail - 2 * edgePad + gap) / (thumbW + gap));
    const n = clamp(nFit, 1, maxThumbs);

    const targetW = 2 * edgePad + n * thumbW + (n - 1) * gap;
    const w = Math.min(targetW, avail);

    viewport.style.width = `${w}px`;
    viewport.style.maxWidth = `${w}px`;
  };

  apply();
  requestAnimationFrame(apply);

  const ro = new ResizeObserver(apply);
  const host = mount.closest(".mid-panel-inner") || mount.parentElement || mount;
  ro.observe(host);
  ro.observe(viewport);

  return () => ro.disconnect();
}

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

function setNavIcon(btn, kind) {
  if (!btn) return;

  const svg = (paths) => `
    <svg class="nav-ico" viewBox="0 0 24 24" aria-hidden="true">
      ${paths}
    </svg>
  `;

  if (kind === "left") {
    btn.innerHTML = svg(
      `<path d="M14.5 6.5 L9 12 L14.5 17.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  if (kind === "right") {
    btn.innerHTML = svg(
      `<path d="M9.5 6.5 L15 12 L9.5 17.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  if (kind === "up") {
    btn.innerHTML = svg(
      `<path d="M6.5 14.5 L12 9 L17.5 14.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  if (kind === "right-double") {
    btn.innerHTML = svg(`
      <path d="M6.8 6.5 L12.3 12 L6.8 17.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M11.7 6.5 L17.2 12 L11.7 17.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    `);
  }
}

/**
 * createSectionWithSubsubsections(stageMount, {
 *   sectionLabel,
 *   getGroups: () => [{id,title,heroImg, subs:[{id,title,heroImg,tickerUrl,thumbs:[...]}]}],
 *   accentHex,
 *   onHome: () => {},
 *   onGroupEnter: (group) => {},
 *   onSubsubEnter: (sub) => {},
 *   onSubsubThumbs: (thumbs) => {},
 * })
 */
export function createSectionWithSubsubsections(stageMount, cfg = {}) {
  if (!stageMount) throw new Error("sectionWithSubsubsections: stage mount missing");

  const {
    sectionLabel = "",
    getGroups,
    accentHex = "#ff6701",
    onHome,
    onGroupEnter,
    onSubsubEnter,
    onSubsubThumbs,

  // ✅ NEW (optional)
  autoEnterSingleGroup = false,
  showGroupBackUp = true,
  showSubsubNext = true,
  } = cfg;

  let thumbsApi = null;
  let tickerApi = null;
  let curPanel = null;

  // per-instance cleanup hooks
  let killWholeThumbs = null;
  let killNoScrollGuard = null;

  // local state
  let activeGroupId = null;
  let activeSubId = null;

  function groups() {
    const arr = typeof getGroups === "function" ? getGroups() : [];
    return Array.isArray(arr) ? arr : [];
  }

  function findGroup(id) {
    return groups().find((g) => g.id === id) || null;
  }

  function findSub(group, subId) {
    return group?.subs?.find((s) => s.id === subId) || null;
  }

  function ensureSubState() {
    if (!state.subsections) state.subsections = { active: null, hover: null, _isTransitioning: false, _token: 0 };
  }

  function setMode(mode) {
    ensureSubState();

    state.subsections.active = mode;

    // optional breadcrumbs for Partide
    if (sectionLabel === "Partide") {
      if (!state.partide) state.partide = {};
      state.partide.mode = mode; // "home" | "group" | "subsub"
      state.partide.groupId = activeGroupId;
      state.partide.subId = activeSubId;
    }
  }

  function destroyThumbs() {
    killNoScrollGuard?.();
    killNoScrollGuard = null;

    killWholeThumbs?.();
    killWholeThumbs = null;

    thumbsApi?.destroy?.();
    thumbsApi = null;
  }

  function destroyTicker() {
    tickerApi?.destroy?.();
    tickerApi = null;
  }

  async function slideTo(nextPanel, { dir = "right" } = {}) {
    ensureSubState();

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

  /* -----------------------
     Panels
  ------------------------ */

  function buildHomePanel() {
    const panel = document.createElement("div");
    panel.className = "lacuri-panel";
    panel.dataset.panel = "home";

    panel.innerHTML = `
      <div class="mid-panel-inner">
        <div class="acasa-thumbs partide-hero"></div>
      </div>
    `;

    const mount = panel.querySelector(".partide-hero");

    const heroItems = groups().map((g) => ({ id: g.id, title: g.title, img: g.heroImg }));

    thumbsApi = createAcasaThumbs(mount, heroItems, {
      thumbW: 200, thumbH: 300, radius: 14, gap: 18, edgePad: 18,
      arrowSize: 42, arrowGap: 14, safety: 30, animMs: 320,

      // big thumbs: inline caption visible on the thumb
      captionMode: "inline",
      onHover: null,
      onLeave: null,

      onClickThumb: ({ id }) => goGroup(id, { dir: "right" }),
    });

    killWholeThumbs = installWholeThumbViewport(mount, {
      maxThumbs: 3, thumbW: 200, gap: 18, edgePad: 18,
    });

    killNoScrollGuard = installNoScrollWhenFits(mount);

    return panel;
  }

  function buildGroupPanel(group) {
    const panel = document.createElement("div");
    panel.className = "lacuri-panel";
    panel.dataset.panel = "group";
    panel.dataset.group = group.id;

    panel.innerHTML = `
      <div class="mid-panel-inner">
        <div class="acasa-thumbs partide-hero"></div>
      </div>
    `;

    const mount = panel.querySelector(".partide-hero");

    const subItems = (group.subs || []).map((s) => ({ id: s.id, title: s.title, img: s.heroImg }));

    thumbsApi = createAcasaThumbs(mount, subItems, {
      thumbW: 200, thumbH: 300, radius: 14, gap: 18, edgePad: 18,
      arrowSize: 42, arrowGap: 14, safety: 30, animMs: 320,

      captionMode: "inline",
      onHover: null,
      onLeave: null,

      // IMPORTANT: group → subsub
      onClickThumb: ({ id }) => goSubsub(group.id, id, { dir: "right" }),
    });

    killWholeThumbs = installWholeThumbViewport(mount, {
      maxThumbs: 3, thumbW: 200, gap: 18, edgePad: 18,
    });

    killNoScrollGuard = installNoScrollWhenFits(mount);

    // Inject back button above the left arrow
       // Inject back button above the left arrow (Partide UX)
    if (showGroupBackUp) {
      requestAnimationFrame(() => {
        const leftArrow = mount.querySelector(".thumb-arrow.left");
        if (!leftArrow) return;
        if (mount.querySelector(".thumb-arrow.back-up")) return;

        mount.style.position = mount.style.position || "relative";

        const back = document.createElement("button");
        back.type = "button";
        back.className = "thumb-arrow back-up";
        back.setAttribute("aria-label", "Back");
        back.textContent = "‹";

        back.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          goHome({ dir: "left" });
        });

        const parent = leftArrow.parentElement;
        parent.insertBefore(back, leftArrow);

        const cs = window.getComputedStyle(leftArrow);

        back.style.position = cs.position;
        back.style.left = cs.left;
        back.style.right = cs.right;
        back.style.top = cs.top;
        back.style.bottom = cs.bottom;

        const NUDGE_X = 0;
        const NUDGE_Y = -50;

        back.style.transform =
          cs.transform && cs.transform !== "none"
            ? `${cs.transform} translate(${NUDGE_X}px, ${NUDGE_Y}px) rotate(90deg)`
            : `translate(${NUDGE_X}px, ${NUDGE_Y}px) rotate(90deg)`;

        back.style.zIndex = String((parseInt(cs.zIndex, 10) || 5) + 1);
      });
    }
    return panel;
  }

  async function buildSubsubPanel(group, sub) {
    const panel = document.createElement("div");
    panel.className = "lacuri-panel";
    panel.dataset.panel = "subsub";
    panel.dataset.group = group.id;
    panel.dataset.sub = sub.id;

panel.innerHTML = `
  <div class="mid-panel-inner">
    <button class="lacuri-nav left" type="button" aria-label="Back">‹</button>
    ${showSubsubNext ? `<button class="lacuri-nav right" type="button" aria-label="Next">›</button>` : ""}
    <div class="acasa-ticker partide-ticker"></div>
  </div>
`;

const btnLeft = panel.querySelector(".lacuri-nav.left");
setNavIcon(btnLeft, "up");

btnLeft?.addEventListener("click", () => {
  goGroup(group.id, { dir: "left" });
});

const btnRight = panel.querySelector(".lacuri-nav.right");
if (btnRight && showSubsubNext) {
  setNavIcon(btnRight, "right-double");
  btnRight.addEventListener("click", () => {
    const arr = group.subs || [];
    const idx = Math.max(0, arr.findIndex((x) => x.id === sub.id));
    const next = arr[(idx + 1) % arr.length];
    goSubsub(group.id, next.id, { dir: "right" });
  });
}

    const tickerMount = panel.querySelector(".partide-ticker");
    if (tickerMount) {
      destroyTicker();

      // keep rail width in sync with Acasa at the moment we enter subsub
      syncRailWidthFromAcasaTicker();

tickerApi = await createPanelTicker(tickerMount, {
  url: sub.tickerUrl,
  fallbackText: sub.title,
  speedPxPerSec: 55,
});

      tickerMount.style.setProperty("--acasa-color", accentHex);

      // IMPORTANT: ensure panel ticker is rail/CSS-driven (not hard-locked)
      unlockWidth(tickerMount);
      unlockWidth(tickerMount.firstElementChild);
      requestAnimationFrame(() => {
        unlockWidth(tickerMount);
        unlockWidth(tickerMount.firstElementChild);
      });
    }

    return panel;
  }

  /* -----------------------
     Navigation
  ------------------------ */

  async function goHome({ dir = "left" } = {}) {
    if (normLabel(state.activeLabel) !== normLabel(sectionLabel)) return;

    activeGroupId = null;
    activeSubId = null;

    setMode("home");
    onHome?.();

    destroyThumbs();
    destroyTicker();

    const panel = buildHomePanel();
    await slideTo(panel, { dir });
  }

  async function goGroup(groupId, { dir = "right" } = {}) {
    if (normLabel(state.activeLabel) !== normLabel(sectionLabel)) return;

    const group = findGroup(groupId);
    if (!group) return;

    activeGroupId = group.id;
    activeSubId = null;

    setMode("group");
    onGroupEnter?.(group);

    destroyThumbs();
    destroyTicker();

    const panel = buildGroupPanel(group);
    await slideTo(panel, { dir });
  }

  async function goSubsub(groupId, subId, { dir = "right" } = {}) {
    if (normLabel(state.activeLabel) !== normLabel(sectionLabel)) return;

    const group = findGroup(groupId);
    const sub = findSub(group, subId);
    if (!group || !sub) return;

    activeGroupId = group.id;
    activeSubId = sub.id;

    setMode("subsub");
    onSubsubEnter?.(sub);

    // bottom thumbs become the partida thumbs
    onSubsubThumbs?.(sub.thumbs || []);

    destroyThumbs();
    destroyTicker();

    const panel = await buildSubsubPanel(group, sub);
    await slideTo(panel, { dir });
  }

  function enter() {
    ensureSubState();

    stageMount.innerHTML = "";
    curPanel = null;

    activeGroupId = null;
    activeSubId = null;

    setMode("home");
    onHome?.();

    destroyThumbs();
    destroyTicker();

    // establish rail width from Acasa ticker
    syncRailWidthFromAcasaTicker();

const panel = buildHomePanel();
stageMount.appendChild(panel);
curPanel = panel;

// auto-enter group for 2-level UX
if (autoEnterSingleGroup) {
  const gs = groups();
  if (gs.length === 1) {
    requestAnimationFrame(() => goGroup(gs[0].id, { dir: "right" }));
  }
}

  }

  function leave() {
    ensureSubState();
    state.subsections._token += 1;
    state.subsections._isTransitioning = false;

    destroyThumbs();
    destroyTicker();

    stageMount.innerHTML = "";
    curPanel = null;

    if (sectionLabel === "Partide" && state.partide) {
      state.partide.mode = "home";
      state.partide.groupId = null;
      state.partide.subId = null;
    }
  }

  return { enter, leave, goHome, goGroup, goSubsub };
}
