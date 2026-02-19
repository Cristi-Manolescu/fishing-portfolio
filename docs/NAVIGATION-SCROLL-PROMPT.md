# Navigation & scroll – investigation prompt

**Copy the text below into a new conversation** to fix the mobile section navigation scroll behaviour.

---

## Project overview

- **Stack:** SvelteKit (Svelte 5), adapter-static, mobile-first. Deployed to GitHub Pages at `https://cristi-manolescu.github.io/fishing-portfolio/` with `base` from `$app/paths` (`/fishing-portfolio`).
- **Layout:** Mobile (slot + full-page scroll) vs desktop (`ScreenContainer`). `isDesktopMode = !isDeviceMobile && $viewport.width >= 1024`.
- **Mobile sections:** Acasa (`/`), Despre (`/about`), Partide (`/sessions`), Galerie (`/gallery`), Contact (`/contact`). Each has Screen 1 (intro), Screen 2 (content), Screen 3 (outro with nav links).

---

## Current status: FIX APPLIED

Scroll-to-top on mobile section navigation. `afterNavigate` scrolls to top when:
- On mobile (`!isDesktopMode`)
- Client-side navigation (`nav.from != null`, not initial load)
- Not navigating to article or session detail pages (they handle scroll themselves)

This ensures every section (Acasa, Despre, Partide, Galerie, Contact) loads at Screen 1 when navigating from any other section.

**Previous baseline (before fix):**
- Acasa ↔ Despre: OK
- Acasa/Despre → Partide/Galerie/Contact: OK
- Partide/Galerie/Contact → any section: **still broken** – new section does not load at Screen 1 (intro)

---

## What we tried (and what to revert)

We attempted to fix a navigation scroll issue where:
- **Original problem:** When changing section from Partide/Galerie/Contact (or from their outro), the new section did not load at Screen 1 (intro) – it loaded in the middle or at the outro.
- **Working cases:** Acasa ↔ Despre, Acasa/Despre → Partide/Galerie/Contact worked correctly.

**Changes that were tried (and reverted) in `src/routes/+layout.svelte`:**

1. **beforeNavigate:** Added `window.scrollTo(0, 0)` for mobile before navigation.
2. **afterNavigate:** Added `window.scrollTo(0, 0)` plus a deferred `requestAnimationFrame(() => window.scrollTo(0, 0))` for mobile.

**Result:** These scroll manipulations caused every section change to jump to a random position. They have been reverted. The ScrollTrigger kill/refresh remains.

---

## Suggested approach for the new conversation

1. **Revert the scroll logic** in `+layout.svelte` – remove the `window.scrollTo(0, 0)` calls from both `beforeNavigate` and `afterNavigate`. Keep only the ScrollTrigger kill/refresh if that was working before.
2. **Investigate the root cause** of the original issue: why did Partide/Galerie/Contact → any section fail to load at Screen 1, while Acasa/Despre → anything worked?
3. **Consider alternatives:**
   - `history.scrollRestoration = 'manual'` for mobile only?
   - SvelteKit's `goto` with `noScroll` or similar options?
   - Scroll to top only when navigating *from* Partide/Galerie/Contact (detect previous route)?
   - Use `scrollIntoView` on the first screen element instead of `window.scrollTo`?
4. **Minimal fix:** Aim for a targeted fix that only affects the failing case (Partide/Galerie/Contact as source) without breaking Acasa/Despre navigation.

---

## Key files

- `src/routes/+layout.svelte` – `beforeNavigate`, `afterNavigate` (lines ~60–86). This is where the broken scroll logic lives.
- Mobile section pages: `+page.svelte`, `about/+page.svelte`, `sessions/+page.svelte`, `gallery/+page.svelte`, `contact/+page.svelte`.
- All use native `window` scroll (no Lenis on mobile). Desktop uses Lenis only inside ScreenContainer for tickers.

---

## Fix applied

- **Partide/Galerie/Contact → any section:** Now scrolls to top in `afterNavigate` (mobile only, when `from` is one of those routes), so the new section loads at Screen 1 (intro).
