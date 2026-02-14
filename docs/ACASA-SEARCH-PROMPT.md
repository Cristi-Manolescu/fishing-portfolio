# Acasa search bar – kickoff prompt

Use the text below (or adapt it) when implementing the search bar above the parallax gallery on the mobile Acasa (home) page.

---

## Current status

- **Stack:** SvelteKit (Svelte 5), adapter-static, mobile-first. Routes use `base` from `$app/paths` (e.g. `/fishing-portfolio` on GitHub Pages).
- **Acasa (mobile) today** – `src/routes/+page.svelte`:
  - **Screen 1:** Full-viewport spacer + fixed wordmark “Pescuit în Argeș” (with intro animation and scroll indicator).
  - **Screen 2:** Ticker text + 3D Stack Carousel (banner images from `content.carousel`).
  - **Screen 3:** **Parallax gallery** – `ParallaxGallery` with `items={parallaxItems}` and `parallaxSpeed={0.25}`. Each item is a tappable slide linking to a deep link.
  - **Screen 4:** Fixed outro (nav links + `OutroSocialWordmark`).
- **Parallax data:** `parallaxItems` comes from `getParallaxItems(true, base)` in `$lib/data/content.ts`. Each item is a `ParallaxItemResolved`: `id`, `desktopImage`, `mobileImage`, `caption`, `link` (deep link, e.g. `/sessions/ozone/s01/`, `/gallery`, `/about/delkim`), and resolved `image` (base + mobile path on this page). Source array is `content.parallax` (static list of “latest” items with captions and links).
- **ParallaxGallery** (`$lib/components/ParallaxGallery.svelte`): Receives `items` (array of `ParallaxItemResolved`), renders a vertical strip of slides; each slide is an `<a href={item.link}>` with image and parallax scroll effect. No built-in search.

---

## Last remaining action: search bar above parallax

**Goal:** On Acasa (mobile), add a **search bar above the parallax images**. The search results should **update the parallax strip**: both the images and the **deep links** shown in the strip should reflect the search (filter or replace the list passed to `ParallaxGallery`).

**Placement:** Above the parallax block, still inside the same Screen 2–3 content area (e.g. above `.screen-3-block` that wraps `ParallaxGallery`), so the flow is: **Ticker → Carousel → [Search bar] → Parallax gallery**. Visually and structurally the search bar belongs “above the parallax images” as requested.

**Behaviour:**
- User types in the search bar (e.g. by title/caption, or across a broader index – see below).
- The list of items passed to `ParallaxGallery` is updated from the search (e.g. filtered `parallaxItems` or a new list built from a search index).
- Each result must be in the same shape as `ParallaxItemResolved`: at least `image`, `caption`, `link` (and ideally `id`), so the parallax strip shows the correct image and navigates to the correct deep link on tap.

**Search scope (suggestions, to be decided):**
- **Option A – Parallax only:** Search/filter within `content.parallax` (e.g. by `caption` or `id`). Easiest; no new data.
- **Option B – Unified index:** Build a client-side search index from multiple sources and map hits to parallax shape:
  - `content.parallax` (already has image + link + caption)
  - `content.articles` (if any): map to `ParallaxItemResolved` via `parallaxFromLatestArticles`-style helper (title → caption, hero → image, slug → link)
  - `despreSubsections` (e.g. title/excerpt): map to image (e.g. `image` or despre hero) and `href` → link
  - `lakes` + sessions: lake/session titles and session links (e.g. `sessionHref`, session hero image) mapped to parallax items
- **Option C – Hybrid:** Default = current `parallaxItems`; on search, replace with results from a unified index (Option B), so the strip shows only search hits; clear search restores default.

**Technical notes:**
- Keep using `base` when building `link` and `image` so deep links and assets work on GitHub Pages.
- Acasa page already uses `getParallaxItems(true, base)`; the search-driven list can be a reactive variable (e.g. `displayParallaxItems`) that is either the default list or the search result list (same type: `ParallaxItemResolved[]`).
- Search can be client-only (no new API); index can be derived from existing content at load time or built in `content.ts` as a helper.
- **UI:** One thin line / minimal search field in section theme (e.g. similar to Contact form inputs) is enough; placeholder e.g. “Caută…” (or “Search…”). Optional: clear button, short hint that results update the strip below.

---

## Implementation order (suggested)

1. **Search bar UI** – Add a search input above `.screen-3-block` (above `ParallaxGallery`), styled to match the site (e.g. thin line in section theme). Wire a reactive query (e.g. `searchQuery`) to the input.
2. **Search logic and index** – Decide scope (A, B, or C above). Implement a function that, given the query and the chosen sources, returns an array of items in `ParallaxItemResolved` form (with `base` applied for `image` and `link`).
3. **Wire results to parallax** – On the Acasa page, derive `displayParallaxItems` from `searchQuery`: if empty, use default `parallaxItems`; otherwise use the search result list. Pass `displayParallaxItems` to `ParallaxGallery` so the strip and deep links update with search.
4. **Polish** – Empty state (e.g. “Niciun rezultat” + show default or message), accessibility (label, aria-live for result count if desired), and optional debounce for typing.

---

## Notes

- ParallaxGallery is client-loaded and uses GSAP ScrollTrigger; re-rendering with a new `items` list is supported (same component, new props).
- Keep default (no search) behaviour unchanged: same `parallaxItems` as today when the search bar is empty or cleared.
