<script lang="ts">
	/**
	 * About detail page - gear/subsection detail (e.g. /about/delkim)
	 * Placeholder for future full content; shows subsection when found.
	 */
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import Chenar from '$lib/components/Chenar.svelte';
	import Article from '$lib/components/Article.svelte';
	import { despreSubsections } from '$lib/data/content';

	$: id = $page.params.id;
	$: subsection = despreSubsections.find((s) => s.id === id);
</script>

<svelte:head>
	<title>{subsection ? `${subsection.title} – Despre` : 'Despre'} – Pescuit în Argeș</title>
</svelte:head>

<main class="about-detail">
	<section class="about-detail-content">
		<Chenar variant="minimal" glowIntensity="subtle">
			{#if subsection}
				<Article
					title={subsection.title}
					level={1}
					excerpt={subsection.excerpt}
					image={subsection.image ? { src: subsection.image, alt: subsection.title } : undefined}
					date={subsection.date}
				>
					{#if subsection.body}
						{#each subsection.body as paragraph}
							<p>{paragraph}</p>
						{/each}
					{/if}
				</Article>
			{:else}
				<p class="not-found">Pagina nu a fost găsită.</p>
			{/if}
			<a href={base + '/about/'} class="back-link">← Înapoi la Despre</a>
		</Chenar>
	</section>
</main>

<style>
	.about-detail {
		min-height: 100vh;
		min-height: 100svh;
		padding: var(--space-8) var(--space-4);
	}

	.about-detail-content :global(.chenar) {
		max-width: var(--content-max-width);
		margin: 0 auto;
	}

	.not-found {
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
	}

	.back-link {
		display: inline-block;
		margin-top: var(--space-6);
		font-size: var(--font-size-sm);
		color: var(--color-accent);
		transition: opacity var(--duration-fast) var(--ease-out);
	}

	.back-link:hover {
		opacity: 0.8;
	}
</style>
