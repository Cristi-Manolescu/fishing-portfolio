<script lang="ts">
	/**
	 * Section nav for mobile outro (Screen 4 / Screen 3).
	 * Disables the link for the currently active section to prevent re-navigation
	 * (which causes Screen 4 elements to load inside Screen 1).
	 */
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	export let navClass = 'section-nav';

	const ITEMS: { path: string; label: string }[] = [
		{ path: '/', label: 'Acasă' },
		{ path: '/about', label: 'Despre' },
		{ path: '/sessions/', label: 'Partide' },
		{ path: '/gallery/', label: 'Galerie' },
		{ path: '/contact/', label: 'Contact' },
	];

	$: pathname = $page.url?.pathname ?? '';

	function isActive(itemPath: string): boolean {
		const normalized = pathname.replace(/\/$/, '') || '/';
		const normalizedBase = base.replace(/\/$/, '') || '';
		const fullPath = (base + itemPath).replace(/\/$/, '') || '/';

		if (itemPath === '/') {
			// Home: active when pathname is root (not /about, /sessions, etc.)
			const isRoot = normalized === '/' || normalized === '' || normalized === normalizedBase;
			const notOtherSection = !/\/(about|sessions|gallery|contact)(\/|$)/.test(pathname);
			return isRoot && notOtherSection;
		}
		// Other sections: active when pathname starts with the section path
		return normalized === fullPath || normalized.startsWith(fullPath + '/');
	}

</script>

<nav class="{navClass} section-nav-inner" aria-label="Principal">
	{#each ITEMS as item}
		{@const active = isActive(item.path)}
		{#if active}
			<span class="outro-link outro-link-active" aria-current="page">{item.label}</span>
		{:else}
			<a href={base + item.path} class="outro-link">{item.label}</a>
		{/if}
	{/each}
</nav>

<style>
	nav.section-nav-inner {
		pointer-events: auto;
		flex: 0 0 auto;
		padding-top: var(--header-height);
		min-height: 0;
		height: 50vh;
		height: 50svh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
	}

	.outro-link,
	.outro-link-active {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		text-shadow:
			0 0 2px rgba(0, 0, 0, 0.8),
			0 1px 3px rgba(0, 0, 0, 0.6),
			0 2px 6px rgba(0, 0, 0, 0.4);
		transition:
			color var(--duration-fast) var(--ease-out),
			text-shadow var(--duration-fast) var(--ease-out);
	}

	a.outro-link:hover {
		color: var(--color-accent);
		text-shadow:
			0 0 2px rgba(0, 0, 0, 0.9),
			0 1px 4px rgba(0, 0, 0, 0.7),
			0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.outro-link-active {
		opacity: 0.7;
		cursor: default;
		pointer-events: none;
	}
</style>
