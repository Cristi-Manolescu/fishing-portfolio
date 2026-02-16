<script lang="ts">
	/**
	 * GalleryScreen - Desktop Galerie panel
	 * All content from content.ts (single source of truth)
	 */
	import { base } from '$app/paths';
	import { getGalleryPhotoPaths, galleryVideos } from '$lib/data/content';

	export let section: 'middle' | 'bottom' = 'middle';

	$: photoPaths = getGalleryPhotoPaths(base);

	let activeTab = 'photos';
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="gallery-main">
			<div class="featured-photos">
				{#each photoPaths.slice(0, 3) as photo, i}
					<button class="featured-photo" class:large={i === 1}>
						<img src={photo} alt="Galerie foto {i + 1}" />
					</button>
				{/each}
			</div>
		</div>
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		<div class="tab-nav">
			<button class="tab-btn" class:active={activeTab === 'photos'} on:click={() => activeTab = 'photos'}>Foto</button>
			<button class="tab-btn" class:active={activeTab === 'videos'} on:click={() => activeTab = 'videos'}>Video</button>
		</div>

		<div class="thumb-row">
			{#if activeTab === 'photos'}
				{#each photoPaths as photo, i}
					<button class="thumb-btn">
						<img src={photo} alt="Thumbnail {i + 1}" />
					</button>
				{/each}
			{:else}
				{#each galleryVideos as video}
					<button class="thumb-btn">
						<img src={base + video.heroImage} alt={video.title} />
					</button>
				{/each}
			{/if}
		</div>
	</div>
{/if}

<style>
	.middle-content {
		height: 100%;
	}

	.gallery-main {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.featured-photos {
		display: flex;
		gap: var(--space-4);
		align-items: center;
		height: 80%;
	}

	.featured-photo {
		height: 100%;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.2);
		transition: all var(--duration-fast) var(--ease-out);
	}

	.featured-photo.large {
		height: 110%;
	}

	.featured-photo:hover {
		border-color: var(--color-accent);
		box-shadow: 0 0 30px color-mix(in srgb, var(--color-accent) 40%, transparent);
	}

	.featured-photo img {
		height: 100%;
		width: auto;
		object-fit: cover;
	}

	.bottom-content {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		height: 100%;
	}

	.tab-nav {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.tab-btn {
		padding: var(--space-2) var(--space-4);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.25rem;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.tab-btn.active,
	.tab-btn:hover {
		background: rgba(107, 28, 16, 0.3);
		border-color: var(--color-accent);
		color: var(--color-text-primary);
	}

	.thumb-row {
		display: flex;
		gap: var(--space-3);
		flex: 1;
		overflow-x: auto;
	}

	.thumb-btn {
		flex-shrink: 0;
		width: 80px;
		height: 60px;
		border-radius: 0.25rem;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.1);
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	.thumb-btn:hover {
		border-color: var(--color-accent);
	}

	.thumb-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
