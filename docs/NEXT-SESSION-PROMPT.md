# Next session – kickoff prompt

**Copy the text below into a new conversation** to continue work on Pescuit în Argeș.

---

## Project overview

- **Stack:** SvelteKit (Svelte 5), adapter-static, mobile-first. Deployed to GitHub Pages with `base` from `$app/paths` (e.g. `/fishing-portfolio`).
- **Layout:** Mobile (slot + full-page scroll) vs desktop (`ScreenContainer` with middle/bottom sections). Desktop uses `window.__desktopNav(screenId)` and **`goto()`** for URL sync.
- **Key files:** `src/lib/data/content.ts`, `src/lib/components/` (ThumbRail, SingleImageHolder, Chenar, etc.), `src/lib/components/screens/` (HomeScreen, AboutScreen, SessionsScreen, GalleryScreen, ContactScreen), `src/lib/stores/despreArticle.ts`, `src/lib/stores/partideSession.ts`.

---

## Current status

### Mobile – done

- **Acasa:** Wordmark intro, ticker, StackCarousel, search bar + ParallaxGallery, outro.
- **Despre:** Intro, equipment thumbs, article pages at `/about/[id]` (hero, body, ArticleGallery), back link.
- **Partide:** Home with lake blocks, Lacuri list, session detail pages.
- **Gallery:** Title, Foto/Video panels, ArticleGallery-style overlay.
- **Contact:** Form + outro.

### Desktop – done so far

- **ScreenContainer:** Section transitions, URL sync via `goto(base + path)`, title area (wordmark/article/session title per screen).
- **Acasa (HomeScreen):** Banner, ticker (Lenis), search bar + index, ThumbRail with parallax items.
- **Despre (AboutScreen):** Despre home (ticker + equipment ThumbRail large), bottom Review-uri video rail. Article in-place with slide-out/slide-in animations, back/next nav, body (Lenis), bottom gallery thumbs → **SingleImageHolder** (Photo System) per thumb. Store: `despreArticle.ts`.
- **Partide (SessionsScreen):** Partide home (lake title + ticker from `assets/text/partide/{lakeId}.txt`, lake ThumbRail large with activeIndex/onNavigate, same no-half-cut as Despre), bottom “SESIUNI · {lake title}” + session thumbs (default size). Session article in-place (same animation pattern as Despre), bottom gallery → SingleImageHolder. Store: `partideSession.ts` (partideActiveLakeIndex, selectedPartideSession).
- **ThumbRail:** Default and large variants; `activeIndex` + `onNavigate` for Partide lake strip; optional `onItemClick`.
- **SingleImageHolder (Photo System):** Standalone overlay (in front of main/bottom), Chenar style, one image, prev/next inside holder, full-mode (scale + hover pan), **maximize/minimize button** (currently top-right).
- **GalleryScreen, ContactScreen:** Structure in place; Gallery desktop not yet aligned with mobile.

---

## Next big step: Gallery section

- **Goal:** Bring desktop Gallery in line with mobile and with the same patterns as Despre/Partide (main holder + bottom holder, ticker if needed, thumbs, optional in-place detail or overlay).
- **Reference:** `docs/GALLERY-PROMPT.md`, mobile gallery (Foto/Video panels, ArticleGallery), existing GalleryScreen.svelte.

---

## Remaining polish (do before or alongside Gallery)

### 1. Ticker scrollbar – space between text and scrollbar

- **Where:** All main sections that have a ticker (Acasa, Despre home, Partide home).
- **Goal:** Add space between the ticker text and the scrollbar, similar to the Article body scroll area.
- **Hint:** Add horizontal padding/margin on the scroll container so the scrollbar is not flush against the text (e.g. `padding-right` on `.desktop-ticker-scroll` or the Lenis wrapper in HomeScreen, AboutScreen, SessionsScreen).

### 2. Big thumbs (Despre + Partide) – clipped at top

- **Where:** Main holder ThumbRail with `variant="large"` (Despre equipment rail, Partide lake rail).
- **Issue:** Thumbs are clipped at the top.
- **Goal:** Reduce the large thumb’s **height by 10px** so they are fully visible. ThumbRail large variant uses `.variant-large .thumb-image-wrap { width: 160px; height: 213px; }` (3:4). Reduce height to 203px (or width/height proportionally) in `src/lib/components/ThumbRail.svelte`.

### 3. Photo System – maximize/minimize button position

- **Where:** `SingleImageHolder.svelte` – the full-mode toggle (maximize/minimize) is currently in the **top-right**, which looks like a close button.
- **Goal:** Move the maximize/minimize button to the **bottom**, on the **same X position as the nav right button** (next arrow), so it’s clearly a zoom control, not close.
- **Hint:** Position the button in the bottom row near the next (›) button, e.g. bottom-right aligned with the nav area.

---

## Technical reminders

- Use `base` from `$app/paths` for all links and assets.
- Desktop ticker uses Lenis; wrapper = scroll container (e.g. `.desktop-ticker-scroll`), content = inner div. Article body scroll uses same Lenis pattern; scrollbar styling: `scrollbar-width: thin`, `scrollbar-color`, webkit scrollbar (6px, track transparent, thumb accent + hover).
- ThumbRail: `variant="large"` → 160×213 thumb image wrap, gap 16px, unit 176px. Change height in `.variant-large .thumb-image-wrap` and ensure `.variant-large .thumb-link` min-width/height stay consistent if needed.
- SingleImageHolder: receives `open`, `onClose`, `images`, `currentIndex`, `onNavigate`; full mode state and zoom button are internal.

---

## Suggested order for the new session

1. **Polish:** (1) Ticker scrollbar spacing in Acasa, Despre, Partide main sections. (2) ThumbRail large thumb height −10px. (3) SingleImageHolder maximize/minimize button → bottom, same X as nav right.
2. **Gallery:** Desktop Gallery section (main + bottom layout, content, and behaviour aligned with mobile and with Despre/Partide patterns).
