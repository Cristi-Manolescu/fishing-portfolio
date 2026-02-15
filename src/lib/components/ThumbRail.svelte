<script lang="ts">
	/**
	 * ThumbRail - Reusable desktop thumbnail rail with no half-cut thumbnails.
	 * Viewport width is always K×THUMB_UNIT so only full thumbnails are visible.
	 * Both nav buttons always reserve space (80px) to avoid layout shift.
	 */
	import { onMount, onDestroy, tick } from 'svelte';

	export let items: { link: string; image: string; caption: string }[] = [];

	const THUMB_WIDTH = 100;
	const THUMB_GAP = 12;
	const THUMB_UNIT = THUMB_WIDTH + THUMB_GAP;
	const THUMB_NAV_RESERVE = 80;

	let wrapEl: HTMLDivElement;
	let viewportEl: HTMLDivElement;
	let scrollEl: HTMLDivElement;
	let viewportWidth = 0;
	let showPrev = false;
	let showNext = false;

	/** Use our computed viewport width for all math so we never rely on subpixel clientWidth. */
	function getVisibleUnits(): number {
		if (viewportWidth <= 0) return 1;
		return Math.floor(viewportWidth / THUMB_UNIT) || 1;
	}

	function getMaxScroll(): number {
		if (!scrollEl) return 0;
		const contentWidth = items.length * THUMB_UNIT;
		const visible = viewportWidth > 0 ? viewportWidth : scrollEl.clientWidth;
		return Math.max(0, contentWidth - visible);
	}

	function updateViewportWidth() {
		if (!wrapEl) return;
		const available = Math.max(THUMB_UNIT, wrapEl.clientWidth - THUMB_NAV_RESERVE);
		const units = Math.max(1, Math.floor(available / THUMB_UNIT));
		viewportWidth = units * THUMB_UNIT;
		tick().then(() => requestAnimationFrame(() => {
			snapScroll();
			updateArrows();
		}));
	}

	function updateArrows() {
		if (!scrollEl) return;
		const maxScroll = getMaxScroll();
		showPrev = scrollEl.scrollLeft > 2;
		showNext = scrollEl.scrollLeft < maxScroll - 2;
	}

	function snapScroll() {
		if (!scrollEl || items.length === 0) return;
		const visibleUnits = getVisibleUnits();
		const maxSnapScroll = Math.max(0, (items.length - visibleUnits) * THUMB_UNIT);
		const maxScroll = getMaxScroll();
		const sl = scrollEl.scrollLeft;

		let target: number;
		if (maxScroll <= maxSnapScroll) {
			target = Math.round(sl / THUMB_UNIT) * THUMB_UNIT;
		} else if (sl > maxSnapScroll) {
			target = sl > (maxSnapScroll + maxScroll) / 2 ? maxScroll : maxSnapScroll;
		} else {
			target = Math.round(sl / THUMB_UNIT) * THUMB_UNIT;
		}
		const clamped = Math.max(0, Math.min(target, maxScroll));
		if (Math.abs(sl - clamped) > 1) {
			scrollEl.scrollTo({ left: clamped, behavior: 'smooth' });
		} else {
			updateArrows();
		}
	}

	function scrollBy(direction: -1 | 1) {
		if (!scrollEl) return;
		const visibleUnits = getVisibleUnits();
		const maxSnapScroll = Math.max(0, (items.length - visibleUnits) * THUMB_UNIT);
		const maxScroll = getMaxScroll();
		if (direction > 0 && scrollEl.scrollLeft >= maxSnapScroll - 1 && maxScroll > maxSnapScroll) {
			scrollEl.scrollTo({ left: maxScroll, behavior: 'smooth' });
		} else {
			scrollEl.scrollBy({ left: THUMB_UNIT * direction, behavior: 'smooth' });
		}
	}

	function onWheel(e: WheelEvent) {
		if (!scrollEl) return;
		const delta = e.deltaY;
		if (Math.abs(delta) < 5) return;
		const direction = delta > 0 ? 1 : -1;
		const visibleUnits = getVisibleUnits();
		const maxSnapScroll = Math.max(0, (items.length - visibleUnits) * THUMB_UNIT);
		const maxScroll = getMaxScroll();
		if (direction > 0 && scrollEl.scrollLeft >= maxSnapScroll - 1 && maxScroll > maxSnapScroll) {
			scrollEl.scrollTo({ left: maxScroll, behavior: 'smooth' });
		} else {
			scrollEl.scrollBy({ left: THUMB_UNIT * direction, behavior: 'smooth' });
		}
		e.preventDefault();
	}

	function onResize() {
		updateViewportWidth();
	}

	onMount(() => {
		let ro: ResizeObserver | null = null;
		function setup() {
			if (!wrapEl || !viewportEl || !scrollEl) return;
			ro = new ResizeObserver(onResize);
			ro.observe(wrapEl);
			scrollEl.addEventListener('scroll', updateArrows);
			scrollEl.addEventListener('scrollend', snapScroll);
			viewportEl.addEventListener('wheel', onWheel, { passive: false });
			window.addEventListener('resize', onResize);
			// Measure after layout; then snap so initial position shows no half-cuts
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					updateViewportWidth();
					scrollEl.scrollLeft = 0;
					snapScroll();
				});
			});
		}
		setup();
		if (!wrapEl) tick().then(setup);

		return () => {
			ro?.disconnect();
			scrollEl?.removeEventListener('scroll', updateArrows);
			scrollEl?.removeEventListener('scrollend', snapScroll);
			viewportEl?.removeEventListener('wheel', onWheel);
			window.removeEventListener('resize', onResize);
		};
	});

	onDestroy(() => {
		scrollEl?.removeEventListener('scroll', updateArrows);
		window.removeEventListener('resize', onResize);
	});
</script>

<div class="thumb-rail-wrap" bind:this={wrapEl}>
	<!-- Always reserve space for both buttons to avoid viewport size changes -->
	<button
		type="button"
		class="thumb-nav thumb-prev"
		class:invisible={!showPrev}
		disabled={!showPrev}
		on:click={() => scrollBy(-1)}
		aria-label="Thumbnails înapoi"
	>
		<span aria-hidden="true">‹</span>
	</button>
	<div
		class="thumb-viewport"
		style={viewportWidth > 0 ? `width: ${viewportWidth}px` : 'width: 0; min-width: 0;'}
		role="region"
		aria-label="Thumbnail rail"
		bind:this={viewportEl}
	>
		<div class="thumb-grid" bind:this={scrollEl}>
			{#each items as item}
				<a href={item.link} class="thumb-link">
					<div class="thumb-image-wrap">
						<img src={item.image} alt={item.caption} class="thumb-image" loading="lazy" />
					</div>
					<span class="thumb-label">{item.caption}</span>
				</a>
			{/each}
		</div>
	</div>
	<button
		type="button"
		class="thumb-nav thumb-next"
		class:invisible={!showNext}
		disabled={!showNext}
		on:click={() => scrollBy(1)}
		aria-label="Thumbnails înainte"
	>
		<span aria-hidden="true">›</span>
	</button>
</div>

<style>
	.thumb-rail-wrap {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		flex: 1;
	}

	.thumb-nav {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background var(--duration-fast), border-color var(--duration-fast), opacity var(--duration-fast);
	}

	.thumb-nav:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: var(--color-accent);
	}

	.thumb-nav.invisible {
		visibility: hidden;
		pointer-events: none;
	}

	.thumb-viewport {
		flex: 0 0 auto;
		min-width: 0;
		overflow: hidden;
	}

	.thumb-grid {
		display: flex;
		gap: var(--space-3);
		overflow-x: auto;
		overflow-y: hidden;
		padding: var(--space-2) 0;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.thumb-grid::after {
		content: '';
		flex-shrink: 0;
		width: var(--space-3);
	}

	.thumb-grid::-webkit-scrollbar {
		display: none;
	}

	.thumb-link {
		flex: 0 0 100px;
		width: 100px;
		min-width: 100px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		scroll-snap-align: start;
		transition: transform var(--duration-fast) var(--ease-out);
		box-sizing: border-box;
	}

	.thumb-link:hover {
		transform: translateY(-4px);
	}

	.thumb-image-wrap {
		width: 100px;
		height: 70px;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.2);
		transition: border-color var(--duration-fast) var(--ease-out),
			box-shadow var(--duration-fast) var(--ease-out);
	}

	.thumb-link:hover .thumb-image-wrap {
		border-color: var(--color-accent);
		box-shadow: 0 0 15px color-mix(in srgb, var(--color-accent) 40%, transparent);
	}

	.thumb-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: color var(--duration-fast) var(--ease-out);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.thumb-link:hover .thumb-label {
		color: var(--color-accent);
	}
</style>
