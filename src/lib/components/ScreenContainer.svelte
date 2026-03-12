<script lang="ts">
	/**
	 * ScreenContainer - Desktop panel transition system
	 * Flash-like staggered container animations:
	 * - Top/Bottom slide left, Middle slides right (out)
	 * - Background crossfades
	 * - Containers slide back in with content reveal
	 */
	import { onMount, tick } from 'svelte';
	import { navigation, type ScreenId } from '$lib/stores/navigation';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { getBackgroundPath, applyTheme } from '$lib/stores/theme';
	import { selectedDespreArticleId, despreSingleImage } from '$lib/stores/despreArticle';
	import { gallerySingleMedia } from '$lib/stores/gallery';
	import { selectedPartideSession, partideActiveLakeIndex } from '$lib/stores/partideSession';
	import { despreSubsections, lakes } from '$lib/data/content';
	import gsap from 'gsap';
	import SingleImageHolder from '$lib/components/SingleImageHolder.svelte';

	// Screen components
	import HomeScreen from '$lib/components/screens/HomeScreen.svelte';
	import AboutScreen from '$lib/components/screens/AboutScreen.svelte';
	import SessionsScreen from '$lib/components/screens/SessionsScreen.svelte';
	import GalleryScreen from '$lib/components/screens/GalleryScreen.svelte';
	import ContactScreen from '$lib/components/screens/ContactScreen.svelte';
	import Chenar from '$lib/components/Chenar.svelte';

	const SCREENS: Record<ScreenId, any> = {
		home: HomeScreen,
		about: AboutScreen,
		sessions: SessionsScreen,
		gallery: GalleryScreen,
		contact: ContactScreen,
	};

	const THEME_IDS: Record<ScreenId, string> = {
		home: 'home',
		about: 'about',
		sessions: 'sessions',
		gallery: 'gallery',
		contact: 'contact',
	};

	let containerEl: HTMLDivElement;
	let middleEl: HTMLDivElement;  // Main container (merged top + middle)
	let bottomEl: HTMLDivElement;
	let bgCurrentEl: HTMLDivElement;
	let bgNextEl: HTMLDivElement;
	
	let isTransitioning = false;
	let targetScreen: ScreenId | null = null;
	let renderedScreen: ScreenId = 'home';  // What's actually showing - ONLY updated during transition

	// Background paths (base for GitHub Pages /fishing-portfolio)
	// ScreenContainer is only shown in desktop layout → always use desktop assets (isMobile = false)
	$: currentBgPath = base + getBackgroundPath(THEME_IDS[renderedScreen], false);
	$: nextBgPath = targetScreen ? base + getBackgroundPath(THEME_IDS[targetScreen], false) : currentBgPath;

	// When viewing a Despre article, show its title instead of "Despre Mine"
	$: aboutArticleTitle =
		renderedScreen === 'about' && $selectedDespreArticleId
			? despreSubsections.find((s) => s.id === $selectedDespreArticleId)?.title ?? null
			: null;

	// When viewing a Partide session article, show session title instead of "Partide"
	$: sel = $selectedPartideSession;
	$: sessionsArticleTitle =
		renderedScreen === 'sessions' && sel
			? lakes.find((l) => l.id === sel.lakeId)?.sessions.find((s) => s.id === sel.sessionId)?.title ?? null
			: null;

	// Sync URL → screen only in three places (no reactive block – avoids races with goto):
	// 1. onMount (initial load)  2. popstate (back/forward, instant)  3. executeTransition (user nav, animated)
	function syncScreenFromPath(path: string) {
		const pathWithoutBase = (base && path.startsWith(base) ? path.slice(base.length) : path) || '/';
		const newScreen = pathToScreen(pathWithoutBase);
		if (newScreen !== renderedScreen) {
			renderedScreen = newScreen;
			navigation.navigateTo(newScreen);
			applyTheme(THEME_IDS[newScreen]);
		}
	}

	onMount(() => {
		// 1. Initial load
		syncScreenFromPath($page.url.pathname ?? '');

		// 2. Back/forward: instant switch, no animation
		const onPopState = () => syncScreenFromPath(window.location.pathname);
		window.addEventListener('popstate', onPopState);

		// 3. Expose nav for header and Acasa thumb deeplinks
		(window as any).__desktopNav = (screenId: ScreenId) => navigateToScreen(screenId);
		(window as any).__desktopNavByPath = (pathWithoutBase: string) => navigateByPath(pathWithoutBase);

		return () => {
			window.removeEventListener('popstate', onPopState);
			delete (window as any).__desktopNav;
			delete (window as any).__desktopNavByPath;
		};
	});

	/** Header nav: run transition then goto. */
	function navigateToScreen(target: ScreenId) {
		if (isTransitioning || target === renderedScreen) return;
		targetScreen = target;
		requestAnimationFrame(() => executeTransition());
	}

	/** Thumb deeplink: run same transition then goto so URL reflects e.g. /about/box. */
	function navigateByPath(pathWithoutBase: string) {
		const screen = pathToScreen(pathWithoutBase);
		if (isTransitioning || screen === renderedScreen) return;
		targetScreen = screen;
		requestAnimationFrame(() => executeTransition(pathWithoutBase));
	}

	function pathToScreen(path: string): ScreenId {
		const p = (path || '').trim();
		if (!p || p === '/') return 'home';
		if (p.startsWith('/about')) return 'about';
		if (p.startsWith('/sessions')) return 'sessions';
		if (p.startsWith('/gallery')) return 'gallery';
		if (p.startsWith('/contact')) return 'contact';
		return 'home';
	}

	function screenToPath(screen: ScreenId): string {
		if (screen === 'home') return '/';
		return `/${screen}`;
	}

	/** @param finalPathOverride - For thumb deeplinks, pass path so goto uses e.g. /about/box not just /about */
	async function executeTransition(finalPathOverride?: string) {
		if (isTransitioning || targetScreen === null) return;
		
		const newScreen = targetScreen;
		isTransitioning = true;
		navigation.navigateTo(newScreen);

		// PHASE 1: Slide containers OUT with OLD content
		await new Promise<void>((resolve) => {
			const tl = gsap.timeline({ onComplete: resolve });
			
			// Main slides left
			tl.to(middleEl, {
				x: '-100%',
				opacity: 0,
				duration: 0.4,
				ease: 'power2.in',
			}, 0);
			
			// Bottom slides right
			tl.to(bottomEl, {
				x: '100%',
				opacity: 0,
				duration: 0.4,
				ease: 'power2.in',
			}, 0.08);
		});

		// PHASE 2: Crossfade backgrounds (containers are hidden)
		await new Promise<void>((resolve) => {
			gsap.to(bgNextEl, {
				opacity: 1,
				duration: 0.3,
				ease: 'power1.inOut',
				onComplete: resolve
			});
		});

		// PHASE 3: Set subsection/session from path *before* swap so About/Partide show article from start (no main-then-article flash)
		if (finalPathOverride) {
			const path = finalPathOverride.trim();
			if (newScreen === 'about') {
				const aboutMatch = path.match(/^\/about\/([^/]+)\/?$/);
				if (aboutMatch) selectedDespreArticleId.set(aboutMatch[1]);
				else if (path === '/about' || path === '/about/') selectedDespreArticleId.set(null);
			} else if (newScreen === 'sessions') {
				const sessionMatch = path.match(/^\/sessions\/([^/]+)\/([^/]+)\/?$/);
				if (sessionMatch) {
					const [, lakeId, sessionId] = sessionMatch;
					const idx = lakes.findIndex((l) => l.id === lakeId);
					if (idx >= 0 && lakes[idx].sessions?.some((s) => s.id === sessionId)) {
						partideActiveLakeIndex.set(idx);
						selectedPartideSession.set({ lakeId, sessionId });
					}
				} else if (path === '/sessions' || path === '/sessions/') {
					selectedPartideSession.set(null);
				}
			}
		} else {
			// Header nav to section home: clear article/session so we show Despre/Partide home
			if (newScreen === 'about') selectedDespreArticleId.set(null);
			else if (newScreen === 'sessions') selectedPartideSession.set(null);
		}

		// Swap content NOW - containers are off-screen so user can't see the swap
		renderedScreen = newScreen;
		applyTheme(THEME_IDS[newScreen]);  // Update accent colors for new content
		await tick();

		// Reset bg layers for next transition
		gsap.set(bgCurrentEl, { opacity: 1 });
		gsap.set(bgNextEl, { opacity: 0 });

		// PHASE 4: Slide containers IN with NEW content
		await new Promise<void>((resolve) => {
			const tlIn = gsap.timeline({ onComplete: resolve });
			
			// Main slides in from left
			tlIn.fromTo(middleEl, 
				{ x: '-100%', opacity: 0 },
				{ x: '0%', opacity: 1, duration: 0.5, ease: 'power2.out' },
				0
			);
			
			// Bottom slides in from right
			tlIn.fromTo(bottomEl,
				{ x: '100%', opacity: 0 },
				{ x: '0%', opacity: 1, duration: 0.5, ease: 'power2.out' },
				0.1
			);
		});
		
		// PHASE 5: Update URL (use override for thumb deeplinks e.g. /about/box)
		const newPath = finalPathOverride ?? screenToPath(newScreen);
		goto(base + newPath, { replaceState: false });

		targetScreen = null;
		isTransitioning = false;
	}

</script>

<div class="screen-container" bind:this={containerEl}>
	<!-- Background layers -->
	<div class="bg-layer bg-current" bind:this={bgCurrentEl} style:background-image="url({currentBgPath})"></div>
	<div class="bg-layer bg-next" bind:this={bgNextEl} style:background-image="url({nextBgPath})"></div>

	<!-- Content containers -->
	<div class="screen-content">
		<!-- MAIN: Title + Content (merged top + middle) -->
		<div class="container container-main" bind:this={middleEl}>
			<Chenar variant="minimal" glowIntensity="subtle">
				<div class="main-content">
					<!-- Title/Wordmark area -->
					<div class="title-area">
						{#if renderedScreen === 'home'}
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
						{:else if renderedScreen === 'about'}
							<h1 class="wordmark">{aboutArticleTitle ?? 'Despre Mine'}</h1>
						{:else if renderedScreen === 'sessions'}
							<h1 class="wordmark">{sessionsArticleTitle ?? 'Partide'}</h1>
						{:else}
							<h1 class="page-title">
								{#if renderedScreen === 'gallery'}Galerie
								{:else if renderedScreen === 'contact'}Contact
								{/if}
							</h1>
						{/if}
					</div>
					<!-- Main section content -->
					<div class="content-area">
						<svelte:component this={SCREENS[renderedScreen]} section="middle" />
					</div>
				</div>
			</Chenar>
		</div>

		<!-- BOTTOM: Navigation/thumbnails area -->
		<div class="container container-bottom" bind:this={bottomEl}>
			<Chenar variant="minimal" glowIntensity="subtle">
				<svelte:component this={SCREENS[renderedScreen]} section="bottom" />
			</Chenar>
		</div>
	</div>

	<!-- Photo System: Despre/Partide gallery or Gallery section (videos/photos) -->
	<SingleImageHolder
		open={!!$gallerySingleMedia || !!$despreSingleImage}
		onClose={() => ($gallerySingleMedia ? gallerySingleMedia.set(null) : despreSingleImage.set(null))}
		images={$gallerySingleMedia?.type === 'photo' ? $gallerySingleMedia.images : $despreSingleImage?.images ?? []}
		videos={$gallerySingleMedia?.type === 'video' ? $gallerySingleMedia.videos : []}
		currentIndex={$gallerySingleMedia ? $gallerySingleMedia.index : $despreSingleImage?.index ?? 0}
		onNavigate={(index) => {
			if ($gallerySingleMedia) gallerySingleMedia.update((p) => (p ? { ...p, index } : null));
			else despreSingleImage.update((p) => (p ? { ...p, index } : null));
		}}
	/>
</div>

<style>
	.screen-container {
		position: relative;
		width: 100%;
		height: calc(100vh - var(--header-height));
		height: calc(100svh - var(--header-height));
		/* Allow content to overflow off-screen if it can't fit, rather than overlap */
		overflow: visible;
	}

	/* ========== Background Layers ========== */
	.bg-layer {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.bg-current {
		z-index: 0;
	}

	.bg-next {
		z-index: 1;
		opacity: 0;
	}

	/* ========== Content Layout ========== */
	.screen-content {
		--main-height: 400px;
		--bottom-height: 200px;
		--safety-margin: 50px;
		/* Minimum distance from header to bottom container = main + 2*safety = 500px */
		--min-bottom-top: calc(var(--main-height) + var(--safety-margin) * 2);
		
		position: relative;
		z-index: 2;
		width: 100%;
		height: 100%;
		padding: var(--space-4);
	}

	/* ========== Containers ========== */
	.container {
		position: absolute;
		left: var(--space-4);
		right: var(--space-4);
		overflow: visible; /* Allow Chenar glow to show */
		display: flex;
		flex-direction: column;
	}

	/* MAIN: Title + Content - fixed 400px, vertically centered in available space */
	.container-main {
		height: var(--main-height);
		/* 
		 * Center in available space between header and bottom container:
		 * - Available top = padding
		 * - Available bottom = bottom_container.top - safety_margin
		 * - Center: padding + (available_height - main_height) / 2
		 */
		top: max(
			var(--space-4),
			calc(
				var(--space-4) + 
				(
					max(var(--min-bottom-top), calc(100% - var(--bottom-height) - var(--space-4))) 
					- var(--safety-margin) 
					- var(--space-4) 
					- var(--main-height)
				) / 2
			)
		);
	}

	/* BOTTOM: Navigation/thumbnails - fixed 200px */
	/* Position: at bottom if space allows, otherwise at minimum distance from top */
	.container-bottom {
		height: var(--bottom-height);
		/* Top = whichever is larger: minimum distance from header OR natural bottom position */
		top: max(
			var(--min-bottom-top),
			calc(100% - var(--bottom-height) - var(--space-4))
		);
	}

	/* ========== Main Content Layout ========== */
	.main-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: var(--space-4);
	}

	.title-area {
		flex-shrink: 0;
		padding-bottom: var(--space-4);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.content-area {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	/* ========== Wordmark (Home) ========== */
	.wordmark {
		font-family: var(--font-family-script);
		font-weight: normal;
		color: var(--color-text-primary);
		letter-spacing: 0.05em;
		text-shadow: 
			0 0 30px rgba(255, 255, 255, 0.4),
			0 2px 15px rgba(0, 0, 0, 0.6);
		margin: 0;
	}

	.wordmark-svg {
		display: block;
		height: clamp(2rem, 5vw, 3.5rem);
		fill: var(--color-text-primary);
	}

	/* ========== Page Title (Galerie, Contact – same Echinos as wordmark) ========== */
	.page-title {
		font-size: clamp(1.5rem, 3vw, 2.5rem);
		font-family: var(--font-family-script);
		font-weight: normal;
		color: var(--color-text-primary);
	}
</style>
