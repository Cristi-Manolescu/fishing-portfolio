<script lang="ts">
	/**
	 * Article internal gallery: overlay + close button (left, in Chenar) + Chenar sliding from right.
	 * Photos: 1 col portrait, 2 col landscape; first two eager, rest lazy. Slide in/out from right.
	 * Above everything; only gallery and close receive pointer events; scroll behind frozen.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import Chenar from '$lib/components/Chenar.svelte';

	export let open = false;
	export let onClose: () => void = () => {};
	export let images: { src: string; alt?: string }[] = [];
	export let title = '';
	/** When article has no photos, link to main gallery (e.g. base + '/gallery') */
	export let mainGalleryHref = '';

	let slideIn = false;
	let closing = false;
	let panelEl: HTMLDivElement;
	let savedScrollY = 0;

	function lockBodyScroll() {
		if (!browser) return;
		if (document.body.style.position !== 'fixed') {
			savedScrollY = window.scrollY;
		}
		document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.pointerEvents = 'none';
		document.body.style.overflow = 'hidden';
		document.body.style.pointerEvents = 'none';
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		document.body.style.width = '100%';
	}

	function unlockBodyScroll() {
		if (!browser) return;
		document.documentElement.style.overflow = '';
		document.documentElement.style.pointerEvents = '';
		document.body.style.overflow = '';
		document.body.style.pointerEvents = '';
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.left = '';
		document.body.style.right = '';
		document.body.style.width = '';
		window.scrollTo(0, savedScrollY);
	}

	$: if (browser) {
		if (open || closing) {
			lockBodyScroll();
		} else {
			unlockBodyScroll();
		}
	}

	onDestroy(() => {
		unlockBodyScroll();
	});

	onMount(() => {
		if (!browser) return;
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && (open || closing)) requestClose();
		};
		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	});

	function requestClose() {
		if (closing) return;
		closing = true;
		slideIn = false;
		panelEl?.addEventListener('transitionend', onSlideOutEnd, { once: true });
	}

	function onSlideOutEnd() {
		onClose();
		closing = false;
	}

	$: if (open && !closing) {
		closing = false;
		slideIn = false;
		tick().then(() => {
			requestAnimationFrame(() => {
				slideIn = true;
			});
		});
	}
</script>

{#if open || closing}
	<div
		class="article-gallery-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Galerie foto"
		aria-hidden={closing}
		on:click|self={() => !closing && requestClose()}
		on:keydown={(e) => e.key === 'Escape' && requestClose()}
		tabindex="-1"
	>
		<!-- Flex row: close + panel so on iOS they stay attached (no fixed positioning for close) -->
		<div class="article-gallery-close-wrap" on:click|stopPropagation on:keydown|stopPropagation role="presentation">
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<button
					type="button"
					class="article-gallery-close"
					aria-label="Închide galeria"
					on:click={requestClose}
					on:keydown={(e) => e.key === 'Enter' && requestClose()}
					disabled={closing}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</Chenar>
		</div>
		<div class="article-gallery-row" on:click|stopPropagation>
			<div class="article-gallery-panel" class:slide-in={slideIn} bind:this={panelEl}>
				<div class="article-gallery-chenar-wrap">
					<Chenar variant="minimal" glowIntensity="none" noPadding>
						<div class="article-gallery-inner">
							{#if images.length > 0}
								<div class="article-gallery-grid">
									{#each images as { src, alt }, i}
										<div class="article-gallery-item">
											<img
												src={src}
												alt={alt ?? title}
												loading={i < 2 ? 'eager' : 'lazy'}
											/>
										</div>
									{/each}
								</div>
							{:else}
								<div class="article-gallery-empty">
									<p>Nu există galerie foto pentru acest articol.</p>
									{#if mainGalleryHref}
										<a href={mainGalleryHref} class="article-gallery-empty-link">Vezi galeria principală</a>
									{/if}
								</div>
							{/if}
						</div>
					</Chenar>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.article-gallery-overlay {
		--gallery-close-width: calc(var(--space-2) + var(--header-height) + var(--space-2));
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: row;
		align-items: stretch;
		pointer-events: auto;
	}

	/* Close box: first flex item so it stays attached to panel on iOS (no position: fixed) */
	.article-gallery-close-wrap {
		flex: 0 0 var(--gallery-close-width);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
	}

	.article-gallery-row {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		overflow: hidden;
		pointer-events: auto;
	}

	.article-gallery-panel {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		height: 100vh;
		height: 100svh;
		transform: translateX(100%);
		transition: transform var(--duration-base) var(--ease-out);
	}

	.article-gallery-panel.slide-in {
		transform: translateX(0);
	}

	.article-gallery-close-wrap :global(.chenar) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--header-height);
		height: var(--header-height);
		aspect-ratio: 1;
		/* Square in all orientations; no/small radius so it doesn’t become a circle in landscape */
		border-radius: 0;
	}

	.article-gallery-close-wrap :global(.chenar-frame),
	.article-gallery-close-wrap :global(.chenar-border),
	.article-gallery-close-wrap :global(.chenar-content),
	.article-gallery-close-wrap :global(.chenar-glow) {
		border-radius: 0;
	}

	.article-gallery-close {
		width: var(--header-height);
		height: var(--header-height);
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		padding: 0;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: color var(--duration-fast) var(--ease-out),
			opacity var(--duration-fast) var(--ease-out);
	}

	.article-gallery-close:hover:not(:disabled) {
		opacity: 0.9;
		color: var(--color-accent);
	}

	.article-gallery-close:disabled {
		cursor: default;
	}

	.article-gallery-chenar-wrap {
		flex: 1;
		min-width: 0;
		height: 100vh;
		height: 100svh;
		overflow: hidden;
	}

	.article-gallery-inner {
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		padding: var(--space-4);
	}

	.article-gallery-grid {
		display: grid;
		gap: var(--space-4);
		grid-template-columns: 1fr;
	}

	@media (orientation: landscape) {
		.article-gallery-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.article-gallery-item {
		width: 100%;
	}

	.article-gallery-item img {
		width: 100%;
		height: auto;
		display: block;
		vertical-align: middle;
	}

	.article-gallery-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		min-height: 200px;
		text-align: center;
		color: var(--color-text-secondary);
	}

	.article-gallery-empty-link {
		color: var(--color-accent);
		text-decoration: none;
		font-size: var(--font-size-sm);
	}

	.article-gallery-empty-link:hover {
		text-decoration: underline;
	}
</style>
