// ./js/mobile/mobilePartideArticle.js
import { articlePanelView } from "./views/articlePanelView.js";
import { resolvePartideGroups } from "../content.js";

function findSub(groupId, subId) {
  const groups = resolvePartideGroups?.() || [];
  const g = groups.find((x) => String(x?.id) === String(groupId)) || null;
  const s = g?.subs?.find((x) => String(x?.id) === String(subId)) || null;
  return { group: g, sub: s };
}

export async function mobilePartideArticleView({
  mountId = "m-root",
  scroller,
  navigate,
  groupId,
  subId,
} = {}) {
  const { group, sub } = findSub(groupId, subId);

  const title = sub?.title || "Partidă";
  const textUrl = sub?.tickerUrl || null;

  // gallery images: full jpgs, no thumbs (as you wanted)
  const images = (sub?.thumbs || [])
    .map((t) => t?.full)
    .filter(Boolean);

  return articlePanelView({
    mountId,
    scroller,
    navigate,
    header: {
      title,
      backLabel: group?.title || "Partide",
      // ✅ back goes to lake (group) level
      backTarget: groupId ? { type: "partide", groupId } : { type: "partide" },

      // optional “return memory” if you want to restore position later
      returnKey: "m:partide:feedRestore",
      returnValue: groupId ? String(groupId) : "1",

      accent: "var(--partide-accent)",
    },
    textUrl,
    images,
  });
}
