# Next session – kickoff prompt

**Copy the text below into a new conversation** to continue work on Pescuit în Argeș.

---

## Project overview

- **Stack:** SvelteKit (Svelte 5), adapter-static, mobile-first. Deployed to GitHub Pages with `base` from `$app/paths` (e.g. `/fishing-portfolio`).
- **Structure:** Layout switches between mobile (slot) and desktop (`ScreenContainer`) via `isDesktopMode`. Mobile uses full-page scroll with Chenar, intro/outro screens, and GSAP ScrollTrigger.
- **Key files:** `src/lib/data/content.ts` (single source of truth), `src/lib/components/` (ParallaxGallery, ArticleGallery, OutroSocialWordmark, etc.), `src/routes/` (Acasa, About, Sessions, Gallery, Contact).
- **Docs:** `docs/ACASA-SEARCH-PROMPT.md`, `docs/GALLERY-PROMPT.md`, `docs/PARTIDE-PROMPT.md`, `docs/PARALLAX-PARTIDE-PROMPT.md`.

---

## Current status (last good commit: db2a969)

### Mobile – done

- **Acasa:** Screen 1 (wordmark + intro), Screen 2 (ticker + StackCarousel), Screen 3 (search bar + ParallaxGallery), Screen 4 (outro). Search bar: search-on-submit (Caută), unified index (parallax + despre + sessions + gallery), deep links, Șterge to reset.
- **Despre:** Intro, equipment thumbs, outro.
- **Partide:** Home with lake blocks, Lacuri list, session detail pages.
- **Gallery:** Screen 1 title, Screen 2 (two hero images with parallax + tap → Foto/Video panels), Screen 3 outro.
- **Contact:** Form + outro.

### Desktop – pending

- Desktop uses `ScreenContainer` with `HomeScreen`, `AboutScreen`, `SessionsScreen`, `GalleryScreen`, `ContactScreen` (middle/bottom split). These are desktop-oriented and may need alignment with the mobile experience.

---

## Known issues (not yet fixed)

An earlier attempt to fix these caused navigation regressions and was reverted. Any future fix should be tested carefully (especially on iOS Chrome):

1. **Navigation from outro → other section:** When outro is active and user taps Despre/Partide, jumping to intro sometimes shows all elements without reveal animations.
2. **Outro stuck:** Occasionally, after section change, the page remains in the outro state of the new section (rarer on most browsers, more frequent on iOS Chrome).
3. **Wordmark visibility:** Rarely, the wordmark inside the outro screen does not hide when navigating away (more frequent on iOS Chrome).

---

## Optional polish (deferred)

- Add a small caption/hint in Acasa and Partide Lakes sections, similar to Gallery’s “Apasa pentru galerie” (e.g. “Apasă pe o imagine pentru a naviga” above parallax, “Apasă pentru partide” on lake images). These were reverted with the navigation changes.

---

## Next steps (suggested order)

1. **Desktop version:** Bring desktop layout and UX in line with the mobile feature set (search bar, parity across sections). Use `docs/GALLERY-PROMPT.md`, `docs/PARTIDE-PROMPT.md` as reference for patterns.
2. **Navigation bugs:** Revisit the intro/outro navigation issues with a minimal, well-tested approach (scroll reset, ScrollTrigger refresh, etc.) and verify on iOS Chrome.
3. **Polish:** Reintroduce the Acasa/Partide captions once navigation is stable.

---

## Technical reminders

- Use `base` from `$app/paths` for all links and image URLs (GitHub Pages).
- ParallaxGallery re-initializes when `items` changes; it uses GSAP ScrollTrigger.
- Section pages use `screen4FixedVisible` / `screen3FixedVisible` driven by ScrollTrigger (`start: 'bottom bottom'`, `end: 'bottom top'`).
- About and Partide support hash navigation (e.g. `/about#delfin`, `/sessions#ozone`) to scroll to a specific item.
