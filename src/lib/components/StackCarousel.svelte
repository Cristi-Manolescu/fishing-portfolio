<script lang="ts">
	/**
	 * StackCarousel - 3D stacking carousel with crawler animation
	 * - 5 banners, 3:4 aspect ratio
	 * - Center: large, color, theme stroke
	 * - Sides: smaller (0.8), behind, grayscale
	 * - Infinite loop with long-press pause
	 */
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let images: string[] = [
		'/images/carousel/1.jpg',
		'/images/carousel/2.jpg',
		'/images/carousel/3.jpg',
		'/images/carousel/4.jpg',
		'/images/carousel/5.jpg',
	];

	// Placeholder colors for when images don't load
	const placeholderColors = [
		'linear-gradient(135deg, #1a4a5e 0%, #0d2a35 100%)',
		'linear-gradient(135deg, #2d5a3d 0%, #1a3d28 100%)',
		'linear-gradient(135deg, #5a3d2d 0%, #3d281a 100%)',
		'linear-gradient(135deg, #4a3d5e 0%, #2a2535 100%)',
		'linear-gradient(135deg, #5e4a1a 0%, #352a0d 100%)',
	];

	let imageErrors: boolean[] = new Array(images.length).fill(false);

	function handleImageError(index: number) {
		imageErrors[index] = true;
		imageErrors = [...imageErrors]; // Trigger reactivity
	}
	export let autoPlayInterval = 3000; // ms between slides
	export let transitionDuration = 0.6; // seconds

	let containerEl: HTMLElement;
	let currentIndex = 0;
	let isPaused = false;
	let autoPlayTimer: ReturnType<typeof setInterval> | null = null;
	let gsapInstance: any = null;

	// Calculate positions for each slide relative to current
	function getSlidePosition(slideIndex: number, current: number, total: number): 'far-left' | 'left' | 'center' | 'right' | 'far-right' | 'hidden' {
		const diff = (slideIndex - current + total) % total;
		
		if (diff === 0) return 'center';
		if (diff === 1) return 'right';
		if (diff === total - 1) return 'left';
		if (diff === 2) return 'far-right';
		if (diff === total - 2) return 'far-left';
		return 'hidden';
	}

	function nextSlide() {
		currentIndex = (currentIndex + 1) % images.length;
		animateSlides();
	}

	function prevSlide() {
		currentIndex = (currentIndex - 1 + images.length) % images.length;
		animateSlides();
	}

	function animateSlides() {
		if (!gsapInstance || !containerEl) return;

		const slides = containerEl.querySelectorAll('.carousel-slide');
		
		slides.forEach((slide, index) => {
			const position = getSlidePosition(index, currentIndex, images.length);
			const el = slide as HTMLElement;
			
			let xOffset = 0; // percentage offset from center
			let scale = 0.6;
			let zIndex = 0;
			let grayscale = 1;
			let opacity = 0;

			switch (position) {
				case 'center':
					xOffset = 0;
					scale = 1;
					zIndex = 5;
					grayscale = 0;
					opacity = 1;
					break;
				case 'left':
					xOffset = -70;
					scale = 0.75;
					zIndex = 3;
					grayscale = 1;
					opacity = 1;
					break;
				case 'right':
					xOffset = 70;
					scale = 0.75;
					zIndex = 3;
					grayscale = 1;
					opacity = 1;
					break;
				case 'far-left':
					xOffset = -120;
					scale = 0.55;
					zIndex = 1;
					grayscale = 1;
					opacity = 0.4;
					break;
				case 'far-right':
					xOffset = 120;
					scale = 0.55;
					zIndex = 1;
					grayscale = 1;
					opacity = 0.4;
					break;
				default:
					opacity = 0;
					zIndex = 0;
			}

			gsapInstance.to(el, {
				xPercent: xOffset,
				scale,
				zIndex,
				opacity,
				filter: `grayscale(${grayscale})`,
				duration: transitionDuration,
				ease: 'power2.out'
			});

			// Handle active state class for stroke
			if (position === 'center') {
				el.classList.add('active');
			} else {
				el.classList.remove('active');
			}
		});
	}

	function startAutoPlay() {
		if (autoPlayTimer) clearInterval(autoPlayTimer);
		autoPlayTimer = setInterval(() => {
			if (!isPaused) {
				nextSlide();
			}
		}, autoPlayInterval);
	}

	function stopAutoPlay() {
		if (autoPlayTimer) {
			clearInterval(autoPlayTimer);
			autoPlayTimer = null;
		}
	}

	// Long press handlers
	function handlePressStart() {
		isPaused = true;
	}

	function handlePressEnd() {
		isPaused = false;
	}

	onMount(() => {
		if (!browser) return;

		import('gsap').then(({ gsap }) => {
			gsapInstance = gsap;
			
			// Initial setup
			const slides = containerEl.querySelectorAll('.carousel-slide');
			slides.forEach((slide, index) => {
				const position = getSlidePosition(index, currentIndex, images.length);
				const el = slide as HTMLElement;
				
				// Set initial positions without animation
				let xOffset = 0, scale = 0.6, zIndex = 0, grayscale = 1, opacity = 0;
				
				switch (position) {
					case 'center':
						xOffset = 0; scale = 1; zIndex = 5; grayscale = 0; opacity = 1;
						el.classList.add('active');
						break;
					case 'left':
						xOffset = -70; scale = 0.75; zIndex = 3; grayscale = 1; opacity = 1;
						break;
					case 'right':
						xOffset = 70; scale = 0.75; zIndex = 3; grayscale = 1; opacity = 1;
						break;
					case 'far-left':
						xOffset = -120; scale = 0.55; zIndex = 1; grayscale = 1; opacity = 0.4;
						break;
					case 'far-right':
						xOffset = 120; scale = 0.55; zIndex = 1; grayscale = 1; opacity = 0.4;
						break;
				}
				
				gsap.set(el, {
					xPercent: xOffset,
					scale,
					zIndex,
					opacity,
					filter: `grayscale(${grayscale})`
				});
			});

			// Start auto-play
			startAutoPlay();
		});
	});

	onDestroy(() => {
		stopAutoPlay();
	});
</script>

<div 
	class="stack-carousel" 
	bind:this={containerEl}
	on:mousedown={handlePressStart}
	on:mouseup={handlePressEnd}
	on:mouseleave={handlePressEnd}
	on:touchstart={handlePressStart}
	on:touchend={handlePressEnd}
	role="region"
	aria-label="Image carousel"
>
	<div class="carousel-track">
		{#each images as image, index}
			<div 
				class="carousel-slide"
				data-index={index}
			>
				<div class="slide-inner">
					{#if imageErrors[index]}
						<div class="slide-placeholder" style="background: {placeholderColors[index % placeholderColors.length]}">
							<span class="placeholder-number">{index + 1}</span>
						</div>
					{:else}
						<img 
							src={image} 
							alt="Carousel image {index + 1}" 
							loading="lazy" 
							on:error={() => handleImageError(index)}
						/>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Navigation dots -->
	<div class="carousel-dots">
		{#each images as _, index}
			<button 
				class="dot" 
				class:active={index === currentIndex}
				on:click={() => { currentIndex = index; animateSlides(); }}
				aria-label="Go to slide {index + 1}"
			></button>
		{/each}
	</div>

	<!-- Pause indicator -->
	{#if isPaused}
		<div class="pause-indicator">
			<span class="pause-icon">⏸</span>
		</div>
	{/if}
</div>

<style>
	.stack-carousel {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 400px;
		perspective: 1000px;
		/* Parent section handles clipping, carousel allows 3D overflow */
		overflow: visible;
		cursor: grab;
		user-select: none;
		-webkit-user-select: none;
		touch-action: pan-y; /* Allow vertical scroll, prevent horizontal drag */
	}

	.stack-carousel:active {
		cursor: grabbing;
	}

	.carousel-track {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 400px;
	}

	.carousel-slide {
		position: absolute;
		/* Absolute center using inset + margin auto */
		inset: 0;
		margin: auto;
		width: 55%;
		max-width: 280px;
		height: fit-content;
		aspect-ratio: 3 / 4;
		will-change: transform, opacity, filter;
		transition: box-shadow 0.3s ease;
	}

	.slide-inner {
		width: 100%;
		height: 100%;
		border-radius: var(--radius-lg, 12px);
		overflow: hidden;
		background: var(--color-bg-secondary, #1a1a1a);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
	}

	.carousel-slide.active .slide-inner {
		border: 2px solid var(--color-accent);
		box-shadow: 
			0 10px 40px rgba(0, 0, 0, 0.4),
			0 0 20px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}

	.slide-inner img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.slide-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-number {
		font-size: 3rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.2);
		font-family: var(--font-family-display);
	}

	/* Navigation dots */
	.carousel-dots {
		position: absolute;
		bottom: var(--space-4);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: var(--space-2);
		z-index: 10;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.dot:hover {
		background: rgba(255, 255, 255, 0.5);
	}

	.dot.active {
		background: var(--color-accent);
		transform: scale(1.2);
	}

	/* Pause indicator */
	.pause-indicator {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.6);
		border-radius: 50%;
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20;
		pointer-events: none;
		animation: fadeIn 0.2s ease;
	}

	.pause-icon {
		font-size: 1.5rem;
		color: white;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
		to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
	}
</style>
