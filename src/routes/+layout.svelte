<script lang="ts">
	import '$lib/styles/tokens.css';
	import '$lib/styles/base.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { applyTheme, getBackgroundPath, currentTheme } from '$lib/stores/theme';
	import { isDeviceMobile, viewport } from '$lib/stores/device';
	import Header from '$lib/components/Header.svelte';
	import ScreenContainer from '$lib/components/ScreenContainer.svelte';

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
	});
</script>

<svelte:head>
	<title>Pescuit în Argeș</title>
	<meta name="description" content="Jurnalul meu de pescuit pe apele Argeșului" />
</svelte:head>

<!-- Fixed Background Layer (Mobile only - Desktop uses ScreenContainer's background) -->
{#if !isDesktopMode}
	<div class="bg-layer" class:loaded={mounted} style:--bg-image="url({mobileBgPath})"></div>
{/if}

<!-- Header -->
<Header />

<!-- Main Content -->
{#if isDesktopMode}
	<!-- Desktop: Panel-based navigation -->
	<div class="app app-desktop">
		<ScreenContainer />
	</div>
{:else}
	<!-- Mobile/Tablet: Normal page routing -->
	<div class="app app-mobile">
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
