import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		// GitHub Pages: set BASE_PATH=/fishing-portfolio when building (or we default to it in CI). Vercel/root: leave unset.
		paths: {
			base: process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS ? '/fishing-portfolio' : '')
		},
		// Prerender: allow 404s for linked routes (sessions, gallery, contact) and assets so build completes (with or without base path)
		prerender: {
			handleHttpError: ({ path, message }) => {
				if (message?.includes('does not begin with') && message?.includes('base')) return;
				if (message?.includes('404') && message?.includes('assets')) return;
				if (message?.includes('404') && path && /\/(sessions|gallery|contact)(\/|$)/.test(path)) return;
				throw new Error(message);
			}
		}
	}
};

export default config;
