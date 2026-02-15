<script lang="ts">
	/**
	 * Article page: one Chenar, hero on top, hint, body text (loaded client-side to avoid
	 * server-load double-render bug), next-article image on bottom.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import Chenar from '$lib/components/Chenar.svelte';
	import ArticleGallery from '$lib/components/ArticleGallery.svelte';
	import { despreSubsections, imgPath } from '$lib/data/content';

	$: id = $page.params.id;
	$: subsection = despreSubsections.find((s) => s.id === id);
	$: galleryImages = subsection
		? subsection.galleryKeys?.length
			? subsection.galleryKeys.map((key) => ({
					src: base + imgPath.despreFull(subsection.id, key),
					alt: subsection.title,
				}))
			: subsection.image
				? [{ src: base + subsection.image, alt: subsection.title }]
				: []
		: [];

	let galleryOpen = false;
	$: itemsWithHref = despreSubsections.filter((s) => s.href);
	$: currentIndex = subsection ? itemsWithHref.findIndex((s) => s.id === subsection.id) : -1;
	$: nextArticle =
		currentIndex >= 0 && currentIndex < itemsWithHref.length - 1
			? itemsWithHref[currentIndex + 1]
			: null;

	// Text loaded client-side from assets (no +page.server.ts) to avoid double-render
	let bodyText: string | null = null;

	$: if (browser && id) {
		const filename = id === 'despre-mine' ? 'despre.txt' : `despre_${id}.txt`;
		const url = `${base}/assets/text-m/despre/${filename}`;
		fetch(url)
			.then((r) => (r.ok ? r.text() : null))
			.then((text) => { bodyText = text; })
			.catch(() => { bodyText = null; });
	}
</script>

<svelte:head>
	<title>{subsection ? `${subsection.title} – Despre` : 'Despre'} – Pescuit în Argeș</title>
</svelte:head>

<main class="article-page">
	{#if !subsection}
		<Chenar variant="minimal" glowIntensity="none" noPadding>
			<div class="article-not-found">
				<p class="not-found">Pagina nu a fost găsită.</p>
				<a href={base + '/about/'} class="back-link">← Înapoi la Despre</a>
			</div>
		</Chenar>
	{:else}
		<!-- Screen 1 viewport: spacer pushes Chenar to bottom; one Chenar wraps hero + Screen 2 -->
		<section class="article-screen-1-viewport">
			<div class="article-screen-1-spacer" aria-hidden="true"></div>
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<div class="article-chenar-inner">
					<!-- Bottom of Screen 1: title on image, image on hint (tiny gap) -->
					<div class="article-hero-block">
						<h1 class="article-title">{subsection.title}</h1>
						{#if subsection.image}
							<button type="button" class="article-hero-link" on:click={() => (galleryOpen = true)}>
								<div class="article-hero-wrap">
									<img src={base + subsection.image} alt={subsection.title} class="article-hero-img" />
								</div>
							</button>
						{/if}
						<p class="article-hint">Apasa pentru galerie</p>
					</div>

					<!-- Screen 2: body + next image, same Chenar continues -->
					<div class="article-screen-2-content">
						<div class="article-body-wrap">
							{#if bodyText}
								<div class="article-body-html">{@html bodyText}</div>
							{:else if subsection.body}
								{#each subsection.body as paragraph}
									<p>{paragraph}</p>
								{/each}
							{:else}
								<p class="article-loading">Se încarcă...</p>
							{/if}
						</div>
						{#if nextArticle?.image && nextArticle?.href}
							<a href={base + nextArticle.href} class="article-next-hero-wrap" data-sveltekit-preload-data="hover">
								<img
									src={base + nextArticle.image}
									alt={nextArticle.title}
									class="article-next-hero-img"
								/>
							</a>
						{/if}
					</div>
				</div>
				<div class="article-back-block">
					<h2 class="article-wordmark">Pescuit în Argeș</h2>
					<a href={base + '/about'} class="back-link">Despre &lt; {subsection.title}</a>
				</div>
		</Chenar>
	</section>

	<ArticleGallery
		open={galleryOpen}
		onClose={() => (galleryOpen = false)}
		images={galleryImages}
		title={subsection?.title ?? ''}
		mainGalleryHref={base + '/gallery'}
	/>
	{/if}
</main>

<style>
	.article-page {
		min-height: 100vh;
		min-height: 100svh;
		padding: 0 0 var(--space-8);
	}

	/* Chenar full width (main/viewport have no horizontal padding so this equals window width) */
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
		margin: 0;
		margin-left: var(--space-4);
		margin-right: var(--space-4);
		font-size: var(--font-size-sm);
		color: var(--color-accent);
		text-decoration: none;
		transition: opacity var(--duration-fast) var(--ease-out);
	}

	.back-link:hover {
		opacity: 0.8;
	}

	/* Screen 1: at least one viewport; spacer fills top half so Chenar starts in bottom half; no side padding so Chenar can span full width */
	.article-screen-1-viewport {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		padding: 0;
	}

	.article-screen-1-spacer {
		flex: 1;
		/* At least half of first viewport so Chenar starts in the bottom half */
		min-height: calc(50vh - var(--header-height) / 2);
		min-height: calc(50svh - var(--header-height) / 2);
	}

	.article-chenar-inner {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* Hero block at bottom of Screen 1: title on image, image on hint (tiny gap); horizontal padding since Chenar is full width */
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

	/* Hint sits under image with a tiny gap */
	.article-hint {
		margin: var(--space-2) 0 0;
		padding-top: 0;
		text-align: center;
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	/* Screen 2 content: same Chenar continues; 50% more space from hint to this block */
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
