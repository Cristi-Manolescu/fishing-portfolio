import path from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

let isSSR = false;

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'lenis-ssr-stub',
			configResolved(config) {
				isSSR = !!config.build?.ssr;
			},
			resolveId(id) {
				if (id !== 'lenis') return;
				if (isSSR) {
					return path.resolve(process.cwd(), 'src/lib/lenis-ssr-stub.js');
				}
				// Client: mark external so Rollup doesn't resolve (CI has no node_modules lenis); browser loads via import map
				return { id: 'lenis', external: true };
			}
		}
	]
});
