<script lang="ts">
	/**
	 * Article - Reusable article/topic block
	 * Used as: Despre sub-section, Partide sub-sub-section
	 * 
	 * Props:
	 * - title: section heading
	 * - level: 1 | 2 - visual hierarchy (h2 vs h3)
	 * - image: optional hero/thumbnail { src, alt? }
	 * - href: optional link (makes title clickable)
	 * - date: optional (for Partide sessions)
	 * - excerpt: optional lead text above body
	 * 
	 * Slots:
	 * - default: body content (paragraphs, lists, etc.)
	 */
	import { base } from '$app/paths';

	export let title: string;
	export let level: 1 | 2 = 1;
	export let image: { src: string; alt?: string } | undefined = undefined;
	export let href: string | undefined = undefined;
	export let date: string | undefined = undefined;
	export let excerpt: string | undefined = undefined;
</script>

<article class="article" class:level-1={level === 1} class:level-2={level === 2}>
	{#if image}
		<div class="article-image-wrap">
			{#if href}
				<a href={base + href} class="article-image-link">
					<img src={base + image.src} alt={image.alt ?? title} class="article-image" />
				</a>
			{:else}
				<img src={base + image.src} alt={image.alt ?? title} class="article-image" />
			{/if}
		</div>
	{/if}

	<header class="article-header">
		{#if href}
			<a href={base + href} class="article-title-link">
				{#if level === 1}
					<h2 class="article-title">{title}</h2>
				{:else}
					<h3 class="article-title">{title}</h3>
				{/if}
			</a>
		{:else}
			{#if level === 1}
				<h2 class="article-title">{title}</h2>
			{:else}
				<h3 class="article-title">{title}</h3>
			{/if}
		{/if}
		{#if date}
			<time class="article-date" datetime={date}>{date}</time>
		{/if}
	</header>

	{#if excerpt}
		<p class="article-excerpt">{excerpt}</p>
	{/if}

	<div class="article-body">
		<slot />
	</div>
</article>

<style>
	.article {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-bottom: var(--space-10);
	}

	.article:last-child {
		padding-bottom: 0;
	}

	/* Level 1: larger, more spacing */
	.article.level-1 {
		padding-bottom: var(--space-12);
	}

	.article.level-1 .article-title {
		font-size: var(--font-size-2xl);
		font-weight: 600;
	}

	/* Level 2: subsection styling */
	.article.level-2 .article-title {
		font-size: var(--font-size-xl);
		font-weight: 500;
	}

	.article-image-wrap {
		width: 100%;
		border-radius: var(--frame-radius);
		overflow: hidden;
		aspect-ratio: 16 / 10;
		background: rgba(255, 255, 255, 0.05);
	}

	.article-image-link {
		display: block;
		width: 100%;
		height: 100%;
	}

	.article-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-slow) var(--ease-out);
	}

	.article-image-link:hover .article-image {
		transform: scale(1.03);
	}

	.article-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.article-title {
		margin: 0;
		color: var(--color-text-primary);
		letter-spacing: 0.02em;
		line-height: var(--line-height-tight);
	}

	.article-title-link {
		color: inherit;
		text-decoration: none;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.article-title-link:hover {
		color: var(--color-accent);
	}

	.article-date {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.article-excerpt {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		margin: 0;
	}

	.article-body {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.article-body :global(p) {
		margin: 0 0 var(--space-3);
	}

	.article-body :global(p:last-child) {
		margin-bottom: 0;
	}

	.article-body :global(ul),
	.article-body :global(ol) {
		margin: 0 0 var(--space-3);
		padding-left: var(--space-6);
	}
</style>
