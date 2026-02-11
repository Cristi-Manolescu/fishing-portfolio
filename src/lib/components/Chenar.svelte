<script lang="ts">
	/**
	 * Chenar (Frame) Component
	 * A decorative glass frame with glow effects
	 * Uses CSS layers instead of SVG filters for reliability
	 */
	
	export let variant: 'default' | 'minimal' = 'default';
	export let glowColor: string = 'var(--color-accent)';
	export let glowIntensity: 'none' | 'subtle' | 'medium' | 'strong' = 'medium';
</script>

<div 
	class="chenar" 
	class:minimal={variant === 'minimal'}
	class:glow-none={glowIntensity === 'none'}
	class:glow-subtle={glowIntensity === 'subtle'}
	class:glow-medium={glowIntensity === 'medium'}
	class:glow-strong={glowIntensity === 'strong'}
	style:--glow-color={glowColor}
>
	<!-- Glow layer (behind) -->
	<div class="chenar-glow" aria-hidden="true"></div>
	
	<!-- Main frame -->
	<div class="chenar-frame">
		<!-- Border layer -->
		<div class="chenar-border" aria-hidden="true"></div>
		
		<!-- Content area -->
		<div class="chenar-content">
			<slot />
		</div>
	</div>
	
	<!-- Corner accents -->
	<div class="chenar-corner chenar-corner--tl" aria-hidden="true"></div>
	<div class="chenar-corner chenar-corner--tr" aria-hidden="true"></div>
	<div class="chenar-corner chenar-corner--bl" aria-hidden="true"></div>
	<div class="chenar-corner chenar-corner--br" aria-hidden="true"></div>
</div>

<style>
	.chenar {
		--chenar-radius: 1.5rem;
		--chenar-padding: var(--space-6);
		--chenar-border-width: 2px;
		--chenar-glow-spread: 30px;
		--chenar-glow-opacity: 0.4;
		
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	/* ========== Glow Layer ========== */
	.chenar-glow {
		position: absolute;
		inset: calc(var(--chenar-glow-spread) * -0.5);
		border-radius: calc(var(--chenar-radius) + var(--chenar-glow-spread) * 0.3);
		background: transparent;
		opacity: var(--chenar-glow-opacity);
		pointer-events: none;
		z-index: 0;
		
		/* Glow effect via box-shadow */
		box-shadow: 
			0 0 var(--chenar-glow-spread) var(--glow-color),
			0 0 calc(var(--chenar-glow-spread) * 2) var(--glow-color),
			inset 0 0 calc(var(--chenar-glow-spread) * 0.5) rgba(255, 255, 255, 0.05);
	}

	/* Glow intensity variants */
	.glow-none .chenar-glow {
		display: none;
	}
	
	.glow-subtle {
		--chenar-glow-spread: 15px;
		--chenar-glow-opacity: 0.2;
	}
	
	.glow-medium {
		--chenar-glow-spread: 30px;
		--chenar-glow-opacity: 0.35;
	}
	
	.glow-strong {
		--chenar-glow-spread: 50px;
		--chenar-glow-opacity: 0.5;
	}

	/* ========== Main Frame ========== */
	.chenar-frame {
		position: relative;
		z-index: 1;
		border-radius: var(--chenar-radius);
		overflow: hidden;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	/* ========== Border Layer ========== */
	.chenar-border {
		position: absolute;
		inset: 0;
		border-radius: var(--chenar-radius);
		padding: var(--chenar-border-width);
		pointer-events: none;
		z-index: 2;
		
		/* Gradient border trick */
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.3) 0%,
			rgba(255, 255, 255, 0.1) 30%,
			rgba(255, 255, 255, 0.05) 50%,
			rgba(255, 255, 255, 0.1) 70%,
			rgba(255, 255, 255, 0.2) 100%
		);
		
		/* Mask to show only the border */
		-webkit-mask: 
			linear-gradient(#fff 0 0) content-box, 
			linear-gradient(#fff 0 0);
		mask: 
			linear-gradient(#fff 0 0) content-box, 
			linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
	}

	/* ========== Content Area ========== */
	.chenar-content {
		position: relative;
		z-index: 1;
		padding: var(--chenar-padding);
		border-radius: var(--chenar-radius);
		flex: 1;
		min-height: 0; /* Allow flex shrinking */
		overflow: hidden; /* Prevent content overflow */
		
		/* Glass effect */
		background: rgba(10, 10, 10, 0.6);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	/* ========== Corner Accents ========== */
	.chenar-corner {
		position: absolute;
		width: 20px;
		height: 20px;
		z-index: 3;
		pointer-events: none;
		
		/* Corner line */
		&::before,
		&::after {
			content: '';
			position: absolute;
			background: var(--glow-color);
			opacity: 0.8;
		}
		
		&::before {
			width: 100%;
			height: 2px;
		}
		
		&::after {
			width: 2px;
			height: 100%;
		}
	}

	.chenar-corner--tl {
		top: 0;
		left: 0;
		&::before { top: 0; left: 0; }
		&::after { top: 0; left: 0; }
	}

	.chenar-corner--tr {
		top: 0;
		right: 0;
		&::before { top: 0; right: 0; }
		&::after { top: 0; right: 0; }
	}

	.chenar-corner--bl {
		bottom: 0;
		left: 0;
		&::before { bottom: 0; left: 0; }
		&::after { bottom: 0; left: 0; }
	}

	.chenar-corner--br {
		bottom: 0;
		right: 0;
		&::before { bottom: 0; right: 0; }
		&::after { bottom: 0; right: 0; }
	}

	/* ========== Minimal Variant ========== */
	.minimal {
		--chenar-radius: 1rem;
		--chenar-padding: var(--space-4);
		--chenar-glow-spread: 20px;
		--chenar-glow-opacity: 0.25;
	}

	.minimal .chenar-corner {
		display: none;
	}

	.minimal .chenar-border {
		/* Use theme/glow color for border */
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--glow-color) 60%, white) 0%,
			color-mix(in srgb, var(--glow-color) 30%, transparent) 50%,
			color-mix(in srgb, var(--glow-color) 50%, white) 100%
		);
	}

	/* ========== Responsive ========== */
	@media (min-width: 768px) {
		.chenar {
			--chenar-radius: 2rem;
			--chenar-padding: var(--space-8);
		}

		.chenar-corner {
			width: 30px;
			height: 30px;
		}
	}
</style>
