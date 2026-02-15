# Thumb Rail Component – Second Opinion Prompt

**LOCKED – Implemented.** The thumb rail is implemented in `ThumbRail.svelte` with zero half-cuts. Use this doc as the **canonical reference** when changing the rail or adding it to other sections. Do not revert the locked behavior below.

---

## Locked implementation (do not regress)

- **Component:** `src/lib/components/ThumbRail.svelte` — reusable; props: `items: { link, image, caption }[]`.
- **Usage:** HomeScreen bottom uses `<ThumbRail items={parallaxItems} />`; other sections can do the same.
- **Viewport:** Always `width: K×112` (exact pixels). When unmeasured, viewport uses `width: 0` so the wrapper measure is correct.
- **Content width:** Exactly N×112. Each `.thumb-link` is fixed `100px` (`flex: 0 0 100px`); label has `max-width: 100%`, `text-overflow: ellipsis`. Grid `gap: 12px` + `::after` 12px → total = N×112.
- **Math:** All snap/scroll/arrows use **computed** `viewportWidth` and **content width = items.length × 112** (no `scrollEl.clientWidth` or `scrollWidth` in logic) to avoid subpixel drift.
- **Nav:** Both prev/next buttons always in DOM (80px reserved) so viewport size never changes when arrows show/hide; buttons are disabled when not applicable.
- **Lifecycle:** Initial measure + snap in double `requestAnimationFrame`; after resize, snap in `requestAnimationFrame` so new viewport width is applied before snapping. Initial `scrollLeft = 0` then `snapScroll()`.

---

## Context

- **Project:** Pescuit în Argeș – SvelteKit (Svelte 5), adapter-static, GitHub Pages
- **Desktop layout:** `ScreenContainer` renders each screen (Home, About, Gallery, Sessions, Contact) with `section="middle"` (content) and `section="bottom"` (nav/thumbnails). The thumb rail lives in the bottom section.
- **Current location:** Reusable rail in `src/lib/components/ThumbRail.svelte`; used in `HomeScreen.svelte` bottom section.

---

## Design Specs

| Item | Value |
|------|-------|
| Thumb width | 100px |
| Gap between thumbs | 12px (var(--space-3)) |
| THUMB_UNIT | 112px (100 + 12) |
| Nav buttons | 32×32px each, gap 8px (var(--space-2)) |
| THUMB_NAV_RESERVE | 80px (32+8+8+32) for both buttons + gaps |

Each thumb: `thumb-image-wrap` 100×70px + label. Flex row with `gap: 12px`. Total content width = N×112 (via `::after` spacer 12px at end).

---

## Implementation Summary (locked)

**Structure:**
```
thumb-rail-wrap (flex, flex:1, ResizeObserver)
├── prev button (always 32px, disabled when scrollLeft ≤ 0)
├── thumb-viewport (width: K×112px, overflow:hidden)
│   └── thumb-grid (overflow-x:auto, scroll-snap-type: x mandatory)
│       ├── thumb-link × N (flex: 0 0 100px, scroll-snap-align: start)
│       └── ::after (12px → total content width N×112)
└── next button (always 32px, disabled when at end)
```

**Logic:**
1. `updateViewportWidth()`: `available = wrapEl.clientWidth - 80`, `viewportWidth = floor(available/112)*112`; then rAF → `snapScroll()` + `updateArrows()`.
2. `getVisibleUnits()` / `getMaxScroll()`: Use `viewportWidth` and `items.length * 112` only (no DOM width/scrollWidth in math).
3. `snapScroll()`: Snap to multiples of 112; in end zone snap to closer of maxSnapScroll or maxScroll.
4. `scrollend` → `snapScroll()`. Wheel on viewport → step 112 or to maxScroll; ResizeObserver/window resize → `updateViewportWidth()`.

---

## Persistent Problem: Half-Cut Thumbs

**Goal:** At no scroll position—start, middle, or end—should any thumbnail be partially visible (cut on left or right).

**Observed issues (history):**
- Right half-cuts: Viewport was growing (flex:1) when only one nav button visible, so clientWidth wasn’t a multiple of 112.
- Left half-cuts: Tried `flex: 0 0` to lock viewport; caused layout/overflow problems.
- Scroll left blocked: Snap logic always snapped to maxScroll when in end zone, undoing left scroll.
- Alternating fixes: Addressing one case often broke another (left vs right, scroll direction, resize).

**Current state:** Solved. `ThumbRail.svelte` implements the approach above; half-cuts are eliminated. Do not change the locked behavior (viewport = K×112, content = N×112, math from computed values only, both buttons always reserving space).

---

## Requirements (Mandatory)

1. **No half-cuts:** Start, middle, and end—always show only full thumbnails (or, at the very end, allow one partial on the left only if it’s the only way to show the last thumb fully).
2. **Reusable:** Must work as a shared component used in every section’s bottom area (Home, About, Gallery, Sessions, Contact).
3. **Navigation:** Prev/next arrows; mouse wheel scroll.
4. **Responsive:** Correct behavior on window resize; snap after resize.
5. **Arrows:** Show prev only when scrollLeft > 0; show next only when more content to the right.

---

## Suggested Approach

Consider:

1. **Extract** the thumb rail into `ThumbRail.svelte` (or similar) with props: `items: { link, image, caption }[]`, optional slot for search bar or other content.
2. **Guarantee viewport width = K×112:** Use a wrapper whose width is measured, then set the scroll viewport to exactly `floor(measuredWidth/112)*112` (no flex growth, no rounding errors).
3. **Simplify snap logic:** Either:
   - Use only valid scroll positions `0, 112, 224, …` up to `maxSnapScroll`, and at the end allow one extra position for last-thumb-full (with optional left partial), or
   - Rely on CSS `scroll-snap-align: start` with a viewport that is exactly a multiple of 112, and ensure content width is exactly N×112.
4. **Avoid conditional layout:** Nav buttons appearing/disappearing change available space. Consider always reserving space for both buttons (or use a different layout) so viewport size is stable.

---

## Files to Inspect

- `src/lib/components/ThumbRail.svelte` – **canonical thumb rail implementation (locked)**
- `src/lib/components/screens/HomeScreen.svelte` – uses `<ThumbRail items={parallaxItems} />` in bottom
- `src/lib/components/ScreenContainer.svelte` – how `section="bottom"` is rendered
- `src/lib/styles/tokens.css` – `--space-2`, `--space-3`
- `src/lib/data/content.ts` – `getParallaxItems()` for item shape

---

## Success Criteria

- No half-cut thumb on the **left** at any position.
- No half-cut thumb on the **right** at any position (except optionally at the very end if showing last thumb fully requires a partial on the left).
- Scroll left and right work in all cases.
- Mouse wheel scrolls the rail.
- Resize preserves correct behavior.
- Component is reusable and ready to be wired into About, Gallery, Sessions, Contact bottom sections.
