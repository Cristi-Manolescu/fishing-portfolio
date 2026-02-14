# Gallery section – kickoff prompt

Use the text below (or adapt it) when starting work on the Gallery section (mobile).

---

## Current status

- **Stack:** SvelteKit (Svelte 5), adapter-static, mobile-first. Routes use `base` from `$app/paths` (e.g. `/fishing-portfolio` on GitHub Pages).
- **Gallery today:**
  - **Desktop:** `ScreenContainer` shows `GalleryScreen` when path is `/gallery`. `GalleryScreen.svelte` has middle/bottom sections with placeholder photos and Foto/Video tabs; it is desktop-oriented and not the target mobile layout.
  - **Mobile:** There is **no** dedicated mobile route for `/gallery`. Links point to `/gallery`; we need a mobile Gallery page (e.g. `src/routes/gallery/+page.svelte`) that matches the structure below.
- **Patterns to reuse:**
  - **Partide Home** (`src/routes/sessions/+page.svelte`): Screen 1 = title only (e.g. “Partide”) in a Chenar; Screen 2 = content in the same Chenar; Screen 3 = fixed outro (nav + wordmark). Same scroll/outro pattern as Despre.
  - **Partide Lakes** (`sessions/[lakeId]/+page.svelte`): Two full-screen hero images with **parallax** via `ParallaxGallery` (client-loaded, same layout as Acasa: full-width block, no gaps).
  - **Article gallery** (`ArticleGallery.svelte`): Sliding panel from the right, close button in a flex row with the panel (iOS-safe), scroll-lock, grid of images. Takes `open`, `onClose`, `images`, `title`, `mainGalleryHref`.
- **Theme:** `gallery` theme and `getThemeFromRoute` for `/gallery` exist in `$lib/stores/theme.ts`. Layout applies theme when route is `/gallery`.

---

## Gallery structure (mobile) – one section, three screens

One single section combining elements from **Partide Lakes** (title + parallax heroes) and **Article’s Gallery** (sliding panel).

1. **Screen 1 – Title only**  
   Same as Partide or Despre home: one Chenar, title “Galerie” (or chosen label) only. Optional scroll hint.

2. **Screen 2 – Two full-screen hero images + parallax**  
   - **One Chenar** for all Screen 2 content.
   - **Two hero images**, each full-screen (or near full-screen) with **parallax movement** (reuse the same parallax approach as Partide Lakes / Acasa so there are no gaps).
   - **Tap on image 1:** the **gallery panel** slides in (same UX as Article gallery), populated with **Photos** (list of photo images).
   - **Tap on image 2:** the **gallery panel** slides in, populated with **hero images of YouTube videos** (each item can link to a YouTube URL or embed; panel shows hero/thumb images for each video).
   - Reuse **ArticleGallery** (or the same sliding-panel + close behaviour) for both panels; only the **content** (photos vs. video heroes) and optionally the title/label change.

3. **Screen 3 – Outro**  
   Same as Partide or Despre: fixed layer with nav links and wordmark “Pescuit în Argeș” in a Chenar at the bottom.

---

## Requirements

- **Route:** Mobile Gallery at `/gallery` (e.g. `src/routes/gallery/+page.svelte`). Desktop can keep using `ScreenContainer` + current `GalleryScreen` when `isDesktopMode` is true; layout already chooses slot vs. ScreenContainer by mode.
- **Screen 1:** Title-only block inside a single Chenar, same visual pattern as Partide/Despre home.
- **Screen 2:** One Chenar containing:
  - Two hero images with parallax (no gaps; same wrapper/layout as Partide Lakes parallax block).
  - Each hero is tappable; tap opens the sliding gallery panel with the corresponding content (photos vs. video heroes).
- **Sliding panel:** Reuse **ArticleGallery** (or equivalent): same close button + panel layout (flex row, iOS-safe), scroll-lock, grid. Two “modes”:
  - **Photos:** `images` = list of photo image URLs (from content or config).
  - **Videos:** `images` = list of hero/thumb image URLs for YouTube videos; each item can have a `link` (e.g. YouTube URL) so the panel shows hero images and links out to video (or embed in a later iteration).
- **Screen 3:** Same outro as Partide/Despre (fixed nav + wordmark).
- **Content / data:** Define in `content.ts` (or a dedicated gallery config):
  - **Photo set:** e.g. list of image URLs (or keys and an `imgPath`-style helper) for the “Photos” panel.
  - **Video set:** e.g. list of items with `id`, `title`, `heroImage`, `youtubeUrl` (or similar) for the “YouTube heroes” panel.
- **Assets:** Reuse existing path patterns (e.g. `assets/img-m/...` for mobile). Decide where gallery photos and video hero images live (e.g. `assets/img-m/content/gallery/...`).
- **Navigation:** All links use `base + path`. Header already has “Galerie” linking to `/gallery`.

---

## Implementation order (suggested)

1. **Data + route** – Add gallery data (photos list, video list with hero images + URLs) in `content.ts` or a small gallery config; add `src/routes/gallery/+page.svelte` for mobile with Screen 1 (title) + placeholder for Screen 2.
2. **Screen 2 layout** – One Chenar, two full-screen hero images with parallax (reuse ParallaxGallery or the same two-item parallax behaviour and layout so it’s gap-free).
3. **Tap → panel** – Wire tap on hero 1 to open ArticleGallery (or same component) with photo set; tap on hero 2 to open with video-hero set. Reuse existing ArticleGallery props (`open`, `onClose`, `images`, `title`); for videos, `images` can be the hero image list and items can have a `link` for the YouTube URL.
4. **Screen 3** – Reuse the same Screen 3 pattern as Partide/Despre (fixed outro with nav + wordmark).
5. **Polish** – Labels (“Foto” / “Video”), accessibility, and any YouTube embed or external link behaviour.

---

## Notes

- Prerender: if `/gallery` is added as a route, ensure the static adapter/prerender config allows it (same as for `/sessions`).
- Gallery theme and BG are already defined; layout applies them for `/gallery`.
- Keep desktop behaviour unchanged: `ScreenContainer` + `GalleryScreen` for `/gallery` when not in mobile mode.
