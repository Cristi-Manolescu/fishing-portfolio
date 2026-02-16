<script lang="ts">
	/**
	 * AboutScreen - Desktop Despre panel
	 * Middle: left = ticker (despre.txt), right = equipment hero thumbs. Clicking a thumb opens
	 * article in-place (sweep): main holder = article text, bottom holder = gallery thumbs → single-image holder (Chenar, original aspect ratio).
	 * Bottom: Review-uri video rail when home; gallery thumbs when article selected.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import {
		getAboutEquipmentItems,
		getDespreReviewVideoItems,
		despreSubsections,
		despreTickerPath,
		despreArticleTextPath,
		imgPath,
	} from '$lib/data/content';
	import { selectedDespreArticleId, despreGalleryOpen, despreSingleImage } from '$lib/stores/despreArticle';
	import ThumbRail from '$lib/components/ThumbRail.svelte';
	import Lenis from 'lenis';

	export let section: 'middle' | 'bottom' = 'middle';

	// Desktop: hero images for scrolling rail; include id for in-place article open
	$: gearItems = getAboutEquipmentItems(base, true);
	$: gearRailItems = gearItems.map((i) => ({
		link: i.href,
		image: i.image,
		caption: i.title,
		id: i.id,
	}));

	let articleViewEl: HTMLDivElement;
	let bottomGalleryWrapEl: HTMLDivElement;
	let despreHomeWrapEl: HTMLDivElement;
	let despreBottomWrapEl: HTMLDivElement;

	let articleClosing = false;
	let closingArticleId: string | null = null;
	let nextArticleId: string | null = null;
	let nextArticleHref: string | null = null;
	let openingArticleId: string | null = null;
	let justClosedArticle = false;
	const SLIDE_OUT_DURATION_MS = 280;

	function openArticle(item: { link: string; image: string; caption: string; id?: string }) {
		if (!item.id || openingArticleId) return;
		despreGalleryOpen.set(false);
		despreSingleImage.set(null);
		openingArticleId = item.id;
		tick().then(() => {
			despreHomeWrapEl?.classList.add('slide-out');
			despreBottomWrapEl?.classList.add('slide-out');
			setTimeout(() => {
				selectedDespreArticleId.set(openingArticleId!);
				goto(base + '/about/' + openingArticleId);
				openingArticleId = null;
			}, SLIDE_OUT_DURATION_MS);
		});
	}

	function requestCloseArticle() {
		if (articleClosing || !selectedId) return;
		closingArticleId = selectedId;
		articleClosing = true;
		nextArticleId = null;
		nextArticleHref = null;
		tick().then(() => {
			articleViewEl?.classList.add('slide-out');
			bottomGalleryWrapEl?.classList.add('slide-out');
			setTimeout(doCloseArticle, SLIDE_OUT_DURATION_MS);
		});
	}

	function requestNextArticle() {
		if (!nextArticle?.href || articleClosing) return;
		closingArticleId = selectedId;
		articleClosing = true;
		nextArticleId = nextArticle.id;
		nextArticleHref = nextArticle.href;
		tick().then(() => {
			articleViewEl?.classList.add('slide-out');
			bottomGalleryWrapEl?.classList.add('slide-out');
			setTimeout(doCloseArticle, SLIDE_OUT_DURATION_MS);
		});
	}

	function doCloseArticle() {
		if (nextArticleId && nextArticleHref) {
			selectedDespreArticleId.set(nextArticleId);
			goto(base + nextArticleHref);
		} else {
			selectedDespreArticleId.set(null);
			goto(base + '/about');
			justClosedArticle = true;
			setTimeout(() => { justClosedArticle = false; }, SLIDE_OUT_DURATION_MS);
		}
		despreGalleryOpen.set(false);
		despreSingleImage.set(null);
		closingArticleId = null;
		articleClosing = false;
		nextArticleId = null;
		nextArticleHref = null;
	}

	// Sync URL ↔ store: same route as mobile (/about/box). pathname does not include base.
	$: pathname = $page.url?.pathname ?? '';
	$: if (section === 'middle' && browser) {
		const aboutMatch = pathname.match(/\/about\/([^/]+)\/?$/);
		if (aboutMatch) {
			selectedDespreArticleId.set(aboutMatch[1]);
		} else if (pathname === '/about' || pathname === '/about/') {
			selectedDespreArticleId.set(null);
		}
	}

	// Review-uri video: same hero images as equipment until dedicated assets exist
	$: reviewVideoItems = getDespreReviewVideoItems(base);

	// In-place article view (when a equipment thumb is clicked). When closing we keep showing article until slide-out ends.
	$: selectedId = $selectedDespreArticleId;
	$: effectiveId = selectedId || closingArticleId;
	$: subsection = effectiveId ? despreSubsections.find((s) => s.id === effectiveId) : null;
	let articleBodyText = '';
	$: if (browser && effectiveId) {
		articleBodyText = '';
		const path = despreArticleTextPath(effectiveId);
		fetch(base + path)
			.then((r) => (r.ok ? r.text() : ''))
			.then((text) => { articleBodyText = text; })
			.catch(() => { articleBodyText = ''; });
	}
	$: galleryImages =
		subsection?.galleryKeys?.map((key) => ({
			src: base + imgPath.despreFullDesktop(subsection.id, key),
			alt: subsection.title,
		})) ?? [];
	$: galleryThumbItems =
		subsection?.galleryKeys?.map((key) => ({
			link: '#',
			image: base + imgPath.despreThumb(subsection.id, key),
			caption: subsection.title,
		})) ?? [];

	// Next article (equipment order) for article view nav
	$: itemsWithHref = despreSubsections.filter((s) => s.href);
	$: currentArticleIndex = subsection ? itemsWithHref.findIndex((s) => s.id === subsection.id) : -1;
	$: nextArticle =
		currentArticleIndex >= 0 && currentArticleIndex < itemsWithHref.length - 1
			? itemsWithHref[currentArticleIndex + 1]
			: null;

	function goToNextArticle() {
		requestNextArticle();
	}

	function openSingleImage(index: number) {
		if (galleryImages.length > 0 && index >= 0 && index < galleryImages.length) {
			despreSingleImage.set({ images: galleryImages, index });
		}
	}

	let tickerWrapperEl: HTMLDivElement;
	let tickerContentEl: HTMLDivElement;
	let articleBodyWrapperEl: HTMLDivElement;
	let articleBodyContentEl: HTMLDivElement;
	let lenisInstance: any = null;

	// Ticker text from despre.txt – paragraphs, same behaviour as Acasa white ticker
	let despreTickerParagraphs: string[] = [];

	onMount(() => {
		fetch(base + despreTickerPath)
			.then((r) => (r.ok ? r.text() : ''))
			.then((text) => {
				despreTickerParagraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
			})
			.catch(() => {});

		return () => {
			lenisInstance?.destroy();
			lenisInstance = null;
		};
	});

	// Lenis: ticker when Despre home, article body when article open. Avoid reactive loop: only destroy when state changes; init in tick so we don't re-trigger.
	let lenisPrevClosing: boolean | null = null;
	let lenisPrevId: string | null = null;
	let lenisScheduled = false;
	const LENIS_OPTS = {
		lerp: 0.07,
		duration: 1.4,
		smoothWheel: true,
		wheelMultiplier: 0.8,
		autoRaf: true,
	};

	function scheduleLenisTicker() {
		if (lenisScheduled) return;
		lenisScheduled = true;
		tick().then(() => {
			lenisScheduled = false;
			if (tickerWrapperEl && tickerContentEl && !effectiveId && !articleClosing) {
				lenisInstance?.destroy();
				lenisInstance = new Lenis({
					wrapper: tickerWrapperEl,
					content: tickerContentEl,
					...LENIS_OPTS,
				});
			}
		});
	}

	function scheduleLenisArticle() {
		if (lenisScheduled) return;
		lenisScheduled = true;
		tick().then(() => {
			lenisScheduled = false;
			if (articleBodyWrapperEl && articleBodyContentEl && effectiveId && !articleClosing) {
				lenisInstance?.destroy();
				lenisInstance = new Lenis({
					wrapper: articleBodyWrapperEl,
					content: articleBodyContentEl,
					...LENIS_OPTS,
				});
			}
		});
	}

	$: if (section === 'middle' && browser) {
		if (articleClosing) {
			lenisInstance?.destroy();
			lenisInstance = null;
			lenisPrevClosing = true;
			lenisPrevId = effectiveId;
		} else if (effectiveId) {
			const needDestroy = lenisPrevClosing !== false || lenisPrevId !== effectiveId;
			if (needDestroy) {
				lenisInstance?.destroy();
				lenisInstance = null;
			}
			lenisPrevClosing = false;
			lenisPrevId = effectiveId;
			if (needDestroy) scheduleLenisArticle();
		} else {
			const needDestroy = lenisPrevClosing !== false || lenisPrevId !== null;
			if (needDestroy) {
				lenisInstance?.destroy();
				lenisInstance = null;
			}
			lenisPrevClosing = false;
			lenisPrevId = null;
			if (needDestroy) scheduleLenisTicker();
		}
	}

	onDestroy(() => {
		lenisInstance?.destroy();
		lenisInstance = null;
		selectedDespreArticleId.set(null);
		despreGalleryOpen.set(false);
		despreSingleImage.set(null);
	});
</script>

{#if section === 'middle'}
	<div class="middle-content">
		{#if effectiveId && subsection && !openingArticleId}
			<!-- Article view: slide-in from right when entering; slide-out when back/next -->
			<div class="despre-article-view" class:sweep-in={selectedId && !articleClosing} class:slide-out={articleClosing} bind:this={articleViewEl}>
				<div class="despre-article-center-group">
					<div class="despre-article-nav despre-article-nav-left">
						<button
							type="button"
							class="despre-article-nav-btn despre-article-nav-up"
							aria-label="Înapoi la Despre"
							on:click={requestCloseArticle}
							disabled={articleClosing}
						>
							<span aria-hidden="true">›</span>
						</button>
					</div>
					<div class="despre-article-body-wrap">
						<div class="despre-article-body-scroll" bind:this={articleBodyWrapperEl}>
							<div class="despre-article-body-inner" bind:this={articleBodyContentEl}>
								<div class="despre-article-body">
									{#if articleBodyText}
										{@html articleBodyText}
									{:else}
										<p class="despre-article-loading">Se încarcă...</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
					{#if nextArticle?.href}
						<div class="despre-article-nav despre-article-nav-right">
							<button
								type="button"
								class="despre-article-nav-btn despre-article-next-btn"
								aria-label="Articol următor: {nextArticle.title}"
								on:click={goToNextArticle}
							>
								<span aria-hidden="true">›</span><span aria-hidden="true">›</span>
							</button>
						</div>
					{:else}
						<div class="despre-article-nav despre-article-nav-right despre-article-nav-placeholder" aria-hidden="true"></div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Despre home: slide out when opening article; slide in from left when returning from article -->
			<div class="despre-home-wrap" class:slide-out={!!openingArticleId} class:despre-slide-in={justClosedArticle} bind:this={despreHomeWrapEl}>
			<div class="ticker-area">
				<div class="ticker-content">
					<div class="desktop-ticker-scroll" bind:this={tickerWrapperEl}>
						<div class="ticker-inner" bind:this={tickerContentEl}>
							{#each despreTickerParagraphs as paragraph}
								<p class="intro-text">{paragraph}</p>
							{/each}
						</div>
					</div>
				</div>
			</div>
			<div class="gear-hero-area">
				<ThumbRail items={gearRailItems} variant="large" onItemClick={openArticle} />
			</div>
			</div>
		{/if}
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		{#if effectiveId && subsection && !openingArticleId}
			{#key selectedId}
			<div class="bottom-gallery-wrap" class:slide-out={articleClosing} class:slide-in={!articleClosing} bind:this={bottomGalleryWrapEl}>
			<div class="gallery-thumbs-label">Galerie</div>
			<ThumbRail
				items={galleryThumbItems}
				onItemClick={(_item, index) => openSingleImage(index)}
			/>
			</div>
			{/key}
		{:else}
			<div class="despre-bottom-wrap" class:slide-out={!!openingArticleId} class:despre-slide-in={justClosedArticle} bind:this={despreBottomWrapEl}>
			<div class="review-video-label">Review-uri video</div>
			<ThumbRail items={reviewVideoItems} />
			</div>
		{/if}
	</div>
{/if}

<style>
	/* ========== MIDDLE SECTION ========== */
	.middle-content {
		display: flex;
		gap: var(--space-6);
		height: 100%;
	}

	.ticker-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.ticker-content {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.desktop-ticker-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--color-accent) transparent;
	}

	.desktop-ticker-scroll::-webkit-scrollbar {
		width: 6px;
	}

	.desktop-ticker-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.desktop-ticker-scroll::-webkit-scrollbar-thumb {
		background: var(--color-accent);
		border-radius: 3px;
	}

	.desktop-ticker-scroll::-webkit-scrollbar-thumb:hover {
		background: color-mix(in srgb, var(--color-accent) 85%, white);
	}

	.intro-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		margin: 0 0 var(--space-2);
		text-align: justify;
	}

	.intro-text:last-child {
		margin-bottom: 0;
	}

	/* Right: same scrolling thumb system as Acasa, bigger thumbs (160×112, unit 176) */
	.gear-hero-area {
		flex: 1.5;
		min-width: 0;
		display: flex;
		align-items: center;
	}

	/* ========== DESPRE HOME WRAPPERS (slide out when opening article, slide in when back) ========== */
	.despre-home-wrap,
	.despre-bottom-wrap {
		display: flex;
		width: 100%;
		height: 100%;
		min-width: 0;
		transition: opacity 0.28s var(--ease-out), transform 0.28s var(--ease-out);
	}

	.despre-home-wrap {
		flex: 1;
		gap: var(--space-6);
	}

	.despre-bottom-wrap {
		flex: 1;
		align-items: center;
		gap: var(--space-6);
	}

	.despre-home-wrap.slide-out,
	.despre-bottom-wrap.slide-out {
		opacity: 0;
		transform: translateX(1.5rem);
	}

	.despre-home-wrap.despre-slide-in,
	.despre-bottom-wrap.despre-slide-in {
		animation: despreSlideIn 0.28s var(--ease-out) forwards;
	}

	@keyframes despreSlideIn {
		from {
			opacity: 0;
			transform: translateX(-1.5rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* ========== BOTTOM SECTION ========== */
	/* Same structure as Acasa: fixed-width label (where search bar is), then ThumbRail */
	.bottom-content {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		height: 100%;
	}

	.review-video-label {
		flex-shrink: 0;
		width: 200px;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.bottom-gallery-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--space-6);
		height: 100%;
		transition: opacity 0.28s var(--ease-out), transform 0.28s var(--ease-out);
	}

	.bottom-gallery-wrap.slide-out {
		opacity: 0;
		transform: translateX(1.5rem);
	}

	/* Gallery rail slides in from right when entering article or switching to next article */
	.bottom-gallery-wrap.slide-in {
		animation: articleSlideIn 0.28s var(--ease-out) forwards;
	}

	@keyframes articleSlideIn {
		from {
			opacity: 0;
			transform: translateX(1.5rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.gallery-thumbs-label {
		flex-shrink: 0;
		width: 200px;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	/* ========== ARTICLE VIEW (in-place, slide-in / slide-out) ========== */
	.despre-article-view {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		opacity: 0;
		transform: translateX(1.5rem);
		transition:
			opacity 0.28s var(--ease-out),
			transform 0.28s var(--ease-out);
	}

	.despre-article-view.sweep-in {
		opacity: 1;
		transform: translateX(0);
	}

	.despre-article-view.slide-out {
		opacity: 0;
		transform: translateX(1.5rem);
	}

	/* Centered group: [back][text box 1000px][next] so buttons sit on sides of text */
	.despre-article-center-group {
		display: flex;
		align-items: stretch;
		gap: var(--space-3);
		width: 100%;
		max-width: calc(1000px + 32px + 32px + var(--space-3) * 2);
		height: 100%;
		min-height: 0;
		margin-left: auto;
		margin-right: auto;
	}

	.despre-article-nav {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.despre-article-nav-placeholder {
		width: 32px;
		pointer-events: none;
		visibility: hidden;
	}

	/* Same pointer style as ThumbRail nav (circle, border, hover accent) – same › icon */
	.despre-article-nav-btn {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		transition: background var(--duration-fast), border-color var(--duration-fast);
	}

	.despre-article-nav-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: var(--color-accent);
	}

	/* Back: same › icon rotated to point up */
	.despre-article-nav-up span {
		display: inline-block;
		transform: rotate(-90deg);
	}

	/* Next: two › side by side, minimal gap */
	.despre-article-next-btn {
		gap: 2px;
	}

	.despre-article-next-btn span {
		display: inline-block;
	}

	/* Text box between the two nav buttons – Lenis scroll (same as Despre/Acasa ticker) */
	.despre-article-body-wrap {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
	}

	.despre-article-body-scroll {
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--color-accent) transparent;
	}

	.despre-article-body-scroll::-webkit-scrollbar {
		width: 6px;
	}

	.despre-article-body-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.despre-article-body-scroll::-webkit-scrollbar-thumb {
		background: var(--color-accent);
		border-radius: 3px;
	}

	.despre-article-body-scroll::-webkit-scrollbar-thumb:hover {
		background: color-mix(in srgb, var(--color-accent) 85%, white);
	}

	.despre-article-body-inner {
		min-height: min-content;
	}

	.despre-article-body {
		box-sizing: border-box;
		width: 100%;
		max-width: 1000px;
		min-height: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		text-align: justify;
		padding: 0 var(--space-4);
	}

	.despre-article-body :global(p) {
		margin: 0 0 var(--space-2);
	}

	.despre-article-loading {
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
	}
</style>
