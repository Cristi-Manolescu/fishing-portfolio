# Final session – last steps before site done

**Copy the text below into a new conversation** to finish Pescuit în Argeș.

---

## Project overview

- **Stack:** SvelteKit (Svelte 5), adapter-static, mobile-first. Deployed to GitHub Pages at `https://cristi-manolescu.github.io/fishing-portfolio/` with `base` from `$app/paths` (`/fishing-portfolio`).
- **Layout:** Mobile (slot + full-page scroll) vs desktop (`ScreenContainer` with middle/bottom sections). Layout uses `isDesktopMode = !isDeviceMobile && $viewport.width >= 1024` to choose which to show.
- **Device detection:** `src/lib/stores/device.ts` – `isDeviceMobile` (UA + screen, static), `viewport` (reactive), `isMobile` (derived: width < 768).
- **Key files:** `src/lib/data/content.ts` (asset paths, `getParallaxItems`, `getCarouselImages`, `searchParallaxItems`, `getBackgroundPath`), `src/lib/stores/theme.ts` (`getBackgroundPath(themeId, isMobile)`), `src/routes/+page.svelte` (mobile home), `src/lib/components/screens/HomeScreen.svelte` (desktop Acasa).

---

## Current status

The site is **solid and deployed**. Mobile and desktop flows work: section transitions, deeplinks with animation, search bar (Caută/Șterge), article-from-start on thumb nav. Two remaining tasks before declaring done.

---

## Task 1: Differentiate desktop vs mobile assets (priority)

**Problem:** There is a mix of loading mobile assets on desktop and vice versa. Assets should be strictly separated by layout.

**Asset selection pattern in content.ts:**
- `getParallaxItems(isMobile, base)` – uses `isMobile ? item.mobileImage : item.desktopImage`
- `getCarouselImages(isMobile, base)` – same
- `getBackgroundPath(themeId, isMobile)` – `/assets/bg/` vs `/assets/bg-m/`
- `getAboutEquipmentItems(base, useDesktopHero)` – equipment thumbs
- `buildSearchIndex(isMobile, base)` / `searchParallaxItems(query, isMobile, base)` – search results

**Current usage (audit these):**
- **Mobile home (+page.svelte):** `getParallaxItems(true, base)` (hardcoded), `getCarouselImages(getIsMobileRuntime(), base)` (deferred for hydration). Mobile layout only.
- **Desktop HomeScreen:** `getParallaxItems(false, base)`, `getCarouselImages(false, base)`, `searchParallaxItems(..., false, base)`. Desktop layout only.
- **ScreenContainer:** `getBackgroundPath(..., isDeviceMobile)` – uses device, not layout. Desktop layout shows ScreenContainer; consider whether BGs should use `false` when in desktop mode.
- **Layout:** `mobileBgPath` uses `!isDesktopMode` for `getBackgroundPath` – correct for mobile slot.
- **Other routes (about, sessions, gallery, contact):** Check if they use `getParallaxItems`, `getCarouselImages`, or similar with the correct flag. These are mobile-only (slot) when `!isDesktopMode`.

**Suggested approach:**
1. Define a single source of truth for “are we in desktop layout?” – e.g. `isDesktopMode` from layout or a store. Use it consistently for asset selection.
2. Audit every call to `getParallaxItems`, `getCarouselImages`, `getBackgroundPath`, `getAboutEquipmentItems`, `searchParallaxItems`, `buildSearchIndex`. Ensure the `isMobile` / `useDesktopHero` flag matches the actual layout (desktop = false, mobile = true).
3. Fix any mismatches. Consider: when `isDesktopMode` is true, we never render the mobile slot, so desktop components should always pass `false`. When `isDesktopMode` is false, we render the slot (mobile pages), so they should pass `true`.
4. SSR/hydration: avoid layout-dependent asset choice during SSR if it causes hydration mismatch. Mobile +page uses `getIsMobileRuntime()` to defer; ensure no flash of wrong assets.

---

## Task 2: Outro elements visible and stuck (low occurrence)

**Problem:** After long navigation through sections, when entering a news section (article page, e.g. `/about/box` or `/sessions/ozone/s01`), elements from the Outro screen become visible and cannot be hidden by normal scrolling. Section change or refresh fixes it.

**Context:**
- **Mobile home (+page.svelte):** Screen 4 (Outro) – `screen4FixedVisible` controlled by GSAP ScrollTrigger. `onEnter` → true, `onLeaveBack` → false. Cleanup in `onDestroy`: `screen4ScrollTriggerCleanup?.()` kills the ScrollTrigger.
- **Other mobile pages** (about, sessions, gallery, contact) also include `OutroSocialWordmark` in their layout.
- Bug occurs “usually after a long time navigation” – suggests possible ScrollTrigger leak, state not reset on route change, or z-index/stacking issue.

**Likely areas:**
1. **ScrollTrigger lifecycle:** When navigating away from home, is the ScrollTrigger always killed? Check `onDestroy` and whether SvelteKit’s client nav fully unmounts the home page.
2. **screen4FixedVisible:** If it stays `true` when it shouldn’t, the Outro would remain visible. Could a ScrollTrigger fire `onEnter` without a matching `onLeaveBack` after many navigations?
3. **Shared/global state:** Is `screen4FixedVisible` or similar stored globally? If so, it might persist across route changes.
4. **Z-index / fixed positioning:** Could the Outro’s fixed layer bleed through on article pages due to stacking context?
5. **ScrollTrigger.refresh():** After many navigations, ScrollTrigger’s internal state might get out of sync. Consider calling `ScrollTrigger.refresh()` on route change or ensuring all triggers are properly killed.

**Suggested approach:**
1. Add defensive cleanup: on route change (e.g. in layout or a store subscription to `$page`), kill any ScrollTriggers tied to the previous page and reset `screen4FixedVisible` if it’s in a shared store.
2. Ensure the home page’s `onDestroy` always runs and that `screen4ScrollTriggerCleanup` is invoked.
3. If the bug is hard to reproduce, add logging around ScrollTrigger create/kill and `screen4FixedVisible` changes to capture the failing case.

---

## Suggested order

1. **Task 1 (assets):** Audit and fix desktop/mobile asset selection. Higher impact, clearer scope.
2. **Task 2 (Outro bug):** Add defensive cleanup and verify ScrollTrigger lifecycle. Lower occurrence but important for polish.

---

## Other references

- `content.ts`: `UI_BASE_DESKTOP` vs `UI_BASE_MOBILE`, `IMG_BASE` vs `IMG_BASE_MOBILE` for asset paths.
- `theme.ts`: `getBackgroundPath(themeId, isMobile)` returns `/assets/bg/` or `/assets/bg-m/`.
- Desktop nav: `ScreenContainer`, `__desktopNav`, `__desktopNavByPath`, no reactive path sync (onMount, popstate, executeTransition only).
- Use `base` from `$app/paths` for all links and assets.
