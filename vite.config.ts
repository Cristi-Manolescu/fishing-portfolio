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
				if (id === 'lenis' && isSSR) {
					return path.resolve(process.cwd(), 'src/lib/lenis-ssr-stub.js');
				}
			}
		}
	]
});
