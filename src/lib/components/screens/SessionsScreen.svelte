<script lang="ts">
	import { base } from '$app/paths';
	import { lakes } from '$lib/data/content';

	export let section: 'middle' | 'bottom' = 'middle';
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="info-area">
			<p class="info-text">
				Partidele mele de pescuit pe lacurile din zona Argeșului. 
				Fiecare sesiune este documentată cu fotografii și povești.
			</p>
		</div>
		
		<div class="lake-grid">
			{#each lakes as lake}
				<a href={base + lake.href} class="lake-card">
					<div class="lake-image-wrap">
						<img src={base + lake.image} alt={lake.title} class="lake-image" />
					</div>
					<span class="lake-label">{lake.title}</span>
				</a>
			{/each}
		</div>
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		<p class="hint-text">Selectează un lac pentru a vedea partidele</p>
	</div>
{/if}

<style>
	.middle-content {
		display: flex;
		gap: var(--space-6);
		height: 100%;
	}

	.info-area {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.info-text {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.lake-grid {
		flex: 2;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
		align-content: center;
	}

	.lake-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.lake-card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}

	.lake-image-wrap {
		width: 100%;
		aspect-ratio: 16/9;
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.lake-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.lake-label {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.bottom-content {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.hint-text {
		color: var(--color-text-muted);
		font-style: italic;
	}
</style>
