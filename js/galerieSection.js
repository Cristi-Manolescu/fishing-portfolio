// /js/galerieSection.js
import { createAcasaThumbs } from "./acasaThumbs.js";

export function createGalerieSection(
  stageEl,
  { onOpenVideo, onHoverTitle, onLeaveTitle } = {}
) {
  let bigApi = null;
  let wrapBig = null;
  let isActive = false;

  const HERO_ITEMS = [
    { id: "vid-1", title: "Video 1", img: "./assets/galerie/hero/1.jpg", youtubeId: "AAA" },
    { id: "vid-2", title: "Video 2", img: "./assets/galerie/hero/2.jpg", youtubeId: "BBB" },
    { id: "vid-3", title: "Video 3", img: "./assets/galerie/hero/3.jpg", youtubeId: "CCC" },
  ];

  function enter() {
    if (isActive) return;
    isActive = true;

    stageEl.innerHTML = "";

    // HERO / big thumbs (middle holder)
    wrapBig = document.createElement("div");
    wrapBig.className = "acasa-thumbs galerie-hero";
    stageEl.appendChild(wrapBig);

bigApi = createAcasaThumbs(wrapBig, HERO_ITEMS, {
  thumbW: 200,
  thumbH: 300,
  gap: 28,
  radius: 14,

  // no hover callbacks needed for bottomCaption
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
