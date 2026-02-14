<script lang="ts">
	/**
	 * Partide per lake - list of sessions for one lake (Level 3 list).
	 * Back link: Lacuri with hash to scroll to this lake on /sessions/
	 */
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import Chenar from '$lib/components/Chenar.svelte';
	import EquipmentThumbs from '$lib/components/EquipmentThumbs.svelte';
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
		<section class="lake-sessions-viewport">
			<div class="lake-sessions-spacer" aria-hidden="true"></div>
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<div class="lake-sessions-inner">
					<h1 class="lake-sessions-title">{lake.title}</h1>
					<p class="lake-sessions-intro">Sesiunile mele pe acest lac.</p>
					<EquipmentThumbs items={sessionItems} randomPattern={true} hintText="Apasă pentru sesiune" />
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

	.lake-sessions-viewport {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		padding: 0;
	}

	.lake-sessions-spacer {
		flex: 1;
		min-height: calc(50vh - var(--header-height) / 2);
		min-height: calc(50svh - var(--header-height) / 2);
	}

	.lake-sessions-inner {
		display: flex;
		flex-direction: column;
		padding: 0 var(--space-4) var(--space-4);
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

	.lake-sessions-intro {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-6);
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
