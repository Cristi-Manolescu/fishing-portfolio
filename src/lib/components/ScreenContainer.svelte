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
	import { getBackgroundPath, applyTheme } from '$lib/stores/theme';
	import { isDeviceMobile } from '$lib/stores/device';
	import gsap from 'gsap';

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

	// Background paths
	$: currentBgPath = getBackgroundPath(THEME_IDS[renderedScreen], isDeviceMobile);
	$: nextBgPath = targetScreen ? getBackgroundPath(THEME_IDS[targetScreen], isDeviceMobile) : currentBgPath;

	// Sync URL to screen on mount only
	onMount(() => {
		const path = $page.url.pathname;
		renderedScreen = pathToScreen(path);
		navigation.navigateTo(renderedScreen);
		applyTheme(THEME_IDS[renderedScreen]);  // Apply initial theme
	});

	/**
	 * Navigate directly to a screen - called from Header via __desktopNav
	 * This does NOT use SvelteKit routing - we control everything manually
	 */
	function navigateToScreen(target: ScreenId) {
		if (isTransitioning || target === renderedScreen) return;
		
		targetScreen = target;
		// Wait for next frame so background element gets the new path
		requestAnimationFrame(() => {
			executeTransition();
		});
	}

	function pathToScreen(path: string): ScreenId {
		if (path.startsWith('/about')) return 'about';
		if (path.startsWith('/sessions')) return 'sessions';
		if (path.startsWith('/gallery')) return 'gallery';
		if (path.startsWith('/contact')) return 'contact';
		return 'home';
	}

	function screenToPath(screen: ScreenId): string {
		if (screen === 'home') return '/';
		return `/${screen}`;
	}

	async function executeTransition() {
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

		// PHASE 3: Swap content NOW - containers are off-screen so user can't see the swap
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
		
		// PHASE 5: Update URL for bookmarking/history (without triggering SvelteKit routing)
		const newPath = screenToPath(newScreen);
		if (window.location.pathname !== newPath) {
			window.history.pushState({}, '', newPath);
		}
		
		targetScreen = null;
		isTransitioning = false;
	}

	// Expose navigation for header - direct function call, no SvelteKit routing
	onMount(() => {
		(window as any).__desktopNav = (screenId: ScreenId) => {
			navigateToScreen(screenId);
		};
		
		return () => {
			delete (window as any).__desktopNav;
		};
	});
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
							<h1 class="wordmark">Pescuit în Argeș</h1>
							<p class="tagline">Jurnalul meu de pescuit pe apele Argeșului</p>
						{:else}
							<h1 class="page-title">
								{#if renderedScreen === 'about'}Despre Mine
								{:else if renderedScreen === 'sessions'}Partide
								{:else if renderedScreen === 'gallery'}Galerie
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
</div>

<style>
	.screen-container {
		position: relative;
		width: 100%;
		height: calc(100vh - var(--header-height));
		height: calc(100dvh - var(--header-height));
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
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-family: var(--font-family-script);
		font-weight: normal;
		color: var(--color-text-primary);
		letter-spacing: 0.05em;
		text-shadow: 
			0 0 30px rgba(255, 255, 255, 0.4),
			0 2px 15px rgba(0, 0, 0, 0.6);
		margin-bottom: var(--space-1);
	}

	.tagline {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
	}

	/* ========== Page Title (Other screens) ========== */
	.page-title {
		font-size: clamp(1.5rem, 3vw, 2.5rem);
		font-family: var(--font-family-display);
		color: var(--color-text-primary);
	}
</style>
