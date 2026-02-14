<script lang="ts">
	/**
	 * Session article (Partide Level 3 detail): hero, body, gallery, back = Lacuri < Lake, next-session.
	 * Mirrors about/[id]; reuses ArticleGallery and scroll-lock.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import Chenar from '$lib/components/Chenar.svelte';
	import ArticleGallery from '$lib/components/ArticleGallery.svelte';
	import { lakes, imgPath, sessionHref } from '$lib/data/content';

	$: lakeId = $page.params.lakeId ?? '';
	$: sessionId = $page.params.sessionId ?? '';
	$: lake = lakes.find((l) => l.id === lakeId);
	$: session = lake?.sessions.find((s) => s.id === sessionId);

	$: galleryImages = session
		? session.galleryKeys?.length
			? session.galleryKeys.map((key) => ({
					src: base + imgPath.partideFull(lakeId, sessionId, key),
					alt: session.title,
				}))
			: session.image
				? [{ src: base + session.image, alt: session.title }]
				: []
		: [];

	let galleryOpen = false;
	$: sessionsList = lake?.sessions ?? [];
	$: currentIndex = session ? sessionsList.findIndex((s) => s.id === session.id) : -1;
	$: nextSession =
		currentIndex >= 0 && currentIndex < sessionsList.length - 1
			? sessionsList[currentIndex + 1]
			: null;

	let bodyText: string | null = null;
	$: if (browser && sessionId) {
		const url = `${base}/assets/text-m/partide/${sessionId}.txt`;
		fetch(url)
			.then((r) => (r.ok ? r.text() : null))
			.then((text) => { bodyText = text; })
			.catch(() => { bodyText = null; });
	}
</script>

<svelte:head>
	<title>{session ? `${session.title} – ${lake?.title}` : 'Partide'} – Pescuit în Argeș</title>
</svelte:head>

<main class="article-page">
	{#if !lake || !session}
		<Chenar variant="minimal" glowIntensity="none" noPadding>
			<div class="article-not-found">
				<p class="not-found">Sesiunea nu a fost găsită.</p>
				<a href={base + '/sessions/'} class="back-link">← Înapoi la Partide</a>
			</div>
		</Chenar>
	{:else}
		<section class="article-screen-1-viewport">
			<div class="article-screen-1-spacer" aria-hidden="true"></div>
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<div class="article-chenar-inner">
					<div class="article-hero-block">
						<h1 class="article-title">{session.title}</h1>
						{#if session.image}
							<button type="button" class="article-hero-link" on:click={() => (galleryOpen = true)}>
								<div class="article-hero-wrap">
									<img src={base + session.image} alt={session.title} class="article-hero-img" />
								</div>
							</button>
						{/if}
						<p class="article-hint">Apasa pentru galerie</p>
					</div>

					<div class="article-screen-2-content">
						<div class="article-body-wrap">
							{#if bodyText}
								<div class="article-body-html">{@html bodyText}</div>
							{:else if session.body}
								{#each session.body as paragraph}
									<p>{paragraph}</p>
								{/each}
							{:else}
								<p class="article-loading">Se încarcă...</p>
							{/if}
						</div>
						{#if nextSession?.image}
							<a
								href={base + sessionHref(lakeId, nextSession.id)}
								class="article-next-hero-wrap"
								data-sveltekit-preload-data="hover"
							>
								<img
									src={base + nextSession.image}
									alt={nextSession.title}
									class="article-next-hero-img"
								/>
							</a>
						{/if}
					</div>
				</div>
				<div class="article-back-block">
					<h2 class="article-wordmark">Pescuit în Argeș</h2>
					<a href={base + '/sessions/#' + lake.id} class="back-link"
						>Lacuri &lt; {lake.title}</a
					>
				</div>
			</Chenar>
		</section>

		<ArticleGallery
			open={galleryOpen}
			onClose={() => (galleryOpen = false)}
			images={galleryImages}
			title={session.title}
			mainGalleryHref={base + '/gallery/'}
		/>
	{/if}
</main>

<style>
	.article-page {
		min-height: 100vh;
		min-height: 100svh;
		padding: 0 0 var(--space-8);
	}

	.article-page :global(.chenar) {
		width: 100%;
		max-width: 100%;
	}

	.article-not-found {
		padding: var(--space-8) var(--space-4);
	}

	.article-not-found .not-found {
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.article-back-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-4) var(--space-8);
	}

	.article-wordmark {
		font-family: var(--font-family-script);
		font-weight: normal;
		font-size: clamp(2.25rem, 12vw, 4.5rem);
		color: var(--color-text-primary);
		white-space: nowrap;
		text-align: center;
		margin: 0;
	}

	.back-link {
		display: inline-block;
		margin: 0 var(--space-4);
		font-size: var(--font-size-sm);
		color: var(--color-accent);
		text-decoration: none;
		transition: opacity var(--duration-fast) var(--ease-out);
	}

	.back-link:hover {
		opacity: 0.8;
	}

	.article-screen-1-viewport {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		padding: 0;
	}

	.article-screen-1-spacer {
		flex: 1;
		min-height: calc(50vh - var(--header-height) / 2);
		min-height: calc(50svh - var(--header-height) / 2);
	}

	.article-chenar-inner {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.article-hero-block {
		display: flex;
		flex-direction: column;
		padding: 0 var(--space-4) max(var(--space-6), env(safe-area-inset-bottom));
	}

	.article-title {
		font-family: var(--font-family-script);
		font-size: clamp(2.5rem, 12vw, 5rem);
		font-weight: normal;
		color: var(--color-text-primary);
		text-shadow:
			0 0 30px rgba(255, 255, 255, 0.3),
			0 2px 15px rgba(0, 0, 0, 0.5);
		margin: 0 0 var(--space-4);
	}

	.article-hero-link {
		display: block;
		width: 100%;
		text-decoration: none;
		color: inherit;
		flex: 0 0 auto;
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
	}

	.article-hero-wrap {
		width: 100%;
		max-width: 520px;
		margin: 0 auto;
		border-radius: var(--frame-radius);
		overflow: hidden;
		aspect-ratio: 4 / 3;
		background: rgba(255, 255, 255, 0.05);
	}

	.article-hero-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform var(--duration-slow) var(--ease-out);
	}

	.article-hero-link:hover .article-hero-img {
		transform: scale(1.02);
	}

	.article-hint {
		margin: var(--space-2) 0 0;
		text-align: center;
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	.article-screen-2-content {
		padding: calc(var(--space-8) * 1.5) var(--space-4) var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.article-body-wrap {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		text-align: justify;
	}

	.article-body-wrap :global(p) {
		margin: 0 0 var(--space-3);
		text-align: justify;
	}

	.article-body-html {
		word-wrap: break-word;
		text-align: justify;
	}

	.article-body-html :global(p) {
		margin: 0 0 var(--space-3);
		text-align: justify;
	}

	.article-loading {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.article-next-hero-wrap {
		display: block;
		width: 100%;
		max-width: 520px;
		margin: 0 auto;
		border-radius: var(--frame-radius);
		overflow: hidden;
		aspect-ratio: 4 / 3;
		background: rgba(255, 255, 255, 0.05);
		text-decoration: none;
		color: inherit;
	}

	.article-next-hero-wrap:hover .article-next-hero-img {
		opacity: 0.95;
	}

	.article-next-hero-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: opacity var(--duration-fast) var(--ease-out);
	}
</style>
