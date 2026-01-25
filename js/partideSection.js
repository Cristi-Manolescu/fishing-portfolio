// /js/partideSection.js
import { THEME } from "./theme.js";
import { createSectionWithSubsubsections } from "./sectionWithSubsubsections.js";
import { resolvePartideGroups } from "./content.js";

export function createPartideSection(stageMount, hooks = {}) {
  return createSectionWithSubsubsections(stageMount, {
    sectionLabel: "Partide",
    getGroups: resolvePartideGroups,
    accentHex: THEME["Partide"]?.hex || "#6b1c10",
    ...hooks,
  });
}
