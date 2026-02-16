# Desktop navigation – action plan

## Current situation

- Desktop section changes and first load are broken after multiple fixes (reactive URL sync, `window.location.pathname`, `skipNextPathSync`, `await goto`, double rAF, etc.).
- **Goal:** Reliable desktop behaviour: section changes work, first load shows the right section, no mixed content or flashes.

---

## Options

### Option A: Reset to last working state (no deeplinks) — **RECOMMENDED**

**What it is:** Restore `ScreenContainer` (and related) to the last committed version (**14c2d44**) and apply a **single, minimal fix**: strip `base` from the path in `onMount` so initial load shows the correct section when using a base path (e.g. GitHub Pages).

**What you get:**

- Header nav: click Acasă / Despre / Partide / Galerie / Contact → GSAP transition, then `goto()` so URL updates. **Sections change correctly.**
- First load: `onMount` reads path, strips base, sets `renderedScreen = pathToScreen(pathWithoutBase)`. **Correct section on load and refresh.**
- No reactive block that syncs `pathname` → screen (no back/forward sync, no race with `goto`).
- No `__desktopNavByPath`: Acasa ThumbRail has **no** `onItemClick`; thumbs are visual only on desktop (or you can later add a simple `__desktopNav(screenId)` by mapping link → screen).

**What you give up (for now):**

- Browser back/forward does not switch desktop section (URL changes but screen doesn’t).
- Opening a direct link to e.g. `/about/box` on desktop may not open the article (unless you keep AboutScreen URL→store sync).
- Acasa thumb clicks do not navigate to other sections on desktop (you can add that later with a simple screenId map).

**Steps:**

1. Restore `ScreenContainer.svelte` from commit **14c2d44**.
2. In `onMount`, replace  
   `const path = $page.url.pathname;`  
   with base stripping:  
   `const path = ($page.url.pathname ?? '');`  
   `const pathWithoutBase = (base && path.startsWith(base) ? path.slice(base.length) : path) || '/';`  
   and use `pathToScreen(pathWithoutBase)`.
3. Restore `HomeScreen.svelte` from **14c2d44** (removes `onThumbClick` / `__desktopNavByPath`).
4. Optionally restore `AboutScreen.svelte` from **14c2d44** if you prefer no URL→article sync; otherwise keep current AboutScreen so `/about/box` still opens the article when opened directly.

---

### Option B: Fix the current code (minimal targeted fixes)

**What it is:** Keep the current “full” design (reactive URL sync, thumb deep links, `goto` after transition) and fix only the identified bugs, with minimal changes.

**Risks:** The interaction between reactive `pathname`, `goto()`, `isTransitioning`, and `skipNextPathSync` is easy to get wrong; more band-aids can make it harder to reason about.

**If you choose this:**

1. **Single source of path in browser:** Use only `$page.url.pathname` (or only `window.location.pathname`) for “current path”, not both, and normalize once (strip base, treat `''` and `'/'` as home).
2. **No reactive overwrite after our own nav:** After `executeTransition` we call `goto()`. Either:
   - **Await `goto()`** then set `isTransitioning = false`, and **do not** run any reactive that sets `renderedScreen` from path when `isTransitioning` is true; or
   - Keep a “we just navigated” flag and **skip the next one** pathname→screen sync in the reactive.
3. **Content swap before slide-in:** After `renderedScreen = newScreen` and `tick()`, wait for the new component to be in the DOM (e.g. double rAF) before running the slide-in animation.
4. **Initial load:** In `onMount`, set `renderedScreen` from path (with base stripped). Do not rely on the reactive block for the very first paint; ensure the reactive does not run before `onMount` with a wrong path and overwrite.

---

### Option C: Rebuild navigation from scratch

**What it is:** Redesign desktop navigation with a clear, simple flow and reintroduce URL sync later.

**Suggested design:**

1. **Single source of truth:** `renderedScreen` is the only source; no reactive pathname→screen sync at first.
2. **Header nav:** On click → `navigateToScreen(screenId)` → `executeTransition()` → at end `goto(base + screenToPath(screen))`. No reactive block.
3. **Initial load:** `onMount` only: read path (strip base), set `renderedScreen = pathToScreen(pathWithoutBase)`, apply theme. Done.
4. **Thumbs:** Optional: Acasa thumbs call `__desktopNav(screenId)` where `screenId` is derived from the link (e.g. `/gallery` → `'gallery'`).
5. **Back/forward (phase 2):** Later, add a **single** listener (e.g. `popstate` or a store subscription to `$page.url`) that, when not `isTransitioning`, sets `renderedScreen` from the current path. Ensure it does not run in the same tick as the `goto()` that we triggered.

---

## Recommendation

- **Use Option A** to get a stable, predictable desktop experience quickly (correct section on load and on header nav, no flashes, no mixed content).
- Reintroduce **thumb navigation** later by mapping thumb `link` → `screenId` and calling `__desktopNav(screenId)` (no path-based API).
- Reintroduce **back/forward** and **direct-link** behaviour in a second step, with a single, well-defined sync path→screen and clear rules for when it runs.

---

## Commit reference

- **14c2d44** – “Desktop Gallery + polish: main/bottom layout, Photo System video mode, labels, ticker spacing”  
  Use this as the base for Option A (reset).
