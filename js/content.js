// /js/content.js
import { THEME } from "./theme.js";

// ------------------------------------------------------
// BACKGROUNDS — single source of truth
// ------------------------------------------------------

const BG_BASE_DESKTOP = "./assets/bg";
const BG_BASE_MOBILE  = "./assets/bg-m";

const UI_BASE_DESKTOP = "./assets/img/ui";
const UI_BASE_MOBILE  = "./assets/img-m/ui";

const TEXT_BASE_DESKTOP = "./assets/text";
const TEXT_BASE_MOBILE  = "./assets/text-m";

function isMobile() {
  // body.is-mobile is already set by initMobileHeader
  return document.body.classList.contains("is-mobile");
}

function _bgBase() {
  return isMobile() ? BG_BASE_MOBILE : BG_BASE_DESKTOP;
}

function uiBase() {
  return isMobile() ? UI_BASE_MOBILE : UI_BASE_DESKTOP;
}

function textBase() {
  return isMobile() ? TEXT_BASE_MOBILE : TEXT_BASE_DESKTOP;
}

/* ------------------------------------------------------
   ✅ URL helper (GitHub Pages safe)
   - Converts "./assets/..." into absolute URL under repo base
   - Safe even with hash routing
------------------------------------------------------ */
function toAbsUrl(rel) {
  const s = String(rel || "");
  // Keep it simple: baseURI already contains repo subpath on GH Pages
  return new URL(s, document.baseURI).toString();
}

// 👇 THIS MUST BE EXPORTED
export const BG_ORDER = [
  "Despre mine",
  "Partide",
  "Acasa",
  "Galerie",
  "Contact",
];

// 👇 THIS MUST ALSO BE EXPORTED
export function resolveBgByLabel() {
  const base = _bgBase();
  return {
    "Acasa": `${base}/acasa.jpg`,
    "Despre mine": `${base}/despre.jpg`,
    "Partide": `${base}/partide.jpg`,
    "Galerie": `${base}/galerie.jpg`,
    "Contact": `${base}/contact.jpg`,
  };
}

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
// ACASA SEARCH — CENTRALIZED ARTICLE INDEX (additive)
// ------------------------------------------------------

function _norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip diacritics
}

export function hashFromTarget(target) {
  if (!target || !target.type) return "#/acasa";

  if (target.type === "galerie") return "#/galerie";
  if (target.type === "contact") return "#/contact";

  if (target.type === "despre") {
    return target.subId
      ? `#/despre/${encodeURIComponent(target.subId)}`
      : "#/despre";
  }

  if (target.type === "partide") {
    // ✅ NEW canonical structure
    if (target.groupId && target.subId) {
      return `#/partide/${encodeURIComponent(target.groupId)}/${encodeURIComponent(target.subId)}`;
    }
    if (target.groupId) {
      return `#/partide/${encodeURIComponent(target.groupId)}`;
    }
    // legacy fallback if only subId exists
    if (target.subId) {
      return `#/partide/${encodeURIComponent(target.subId)}`;
    }
    return "#/partide";
  }

  if (target.type === "acasa") return "#/acasa";

  return "#/acasa";
}


/**
 * Article index entries:
 *  { id, title, tags:[], target:{type,subId?}, img }
 * img MUST be thumb/hero .avif only (no full res)
 */
export function buildArticleIndex() {
  const out = [];

  // 1) Acasa latest (optional but useful; already thumb-only)
  for (const x of (BOTTOM_THUMBS["Acasa"] || [])) {
    if (!x?.id || !x?.title || !x?.target) continue;
    out.push({
      id: String(x.id),
      title: String(x.title),
      tags: [],
      target: x.target,
      img: x.imgFile ? `${uiBase()}/${x.imgFile}` : (x.img || null),
    });
  }

  // 2) Despre subs (deep-links)
  for (const s of (CONTENT?.despre?.subs || [])) {
    if (!s?.id || !s?.title) continue;

    const img =
      s.heroImg ||
      (Array.isArray(s.thumbs) && s.thumbs[0]?.img) ||
      null;

    if (!img) continue;

    out.push({
      id: `despre:${s.id}`,
      title: s.title,
      tags: [s.id, "despre"],
      target: { type: "despre", subId: s.id },
      img,
    });
  }

  // 3) Partide subsubs (deep-links)
  try {
    const groups = resolvePartideGroups() || [];
    for (const g of groups) {
      for (const sub of (g.subs || [])) {
        if (!sub?.id || !sub?.title) continue;
        const img =
          sub.heroImg ||
          (Array.isArray(sub.thumbs) && sub.thumbs[0]?.img) ||
          null;
        if (!img) continue;

        out.push({
          id: `partide:${sub.id}`,
          title: sub.title,
          tags: [g.id, sub.id, "partide"],
          target: { type: "partide", groupId: g.id, subId: sub.id },
          img,
        });
      }
    }
  } catch {
    // keep index building even if Partide config changes
  }

  // 4) Galerie (single route)
  try {
    const vids = resolveGalerieHeroVideos?.() || [];
    const img = vids[0]?.img || imgPath.hero("galerie", "main");
    out.push({
      id: "galerie:home",
      title: "Galerie",
      tags: ["galerie", "video", "foto"],
      target: { type: "galerie" },
      img,
    });
  } catch {
    out.push({
      id: "galerie:home",
      title: "Galerie",
      tags: ["galerie"],
      target: { type: "galerie" },
      img: "./assets/img/ui/galerie/galerie__thumb.avif",
    });
  }

  out.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return out;
}

let _ARTICLE_INDEX_CACHE = null;

export function getArticleIndex() {
  if (_ARTICLE_INDEX_CACHE) return _ARTICLE_INDEX_CACHE;
  _ARTICLE_INDEX_CACHE = buildArticleIndex();
  return _ARTICLE_INDEX_CACHE;
}

export function invalidateArticleIndex() {
  _ARTICLE_INDEX_CACHE = null;
}

/**
 * Fast in-memory search:
 * - title match (strong)
 * - tags match (medium)
 */
export function searchArticles(query, { limit = 18 } = {}) {
  const q = _norm(query);
  if (!q) return [];

  const ARTICLE_INDEX = getArticleIndex();

  const scored = [];
  for (const a of ARTICLE_INDEX) {
    const title = _norm(a.title);
    const tags = (a.tags || []).map(_norm);

    let score = 0;
    if (title.includes(q)) score = 10;
    for (const t of tags) if (t.includes(q)) score = 3;

    if (score > 0) scored.push({ a, score });
  }

scored.sort((x, y) => {
  if (y.score !== x.score) return y.score - x.score;
  return String(x.a.id).localeCompare(String(y.a.id));
});


  return scored.slice(0, limit).map((x) => x.a);
}

// ------------------------------------------------------
// Minimal image preload helper (warm PS open)
// ------------------------------------------------------
function preloadImage(src) {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = src;
}

// ------------------------------------------------------
// ACASA banner (centralized)
// ------------------------------------------------------
export const CONTENT = {
  acasa: {
    // store RELATIVE paths only (no uiBase() here)
    bannerSlidesRaw: [
      { file: "acasa/banner/slide-01__banner.jpg", caption: "...", alt: "Slide 1" },
      { file: "acasa/banner/slide-02__banner.jpg", caption: "...", alt: "Slide 2" },
      { file: "acasa/banner/slide-03__banner.jpg", caption: "...", alt: "Slide 3" },
      { file: "acasa/banner/slide-04__banner.jpg", caption: "...", alt: "Slide 4" },
      { file: "acasa/banner/slide-05__banner.jpg", caption: "...", alt: "Slide 5" },
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
      imgFile: "acasa/latest/latest-01__thumb.avif",
      target: { type: "partide", groupId: "ozone", subId: "ozone_s01" },

    },
    {
      id: "latest-02",
      title: "Ultimul articol 2",
      imgFile: "acasa/latest/latest-02__thumb.avif",
      target: { type: "galerie" },
    },
    {
      id: "latest-03",
      title: "Ultimul articol 3",
      imgFile: "acasa/latest/latest-03__thumb.avif",
      target: { type: "galerie" },
    },
    {
      id: "latest-04",
      title: "Ultimul articol 4",
      imgFile: "acasa/latest/latest-04__thumb.avif",
      target: { type: "galerie" },
    },
    {
      id: "latest-05",
      title: "Ultimul articol 5",
      imgFile: "acasa/latest/latest-05__thumb.avif",
      target: { type: "despre", subId: "delkim" },
    },
    {
      id: "latest-06",
      title: "Ultimul articol 6",
      imgFile: "acasa/latest/latest-06__thumb.avif",
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

// ------------------------------------------------------
// Mobile feed helpers (Acasa)
// ------------------------------------------------------

export function resolveAcasaLatestList() {
  const list = (BOTTOM_THUMBS["Acasa"] || []).slice(0, 6);

  const primaryBase = isMobile() ? UI_BASE_MOBILE : UI_BASE_DESKTOP;
  const fallbackBase = isMobile() ? UI_BASE_DESKTOP : UI_BASE_MOBILE;

  return list.map((x) => {
    const primaryRel = x.imgFile ? `${primaryBase}/${x.imgFile}` : (x.img || null);
    const fallbackRel = x.imgFile ? `${fallbackBase}/${x.imgFile}` : (x.img || null);

    return {
      ...x,
      img: primaryRel ? toAbsUrl(primaryRel) : null,
      imgFallback: fallbackRel ? toAbsUrl(fallbackRel) : null,
    };
  });
}

/* ------------------------------------------------------
   Banner slides now return:
   - src: absolute URL (platform primary UI base)
   - fallbackSrc: absolute URL (platform fallback UI base)
------------------------------------------------------ */
export function resolveAcasaBannerSlides() {
  const raw = (CONTENT?.acasa?.bannerSlidesRaw || []);

  const primaryBase = isMobile() ? UI_BASE_MOBILE : UI_BASE_DESKTOP;
  const fallbackBase = isMobile() ? UI_BASE_DESKTOP : UI_BASE_MOBILE;

  return raw.map((s) => {
    const relPrimary = `${primaryBase}/${s.file}`;
    const relFallback = `${fallbackBase}/${s.file}`;

    return {
      ...s,
      file: s.file,
      src: toAbsUrl(relPrimary),
      fallbackSrc: toAbsUrl(relFallback),
    };
  });
}

export function resolveAcasaArticleById(id) {
  const list = (BOTTOM_THUMBS["Acasa"] || []);
  const x = list.find((a) => String(a?.id) === String(id)) || null;
  if (!x) return null;

  const primaryBase = isMobile() ? UI_BASE_MOBILE : UI_BASE_DESKTOP;
  const fallbackBase = isMobile() ? UI_BASE_DESKTOP : UI_BASE_MOBILE;

  const primaryRel = x.imgFile ? `${primaryBase}/${x.imgFile}` : (x.img || null);
  const fallbackRel = x.imgFile ? `${fallbackBase}/${x.imgFile}` : (x.img || null);

  return {
    ...x,
    img: primaryRel ? toAbsUrl(primaryRel) : null,
    imgFallback: fallbackRel ? toAbsUrl(fallbackRel) : null,
  };
}

// ------------------------------------------------------
// DESPRE feed screen 2 hero (mobile)
// ------------------------------------------------------
export function resolveDespreFeedHeroImg() {
  // single source of truth (GH Pages safe)
  return toAbsUrl("./assets/img-m/content/despre/mine/hero/mine__hero.avif");
}


// ------------------------------------------------------
// DESPRE subsections (2-level engine uses these)
// ------------------------------------------------------
CONTENT.despre = {
  ...(CONTENT.despre || {}),
  subs: [
    {
      id: "delkim",
      title: "Delkim",
      heroImg: imgPath.hero("despre", "delkim"),
      tickerUrl: "./assets/text/despre_delkim.txt",
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `delkim_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "delkim", p),
        full: imgPath.full("despre", "delkim", p),
      })),
    },
    {
      id: "venture",
      title: "Venture",
      heroImg: imgPath.hero("despre", "venture"),
      tickerUrl: "./assets/text/despre_venture.txt",
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `venture_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "venture", p),
        full: imgPath.full("despre", "venture", p),
      })),
    },
        {
      id: "box",
      title: "Box-Logic",
      heroImg: imgPath.hero("despre", "box"),
      tickerUrl: "./assets/text/despre_box.txt",
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `box_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "box", p),
        full: imgPath.full("despre", "box", p),
      })),
    },
    {
      id: "delfin",
      title: "delfin",
      heroImg: imgPath.hero("despre", "delfin"),
      tickerUrl: "./assets/text/despre_delfin.txt",
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `delfin_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "delfin", p),
        full: imgPath.full("despre", "delfin", p),
      })),
    },
        {
      id: "korda",
      title: "korda",
      heroImg: imgPath.hero("despre", "korda"),
      tickerUrl: "./assets/text/despre_korda.txt",
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `korda_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "korda", p),
        full: imgPath.full("despre", "korda", p),
      })),
    },
    {
      id: "mblc",
      title: "mblc",
      heroImg: imgPath.hero("despre", "mblc"),
      tickerUrl: "./assets/text/despre_mblc.txt",
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `mblc_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "mblc", p),
        full: imgPath.full("despre", "mblc", p),
      })),
    },
        {
      id: "fma",
      title: "fma",
      heroImg: imgPath.hero("despre", "fma"),
      tickerUrl: "./assets/text/despre_fma.txt",
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `fma_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "fma", p),
        full: imgPath.full("despre", "fma", p),
      })),
    },
    {
      id: "mgs",
      title: "mgs",
      heroImg: imgPath.hero("despre", "mgs"),
      tickerUrl: "./assets/text/despre_mgs.txt",
      thumbs: ["p01", "p02", "p03", "p04", "p05"].map((p) => ({
        id: `mgs_${p}`,
        title: p.toUpperCase(),
        img: imgPath.thumb("despre", "mgs", p),
        full: imgPath.full("despre", "mgs", p),
      })),
    },
  ],
};

// ------------------------------------------------------
// DESPRE articles — intentionally disabled (clean base)
// ------------------------------------------------------
export function resolveDespreArticleById() {
  return null;
}


export function resolveBottomThumbs(state) {
  const label = state?.activeLabel;
  const list = BOTTOM_THUMBS[label] || [];

  if (label === "Acasa") {
    const primaryBase = isMobile() ? UI_BASE_MOBILE : UI_BASE_DESKTOP;
    const fallbackBase = isMobile() ? UI_BASE_DESKTOP : UI_BASE_MOBILE;

    return list.map((x) => {
      const primaryRel = x.imgFile ? `${primaryBase}/${x.imgFile}` : (x.img || null);
      const fallbackRel = x.imgFile ? `${fallbackBase}/${x.imgFile}` : (x.img || null);

      return {
        ...x,
        img: primaryRel ? toAbsUrl(primaryRel) : x.img,
        imgFallback: fallbackRel ? toAbsUrl(fallbackRel) : null,
      };
    });
  }

  return list;
}

// ------------------------------------------------------
// DESPRE hero cards (mobile  desktop safe)
// ------------------------------------------------------
export function resolveDespreHeroCards() {
  const subs = (CONTENT?.despre?.subs || []);

  return subs
    .filter((s) => s?.id && s?.title && s?.heroImg)
    .map((s) => ({
      id: `despre:${s.id}`,
      title: s.title,
      target: { type: "despre", subId: s.id },
      // GH Pages safe absolute URL
      img: toAbsUrl(s.heroImg),
      // optional: a deep-link hash if you like this pattern elsewhere
      hash: hashFromTarget({ type: "despre", subId: s.id }),
    }));
}


function textUrl(file) {
  // file like "despre_1.txt"
  return toAbsUrl(`${textBase()}/${file}`);
}

function textUrlRel(relFile) {
  // relFile like "despre/delkim/despre_delkim_1.txt"
  return toAbsUrl(`${textBase()}/${relFile}`);
}

function resolveDespreSubById(subId) {
  const id = String(subId || "");
  return (CONTENT?.despre?.subs || []).find((s) => String(s?.id) === id) || null;
}

// ------------------------------------------------------
// DESPRE Article Panel data (single text + sliding gallery)
// ------------------------------------------------------
export function resolveDespreArticlePanelData({ subId, articleId } = {}) {
  // one-article-per-sub for now; articleId is kept for URL shareability
  const sub = resolveDespreSubById(subId);
  if (!sub) return null;

  // if someone manually edits URL and articleId mismatches, still allow
  const title = String(sub.title || "Despre");

  // ✅ single long text: use the sub tickerUrl (already per-sub)
  const textUrlAbs = sub.tickerUrl ? toAbsUrl(sub.tickerUrl) : null;
  if (!textUrlAbs) return null;

  // ✅ images: use full if available, fall back to img
  const images = (sub.thumbs || [])
    .map((t) => t?.full || t?.img)
    .filter(Boolean)
    .map((src) => toAbsUrl(src));

  return {
    id: String(articleId || sub.id || ""),
    title,
    textUrl: textUrlAbs,
    images,
  };
}


/**
 * DESPRE Screen 2 ticker (mobile-specific layout)
 * - Mobile uses TWO chunks (left/right)
 * - Desktop keeps a single despre.txt (not used by mobile split UI, but kept for consistency)
 */
export function resolveDespreTickerParts() {
  if (isMobile()) {
    return {
      left:  { url: textUrl("despre_1.txt"), fallbackText: "..." },
      right: { url: textUrl("despre_2.txt"), fallbackText: "..." },
    };
  }

  // Desktop: keep ONE file (if ever needed elsewhere)
  return {
    left:  { url: textUrl("despre.txt"), fallbackText: "..." },
    right: { url: null, fallbackText: "" },
  };
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
  if (
    sectionLabel === "Despre mine" &&
    state?.despre?.mode === "sub" &&
    state?.despre?.subId
  ) {
    const subId = state.despre.subId;
    const sub = (CONTENT?.despre?.subs || []).find((s) => s.id === subId) || null;
    const thumbs = sub?.thumbs || [];

    if (thumbs?.[0]?.full) preloadImage(thumbs[0].full);

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

    if (thumbs?.[0]?.full) preloadImage(thumbs[0].full);

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
  title: "Ozone Lake",
  heroImg: imgPath.partideGroupHero("ozone"),
  // ✅ NEW: lake overview text (mobile uses this on Partide home Screen 2)
  lakeTextUrl: "./assets/text-m/partide/lakes/ozone.txt",
      subs: [
        {
          id: "ozone_s01",
          title: "2025, Iunie",
          heroImg: imgPath.partideSubHero("ozone", "s01"),
          tickerUrl: "./assets/text/partide/ozone_s01.txt",
          thumbs: ["p01","p02","p03","p04","p05"].map((p) => ({
            id: `ozone_s01_${p}`,
            title: p.toUpperCase(),
            img: imgPath.partideThumb("ozone", "s01", p),
            full: imgPath.partideFull("ozone", "s01", p),
          })),
        },
      ],
    },
        {
      id: "teiu",
      title: "Lacul Teiu",
      heroImg: imgPath.partideGroupHero("teiu"),
      lakeTextUrl: "./assets/text-m/partide/lakes/teiu.txt",
      subs: [
        {
          id: "teiu_s01",
          title: "2025, Septembrie",
          heroImg: imgPath.partideSubHero("teiu", "s01"),
          tickerUrl: "./assets/text/partide/teiu_s01.txt",
          thumbs: ["p01","p02","p03"].map((p) => ({
            id: `teiu_s01_${p}`,
            title: p.toUpperCase(),
            img: imgPath.partideThumb("teiu", "s01", p),
            full: imgPath.partideFull("teiu", "s01", p),
          })),
        },
      ],
    },
    {
      id: "mv",
      title: "Moara Vlasiei 2",
      heroImg: imgPath.partideGroupHero("mv"),
        lakeTextUrl: "./assets/text-m/partide/lakes/mv.txt",
      subs: [
        {
          id: "mv_s01",
          title: "2025, August",
          heroImg: imgPath.partideSubHero("mv", "s01"),
          tickerUrl: "./assets/text/partide/mv_s01.txt",
          thumbs: ["p01","p02","p03","p04"].map((p) => ({
            id: `mv_s01_${p}`,
            title: p.toUpperCase(),
            img: imgPath.partideThumb("mv", "s01", p),
            full: imgPath.partideFull("mv", "s01", p),
          })),
        },
      ],
    },
        {
      id: "varlaam",
      title: "Lacul Varlaam",
      heroImg: imgPath.partideGroupHero("varlaam"),
      lakeTextUrl: "./assets/text-m/partide/lakes/varlaam.txt",
      subs: [
        {
          id: "varlaam_s01",
          title: "2025, Mai",
          heroImg: imgPath.partideSubHero("varlaam", "s01"),
          tickerUrl: "./assets/text/partide/varlaam_s01.txt",
          thumbs: ["p01","p02","p03","p04","p05","p06"].map((p) => ({
            id: `varlaam_s01_${p}`,
            title: p.toUpperCase(),
            img: imgPath.partideThumb("varlaam", "s01", p),
            full: imgPath.partideFull("varlaam", "s01", p),
          })),
        },
      ],
    },
    
  ];
}

export function resolvePartideGroupIdBySubId(subId) {
  const id = String(subId || "");
  const groups = resolvePartideGroups() || [];
  for (const g of groups) {
    for (const s of (g.subs || [])) {
      if (String(s?.id) === id) return String(g.id);
    }
  }
  return null;
}

function toAbs(s) { return toAbsUrl(s); }

export function resolvePartideLakesForMobile() {
  const groups = resolvePartideGroups() || [];
  return groups.map((g) => ({
    id: g.id,
    title: g.title,
    heroImg: g.heroImg ? toAbs(g.heroImg) : null,
    lakeTextUrl: g.lakeTextUrl ? toAbs(g.lakeTextUrl) : null,
  }));
}

export function resolvePartideLakeById(groupId) {
  const g = (resolvePartideGroups() || []).find((x) => String(x.id) === String(groupId)) || null;
  if (!g) return null;

  return {
    id: g.id,
    title: g.title,
    heroImg: g.heroImg ? toAbs(g.heroImg) : null,
    lakeTextUrl: g.lakeTextUrl ? toAbs(g.lakeTextUrl) : null,
    subs: (g.subs || []).map((s) => ({
      id: s.id,
      title: s.title,
      heroImg: s.heroImg ? toAbs(s.heroImg) : null,
      tickerUrl: s.tickerUrl ? toAbs(s.tickerUrl) : null,
      // ✅ mobile uses FULL jpgs only
      images: (s.thumbs || [])
        .map((t) => t?.full || t?.img)
        .filter(Boolean)
        .map((src) => toAbs(src)),
    })),
  };
}

export function resolvePartideArticlePanelData({ groupId, subId } = {}) {
  const lake = resolvePartideLakeById(groupId);
  if (!lake) return null;

  const sub = (lake.subs || []).find((s) => String(s.id) === String(subId)) || null;
  if (!sub) return null;

  return {
    id: sub.id,
    title: sub.title,
    textUrl: sub.tickerUrl,
    images: sub.images || [],
  };
}

