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
		// GitHub Pages project site: https://username.github.io/fishing-portfolio/
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/fishing-portfolio' : ''
		},
		// Prerender: ignore 404s for paths without base (crawler follows unprefixed links like /about)
		prerender: {
			handleHttpError: ({ message }) => {
				if (message?.includes('does not begin with') && message?.includes('base')) return;
				throw new Error(message);
			}
		}
	}
};

export default config;
