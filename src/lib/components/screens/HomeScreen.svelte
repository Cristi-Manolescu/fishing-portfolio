<script lang="ts">
	/**
	 * HomeScreen - Desktop home panel
	 * Split into sections: middle (banner+ticker) and bottom (search+thumbs)
	 */
	export let section: 'middle' | 'bottom' = 'middle';

	const DEEP_LINKS = [
		{ href: '/sessions', label: 'Partide', image: '/assets/img/ui/acasa/latest/latest-01__thumb.avif' },
		{ href: '/about', label: 'Echipament', image: '/assets/img/ui/acasa/latest/latest-02__thumb.avif' },
		{ href: '/gallery', label: 'Galerie', image: '/assets/img/ui/acasa/latest/latest-03__thumb.avif' },
		{ href: '/sessions', label: 'Lacuri', image: '/assets/img/ui/acasa/latest/latest-04__thumb.avif' },
		{ href: '/about', label: 'Lansete', image: '/assets/img/ui/acasa/latest/latest-05__thumb.avif' },
		{ href: '/gallery', label: 'Capturi', image: '/assets/img/ui/acasa/latest/latest-06__thumb.avif' },
	];

	const TICKER_TEXT = "Bine ai venit în jurnalul meu de pescuit • Explorează partidele, echipamentul și capturile mele de pe apele Argeșului • ";
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="banner-area">
			<img 
				src="/assets/img/ui/acasa/banner/slide-01__banner.jpg" 
				alt="Banner pescuit" 
				class="banner-image"
			/>
		</div>
		
		<div class="ticker-area">
			<div class="ticker-content">
				<p class="intro-text">
					Pescuit în Argeș nu este un site despre cum trebuie făcut pescuitul. Este despre cum l-am trăit eu.
				</p>
				<p class="intro-text">
					Acest proiect a apărut din întâlnirea a trei pasiuni personale — pescuitul, fotografia și web-designul — și din dorința de a le aduce împreună într-un mod sincer.
				</p>
				<div class="ticker-scroll">
					<span class="ticker-text">{TICKER_TEXT}</span>
					<span class="ticker-text" aria-hidden="true">{TICKER_TEXT}</span>
				</div>
			</div>
		</div>
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		<div class="search-bar">
			<input type="text" placeholder="Caută..." disabled class="search-input" />
		</div>
		
		<div class="thumbnail-grid">
			{#each DEEP_LINKS as link}
				<a href={link.href} class="thumb-link">
					<div class="thumb-image-wrap">
						<img src={link.image} alt={link.label} class="thumb-image" loading="lazy" />
					</div>
					<span class="thumb-label">{link.label}</span>
				</a>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* ========== MIDDLE SECTION ========== */
	.middle-content {
		display: flex;
		gap: var(--space-4);
		height: 100%;
	}

	.banner-area {
		flex: 1.5;
		min-width: 0;
		border-radius: calc(var(--frame-radius) - var(--space-2));
		overflow: hidden;
	}

	.banner-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.ticker-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.ticker-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		height: 100%;
	}

	.intro-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.ticker-scroll {
		display: flex;
		white-space: nowrap;
		animation: tickerScroll 25s linear infinite;
		margin-top: auto;
		padding-top: var(--space-4);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.ticker-text {
		color: var(--color-accent);
		font-size: var(--font-size-sm);
		padding-right: var(--space-4);
	}

	@keyframes tickerScroll {
		from { transform: translateX(0); }
		to { transform: translateX(-50%); }
	}

	/* ========== BOTTOM SECTION ========== */
	.bottom-content {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		height: 100%;
	}

	.search-bar {
		flex-shrink: 0;
		width: 200px;
	}

	.search-input {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}

	.search-input::placeholder {
		color: var(--color-text-muted);
	}

	.search-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.thumbnail-grid {
		display: flex;
		gap: var(--space-3);
		flex: 1;
		overflow-x: auto;
		padding: var(--space-2) 0;
	}

	.thumb-link {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		transition: transform var(--duration-fast) var(--ease-out);
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
	}

	.thumb-link:hover .thumb-label {
		color: var(--color-accent);
	}
</style>
