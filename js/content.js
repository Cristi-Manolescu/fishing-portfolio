// /js/content.js
import { THEME } from "./theme.js";

// ------------------------------------------------------
// Image pipeline resolver (single source of truth)
// ------------------------------------------------------
const IMG_BASE = "./assets/img/content";

export const imgPath = {
  // Small thumbs (bottom strips)
  thumb(section, slug, p /* "p01" */) {
    return `${IMG_BASE}/${section}/${slug}/thumbs/${slug}__${p}__thumb.avif`;
  },

  // Full-res for Photo System overlay
  full(section, slug, p /* "p01" */) {
    return `${IMG_BASE}/${section}/${slug}/full/${slug}__${p}__full.jpg`;
  },

  // Hero thumbs (middle holder)
  hero(section, slug) {
    return `${IMG_BASE}/${section}/${slug}/hero/${slug}__hero.avif`;
  },

    // Partide group hero (Partide home)
  partideGroupHero(group) {
    return `${IMG_BASE}/partide/${group}/hero/${group}__hero.avif`;
  },

  // Partide sub hero (inside a group)
  partideSubHero(group, sub /* s01 */) {
    return `${IMG_BASE}/partide/${group}/${sub}/hero/${group}__${sub}__hero.avif`;
  },

  // Partide thumbs (strip)
  partideThumb(group, sub, p /* p01 */) {
    return `${IMG_BASE}/partide/${group}/${sub}/thumbs/${group}__${sub}__${p}__thumb.avif`;
  },

  // Partide full (PS overlay)
  partideFull(group, sub, p /* p01 */) {
    return `${IMG_BASE}/partide/${group}/${sub}/full/${group}__${sub}__${p}__full.jpg`;
  },
};

// ------------------------------------------------------
// Minimal image preload helper (warm PS open)
// ------------------------------------------------------
function preloadImage(src) {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager"; // hint; safe no-op in some browsers
  img.src = src;
}


// ------------------------------------------------------
// ACASA banner (centralized)
// ------------------------------------------------------
export const CONTENT = {
  acasa: {
    bannerSlides: [
      { src: "./assets/img/ui/acasa/banner/slide-01__banner.jpg", caption: "...", alt: "Slide 1" },
      { src: "./assets/img/ui/acasa/banner/slide-02__banner.jpg", caption: "...", alt: "Slide 2" },
      { src: "./assets/img/ui/acasa/banner/slide-03__banner.jpg", caption: "...", alt: "Slide 3" },
      { src: "./assets/img/ui/acasa/banner/slide-04__banner.jpg", caption: "...", alt: "Slide 4" },
      { src: "./assets/img/ui/acasa/banner/slide-05__banner.jpg", caption: "...", alt: "Slide 5" },
    ],
  },
};

// ------------------------------------------------------
// Bottom thumbs by section (centralized)
// NOTE: keep IDs stable where possible
// ------------------------------------------------------
const BOTTOM_THUMBS = {
"Acasa": [
  {
    id: "latest-01",
    title: "Ultimul articol 1",
    img: "./assets/img/ui/acasa/latest/latest-01__thumb.avif",
    target: { type: "partide", subId: "ozone_s01" },
  },
  { id: "latest-02", title: "Ultimul articol 2", img: "./assets/img/ui/acasa/latest/latest-02__thumb.avif",
    target: { type: "galerie" },
  },
  { id: "latest-03", title: "Ultimul articol 3", img: "./assets/img/ui/acasa/latest/latest-03__thumb.avif",
    target: { type: "galerie" },
  },
  { id: "latest-04", title: "Ultimul articol 4", img: "./assets/img/ui/acasa/latest/latest-04__thumb.avif",
    target: { type: "galerie" },
  },
  {
    id: "latest-05",
    title: "Ultimul articol 5",
    img: "./assets/img/ui/acasa/latest/latest-05__thumb.avif",
    target: { type: "despre", subId: "delkim" },
  },
  {
    id: "latest-06",
    title: "Ultimul articol 6",
    img: "./assets/img/ui/acasa/latest/latest-06__thumb.avif",
    target: { type: "despre", subId: "venture" },
  },
],


"Galerie": [
  { id: "g-1", title: "Galerie 1", img: imgPath.thumb("galerie", "main", "p01"), full: imgPath.full("galerie", "main", "p01") },
  { id: "g-2", title: "Galerie 2", img: imgPath.thumb("galerie", "main", "p02"), full: imgPath.full("galerie", "main", "p02") },
  { id: "g-3", title: "Galerie 3", img: imgPath.thumb("galerie", "main", "p03"), full: imgPath.full("galerie", "main", "p03") },
  { id: "g-4", title: "Galerie 4", img: imgPath.thumb("galerie", "main", "p04"), full: imgPath.full("galerie", "main", "p04") },
  { id: "g-5", title: "Galerie 5", img: imgPath.thumb("galerie", "main", "p05"), full: imgPath.full("galerie", "main", "p05") },
],


  "Contact": [],
};

export function resolveAcasaArticleById(id) {
  const list = (BOTTOM_THUMBS["Acasa"] || []);
  return list.find((x) => String(x?.id) === String(id)) || null;
}


// ------------------------------------------------------
// DESPRE subsections (2-level engine uses these)
// ------------------------------------------------------
CONTENT.despre = {
  subs: [
    {
      id: "delkim",
      title: "Delkim",
      heroImg: imgPath.hero("despre", "delkim"),
      tickerUrl: "./assets/text/despre_delkim.txt", // pick/create file (can be temporary)
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `delkim_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "delkim", p),   // SMALL
        full: imgPath.full("despre", "delkim", p),   // BIG (PS)
      })),
    },
    {
      id: "venture",
      title: "Venture",
      heroImg: imgPath.hero("despre", "venture"),
      tickerUrl: "./assets/text/despre_venture.txt", // pick/create file (can be temporary)
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `venture_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "venture", p),  // SMALL
        full: imgPath.full("despre", "venture", p),  // BIG (PS)
      })),
    },
  ],
};


export function resolveBottomThumbs(state) {
  return BOTTOM_THUMBS[state?.activeLabel] || [];
}

// ------------------------------------------------------
// Ticker resolver (Acasa ONLY)
// ------------------------------------------------------
export function resolveTicker(sectionLabel, state) {
  if (sectionLabel === "Acasa") {
    if (state?.acasa?.mode === "article" && state?.acasa?.articleId) {
      const art = resolveAcasaArticleById(state.acasa.articleId);
      if (art?.tickerUrl) {
        return { url: art.tickerUrl, fallbackText: "..." };
      }
    }
    return { url: "./assets/text/acasa.txt", fallbackText: "Fire întinse și lectură plăcută!" };
  }
  return null;
}


// ------------------------------------------------------
// Galerie hero videos (big thumbs)
// ------------------------------------------------------
export function resolveGalerieHeroVideos() {
  return [
{ id: "vid-1", title: "Video 1", img: imgPath.hero("galerie", "vid-1"), youtubeId: "AAA" },
{ id: "vid-2", title: "Video 2", img: imgPath.hero("galerie", "vid-2"), youtubeId: "BBB" },
{ id: "vid-3", title: "Video 3", img: imgPath.hero("galerie", "vid-3"), youtubeId: "CCC" },

  ];
}

// ------------------------------------------------------
// Photo overlay resolver (centralized; NO logic in interactions)
// ------------------------------------------------------
export function resolvePhotoOverlayItems({ sectionLabel, thumbId, item, state }) {
  // SPECIAL: Despre in sub-mode => open that sub’s thumb set
  if (
    sectionLabel === "Despre mine" &&
    state?.despre?.mode === "sub" &&
    state?.despre?.subId
  ) {
    const subId = state.despre.subId;

const sub = (CONTENT?.despre?.subs || []).find((s) => s.id === subId) || null;
const thumbs = sub?.thumbs || [];

    // Preload first full image (PS warm-up)
if (thumbs?.[0]?.full) {
  preloadImage(thumbs[0].full);
}

const items = thumbs
  .filter((t) => t?.img || t?.full)
  .map((t) => ({ src: t.full || t.img }));


    let idx = 0;
    const found = thumbs.findIndex((t) => String(t?.id) === String(thumbId));
    if (found >= 0) idx = found;

    if (!items.length) return null;

    return {
      items,
      index: idx,
      accentHex: THEME?.["Despre mine"]?.hex || null,
    };
  }
  
  // SPECIAL: Partide in subsub-mode => open that partida’s photo set
  if (
    sectionLabel === "Partide" &&
    state?.partide?.mode === "subsub" &&
    state?.partide?.subId
  ) {
    const subId = state.partide.subId;

    const groups = resolvePartideGroups();
    let sub = null;

    for (const g of groups) {
      sub = (g.subs || []).find((s) => s.id === subId) || null;
      if (sub) break;
    }

    const thumbs = sub?.thumbs || [];

    // Preload first full image (PS warm-up)
if (thumbs?.[0]?.full) {
  preloadImage(thumbs[0].full);
}

    const items = thumbs
  .filter((t) => t?.img || t?.full)
  .map((t) => ({ src: t.full || t.img }));

    let idx = 0;
    const found = thumbs.findIndex((t) => String(t?.id) === String(thumbId));
    if (found >= 0) idx = found;

    if (!items.length) return null;

    return {
      items,
      index: idx,
      accentHex: THEME?.["Partide"]?.hex || null,
    };
  }


  // Default: section bottom thumbs list (if exists) OR single item
const list = (BOTTOM_THUMBS[sectionLabel] || []).filter((x) => x?.img || x?.full);

let itemsArr = [];
if (list.length) itemsArr = list.map((x) => ({ src: x.full || x.img }));
else if (item?.img || item?.full) itemsArr = [{ src: item.full || item.img }];

  let idx = 0;
  if (list.length) {
    const found = list.findIndex((x) => x?.id === thumbId);
    idx = found >= 0 ? found : 0;
  }

  if (!itemsArr.length) return null;

  return {
    items: itemsArr,
    index: idx,
    accentHex: THEME?.[sectionLabel]?.hex || null,
  };
}

// ------------------------------------------------------
// Partide groups (unchanged logic; you can refactor later)
// ------------------------------------------------------
export function resolvePartideGroups() {
  return [
    {
      id: "ozone",
      title: "Ozone",
      heroImg: imgPath.partideGroupHero("ozone"),
      subs: [
        {
          id: "ozone_s01",
          title: "Partida 1",
          heroImg: imgPath.partideSubHero("ozone", "s01"),
          tickerUrl: "./assets/text/partide/ozone_s01.txt",
          thumbs: ["p01","p02","p03","p04","p05"].map((p) => ({
            id: `ozone_s01_${p}`,
            title: p.toUpperCase(),
            img: imgPath.partideThumb("ozone", "s01", p), // SMALL
            full: imgPath.partideFull("ozone", "s01", p), // BIG (PS)
          })),
        },
        // s02, s03 ...
      ],
    },
  ];
}

