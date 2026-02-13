<script lang="ts">
	/**
	 * Header Component
	 * Logo (fish SVG) + Navigation + Mobile menu
	 */
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { currentTheme } from '$lib/stores/theme';
	import { isDeviceMobile, viewport } from '$lib/stores/device';
	import { isAtTop } from '$lib/stores/scroll';
	import { currentScreen, type ScreenId } from '$lib/stores/navigation';
	import { onMount } from 'svelte';

	// Visibility control (for loading screen)
	export let visible = true;

	// Fish logo SVG path
	const LOGO_PATH = 'M185.446,379.833c-14.149,1.529-24.268,8.689-32.695,16.121c-8.657,7.633-15.425,17.215-20.435,28.381c3.467-17.753,16.736-31.035,30.198-40.869c4.585-3.349,9.867-7.244,15.212-8.401C180.428,374.479,184.583,377.743,185.446,379.833z M154.113,400.04c0.581-0.01,0.277,0.169,0.227,0.454c-4.479,4.445-10.383,16.712-6.812,27.02c0.985,2.842,5.071,9.785,9.082,9.763c2.437-0.014,3.477-2.406,5.449-3.405c-0.804,2.98-3.521,6.015-3.406,10.671c-8.465-3.054-15.77-8.624-16.575-19.072C141.14,413.274,147.068,405.298,154.113,400.04z M222.683,400.267c7.37,4.24,13.351,12.933,12.487,24.975c-0.761,10.622-8.056,16.472-16.801,19.3c0.271-4.965-1.915-7.471-3.406-10.671c2.318,0.664,3.104,3.276,5.449,3.405c2.353,0.129,5.566-3.162,7.039-5.222C233.994,422.898,229.122,405.082,222.683,400.267z M176.137,418.204c-11.282-0.676-11.498-12.418-20.889-14.985c3.461-1.18,7.949,0.036,10.217,1.362C170.647,407.611,170.514,416.071,176.137,418.204z M221.774,402.765c-8.582,3.528-9.411,14.807-20.889,15.439c5.617-1.94,5.514-9.2,9.763-12.488C213.357,403.621,216.513,402.673,221.774,402.765z M217.461,407.76c4.441,8.471-5.653,14.364-12.715,9.99C212.993,418.429,216.534,414.401,217.461,407.76z M159.79,407.987c0.264-0.037,0.404,0.05,0.454,0.227c0.21,6.98,4.816,9.564,11.807,9.763C164.795,421.917,155.748,416.059,159.79,407.987z M160.698,439.547c2.213-7.248,7.564-13.324,16.348-14.758c0.386-0.084,0.428,0.177,0.454,0.453C171.082,429.194,164.512,432.992,160.698,439.547z M220.866,461.798c-8.231-1.91-11.551-8.732-11.807-18.618c-1.439,3.782-4.947,5.497-8.628,7.039c1.724-1.683,3.75-3.062,4.314-5.904c-4.228-1.026-8.502,1.685-13.169,2.044c-7.617,0.587-12.899-2.253-19.072-2.271c0.536,2.87,2.459,4.353,4.314,5.903c-3.37-0.793-7.29-3.003-8.401-6.812c-0.899,1.671-0.509,3.726-0.681,5.449c-0.712,7.123-5.107,11.428-11.353,13.169c3.709-2.484,6.605-5.95,7.039-11.579c0.162-2.106-0.343-4.475,0-7.266c0.383-3.122,2.441-6.358,4.314-8.401c4.479-4.886,12.482-9.046,20.435-9.536c5.509-0.34,12.162,2.579,16.348,5.449c4.403,3.019,8.873,7.349,9.536,12.715c0.391,3.166-0.252,5.939,0,8.4C214.569,456.603,217.139,458.588,220.866,461.798z M169.78,442.953c4.636-3.18,12.712-0.682,18.845-0.682c6.201,0,14.633-2.324,19.072,0.454C203.271,429.248,173.274,429.49,169.78,442.953z M142.08,435.914c2.543,1.549,3.952,3.946,7.039,5.903c3.852,2.442,8.933,2.897,10.898,6.812C151.503,447.833,145.904,442.155,142.08,435.914z M234.717,435.688c0.405-0.064,0.466,0.214,0.227,0.227c-3.438,6.78-9.022,11.412-17.71,12.941C221.348,442.753,231.296,442.483,234.717,435.688z M237.895,440.909c3.332,1.588,7.184,4.624,12.488,4.995c-2.801-1.963-5.707-3.921-8.4-7.039c-1.631-1.886-4.027-5.04-4.314-7.038c-0.368-2.567,1.449-4.9,0.908-8.174c7.094,9.026,16.355,15.886,28.154,20.208c-6.885,5.783-23.908,8.875-32.241,2.27c-0.67-0.53-1.824-1.189-1.589-2.043c3.252,1.742,7.328,2.662,11.807,3.179C242.073,445.511,239.634,443.561,237.895,440.909z M257.422,443.634c-5.378-2.645-9.824-6.222-14.759-9.31C245.588,439.271,250.706,443.235,257.422,443.634z M139.355,440.455c-0.927,2.706-3.986,5.247-7.039,6.584c4.108,0.021,8.658-1.482,12.034-2.951c0.285,1.028-1.062,1.458-1.816,2.043c-7.968,6.182-25.211,3.809-32.241-2.27c11.977-4.145,21.176-11.065,28.381-19.98c-0.315,3.015,1.217,5.283,0.908,7.719c-0.506,3.992-6.651,10.08-9.536,12.262c-1.076,0.813-2.408,1.377-3.406,1.816C131.811,445.776,135.982,442.91,139.355,440.455z M119.829,443.861c6.912-1.035,12.375-4.729,14.758-9.537C129.857,437.693,124.837,440.771,119.829,443.861z M199.523,425.242c8.937-0.292,14.317,7.412,17.482,14.531C212.837,434.18,206.687,428.6,199.523,425.242z M196.799,373.929c11.991,3.899,21.712,11.46,29.971,19.299c8.215,7.798,15.532,17.745,17.938,31.105c-4.584-11.45-11.552-20.86-20.208-28.381c-8.436-7.329-18.385-14.617-32.468-16.121c-0.491-0.984,1.21-1.945,2.271-2.725c1.133-0.833,2.494-1.877,3.86-2.043c-0.766-1.238-2.329-0.122-3.86-0.227c0.072-3.402-0.649-6.011-1.362-8.628c-0.331,3.908-0.718,7.759-2.498,10.217c-0.497-4.533-0.428-11.683-1.816-13.85c-1.381,2.934-1.423,9.172-1.816,13.85c-1.677-2.41-2.216-5.958-2.271-9.99c-1.129,2.201-1.323,5.337-1.589,8.401c-1.598-0.206-2.654-0.604-4.314-0.227c0.299-0.609,1.439-0.377,2.043-0.681c0.948-9.118,2.963-17.169,7.947-22.251C193.898,356.547,195.552,365.035,196.799,373.929z';

	const NAV_ITEMS: { href: string; label: string; screenId: ScreenId }[] = [
		{ href: '/', label: 'Acasă', screenId: 'home' },
		{ href: '/about', label: 'Despre', screenId: 'about' },
		{ href: '/sessions', label: 'Partide', screenId: 'sessions' },
		{ href: '/gallery', label: 'Galerie', screenId: 'gallery' },
		{ href: '/contact', label: 'Contact', screenId: 'contact' },
	];

	let menuOpen = false;
	let mounted = false;

	// Detect desktop mode (same logic as layout)
	$: isDesktopMode = !isDeviceMobile && $viewport.width >= 1024;
	$: currentPath = $page.url.pathname;
	$: accentColor = $currentTheme.accent;
	
	// Active screen - use navigation store on desktop (since we bypass SvelteKit routing)
	$: activeScreenId = isDesktopMode ? $currentScreen : null;

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) {
			closeMenu();
		}
	}

	/**
	 * Handle navigation click - intercept for desktop mode
	 */
	function handleNavClick(e: MouseEvent, screenId: ScreenId) {
		if (isDesktopMode && typeof (window as any).__desktopNav === 'function') {
			e.preventDefault();
			(window as any).__desktopNav(screenId);
		}
		// On mobile, let the default <a> behavior work
	}

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<header class="header" class:scrolled={!$isAtTop} class:menu-open={menuOpen} class:hidden={!visible}>
	<!-- Logo -->
	<a href={base + '/'} class="logo" aria-label="Acasă" on:click={(e) => handleNavClick(e, 'home')}>
		<span class="logo-glow" aria-hidden="true"></span>
		<svg 
			class="logo-svg" 
			viewBox="100 350 160 120" 
			overflow="visible"
			aria-hidden="true"
			style:--accent={accentColor}
		>
			<path class="logo-path" d={LOGO_PATH} />
		</svg>
	</a>

	<!-- Desktop Navigation -->
	<nav class="nav-desktop" aria-label="Navigare principală">
		{#each NAV_ITEMS as item}
			<a 
				href={base + item.href} 
				class="nav-link"
				class:active={isDesktopMode 
					? activeScreenId === item.screenId 
					: (currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href)))}
				on:click={(e) => handleNavClick(e, item.screenId)}
			>
				{item.label}
			</a>
		{/each}
	</nav>

	<!-- Mobile Menu Button -->
	<button 
		class="menu-button"
		aria-label={menuOpen ? 'Închide meniul' : 'Deschide meniul'}
		aria-expanded={menuOpen}
		on:click={toggleMenu}
	>
		<span class="menu-bar"></span>
		<span class="menu-bar"></span>
		<span class="menu-bar"></span>
	</button>
</header>

<!-- Mobile Overlay -->
{#if menuOpen}
	<div class="overlay" on:click={closeMenu} on:keydown={handleKeydown} role="button" tabindex="-1">
		<nav class="overlay-nav" aria-label="Meniu mobil">
			<!-- Logo in overlay -->
			<a href={base + '/'} class="overlay-logo" on:click={closeMenu} aria-label="Acasă">
				<svg viewBox="100 350 160 120" overflow="visible" aria-hidden="true" style:--accent={accentColor}>
					<path class="logo-path" d={LOGO_PATH} />
				</svg>
			</a>

			<!-- Nav links -->
			<div class="overlay-links">
				{#each NAV_ITEMS.filter(i => i.href !== '/') as item, i}
					<a 
						href={base + item.href} 
						class="overlay-link"
						class:active={currentPath === item.href || currentPath.startsWith(item.href)}
						style="animation-delay: {(i + 1) * 80}ms"
						on:click={closeMenu}
					>
						{item.label}
					</a>
				{/each}
			</div>
		</nav>
	</div>
{/if}

<style>
	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: var(--z-fixed);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--content-padding);
		height: var(--header-height);
		transition: background var(--duration-base) var(--ease-out),
		            backdrop-filter var(--duration-base) var(--ease-out);
	}

	.header.scrolled {
		background: rgba(10, 10, 10, 0.8);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.header.hidden {
		opacity: 0;
		transform: translateY(-100%);
		pointer-events: none;
		transition: opacity 0.5s ease-out, transform 0.5s ease-out;
	}

	.header:not(.hidden) {
		opacity: 1;
		transform: translateY(0);
		transition: opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s,
		            background var(--duration-base) var(--ease-out),
		            backdrop-filter var(--duration-base) var(--ease-out);
	}

	/* ========== Logo ========== */
	.logo {
		position: relative;
		display: flex;
		align-items: center;
		z-index: 10;
	}

	.logo-svg {
		position: relative;
		z-index: 1;
		width: 72px;
		height: 72px;
		transition: transform var(--duration-base) var(--ease-spring);
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
	}

	.logo-path {
		fill: var(--accent, var(--color-accent));
		transition: fill var(--duration-base) var(--ease-out);
	}

	/* Shimmer effect - only on devices that support hover (not touch) */
	@media (hover: hover) {
		.logo::before {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(
				105deg,
				transparent 20%,
				rgba(255, 255, 255, 0.3) 45%,
				rgba(255, 255, 255, 0.5) 50%,
				rgba(255, 255, 255, 0.3) 55%,
				transparent 80%
			);
			background-size: 200% 100%;
			background-position: 200% 0;
			mix-blend-mode: overlay;
			pointer-events: none;
			opacity: 0;
			transition: opacity var(--duration-base) var(--ease-out);
		}

		.logo:hover::before {
			opacity: 1;
			animation: shimmer 0.8s ease-out;
		}

		@keyframes shimmer {
			from { background-position: 200% 0; }
			to { background-position: -200% 0; }
		}

		.logo:hover .logo-svg {
			transform: scale(1.1);
			filter: drop-shadow(0 0 20px var(--accent, var(--color-accent)))
			        drop-shadow(0 0 40px var(--accent, var(--color-accent)));
		}
	}

	/* Touch devices: simple tap feedback */
	@media (hover: none) {
		.logo:active .logo-svg {
			transform: scale(0.95);
			transition: transform 0.1s ease-out;
		}
	}

	/* Pulse animation for logo - always visible */
	.logo-glow {
		position: absolute;
		inset: -15px;
		background: radial-gradient(circle, var(--accent, var(--color-accent)) 0%, transparent 70%);
		pointer-events: none;
		border-radius: 50%;
		filter: blur(20px);
		animation: glowPulse 2.5s ease-in-out infinite;
	}

	/* Slightly dimmer when scrolled */
	.header.scrolled .logo-glow {
		animation: glowPulseSubtle 2.5s ease-in-out infinite;
	}

	@keyframes glowPulse {
		0%, 100% { opacity: 0.5; transform: scale(0.9); }
		50% { opacity: 0.8; transform: scale(1.2); }
	}

	@keyframes glowPulseSubtle {
		0%, 100% { opacity: 0.3; transform: scale(0.9); }
		50% { opacity: 0.5; transform: scale(1.1); }
	}

	/* ========== Desktop Navigation ========== */
	.nav-desktop {
		display: none;
		gap: var(--space-8);
	}

	@media (min-width: 768px) {
		.nav-desktop {
			display: flex;
		}
	}

	.nav-link {
		font-size: var(--font-size-sm);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-text-primary);
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
		transition: color var(--duration-fast) var(--ease-out);
		position: relative;
	}

	.nav-link::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		width: 0;
		height: 1px;
		background: var(--color-accent);
		box-shadow: 0 0 8px var(--color-accent);
		transition: width var(--duration-base) var(--ease-out);
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--color-accent);
	}

	.nav-link:hover::after,
	.nav-link.active::after {
		width: 100%;
	}

	/* ========== Mobile Menu Button ========== */
	.menu-button {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		width: 32px;
		height: 32px;
		z-index: 10;
	}

	@media (min-width: 768px) {
		.menu-button {
			display: none;
		}
	}

	.menu-bar {
		display: block;
		width: 100%;
		height: 2px;
		background: var(--color-text-primary);
		border-radius: 1px;
		transition: transform var(--duration-fast) var(--ease-out),
		            opacity var(--duration-fast) var(--ease-out);
	}

	.menu-open .menu-bar:nth-child(1) {
		transform: translateY(7px) rotate(45deg);
	}

	.menu-open .menu-bar:nth-child(2) {
		opacity: 0;
	}

	.menu-open .menu-bar:nth-child(3) {
		transform: translateY(-7px) rotate(-45deg);
	}

	/* ========== Mobile Overlay ========== */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-fixed) - 1);
		background: rgba(10, 10, 10, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn var(--duration-fast) var(--ease-out);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.overlay-nav {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-10);
	}

	.overlay-logo {
		width: 120px;
		height: 120px;
		animation: slideIn var(--duration-base) var(--ease-out);
	}

	.overlay-logo svg {
		width: 100%;
		height: 100%;
	}

	.overlay-links {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
	}

	.overlay-link {
		font-size: var(--font-size-2xl);
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var(--color-text-secondary);
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
		transition: color var(--duration-fast) var(--ease-out),
		            text-shadow var(--duration-fast) var(--ease-out);
		animation: slideIn var(--duration-base) var(--ease-out) backwards;
	}

	@keyframes slideIn {
		from { 
			opacity: 0; 
			transform: translateY(20px); 
		}
		to { 
			opacity: 1; 
			transform: translateY(0); 
		}
	}

	.overlay-link:hover,
	.overlay-link.active {
		color: var(--color-accent);
		text-shadow: 
			0 2px 8px rgba(0, 0, 0, 0.8),
			0 0 20px var(--color-accent);
	}

	/* ========== Responsive ========== */
	@media (min-width: 768px) {
		.logo-svg {
			width: 84px;
			height: 84px;
		}
	}
</style>
