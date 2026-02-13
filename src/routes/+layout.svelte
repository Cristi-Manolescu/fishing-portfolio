<script lang="ts">
	import '$lib/styles/tokens.css';
	import '$lib/styles/base.css';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
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
	// Skip loading screen on article pages so it never sticks
	$: pathname = $page.url?.pathname ?? '';
	$: isArticlePage = /\/about\/[^/]+\/?$/.test(pathname);
	$: showLoadingScreen = showLoading && !isArticlePage;
	$: loadingActive = showLoading && isInitialLoad && !isArticlePage;

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

	$: mobileBgPath = base + getBackgroundPath(!isDesktopMode ? themeId : 'home', isDeviceMobile);

	function getThemeFromRoute(route: string): string {
		if (route.startsWith('/about')) return 'about';
		if (route.startsWith('/sessions')) return 'sessions';
		if (route.startsWith('/gallery')) return 'gallery';
		if (route.startsWith('/contact')) return 'contact';
		return 'home';
	}

	let mounted = false;
	onMount(() => {
		mounted = true;

		// Never show loading on article pages
		const pathname = window.location.pathname;
		const isArticlePage = /\/about\/[^/]+\/?$/.test(pathname);
		if (isArticlePage) {
			isInitialLoad = false;
			showLoading = false;
			loadingComplete = true;
			return;
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
		class="bg-layer"
		class:loaded={mounted && (loadingComplete || !isInitialLoad || isArticlePage)}
		class:behind-loading={loadingActive}
		style:--bg-image="url({mobileBgPath})"
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
		inset: 0;
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
