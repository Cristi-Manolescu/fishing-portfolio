import { THEME } from "./theme.js";
import { CONTENT } from "./content.js";
import { createSectionWithSubsubsections } from "./sectionWithSubsubsections.js";

export function createDespreSection(stageMount, cfg = {}) {
  const accentHex = THEME?.["Despre mine"]?.hex || THEME?._normal?.hex || "#ff6701";

  const getGroups = () => [
    {
      id: "despre",
      title: "Despre",
      heroImg: null,
      subs: (CONTENT?.despre?.subs || []).map((s) => ({
        id: s.id,
        title: s.title,
        heroImg: s.heroImg,
        tickerUrl: s.tickerUrl,
        thumbs: s.thumbs || [],
      })),
    },
  ];

  const engine = createSectionWithSubsubsections(stageMount, {
    sectionLabel: "Despre mine",
    getGroups,
    accentHex,

    // ✅ Despre = 2 levels
    autoEnterSingleGroup: true,
    showGroupBackUp: false,
    showSubsubNext: true,

    onHome: cfg.onHome,
    onSubsubEnter: cfg.onSubEnter,
    onSubsubThumbs: cfg.onSubThumbs,
  });

  return engine;
}
