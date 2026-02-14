<script lang="ts">
	/**
	 * Partide per lake - list of sessions. Same seamless Parallax method as Acasa.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import Chenar from '$lib/components/Chenar.svelte';
	import { lakes, sessionHref, getPartideSessionHeroPath } from '$lib/data/content';

	$: lakeId = $page.params.lakeId ?? '';
	$: lake = lakes.find((l) => l.id === lakeId);
	$: sessionItems = lake
		? lake.sessions.map((s) => ({
				id: s.id,
				title: s.title,
				image: getPartideSessionHeroPath(lakeId, s.id),
				href: sessionHref(lakeId, s.id),
			}))
		: [];

	// Parallax items: same shape as Acasa (ParallaxItemResolved) – one per session hero
	$: parallaxItems = lake
		? lake.sessions.map((s) => {
				const img = base + getPartideSessionHeroPath(lakeId, s.id);
				return {
					id: `partide-${lakeId}-${s.id}`,
					desktopImage: img,
					mobileImage: img,
					caption: s.title,
					link: base + sessionHref(lakeId, s.id),
					image: img,
				};
			})
		: [];

	// Load ParallaxGallery only on client to avoid SSR/dev 500
	let ParallaxGallery: import('svelte').ComponentType<{
		items: typeof parallaxItems;
		parallaxSpeed: number;
	}> | null = null;
	onMount(async () => {
		if (!browser) return;
		const mod = await import('$lib/components/ParallaxGallery.svelte');
		ParallaxGallery = mod.default;
	});
</script>

<svelte:head>
	<title>{lake ? `${lake.title} – Partide` : 'Partide'} – Pescuit în Argeș</title>
	<meta name="description" content={lake ? `Partide pe lacul ${lake.title}` : 'Partide'} />
</svelte:head>

<main class="lake-sessions-page">
	{#if !lake}
		<Chenar variant="minimal" glowIntensity="none" noPadding>
			<div class="not-found-wrap">
				<p class="not-found">Lacul nu a fost găsit.</p>
				<a href={base + '/sessions/'} class="back-link">← Înapoi la Partide</a>
			</div>
		</Chenar>
	{:else}
		<!-- Same structure as Acasa Screen 2–3: content wrapper has no horizontal padding;
		     only the head block is padded; parallax block is full-width so ParallaxGallery gets identical layout context. -->
		<section class="lake-sessions-viewport">
			<div class="lake-sessions-spacer" aria-hidden="true"></div>
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<div class="lake-sessions-content">
					<!-- Padded head block (like Acasa .screen-2-content) -->
					<div class="lake-sessions-head-block">
						<div class="lake-sessions-head-inner">
							<h1 class="lake-sessions-title">{lake.title}</h1>
						</div>
					</div>
					<!-- Full-width parallax block (like Acasa .screen-3-block): no padding so no gaps on refresh/orientation -->
					{#if ParallaxGallery && parallaxItems.length > 0}
						<div class="lake-sessions-parallax-block">
							<svelte:component this={ParallaxGallery} items={parallaxItems} parallaxSpeed={0.25} />
						</div>
					{:else}
						<div class="lake-sessions-head-block">
							<div class="lake-sessions-head-inner">
								<div class="lake-sessions-stack">
									{#each sessionItems as item}
										<a href={base + item.href} class="lake-session-image-link" data-sveltekit-preload-data="hover">
											<img src={base + item.image} alt={item.title} class="lake-session-image" />
										</a>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
				<div class="lake-sessions-back-block">
					<a href={base + '/sessions/#' + lake.id} class="back-link">Lacuri &lt; {lake.title}</a>
				</div>
			</Chenar>
		</section>
	{/if}
</main>

<style>
	.lake-sessions-page {
		min-height: 100vh;
		min-height: 100svh;
		padding: 0 0 var(--space-8);
	}

	.lake-sessions-page :global(.chenar) {
		width: 100%;
		max-width: 100%;
	}

	.not-found-wrap {
		padding: var(--space-8) var(--space-4);
	}

	.not-found {
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	/* Same as Acasa .screen-2-3: clip horizontal overflow so ParallaxGallery layout is stable */
	.lake-sessions-viewport {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		padding: 0;
		overflow-x: hidden;
		overflow-y: visible;
	}

	.lake-sessions-spacer {
		flex: 1;
		min-height: calc(50vh - var(--header-height) / 2);
		min-height: calc(50svh - var(--header-height) / 2);
	}

	/* Same as Acasa .screen-2-3-content: no horizontal padding; only child blocks add padding where needed */
	.lake-sessions-content {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	/* Padded head (like Acasa .screen-2-block / .screen-2-content) */
	.lake-sessions-head-block {
		width: 100%;
	}

	.lake-sessions-head-inner {
		position: relative;
		width: 100%;
		padding: 0 var(--space-4) var(--space-4);
	}

	/* Same as Acasa .screen-3-block: width 100% only; ParallaxGallery gets full-width context, no gaps on refresh/orientation */
	.lake-sessions-parallax-block {
		width: 100%;
	}

	/* Session images fallback (no JS/ParallaxGallery): stacked vertically, no gaps */
	.lake-sessions-stack {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin: 0 calc(-1 * var(--space-4));
		width: calc(100% + 2 * var(--space-4));
	}

	.lake-session-image-link {
		display: block;
		line-height: 0;
	}

	.lake-session-image {
		display: block;
		width: 100%;
		height: auto;
		vertical-align: middle;
	}

	.lake-sessions-title {
		font-family: var(--font-family-script);
		font-size: clamp(2.5rem, 12vw, 5rem);
		font-weight: normal;
		color: var(--color-text-primary);
		text-shadow:
			0 0 30px rgba(255, 255, 255, 0.3),
			0 2px 15px rgba(0, 0, 0, 0.5);
		margin: 0 0 var(--space-4);
	}

	.lake-sessions-back-block {
		display: flex;
		justify-content: center;
		padding: var(--space-6) var(--space-4) var(--space-8);
	}

	.back-link {
		display: inline-block;
		font-size: var(--font-size-sm);
		color: var(--color-accent);
		text-decoration: none;
		transition: opacity var(--duration-fast) var(--ease-out);
	}

	.back-link:hover {
		opacity: 0.8;
	}
</style>
