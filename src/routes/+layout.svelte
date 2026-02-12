<script lang="ts">
	import '$lib/styles/tokens.css';
	import '$lib/styles/base.css';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { applyTheme, getBackgroundPath, currentTheme } from '$lib/stores/theme';
	import { isDeviceMobile, viewport } from '$lib/stores/device';
	import Header from '$lib/components/Header.svelte';
	import ScreenContainer from '$lib/components/ScreenContainer.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';

	// Loading state
	// Start with loading visible so it's present from the very first paint.
	// onMount will decide whether to immediately hide it for subsequent visits.
	let showLoading = true;
	let loadingComplete = false;
	let isInitialLoad = true;
	$: loadingActive = showLoading && isInitialLoad;

	function handleLoadingComplete() {
		loadingComplete = true;
		showLoading = false;
		if (browser) {
			sessionStorage.setItem('pescuit-loaded', 'true');
		}
	}

	// Determine if we should use desktop panel mode
	// Desktop mode: >= 1024px width (not just tablet, but actual desktop)
	$: isDesktopMode = !isDeviceMobile && $viewport.width >= 1024;

	// Derive theme from route
	$: routeId = $page.route.id ?? '/';
	$: themeId = getThemeFromRoute(routeId);
	
	// Only apply theme immediately on mobile - desktop controls its own transitions
	$: if (!isDesktopMode) {
		applyTheme(themeId);
	}
	
	// Mobile background - only update when NOT in desktop mode
	// Desktop mode uses ScreenContainer's own background system for controlled transitions
	let mobileBgPath = getBackgroundPath('home', isDeviceMobile);
	$: if (!isDesktopMode) {
		mobileBgPath = getBackgroundPath(themeId, isDeviceMobile);
	}

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
		
		// Check if this is the first visit in this session
		const hasLoadedBefore = sessionStorage.getItem('pescuit-loaded');
		// Also consider page refresh while scrolled down (e.g. Screen 2/3)
		// so we can mask re-entry animations behind the loading screen.
		const scrolledDown = window.scrollY > 80;
		
		if (!hasLoadedBefore || scrolledDown) {
			// First visit OR refresh while scrolled down:
			// show loading screen to hide underlying animations.
			isInitialLoad = true;
			showLoading = true;
		} else {
			// Already visited - skip loading
			isInitialLoad = false;
			showLoading = false;
			loadingComplete = true;
		}
	});
</script>

<svelte:head>
	<title>Pescuit în Argeș</title>
	<meta name="description" content="Jurnalul meu de pescuit pe apele Argeșului" />
</svelte:head>

<!-- Loading Screen (initial load only) -->
{#if showLoading}
	<LoadingScreen onComplete={handleLoadingComplete} minDisplayTime={1800} />
{/if}

<!-- Fixed Background Layer (Mobile only - Desktop uses ScreenContainer's background) -->
{#if !isDesktopMode}
	<div 
		class="bg-layer"
		class:loaded={mounted && (loadingComplete || !isInitialLoad)}
		class:behind-loading={loadingActive}
		style:--bg-image="url({mobileBgPath})"
	></div>
{/if}

<!-- Header (visible after loading) -->
<Header visible={!showLoading} />

<!-- Main Content -->
{#if isDesktopMode}
	<!-- Desktop: Panel-based navigation -->
	<div class="app app-desktop" class:behind-loading={loadingActive}>
		<ScreenContainer />
	</div>
{:else}
	<!-- Mobile/Tablet: Normal page routing -->
	<div class="app app-mobile" class:behind-loading={loadingActive}>
		<slot />
	</div>
{/if}

<style>
	.bg-layer {
		position: fixed;
		inset: 0;
		z-index: -1;
		background-color: var(--color-theme);
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

	/* When loading screen is active, ensure all background/app content
	   is visually pushed behind it and non-interactive. */
	.behind-loading {
		opacity: 0;
		pointer-events: none;
	}

	.app {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.app-desktop {
		padding-top: var(--header-height);
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
	}

	.app-mobile {
		padding-top: var(--header-height);
	}
</style>
