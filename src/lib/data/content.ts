/**
 * CONTENT - Single source of truth for the site
 *
 * Update this file to:
 * - Add/remove articles
 * - Update parallax images (manual or script from CMS)
 * - Change loading screen content
 * - Modify carousel banners
 *
 * Asset structure (matches v1):
 * - BG: /assets/bg (desktop), /assets/bg-m (mobile)
 * - UI: /assets/img/ui (desktop/thumbs), /assets/img-m/ui (mobile/decent-res)
 * - Content: /assets/img/content (thumbs, full, hero)
 */

// ========== PATH CONSTANTS ==========

const UI_BASE_DESKTOP = '/assets/img/ui';
const UI_BASE_MOBILE = '/assets/img-m/ui';
const IMG_BASE = '/assets/img/content';
const IMG_MOBILE = '/assets/img-m/content';

/** Image path builder (matches v1 content.js imgPath) */
export const imgPath = {
	thumb: (section: string, slug: string, p: string) =>
		`${IMG_BASE}/${section}/${slug}/thumbs/${slug}__${p}__thumb.avif`,
	full: (section: string, slug: string, p: string) =>
		`${IMG_BASE}/${section}/${slug}/full/${slug}__${p}__full.jpg`,
	hero: (section: string, slug: string) =>
		`${IMG_BASE}/${section}/${slug}/hero/${slug}__hero.avif`,
	partideGroupHero: (group: string) =>
		`${IMG_BASE}/partide/${group}/hero/${group}__hero.avif`,
	partideSubHero: (group: string, sub: string) =>
		`${IMG_BASE}/partide/${group}/${sub}/hero/${group}__${sub}__hero.avif`,
	partideThumb: (group: string, sub: string, p: string) =>
		`${IMG_BASE}/partide/${group}/${sub}/thumbs/${group}__${sub}__${p}__thumb.avif`,
	partideFull: (group: string, sub: string, p: string) =>
		`${IMG_BASE}/partide/${group}/${sub}/full/${group}__${sub}__${p}__full.jpg`,
	/** Equipment hero for Despre thumbs (mobile) */
	despreEquipmentHero: (id: string) =>
		`${IMG_MOBILE}/despre/${id}/hero/${id}__hero.avif`,
	/** Despre article gallery full-size image (mobile) */
	despreFull: (id: string, key: string) =>
		`${IMG_MOBILE}/despre/${id}/full/${id}__${key}__full.jpg`,
	/** Partide session hero (mobile): partide/{lakeId}/{sessionSlug}/hero/{lakeId}__{sessionSlug}__hero.avif */
	partideSessionHeroMobile: (lakeId: string, sessionSlug: string) =>
		`${IMG_MOBILE}/partide/${lakeId}/${sessionSlug}/hero/${lakeId}__${sessionSlug}__hero.avif`,
	/** Partide session gallery full (mobile): partide/{lakeId}/{sessionSlug}/full/{lakeId}__{sessionSlug}__{key}__full.jpg */
	partideSessionFullMobile: (lakeId: string, sessionSlug: string, key: string) =>
		`${IMG_MOBILE}/partide/${lakeId}/${sessionSlug}/full/${lakeId}__${sessionSlug}__${key}__full.jpg`,
	/** Gallery Screen 2 heroes (mobile): galerie/{key}__hero.avif (main = Foto, vid = Video) */
	galleryHero: (key: string) => `${IMG_MOBILE}/galerie/${key}__hero.avif`,
	/** Gallery Foto panel (mobile): galerie/main/full/main__{key}__full.jpg */
	galleryPhoto: (key: string) => `${IMG_MOBILE}/galerie/main/full/main__${key}__full.jpg`,
	/** Gallery Video panel hero (mobile): galerie/vid/{videoId}__hero.avif */
	galleryVideoHero: (videoId: string) => `${IMG_MOBILE}/galerie/vid/${videoId}__hero.avif`,
};

/** Partide session body text path (single source: assets/text-m/partide/{lakeId}_{sessionId}.txt) */
export function partideSessionBodyPath(lakeId: string, sessionId: string): string {
	return `/assets/text-m/partide/${lakeId}_${sessionId}.txt`;
}

// ========== TYPES ==========

export interface ParallaxItem {
	id: string;
	/** Desktop: thumbnail path */
	desktopImage: string;
	/** Mobile: decent-res path */
	mobileImage: string;
	caption: string;
	/** Deep link (e.g. /sessions/123 or /gallery/photo-id) */
	link: string;
	/** Optional: link to article if parallax item is driven by article */
	articleId?: string;
}

export interface Article {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	date: string; // ISO date
	/** Desktop hero: thumbnail */
	heroDesktop: string;
	/** Mobile hero: decent-res */
	heroMobile: string;
	/** Optional tags, category, etc. */
}

export interface CarouselBanner {
	id: string;
	/** Desktop: thumb */
	desktopImage: string;
	/** Mobile: decent-res */
	mobileImage: string;
	link?: string;
	caption?: string;
}

/** Article subsection - reusable for Despre sub-sections, Partide sub-sub-sections */
export interface ArticleSubsection {
	id: string;
	title: string;
	excerpt?: string;
	/** Optional hero/thumbnail image path */
	image?: string;
	/** Link to detail page */
	href?: string;
	/** Body paragraphs - for simple text content */
	body?: string[];
	/** ISO date - for Partide sessions */
	date?: string;
	/** Gallery image keys for internal gallery (e.g. ['p01','p02',...] → id__p01__full.jpg) */
	galleryKeys?: string[];
}

/** Gallery video item (hero image + YouTube link) */
export interface GalleryVideoItem {
	id: string;
	title: string;
	/** Hero/thumb image path (e.g. imgPath.galleryHero('vid')) */
	heroImage: string;
	youtubeUrl: string;
}

/** Lake (Lacuri) - Partide Level 2 */
export interface Lake {
	id: string;
	title: string;
	/** e.g. /sessions/ozone/ */
	href: string;
	/** Hero/thumb image path (e.g. imgPath.partideGroupHero('ozone')) */
	image: string;
	/** Sessions for this lake */
	sessions: ArticleSubsection[];
}

export interface SiteContent {
	site: {
		title: string;
		tagline: string;
	};
	loading: {
		wordmark: string;
		welcomeText: string;
	};
	carousel: CarouselBanner[];
	parallax: ParallaxItem[];
	articles: Article[];
}

// ========== CONTENT DATA ==========

export const content: SiteContent = {
	site: {
		title: 'Pescuit în Argeș',
		tagline: 'Jurnalul meu de pescuit pe apele Argeșului',
	},
	loading: {
		wordmark: 'Pescuit în Argeș',
		welcomeText: 'Bine ai venit',
	},
	// Acasa banner slides: UI base + acasa/banner/slide-XX__banner.jpg
	carousel: [
		{ id: '1', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-01__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-01__banner.jpg`, link: '/sessions/ozone/s01/' },
		{ id: '2', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-02__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-02__banner.jpg`, link: '/gallery' },
		{ id: '3', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-03__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-03__banner.jpg`, link: '/gallery' },
		{ id: '4', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-04__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-04__banner.jpg`, link: '/gallery' },
		{ id: '5', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-05__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-05__banner.jpg`, link: '/about/delkim' },
	],
	// Acasa latest: UI base + acasa/latest/latest-XX__thumb.avif (desktop=thumbs, mobile=decent-res)
	parallax: [
		{ id: 'latest-01', desktopImage: `${UI_BASE_DESKTOP}/acasa/latest/latest-01__thumb.avif`, mobileImage: `${UI_BASE_MOBILE}/acasa/latest/latest-01__thumb.avif`, caption: 'Ultimul articol 1', link: '/sessions/ozone/s01/', articleId: 'latest-01' },
		{ id: 'latest-02', desktopImage: `${UI_BASE_DESKTOP}/acasa/latest/latest-02__thumb.avif`, mobileImage: `${UI_BASE_MOBILE}/acasa/latest/latest-02__thumb.avif`, caption: 'Ultimul articol 2', link: '/gallery', articleId: 'latest-02' },
		{ id: 'latest-03', desktopImage: `${UI_BASE_DESKTOP}/acasa/latest/latest-03__thumb.avif`, mobileImage: `${UI_BASE_MOBILE}/acasa/latest/latest-03__thumb.avif`, caption: 'Ultimul articol 3', link: '/gallery', articleId: 'latest-03' },
		{ id: 'latest-04', desktopImage: `${UI_BASE_DESKTOP}/acasa/latest/latest-04__thumb.avif`, mobileImage: `${UI_BASE_MOBILE}/acasa/latest/latest-04__thumb.avif`, caption: 'Ultimul articol 4', link: '/gallery', articleId: 'latest-04' },
		{ id: 'latest-05', desktopImage: `${UI_BASE_DESKTOP}/acasa/latest/latest-05__thumb.avif`, mobileImage: `${UI_BASE_MOBILE}/acasa/latest/latest-05__thumb.avif`, caption: 'Ultimul articol 5', link: '/about/delkim', articleId: 'latest-05' },
		{ id: 'latest-06', desktopImage: `${UI_BASE_DESKTOP}/acasa/latest/latest-06__thumb.avif`, mobileImage: `${UI_BASE_MOBILE}/acasa/latest/latest-06__thumb.avif`, caption: 'Ultimul articol 6', link: '/about/venture', articleId: 'latest-06' },
	],
	articles: [
		// Add articles here. Can be synced from CMS or updated manually.
		// To auto-populate parallax from latest articles, use:
		//   parallaxFromLatestArticles(content.articles, 5)
	],
};

// ========== DESPRE (ABOUT) SUB-SECTIONS ==========

export const despreSubsections: ArticleSubsection[] = [
	{
		id: 'despre-mine',
		title: 'Despre mine',
		excerpt: 'Pasiunea mea pentru pescuit a început în copilărie.',
		body: [
			'Pasiunea mea pentru pescuit a început în copilărie, pe malurile râurilor din Argeș. De atunci, am evoluat de la cârlige simple la echipament profesional de crap.',
			'Aici vei găsi detalii despre echipamentul pe care îl folosesc — de la lansete și mulinete, la avertizoare și accesorii.',
		],
	},
	{
		id: 'box',
		title: 'Box',
		excerpt: 'Detalii despre boxul meu de pescuit.',
		image: imgPath.despreEquipmentHero('box'),
		href: '/about/box',
		body: ['Boxul meu de pescuit — organizat și pregătit pentru orice situație pe malurile Argeșului.'],
		galleryKeys: ['p01', 'p02', 'p03', 'p04', 'p05'],
	},
	{
		id: 'delfin',
		title: 'Delfin',
		excerpt: 'Lansete și mulinete Delfin.',
		image: imgPath.despreEquipmentHero('delfin'),
		href: '/about/delfin',
		body: ['Echipament Delfin — alegerea mea pentru sesiunile de pe râuri și lacuri.'],
		galleryKeys: ['p01', 'p02', 'p03', 'p04', 'p05'],
	},
	{
		id: 'delkim',
		title: 'Delkim',
		excerpt: 'Avertizoare și senzori Delkim.',
		image: imgPath.despreEquipmentHero('delkim'),
		href: '/about/delkim',
		body: ['Avertizoare Delkim — precizie și fiabilitate în fiecare sesiune.'],
		galleryKeys: ['p01', 'p02', 'p03', 'p04', 'p05'],
	},
	{
		id: 'korda',
		title: 'Korda',
		excerpt: 'Accesorii și montaje Korda.',
		image: imgPath.despreEquipmentHero('korda'),
		href: '/about/korda',
		body: ['Accesorii Korda — montaje și materiale de calitate pentru pescuit modern.'],
		galleryKeys: ['p01', 'p02', 'p03', 'p04', 'p05'],
	},
	{
		id: 'mblc',
		title: 'MBLC',
		excerpt: 'Lansete MBLC.',
		image: imgPath.despreEquipmentHero('mblc'),
		href: '/about/mblc',
		body: ['Lansete MBLC — performanță și durabilitate pe apele Argeșului.'],
		galleryKeys: ['p01', 'p02', 'p03', 'p04', 'p05'],
	},
	{
		id: 'venture',
		title: 'Venture',
		excerpt: 'Echipament Venture.',
		image: imgPath.despreEquipmentHero('venture'),
		href: '/about/venture',
		body: ['Echipament Venture — alegerea mea pentru sesiuni lungi și comfort.'],
		galleryKeys: ['p01', 'p02', 'p03', 'p04', 'p05'],
	},
	{
		id: 'fma',
		title: 'FMA',
		excerpt: 'Echipament FMA.',
		image: imgPath.despreEquipmentHero('fma'),
		href: '/about/fma',
		body: ['Echipament FMA — detaliile mele.'],
		galleryKeys: ['p01', 'p02', 'p03', 'p04', 'p05'],
	},
	{
		id: 'mgs',
		title: 'MGS',
		excerpt: 'Echipament MGS.',
		image: imgPath.despreEquipmentHero('mgs'),
		href: '/about/mgs',
		body: ['Echipament MGS — detaliile mele.'],
		galleryKeys: ['p01', 'p02', 'p03', 'p04', 'p05'],
	},
];

// ========== PARTIDE (SESSIONS) – LACURI + SESSIONS ==========
// Single source of truth: session id in content = slug used in URLs and asset paths.
// - URLs: /sessions/{lakeId}/{sessionId}/  (e.g. /sessions/teiu/s01/)
// - Hero (mobile): assets/img-m/content/partide/{lakeId}/{sessionId}/hero/{lakeId}__{sessionId}__hero.avif
// - Gallery (mobile): assets/img-m/content/partide/{lakeId}/{sessionId}/full/{lakeId}__{sessionId}__{key}__full.jpg
// - Body text: assets/text-m/partide/{lakeId}_{sessionId}.txt  (e.g. teiu_s01.txt)

export const lakes: Lake[] = [
	{
		id: 'mv',
		title: 'MV',
		href: '/sessions/mv/',
		image: imgPath.partideGroupHero('mv'),
		sessions: [
			{
				id: 's01',
				title: 'Sesiune MV 1',
				date: '2024-06-15',
				body: ['Prima sesiune pe lacul MV în sezonul 2024.'],
				galleryKeys: ['p01', 'p02'],
			},
		],
	},
	{
		id: 'ozone',
		title: 'Ozone',
		href: '/sessions/ozone/',
		image: imgPath.partideGroupHero('ozone'),
		sessions: [
			{
				id: 's01',
				title: 'Sesiune Ozone 1',
				date: '2024-07-01',
				body: ['Sesiune pe Ozone — vreme bună, pești activi.'],
				galleryKeys: ['p01', 'p02', 'p03'],
			},
		],
	},
	{
		id: 'teiu',
		title: 'Teiu',
		href: '/sessions/teiu/',
		image: imgPath.partideGroupHero('teiu'),
		sessions: [
			{
				id: 's01',
				title: 'Sesiune Teiu 1',
				date: '2024-07-20',
				body: ['O zi pe lacul Teiu.'],
				galleryKeys: ['p01', 'p02', 'p03'],
			},
			{
				id: 's02',
				title: 'Sesiune Teiu 2',
				date: '2024-08-01',
				body: ['Sesiune Teiu 2.'],
				galleryKeys: ['p01', 'p02', 'p03'],
			},
			{
				id: 's03',
				title: 'Sesiune Teiu 3',
				date: '2024-08-15',
				body: ['Sesiune Teiu 3.'],
				galleryKeys: ['p01', 'p02', 'p03'],
			},
			{
				id: 's04',
				title: 'Sesiune Teiu 4',
				date: '2024-09-01',
				body: ['Sesiune Teiu 4.'],
				galleryKeys: ['p01', 'p02', 'p03'],
			},
		],
	},
	{
		id: 'varlaam',
		title: 'Varlaam',
		href: '/sessions/varlaam/',
		image: imgPath.partideGroupHero('varlaam'),
		sessions: [
			{
				id: 's01',
				title: 'Sesiune Varlaam 1',
				date: '2024-08-01',
				body: ['Sesiune pe Varlaam.'],
				galleryKeys: ['p01'],
			},
		],
	},
];

/** Partide session hero image path (mobile). Use this for session list thumbs and article hero; content.ts does not store session.image for Partide. */
export function getPartideSessionHeroPath(lakeId: string, sessionId: string): string {
	return imgPath.partideSessionHeroMobile(lakeId, sessionId);
}

/** Session href for a given lake and session id */
export function sessionHref(lakeId: string, sessionId: string): string {
	return `/sessions/${lakeId}/${sessionId}/`;
}

// ========== GALLERY (MOBILE) ==========
/** Photo keys for main gallery "Foto" panel (files: galerie/main/full/main__{key}__full.jpg) */
export const galleryPhotoKeys: string[] = ['p01', 'p02', 'p03', 'p04', 'p05'];

/** Hero keys for gallery Screen 2: first = Foto panel, second = Video panel */
export const galleryHeroKeys = ['main', 'vid'] as const;

/** Video set for "Video" panel: hero image + YouTube URL (files: galerie/vid/{id}__hero.avif) */
export const galleryVideos: GalleryVideoItem[] = [
	{ id: 'vid-1', title: 'Video 1', heroImage: imgPath.galleryVideoHero('vid-1'), youtubeUrl: 'https://www.youtube.com/watch?v=example' },
	{ id: 'vid-2', title: 'Video 2', heroImage: imgPath.galleryVideoHero('vid-2'), youtubeUrl: 'https://www.youtube.com/watch?v=example' },
	{ id: 'vid-3', title: 'Video 3', heroImage: imgPath.galleryVideoHero('vid-3'), youtubeUrl: 'https://www.youtube.com/watch?v=example' },
];

/** Build parallax items from latest articles (for scripts/automation) */
export function parallaxFromLatestArticles(
	articles: Article[],
	maxItems = 5
): ParallaxItem[] {
	return articles.slice(0, maxItems).map((a, i) => ({
		id: `from-${a.id}`,
		desktopImage: a.heroDesktop,
		mobileImage: a.heroMobile,
		caption: a.title,
		link: `/${a.slug}`,
		articleId: a.id,
	}));
}

// ========== HELPERS ==========

/** Parallax item with resolved image path for current viewport */
export interface ParallaxItemResolved extends ParallaxItem {
	image: string;
}

/**
 * Get carousel images for current viewport (desktop vs mobile).
 *
 * Note: callers should ensure the `isMobile` flag is derived in a
 * hydration-safe way (e.g. do not branch on browser-only state during
 * SSR; compute it after mount and re-run reactives). See `+page.svelte`
 * for an example pattern.
 */
export function getCarouselImages(isMobile: boolean, base = ''): string[] {
	return content.carousel.map((b) => base + (isMobile ? b.mobileImage : b.desktopImage));
}

/**
 * Get parallax items with correct image for viewport.
 *
 * Same hydration caveat as `getCarouselImages` – make sure the
 * `isMobile` flag does not cause SSR/client markup divergence.
 * Pass base from $app/paths for GitHub Pages / subpath deploy.
 */
export function getParallaxItems(isMobile: boolean, base = ''): ParallaxItemResolved[] {
	return content.parallax.map((item) => ({
		...item,
		image: base + (isMobile ? item.mobileImage : item.desktopImage),
	}));
}
