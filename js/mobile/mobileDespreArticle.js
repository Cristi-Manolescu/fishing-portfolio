// /js/mobile/mobileDespreArticle.js
import * as Content from "../content.js?v=despreArticlePanel-v2";
import { articlePanelView } from "./views/articlePanelView.js";

export async function mobileDespreArticleView({
  mountId = "m-root",
  scroller,
  navigate,
  subId,
  articleId,
} = {}) {
  const data = Content.resolveDespreArticlePanelData?.({ subId, articleId });

  if (!data) {
    navigate?.({ type: "despre" });
    return { els: {}, api: {}, destroy() {} };
  }

  return articlePanelView({
    mountId,
    scroller,
    navigate,
    header: {
      backLabel: "Despre",
      title: data.title,
      backTarget: { type: "despre" },
      accent: "var(--despre-accent)",

      // ✅ navigation memory (return to the thumb that launched it)
      returnKey: "m_despre_return_sub",
      returnValue: String(subId || ""),
    },
    textUrl: data.textUrl,
    images: data.images,
  });
}
