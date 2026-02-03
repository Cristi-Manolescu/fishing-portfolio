// /js/mobile/mobileDespreArticle.js
import * as Content from "../content.js?v=despreArticle-v2";
import { articleView } from "./views/articleView.js";

export async function mobileDespreArticleView({
  mountId = "m-root",
  scroller,
  navigate,
  subId,
  articleId,
} = {}) {
  const article = Content.resolveDespreArticleById?.({ subId, articleId });
  if (!article) {
    navigate?.({ type: "despre" });
    return { els: {}, api: {}, destroy() {} };
  }

  // ✅ Despre-specific navigation contract (unchanged)
  const RETURN_KEY = "m_despre_return";
  const RETURN_VALUE = "s3";

  return articleView({
    mountId,
    scroller,
    navigate,
    header: {
      backLabel: "Despre",
      title: article.title,             // sub title (as you required)
      backTarget: { type: "despre" },    // go back to feed
      returnKey: RETURN_KEY,
      returnValue: RETURN_VALUE,
      accent: "var(--despre-accent)",
    },
    blocks: article.blocks,
  });
}
