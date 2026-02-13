import { base } from '$app/paths';

/** Load ticker text from static assets for prerender/SSR */
export async function load({ fetch }) {
	const assetBase = base + '/assets/text-m/despre/';
	let tickerTop = '';
	let tickerBottom = '';

	try {
		const [topRes, bottomRes] = await Promise.all([
			fetch(assetBase + 'despre.txt'),
			fetch(assetBase + 'despre_2.txt'),
		]);
		if (topRes.ok) tickerTop = (await topRes.text()).trim();
		if (bottomRes.ok) tickerBottom = (await bottomRes.text()).trim();
	} catch {
		// Fallback: fetch may fail during build; component will fetch client-side
	}

	return { tickerTop, tickerBottom };
}
