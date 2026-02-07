// ./js/mobile/sections/partide.js
import { getScroller } from "../lib/scroller.js";
import { installSnapAssist, installViewportStabilizer } from "../lib/scrolling.js";
import { resolveBgByLabel, BG_ORDER, resolvePartideLakeById } from "../../content.js";
import { createBackgroundManager } from "../../backgrounds.js";
import { setMobileHeaderState } from "../mobileHeader.js";

import { THEME } from "../../theme.js"; // ✅ add this

import { onRouteChange, parseHash } from "../../router.js";

import { mobilePartideHome } from "../mobilePartideHome.js";
import { mobilePartideLake } from "../mobilePartideLake.js";
import { mobilePartideArticleView } from "../mobilePartideArticle.js";

function hardResetScroller(scroller) {
  if (!scroller) return;

  try { delete scroller.dataset.dragLock; } catch (_) {}
  try { scroller.dataset.dragLock = ""; } catch (_) {}

  try { scroller.style.overflowY = ""; } catch (_) {}
  try { scroller.style.overflow = ""; } catch (_) {}

  try { scroller.style.touchAction = ""; } catch (_) {}
}

export async function startMobilePartide({ navigate } = {}) {
  const scroller = getScroller("#m-root");

  const partideStyle = THEME?.["Partide"] || THEME?._normal || { hex: "#8e8e8e" };

  const _prevPadTop = scroller?.style?.paddingTop || "";
  const _prevPadBottom = scroller?.style?.paddingBottom || "";
  try {
    scroller.style.paddingTop = "0px";
    scroller.style.paddingBottom = "0px";
  } catch (_) {}

  let stopRoute = null;
  let rendered = null;
  let cleanup = null;

  let bgMgr = null;
  let bgLabelsSet = false;
  let defaultPartideBgUrl = null;

  function ensureBgMgr() {
    const bgEl = document.getElementById("bg");
    if (!bgEl) return null;

    if (!bgMgr) bgMgr = createBackgroundManager(bgEl, { order: BG_ORDER });

    if (!bgLabelsSet) {
      const BG_BY_LABEL = resolveBgByLabel();
      bgMgr.set(BG_BY_LABEL);
      bgLabelsSet = true;
      defaultPartideBgUrl = BG_BY_LABEL?.["Partide"] || null;
    }

    return bgMgr;
  }

  function goToPartide({ immediate = true } = {}) {
    const bg = ensureBgMgr();
    if (!bg) return;
    bg.goTo("Partide", { immediate });
  }

  function restorePartideBg() {
    const bg = ensureBgMgr();
    if (!bg) return;

    if (defaultPartideBgUrl) bg.set(defaultPartideBgUrl, { label: "Partide" });
    goToPartide({ immediate: true });
  }

  function setPartideBgToLakeHero(lakeHeroUrl) {
    const bg = ensureBgMgr();
    if (!bg) return;

    if (lakeHeroUrl) bg.set(lakeHeroUrl, { label: "Partide" });
    goToPartide({ immediate: true });
  }

  function destroyActive() {
    try { cleanup?.(); } catch (_) {}
    cleanup = null;

    try { rendered?.destroy?.(); } catch (_) {}
    rendered = null;
  }

  function getLakeHero(groupId) {
    if (!groupId) return null;
    const lake = resolvePartideLakeById(groupId);
    return lake?.heroImg || null;
  }

  function getLakeTitle(groupId) {
    const lake = resolvePartideLakeById(groupId);
    return lake?.title || "Partide";
  }

  async function renderFeed(route) {
    destroyActive();
    hardResetScroller(scroller);

    if (scroller.scrollTop !== 0) scroller.scrollTop = 0;

    rendered = await mobilePartideHome({
      mountId: "m-root",
      navigate,
      scroller,
    });

    // ✅ Home: title=Partide, no back, Partide theme
    setMobileHeaderState({
      accent: partideStyle.hex,
      barFilter: partideStyle.barFilter, // ✅ new field (wired in step 2)
      showBack: false,
      showTitle: true,
      title: "Partide",
      showGallery: false,
      galleryOpen: false,
    });

    restorePartideBg();

    const vs = installViewportStabilizer({
      scroller,
      panelSelector: "#m-partide .m-panel",
      settleMs: 260,
    });

    const cleanupSnap = installSnapAssist({
      scroller,
      panelSelector: "#m-partide .m-panel",
      freeScrollEl: rendered?.els?.feedPanel || null,
      shouldSkip: () => vs.isResizing() || scroller.dataset.dragLock === "1",
      settleMs: 140,
      durationMs: 520,
    });

    cleanup = () => {
      cleanupSnap?.();
      vs?.destroy?.();
    };
  }

  async function renderLake(route) {
    destroyActive();
    hardResetScroller(scroller);

    if (scroller.scrollTop !== 0) scroller.scrollTop = 0;

    rendered = await mobilePartideLake({
      mountId: "m-root",
      scroller,
      navigate,
      groupId: route.groupId,
    });

    const lakeTitle = getLakeTitle(route.groupId);

    // ✅ Group: title=Lake name, backLabel=Partide, backTarget=home
    setMobileHeaderState({
      accent: partideStyle.hex,
      barFilter: partideStyle.barFilter,
      showBack: true,
      backLabel: "Partide",
      backTarget: { type: "partide" },
      showTitle: true,
      title: lakeTitle,
      showGallery: false,
      galleryOpen: false,
    });

    setPartideBgToLakeHero(getLakeHero(route.groupId));

    const vs = installViewportStabilizer({
      scroller,
      panelSelector: "#m-partide .m-panel",
      settleMs: 260,
    });

    const cleanupSnap = installSnapAssist({
      scroller,
      panelSelector: "#m-partide .m-panel",
      freeScrollEl: rendered?.els?.feedPanel || null,
      shouldSkip: () => vs.isResizing() || scroller.dataset.dragLock === "1",
      settleMs: 140,
      durationMs: 520,
    });

    cleanup = () => {
      cleanupSnap?.();
      vs?.destroy?.();
    };
  }

  async function renderArticle(route) {
    destroyActive();
    hardResetScroller(scroller);

    if (scroller.scrollTop !== 0) scroller.scrollTop = 0;

    rendered = await mobilePartideArticleView({
      mountId: "m-root",
      scroller,
      navigate,
      groupId: route.groupId,
      subId: route.subId,
    });

    const lakeTitle = getLakeTitle(route.groupId);

    // ✅ Article: title=sub title is already set inside articlePanelView header.title
    // We only ensure the bar keeps Partide theme + correct back label here by re-calling state.
    // (Safe even if articlePanelView also sets header state.)
    setMobileHeaderState({
      accent: partideStyle.hex,
      barFilter: partideStyle.barFilter,
      showBack: true,
      backLabel: lakeTitle,
      backTarget: { type: "partide", groupId: route.groupId },
      showTitle: true,
      // keep whatever articlePanelView sets as title, or set a fallback:
      title: rendered?.els ? "" : lakeTitle,
      showGallery: true,
      galleryOpen: false,
    });

    setPartideBgToLakeHero(getLakeHero(route.groupId));
  }

  async function applyRoute(route) {
    if (!route || route.type !== "partide") return;

    if (route.groupId && route.subId) {
      await renderArticle(route);
      return;
    }

    if (route.groupId) {
      await renderLake(route);
      return;
    }

    await renderFeed(route);
  }

  stopRoute = onRouteChange((r) => {
    if (r?.type !== "partide") return;
    applyRoute(r);
  });

  await applyRoute(parseHash(window.location.hash));

  return () => {
    try { stopRoute?.(); } catch (_) {}
    destroyActive();

    try { scroller.style.paddingTop = _prevPadTop; } catch (_) {}
    try { scroller.style.paddingBottom = _prevPadBottom; } catch (_) {}
    hardResetScroller(scroller);
  };
}
