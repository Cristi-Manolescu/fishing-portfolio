# Step 1 — Scaling source audit report

## Searched for:
- style.zoom / zoom:
- transform: scale / scale( / matrix(
- document.documentElement.style.transform
- meta[name="viewport"] modifications
- visualViewport.scale
- applyOrientation, applyLayout, fit, scale, viewport, setZoom, setScale

## Matches that can affect page scale:

| File | Line | Finding |
|------|------|---------|
| index.html | 5 | `<meta name="viewport" content="width=device-width, initial-scale=1.0">` — static, no JS modification |
| svg-header.js | 210 | `applyOrientation(immediate)` — updates header SVG viewBox/height via GSAP, NOT document zoom |
| svg-header.js | 196,201,203 | `header.svg` gets `height: h` via gsap.set/to — targets header SVG only |
| content-frame.js | 899,908 | `attr: { scale: ... }` — SVG feDisplacementMap filter attribute, NOT page zoom |
| router.js | 172 | `document.documentElement.style.setProperty('--accent-color', ...)` — CSS variable only |
| router.js | 77 | `document.body.style.backgroundImage` — background only |

## Conclusion:
**No code in this repo explicitly sets document zoom, transform:scale on html/body, or modifies meta viewport at runtime.** The zoom regression may be a browser-side reaction to rapid resize/GSAP updates, or from an external dependency (GSAP/ScrollTrigger).

---

# Step 3 — Rollback summary (no git available)

## Reverted changes (svg-header.js)

| Removed | Reason |
|---------|--------|
| `gsap.killTweensOf(header.svg)` | Part of orientation "fix" that may have triggered cascade |
| `immediate` parameter / `gsap.set` branch | Prevent animation during resize — removed to restore simple behavior |
| `scheduleApply()` + rAF coalescing | Resize coalescing — removed, use direct `applyOrientation` on resize |
| `window.addEventListener('resize', scheduleApply)` | Replaced with direct `applyOrientation` |

## Current state (post-chenar)
- Single `resize` listener calling `applyOrientation` directly
- `setViewBoxAndHeight(portrait)` uses `gsap.to` only
- No orientationchange listener
- No visualViewport logic
- No meta viewport modifications

## Debug (temporary)
- `debugScaleAssertions()` runs on resize + orientationchange, logs zoom/transform/viewport (visualViewport removed)
