// /js/content.js
import { THEME } from "./theme.js";

// ------------------------------------------------------
// ACASA banner (same content you had, centralized)
// ------------------------------------------------------
export const CONTENT = {
  acasa: {
    bannerSlides: [
      { src: "./assets/banner/slide1.jpg", caption: "Bine ai venit!", alt: "Slide 1" },
      { src: "./assets/banner/slide2.jpg", caption: "Lacuri • Tehnici • Capturi", alt: "Slide 2" },
      { src: "./assets/banner/slide3.jpg", caption: "Povești din teren", alt: "Slide 3" },
      { src: "./assets/banner/slide4.jpg", caption: "Povești din teren", alt: "Slide 4" },
      { src: "./assets/banner/slide5.jpg", caption: "Povești din teren", alt: "Slide 5" },
    ],
  },
};

// ------------------------------------------------------
// Bottom thumbs by section (centralized)
// NOTE: keep IDs stable
// ------------------------------------------------------
const BOTTOM_THUMBS = {
  "Acasa": [
    { id: "despre-1", title: "Despre mine", img: "./assets/banner/slide1.jpg" },
    { id: "lacuri-1", title: "Lacuri",      img: "./assets/banner/slide2.jpg" },
    { id: "galerie-1", title: "Galerie",     img: "./assets/banner/slide3.jpg" },
    { id: "contact-1", title: "Contact",    img: "./assets/banner/slide4.jpg" },
    { id: "despre-2", title: "Despre mine", img: "./assets/banner/slide5.jpg" },
    { id: "lacuri-2", title: "Lacuri",      img: "./assets/banner/slide2.jpg" },
    { id: "galerie-2", title: "Galerie",    img: "./assets/banner/slide3.jpg" },
    { id: "contact-2", title: "Contact",    img: "./assets/banner/slide4.jpg" },
  ],

  "Galerie": [
    { id: "g-1", title: "Galerie 1", img: "./assets/galerie/small/1.jpg" },
    { id: "g-2", title: "Galerie 2", img: "./assets/galerie/small/2.jpg" },
    { id: "g-3", title: "Galerie 3", img: "./assets/galerie/small/3.jpg" },
    { id: "g-4", title: "Galerie 4", img: "./assets/galerie/small/4.jpg" },
    { id: "g-5", title: "Galerie 5", img: "./assets/galerie/small/5.jpg" },
  ],

  "Contact": [],
};

CONTENT.despre = {
  subs: [
    {
      id: "bio",
      title: "Bio",
      heroImg: "./assets/despre/bio.jpg",
      tickerUrl: "./assets/text/despre_bio.txt",
      thumbs: [
        { id: "despre-1b", title: "Despre mine", img: "./assets/photo/photo1.jpg" },
    { id: "lacuri-1b", title: "Lacuri",      img: "./assets/photo/photo2.jpg" },
    { id: "galerie-1b", title: "Galerie",    img: "./assets/photo/photo3.jpg" },
    { id: "contact-1b", title: "Contact",    img: "./assets/photo/photo4.jpg" },
    { id: "despre-2b", title: "Despre mine", img: "./assets/photo/photo5.jpg" },
    { id: "lacuri-2b", title: "Lacuri",      img: "./assets/photo/photo6.jpg" },
],
    },
    {
      id: "setup",
      title: "Setup",
      heroImg: "./assets/despre/setup.jpg",
      tickerUrl: "./assets/text/despre_setup.txt",
      thumbs: [
        { id: "despre-1", title: "Despre mine", img: "./assets/photo/photo1.jpg" },
    { id: "lacuri-1", title: "Lacuri",      img: "./assets/photo/photo2.jpg" },
    { id: "galerie-1", title: "Galerie",    img: "./assets/photo/photo3.jpg" },
    { id: "contact-1", title: "Contact",    img: "./assets/photo/photo4.jpg" },
    { id: "despre-2", title: "Despre mine", img: "./assets/photo/photo5.jpg" },
    { id: "lacuri-2", title: "Lacuri",      img: "./assets/photo/photo6.jpg" },
],
    },
  ],
};


export function resolveBottomThumbs(state) {
  return BOTTOM_THUMBS[state?.activeLabel] || [];
}

// ------------------------------------------------------
// Ticker resolver (Acasa & Despre use main ticker mount)
// ------------------------------------------------------
export function resolveTicker(sectionLabel /*, subId */) {
  if (sectionLabel === "Acasa") {
    return { url: "./assets/text/acasa.txt", fallbackText: "Fire întinse și lectură plăcută!" };
  }
  if (sectionLabel === "Despre mine") {
    return { url: "./assets/text/despre.txt", fallbackText: "Despre mine..." };
  }
  return null;
}

// ------------------------------------------------------
// Lacuri subsections content (hero, sub thumbs, sub ticker)
// IMPORTANT: IDs must match folder structure
// ------------------------------------------------------
export function resolveLacuriItems() {
  // Adjust count or ids whenever you add lakes
  const lakes = Array.from({ length: 5 }, (_, i) => {
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

  return lakes;
}

// ------------------------------------------------------
// Galerie hero videos (big thumbs)
// ------------------------------------------------------
export function resolveGalerieHeroVideos() {
  return [
    { id: "vid-1", title: "Video 1", img: "./assets/galerie/hero/1.jpg", youtubeId: "AAA" },
    { id: "vid-2", title: "Video 2", img: "./assets/galerie/hero/2.jpg", youtubeId: "BBB" },
    { id: "vid-3", title: "Video 3", img: "./assets/galerie/hero/3.jpg", youtubeId: "CCC" },
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

  const items = thumbs
    .filter((t) => t?.img)
    .map((t) => ({ src: t.img }));

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
    sectionLabel === "Lacuri" &&
    state?.lacuri?.mode === "sub" &&
    state?.lacuri?.activeSubId
  ) {
    const lakeId = state.lacuri.activeSubId;

    const items = Array.from({ length: 9 }, (_, k) => ({
      src: `./assets/lacuri/${lakeId}/${k + 1}.jpg`,
    }));

    const idx = Math.max(
      0,
      Math.min(8, parseInt(String(thumbId).split("-").pop(), 10) - 1 || 0)
    );

    return { items, index: idx, accentHex: THEME?.["Lacuri"]?.hex || null };
  }

  // SPECIAL: Partide in subsub-mode => open that partida’s photo set
if (
  sectionLabel === "Partide" &&
  state?.partide?.mode === "subsub" &&
  state?.partide?.subId
) {
  const subId = state.partide.subId;

  // Find the current partida in your content tree
  const groups = resolvePartideGroups();
  let sub = null;

  for (const g of groups) {
    sub = (g.subs || []).find((s) => s.id === subId) || null;
    if (sub) break;
  }

  const thumbs = sub?.thumbs || [];
  const items = thumbs
    .filter((t) => t?.img)
    .map((t) => ({ src: t.img }));

  // index: match clicked thumb id
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
  const list = (BOTTOM_THUMBS[sectionLabel] || []).filter((x) => x?.img);

  let itemsArr = [];
  if (list.length) itemsArr = list.map((x) => ({ src: x.img }));
  else if (item?.img) itemsArr = [{ src: item.img }];

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

export function resolvePartideGroups() {
  return [
    {
      id: "vidraru1",
      title: "Vidraru 1",
      heroImg: "./assets/partide/vidraru1/hero.jpg",
      subs: [
        {
          id: "vidraru1_partida1",
          title: "Partida 1",
          heroImg: "./assets/partide/vidraru1/p1/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida1_1", title: "1", img: "./assets/partide/vidraru1/p1/1.jpg" },
  { id: "vidraru1_partida1_2", title: "2", img: "./assets/partide/vidraru1/p1/2.jpg" },
]

        },
        {
          id: "vidraru1_partida2",
          title: "Partida 2",
          heroImg: "./assets/partide/vidraru1/p2/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida2_1", title: "1", img: "./assets/partide/vidraru1/p2/1.jpg" },
  { id: "vidraru1_partida2_2", title: "2", img: "./assets/partide/vidraru1/p2/2.jpg" },
]

        },
        {
          id: "vidraru1_partida3",
          title: "Partida 3",
          heroImg: "./assets/partide/vidraru1/p3/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida3_1", title: "1", img: "./assets/partide/vidraru1/p3/1.jpg" },
  { id: "vidraru1_partida3_2", title: "2", img: "./assets/partide/vidraru1/p3/2.jpg" },
]

        },
      ],
    },
    {
      id: "vidraru2",
      title: "Vidraru 2",
      heroImg: "./assets/partide/vidraru1/hero.jpg",
      subs: [
        {
          id: "vidraru2_partida1",
          title: "Partida 1",
          heroImg: "./assets/partide/vidraru1/p1/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida1_1", title: "1", img: "./assets/partide/vidraru1/p1/1.jpg" },
  { id: "vidraru1_partida1_2", title: "2", img: "./assets/partide/vidraru1/p1/2.jpg" },
]

        },
        {
          id: "vidraru2_partida2",
          title: "Partida 2",
          heroImg: "./assets/partide/vidraru1/p2/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida2_1", title: "1", img: "./assets/partide/vidraru1/p2/1.jpg" },
  { id: "vidraru1_partida2_2", title: "2", img: "./assets/partide/vidraru1/p2/2.jpg" },
]

        },
        {
          id: "vidraru2_partida3",
          title: "Partida 3",
          heroImg: "./assets/partide/vidraru1/p3/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida3_1", title: "1", img: "./assets/partide/vidraru1/p3/1.jpg" },
  { id: "vidraru1_partida3_2", title: "2", img: "./assets/partide/vidraru1/p3/2.jpg" },
]

        },
      ],
    },
    {
      id: "vidraru3",
      title: "Vidraru 3",
      heroImg: "./assets/partide/vidraru1/hero.jpg",
      subs: [
        {
          id: "vidraru3_partida1",
          title: "Partida 1",
          heroImg: "./assets/partide/vidraru1/p1/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida1_1", title: "1", img: "./assets/partide/vidraru1/p1/1.jpg" },
  { id: "vidraru1_partida1_2", title: "2", img: "./assets/partide/vidraru1/p1/2.jpg" },
]

        },
        {
          id: "vidraru3_partida2",
          title: "Partida 2",
          heroImg: "./assets/partide/vidraru1/p2/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida2_1", title: "1", img: "./assets/partide/vidraru1/p2/1.jpg" },
  { id: "vidraru1_partida2_2", title: "2", img: "./assets/partide/vidraru1/p2/2.jpg" },
]

        },
        {
          id: "vidraru3_partida3",
          title: "Partida 3",
          heroImg: "./assets/partide/vidraru1/p3/hero.jpg",
          tickerUrl: "./assets/text/partide/vidraru1_partida1.txt",
          thumbs: [
  { id: "vidraru1_partida3_1", title: "1", img: "./assets/partide/vidraru1/p3/1.jpg" },
  { id: "vidraru1_partida3_2", title: "2", img: "./assets/partide/vidraru1/p3/2.jpg" },
]

        },
      ],
    },
  ];
}

