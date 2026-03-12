<script lang="ts">
	/**
	 * Mobile Home Page
	 * Scrolling layout with multiple "screens":
	 * - Screen 1: Wordmark hero (full viewport, wordmark in bottom 1/3)
	 * - Screen 2: Ticker with intro text  
	 * - Screen 3: Parallax gallery
	 * - Screen 4: Outro/CTA
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { scrollY } from '$lib/stores/scroll';
	import Chenar from '$lib/components/Chenar.svelte';
	import OutroSocialWordmark from '$lib/components/OutroSocialWordmark.svelte';
	import TickerReveal from '$lib/components/TickerReveal.svelte';
	import StackCarousel from '$lib/components/StackCarousel.svelte';
	import ParallaxGallery from '$lib/components/ParallaxGallery.svelte';
	import SectionNav from '$lib/components/SectionNav.svelte';
	import { content, getCarouselImages, getParallaxItems, searchParallaxItems } from '$lib/data/content';

	let wordmarkEl: HTMLElement;
	let screen1El: HTMLElement;
	let screen2_3El: HTMLElement;
	let screen4FixedVisible = false;
	let isWordmarkVisible = true;
	let screen4ScrollTriggerCleanup: (() => void) | null = null;

	// Content from single source - responsive images (base for GitHub Pages /fishing-portfolio)
	// Carousel & parallax: always use mobile images on this (mobile) page – it's only shown
	// in mobile layout, and avoids hydration mismatch / wrong assets on first paint.
	$: carouselImages = getCarouselImages(true, base);
	$: parallaxItems = getParallaxItems(true, base);

	// Search: update parallax only after Search button is clicked.
	let searchQuery = '';
	let submittedQuery = '';
	$: displayParallaxItems =
		!submittedQuery.trim()
			? parallaxItems
			: searchParallaxItems(submittedQuery, true, base);

	function handleSearch() {
		submittedQuery = searchQuery.trim();
	}
	function handleClear() {
		searchQuery = '';
		submittedQuery = '';
	}

	onMount(() => {
		if (!browser) return;

		// Dynamic import GSAP
		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(async ({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);
				await tick();

				// Decide whether to play the intro animation based on whether
				// Screen 1 is actually in view on mount. If we're refreshed
				// while scrolled down (Screen 2/3), we skip the intro, but
				// still set up ScrollTrigger so the wordmark can appear when
				// the user scrolls back to Screen 1.
				let runIntro = true;
				if (screen1El) {
					const viewportHeight =
						window.innerHeight || document.documentElement.clientHeight || 0;
					const rect = screen1El.getBoundingClientRect();
					const isScreen1Active = rect.bottom > 0 && rect.top < viewportHeight;
					runIntro = isScreen1Active;
				}

				initWordmarkAnimations(gsap, ScrollTrigger, runIntro);
				initScreen4Reveal(gsap, ScrollTrigger);
			});
		});
	});

	onDestroy(() => {
		screen4ScrollTriggerCleanup?.();
	});

	function initScreen4Reveal(gsap: any, ScrollTrigger: any) {
		if (!screen2_3El) return;
		const st = ScrollTrigger.create({
			trigger: screen2_3El,
			start: 'bottom bottom',
			end: 'bottom top',
			onEnter: () => { screen4FixedVisible = true; },
			onLeaveBack: () => { screen4FixedVisible = false; }
		});
		screen4ScrollTriggerCleanup = () => st.kill();
	}

	function initWordmarkAnimations(gsap: any, ScrollTrigger: any, runIntro = true) {
		if (!wordmarkEl || !screen1El) return;

		const span = wordmarkEl.querySelector('.wordmark-text');
		const turbEl = document.getElementById('wordmark-turb');
		const dispEl = document.getElementById('wordmark-disp');

		// Initial state (script fonts work better with subtle letter-spacing changes)
		gsap.set(wordmarkEl, { y: 40, opacity: 0, scale: 0.95 });
		if (dispEl) gsap.set(dispEl, { attr: { scale: 12 } });

		if (runIntro) {
			// Intro animation
			const introTl = gsap.timeline({ delay: 0.3 });
			introTl.to(wordmarkEl, {
				y: 0,
				opacity: 1,
				scale: 1,
				duration: 1.4,
				ease: 'power2.out'
			});
			if (dispEl)
				introTl.to(
					dispEl,
					{ attr: { scale: 2 }, duration: 1.4, ease: 'power2.out' },
					0
				);

			// Floating loop animation
			introTl.call(() => {
				gsap.to(wordmarkEl, {
					y: -5,
					duration: 2.5,
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1
				});
				if (turbEl) {
					gsap.to(turbEl, {
						attr: { baseFrequency: '0.02 0.025' },
						duration: 3,
						ease: 'sine.inOut',
						yoyo: true,
						repeat: -1
					});
				}
			});
		}

		// Scroll-triggered hide
		ScrollTrigger.create({
			trigger: screen1El,
			start: 'bottom 80%',
			end: 'bottom 20%',
			scrub: 0.5,
			onUpdate: (self: any) => {
				if (!wordmarkEl) return; // Guard: element may be gone (navigation/unmount)
				const progress = self.progress;
				gsap.set(wordmarkEl, { 
					opacity: 1 - progress,
					y: progress * -40,
					scale: 1 - (progress * 0.1)
				});
				if (dispEl) {
					const scale = 2 + (progress * 10);
					gsap.set(dispEl, { attr: { scale } });
				}
				isWordmarkVisible = progress < 0.9;
			}
		});

		// Hover/touch interaction
		wordmarkEl.addEventListener('mouseenter', () => {
			if (dispEl && isWordmarkVisible) gsap.to(dispEl, { attr: { scale: 10 }, duration: 0.3 });
		});
		wordmarkEl.addEventListener('mouseleave', () => {
			if (dispEl && isWordmarkVisible) gsap.to(dispEl, { attr: { scale: 3 }, duration: 0.3 });
		});
	}
</script>

<!-- SVG Filters for Wordmark Caustics Effect -->
<svg class="svg-filters" aria-hidden="true">
	<defs>
		<filter id="wordmark-caustics" filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="140%" height="140%">
			<feTurbulence 
				id="wordmark-turb"
				type="fractalNoise" 
				baseFrequency="0.015 0.02" 
				numOctaves="3" 
				result="turb"
				seed="1"
			/>
			<feDisplacementMap 
				id="wordmark-disp"
				in="SourceGraphic" 
				in2="turb" 
				scale="3"
				xChannelSelector="R" 
				yChannelSelector="G"
			/>
		</filter>
	</defs>
</svg>

<main class="home-mobile">
	<!-- ==================== SCREEN 1: WORDMARK HERO ==================== -->
	<section class="screen screen-1" bind:this={screen1El}>
		<!-- Wordmark: positioned in last 1/3 of screen -->
		<div class="wordmark-fixed" bind:this={wordmarkEl}>
			<h1 class="wordmark" aria-label="Pescuit în Arges">
				<svg
					class="wordmark-svg"
					viewBox="-40 0 2200 400"
					xmlns="http://www.w3.org/2000/svg"
					role="img"
					aria-hidden="true"
					preserveAspectRatio="xMidYMid meet"
				>
					<path
						d="M1123.77,103.953c-12.585-1.156-13.656-13.826-22.404-18.819
		c-12.266,5.386-22.603,17.387-35.846,18.819c-1.016-9.408,9.194-14.382,15.234-19.715c6.434-5.681,13.445-11.113,18.819-17.027
		c3.583-0.882,5.379-0.881,8.962,0C1113.33,78.813,1125.313,91.886,1123.77,103.953z
	M893.459,119.188c-8.901-0.956-21.772,2.057-27.78-1.792
		c2.279-10.267,21.739-3.354,32.261-5.377c14.699-17.143,19.192-53.453,55.561-43.015c-5.573,16.831-17.197,27.61-24.196,43.015
		c8.616,0.943,21.156-2.038,26.884,1.792c-1.677,10.271-20.539,3.359-30.469,5.377c-21.864,37.582-47.397,71.492-60.042,118.292
		c18.249-1.113,31.577-14.412,42.119-25.988c5.437-5.97,10.838-12.57,16.13-18.819c4.921-5.811,9.346-14.886,17.923-16.131
		c0.996,6.109-7.558,12.826-12.546,18.819c-13.725,16.492-36.587,46.038-60.938,49.288c-17.132,2.286-21.961-5.206-20.611-21.508
		C850.96,184.434,880.099,149.622,893.459,119.188z
	M862.99,93.199c5.812,17.756-14.563,31.196-27.781,21.508
		C829.056,96.852,849.575,82.958,862.99,93.199z
		M1789.607,133.526c-5.385,7.988-10.564,16.699-16.131,25.092
		c-4.903,7.394-9.133,18.872-19.716,20.611c-2.199-4.231,3.795-7.319,6.273-10.754c7.992-11.076,16.146-25.527,23.3-37.638
		c-5.097-4.977-12.202-6.327-13.442-13.442c-2.927-16.792,19.849-23.462,34.95-16.131c-3.069,9.776-7.994,17.696-12.547,25.988
		c13.998,5.915,34.008,9.227,25.988,30.469c-4.417,11.7-16.991,25.735-25.988,38.534c-9.268,13.185-23.078,26.678-17.923,41.223
		c23.468-4.573,35.082-23.672,48.393-39.43c6.493-7.688,12.476-17.63,22.403-21.508c1.042-0.146,1.595,0.198,1.792,0.896
		c-7.62,11.63-18.155,25.404-30.469,38.534c-9.688,10.33-21.839,25.243-36.742,28.677c-16.296,3.754-26.078-5.056-24.196-22.404
		c1.568-14.45,11.224-27.414,19.716-40.327C1783.434,169.502,1804.404,145.45,1789.607,133.526z
		M513.493,130.837c-2.849,7.335-11.238,5.356-15.234,8.065
		c-21.72,14.728,11.389,45.182,17.027,58.25c18.122,42.001-47.382,63.238-70.796,38.535c-6.642-7.008-9.743-41.638,13.442-34.95
		c13.014,3.754,2.603,25.725-10.754,22.403c5.978,25.854,50.445,20.327,46.6-8.961c-2.408-18.341-20.085-29.043-22.404-47.496
		c-24.049,23.566-42.604,67.385-86.926,78.861c-22.914,5.933-40.603-1.977-37.638-28.677c2.382-21.451,18.367-45.409,33.158-60.042
		c10.554-10.442,29.115-23.836,48.392-22.404c13.535,1.006,20.525,10.695,15.235,24.196c-5.948,15.178-29.813,20.607-50.185,21.508
		c-10.498,16.387-21.717,32.051-23.3,57.353c15.263,6.788,29.075-3.564,38.535-10.753c20.372-15.483,36.146-36.324,51.977-57.354
		C473.553,152.191,485.311,124.774,513.493,130.837z M439.112,150.553c-0.557-7.118-7.053-10.299-14.338-8.065
		c-11.084,3.399-22.617,23.462-27.781,31.365C415.696,173.253,440.384,166.808,439.112,150.553z
	M2014.54,178.333c-10.82,15.504-22.761,34.543-23.3,57.354
		c15.856,6.746,29.219-3.78,38.534-10.754c20.499-15.347,35.427-35.926,51.081-57.354c13.026-17.832,23.268-41.687,51.977-36.742
		c-0.518,6.282-9.062,4.758-13.443,7.169c-27.366,15.058,15.693,51.066,17.924,69.003c5.227,42.034-61.697,51.746-78.861,19.715
		c-9.234-23.823,23.896-34.783,25.092-17.027c0.63,9.348-8.08,11.739-17.026,13.442c3.427,24.336,42.949,19.027,46.6,0.896
		c5.384-26.742-21.739-34.571-22.403-57.354c-11.854,12.604-22.991,30.74-37.639,45.703c-12.953,13.232-37.332,39.17-70.796,32.262
		c-7.317-1.511-14.284-8.906-15.234-18.819c-2.197-22.938,13.077-44.835,26.885-61.834c13.001-16.006,32.583-34.579,57.354-31.365
		c9.569,1.242,16.06,7.867,14.338,19.715C2062.725,172.271,2037.614,176.3,2014.54,178.333z M2058.451,143.384
		c-19.527-9.51-31.762,15.66-40.326,28.677C2039.18,170.662,2061.886,166.302,2058.451,143.384z
	M626.407,146.968c-3.487-15.47-21.37-1.53-25.092,1.792
		c-10.12,9.031-19.881,24.263-27.78,38.534c-7.988,14.433-16.572,31.754-15.235,48.392c20.553,6.622,38.24-9.764,50.185-20.612
		c9.607-8.725,18.497-20.114,26.884-30.469c2.648-3.269,4.894-9.654,10.754-8.065c2.576,3.969-3.094,6.886-5.377,9.857
		c-16.255,21.156-40.643,54.192-73.484,58.25c-22.486,2.778-35.656-4.291-33.158-28.677c3.308-32.291,40.121-81.143,76.172-83.342
		c11.267-0.688,22.137,3.762,24.196,13.442c2.391,11.239-3.633,23.161-11.65,24.196c-5.439,0.703-13.472-1.983-13.442-10.754
		C609.414,149.783,616.942,150.472,626.407,146.968z
	M1166.784,237.479c17.076-1.637,27.712-15.414,37.639-26.884
		c5.004-5.783,10.27-11.778,15.234-17.923c4.518-5.592,7.909-15.763,17.026-16.131c1.018,5.552-6.953,11.875-11.649,17.923
		c-11.838,15.241-34.225,46.442-54.665,50.185c-19.408,3.553-26.48-7.759-21.508-25.092c7.66-26.7,31.867-50.021,37.639-77.069
		c-12.248-1.102-21.62,9.074-28.678,16.131c-23.041,23.041-39.606,53.808-56.457,83.342c-6.405,1.756-18.173,1.569-22.403-1.792
		c15.985-35.693,34.653-68.702,51.977-103.057c6.649-2.678,17.975-4.09,24.196,0c-1.99,10.556-8.133,16.96-11.65,25.988
		c-0.17,0.726-0.898,0.894-0.896,1.792c12.042-9.323,29.699-36.605,55.562-32.261c25.964,4.361,1.253,46.313-6.273,59.146
		C1182.191,208.29,1172.881,220.163,1166.784,237.479z
	M1786.022,363.836c-11.724-4.068-17.367-11.716-16.131-26.884
		c4.013-49.214,63.276-81.339,106.642-91.407c4.23-4.731,6.315-11.608,9.857-17.027c-9.095,5.35-14.166,14.13-25.092,16.131
		c-22.061,4.039-30.878-8.242-28.677-28.677c1.962-18.223,12.593-37.371,25.988-52.873c17.19-19.892,52.66-44.272,69.899-20.611
		c2.628-9.962,22.532-9.512,31.365-5.377c-13.835,32.173-33.533,66.234-50.185,98.577c23.39-9.304,38.192-27.128,52.873-43.912
		c4.842-5.535,9.733-13.639,17.923-15.234c1.961,3.558-2.607,7.459-4.48,9.857c-18.713,23.961-41.961,46.908-71.692,58.25
		c-30.024,45.549-52.359,98.791-107.537,119.188C1793.191,363.836,1789.607,363.836,1786.022,363.836z M1912.379,174.749
		c2.945-5.857,13.664-20.666,10.754-29.573c-1.371-4.195-8.605-6.517-13.442-4.48c-15.613,6.572-26.583,26.237-36.742,45.703
		c-8.804,16.871-20.248,36.525-15.234,51.977C1886.917,229.009,1898.954,201.449,1912.379,174.749z M1870.26,252.714
		c-36.865,10.904-87.586,40.417-93.199,80.653c-3.673,26.331,16.702,28.121,31.365,16.13c28.372-23.2,44.86-64.85,64.522-96.784
		c-0.597,0-1.194,0-1.792,0C1870.857,252.714,1870.559,252.714,1870.26,252.714z
	M702.58,138.007c-14.833,35.351-41.266,59.103-51.977,98.576
		c12.862,2.083,22.071-8.466,29.573-16.131c14.943-15.267,29.65-34.89,42.119-54.665c10.074-15.978,17.675-39.905,45.704-27.78
		c-5.665,17.47-17.919,31.565-27.781,47.496c-9.547,15.423-19.792,32.131-24.196,51.977c18.077-0.709,27.541-16.236,37.638-27.78
		c5.079-5.806,10.222-11.743,15.234-17.923c4.539-5.595,9.566-14.667,17.923-15.234c-2.892,10.396-16.373,23.814-28.676,37.638
		c-11.412,12.82-23.552,27.743-37.638,30.469c-29.757,5.759-21.582-26.611-15.235-43.015c-17.723,14.24-28.134,43.557-63.626,43.015
		c-17.325-9.968-2.366-43.99,6.273-61.834c3.528-7.286,7.85-15.405,12.546-23.3c4.525-7.606,9.607-18.457,14.338-21.507
		C681.598,133.623,697.684,134.366,702.58,138.007z
	M780.544,244.648c-16.033-12.742-3.669-41.438,4.481-59.146
		c3.784-8.222,8.933-15.901,14.338-25.092c9.077-15.434,16.555-32.083,42.119-23.3c-5.886,18.65-18.308,33.366-27.78,49.288
		c-9.372,15.754-20.583,31.303-23.3,51.081c16.614-0.896,25.462-13.989,36.742-26.884c4.125-4.717,9.688-11.002,15.234-17.923
		c4.864-6.07,10.236-16.817,18.819-16.131c-4.705,8.578-16.846,25.788-29.573,39.431
		C818.501,230.041,805.128,246.006,780.544,244.648z
	M1088.819,138.007c-14.85,35.633-41.997,58.97-51.977,99.472
		c17.182-1.62,28.225-15.301,38.534-26.884c4.978-5.592,10.318-12.642,15.235-18.819c4.568-5.739,8.285-15.851,17.923-15.234
		c-7.643,12.728-17.606,25.215-29.573,38.534c-9.917,11.038-23.372,26.812-37.638,29.573c-39.31,7.608-14.183-48.983-8.065-61.834
		c3.779-7.937,9.19-16.596,14.338-25.092C1056.273,143.404,1066.032,127.641,1088.819,138.007z
			M1820.972,9.857c0.449,21.563-19.515,14.84-34.054,18.819
		c-3.555,0.973-8.729,5.6-11.649,8.961c-14.218,16.364-22.555,41.889-32.262,64.523c-9.93,23.156-19.819,46.145-29.572,66.314
		c2.521,7.875,7.387,12.767,12.546,20.611c3.83,5.824,11.25,18.08,0,19.715c-11.867,1.725-12.769-16.663-21.508-20.611
		c-19.326,32.352-36.299,67.057-71.691,83.342c12.3,1.528,24.089,0.139,34.949-2.688c9.98-2.598,18.589-10.49,26.885-8.065
		c-1.981,7.441-12.568,10.071-20.611,12.546c-17.786,5.473-44.092,7.795-67.211,3.584c2.963-7.532,10.807-6.59,16.131-9.858
		c32.236-19.786,42.558-64.557,62.73-96.784c-10.089-8.133-24.271-12.173-35.847-18.819c-30.867,32.351-58.005,71.159-97.68,99.472
		c-19.273,13.754-44.491,21.173-69.899,28.677c-24.079,7.111-51.846,16.022-77.965,17.923
		c-39.852,2.901-64.366-17.756-68.107-52.873c-4.271-40.093,17.991-72.911,39.431-92.303c24.388-22.06,53.642-35.859,91.407-42.119
		c11.587-72.309,68.554-110.272,137.11-109.33c24.645,0.339,51.303,4.116,77.068,6.273c23.539,1.971,47.142,7.301,68.107,6.273
		C1770.279,12.413,1799.073-7.284,1820.972,9.857z M1602.313,166.684c7.568-7.666,13.908-16.56,20.611-25.092
		c-40.67-12.622-86.01-24.833-138.903-17.923c1.097,33.978,36.013,40.218,66.315,39.43c-0.162-3.44-6.834-8.089-8.065-13.442
		C1558.445,159.171,1578.604,164.701,1602.313,166.684z M1768.1,20.611c15.845-0.883,36.176,2.72,43.911-6.273
		C1797.92,7.833,1778.369,14.811,1768.1,20.611z M1585.285,18.819c-53.364,4.543-90.269,36.287-101.265,88.718
		c54.419-7.203,104.763,6.273,148.761,20.612c26.334-29.757,53.438-63.938,84.237-88.719c4.448-3.579,11.548-7.509,10.754-10.754
		C1682.459,27.492,1632.457,14.803,1585.285,18.819z M1751.072,30.469c-37.233,29.379-63.528,69.699-92.303,107.538
		c11.414,5.612,22.717,11.336,34.054,17.027c18.705-42.362,38.776-89.331,69.003-119.188c1.368-1.352,4.159-3.143,3.585-5.377
		C1760.632,30.469,1755.852,30.469,1751.072,30.469z M1467.89,126.357c-0.597,0-1.194,0-1.792,0
		c-53.658,10.433-117.638,50.994-113.811,112.915c1.981,32.061,25.052,48.837,63.626,40.327c-0.814-3.691-8.301-5.407-6.272-8.961
		c24.311,11.496,55.743,3.374,86.029,2.688c-5.079-0.596-11.926,0.575-11.649-5.377c3.026-5.175,8.582-1.72,13.442-2.688
		c22.47-4.476,42.521-29.08,57.354-43.911c15.135-15.135,28.75-31.038,41.223-46.6c1.164-1.453,4.97-3.624,3.584-6.273
		C1548.317,181.88,1472.793,188.889,1467.89,126.357z
	M0,224.933c0-1.195,0-2.39,0-3.584c5.752-43.836,36.891-67.062,58.25-92.303
		c-7.659,18.329-16.441,35.535-16.13,61.834c-4.224-3.244-4.151-10.785-8.065-14.338c-9.285,17.791-25.538,43.366-11.65,66.315
		c12.578,20.785,44.398,28.991,67.211,25.988c64.471-8.486,86.01-56.043,110.226-107.538c12.484-26.548,22.792-47.388,35.846-72.588
		c11.965-23.098,31.791-56.517,58.25-62.73C223.349,7.277,143.192,38.42,109.33,83.342c-5.555,7.37-9.574,16.13-18.819,25.988
		c-6.172,6.581-19.516,18.643-28.677,9.857c-15.168-14.547,22.998-40.35,29.573-46.6c15.429-14.664,31.563-30.334,50.184-41.223
		c46.606-27.253,140.122-46.974,191.776-9.857c23.172,16.65,43.684,44.197,43.015,79.757c-0.496,26.35-13.934,48.697-28.677,59.146
		c-22.528,15.967-59.936,26.185-101.265,21.508c25.328-6.935,56.269-13.033,68.107-30.469c0.719,3.108-1.335,3.444-0.896,6.273
		c16.887-8.896,36.784-22.405,38.534-46.6c2.663-36.816-21.813-72.578-48.392-79.757c0.229,24.89-26.238,32.906-38.534,50.184
		c-5.729,8.05-9.589,18.702-14.338,28.677c-4.562,9.582-9.917,19.215-14.338,28.677c-27.413,58.652-50.635,124.25-117.396,142.488
		C70.332,294.737,6.694,278.817,0,224.933z M72.588,108.434c7.823,2.307,12.697-5.72,14.338-12.546
		C79.388,93.866,74.941,102.319,72.588,108.434z
M2068.309,290.352c2.68-5.983,10.008-7.317,14.339-11.649
		c-24.5-3.865-3.619-40.852,13.442-24.196C2110.983,269.046,2078.313,297.536,2068.309,290.352z"
					/>
				</svg>
			</h1>
		</div>
		
		<!-- Scroll indicator at bottom -->
		<div class="scroll-indicator">
			<span class="scroll-text">Scroll</span>
			<span class="scroll-arrow">↓</span>
		</div>
	</section>

	<!-- ==================== SCREENS 2–3: TICKER + CAROUSEL + PARALLAX (ONE CONTINUOUS CHENAR) ==================== -->
	<section class="screen screen-2-3" bind:this={screen2_3El}>
		<Chenar variant="minimal" glowIntensity="none" noPadding>
			<div class="screen-2-3-content">
				<!-- Screen 2: Ticker + Carousel -->
				<div class="screen-2-block">
					<div class="screen-2-content">
						<!-- Ticker with blurry reveal -->
						<div class="ticker-section">
							<TickerReveal 
								text={content.home.introLine}
								delay={0.3}
								stagger={0.06}
							/>
						</div>
						
						<!-- 3D Stacking Carousel -->
						<div class="carousel-section">
							<StackCarousel 
								images={carouselImages}
								autoPlayInterval={3500}
							/>
						</div>
					</div>
				</div>

				<!-- Screen 3: Search bar + Parallax Gallery -->
				<div class="screen-3-block">
					<div class="search-section">
						<form class="search-form" on:submit|preventDefault={handleSearch} role="search">
							<label for="acasa-search" class="visually-hidden">Caută articole, partide, echipament</label>
							<input
								id="acasa-search"
								type="search"
								class="search-input"
								placeholder="Caută…"
								bind:value={searchQuery}
								autocomplete="off"
							/>
							<div class="search-actions">
								<button type="submit" class="search-btn search-btn-primary">Caută</button>
								<button type="button" class="search-btn search-btn-secondary" on:click={handleClear}>Șterge</button>
							</div>
						</form>
						{#if submittedQuery}
							<p class="search-result-hint" aria-live="polite">
								{displayParallaxItems.length === 0
									? 'Niciun rezultat'
									: `${displayParallaxItems.length} rezultat${displayParallaxItems.length === 1 ? '' : 'e'}`}
							</p>
						{/if}
					</div>
					<ParallaxGallery items={displayParallaxItems} parallaxSpeed={0.25} hintText="Apasă pentru articol" />
				</div>
			</div>
		</Chenar>
	</section>

	<!-- ==================== SCREEN 4: OUTRO (fixed layer under Screen 3; wordmark in Chenar at bottom, nav in top half) ==================== -->
	<section class="screen screen-4">
		<div class="screen-4-spacer" aria-hidden="true"></div>
		{#if screen4FixedVisible}
			<div class="screen-4-fixed">
				<SectionNav navClass="screen-4-nav" />
				<div class="screen-4-wordmark-chenar">
					<OutroSocialWordmark />
				</div>
			</div>
		{/if}
	</section>
</main>

<style>
	/* ========== SVG Filters (hidden) ========== */
	.svg-filters {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
	}

	/* ========== Base Layout ========== */
	.home-mobile {
		/* No padding - screens control their own spacing */
	}

	.screen {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	/* ==================== SCREEN 1: WORDMARK ==================== */
	.screen-1 {
		/* Full viewport, account for header */
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		/* No padding - wordmark is fixed positioned */
	}

	/* Wordmark: fixed in the center of the viewport */
	.wordmark-fixed {
		position: fixed;
		/* Center of the screen */
		top: 50vh;
		left: 0;
		right: 0;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		pointer-events: auto;
		padding: 0 var(--space-4);
		box-sizing: border-box;
		/* Apply caustics filter */
		filter: url(#wordmark-caustics);
		-webkit-filter: url(#wordmark-caustics);
		will-change: transform, opacity;
	}

	.wordmark {
		font-family: var(--font-family-script);
		font-weight: normal;
		text-align: center;
		margin: 0;
	}

	.home-mobile .wordmark-svg {
		display: block;
		height: clamp(2.3rem, 9.2vw, 5.2rem);
		fill: var(--color-text-primary);
	}

	@media (orientation: portrait) {
		.home-mobile .wordmark-svg {
			height: clamp(3.4rem, 13.8vw, 7.8rem);
		}
	}

	.wordmark-text {
		display: block;
		font-size: clamp(2.3rem, 9.2vw, 5.2rem);
		color: var(--color-text-primary);
		/* No text-transform - keep original casing */
		letter-spacing: 0.05em;
		text-shadow: 
			0 0 30px rgba(255, 255, 255, 0.4),
			0 2px 15px rgba(0, 0, 0, 0.6);
		white-space: nowrap;
	}

	/* Scroll indicator at bottom of Screen 1 */
	.scroll-indicator {
		position: absolute;
		bottom: var(--space-6);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		animation: bounce 2s ease-in-out infinite;
	}

	.scroll-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.scroll-arrow {
		font-size: var(--font-size-lg);
		color: var(--color-accent);
	}

	@keyframes bounce {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(8px); }
	}

	/* ==================== SCREENS 2–3: TICKER + CAROUSEL + PARALLAX ==================== */
	.screen-2-3 {
		position: relative;
		z-index: 10;
		/* Background behind the continuous Chenar */
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.3) 0%,
			rgba(0, 0, 0, 0.5) 100%
		);
		/* Clip horizontal overflow to prevent page scroll */
		overflow-x: hidden;
		overflow-y: visible;
	}

	.screen-2-3 > .chenar {
		/* Ensure the Chenar fills this entire combined screen */
		height: 100%;
	}

	.screen-2-3-content {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	.screen-2-block,
	.screen-3-block {
		width: 100%;
	}

	.screen-2-content {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		padding: var(--space-4);
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		/* Clip horizontal overflow */
		overflow-x: hidden;
	}

	.ticker-section {
		/* Top portion - ticker reveal */
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6) 0 var(--space-4);
	}

	.carousel-section {
		/* Remaining space - 3D carousel */
		flex: 1;
		position: relative;
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Allow vertical overflow for 3D effect, clip horizontal */
		overflow: hidden;
	}

	/* Search bar above parallax (thin line, section theme) */
	.search-section {
		padding: var(--space-4);
		padding-bottom: var(--space-2);
		margin-bottom: var(--space-4);
	}
	.search-form {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: flex-end;
	}
	.search-input {
		flex: 1;
		min-width: 120px;
		padding: var(--space-2) 0;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--color-accent);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		font-family: inherit;
		transition: border-color var(--duration-fast) var(--ease-out);
	}
	.search-input::placeholder {
		color: var(--color-text-muted);
	}
	.search-input:focus {
		outline: none;
		border-bottom-color: var(--color-accent);
		box-shadow: 0 1px 0 0 var(--color-accent);
	}
	.search-actions {
		display: flex;
		gap: var(--space-2);
	}
	.search-btn {
		padding: var(--space-2) var(--space-4);
		border: none;
		border-radius: var(--frame-radius);
		font-size: var(--font-size-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		cursor: pointer;
		transition: opacity var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
	}
	.search-btn:hover {
		transform: scale(1.02);
	}
	.search-btn-primary {
		background: var(--color-accent);
		color: var(--color-bg-primary);
	}
	.search-btn-secondary {
		background: transparent;
		color: var(--color-text-muted);
		border: 1px solid var(--color-text-muted);
	}
	.search-btn-secondary:hover {
		color: var(--color-text-primary);
		border-color: var(--color-accent);
	}
	.search-result-hint {
		margin: var(--space-2) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Screen 3 – ParallaxGallery fills and handles its own layout via .screen-3-block */

	/* ==================== SCREEN 4: OUTRO ==================== */
	/* Screen 4 fixed layer sits under Screen 3 (z-index lower); wordmark in Chenar only, fixed at bottom */
	.screen-4 {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
	}

	.screen-4-spacer {
		display: block;
		min-height: 100vh;
		min-height: 100svh;
	}

	/* Fixed layer: below Screen 3 so parallax/ticker scroll over it */
	.screen-4-fixed {
		position: fixed;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	/* Social + wordmark block; fixed at bottom of viewport */
	.screen-4-wordmark-chenar {
		pointer-events: auto;
		flex: 0 0 auto;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
	}

	.wordmark-small {
		font-size: clamp(1.5rem, 8vw, 3rem);
	}

</style>
