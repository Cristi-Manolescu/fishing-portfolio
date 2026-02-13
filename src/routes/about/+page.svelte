<script lang="ts">
	/**
	 * Despre (About) - Mobile section
	 * Screen 1: Chenar with "Despre mine" title at bottom, slide-up animation
	 * Screen 2: Articles as sub-sections
	 * Ticker: two-part text from assets, scroll-triggered slide animations
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Chenar from '$lib/components/Chenar.svelte';
	import Article from '$lib/components/Article.svelte';
	import DespreTicker from '$lib/components/DespreTicker.svelte';
	import { despreSubsections } from '$lib/data/content';

	export let data: { tickerTop?: string; tickerBottom?: string };

	let screen1Wrap: HTMLElement;
	let equipmentHeaderEl: HTMLElement;

	onMount(() => {
		if (!browser) return;

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
				if (equipmentHeaderEl) {
					gsap.set(equipmentHeaderEl, { x: -80, opacity: 0 });
					ScrollTrigger.create({
						trigger: equipmentHeaderEl,
						start: 'top 85%',
						end: 'bottom 20%',
						onEnter: () => {
							gsap.to(equipmentHeaderEl, {
								x: 0,
								opacity: 1,
								duration: 0.8,
								ease: 'power2.out',
							});
						},
						onEnterBack: () => {
							gsap.to(equipmentHeaderEl, {
								x: 0,
								opacity: 1,
								duration: 0.8,
								ease: 'power2.out',
							});
						},
						onLeave: () => gsap.to(equipmentHeaderEl, { x: -80, opacity: 0, duration: 0.5 }),
						onLeaveBack: () => gsap.to(equipmentHeaderEl, { x: -80, opacity: 0, duration: 0.5 }),
					});
				}
			});
		});
	});
</script>

<svelte:head>
	<title>Despre – Pescuit în Argeș</title>
	<meta name="description" content="Despre mine și echipamentul meu de pescuit pe apele Argeșului" />
</svelte:head>

<main class="despre-mobile">
	<!-- One continuous Chenar: title at bottom of Screen 1 + articles below -->
	<section class="despre-main">
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
					<!-- Articles: gear items only (skip despre-mine) -->
					<div class="despre-articles-block">
						{#each despreSubsections.filter((s) => s.id !== 'despre-mine') as subsection}
							<Article
								title={subsection.title}
								level={2}
								excerpt={subsection.excerpt}
								image={subsection.image ? { src: subsection.image, alt: subsection.title } : undefined}
								href={subsection.href}
								date={subsection.date}
							>
								{#if subsection.body}
									{#each subsection.body as paragraph}
										<p>{paragraph}</p>
									{/each}
								{/if}
							</Article>
						{/each}
					</div>
				</div>
			</Chenar>
		</div>
	</section>

	<!-- Outro with nav -->
	<section class="despre-outro">
		<nav class="despre-outro-nav" aria-label="Principal">
			<a href="/" class="outro-link">Acasă</a>
			<a href="/sessions" class="outro-link">Partide</a>
			<a href="/gallery" class="outro-link">Galerie</a>
			<a href="/contact" class="outro-link">Contact</a>
		</nav>
	</section>
</main>

<style>
	.despre-mobile {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100svh;
	}

	/* One continuous Chenar: spacer pushes it to bottom of Screen 1 */
	/* Same width & background as Acasa screen-2-3 */
	.despre-main {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		padding: var(--space-4) 0 0;
		padding-bottom: 0;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.3) 0%,
			rgba(0, 0, 0, 0.5) 100%
		);
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

	/* Articles: inside same Chenar, below title */
	.despre-articles-block {
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: var(--space-4);
		padding-bottom: var(--space-8);
	}

	/* Outro */
	.despre-outro {
		padding: var(--space-12) var(--space-4) max(var(--space-8), env(safe-area-inset-bottom));
	}

	.despre-outro-nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-4) var(--space-6);
	}

	.outro-link {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.outro-link:hover {
		color: var(--color-accent);
	}
</style>
