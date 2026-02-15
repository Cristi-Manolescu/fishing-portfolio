<script lang="ts">
	/**
	 * AboutScreen - Desktop Despre panel
	 * Middle: left = ticker (despre.txt, Lenis scroll like Acasa), right = equipment hero thumbs (bigger scale).
	 * Bottom: empty for Despre Home (optional: ThumbRail or short CTA can be added later).
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import {
		getAboutEquipmentItems,
		getDespreReviewVideoItems,
		despreTickerPath,
	} from '$lib/data/content';
	import ThumbRail from '$lib/components/ThumbRail.svelte';
	import Lenis from 'lenis';

	export let section: 'middle' | 'bottom' = 'middle';

	// Desktop: hero images for scrolling rail (same system as Acasa, bigger thumbs)
	$: gearItems = getAboutEquipmentItems(base, true);
	$: gearRailItems = gearItems.map((i) => ({ link: i.href, image: i.image, caption: i.title }));

	// Review-uri video: same hero images as equipment until dedicated assets exist
	$: reviewVideoItems = getDespreReviewVideoItems(base);

	let tickerWrapperEl: HTMLDivElement;
	let tickerContentEl: HTMLDivElement;
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

		tick().then(() => {
			if (browser && tickerWrapperEl && tickerContentEl) {
				lenisInstance = new Lenis({
					wrapper: tickerWrapperEl,
					content: tickerContentEl,
					lerp: 0.07,
					duration: 1.4,
					smoothWheel: true,
					wheelMultiplier: 0.8,
					autoRaf: true,
				});
			}
		});

		return () => {
			lenisInstance?.destroy();
		};
	});

	onDestroy(() => {
		lenisInstance?.destroy();
	});
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="ticker-area">
			<div class="ticker-content">
				<!-- Despre ticker: despre.txt, mouse-wheel scroll with inertia (same as Acasa white text) -->
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
			<ThumbRail items={gearRailItems} variant="large" />
		</div>
	</div>
{:else if section === 'bottom'}
	<!-- Same layout as Acasa bottom: label where search bar is (200px), then rail. Thumbs open YouTube in Photo System (when implementing Article). -->
	<div class="bottom-content">
		<div class="review-video-label">Review-uri video</div>
		<ThumbRail items={reviewVideoItems} />
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
</style>
