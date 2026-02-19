<script lang="ts">
	import '$lib/styles/tokens.css';
	import '$lib/styles/base.css';
	import '$lib/styles/lenis.css';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { applyTheme, getBackgroundPath, currentTheme } from '$lib/stores/theme';
	import { isDeviceMobile, viewport } from '$lib/stores/device';
	import Header from '$lib/components/Header.svelte';
	import ScreenContainer from '$lib/components/ScreenContainer.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';

	// Loading state
	let showLoading = true;
	let loadingComplete = false;
	let isInitialLoad = true;
	// Skip loading screen on article/session detail pages so it never sticks
	$: pathname = $page.url?.pathname ?? '';
	$: isArticlePage = /\/about\/[^/]+\/?$/.test(pathname);
	$: isSessionDetailPage = /\/sessions\/[^/]+\/[^/]+\/?$/.test(pathname);
	$: showLoadingScreen = showLoading && !isArticlePage && !isSessionDetailPage;
	$: loadingActive = showLoading && isInitialLoad && !isArticlePage && !isSessionDetailPage;

	function handleLoadingComplete() {
		loadingComplete = true;
		showLoading = false;
		if (browser) {
			sessionStorage.setItem('pescuit-loaded', 'true');
		}
	}

	$: isDesktopMode = !isDeviceMobile && $viewport.width >= 1024;

	$: routeId = $page.route.id ?? '/';
	$: themeId = getThemeFromRoute(routeId);

	$: if (!isDesktopMode) {
		applyTheme(themeId);
	}

	/* Use mobile BGs whenever we're in mobile layout */
	$: mobileBgPath = base + getBackgroundPath(!isDesktopMode ? themeId : 'home', !isDesktopMode);

	let bgLayerEl: HTMLDivElement;
	$: if (browser && bgLayerEl) {
		bgLayerEl.style.setProperty('--bg-image', `url(${mobileBgPath})`);
	}

	function getThemeFromRoute(route: string): string {
		if (route.startsWith('/about')) return 'about';
		if (route.startsWith('/sessions')) return 'sessions';
		if (route.startsWith('/gallery')) return 'gallery';
		if (route.startsWith('/contact')) return 'contact';
		return 'home';
	}

	/** Defensive cleanup: kill ScrollTriggers before nav to avoid Outro elements sticking on article pages */
	beforeNavigate(() => {
		if (!browser) return;
		import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
			ScrollTrigger.getAll().forEach((st) => st.kill());
		});
	});

	/** Refresh ScrollTrigger after nav so it stays in sync with new DOM */
	/** Scroll to top on mobile section navigation: browser restores scroll position, so new section loads mid-page. Includes article pages so deep links load article at top. */
	afterNavigate((nav) => {
		if (!browser) return;
		const shouldScrollToTop = !isDesktopMode && nav.from != null;

		import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
			ScrollTrigger.refresh();
			if (shouldScrollToTop) {
				requestAnimationFrame(() => window.scrollTo(0, 0));
			}
		});
	});

	let mounted = false;

	/** Lock full-screen background height to avoid zoom effect when browser nav bar shows/hides */
	function initStableViewportHeight() {
		if (!browser || typeof document === 'undefined') return;
		const setStable = (h: number) => {
			document.documentElement.style.setProperty('--stable-viewport-height', `${h}px`);
		};
		const vp = window.visualViewport;
		const getHeight = () => (vp ? vp.height : window.innerHeight);
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		let stableHeight = getHeight();
		setStable(stableHeight);

		const onViewportResize = () => {
			const h = getHeight();
			// iOS Chrome: resize fires with larger height when bar hides; lock to initial so we never grow
			if (isIOS) return;
			stableHeight = Math.min(stableHeight, h);
			setStable(stableHeight);
		};
		const onOrientationChange = () => {
			stableHeight = getHeight();
			setStable(stableHeight);
		};

		if (vp && !isIOS) {
			vp.addEventListener('resize', onViewportResize);
			vp.addEventListener('scroll', onViewportResize);
		}
		window.addEventListener('orientationchange', onOrientationChange);
		return () => {
			if (vp && !isIOS) {
				vp.removeEventListener('resize', onViewportResize);
				vp.removeEventListener('scroll', onViewportResize);
			}
			window.removeEventListener('orientationchange', onOrientationChange);
		};
	}

	onMount(() => {
		mounted = true;
		const cleanupStable = initStableViewportHeight();

		// Never show loading on article or session detail pages
		const pathname = window.location.pathname;
		const isArticlePage = /\/about\/[^/]+\/?$/.test(pathname);
		const isSessionDetailPage = /\/sessions\/[^/]+\/[^/]+\/?$/.test(pathname);
		if (isArticlePage || isSessionDetailPage) {
			isInitialLoad = false;
			showLoading = false;
			loadingComplete = true;
			return () => cleanupStable?.();
		}

		const hasLoadedBefore = sessionStorage.getItem('pescuit-loaded');
		const scrolledDown = window.scrollY > 80;

		if (!hasLoadedBefore || scrolledDown) {
			isInitialLoad = true;
			showLoading = true;
		} else {
			isInitialLoad = false;
			showLoading = false;
			loadingComplete = true;
		}

		return () => cleanupStable?.();
	});
</script>

<svelte:head>
	<title>Pescuit în Argeș</title>
	<meta name="description" content="Jurnalul meu de pescuit pe apele Argeșului" />
	<link rel="icon" href="{base}/assets/img/ui/logo/logo.png" type="image/png" />
</svelte:head>

<!-- Loading Screen (initial load only; never on article pages) -->
{#if showLoadingScreen}
	<LoadingScreen onComplete={handleLoadingComplete} minDisplayTime={1800} />
{/if}

{#if !isDesktopMode}
	<div
		bind:this={bgLayerEl}
		class="bg-layer"
		class:loaded={mounted && (loadingComplete || !isInitialLoad || isArticlePage)}
		class:behind-loading={loadingActive}
	></div>
{/if}

<Header visible={!showLoadingScreen} />

{#if isDesktopMode}
	<div class="app app-desktop" class:behind-loading={loadingActive}>
		<ScreenContainer />
	</div>
{:else}
	<div class="app app-mobile" class:behind-loading={loadingActive}>
		<slot />
	</div>
{/if}

<style>
	.bg-layer {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		/* Lock height to stable value so nav bar show/hide doesn’t resize and cause zoom effect */
		height: var(--stable-viewport-height, 100svh);
		min-height: 100svh;
		z-index: -1;
		background-color: var(--color-bg-primary);
		background-image: var(--bg-image);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		opacity: 0;
		transition: opacity var(--duration-slow) var(--ease-out),
		            background-image var(--duration-slow) var(--ease-out);
	}

	.bg-layer.loaded {
		opacity: 1;
	}

	.behind-loading {
		opacity: 0;
		pointer-events: none;
	}

	.app {
		min-height: 100vh;
		min-height: 100svh;
		display: flex;
		flex-direction: column;
	}

	.app-desktop {
		padding-top: var(--header-height);
		height: 100vh;
		height: 100svh;
		overflow: hidden;
	}

	.app-mobile {
		padding-top: var(--header-height);
	}
</style>
