import { despreSubsections, lakes, sessionHref } from '$lib/data/content';

export const SITE_URL = 'https://pescuitinarges.ro';
export const SITE_NAME = 'Pescuit în Arges';
export const SITE_LOCALE = 'ro_RO';

/** Set PUBLIC_GOOGLE_SITE_VERIFICATION in env (GitHub secret) after registering in Search Console. */
export const GOOGLE_SITE_VERIFICATION =
	(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_GOOGLE_SITE_VERIFICATION) || '';

export const DEFAULT_DESCRIPTION =
	'Jurnal de pescuit pe apele Argeșului – partide, echipament, galerie foto și video. Lacul Teiu, Balta Berzei, Ozone Lake și alte lacuri din zonă.';

export const SITE_KEYWORDS = [
	'pescuit',
	'pescuit Argeș',
	'pescuit în Argeș',
	'pescuit România',
	'jurnal pescuit',
	'partide pescuit',
	'pescuit crap',
	'Lacul Teiu',
	'Balta Berzei',
	'Ozone Lake',
	'Moara Vlasiei',
	'Lacul Varlaam',
	'echipament pescuit',
	'galerie pescuit',
	'pescuitinarges',
].join(', ');

export const DEFAULT_OG_IMAGE = '/assets/img/ui/logo/logo.png';

export interface PageSeo {
	title: string;
	description: string;
}

const HOME_SEO: PageSeo = {
	title: `${SITE_NAME} – Jurnal de pescuit pe apele Argeșului`,
	description: DEFAULT_DESCRIPTION,
};

export function getPageSeo(routeId: string | null, params: Record<string, string> = {}): PageSeo {
	switch (routeId) {
		case '/':
			return HOME_SEO;
		case '/about':
			return {
				title: `Despre – ${SITE_NAME}`,
				description: 'Despre mine și echipamentul meu de pescuit pe apele Argeșului',
			};
		case '/about/[id]': {
			const subsection = despreSubsections.find((s) => s.id === params.id);
			if (!subsection) {
				return {
					title: `Despre – ${SITE_NAME}`,
					description: 'Articole despre echipamentul meu de pescuit',
				};
			}
			return {
				title: `${subsection.title} – Despre – ${SITE_NAME}`,
				description: subsection.excerpt || subsection.body?.[0] || DEFAULT_DESCRIPTION,
			};
		}
		case '/sessions':
			return {
				title: `Partide – ${SITE_NAME}`,
				description: 'Partidele mele de pescuit pe lacurile din zona Argeșului',
			};
		case '/sessions/[lakeId]': {
			const lake = lakes.find((l) => l.id === params.lakeId);
			return {
				title: lake ? `${lake.title} – Partide – ${SITE_NAME}` : `Partide – ${SITE_NAME}`,
				description: lake ? `Partide de pescuit pe ${lake.title}` : 'Partide de pescuit',
			};
		}
		case '/sessions/[lakeId]/[sessionId]': {
			const lake = lakes.find((l) => l.id === params.lakeId);
			const session = lake?.sessions.find((s) => s.id === params.sessionId);
			return {
				title: session
					? `${session.title} – ${lake?.title ?? 'Partide'} – ${SITE_NAME}`
					: `Partide – ${SITE_NAME}`,
				description: session?.body?.[0] ?? (lake ? `Partide pe ${lake.title}` : DEFAULT_DESCRIPTION),
			};
		}
		case '/gallery':
			return {
				title: `Galerie – ${SITE_NAME}`,
				description: 'Galerie foto și video din partidele mele de pescuit',
			};
		case '/contact':
			return {
				title: `Contact – ${SITE_NAME}`,
				description: 'Contactează-mă pentru schimb de idei despre pescuit',
			};
		default:
			return HOME_SEO;
	}
}

export function absoluteUrl(pathname: string): string {
	return `${SITE_URL}${pathname}`;
}

export function absoluteAssetUrl(pathname: string, base = ''): string {
	const normalizedBase = base === '.' || base === './' ? '' : base;
	const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return `${SITE_URL}${normalizedBase}${normalizedPath}`;
}

/** All public URLs for sitemap.xml (trailing slash, no base path – custom domain). */
export function getSitemapPaths(): string[] {
	const paths = ['/', '/about/', '/sessions/', '/gallery/', '/contact/'];

	for (const subsection of despreSubsections) {
		if (subsection.href) paths.push(subsection.href);
	}

	for (const lake of lakes) {
		paths.push(lake.href);
		for (const session of lake.sessions) {
			paths.push(sessionHref(lake.id, session.id));
		}
	}

	return paths;
}

export function buildWebsiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_URL,
		description: DEFAULT_DESCRIPTION,
		inLanguage: 'ro',
	};
}
