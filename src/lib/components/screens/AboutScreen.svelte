<script lang="ts">
	import { base } from '$app/paths';

	export let section: 'middle' | 'bottom' = 'middle';

	const GEAR_ITEMS = [
		{ id: 'box', label: 'Box', image: '/assets/img/ui/acasa/latest/latest-01__thumb.avif' },
		{ id: 'delfin', label: 'Delfin', image: '/assets/img/ui/acasa/latest/latest-02__thumb.avif' },
		{ id: 'delkim', label: 'Delkim', image: '/assets/img/ui/acasa/latest/latest-03__thumb.avif' },
		{ id: 'korda', label: 'Korda', image: '/assets/img/ui/acasa/latest/latest-04__thumb.avif' },
		{ id: 'mblc', label: 'MBLC', image: '/assets/img/ui/acasa/latest/latest-05__thumb.avif' },
		{ id: 'venture', label: 'Venture', image: '/assets/img/ui/acasa/latest/latest-06__thumb.avif' },
	];
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="bio-area">
			<p class="bio-text">
				Pasiunea mea pentru pescuit a început în copilărie, pe malurile râurilor din Argeș. 
				De atunci, am evoluat de la cârlige simple la echipament profesional de crap.
			</p>
			<p class="bio-text">
				Aici vei găsi detalii despre echipamentul pe care îl folosesc — de la lansete și mulinete, 
				la avertizoare și accesorii.
			</p>
		</div>
		
		<div class="gear-grid">
			{#each GEAR_ITEMS.slice(0, 3) as item}
				<a href={base + '/about/' + item.id} class="gear-card">
					<div class="gear-image-wrap">
						<img src={base + item.image} alt={item.label} class="gear-image" />
					</div>
					<span class="gear-label">{item.label}</span>
				</a>
			{/each}
		</div>
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		<div class="gear-row">
			{#each GEAR_ITEMS.slice(3) as item}
				<a href={base + '/about/' + item.id} class="gear-thumb">
					<div class="thumb-wrap">
						<img src={base + item.image} alt={item.label} class="thumb-image" />
					</div>
					<span class="thumb-label">{item.label}</span>
				</a>
			{/each}
		</div>
	</div>
{/if}

<style>
	.middle-content {
		display: flex;
		gap: var(--space-6);
		height: 100%;
	}

	.bio-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-4);
	}

	.bio-text {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.gear-grid {
		flex: 1.5;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
		align-content: center;
	}

	.gear-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.gear-card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}

	.gear-image-wrap {
		width: 100%;
		aspect-ratio: 4/3;
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.gear-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.gear-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	/* Bottom */
	.bottom-content {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.gear-row {
		display: flex;
		gap: var(--space-4);
	}

	.gear-thumb {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.gear-thumb:hover {
		transform: translateY(-4px);
	}

	.thumb-wrap {
		width: 100px;
		height: 70px;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.2);
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	.gear-thumb:hover .thumb-wrap {
		border-color: var(--color-accent);
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
	}
</style>
