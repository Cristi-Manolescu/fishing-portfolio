<script lang="ts">
	/**
	 * HomeScreen - Desktop home panel
	 * Split into sections: middle (banner+ticker) and bottom (search+thumbs)
	 * All content from content.ts (single source of truth)
	 */
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import {
		content,
		getParallaxItems,
		getCarouselImages,
		acasaTickerPath,
	} from '$lib/data/content';
	import ThumbRail from '$lib/components/ThumbRail.svelte';

	export let section: 'middle' | 'bottom' = 'middle';

	let tickerWrapperEl: HTMLDivElement;
	let tickerContentEl: HTMLDivElement;
	let lenisInstance: any = null;

	// Desktop thumbs = parallax items (link, image, caption) for ThumbRail
	$: parallaxItems = getParallaxItems(false, base);
	// Banner: images only, no links
	$: carouselImages = getCarouselImages(false, base);

	let currentSlide = 0;
	let autoPlayTimer: ReturnType<typeof setInterval> | null = null;
	const AUTO_PLAY_MS = 4500;

	// White text block from acasa.txt (fetched on mount) – multi-line, scrollable
	let desktopTickerParagraphs: string[] = [];

	function goToSlide(index: number) {
		currentSlide = ((index % carouselImages.length) + carouselImages.length) % carouselImages.length;
		startAutoPlay(); // reset timer on manual change
	}

	function nextSlide() {
		goToSlide(currentSlide + 1);
	}

	function prevSlide() {
		goToSlide(currentSlide - 1);
	}

	function startAutoPlay() {
		if (autoPlayTimer) clearInterval(autoPlayTimer);
		autoPlayTimer = setInterval(nextSlide, AUTO_PLAY_MS);
	}

	function stopAutoPlay() {
		if (autoPlayTimer) {
			clearInterval(autoPlayTimer);
			autoPlayTimer = null;
		}
	}

	onMount(() => {
		startAutoPlay();
		// Load desktop ticker (white text) from acasa.txt – keep paragraphs
		fetch(base + acasaTickerPath)
			.then((r) => (r.ok ? r.text() : ''))
			.then((text) => {
				desktopTickerParagraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
			})
			.catch(() => {});

		// Lenis smooth scroll with inertia for white ticker (slow-accelerate-slow feel)
		if (browser && tickerWrapperEl && tickerContentEl) {
			import('lenis').then(({ default: Lenis }) => {
				lenisInstance = new Lenis({
					wrapper: tickerWrapperEl,
					content: tickerContentEl,
					lerp: 0.07,
					duration: 1.4,
					smoothWheel: true,
					wheelMultiplier: 0.8,
					autoRaf: true,
				});
			});
		}

		return () => {
			stopAutoPlay();
			lenisInstance?.destroy();
		};
	});

	onDestroy(() => {
		stopAutoPlay();
		lenisInstance?.destroy();
	});
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="banner-area" role="region" aria-label="Banner carousel">
			<div class="banner-carousel">
				{#each carouselImages as image, i}
					<div
						class="banner-slide"
						class:active={i === currentSlide}
						aria-hidden={i !== currentSlide}
					>
						<img src={image} alt="Banner {i + 1}" class="banner-image" loading={i === 0 ? 'eager' : 'lazy'} />
					</div>
				{/each}
			</div>
			<button type="button" class="banner-nav banner-prev" on:click|stopPropagation={prevSlide} aria-label="Slide anterior">
				<span aria-hidden="true">‹</span>
			</button>
			<button type="button" class="banner-nav banner-next" on:click|stopPropagation={nextSlide} aria-label="Slide următor">
				<span aria-hidden="true">›</span>
			</button>
			<div class="banner-dots">
				{#each carouselImages as _, i}
					<button
						type="button"
						class="banner-dot"
						class:active={i === currentSlide}
						on:click|stopPropagation={() => goToSlide(i)}
						aria-label="Mergi la slide {i + 1}"
						aria-current={i === currentSlide ? 'true' : undefined}
					></button>
				{/each}
			</div>
		</div>

		<div class="ticker-area">
			<div class="ticker-content">
				<!-- Orange crawler: mobile ticker text (top) -->
				<div class="crawler-scroll">
					<span class="crawler-text">{content.home.introLine}</span>
					<span class="crawler-text" aria-hidden="true">{content.home.introLine}</span>
				</div>
				<!-- White ticker: acasa.txt, mouse-wheel scroll with inertia (bottom) -->
				<div class="desktop-ticker-scroll" bind:this={tickerWrapperEl}>
					<div class="ticker-inner" bind:this={tickerContentEl}>
						{#each desktopTickerParagraphs as paragraph}
							<p class="intro-text">{paragraph}</p>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		<div class="search-bar">
			<input type="text" placeholder="Caută..." disabled class="search-input" />
		</div>
		<ThumbRail items={parallaxItems} />
	</div>
{/if}

<style>
	/* ========== MIDDLE SECTION ========== */
	.middle-content {
		display: flex;
		gap: var(--space-4);
		height: 100%;
	}

	.banner-area {
		flex: 1.5;
		min-width: 0;
		border-radius: calc(var(--frame-radius) - var(--space-2));
		overflow: hidden;
		position: relative;
	}

	.banner-carousel {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 160px;
	}

	.banner-slide {
		position: absolute;
		inset: 0;
		display: block;
		opacity: 0;
		transition: opacity var(--duration-slow) var(--ease-out);
		pointer-events: none;
	}

	.banner-slide.active {
		opacity: 1;
		z-index: 1;
	}

	.banner-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.banner-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 2;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background var(--duration-fast), border-color var(--duration-fast);
	}

	.banner-nav:hover {
		background: rgba(0, 0, 0, 0.6);
		border-color: var(--color-accent);
	}

	.banner-prev { left: var(--space-2); }
	.banner-next { right: var(--space-2); }

	.banner-dots {
		position: absolute;
		bottom: var(--space-2);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: var(--space-2);
		z-index: 2;
	}

	.banner-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all var(--duration-fast);
	}

	.banner-dot:hover {
		background: rgba(255, 255, 255, 0.5);
	}

	.banner-dot.active {
		background: var(--color-accent);
		transform: scale(1.2);
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
		gap: var(--space-4);
		height: 100%;
	}

	/* Orange crawler header (top) */
	.crawler-scroll {
		display: flex;
		white-space: nowrap;
		animation: tickerScroll 25s linear infinite;
		flex-shrink: 0;
		padding-bottom: var(--space-4);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.crawler-text {
		color: var(--color-accent);
		font-size: var(--font-size-base);
		padding-right: var(--space-4);
	}

	@keyframes tickerScroll {
		from { transform: translateX(0); }
		to { transform: translateX(-50%); }
	}

	/* White ticker: acasa.txt, mouse-wheel scroll with inertia (bottom) */
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

	/* ========== BOTTOM SECTION ========== */
	.bottom-content {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		height: 100%;
	}

	.search-bar {
		flex-shrink: 0;
		width: 200px;
	}

	.search-input {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}

	.search-input::placeholder {
		color: var(--color-text-muted);
	}

	.search-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
