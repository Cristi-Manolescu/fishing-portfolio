// /js/galerieSection.js
import { createAcasaThumbs } from "./acasaThumbs.js";
import { resolveGalerieHeroVideos } from "./content.js";

export function createGalerieSection(stageEl, { onOpenVideo } = {}) {
  let bigApi = null;
  let wrapBig = null;
  let isActive = false;

  function enter() {
    if (isActive) return;
    isActive = true;

    stageEl.innerHTML = "";

    wrapBig = document.createElement("div");
    wrapBig.className = "acasa-thumbs galerie-hero";
    stageEl.appendChild(wrapBig);

    const HERO_ITEMS = resolveGalerieHeroVideos();

    bigApi = createAcasaThumbs(wrapBig, HERO_ITEMS, {
      thumbW: 200,
      thumbH: 300,
      gap: 28,
      radius: 14,
      onHover: null,
      onLeave: null,
      onClickThumb: ({ item }) => {
        if (!item?.youtubeId) return;
        onOpenVideo?.({ youtubeId: item.youtubeId });
      },
    });
  }

  function leave() {
    if (!isActive) return;
    isActive = false;

    bigApi?.destroy?.();
    bigApi = null;

    wrapBig?.remove();
    wrapBig = null;

    stageEl.innerHTML = "";
  }

  return { enter, leave };
}
