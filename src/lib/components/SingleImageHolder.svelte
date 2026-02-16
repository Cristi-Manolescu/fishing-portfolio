<script lang="ts">
	/**
	 * Single-image holder: independent overlay + Chenar panel (same style as ArticleGallery).
	 * Shows one full image with original aspect ratio (object-fit: contain).
	 * Supports prev/next navigation when images array has more than one item.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import Chenar from '$lib/components/Chenar.svelte';

	export let open = false;
	export let onClose: () => void = () => {};
	/** Full list of images for this gallery (e.g. article gallery) */
	export let images: { src: string; alt: string }[] = [];
	/** Current image index; used with onNavigate for prev/next */
	export let currentIndex = 0;
	/** Called when user chooses prev/next: (newIndex) => void */
	export let onNavigate: (index: number) => void = () => {};

	$: current = images[currentIndex];
	$: src = current?.src ?? '';
	$: alt = current?.alt ?? '';
	$: hasPrev = images.length > 1 && currentIndex > 0;
	$: hasNext = images.length > 1 && currentIndex < images.length - 1;

	let slideIn = false;
	let closing = false;
	let panelEl: HTMLDivElement;
	let savedScrollY = 0;

	/** 1 = next (new image slides in from right), -1 = prev (from left). Used for key-block animation. */
	let slideDirection: -1 | 0 | 1 = 0;

	/** Full mode: image scaled so shorter dimension fits holder, hover to navigate overflow */
	let fullMode = false;

	let viewportEl: HTMLDivElement;
	let imgNaturalW = 0;
	let imgNaturalH = 0;
	/** Viewport size when in full mode (for scale/pan math) */
	let viewportW = 0;
	let viewportH = 0;

	/** Pan position in full mode (px) – driven by hover, not drag */
	let panX = 0;
	let panY = 0;

	/** Scale so shorter image dimension matches holder's corresponding dimension (works for both portrait and landscape) */
	$: scaleFullMode =
		imgNaturalW > 0 && imgNaturalH > 0 && viewportW > 0 && viewportH > 0
			? imgNaturalW >= imgNaturalH
				? viewportH / imgNaturalH
				: viewportW / imgNaturalW
			: 1;
	$: scaledW = Math.round(imgNaturalW * scaleFullMode);
	$: scaledH = Math.round(imgNaturalH * scaleFullMode);
	$: maxPanX = viewportW > 0 ? Math.min(0, viewportW - scaledW) : 0;
	$: maxPanY = viewportH > 0 ? Math.min(0, viewportH - scaledH) : 0;

	function onImageLoad(e: Event) {
		const img = e.target as HTMLImageElement;
		if (img?.naturalWidth) {
			imgNaturalW = img.naturalWidth;
			imgNaturalH = img.naturalHeight;
		}
	}

	function measureViewport() {
		if (viewportEl) {
			viewportW = viewportEl.clientWidth;
			viewportH = viewportEl.clientHeight;
		}
	}

	async function enterFullMode() {
		if (imgNaturalW <= 0 || imgNaturalH <= 0) return;
		fullMode = true;
		panX = 0;
		panY = 0;
		await tick();
		measureViewport();
		await tick();
		// Center pan when one dimension has no overflow (landscape in tall viewport or portrait in wide viewport)
		if (viewportW > 0 && viewportH > 0) {
			const scale =
				imgNaturalW >= imgNaturalH ? viewportH / imgNaturalH : viewportW / imgNaturalW;
			const w = Math.round(imgNaturalW * scale);
			const h = Math.round(imgNaturalH * scale);
			if (w <= viewportW) panX = (viewportW - w) / 2;
			if (h <= viewportH) panY = (viewportH - h) / 2;
		}
	}

	function exitFullMode() {
		fullMode = false;
		panX = 0;
		panY = 0;
	}

	/** Hover-based navigation in full mode: pan follows cursor position over the viewport */
	function onViewportMouseMove(e: MouseEvent) {
		if (!fullMode || !viewportEl) return;
		const rect = viewportEl.getBoundingClientRect();
		const localX = e.clientX - rect.left;
		const localY = e.clientY - rect.top;
		if (viewportW > 0 && maxPanX < 0) {
			panX = (localX / viewportW) * maxPanX;
		} else if (viewportW > 0 && scaledW < viewportW) {
			panX = (viewportW - scaledW) / 2;
		}
		if (viewportH > 0 && maxPanY < 0) {
			panY = (localY / viewportH) * maxPanY;
		} else if (viewportH > 0 && scaledH < viewportH) {
			panY = (viewportH - scaledH) / 2;
		}
	}

	function goNext() {
		if (!hasNext) return;
		slideDirection = 1;
		exitFullMode();
		onNavigate(currentIndex + 1);
	}

	function goPrev() {
		if (!hasPrev) return;
		slideDirection = -1;
		exitFullMode();
		onNavigate(currentIndex - 1);
	}

	$: if (typeof currentIndex === 'number') {
		exitFullMode();
		imgNaturalW = 0;
		imgNaturalH = 0;
	}

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
		const handleKey = (e: KeyboardEvent) => {
			if (!(open || closing)) return;
			if (e.key === 'Escape') {
				if (fullMode) exitFullMode();
				else requestClose();
			}
			if (e.key === 'ArrowLeft' && hasPrev) {
				e.preventDefault();
				goPrev();
			}
			if (e.key === 'ArrowRight' && hasNext) {
				e.preventDefault();
				goNext();
			}
		};
		const handleResize = () => {
			if (fullMode) measureViewport();
		};
		window.addEventListener('keydown', handleKey);
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('keydown', handleKey);
			window.removeEventListener('resize', handleResize);
		};
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
		class="single-image-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Imagine"
		aria-hidden={closing}
		on:click|self={() => !closing && requestClose()}
		on:keydown={(e) => e.key === 'Escape' && requestClose()}
		tabindex="-1"
	>
		<div class="single-image-close-wrap" on:click|stopPropagation on:keydown|stopPropagation role="presentation">
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<button
					type="button"
					class="single-image-close"
					aria-label="Închide"
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
		<div class="single-image-row" on:click|stopPropagation>
			<div class="single-image-panel" class:slide-in={slideIn} bind:this={panelEl}>
				<div class="single-image-chenar-wrap">
					<Chenar variant="minimal" glowIntensity="none" noPadding>
						<div class="single-image-inner">
							{#if src}
								<div
									class="single-image-viewport"
									class:full-mode={fullMode}
									role="img"
									aria-label={alt}
									bind:this={viewportEl}
									on:mousemove={onViewportMouseMove}
								>
									{#if fullMode && scaledW > 0 && scaledH > 0}
										<div
											class="single-image-pan-wrap"
											style="width: {scaledW}px; height: {scaledH}px; transform: translate({panX}px, {panY}px);"
										>
											<img
												class="single-image-img single-image-img-full"
												src={src}
												alt={alt}
												loading="eager"
												style="width: {scaledW}px; height: {scaledH}px; object-fit: contain;"
												draggable="false"
											/>
										</div>
									{:else}
										{#key currentIndex}
											<div
												class="single-image-slide-wrap"
												class:slide-from-right={slideDirection === 1}
												class:slide-from-left={slideDirection === -1}
											>
												<img
													class="single-image-img"
													src={src}
													alt={alt}
													loading="eager"
													on:load={onImageLoad}
												/>
											</div>
										{/key}
									{/if}
									<!-- Maximize / minimize in top-right corner of holder -->
									<button
										type="button"
										class="single-image-zoom-toggle"
										aria-label={fullMode ? 'Ieși din modul maximizat' : 'Maximizează'}
										on:click|stopPropagation={fullMode ? exitFullMode : enterFullMode}
										on:keydown|stopPropagation
										disabled={!fullMode && (imgNaturalW <= 0 || imgNaturalH <= 0)}
									>
										{#if fullMode}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
												<polyline points="4 14 10 14 10 20"></polyline>
												<polyline points="20 10 14 10 14 4"></polyline>
												<line x1="14" y1="10" x2="21" y2="3"></line>
												<line x1="3" y1="21" x2="10" y2="14"></line>
											</svg>
										{:else}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
												<polyline points="15 3 21 3 21 9"></polyline>
												<polyline points="9 21 3 21 3 15"></polyline>
												<line x1="21" y1="3" x2="14" y2="10"></line>
												<line x1="3" y1="21" x2="10" y2="14"></line>
											</svg>
										{/if}
									</button>
								</div>
							{/if}
							{#if hasPrev}
								<button
									type="button"
									class="single-image-nav single-image-prev"
									aria-label="Imaginea anterioară"
									on:click|stopPropagation={goPrev}
									on:keydown|stopPropagation
								>
									<span aria-hidden="true">‹</span>
								</button>
							{/if}
							{#if hasNext}
								<button
									type="button"
									class="single-image-nav single-image-next"
									aria-label="Imaginea următoare"
									on:click|stopPropagation={goNext}
									on:keydown|stopPropagation
								>
									<span aria-hidden="true">›</span>
								</button>
							{/if}
						</div>
					</Chenar>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.single-image-overlay {
		--holder-close-width: calc(var(--space-2) + var(--header-height) + var(--space-2));
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: row;
		align-items: stretch;
		pointer-events: auto;
	}

	.single-image-close-wrap {
		flex: 0 0 var(--holder-close-width);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
	}

	.single-image-row {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		overflow: hidden;
		pointer-events: auto;
	}

	.single-image-panel {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		height: 100vh;
		height: 100svh;
		transform: translateX(100%);
		transition: transform var(--duration-base) var(--ease-out);
		position: relative;
	}

	.single-image-inner {
		height: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-4);
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		position: relative;
	}

	/* Viewport: one image at a time, overflow hidden for slide animation */
	.single-image-viewport {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		cursor: default;
	}

	.single-image-viewport.full-mode {
		cursor: default;
	}

	/* Full mode: pan wrapper sized to scaled image, translated by panX/panY */
	.single-image-pan-wrap {
		position: absolute;
		left: 0;
		top: 0;
		flex-shrink: 0;
		pointer-events: auto;
	}

	/* Maximize / minimize toggle: top-right corner of holder (viewport) */
	.single-image-zoom-toggle {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		transition: background var(--duration-fast), border-color var(--duration-fast), color var(--duration-fast);
	}

	.single-image-zoom-toggle:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.single-image-zoom-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.single-image-slide-wrap {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* New image slides in from the right when going next */
	.single-image-slide-wrap.slide-from-right {
		animation: slideInFromRight 0.3s var(--ease-out) forwards;
	}

	/* New image slides in from the left when going prev */
	.single-image-slide-wrap.slide-from-left {
		animation: slideInFromLeft 0.3s var(--ease-out) forwards;
	}

	@keyframes slideInFromRight {
		from {
			transform: translateX(100%);
			opacity: 0.5;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes slideInFromLeft {
		from {
			transform: translateX(-100%);
			opacity: 0.5;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Prev/next nav: inside holder, same style as Despre article nav */
	.single-image-nav {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 1.5rem;
		line-height: 1;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background var(--duration-fast), border-color var(--duration-fast), color var(--duration-fast);
		align-self: center;
	}

	.single-image-nav:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.single-image-nav:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.single-image-prev {
		order: -1;
	}

	.single-image-next {
		order: 1;
	}

	.single-image-panel.slide-in {
		transform: translateX(0);
	}

	.single-image-close-wrap :global(.chenar) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--header-height);
		height: var(--header-height);
		aspect-ratio: 1;
		border-radius: 0;
	}

	.single-image-close-wrap :global(.chenar-frame),
	.single-image-close-wrap :global(.chenar-border),
	.single-image-close-wrap :global(.chenar-content),
	.single-image-close-wrap :global(.chenar-glow) {
		border-radius: 0;
	}

	.single-image-close {
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

	.single-image-close:hover:not(:disabled) {
		opacity: 0.9;
		color: var(--color-accent);
	}

	.single-image-close:disabled {
		cursor: default;
	}

	.single-image-chenar-wrap {
		flex: 1;
		min-width: 0;
		height: 100vh;
		height: 100svh;
		overflow: hidden;
	}

	/* Full image keeps original aspect ratio (contain within panel) */
	.single-image-img {
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		object-fit: contain;
		display: block;
		vertical-align: middle;
	}
</style>
