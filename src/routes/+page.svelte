<script lang="ts">
	/**
	 * Mobile Home Page
	 * Scrolling layout with multiple "screens":
	 * - Screen 1: Wordmark hero (full viewport, wordmark in bottom 1/3)
	 * - Screen 2: Ticker with intro text  
	 * - Screen 3: Parallax gallery
	 * - Screen 4: Outro/CTA
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { scrollY } from '$lib/stores/scroll';
	import Chenar from '$lib/components/Chenar.svelte';
	import TickerReveal from '$lib/components/TickerReveal.svelte';
	import StackCarousel from '$lib/components/StackCarousel.svelte';
	import ParallaxGallery from '$lib/components/ParallaxGallery.svelte';
	import { content, getCarouselImages, getParallaxItems } from '$lib/data/content';
	import { isMobile } from '$lib/stores/device';

	let wordmarkEl: HTMLElement;
	let screen1El: HTMLElement;
	let screen2_3El: HTMLElement;
	let screen4FixedVisible = false;
	let isWordmarkVisible = true;
	let isHydrated = false;
	let screen4ScrollTriggerCleanup: (() => void) | null = null;

	// Avoid SSR/client hydration mismatch by deferring
	// viewport-specific image selection until after mount.
	// Use the reactive `$isMobile` store value only once the
	// component is hydrated on the client.
	const getIsMobileRuntime = () => (isHydrated ? $isMobile : false);

	// Content from single source - responsive images
	$: carouselImages = getCarouselImages(getIsMobileRuntime());
	// Parallax: always use mobile images on this (mobile) page so orientation
	// change doesn't swap URL set and cause reload/layout gaps.
	$: parallaxItems = getParallaxItems(true);

	onMount(() => {
		// Mark as hydrated so subsequent reactive runs can
		// safely use browser-only/device-specific information.
		isHydrated = true;

		if (!browser) return;

		// Dynamic import GSAP
		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(async ({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);
				await tick();

				// Decide whether to play the intro animation based on whether
				// Screen 1 is actually in view on mount. If we're refreshed
				// while scrolled down (Screen 2/3), we skip the intro, but
				// still set up ScrollTrigger so the wordmark can appear when
				// the user scrolls back to Screen 1.
				let runIntro = true;
				if (screen1El) {
					const viewportHeight =
						window.innerHeight || document.documentElement.clientHeight || 0;
					const rect = screen1El.getBoundingClientRect();
					const isScreen1Active = rect.bottom > 0 && rect.top < viewportHeight;
					runIntro = isScreen1Active;
				}

				initWordmarkAnimations(gsap, ScrollTrigger, runIntro);
				initScreen4Reveal(gsap, ScrollTrigger);
			});
		});
	});

	onDestroy(() => {
		screen4ScrollTriggerCleanup?.();
	});

	function initScreen4Reveal(gsap: any, ScrollTrigger: any) {
		if (!screen2_3El) return;
		const st = ScrollTrigger.create({
			trigger: screen2_3El,
			start: 'bottom bottom',
			end: 'bottom top',
			onEnter: () => { screen4FixedVisible = true; },
			onLeaveBack: () => { screen4FixedVisible = false; }
		});
		screen4ScrollTriggerCleanup = () => st.kill();
	}

	function initWordmarkAnimations(gsap: any, ScrollTrigger: any, runIntro = true) {
		if (!wordmarkEl || !screen1El) return;

		const span = wordmarkEl.querySelector('.wordmark-text');
		const turbEl = document.getElementById('wordmark-turb');
		const dispEl = document.getElementById('wordmark-disp');

		// Initial state (script fonts work better with subtle letter-spacing changes)
		gsap.set(wordmarkEl, { y: 40, opacity: 0, scale: 0.95 });
		if (dispEl) gsap.set(dispEl, { attr: { scale: 12 } });

		if (runIntro) {
			// Intro animation
			const introTl = gsap.timeline({ delay: 0.3 });
			introTl.to(wordmarkEl, {
				y: 0,
				opacity: 1,
				scale: 1,
				duration: 1.4,
				ease: 'power2.out'
			});
			if (dispEl)
				introTl.to(
					dispEl,
					{ attr: { scale: 2 }, duration: 1.4, ease: 'power2.out' },
					0
				);

			// Floating loop animation
			introTl.call(() => {
				gsap.to(wordmarkEl, {
					y: -5,
					duration: 2.5,
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1
				});
				if (turbEl) {
					gsap.to(turbEl, {
						attr: { baseFrequency: '0.02 0.025' },
						duration: 3,
						ease: 'sine.inOut',
						yoyo: true,
						repeat: -1
					});
				}
			});
		}

		// Scroll-triggered hide
		ScrollTrigger.create({
			trigger: screen1El,
			start: 'bottom 80%',
			end: 'bottom 20%',
			scrub: 0.5,
			onUpdate: (self: any) => {
				if (!wordmarkEl) return; // Guard: element may be gone (navigation/unmount)
				const progress = self.progress;
				gsap.set(wordmarkEl, { 
					opacity: 1 - progress,
					y: progress * -40,
					scale: 1 - (progress * 0.1)
				});
				if (dispEl) {
					const scale = 2 + (progress * 10);
					gsap.set(dispEl, { attr: { scale } });
				}
				isWordmarkVisible = progress < 0.9;
			}
		});

		// Hover/touch interaction
		wordmarkEl.addEventListener('mouseenter', () => {
			if (dispEl && isWordmarkVisible) gsap.to(dispEl, { attr: { scale: 10 }, duration: 0.3 });
		});
		wordmarkEl.addEventListener('mouseleave', () => {
			if (dispEl && isWordmarkVisible) gsap.to(dispEl, { attr: { scale: 3 }, duration: 0.3 });
		});
	}
</script>

<!-- SVG Filters for Wordmark Caustics Effect -->
<svg class="svg-filters" aria-hidden="true">
	<defs>
		<filter id="wordmark-caustics" filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="140%" height="140%">
			<feTurbulence 
				id="wordmark-turb"
				type="fractalNoise" 
				baseFrequency="0.015 0.02" 
				numOctaves="3" 
				result="turb"
				seed="1"
			/>
			<feDisplacementMap 
				id="wordmark-disp"
				in="SourceGraphic" 
				in2="turb" 
				scale="3"
				xChannelSelector="R" 
				yChannelSelector="G"
			/>
		</filter>
	</defs>
</svg>

<main class="home-mobile">
	<!-- ==================== SCREEN 1: WORDMARK HERO ==================== -->
	<section class="screen screen-1" bind:this={screen1El}>
		<!-- Wordmark: positioned in last 1/3 of screen -->
		<div class="wordmark-fixed" bind:this={wordmarkEl}>
			<h1 class="wordmark">
				<span class="wordmark-text">Pescuit în Argeș</span>
			</h1>
		</div>
		
		<!-- Scroll indicator at bottom -->
		<div class="scroll-indicator">
			<span class="scroll-text">Scroll</span>
			<span class="scroll-arrow">↓</span>
		</div>
	</section>

	<!-- ==================== SCREENS 2–3: TICKER + CAROUSEL + PARALLAX (ONE CONTINUOUS CHENAR) ==================== -->
	<section class="screen screen-2-3" bind:this={screen2_3El}>
		<Chenar variant="minimal" glowIntensity="none" noPadding>
			<div class="screen-2-3-content">
				<!-- Screen 2: Ticker + Carousel -->
				<div class="screen-2-block">
					<div class="screen-2-content">
						<!-- Ticker with blurry reveal -->
						<div class="ticker-section">
							<TickerReveal 
								text="Pescuit în Argeș nu este un site despre cum trebuie făcut pescuitul. Este despre cum l-am trăit eu."
								delay={0.3}
								stagger={0.06}
							/>
						</div>
						
						<!-- 3D Stacking Carousel -->
						<div class="carousel-section">
							<StackCarousel 
								images={carouselImages}
								autoPlayInterval={3500}
							/>
						</div>
					</div>
				</div>

				<!-- Screen 3: Parallax Gallery -->
				<div class="screen-3-block">
					<ParallaxGallery items={parallaxItems} parallaxSpeed={0.25} />
				</div>
			</div>
		</Chenar>
	</section>

	<!-- ==================== SCREEN 4: OUTRO (fixed layer under Screen 3; wordmark in Chenar at bottom, nav in top half) ==================== -->
	<section class="screen screen-4">
		<div class="screen-4-spacer" aria-hidden="true"></div>
		{#if screen4FixedVisible}
			<div class="screen-4-fixed">
				<nav class="screen-4-nav" aria-label="Principal">
					<a href="/about" class="outro-link">Despre</a>
					<a href="/sessions" class="outro-link">Partide</a>
					<a href="/gallery" class="outro-link">Galerie</a>
					<a href="/contact" class="outro-link">Contact</a>
				</nav>
				<div class="screen-4-wordmark-chenar">
					<Chenar variant="minimal" glowIntensity="subtle" noPadding>
						<h2 class="wordmark wordmark-outro">Pescuit în Argeș</h2>
					</Chenar>
				</div>
			</div>
		{/if}
	</section>
</main>

<style>
	/* ========== SVG Filters (hidden) ========== */
	.svg-filters {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
	}

	/* ========== Base Layout ========== */
	.home-mobile {
		/* No padding - screens control their own spacing */
	}

	.screen {
		position: relative;
		min-height: 100vh;
		min-height: 100dvh;
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	/* ==================== SCREEN 1: WORDMARK ==================== */
	.screen-1 {
		/* Full viewport, account for header */
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100dvh - var(--header-height));
		/* No padding - wordmark is fixed positioned */
	}

	/* Wordmark: fixed in the center of the viewport */
	.wordmark-fixed {
		position: fixed;
		/* Center of the screen */
		top: 50vh;
		left: 0;
		right: 0;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		pointer-events: auto;
		/* Apply caustics filter */
		filter: url(#wordmark-caustics);
		-webkit-filter: url(#wordmark-caustics);
		will-change: transform, opacity;
	}

	.wordmark {
		font-family: var(--font-family-script);
		font-weight: normal;
		text-align: center;
		margin: 0;
	}

	.wordmark-text {
		display: block;
		font-size: clamp(2.3rem, 9.2vw, 5.2rem);
		color: var(--color-text-primary);
		/* No text-transform - keep original casing */
		letter-spacing: 0.05em;
		text-shadow: 
			0 0 30px rgba(255, 255, 255, 0.4),
			0 2px 15px rgba(0, 0, 0, 0.6);
		white-space: nowrap;
	}

	/* Scroll indicator at bottom of Screen 1 */
	.scroll-indicator {
		position: absolute;
		bottom: var(--space-6);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		animation: bounce 2s ease-in-out infinite;
	}

	.scroll-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.scroll-arrow {
		font-size: var(--font-size-lg);
		color: var(--color-accent);
	}

	@keyframes bounce {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(8px); }
	}

	/* ==================== SCREENS 2–3: TICKER + CAROUSEL + PARALLAX ==================== */
	.screen-2-3 {
		position: relative;
		z-index: 10;
		/* Background behind the continuous Chenar */
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.3) 0%,
			rgba(0, 0, 0, 0.5) 100%
		);
		/* Clip horizontal overflow to prevent page scroll */
		overflow-x: hidden;
		overflow-y: visible;
	}

	.screen-2-3 > .chenar {
		/* Ensure the Chenar fills this entire combined screen */
		height: 100%;
	}

	.screen-2-3-content {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	.screen-2-block,
	.screen-3-block {
		width: 100%;
	}

	.screen-2-content {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		padding: var(--space-4);
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100dvh - var(--header-height));
		/* Clip horizontal overflow */
		overflow-x: hidden;
	}

	.ticker-section {
		/* Top portion - ticker reveal */
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6) 0 var(--space-4);
	}

	.carousel-section {
		/* Remaining space - 3D carousel */
		flex: 1;
		position: relative;
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Allow vertical overflow for 3D effect, clip horizontal */
		overflow: hidden;
	}

	/* Screen 3 – ParallaxGallery fills and handles its own layout via .screen-3-block */

	/* ==================== SCREEN 4: OUTRO ==================== */
	/* Screen 4 fixed layer sits under Screen 3 (z-index lower); wordmark in Chenar only, fixed at bottom */
	.screen-4 {
		position: relative;
		min-height: 100vh;
		min-height: 100dvh;
	}

	.screen-4-spacer {
		display: block;
		min-height: 100vh;
		min-height: 100dvh;
	}

	/* Fixed layer: below Screen 3 so parallax/ticker scroll over it */
	.screen-4-fixed {
		position: fixed;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.screen-4-nav {
		pointer-events: auto;
		flex: 0 0 auto;
		/* First half of screen below header */
		padding-top: var(--header-height);
		min-height: 0;
		height: 50vh;
		height: 50dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
	}

	/* Chenar only around wordmark; fixed at bottom of viewport */
	.screen-4-wordmark-chenar {
		pointer-events: auto;
		flex: 0 0 auto;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		padding: 0 var(--space-4) max(var(--space-6), env(safe-area-inset-bottom));
	}

	.screen-4-wordmark-chenar :global(.chenar) {
		width: auto;
		max-width: 100%;
	}

	.screen-4-wordmark-chenar :global(.chenar-content) {
		padding: var(--space-5) var(--space-8);
	}

	/* Screen 4 outro: single line, white, 50% larger than wordmark-small */
	.wordmark-outro {
		font-size: clamp(2.25rem, 12vw, 4.5rem);
		color: var(--color-text-primary);
		white-space: nowrap;
	}

	.wordmark-small {
		font-size: clamp(1.5rem, 8vw, 3rem);
	}

	.outro-link {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		text-shadow:
			0 0 2px rgba(0, 0, 0, 0.8),
			0 1px 3px rgba(0, 0, 0, 0.6),
			0 2px 6px rgba(0, 0, 0, 0.4);
		transition: color var(--duration-fast) var(--ease-out),
			text-shadow var(--duration-fast) var(--ease-out);
	}

	.outro-link:hover {
		color: var(--color-accent);
		text-shadow:
			0 0 2px rgba(0, 0, 0, 0.9),
			0 1px 4px rgba(0, 0, 0, 0.7),
			0 2px 8px rgba(0, 0, 0, 0.5);
	}
</style>
