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
			});
		});
	});

	onDestroy(() => {
		cleanup?.();
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
		overflow: hidden;
	}

	/* Track: vertical stack, no gaps between slides */
	.parallax-track {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		padding: 0 var(--space-4);
	}

	.parallax-slide {
		display: block;
		width: 100%;
		max-width: 520px;
		text-decoration: none;
		color: inherit;
	}

	/* Slide frame: fixed aspect, images will be taller inside.
	   Default to portrait-friendly ratio; landscape overrides below. */
	.slide-image {
		position: relative;
		aspect-ratio: 3 / 4;
		border-radius: var(--radius-lg, 12px);
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Inner image is ~30% taller than the frame for inner parallax */
	.slide-image img {
		width: 100%;
		height: 130%;
		object-fit: cover;
		transform: translateY(-15%);
		will-change: transform;
	}

	.parallax-slide:hover .slide-image {
		border-color: var(--color-accent);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
			0 0 30px color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	/* Orientation-specific behavior:
	   - Landscape: height follows viewport height
	   - Portrait: width follows viewport width */
	@media (orientation: landscape) {
		.parallax-gallery {
			height: 100vh;
		}

		/* Landscape: use 4:3 for a wider cinematic crop */
		.slide-image {
			aspect-ratio: 4 / 3;
		}
	}

	@media (orientation: portrait) {
		.parallax-gallery {
			width: 100vw;
		}

		.parallax-slide {
			max-width: none;
		}
	}
</style>
