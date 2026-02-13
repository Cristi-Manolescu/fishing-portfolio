# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv create --template minimal --types ts --no-install pescuit-in-arges-v2
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Deploy for mobile testing (lock, ship, publish)

1. **Lock** – Dependencies are locked with `package-lock.json`. To refresh and lock:
   ```sh
   npm install
   ```

2. **Ship** – Production build (output in `build/`):
   ```sh
   npm run build
   ```
   Test locally:
   ```sh
   npm run preview
   ```

3. **Publish** – Deploy to Vercel for a live URL (ideal for real device testing):
   - Install Vercel CLI once: `npm i -g vercel`
   - From the project root: `vercel` (follow prompts) or `vercel --prod` for production
   - Or connect the repo at [vercel.com](https://vercel.com); builds run on push.

   The project has `vercel.json` (build: `npm run build`, output: `build`). The app is built with **base path `''`** (root), so the live site will be at `https://your-project.vercel.app/`. For GitHub Pages, set env `BASE_PATH=/your-repo` in the build.
