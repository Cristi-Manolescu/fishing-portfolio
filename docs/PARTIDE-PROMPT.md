# Partide section – kickoff prompt

Use the text below (or adapt it) when starting work on the Partide section.

---

## Prompt

We're implementing the **Partide** (sessions) section. Current status:

- **Stack:** SvelteKit (Svelte 5), adapter-static, mobile-first. Routes use `base` from `$app/paths` (e.g. `/fishing-portfolio` on GitHub Pages).
- **Existing patterns to reuse:**
  - **Despre (About)** has a 3-level flow we can mirror: **Home (index)** → **Sub-section list** (e.g. equipment thumbs) → **Article** (single item with hero, body, gallery, back link, next-article). Article page: `src/routes/about/[id]/+page.svelte`; content: `src/lib/data/content.ts` (`despreSubsections`); internal gallery: `ArticleGallery.svelte`; body text from `assets/text-m/despre/despre_{id}.txt`.
  - **Navigation:** Header and links use `base + path`. Back-from-article scrolls to the clicked thumb on the index (hash `#id` + `scrollIntoView`).
  - **Layout:** Mobile uses full-screen sections and Chenar; desktop uses `ScreenContainer` with screen IDs. Theme/BG per section in `$lib/stores/theme.ts` (e.g. `sessions` theme already exists).

**Partide structure (3 levels):**

1. **Level 1 – Partide Home**  
   Entry for the section (e.g. `/sessions` or `/partide`). Intro + entry to “Lacuri” (lakes).

2. **Level 2 – Lacuri (sub-section)**  
   List of lakes (e.g. MV, Ozone, Teiu, Varlaam). Each lake is a card/thumb that links to that lake’s partide list.  
   Similar to Despre index with equipment thumbs, but items are lakes.

3. **Level 3 – Partide for one lake**  
   List of sessions for the chosen lake (like “articles” for that lake). Each session is like the current Article: hero, body, optional gallery, back link (to Lacuri with hash so we scroll to the clicked lake), next-session link.  
   Reuse Article-style layout and `ArticleGallery`; content can be driven by data (e.g. `content.ts` + optional text files under `assets/text-m/`).

**Requirements:**

- Reuse Despre/Article patterns: route layout, Chenar, hero block, body (client-loaded text if we want), internal gallery per session, back = “Lacuri < Lake name” and scroll-to-lake on index, next-session link at bottom.
- Content model: define in `content.ts` (e.g. `lakes` with `id`, `title`, `href`, `image`; each lake has `sessions[]` with `id`, `title`, `date`, `body`, `image`, `galleryKeys`?). Asset paths: reuse `imgPath`-style helpers for partide (e.g. hero, full-size gallery).
- Mobile: same UX as Despre (full-screen feel, ticker/body justify where applicable, gallery panel with safe-area for close button).
- Desktop: integrate with existing `ScreenContainer` / navigation so Partide is a screen and links work with `base`.

Implement Partide step by step: (1) data + routes skeleton, (2) Partide Home + Lacuri list, (3) Partide-per-lake page (session list + session “article” view), then polish (back link, scroll-to-lake, next-session, gallery, BGs).

---

## Notes

- Sessions theme and `getThemeFromRoute` for `/sessions` already exist in the codebase.
- Prerender allows 404 for `/sessions` and `/sessions/*` so static build succeeds before all session pages exist.
- For “current Article” style session detail, mirror `about/[id]` and re-use `ArticleGallery` and scroll-lock behavior.
- **Parallax in Partide:** To replicate Acasa’s no-gaps parallax on the Lakes session list, use the dedicated prompt in `docs/PARALLAX-PARTIDE-PROMPT.md`.
