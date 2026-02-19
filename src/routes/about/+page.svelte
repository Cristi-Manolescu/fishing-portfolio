<script lang="ts">
	/**
	 * Despre (About) - Mobile section
	 * Screen 1: Chenar with "Despre mine" title at bottom, slide-up animation
	 * Screen 2: Ticker, equipment header, thumbs (in Chenar)
	 * Screen 3: Same as Acasa Screen 4 – fixed nav + wordmark in Chenar when Screen 2 bottom hits viewport
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import Chenar from '$lib/components/Chenar.svelte';
	import OutroSocialWordmark from '$lib/components/OutroSocialWordmark.svelte';
	import DespreTicker from '$lib/components/DespreTicker.svelte';
	import EquipmentThumbs from '$lib/components/EquipmentThumbs.svelte';
	import SectionNav from '$lib/components/SectionNav.svelte';
	import { despreSubsections } from '$lib/data/content';

	$: equipmentItems = despreSubsections.filter((s) => s.id !== 'despre-mine');

	export let data: { tickerTop?: string; tickerBottom?: string };

	let screen1Wrap: HTMLElement;
	let equipmentHeaderEl: HTMLElement;
	let screen2El: HTMLElement;
	let screen3FixedVisible = false;
	let screen3ScrollTriggerCleanup: (() => void) | null = null;

	onMount(() => {
		if (!browser) return;

		// When returning from an article (e.g. /about/#delfin), scroll the thumb into view
		const hashId = window.location.hash.slice(1);
		if (hashId && equipmentItems.some((s) => s.id === hashId)) {
			tick().then(() => {
				requestAnimationFrame(() => {
					const el = document.getElementById(hashId);
					if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
				});
			});
		}

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
				if (equipmentHeaderEl) {
					gsap.set(equipmentHeaderEl, { x: -80, opacity: 0 });
					const el = equipmentHeaderEl;
					ScrollTrigger.create({
						trigger: el,
						start: 'top 85%',
						end: 'bottom 20%',
						onEnter: () => {
							if (el && document.contains(el)) gsap.to(el, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
						},
						onEnterBack: () => {
							if (el && document.contains(el)) gsap.to(el, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
						},
						onLeave: () => {
							if (el && document.contains(el)) gsap.to(el, { x: -80, opacity: 0, duration: 0.5 });
						},
						onLeaveBack: () => {
							if (el && document.contains(el)) gsap.to(el, { x: -80, opacity: 0, duration: 0.5 });
						},
					});
				}
				initScreen3Reveal(ScrollTrigger);
			});
		});
	});

	onDestroy(() => {
		screen3ScrollTriggerCleanup?.();
	});

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
	<title>Despre – Pescuit în Argeș</title>
	<meta name="description" content="Despre mine și echipamentul meu de pescuit pe apele Argeșului" />
</svelte:head>

<main class="despre-mobile">
	<!-- Screen 1 + 2: Chenar with title, ticker, equipment thumbs -->
	<section class="despre-main" bind:this={screen2El}>
		<!-- Spacer: pushes Chenar to bottom of first viewport -->
		<div class="despre-spacer" aria-hidden="true"></div>
		<div class="despre-chenar-wrap" bind:this={screen1Wrap}>
			<div class="despre-scroll-hint" aria-hidden="true">
				<span class="scroll-text">Scroll</span>
				<span class="scroll-arrow">↓</span>
			</div>
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<div class="despre-chenar-content">
					<!-- Title: visible at bottom of Screen 1 -->
					<div class="despre-title-block">
						<h1 class="despre-title">Despre mine</h1>
					</div>
					<!-- Ticker: two-part, scroll-triggered slide from left/right -->
					<DespreTicker textTop={data?.tickerTop ?? ''} textBottom={data?.tickerBottom ?? ''} />
					<!-- Section header: title-style, slide from left -->
					<h2 class="despre-equipment-header" bind:this={equipmentHeaderEl}>Despre echipamentul meu</h2>
					<!-- Equipment thumbs: 2-col grid, hero images -->
					<EquipmentThumbs items={equipmentItems} randomPattern={true} />
				</div>
			</Chenar>
		</div>
	</section>

	<!-- Screen 3: same as Acasa Screen 4 – fixed nav + wordmark when Screen 2 bottom hits viewport -->
	<section class="despre-screen-3">
		<div class="despre-screen-3-spacer" aria-hidden="true"></div>
		{#if screen3FixedVisible}
			<div class="despre-screen-3-fixed">
				<SectionNav navClass="despre-screen-3-nav" />
				<div class="despre-screen-3-wordmark-chenar">
					<OutroSocialWordmark />
				</div>
			</div>
		{/if}
	</section>
</main>

<style>
	.despre-mobile {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100svh;
	}

	/* Screen 1+2: above Screen 3 fixed layer so content scrolls over it */
	.despre-main {
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

	.despre-spacer {
		flex: 1;
		min-height: calc(100vh - var(--header-height) - 11rem);
		min-height: calc(100svh - var(--header-height) - 11rem);
	}

	@media (orientation: landscape) {
		.despre-spacer {
			min-height: calc(100vh - var(--header-height) - 15rem);
			min-height: calc(100svh - var(--header-height) - 15rem);
		}
	}

	.despre-chenar-wrap {
		width: 100%;
		margin-top: var(--space-3);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.despre-scroll-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		animation: bounce 2s ease-in-out infinite;
	}

	.despre-scroll-hint .scroll-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.despre-scroll-hint .scroll-arrow {
		font-size: var(--font-size-lg);
		color: var(--color-accent);
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(6px); }
	}

	.despre-chenar-wrap :global(.chenar) {
		width: 100%;
		align-self: stretch;
	}

	.despre-chenar-content {
		display: flex;
		flex-direction: column;
	}

	.despre-title-block {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4) var(--space-4) max(var(--space-6), env(safe-area-inset-bottom));
	}

	.despre-title {
		font-family: var(--font-family-script);
		font-size: clamp(2.5rem, 12vw, 5rem);
		font-weight: normal;
		color: var(--color-text-primary);
		text-shadow:
			0 0 30px rgba(255, 255, 255, 0.3),
			0 2px 15px rgba(0, 0, 0, 0.5);
		margin: 0;
	}

	/* Section header: title-style, slide from left on scroll */
	.despre-equipment-header {
		font-family: var(--font-family-base);
		font-size: clamp(1.5rem, 6vw, 2.5rem);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: var(--space-10) 0 var(--space-4);
		padding: 0 var(--space-4);
	}

	/* ==================== SCREEN 3: OUTRO (same as Acasa Screen 4, Despre theme) ==================== */
	.despre-screen-3 {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
	}

	.despre-screen-3-spacer {
		display: block;
		min-height: 100vh;
		min-height: 100svh;
	}

	.despre-screen-3-fixed {
		position: fixed;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.despre-screen-3-wordmark-chenar {
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
