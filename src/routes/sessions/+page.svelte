<script lang="ts">
	/**
	 * Partide (Sessions) - Mobile: Level 1 Home + Level 2 Lacuri
	 * Screen 1: Title "Partide" at bottom (unchanged). One continuous Chenar.
	 * Screen 2: Per-lake blocks: Title (50% bigger), description (from assets), hint + "Vezi partide", hero image.
	 * Portrait: single column. Landscape: two columns (title left, description+hint right), image centered.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import Chenar from '$lib/components/Chenar.svelte';
	import { lakes } from '$lib/data/content';

	/** Lake id → loaded description text (client-side from assets/text-m/partide/{id}.txt) */
	let lakeDescriptions: Record<string, string> = {};

	let screen1Wrap: HTMLElement;
	let screen2El: HTMLElement;
	let screen3FixedVisible = false;
	let screen3ScrollTriggerCleanup: (() => void) | null = null;
	let imageScrollCleanup: (() => void)[] = [];
	let titleAnimCleanup: (() => void)[] = [];

	onMount(() => {
		if (!browser) return;

		lakes.forEach((lake) => {
			const url = `${base}/assets/text-m/partide/${lake.id}.txt`;
			fetch(url)
				.then((r) => (r.ok ? r.text() : null))
				.then((text) => {
					if (text != null) {
						lakeDescriptions = { ...lakeDescriptions, [lake.id]: text.trim() };
					}
				})
				.catch(() => {});
		});

		const hashId = window.location.hash.slice(1);
		if (hashId && lakes.some((l) => l.id === hashId)) {
			tick().then(() => {
				requestAnimationFrame(() => {
					const el = document.getElementById(hashId);
					if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
				});
			});
		}

		import('gsap').then(({ gsap }) => {
			gsap.set(screen1Wrap, { y: 80, opacity: 0 });
			gsap.to(screen1Wrap, {
				y: 0,
				opacity: 1,
				duration: 0.8,
				delay: 0.5,
				ease: 'power2.out',
			});

			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);
				initLakeImageScrollAnim(gsap, ScrollTrigger);
				initLakeTitleAnim(gsap, ScrollTrigger);
				initScreen3Reveal(ScrollTrigger);
			});
		});
	});

	onDestroy(() => {
		screen3ScrollTriggerCleanup?.();
		imageScrollCleanup.forEach((fn) => fn());
		titleAnimCleanup.forEach((fn) => fn());
	});

	/**
	 * Accelerated scroll: image starts 50% lower, reaches final position exactly when fully visible.
	 * On exit: image achieves 50% lower and out-of-screen at the same time.
	 */
	function initLakeImageScrollAnim(gsap: any, ScrollTrigger: any) {
		tick().then(() => {
			const images = document.querySelectorAll<HTMLElement>('.lake-block-image');
			const vh = () => window.innerHeight;

			function updateImageY(img: HTMLElement) {
				const rect = img.getBoundingClientRect();
				const h = vh();
				const imgH = rect.height;
				let yPct = 0;
				if (rect.bottom <= 0) {
					yPct = 50;
				} else if (rect.top >= h) {
					yPct = 50;
				} else if (rect.top >= 0 && rect.bottom <= h) {
					yPct = 0;
				} else if (rect.top < 0) {
					yPct = (50 * (-rect.top)) / imgH;
					if (yPct > 50) yPct = 50;
				} else {
					yPct = 50 * Math.min(1, (rect.bottom - h) / imgH);
				}
				gsap.set(img, { y: `${yPct}%` });
			}

			images.forEach((img) => {
				const st = ScrollTrigger.create({
					trigger: img,
					start: 'top bottom',
					end: 'bottom top',
					onUpdate: () => updateImageY(img),
				});
				imageScrollCleanup.push(() => st.kill());
				updateImageY(img);
			});
		});
	}

	/**
	 * Lake title: starts below + 0 opacity; when description is half visible, slide up and fade in.
	 * Resets on leave back so the animation replays when scrolling into the zone again.
	 */
	function initLakeTitleAnim(gsap: any, ScrollTrigger: any) {
		tick().then(() => {
			const blocks = document.querySelectorAll<HTMLElement>('.lake-block');
			blocks.forEach((block) => {
				const body = block.querySelector<HTMLElement>('.lake-block-body');
				const title = block.querySelector<HTMLElement>('.lake-block-title');
				if (!body || !title) return;

				gsap.set(title, { y: 28, opacity: 0 });

				const st = ScrollTrigger.create({
					trigger: body,
					start: 'top 70%',
					onEnter: () => {
						gsap.to(title, {
							y: 0,
							opacity: 1,
							duration: 0.6,
							ease: 'power2.out',
						});
					},
					onLeaveBack: () => {
						gsap.set(title, { y: 28, opacity: 0 });
					},
				});
				titleAnimCleanup.push(() => st.kill());
			});
		});
	}

	function initScreen3Reveal(ScrollTrigger: any) {
		if (!screen2El) return;
		const st = ScrollTrigger.create({
			trigger: screen2El,
			start: 'bottom bottom',
			end: 'bottom top',
			onEnter: () => { screen3FixedVisible = true; },
			onLeaveBack: () => { screen3FixedVisible = false; },
		});
		screen3ScrollTriggerCleanup = () => st.kill();
	}
</script>

<svelte:head>
	<title>Partide – Pescuit în Argeș</title>
	<meta name="description" content="Partidele mele de pescuit pe lacurile din zona Argeșului" />
</svelte:head>

<main class="sessions-mobile">
	<section class="sessions-main" bind:this={screen2El}>
		<div class="sessions-spacer" aria-hidden="true"></div>
		<div class="sessions-chenar-wrap" bind:this={screen1Wrap}>
			<div class="sessions-scroll-hint" aria-hidden="true">
				<span class="scroll-text">Scroll</span>
				<span class="scroll-arrow">↓</span>
			</div>
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<div class="sessions-chenar-content">
					<!-- Screen 1: title only -->
					<div class="sessions-title-block">
						<h1 class="sessions-title">Partide</h1>
					</div>

					<!-- Screen 2: lake blocks - Title, Description, hint + Vezi partide, hero image -->
					<div class="lake-blocks">
						{#each lakes as lake}
							<article id={lake.id} class="lake-block">
								<div class="lake-block-text">
									<div class="lake-block-header">
										<h3 class="lake-block-title">{lake.title}</h3>
									</div>
									<div class="lake-block-body">
										{#if lakeDescriptions[lake.id]}
											<div class="lake-block-description">{lakeDescriptions[lake.id]}</div>
										{:else}
											<p class="lake-block-loading">Se încarcă...</p>
										{/if}
										<div class="lake-block-cta">
											<span class="lake-block-hint">Vezi partidele de pe acest lac</span>
											<a href={base + lake.href} class="lake-block-btn" data-sveltekit-preload-data="hover">Vezi partide</a>
										</div>
									</div>
								</div>
								<div class="lake-block-image-wrap">
									<a href={base + lake.href} class="lake-block-image-link" data-sveltekit-preload-data="hover">
										<img
											src={base + lake.image}
											alt={lake.title}
											class="lake-block-image"
										/>
									</a>
								</div>
							</article>
						{/each}
					</div>
				</div>
			</Chenar>
		</div>
	</section>

	<section class="sessions-screen-3">
		<div class="sessions-screen-3-spacer" aria-hidden="true"></div>
		{#if screen3FixedVisible}
			<div class="sessions-screen-3-fixed">
				<nav class="sessions-screen-3-nav" aria-label="Principal">
					<a href={base + '/'} class="outro-link">Acasă</a>
					<a href={base + '/sessions/'} class="outro-link">Partide</a>
					<a href={base + '/gallery/'} class="outro-link">Galerie</a>
					<a href={base + '/contact/'} class="outro-link">Contact</a>
				</nav>
				<div class="sessions-screen-3-wordmark-chenar">
					<Chenar variant="minimal" glowIntensity="subtle" noPadding>
						<h2 class="wordmark wordmark-outro">Pescuit în Argeș</h2>
					</Chenar>
				</div>
			</div>
		{/if}
	</section>
</main>

<style>
	.sessions-mobile {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100svh;
	}

	.sessions-main {
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

	.sessions-spacer {
		flex: 1;
		min-height: calc(100vh - var(--header-height) - 11rem);
		min-height: calc(100svh - var(--header-height) - 11rem);
	}

	@media (orientation: landscape) {
		.sessions-spacer {
			min-height: calc(100vh - var(--header-height) - 15rem);
			min-height: calc(100svh - var(--header-height) - 15rem);
		}
	}

	.sessions-chenar-wrap {
		width: 100%;
		margin-top: var(--space-3);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.sessions-scroll-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		animation: sessions-bounce 2s ease-in-out infinite;
	}

	.sessions-scroll-hint .scroll-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.sessions-scroll-hint .scroll-arrow {
		font-size: var(--font-size-lg);
		color: var(--color-accent);
	}

	@keyframes sessions-bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(6px); }
	}

	.sessions-chenar-wrap :global(.chenar) {
		width: 100%;
		align-self: stretch;
	}

	.sessions-chenar-content {
		display: flex;
		flex-direction: column;
	}

	.sessions-title-block {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4) var(--space-4) max(var(--space-6), env(safe-area-inset-bottom));
	}

	.sessions-title {
		font-family: var(--font-family-script);
		font-size: clamp(2.5rem, 12vw, 5rem);
		font-weight: normal;
		color: var(--color-text-primary);
		text-shadow:
			0 0 30px rgba(255, 255, 255, 0.3),
			0 2px 15px rgba(0, 0, 0, 0.5);
		margin: 0;
	}

	/* ========== Lake blocks (Screen 2) ========== */
	.lake-blocks {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: 0 var(--space-4) var(--space-12);
	}

	.lake-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* Portrait: single column. Title left, space, description left, hint+button right, image */
	.lake-block-text {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.lake-block-header {
		/* Generous space equal to title size (one line height of the title) */
		margin-bottom: 1em;
	}

	.lake-block-title {
		font-family: var(--font-family-base);
		font-size: clamp(2.25rem, 9vw, 3.75rem);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
		text-align: left;
		/* Initial state before GSAP: slide from below, hidden; GSAP overrides when description half visible */
		opacity: 0;
		transform: translateY(28px);
	}

	.lake-block-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-top: 0.5em;
	}

	.lake-block-description {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		text-align: justify;
		white-space: pre-line;
	}

	.lake-block-loading {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.lake-block-cta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	.lake-block-hint {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.lake-block-btn {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-bg-primary);
		background: var(--color-accent);
		border-radius: var(--frame-radius);
		text-decoration: none;
		transition: opacity var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
	}

	.lake-block-btn:hover {
		opacity: 0.95;
		transform: scale(1.02);
	}

	/* Portrait: image = half screen height, 3:4 aspect ratio */
	.lake-block-image-wrap {
		width: 100%;
		max-width: 100%;
		height: 50vh;
		height: 50svh;
		margin: 0 auto;
		border-radius: var(--frame-radius);
		overflow: hidden;
		aspect-ratio: 3 / 4;
	}

	.lake-block-image-link {
		display: block;
		width: 100%;
		height: 100%;
		text-decoration: none;
		color: inherit;
	}

	.lake-block-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		will-change: transform;
	}

	/* Landscape: two columns (title left, description+hint right), image full height 4:3 centered */
	@media (orientation: landscape) {
		.lake-block {
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto auto;
			gap: var(--space-6);
			align-items: start;
		}

		.lake-block-text {
			grid-column: 1 / -1;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: var(--space-6);
			align-items: center;
		}

		.lake-block-header {
			display: flex;
			align-items: center;
			justify-content: flex-start;
			margin-bottom: 0;
		}

		.lake-block-title {
			text-align: left;
		}

		.lake-block-body {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			text-align: right;
			margin-top: 0;
		}

		.lake-block-description {
			text-align: right;
		}

		.lake-block-cta {
			justify-content: flex-end;
		}

		/* Image: full screen height, 4:3, horizontally centered */
		.lake-block-image-wrap {
			grid-column: 1 / -1;
			width: 100%;
			height: 100vh;
			height: 100svh;
			display: flex;
			justify-content: center;
			overflow: hidden;
			margin-left: auto;
			margin-right: auto;
		}

		.lake-block-image-wrap .lake-block-image {
			height: 100%;
			width: auto;
			aspect-ratio: 4 / 3;
			object-fit: cover;
		}
	}

	/* ========== Screen 3 (unchanged) ========== */
	.sessions-screen-3 {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
	}

	.sessions-screen-3-spacer {
		display: block;
		min-height: 100vh;
		min-height: 100svh;
	}

	.sessions-screen-3-fixed {
		position: fixed;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.sessions-screen-3-nav {
		pointer-events: auto;
		flex: 0 0 auto;
		padding-top: var(--header-height);
		height: 50vh;
		height: 50svh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
	}

	.sessions-screen-3-wordmark-chenar {
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

	.sessions-screen-3-wordmark-chenar :global(.chenar) {
		width: auto;
		max-width: 100%;
	}

	.sessions-screen-3-wordmark-chenar :global(.chenar-content) {
		padding: var(--space-5) var(--space-8);
	}

	.wordmark-outro {
		font-family: var(--font-family-script);
		font-weight: normal;
		font-size: clamp(2.25rem, 12vw, 4.5rem);
		color: var(--color-text-primary);
		white-space: nowrap;
		text-align: center;
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
