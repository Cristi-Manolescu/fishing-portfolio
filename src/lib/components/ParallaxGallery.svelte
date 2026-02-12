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

				// Inner-container parallax:
				// - The outer slide stays fixed in the flow
				// - The image inside is ~30% taller and moves within
				//   its frame to create a parallax crop effect.
				const slides = containerEl.querySelectorAll<HTMLElement>('.parallax-slide');

				slides.forEach((slide, i) => {
					const img = slide.querySelector<HTMLImageElement>('.slide-image img');
					if (!img) return;

					// Stronger inner parallax for better visibility
					const speed = parallaxSpeed * (0.8 + (i % 3) * 0.4);
					const direction = i % 2 === 0 ? 1 : -1;
					const maxShift = 60; // how far image can move inside its frame (in %)

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

				// Kill our ScrollTriggers on destroy (they all share containerEl)
				cleanup = () => {
					ScrollTrigger.getAll()
						.filter((st) => st.trigger === containerEl)
						.forEach((st) => st.kill());
				};

				// Ensure orientation/resize changes don't break the seamless strip:
				// when viewport size/orientation changes, ask ScrollTrigger to
				// recalculate all start/end positions using the new layout.
				const handleResize = () => {
					ScrollTrigger.refresh();
				};
				window.addEventListener('resize', handleResize);
				removeResizeListener = () => {
					window.removeEventListener('resize', handleResize);
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
		{#each items as item}
			<a href={item.link} class="parallax-slide">
				<div class="slide-image">
					<img src={item.image} alt={item.caption} loading="lazy" />
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.parallax-gallery {
		position: relative;
		width: 100%;
		min-height: 100vh;
		min-height: 100dvh;
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
	}

	.parallax-slide {
		display: block;
		width: 100%;
		max-width: 520px;
		text-decoration: none;
		color: inherit;
		margin: 0;
	}

	/* Slide frame: fixed aspect, images will be taller inside.
	   Default to portrait-friendly ratio; landscape overrides below. */
	.slide-image {
		position: relative;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		/* No visible frame – keep edges seamless against Chenar background */
		border-radius: 0;
		box-shadow: none;
		border: none;
	}

	/* Inner image is ~30% taller than the frame for inner parallax */
	.slide-image img {
		width: 100%;
		height: 130%;
		object-fit: cover;
		transform: translateY(-15%);
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
