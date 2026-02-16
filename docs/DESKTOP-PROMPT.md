# Desktop version – kickoff prompt

**Copy the text below into a new conversation** to start work on the desktop version of Pescuit în Argeș.

---

## Project overview

- **Stack:** SvelteKit (Svelte 5), adapter-static, mobile-first. Deployed to GitHub Pages with `base` from `$app/paths` (e.g. `/fishing-portfolio`).
- **Layout:** `+layout.svelte` switches between mobile (slot) and desktop (`ScreenContainer`) via `isDesktopMode` (derived from `isDeviceMobile` + viewport ≥ 1024px).
- **Key files:** `src/lib/data/content.ts` (single source of truth), `src/lib/components/` (ParallaxGallery, ArticleGallery, Chenar, etc.), `src/lib/components/screens/` (desktop screens).
- **Docs:** `docs/ACASA-SEARCH-PROMPT.md`, `docs/GALLERY-PROMPT.md`, `docs/PARTIDE-PROMPT.md`, `docs/NEXT-SESSION-PROMPT.md`.

---

## Mobile – done (reference)

- **Acasa:** Wordmark intro, ticker, StackCarousel, search bar + ParallaxGallery (title + hint overlay per slide), outro. Search: unified index, deep links, Șterge to reset.
- **Despre:** Intro, equipment thumbs, outro.
- **Partide:** Home with lake blocks, Lacuri list, session detail pages.
- **Gallery:** Title, two hero images with parallax + tap → Foto/Video panels, outro.
- **Contact:** Form + outro.

---

## Desktop – current state

- **Structure:** `ScreenContainer.svelte` renders `HomeScreen`, `AboutScreen`, `SessionsScreen`, `GalleryScreen`, `ContactScreen`. Layout: middle (title + content) and bottom (nav/thumbnails) panels. Flash-style slide transitions between sections.
- **Navigation:** Desktop uses `window.__desktopNav(screenId)` – no SvelteKit routing. Header calls this for desktop. `pushState` updates URL for bookmarking.
- **HomeScreen:** Banner image, ticker, static `DEEP_LINKS` thumbs. Search bar exists but is **disabled** (placeholder). Links use hardcoded paths, not unified search.
- **GalleryScreen:** Foto/Video tabs, placeholder photos. Does not use `content.ts` gallery data or ArticleGallery pattern.
- **AboutScreen, SessionsScreen, ContactScreen:** Have middle/bottom sections; may use placeholder or partial data.

---

## Desktop – goals

1. **Acasa (HomeScreen):** Wire search bar to unified search index (same as mobile). Use `getParallaxItems`, `searchParallaxItems` from `content.ts`. Replace static `DEEP_LINKS` with search results or default parallax items. Thumbs should link to actual deep links (sessions, about, gallery).
2. **Gallery (GalleryScreen):** Use `galleryPhotoKeys`, `galleryHeroKeys`, `galleryVideos`, `galleryPhotos` from `content.ts`. Wire Foto/Video tabs to real data. Consider ArticleGallery-style panel for lightbox/detail if needed.
3. **About (AboutScreen):** Use `despreSubsections` from `content.ts`. Equipment thumbs with correct links.
4. **Partide (SessionsScreen):** Use `lakes` from `content.ts`. Lake blocks/cards linking to lake session lists.
5. **Contact (ContactScreen):** Align with mobile (form, theme).
6. **Links:** All links must use `base` from `$app/paths` for GitHub Pages.

---

## Technical reminders

- Desktop screens receive `section: 'middle' | 'bottom'` prop from ScreenContainer.
- ScreenContainer uses `pathToScreen` / `screenToPath` for URL sync. Desktop does not use SvelteKit `navigate` – it uses `pushState` and `__desktopNav`.
- Mobile routes (`src/routes/+page.svelte`, `about/+page.svelte`, etc.) are only rendered when `!isDesktopMode`. Desktop shows ScreenContainer regardless of URL path; path is synced for bookmarking.
- `content.ts` exports: `content`, `getParallaxItems`, `searchParallaxItems`, `despreSubsections`, `lakes`, `galleryPhotoKeys`, `galleryHeroKeys`, `galleryVideos`, `imgPath`, etc.

---

## Suggested order

1. **HomeScreen:** Enable search, wire to unified index, use content.ts for parallax items.
2. **GalleryScreen:** Replace placeholders with real gallery data, wire Foto/Video.
3. **AboutScreen, SessionsScreen:** Use content.ts data.
4. **ContactScreen:** Align form with mobile.
5. **Polish:** Ensure all desktop links use `base`, test transitions.
