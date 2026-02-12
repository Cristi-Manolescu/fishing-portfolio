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
};

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
		{ id: '1', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-01__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-01__banner.jpg`, link: '/sessions/ozone/ozone_s01' },
		{ id: '2', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-02__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-02__banner.jpg`, link: '/gallery' },
		{ id: '3', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-03__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-03__banner.jpg`, link: '/gallery' },
		{ id: '4', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-04__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-04__banner.jpg`, link: '/gallery' },
		{ id: '5', desktopImage: `${UI_BASE_DESKTOP}/acasa/banner/slide-05__banner.jpg`, mobileImage: `${UI_BASE_MOBILE}/acasa/banner/slide-05__banner.jpg`, link: '/about/delkim' },
	],
	// Acasa latest: UI base + acasa/latest/latest-XX__thumb.avif (desktop=thumbs, mobile=decent-res)
	parallax: [
		{ id: 'latest-01', desktopImage: `${UI_BASE_DESKTOP}/acasa/latest/latest-01__thumb.avif`, mobileImage: `${UI_BASE_MOBILE}/acasa/latest/latest-01__thumb.avif`, caption: 'Ultimul articol 1', link: '/sessions/ozone/ozone_s01', articleId: 'latest-01' },
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
export function getCarouselImages(isMobile: boolean): string[] {
	return content.carousel.map((b) => (isMobile ? b.mobileImage : b.desktopImage));
}

/**
 * Get parallax items with correct image for viewport.
 *
 * Same hydration caveat as `getCarouselImages` – make sure the
 * `isMobile` flag does not cause SSR/client markup divergence.
 */
export function getParallaxItems(isMobile: boolean): ParallaxItemResolved[] {
	return content.parallax.map((item) => ({
		...item,
		image: isMobile ? item.mobileImage : item.desktopImage,
	}));
}
