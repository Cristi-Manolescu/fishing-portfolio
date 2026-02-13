<script lang="ts">
	/**
	 * EquipmentThumbs - 2-col grid of equipment hero images
	 * Portrait: width-adaptive; Landscape: height-adaptive
	 * Slide-up animation with row pattern (or random)
	 */
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';

	export let items: { id: string; title: string; image?: string; href?: string }[] = [];
	export let randomPattern = true;

	const ROW_PATTERNS = ['left-first', 'right-first', 'both', 'right-first'] as const;
	const STAGGER = 0.2;

	let containerEl: HTMLElement;
	/** Id of thumb whose overlay is visible; first tap shows it, second tap opens article */
	let activeId: string | null = null;

	function handleThumbClick(item: (typeof items)[0]) {
		// First tap: show overlay (caption + hint). Second tap is on the overlay link → opens article.
		activeId = item.id;
	}

	/** Chunk items into rows of 2 with pattern per row */
	$: rows = (() => {
		const r: { left: (typeof items)[0]; right?: (typeof items)[0]; pattern: (typeof ROW_PATTERNS)[number] }[] = [];
		for (let i = 0; i < items.length; i += 2) {
			const rowIndex = r.length;
			r.push({
				left: items[i],
				right: items[i + 1],
				pattern: randomPattern
					? ROW_PATTERNS[Math.floor(Math.random() * ROW_PATTERNS.length)]
					: ROW_PATTERNS[rowIndex % ROW_PATTERNS.length],
			});
		}
		return r;
	})();

	onMount(() => {
		if (!browser || !containerEl) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);
				tick().then(() => {
					const rowNodes = containerEl.querySelectorAll('.equipment-row');
					if (rowNodes.length === 0) return;

					function revealRow(row: Element, rowIndex: number) {
						const thumbs = row.querySelectorAll('.equipment-thumb');
						const pattern = rows[rowIndex]?.pattern ?? 'both';
						if (pattern === 'left-first') {
							gsap.to(thumbs[0], { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' });
							gsap.to(thumbs[1], { y: 0, opacity: 1, duration: 0.6, delay: STAGGER, ease: 'power2.out' });
						} else if (pattern === 'right-first') {
							gsap.to(thumbs[1], { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' });
							gsap.to(thumbs[0], { y: 0, opacity: 1, duration: 0.6, delay: STAGGER, ease: 'power2.out' });
						} else {
							gsap.to(thumbs, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' });
						}
					}

					function hideRow(row: Element) {
						const thumbs = row.querySelectorAll('.equipment-thumb');
						gsap.to(thumbs, { y: 60, opacity: 0, duration: 0.4 });
					}

					rowNodes.forEach((row, rowIndex) => {
						const thumbs = row.querySelectorAll('.equipment-thumb');
						gsap.set(thumbs, { y: 60, opacity: 0 });

						// One ScrollTrigger per row: reveal when this row has enough space (enters view)
						ScrollTrigger.create({
							trigger: row,
							start: 'top 88%',
							end: 'bottom 15%',
							onEnter: () => revealRow(row, rowIndex),
							onEnterBack: () => revealRow(row, rowIndex),
							onLeave: () => hideRow(row),
							onLeaveBack: () => hideRow(row),
						});
					});
				});
			});
		});
	});
</script>

<div class="equipment-thumbs" bind:this={containerEl}>
	{#each rows as row}
		<div class="equipment-row">
			{#if row.left}
				<div
					class="equipment-thumb"
					class:single={!row.right}
					role="button"
					tabindex="0"
					on:click={() => handleThumbClick(row.left)}
					on:keydown={(e) => e.key === 'Enter' && handleThumbClick(row.left)}
				>
					{#if row.left.image}
						<img src={base + row.left.image} alt={row.left.title} />
					{/if}
					<a
						href={row.left.href ? base + row.left.href : '#'}
						class="thumb-overlay"
						class:visible={activeId === row.left.id}
						on:click|stopPropagation
					>
						<span class="thumb-caption">{row.left.title}</span>
						<span class="thumb-hint">Apasă pentru articol</span>
					</a>
				</div>
			{/if}
			{#if row.right}
				<div
					class="equipment-thumb"
					role="button"
					tabindex="0"
					on:click={() => handleThumbClick(row.right!)}
					on:keydown={(e) => e.key === 'Enter' && handleThumbClick(row.right!)}
				>
					{#if row.right.image}
						<img src={base + row.right.image} alt={row.right.title} />
					{/if}
					<a
						href={row.right.href ? base + row.right.href : '#'}
						class="thumb-overlay"
						class:visible={activeId === row.right.id}
						on:click|stopPropagation
					>
						<span class="thumb-caption">{row.right.title}</span>
						<span class="thumb-hint">Apasă pentru articol</span>
					</a>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.equipment-thumbs {
		display: flex;
		flex-direction: column;
		gap: 7px;
		width: 100%;
		padding: 0 var(--space-4) var(--space-8);
	}

	.equipment-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 7px;
	}

	.equipment-thumb {
		display: block;
		position: relative;
		overflow: hidden;
		border-radius: var(--frame-radius);
		text-decoration: none;
	}

	.equipment-thumb.single {
		grid-column: 1 / -1;
	}

	/* Portrait: 3/4 (taller than wide) */
	.equipment-thumb {
		width: 100%;
		aspect-ratio: 3 / 4;
	}

	.equipment-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Overlay: caption + hint on first tap; second tap = link opens article */
	.thumb-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		background: rgba(0, 0, 0, 0.8);
		color: var(--color-text-primary);
		text-decoration: none;
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--duration-base) var(--ease-out);
	}

	.thumb-overlay.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.thumb-caption {
		font-size: var(--font-size-xl);
		font-weight: 600;
		text-align: center;
	}

	.thumb-hint {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	/* Landscape: 4/3 (wider than tall) */
	@media (orientation: landscape) {
		.equipment-thumb {
			aspect-ratio: 4 / 3;
		}
	}
</style>
