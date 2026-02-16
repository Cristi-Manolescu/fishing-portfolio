<script lang="ts">
	/**
	 * GalleryScreen - Desktop Galerie panel
	 * Main holder: big thumbs (videos) → open YouTube in Photo System (simplified: no maximize, hover nav).
	 * Bottom holder: small thumbs (photos) → open photos in Photo System.
	 */
	import { base } from '$app/paths';
	import { getGalleryPhotoPaths, galleryVideos } from '$lib/data/content';
	import { gallerySingleMedia } from '$lib/stores/gallery';
	import ThumbRail from '$lib/components/ThumbRail.svelte';

	export let section: 'middle' | 'bottom' = 'middle';

	$: photoPaths = getGalleryPhotoPaths(base);
	$: photoImages = photoPaths.map((src, i) => ({ src, alt: `Foto ${i + 1}` }));

	// Main: large rail of video thumbs (open in Photo System video mode)
	$: videoRailItems = galleryVideos.map((v) => ({
		link: '#',
		image: base + v.heroImage,
		caption: v.title,
		id: v.id,
	}));

	function openVideo(_item: { link: string; image: string; caption: string; id?: string }, index: number) {
		gallerySingleMedia.set({ type: 'video', videos: galleryVideos, index });
	}

	// Bottom: default rail of photo thumbs (open in Photo System image mode)
	$: photoRailItems = photoPaths.map((src, i) => ({
		link: '#',
		image: src,
		caption: `Foto ${i + 1}`,
	}));

	function openPhoto(_item: { link: string; image: string; caption: string }, index: number) {
		gallerySingleMedia.set({ type: 'photo', images: photoImages, index });
	}
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="gallery-main">
			<div class="gallery-main-label">VIDEO PREFERATE</div>
			<div class="gallery-main-rail">
				<ThumbRail items={videoRailItems} variant="large" onItemClick={openVideo} />
			</div>
		</div>
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		<div class="gallery-section-label">FOTO PREFERATE</div>
		<ThumbRail items={photoRailItems} onItemClick={openPhoto} />
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
		gap: 0;
		min-width: 0;
	}

	/* Left: label in empty space; right: thumbs shifted right */
	.gallery-main-label {
		flex-shrink: 0;
		width: 200px;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-primary);
		letter-spacing: 0.08em;
		padding-right: var(--space-4);
	}

	.gallery-main-rail {
		flex: 1;
		min-width: 0;
		margin-left: var(--space-4);
	}

	.bottom-content {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		height: 100%;
		min-width: 0;
	}

	.gallery-section-label {
		flex-shrink: 0;
		width: 200px;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-primary);
		letter-spacing: 0.08em;
	}
</style>
