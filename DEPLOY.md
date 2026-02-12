# Deploy & test on mobile

## 1. Lock (commit)

All Acasa changes are committed on branch `mobile-home-vnext`.

## 2. Ship (push to GitHub)

If you haven’t set a remote yet:

```bash
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/pescuit-in-arges-v2.git
```

Push (overwrites remote if you said old content can go):

```bash
git push -u origin mobile-home-vnext
```

To make this the main branch on GitHub and replace old content:

```bash
git push origin mobile-home-vnext
# Then in GitHub: Settings → Default branch → switch to mobile-home-vnext (or merge to main and push main).
```

## 3. Publish (deploy for mobile testing)

### Option A: Vercel (recommended for a quick mobile URL)

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New Project** → **Import** your `pescuit-in-arges-v2` repo.
3. Leave **Build Command** as `npm run build`, **Output Directory** as `build`.
4. Click **Deploy**. You’ll get a URL like `https://pescuit-in-arges-v2-xxx.vercel.app`.
5. Open that URL on your phone to test Acasa in real mobile conditions.

### Option B: Netlify

1. Go to [netlify.com](https://netlify.com) and sign in (e.g. with GitHub).
2. **Add new site** → **Import from Git** → choose the repo.
3. Build command: `npm run build`. Publish directory: `build`.
4. Deploy. Use the generated URL on your phone.

### Option C: GitHub Pages (root site or project site)

- **Root site** (`username.github.io`): use branch `mobile-home-vnext` (or `main`), publish from `/build`. In repo **Settings → Pages**, set source to that branch and folder.
- **Project site** (`username.github.io/repo-name`): in `svelte.config.js` set `paths.base: '/repo-name'`, then build and publish the `build` folder as above.

---

After deploy, open the site on your phone (or use Chrome DevTools device mode) to test Acasa end-to-end.
