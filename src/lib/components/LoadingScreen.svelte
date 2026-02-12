<script lang="ts">
	/**
	 * LoadingScreen - Initial loading with logo and split reveal
	 * - Black background with centered wordmark
	 * - Circular loading indicator
	 * - Split reveal: left/right halves slide away
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { content } from '$lib/data/content';

	export let minDisplayTime = 1500; // Minimum time to show loading screen (ms)
	export let onComplete: () => void = () => {};

	let isLoading = true;
	let isRevealing = false;
	let isHidden = false;
	let loadingProgress = 0;
	let leftHalf: HTMLElement;
	let rightHalf: HTMLElement;
	let logoEl: HTMLElement;

	onMount(() => {
		if (!browser) return;

		const startTime = Date.now();

		// Animate loading progress
		const progressInterval = setInterval(() => {
			loadingProgress = Math.min(loadingProgress + Math.random() * 15, 95);
		}, 100);

		// Wait for page to be fully loaded
		const checkReady = () => {
			const elapsed = Date.now() - startTime;
			const remaining = Math.max(0, minDisplayTime - elapsed);

			setTimeout(() => {
				clearInterval(progressInterval);
				loadingProgress = 100;
				
				// Start reveal animation
				setTimeout(() => {
					triggerReveal();
				}, 300);
			}, remaining);
		};

		if (document.readyState === 'complete') {
			checkReady();
		} else {
			window.addEventListener('load', checkReady, { once: true });
		}

		return () => {
			clearInterval(progressInterval);
		};
	});

	function triggerReveal() {
		// Safety guard: if the component has already unmounted or the
		// DOM nodes were not bound for some reason, skip the GSAP tween
		// to avoid "invalid target" warnings and just complete.
		if (!logoEl || !leftHalf || !rightHalf) {
			isHidden = true;
			onComplete();
			return;
		}

		isRevealing = true;

		// Import GSAP for smooth animation
		import('gsap').then(({ gsap }) => {
			const tl = gsap.timeline({
				onComplete: () => {
					isHidden = true;
					onComplete();
				}
			});

			// Fade out logo first
			tl.to(logoEl, {
				opacity: 0,
				scale: 0.9,
				duration: 0.3,
				ease: 'power2.in'
			});

			// Split and slide
			tl.to(
				leftHalf,
				{
					x: '-100%',
					duration: 0.8,
					ease: 'power3.inOut'
				},
				'-=0.1'
			);

			tl.to(
				rightHalf,
				{
					x: '100%',
					duration: 0.8,
					ease: 'power3.inOut'
				},
				'<'
			); // Same time as left
		});
	}
</script>

{#if !isHidden}
	<div class="loading-screen" class:revealing={isRevealing}>
		<!-- Left half -->
		<div class="half half-left" bind:this={leftHalf}></div>
		
		<!-- Right half -->
		<div class="half half-right" bind:this={rightHalf}></div>

		<!-- Logo and loader (centered, above the halves) -->
		<div class="logo-container" bind:this={logoEl}>
			<!-- Loading ring -->
			<div class="loading-ring" class:complete={loadingProgress >= 100}>
				<svg viewBox="0 0 100 100">
					<!-- Background circle -->
					<circle 
						cx="50" 
						cy="50" 
						r="45" 
						fill="none" 
						stroke="rgba(255,255,255,0.1)" 
						stroke-width="2"
					/>
					<!-- Progress circle -->
					<circle 
						cx="50" 
						cy="50" 
						r="45" 
						fill="none" 
						stroke="var(--color-accent, #ff6b35)" 
						stroke-width="2"
						stroke-linecap="round"
						stroke-dasharray="283"
						stroke-dashoffset={283 - (283 * loadingProgress / 100)}
						transform="rotate(-90 50 50)"
					/>
				</svg>
			</div>

			<!-- Wordmark -->
			<h1 class="loading-wordmark">{content.loading.wordmark}</h1>

			<!-- Loading text -->
			<p class="loading-text">
				{#if loadingProgress < 100}
					Se încarcă...
				{:else}
					{content.loading.welcomeText}
				{/if}
			</p>
		</div>
	</div>
{/if}

<style>
	.loading-screen {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Split halves */
	.half {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 50%;
		background-color: #000;
	}

	.half-left {
		left: 0;
	}

	.half-right {
		right: 0;
	}

	/* Logo container */
	.logo-container {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4, 1rem);
	}

	/* Loading ring */
	.loading-ring {
		width: 120px;
		height: 120px;
		margin-bottom: var(--space-4, 1rem);
	}

	.loading-ring svg {
		width: 100%;
		height: 100%;
	}

	.loading-ring circle:last-child {
		transition: stroke-dashoffset 0.1s ease-out;
	}

	.loading-ring.complete circle:last-child {
		stroke: var(--color-accent, #ff6b35);
		filter: drop-shadow(0 0 10px var(--color-accent, #ff6b35));
	}

	/* Wordmark */
	.loading-wordmark {
		font-family: var(--font-family-script, 'Echinos Park Script', cursive);
		font-size: clamp(1.8rem, 7vw, 3.5rem);
		font-weight: normal;
		color: #fff;
		text-align: center;
		letter-spacing: 0.05em;
		margin: 0;
	}

	/* Loading text */
	.loading-text {
		font-family: var(--font-family-base, system-ui, sans-serif);
		font-size: var(--font-size-sm, 0.875rem);
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.2em;
		margin: 0;
	}

	/* Hide during reveal to prevent flicker */
	.revealing .logo-container {
		pointer-events: none;
	}
</style>
