# Article – current status & next step

**Copy the text below into a new conversation** to start work on the Article feature.

---

## Project overview

- **Stack:** SvelteKit (Svelte 5), adapter-static. Deployed to GitHub Pages with `base` from `$app/paths`.
- **Layout:** Mobile (slot + full-page scroll) vs desktop (`ScreenContainer` with middle/bottom sections). Desktop uses `window.__desktopNav(screenId)` and `pushState` for URL; mobile uses SvelteKit routes.
- **Key files:** `src/lib/data/content.ts` (single source of truth), `src/lib/components/` (ArticleGallery, ThumbRail, Chenar, etc.), `src/lib/components/screens/` (desktop screens), `src/routes/about/[id]/`, `src/routes/sessions/[lakeId]/[sessionId]/`.

---

## Current status (as of last push)

### Build & CI

- **Lenis:** Client build externalizes `lenis`; server build uses `src/lib/lenis-ssr-stub.js`. Import map in `src/app.html` points `lenis` to `https://esm.sh/lenis@1.3.17`. CI should pass.

### Desktop – done

- **Acasa (HomeScreen):** Banner, ticker (Lenis), search bar wired to unified index, ThumbRail with `getParallaxItems()` thumbs linking to sessions/about/gallery. See `docs/ACASA-SEARCH-PROMPT.md` if needed.
- **Despre (AboutScreen):** Title “Despre Mine” (Echinos), ticker from `despre.txt`, equipment ThumbRail (variant large), bottom “Review-uri video” ThumbRail. See `docs/DESPRE-HOME-PROMPT.md`.
- **ThumbRail:** Default (100×70) and large (160×213) variants; used in HomeScreen and AboutScreen.
- **Other desktop screens:** SessionsScreen, GalleryScreen, ContactScreen (structure in place; content alignment may vary).

### Existing “article-like” pages (no generic Article yet)

- **Despre subsection:** `src/routes/about/[id]/+page.svelte` – one Chenar, hero, body (client-loaded), next-article link, **ArticleGallery** (overlay panel with photos; link to main gallery when empty). Data: `despreSubsections` from `content.ts`.
- **Session detail:** `src/routes/sessions/[lakeId]/[sessionId]/+page.svelte` – same pattern (hero, body, ArticleGallery). Data: `lakes[].sessions` (ArticleSubsection).
- **ArticleGallery.svelte:** Overlay + close button + Chenar sliding panel; grid of photos with optional `mainGalleryHref`. Used by about/[id], session detail, and gallery. No YouTube/video support yet.
- **content.ts:** Defines `Article` (id, slug, title, excerpt, date, heroDesktop, heroMobile) and `content.articles` (currently empty). Parallax items have optional `articleId`. `getDespreReviewVideoItems(base)` returns items for Review-uri video rail; doc says thumbs “will open YouTube in Photo System (when implementing Article)”.

### Not done yet

- **Generic Article:** No route or page for `content.articles` (e.g. `/article/[slug]` or similar). Parallax `articleId` and “latest articles” are not wired to a dedicated article entity.
- **Review-uri video:** Thumbs open links but are intended to “open YouTube in Photo System” when Article is implemented – i.e. embed or open YouTube in an ArticleGallery-like panel or article context.
- **Unified article/photo system:** Optional: one place (e.g. Article page or a shared “Photo System” panel) that can show photos (current ArticleGallery) and/or video (YouTube) for Despre equipment, Review-uri, or future articles.

---

## Next step: create the Article

1. **Define Article scope**
   - Option A: **Dedicated article route** – e.g. `src/routes/article/[slug]/+page.svelte` (or `/about/[id]` extended) driven by `content.articles`. One page per article: hero, body, gallery/video. Parallax items with `articleId` and “latest” thumbs link to these articles.
   - Option B: **Photo System only** – Keep Despre/session pages as-is; add support so Review-uri video thumbs open YouTube inside ArticleGallery (or a video-capable overlay). No new route.
   - Option C: **Both** – New article route for `content.articles` and extend ArticleGallery (or a shared panel) to support YouTube for Review-uri and any article that has a video.

2. **Content**
   - Populate or keep `content.articles` as source for article list/detail if using Option A or C.
   - Ensure `getDespreReviewVideoItems` items have a stable shape (e.g. `youtubeUrl`, `link`) so the UI can open YouTube in the chosen panel.

3. **UI**
   - Reuse existing patterns: Chenar, hero block, body, ArticleGallery. Add video block or embed when showing a “video article” or Review-uri item in the same panel.

4. **Desktop**
   - ThumbRail links (Acasa, Despre equipment, Review-uri video) should point to the correct destination: SvelteKit route (e.g. `base + '/article/' + slug`) or same-page overlay keyed by id. On desktop, opening an article could navigate to route or open an overlay in ScreenContainer depending on product choice.

---

## Technical reminders

- Use `base` from `$app/paths` for all links and assets.
- Loading screen is skipped for article-like and session detail pages (`isArticlePage`, `isSessionDetailPage` in `+layout.svelte`).
- ArticleGallery receives `photos`, `mainGalleryHref`; extend or add a variant for video (e.g. single YouTube embed) if needed.
- `content.ts` exports: `content`, `despreSubsections`, `getAboutEquipmentItems`, `getDespreReviewVideoItems`, `getParallaxItems`, `imgPath`, `parallaxFromLatestArticles`, etc.

---

## Docs

- `docs/DESPRE-HOME-PROMPT.md` – Despre desktop (locked).
- `docs/THUMB-RAIL-PROMPT.md` – ThumbRail implementation.
- `docs/DESKTOP-PROMPT.md` – Desktop goals and structure.
- `docs/NEXT-SESSION-PROMPT.md` – Navigation issues, polish, overall next steps.
