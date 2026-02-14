<script lang="ts">
	/**
	 * ParallaxGallery - Scroll-driven parallax image strip
	 * Each image moves at different speed for depth effect
	 * Consumes content from single source (content.ts)
	 */
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { ParallaxItemResolved } from '$lib/data/content';

	export let items: ParallaxItemResolved[] = [];
	export let parallaxSpeed = 0.3; // 0 = fixed, 1 = normal scroll

	let containerEl: HTMLElement;
	let cleanup: (() => void) | null = null;
	let removeResizeListener: (() => void) | null = null;

	onMount(() => {
		if (!browser || items.length === 0) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				function initParallax() {
					const slides = containerEl.querySelectorAll<HTMLElement>('.parallax-slide');
					slides.forEach((slide, i) => {
						const img = slide.querySelector<HTMLImageElement>('.slide-image img');
						if (!img) return;

						const speed = parallaxSpeed * (0.8 + (i % 3) * 0.4);
						const direction = i % 2 === 0 ? 1 : -1;
						/* Cap so with 15% overflow we never reveal frame (yPercent is % of img height; img is 130% of frame). */
						const maxShift = 28;

						gsap.to(img, {
							yPercent: maxShift * speed * direction,
							ease: 'none',
							scrollTrigger: {
								trigger: containerEl,
								start: 'top bottom',
								end: 'bottom top',
								scrub: 1
							}
						});
					});
				}

				function killParallax() {
					ScrollTrigger.getAll()
						.filter((st) => st.trigger === containerEl)
						.forEach((st) => st.kill());
					// Reset inline transforms so re-init starts from CSS default (no leftover yPercent)
					containerEl.querySelectorAll<HTMLImageElement>('.slide-image img').forEach((img) => {
						gsap.set(img, { clearProps: 'transform' });
					});
				}

				cleanup = killParallax;
				initParallax();

				// On orientation/resize: kill and re-create parallax so we always have
				// correct trigger bounds and transforms for the current layout.
				// (Refresh alone leaves a bad state after the first transition.)
				const scheduleReinit = (delay = 0) => {
					const run = () => {
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								killParallax();
								initParallax();
							});
						});
					};
					if (delay > 0) setTimeout(run, delay);
					else run();
				};
				const handleResize = () => scheduleReinit(0);
				const handleOrientationChange = () => scheduleReinit(150);
				window.addEventListener('resize', handleResize);
				window.addEventListener('orientationchange', handleOrientationChange);
				removeResizeListener = () => {
					window.removeEventListener('resize', handleResize);
					window.removeEventListener('orientationchange', handleOrientationChange);
				};
			});
		});
	});

	onDestroy(() => {
		cleanup?.();
		removeResizeListener?.();
	});
</script>

<div class="parallax-gallery" bind:this={containerEl}>
	<div class="parallax-track">
		{#each items as item}<a href={item.link} class="parallax-slide"><div class="slide-image"><img src={item.image} alt={item.caption} loading="lazy" /></div></a>{/each}
	</div>
</div>

<style>
	.parallax-gallery {
		position: relative;
		width: 100%;
		min-height: 100vh;
		min-height: 100svh;
		/* Allow the full stack of images to extend naturally.
		   Only hide horizontal overflow to prevent sideways scroll. */
		overflow-x: hidden;
		overflow-y: visible;
	}

	/* Track: vertical stack, no vertical gaps between slides */
	.parallax-track {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		padding: 0 var(--space-4); /* side safety margins on portrait; landscape overrides */
		line-height: 0;
	}

	.parallax-slide {
		display: block;
		width: 100%;
		max-width: 520px;
		flex-shrink: 0;
		text-decoration: none;
		color: inherit;
		margin: 0;
		padding: 0;
		vertical-align: top;
	}

	/* Slide frame: aspect-ratio sets height only; img is out-of-flow so it cannot create gaps. */
	.slide-image {
		position: relative;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		display: block;
		border-radius: 0;
		box-shadow: none;
		border: none;
	}

	/* Image out of flow: position absolute so it never affects slide height; frame size = aspect-ratio only. */
	.slide-image img {
		position: absolute;
		top: -15%;
		left: 0;
		width: 100%;
		height: 130%;
		object-fit: cover;
		will-change: transform;
	}

	/* No hover frame – keep the strip visually continuous */

	/* Orientation-specific behavior:
	   - Landscape: 4:3 images scaled so height never exceeds viewport
	   - Portrait: max width with side safety margins */
	@media (orientation: landscape) {
		/* Remove side padding, center content, keep no vertical gaps */
		.parallax-track {
			padding: 0;
			align-items: center;
		}

		.parallax-slide {
			/* Limit width so 4:3 fits within screen height, with a small margin */
			max-width: min(100%, calc(100vh * 4 / 3 * 0.9));
		}

		/* Landscape: use 4:3 for a wider cinematic crop,
		   derived purely from width constraint above */
		.slide-image {
			aspect-ratio: 4 / 3;
			width: 100%;
		}
	}

	@media (orientation: portrait) {
		.parallax-gallery {
			width: 100vw;
		}
	}
</style>
