<script lang="ts">
	/**
	 * DespreTicker - Two-part ticker with scroll-triggered slide animations
	 * Top part: align left, slides from left
	 * Bottom part: align right, slides from right (0.5s after top)
	 * Text loaded from static assets: despre.txt, despre_2.txt
	 */
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';

	export let textTop = '';
	export let textBottom = '';

	let containerEl: HTMLElement;
	let topEl: HTMLElement;
	let bottomEl: HTMLElement;
	let topText = textTop;
	let bottomText = textBottom;

	$: if (textTop) topText = textTop;
	$: if (textBottom) bottomText = textBottom;

	onMount(() => {
		if (!browser) return;

		// Fetch text from assets if not provided (e.g. client-side nav)
		async function loadTexts() {
			if (topText && bottomText) return;
			try {
				const assetBase = base + '/assets/text-m/despre/';
				const [topRes, bottomRes] = await Promise.all([
					fetch(assetBase + 'despre.txt'),
					fetch(assetBase + 'despre_2.txt'),
				]);
				if (topRes.ok && !topText) topText = (await topRes.text()).trim();
				if (bottomRes.ok && !bottomText) bottomText = (await bottomRes.text()).trim();
			} catch (_) {
				// Ignore fetch errors
			}
		}

		loadTexts().then(async () => {
			await tick();
			if (!containerEl) return;
			// topEl/bottomEl may be undefined if no text - guard in ScrollTrigger
			import('gsap').then(({ gsap }) => {
				import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
					gsap.registerPlugin(ScrollTrigger);

					// Initial state: off-screen
					if (topEl) gsap.set(topEl, { x: -80, opacity: 0 });
					if (bottomEl) gsap.set(bottomEl, { x: 80, opacity: 0 });

					function playReveal() {
						if (topEl)
							gsap.to(topEl, {
								x: 0,
								opacity: 1,
								duration: 0.8,
								ease: 'power2.out',
							});
						if (bottomEl)
							gsap.to(bottomEl, {
								x: 0,
								opacity: 1,
								duration: 0.8,
								delay: 0.5,
								ease: 'power2.out',
							});
					}

					function playHide() {
						if (topEl) gsap.to(topEl, { x: -80, opacity: 0, duration: 0.5 });
						if (bottomEl) gsap.to(bottomEl, { x: 80, opacity: 0, duration: 0.5 });
					}

					// Top: slide from left when in view; Bottom: from right 0.5s later
					ScrollTrigger.create({
						trigger: containerEl,
						start: 'top 80%',
						end: 'bottom 20%',
						onEnter: playReveal,
						onEnterBack: playReveal,
						onLeave: playHide,
						onLeaveBack: playHide,
					});
				});
			});
		});
	});
</script>

<div class="despre-ticker" bind:this={containerEl}>
	{#if topText}
		<div class="despre-ticker-part despre-ticker-top" bind:this={topEl}>
			<p class="ticker-text">{topText}</p>
		</div>
	{/if}
	{#if bottomText}
		<div class="despre-ticker-part despre-ticker-bottom" bind:this={bottomEl}>
			<p class="ticker-text">{bottomText}</p>
		</div>
	{/if}
</div>

<style>
	.despre-ticker {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding: var(--space-6) var(--space-4);
	}

	.despre-ticker-part {
		width: 100%;
	}

	.despre-ticker-top {
		text-align: left;
	}

	.despre-ticker-bottom {
		text-align: right;
	}

	.ticker-text {
		font-size: clamp(1rem, 4vw, 1.5rem);
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1.4;
		margin: 0;
	}
</style>
