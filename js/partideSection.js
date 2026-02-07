// /js/partideSection.js
import { THEME } from "./theme.js";
import { createSectionWithSubsubsections } from "./sectionWithSubsubsections.js";
import { resolvePartideGroups } from "./content.js";
import { navigate } from "./router.js"; // ✅ NEW

export function createPartideSection(stageMount, hooks = {}) {
  return createSectionWithSubsubsections(stageMount, {
    sectionLabel: "Partide",
    getGroups: resolvePartideGroups,
    accentHex: THEME["Partide"]?.hex || "#6b1c10",

    // ✅ Keep desktop URL synced with the new router shape
    onHome: () => navigate({ type: "partide" }),
    onGroupEnter: (group) => navigate({ type: "partide", groupId: group.id }),

    // ✅ now receives (sub, group)
    onSubsubEnter: (sub, group) =>
      navigate({ type: "partide", groupId: group.id, subId: sub.id }),

    ...hooks,
  });
}
