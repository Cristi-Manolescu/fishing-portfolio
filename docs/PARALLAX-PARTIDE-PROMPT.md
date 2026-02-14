# Parallax: replicate Acasa in Partide (no gaps)

Use this prompt to **start a new conversation** so the Partide Lakes section uses the exact same Parallax behavior as Acasa: **no gaps between images** on normal scroll, refresh, or screen orientation switch. Acasa must not be changed.

---

## Current status

- **Acasa (reference – do not modify):**  
  `src/routes/+page.svelte` uses ParallaxGallery in Screen 3. Structure:  
  `<section class="screen screen-2-3">` → `<Chenar>` → `<div class="screen-2-3-content">` → `<div class="screen-3-block">` (only `width: 100%`) → `<ParallaxGallery items={...} parallaxSpeed={0.25} />`.  
  ParallaxGallery is **statically imported**. No gaps on scroll, refresh, or orientation change.

- **ParallaxGallery** (`src/lib/components/ParallaxGallery.svelte`):  
  `.parallax-track` has `gap: 0`, `line-height: 0`. On `resize` and `orientationchange` it kills ScrollTrigger and re-inits parallax (150ms delay on orientationchange). Portrait/landscape aspect and padding are handled inside the component. **Do not change this component in a way that breaks Acasa.**

- **Partide Lakes (target):**  
  `src/routes/sessions/[lakeId]/+page.svelte` shows the session list for one lake. ParallaxGallery is **dynamically imported in onMount** (to avoid SSR/500) and rendered with `<svelte:component this={ParallaxGallery} ... />` inside `<div class="lake-sessions-parallax">` (currently `width: 100%` only). The parent `.lake-sessions-inner` has `padding: 0 var(--space-4)`, so the gallery is inside a padded container (unlike Acasa, where the parallax wrapper has no horizontal padding from its parent). Result: layout is not identical to Acasa; gaps or layout issues can appear on refresh or orientation switch.

---

## Copy-paste prompt for the new conversation

```
Apply the exact Parallax working method from Acasa to the Partide Lakes section.

Requirements:
- No gaps between images in all cases: normal scroll, refresh, and screen orientation switch.
- Acasa already implements this and works perfectly. Do not change Acasa (src/routes/+page.svelte) or the ParallaxGallery component in a way that breaks it.
- Only replicate the same behavior and layout in Partide: same DOM/wrapper structure and CSS context so ParallaxGallery behaves identically on the lake session list page.

Reference (Acasa):
- src/routes/+page.svelte: Screen 3 uses <div class="screen-3-block"> (width: 100% only) wrapping <ParallaxGallery items={parallaxItems} parallaxSpeed={0.25} />. ParallaxGallery is statically imported. Parent .screen-2-3-content has no horizontal padding; only .screen-2-block has padded content. So the parallax block is full-width.
- src/lib/components/ParallaxGallery.svelte: .parallax-track has gap: 0, line-height: 0; resize and orientationchange listeners kill ScrollTrigger and re-init (150ms delay on orientationchange). Portrait/landscape aspect and padding are handled inside the component.

Target (Partide):
- src/routes/sessions/[lakeId]/+page.svelte: Lake session list. ParallaxGallery is dynamically imported in onMount and rendered inside .lake-sessions-parallax. Parent .lake-sessions-inner has padding. Make the Lake section use the exact same integration method as Acasa (same wrapper semantics and width context so there are no variable gaps and layout is bulletproof on orientation switch and refresh). If dynamic import is required for SSR, keep it but ensure the surrounding structure matches Acasa's so ParallaxGallery gets the same layout context.
```
