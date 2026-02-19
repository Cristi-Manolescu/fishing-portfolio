<script lang="ts">
	/**
	 * Gallery - Mobile: Screen 1 title, Screen 2 two hero images with parallax + tap → panel, Screen 3 outro.
	 * Reuses Partide/Despre scroll/outro pattern and ArticleGallery for sliding panels.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import Chenar from '$lib/components/Chenar.svelte';
	import OutroSocialWordmark from '$lib/components/OutroSocialWordmark.svelte';
	import ArticleGallery from '$lib/components/ArticleGallery.svelte';
	import SectionNav from '$lib/components/SectionNav.svelte';
	import {
		galleryPhotoKeys,
		galleryHeroKeys,
		galleryVideos,
		imgPath,
	} from '$lib/data/content';

	$: galleryPhotos = galleryPhotoKeys.map((key) => ({
		src: base + imgPath.galleryPhoto(key),
		alt: `Foto ${key}`,
	}));

	$: galleryVideoImages = galleryVideos.map((v) => ({
		src: base + v.heroImage,
		alt: v.title,
		link: v.youtubeUrl,
	}));

	$: heroImageUrls = galleryHeroKeys.map((k) => base + imgPath.galleryHero(k));

	let screen1Wrap: HTMLElement;
	let screen2El: HTMLElement;
	let heroStripEl: HTMLElement;
	let screen3FixedVisible = false;
	let screen3ScrollTriggerCleanup: (() => void) | null = null;
	let parallaxCleanup: (() => void)[] = [];

	type PanelMode = 'photos' | 'videos' | null;
	let panelOpen: PanelMode = null;

	onMount(() => {
		if (!browser) return;

		import('gsap').then(({ gsap }) => {
			if (screen1Wrap) {
				gsap.set(screen1Wrap, { y: 80, opacity: 0 });
				gsap.to(screen1Wrap, {
					y: 0,
					opacity: 1,
					duration: 0.8,
					delay: 0.5,
					ease: 'power2.out',
				});
			}

			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);
				initHeroParallax(gsap, ScrollTrigger);
				initScreen3Reveal(ScrollTrigger);
			});
		});
	});

	onDestroy(() => {
		screen3ScrollTriggerCleanup?.();
		parallaxCleanup.forEach((fn) => fn());
	});

	function initHeroParallax(gsap: any, ScrollTrigger: any) {
		tick().then(() => {
			if (!heroStripEl) return;
			const slides = heroStripEl.querySelectorAll<HTMLElement>('.gallery-hero-slide');
			const parallaxSpeed = 0.25;
			const maxShift = 40;

			slides.forEach((slide, i) => {
				const img = slide.querySelector<HTMLImageElement>('.gallery-hero-slide-img');
				if (!img) return;
				const speed = parallaxSpeed * (0.8 + (i % 2) * 0.4);
				const direction = i % 2 === 0 ? 1 : -1;
				gsap.to(img, {
					yPercent: maxShift * speed * direction,
					ease: 'none',
					scrollTrigger: {
						trigger: heroStripEl,
						start: 'top bottom',
						end: 'bottom top',
						scrub: 1,
					},
				});
			});
			parallaxCleanup.push(() => {
				ScrollTrigger.getAll()
					.filter((st: any) => st.trigger === heroStripEl)
					.forEach((st: any) => st.kill());
				heroStripEl.querySelectorAll<HTMLImageElement>('.gallery-hero-slide-img').forEach((img) => {
					gsap.set(img, { clearProps: 'transform' });
				});
			});
		});
	}

	function initScreen3Reveal(ScrollTrigger: any) {
		if (!screen2El) return;
		const st = ScrollTrigger.create({
			trigger: screen2El,
			start: 'bottom bottom',
			end: 'bottom top',
			onEnter: () => {
				screen3FixedVisible = true;
			},
			onLeaveBack: () => {
				screen3FixedVisible = false;
			},
		});
		screen3ScrollTriggerCleanup = () => st.kill();
	}
</script>

<svelte:head>
	<title>Galerie – Pescuit în Argeș</title>
	<meta name="description" content="Galerie foto și video din partidele mele de pescuit" />
</svelte:head>

<main class="gallery-mobile">
	<section class="gallery-main" bind:this={screen2El}>
		<div class="gallery-spacer" aria-hidden="true"></div>
		<div class="gallery-chenar-wrap" bind:this={screen1Wrap}>
			<div class="gallery-scroll-hint" aria-hidden="true">
				<span class="scroll-text">Scroll</span>
				<span class="scroll-arrow">↓</span>
			</div>
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<div class="gallery-chenar-content">
					<!-- Screen 1: title only -->
					<div class="gallery-title-block">
						<h1 class="gallery-title">Galerie</h1>
					</div>

					<!-- Screen 2: two full-screen hero images with parallax, title + hint overlay, tappable -->
					<div class="gallery-hero-strip" bind:this={heroStripEl}>
						{#each heroImageUrls as url, i}
							<div class="gallery-hero-slide">
								<div class="gallery-hero-slide-image">
									<img
										src={url}
										alt={i === 0 ? 'Foto' : 'Video'}
										class="gallery-hero-slide-img"
										loading="eager"
									/>
								</div>
								<div class="gallery-hero-overlay" aria-hidden="true">
									<h2 class="gallery-hero-title">{i === 0 ? 'Foto' : 'Video'}</h2>
									<p class="gallery-hero-hint">Apasa pentru galerie</p>
								</div>
								<button
									type="button"
									class="gallery-hero-tap"
									aria-label={i === 0 ? 'Deschide galeria foto' : 'Deschide galeria video'}
									on:click={() => (panelOpen = i === 0 ? 'photos' : 'videos')}
								></button>
							</div>
						{/each}
					</div>
				</div>
			</Chenar>
		</div>
	</section>

	<!-- Screen 3: fixed outro -->
	<section class="gallery-screen-3">
		<div class="gallery-screen-3-spacer" aria-hidden="true"></div>
		{#if screen3FixedVisible}
			<div class="gallery-screen-3-fixed">
				<SectionNav navClass="gallery-screen-3-nav" />
				<div class="gallery-screen-3-wordmark-chenar">
					<OutroSocialWordmark />
				</div>
			</div>
		{/if}
	</section>
</main>

<!-- Sliding panels: Foto / Video -->
<ArticleGallery
	open={panelOpen === 'photos'}
	onClose={() => (panelOpen = null)}
	images={galleryPhotos}
	title="Foto"
	mainGalleryHref={base + '/gallery/'}
/>
<ArticleGallery
	open={panelOpen === 'videos'}
	onClose={() => (panelOpen = null)}
	images={galleryVideoImages}
	title="Video"
	ariaLabel="Galerie video"
	mainGalleryHref={base + '/gallery/'}
/>

<style>
	.gallery-mobile {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100svh;
	}

	.gallery-main {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		padding: var(--space-4) 0 0;
		padding-bottom: 0;
		overflow-x: hidden;
	}

	.gallery-spacer {
		flex: 1;
		min-height: calc(100vh - var(--header-height) - 11rem);
		min-height: calc(100svh - var(--header-height) - 11rem);
	}

	@media (orientation: landscape) {
		.gallery-spacer {
			min-height: calc(100vh - var(--header-height) - 15rem);
			min-height: calc(100svh - var(--header-height) - 15rem);
		}
	}

	.gallery-chenar-wrap {
		width: 100%;
		margin-top: var(--space-3);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.gallery-scroll-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		animation: gallery-bounce 2s ease-in-out infinite;
	}

	.gallery-scroll-hint .scroll-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.gallery-scroll-hint .scroll-arrow {
		font-size: var(--font-size-lg);
		color: var(--color-accent);
	}

	@keyframes gallery-bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(6px);
		}
	}

	.gallery-chenar-wrap :global(.chenar) {
		width: 100%;
		align-self: stretch;
	}

	.gallery-chenar-content {
		display: flex;
		flex-direction: column;
	}

	.gallery-title-block {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4) var(--space-4) max(var(--space-6), env(safe-area-inset-bottom));
	}

	.gallery-title {
		font-family: var(--font-family-script);
		font-size: clamp(2.5rem, 12vw, 5rem);
		font-weight: normal;
		color: var(--color-text-primary);
		text-shadow:
			0 0 30px rgba(255, 255, 255, 0.3),
			0 2px 15px rgba(0, 0, 0, 0.5);
		margin: 0;
	}

	/* Screen 2: two full-screen hero images inside Chenar, parallax, no gaps */
	.gallery-hero-strip {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0;
		width: 100%;
		padding: 0;
		line-height: 0;
	}

	.gallery-hero-slide {
		position: relative;
		display: block;
		width: 100%;
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		flex-shrink: 0;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	.gallery-hero-slide-image {
		position: absolute;
		inset: 0;
		overflow: hidden;
		display: block;
		border-radius: 0;
	}

	.gallery-hero-slide-img {
		position: absolute;
		top: -15%;
		left: 0;
		width: 100%;
		height: 130%;
		object-fit: cover;
		will-change: transform;
	}

	/* Title + hint overlay: centered-left, Lakes typography, visibility on light/dark images */
	.gallery-hero-overlay {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		padding: var(--space-4) var(--space-5);
		text-align: left;
		pointer-events: none;
		z-index: 1;
	}

	/* Same size as Lakes .lake-block-title */
	.gallery-hero-title {
		font-family: var(--font-family-base);
		font-size: clamp(2.25rem, 9vw, 3.75rem);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-2);
		/* Visibility on light images: dark outline + light glow + soft backdrop */
		text-shadow:
			0 0 1px rgba(0, 0, 0, 1),
			0 1px 2px rgba(0, 0, 0, 0.9),
			0 2px 4px rgba(0, 0, 0, 0.8),
			0 0 20px rgba(0, 0, 0, 0.5),
			0 0 40px rgba(255, 255, 255, 0.15);
	}

	/* Same size as Lakes description (.lake-block-description) */
	.gallery-hero-hint {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		line-height: var(--line-height-relaxed);
		margin: 0;
		font-style: italic;
		/* Visibility on light images */
		text-shadow:
			0 0 1px rgba(0, 0, 0, 1),
			0 1px 3px rgba(0, 0, 0, 0.85),
			0 2px 6px rgba(0, 0, 0, 0.6),
			0 0 16px rgba(0, 0, 0, 0.4),
			0 0 24px rgba(255, 255, 255, 0.12);
	}

	.gallery-hero-tap {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		z-index: 2;
	}

	@media (orientation: landscape) {
		.gallery-hero-slide {
			min-height: calc(100vh - var(--header-height));
			min-height: calc(100svh - var(--header-height));
		}

		.gallery-hero-overlay {
			padding: var(--space-4) var(--space-6);
		}
	}

	/* Screen 3 */
	.gallery-screen-3 {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
	}

	.gallery-screen-3-spacer {
		display: block;
		min-height: 100vh;
		min-height: 100svh;
	}

	.gallery-screen-3-fixed {
		position: fixed;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.gallery-screen-3-wordmark-chenar {
		pointer-events: auto;
		flex: 0 0 auto;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
	}

</style>
