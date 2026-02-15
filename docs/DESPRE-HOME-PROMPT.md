# Despre Home (Desktop) – Locked

**LOCKED – Implemented.** Use this doc as the canonical reference for the Despre desktop screen. Do not regress the locked behavior.

---

## Locked implementation

### Title
- **ScreenContainer:** Despre screen uses the same Echinos (script) font as Acasa: `<h1 class="wordmark">Despre Mine</h1>`.

### Middle section
- **Left:** Ticker loaded from `static/assets/text/despre.txt`. Same behaviour as Acasa white ticker: Lenis smooth scroll (lerp 0.07, duration 1.4), wheel scroll, paragraphs split by double newline.
- **Right:** Equipment rail = **ThumbRail** with `variant="large"` (160×213px thumbs, 3:4 format, unit 176px). Items from `getAboutEquipmentItems(base, true)` (desktop hero images: `imgPath.despreEquipmentHeroDesktop(id)`).

### Bottom section (continuity with Acasa)
- **Layout:** Same as Acasa bottom: fixed-width left column (200px), then ThumbRail.
- **Left (200px):** Label **"Review-uri video"** only. Same font as former CTA: `font-size-sm`, `font-weight: 500`, uppercase, letter-spacing 0.08em.
- **Right:** **ThumbRail** (default variant, 100×70) with **Review-uri video** items from `getDespreReviewVideoItems(base)`. Hero images = same as equipment (desktop hero) until dedicated video assets exist.
- **No CTA button.** Removed "Vezi toate articolele" and scroll-to-equipment behaviour.
- **Thumbs:** Each small thumb will open a YouTube link inside the Photo System (to be wired when implementing Article).

### Content (content.ts)
- `despreTickerPath = '/assets/text/despre.txt'`
- `imgPath.despreEquipmentHeroDesktop(id)` → `/assets/img/content/despre/{id}/hero/{id}__hero.avif`
- `getAboutEquipmentItems(base, useDesktopHero)` – when true, uses desktop hero path.
- `getDespreReviewVideoItems(base)` → `{ link, image, caption }[]` for Review-uri video rail; reuses equipment desktop heroes and equipment links (YouTube/Photo System to be added in Article work).

### ThumbRail
- **variant="large":** 160px wide, 213px tall (3:4), gap 16px, unit 176px. Used for Despre middle equipment rail.

---

## Files

- `src/lib/components/screens/AboutScreen.svelte` – Despre middle (ticker + ThumbRail large) and bottom (label + ThumbRail)
- `src/lib/components/ScreenContainer.svelte` – Despre title wordmark
- `src/lib/components/ThumbRail.svelte` – default + large variant
- `src/lib/data/content.ts` – despre paths and getters
