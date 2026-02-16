<script lang="ts">
	/**
	 * TickerReveal - Text ticker with blurry slide-up reveal
	 * Words reveal one by one: opacity 0, blur 10px, y: 20 -> opacity 1, blur 0, y: 0
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let text = "Bine ai venit în jurnalul meu de pescuit";
	export let delay = 0.5; // Initial delay before animation starts
	export let stagger = 0.08; // Delay between each word
	export let duration = 0.6; // Duration of each word animation
	export let transitionDelay = 0.35; // Delay between hide and reveal (both directions)
	/** 'default' or 'lg' – one font-size step larger */
	export let size: 'default' | 'lg' = 'default';

	let containerEl: HTMLElement;
	let words: string[] = [];
	let isRevealed = false;

	$: words = text.split(' ');

	onMount(() => {
		if (!browser) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				const wordEls = containerEl.querySelectorAll('.ticker-word');

				// Initial state
				gsap.set(wordEls, {
					opacity: 0,
					y: 20,
					filter: 'blur(10px)'
				});

				let hideTween: any = null;
				let revealTween: any = null;
				let transitionTimeout: ReturnType<typeof setTimeout> | null = null;

				function clearTransitionTimeout() {
					if (transitionTimeout) {
						clearTimeout(transitionTimeout);
						transitionTimeout = null;
					}
				}

				function resetToHidden() {
					gsap.killTweensOf(wordEls);
					hideTween = null;
					revealTween = null;
					gsap.set(wordEls, {
						opacity: 0,
						y: 20,
						filter: 'blur(10px)'
					});
					isRevealed = false;
				}

				function playHide() {
					clearTransitionTimeout();
					if (revealTween) revealTween.kill();
					revealTween = null;
					hideTween = gsap.to(wordEls, {
						opacity: 0,
						y: 20,
						filter: 'blur(10px)',
						duration: duration * 0.5,
						stagger: stagger * 0.5,
						ease: 'power2.in',
						onComplete: () => {
							hideTween = null;
							isRevealed = false;
						}
					});
				}

				function playReveal() {
					clearTransitionTimeout();
					if (hideTween) hideTween.kill();
					hideTween = null;
					revealTween = gsap.to(wordEls, {
						opacity: 1,
						y: 0,
						filter: 'blur(0px)',
						duration: duration,
						stagger: stagger,
						delay: delay,
						ease: 'power2.out',
						onComplete: () => {
							revealTween = null;
							isRevealed = true;
						}
					});
				}

				function scheduleReveal() {
					clearTransitionTimeout();
					transitionTimeout = setTimeout(() => {
						transitionTimeout = null;
						playReveal();
					}, transitionDelay * 1000);
				}

				function scheduleHide() {
					clearTransitionTimeout();
					transitionTimeout = setTimeout(() => {
						transitionTimeout = null;
						playHide();
					}, transitionDelay * 1000);
				}

				// Scroll-triggered reveal - plays every time section enters view
				// Clear on both directions when leaving the ticker zone
				ScrollTrigger.create({
					trigger: containerEl,
					start: 'top 80%',
					end: 'bottom 20%',
					onEnter: scheduleReveal,
					onEnterBack: scheduleReveal,
					onLeave: scheduleHide,      // Scrolling down past ticker → clear
					onLeaveBack: scheduleHide   // Scrolling up past ticker → clear
				});
			});
		});
	});
</script>

<div class="ticker-reveal" class:ticker-reveal-lg={size === 'lg'} bind:this={containerEl}>
	<p class="ticker-text">
		{#each words as word, i}
			<span class="ticker-word">{word}</span>{' '}
		{/each}
	</p>
</div>

<style>
	.ticker-reveal {
		width: 100%;
		padding: var(--space-4) var(--space-6);
	}

	.ticker-text {
		font-size: clamp(1.25rem, 5vw, 2rem);
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1.4;
		text-align: center;
		margin: 0;
	}

	.ticker-reveal-lg .ticker-text {
		font-size: clamp(1.5rem, 5.5vw, 2.5rem);
	}

	.ticker-word {
		display: inline-block;
		will-change: transform, opacity, filter;
	}
</style>
