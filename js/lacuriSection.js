// /js/lacuriSection.js
import { THEME } from "./theme.js";
import { createSectionWithSubsubsections } from "./sectionWithSubsubsections.js";
import { resolveLacuriItems } from "./content.js";

export function createLacuriSection(stageMount, hooks = {}) {
  return createSectionWithSubsections(stageMount, {
    sectionLabel: "Lacuri",
    getItems: resolveLacuriItems,
    accentHex: THEME["Lacuri"]?.hex || "#efac45",
    ...hooks,
  });
}
