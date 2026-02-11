<script lang="ts">
	import { isMobile, viewport } from '$lib/stores/device';
	import { currentTheme } from '$lib/stores/theme';
	import { scrollY, isAtTop } from '$lib/stores/scroll';
	import Chenar from '$lib/components/Chenar.svelte';
</script>

<main class="home">
	<!-- Hero Section with Chenar -->
	<section class="hero">
		<Chenar variant="minimal" glowIntensity="medium">
			<h1 class="hero-title">Pescuit în Argeș</h1>
			<p class="hero-subtitle">Jurnalul meu de pescuit pe apele Argeșului</p>
			
			<p class="hero-cta">Explorează jurnalul meu de pescuit</p>
		</Chenar>
	</section>

	<!-- Demo Section: Minimal Chenar with Theme Colors -->
	<section class="demo-section">
		<h2 class="section-title">Minimal Chenar - Theme Colors</h2>
		
		<div class="demo-grid">
			<div class="demo-item">
				<p class="demo-label">Acasă (Orange)</p>
				<Chenar variant="minimal" glowColor="#ff6701" glowIntensity="medium">
					<p class="demo-text">Home section theme color</p>
				</Chenar>
			</div>
			
			<div class="demo-item">
				<p class="demo-label">Despre (Green)</p>
				<Chenar variant="minimal" glowColor="#367101" glowIntensity="medium">
					<p class="demo-text">About section theme color</p>
				</Chenar>
			</div>
			
			<div class="demo-item">
				<p class="demo-label">Partide (Gold)</p>
				<Chenar variant="minimal" glowColor="#efac45" glowIntensity="medium">
					<p class="demo-text">Sessions section theme color</p>
				</Chenar>
			</div>
			
			<div class="demo-item">
				<p class="demo-label">Galerie (Red)</p>
				<Chenar variant="minimal" glowColor="#6b1c10" glowIntensity="medium">
					<p class="demo-text">Gallery section theme color</p>
				</Chenar>
			</div>
			
			<div class="demo-item">
				<p class="demo-label">Contact (Blue)</p>
				<Chenar variant="minimal" glowColor="#3891fb" glowIntensity="medium">
					<p class="demo-text">Contact section theme color</p>
				</Chenar>
			</div>
			
			<div class="demo-item">
				<p class="demo-label">Subtle Glow</p>
				<Chenar variant="minimal" glowIntensity="subtle">
					<p class="demo-text">Lower intensity for less emphasis</p>
				</Chenar>
			</div>
		</div>
	</section>

	<!-- Debug Info (minimal) -->
	<section class="debug-section">
		<Chenar variant="minimal" glowIntensity="subtle">
			<div class="debug-info">
				<span>Device: {$isMobile ? 'Mobile' : 'Desktop'}</span>
				<span>Viewport: {$viewport.width}×{$viewport.height}</span>
				<span>Scroll: {Math.round($scrollY)}px</span>
				<span>Theme: {$currentTheme.id}</span>
			</div>
		</Chenar>
	</section>
</main>

<style>
	.home {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		padding: var(--content-padding);
		padding-top: calc(var(--header-height) + var(--content-padding));
		padding-bottom: var(--space-16);
	}

	/* ========== Hero ========== */
	.hero {
		min-height: calc(100vh - var(--header-height) - var(--content-padding) * 2);
		min-height: calc(100dvh - var(--header-height) - var(--content-padding) * 2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-title {
		font-size: var(--font-size-4xl);
		color: var(--color-text-primary);
		margin-bottom: var(--space-4);
		text-align: center;
	}

	.hero-subtitle {
		font-size: var(--font-size-lg);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-6);
		text-align: center;
	}

	.hero-cta {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	/* ========== Demo Section ========== */
	.demo-section {
		max-width: 1000px;
		margin: 0 auto;
		width: 100%;
	}

	.section-title {
		font-size: var(--font-size-2xl);
		color: var(--color-text-primary);
		margin-bottom: var(--space-8);
		text-align: center;
	}

	.demo-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-8);
	}

	@media (min-width: 768px) {
		.demo-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.demo-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.demo-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.demo-text {
		color: var(--color-text-secondary);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
	}

	/* ========== Debug Section ========== */
	.debug-section {
		max-width: 600px;
		margin: 0 auto;
		width: 100%;
	}

	.debug-info {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4) var(--space-6);
		font-family: monospace;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
</style>
