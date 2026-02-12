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
		// Root base for Vercel/Netlify/GitHub Pages root deploy; set to '/repo-name' for GitHub project pages
		paths: {
			base: ''
		}
	}
};

export default config;
