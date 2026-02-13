# Article page – timeline and what went wrong

## Last good state (commit 3a1219d)

- **Article:** Single `+page.svelte` under `about/[id]/`. One Chenar, `<Article>` component with hero image + **hardcoded text** from `subsection.body` (content.ts). No server load, no next-article block.
- **Layout:** Root only (no `about/+layout.svelte`). Single `<slot />` in root, no `{#key pathname}`.
- **Loading:** No special handling for article routes; loading could stick if you opened an article as first load (direct URL).

So “good” = hero + inline/hardcoded text, one render, no extra layout.

---

## What we added (and what broke)

1. **Load text from assets**  
   - Added `+page.server.ts` that fetches `bodyText` from `static/assets/text-m/despre/despre_{id}.txt`.  
   - Page started using `data.bodyText` and `export let data`.

2. **Next-article hero image**  
   - Added “next article” from `despreSubsections` and a 4:3 hero image below the body.

3. **Layout / structure changes**  
   - Added `about/+layout.svelte` (pass-through `<slot />`).  
   - Tried `+page@.svelte` (breakout to root) and `{#key pathname}` to fix double render.

**Result:**  
- **Issue 1 – Stuck loading:** Loading screen stays at 0% when opening an article (direct load or refresh).  
- **Issue 2 – Double article:** Article appears twice (with a gap); navigation only updates the second block.

---

## What could be wrong (hypotheses)

### Issue 1 – Stuck loading

- **Cause:** On article URLs the root layout still shows the loading screen and waits for `LoadingScreen.onComplete` / `document.load` / `minDisplayTime`. Something in that chain doesn’t complete when the route is an article (e.g. different load order, or load function delaying “ready”).
- **Fix that works:** In root layout, treat article routes as “already loaded”: skip showing the loading screen and set `loadingComplete = true` when `pathname` matches `/about/[id]` (and in `onMount` for direct load).

### Issue 2 – Article rendered twice

- **Cause (likely):** Combination of:
  1. **Page with server load (`export let data`, `+page.server.ts`)** so SvelteKit runs load on server and client and may render the slot in two phases or two places.
  2. **Reactive layout** using `$page` (e.g. `pathname`, `isArticlePage`) and conditionals/key around `<slot />`, which is known to sometimes duplicate slot content on navigation.
  3. **Layout hierarchy:** Root → About layout → Article vs Root → Article (breakout). With breakout, the framework might still render the “segment” branch (about layout + slot) and the breakout branch, so the article appears twice.
- So the double render is likely **not** just “we added two sections in the template”, but **layout + slot + server data** together.

### Why the simple article didn’t double

- No `+page.server.ts` → no async `data`, simpler render path.  
- No extra layout (`about/+layout.svelte`) → one less level in the tree.  
- No key/conditionals around the slot in the root layout.

---

## Restore strategy

1. **Reset article to last good state:**  
   - One `about/[id]/+page.svelte` (no `+page@.svelte`): Chenar + Article with hero + `subsection.body` only.  
   - Remove `about/[id]/+page.server.ts`.  
   - Remove `about/+layout.svelte` so the tree is again Root → Article (no about layout).

2. **Keep the loading fix in the root layout:**  
   - Keep `pathname` / `isArticlePage` and the logic that skips the loading screen and sets `loadingComplete` on article routes so the loading screen never sticks on article open.

3. **Re-adding content later (safer path):**  
   - Add **only one** of: server-loaded text, next-article image, or about layout.  
   - Test after each step.  
   - If double render returns, try: no `about/+layout.svelte`, or no conditionals/key around the root `<slot />`, or loading body text in the page without a server load (e.g. fetch in `onMount` and store in a local variable).

This file is for reference only; the actual restore is done in the repo by reverting files and re-applying the loading-screen fix.
