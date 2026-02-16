<script lang="ts">
	/**
	 * SessionsScreen (Partide) - Desktop
	 * Layout like Despre: text left, images right in main; thumbs in bottom.
	 * Partide home: ticker (lake text) left, lake hero strip right (pointers only, no autoplay; active = higher + color, rest grayscale).
	 * Bottom: session thumbs for active lake; click = open session article in-place (same animations as Despre).
	 * Session article: middle = body + back + next, bottom = gallery thumbs; click gallery = SingleImageHolder.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import {
		lakes,
		imgPath,
		sessionHref,
		partideLakeTickerPathDesktop,
		partideSessionBodyPath,
		getPartideSessionHeroPath,
	} from '$lib/data/content';
	import { partideActiveLakeIndex, selectedPartideSession } from '$lib/stores/partideSession';
	import { despreSingleImage } from '$lib/stores/despreArticle';
	import ThumbRail from '$lib/components/ThumbRail.svelte';
	import Lenis from 'lenis';

	export let section: 'middle' | 'bottom' = 'middle';

	const SLIDE_DURATION_MS = 280;

	// ----- URL ↔ store sync -----
	$: pathname = $page.url?.pathname ?? '';
	$: if (section === 'middle' && browser) {
		const match = pathname.match(/\/sessions\/([^/]+)\/([^/]+)\/?$/);
		if (match) {
			const [, lakeId, sessionId] = match;
			const idx = lakes.findIndex((l) => l.id === lakeId);
			if (idx >= 0 && lakes[idx].sessions.some((s) => s.id === sessionId)) {
				partideActiveLakeIndex.set(idx);
				selectedPartideSession.set({ lakeId, sessionId });
			}
		} else if (pathname === '/sessions' || pathname === '/sessions/') {
			selectedPartideSession.set(null);
		}
	}

	$: activeLakeIndex = $partideActiveLakeIndex;
	$: selectedSession = $selectedPartideSession;
	$: activeLake = lakes[Math.max(0, Math.min(activeLakeIndex, lakes.length - 1))];
	$: effectiveSession = selectedSession; // for closing we keep showing session until slide-out ends
	let closingSession = false;
	let openingSession: { lakeId: string; sessionId: string } | null = null;
	let justClosedSession = false;
	let nextSessionTarget: { lakeId: string; sessionId: string } | null = null;

	// ----- Partide home: lake rail (same no-half-cut system as Despre, variant large) -----
	$: lakeRailItems = lakes.map((l) => ({
		link: '#',
		image: base + l.image,
		caption: l.title,
		id: l.id,
	}));

	function onLakeNavigate(dir: 'prev' | 'next') {
		partideActiveLakeIndex.update((i) =>
			dir === 'next' ? (i >= lakes.length - 1 ? 0 : i + 1) : (i <= 0 ? lakes.length - 1 : i - 1)
		);
	}

	// ----- Ticker text for active lake -----
	let partideTickerParagraphs: string[] = [];
	$: if (section === 'middle' && activeLake && !effectiveSession && !openingSession) {
		const lid = activeLake.id;
		fetch(base + partideLakeTickerPathDesktop(lid))
			.then((r) => (r.ok ? r.text() : ''))
			.then((text) => {
				const paras = text ? text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];
				// Only apply if still the same lake (avoid stale response)
				if (activeLake?.id === lid) {
					partideTickerParagraphs = paras.length ? paras : [activeLake.title];
				}
			})
			.catch(() => {
				if (activeLake?.id === lid) {
					partideTickerParagraphs = [activeLake.title];
				}
			});
	}

	// ----- Session article: open / close / next -----
	function openSession(lakeId: string, sessionId: string) {
		if (openingSession || effectiveSession) return;
		despreSingleImage.set(null);
		openingSession = { lakeId, sessionId };
		tick().then(() => {
			partideHomeWrapEl?.classList.add('slide-out');
			partideBottomWrapEl?.classList.add('slide-out');
			setTimeout(() => {
				selectedPartideSession.set(openingSession!);
				goto(base + sessionHref(lakeId, sessionId));
				openingSession = null;
			}, SLIDE_DURATION_MS);
		});
	}

	function requestCloseSession() {
		if (closingSession || !effectiveSession) return;
		closingSession = true;
		nextSessionTarget = null;
		tick().then(() => {
			sessionArticleWrapEl?.classList.add('slide-out');
			sessionBottomWrapEl?.classList.add('slide-out');
			setTimeout(doCloseSession, SLIDE_DURATION_MS);
		});
	}

	function requestNextSession() {
		if (!nextSession || closingSession) return;
		nextSessionTarget = { lakeId: activeLake.id, sessionId: nextSession.id };
		closingSession = true;
		tick().then(() => {
			sessionArticleWrapEl?.classList.add('slide-out');
			sessionBottomWrapEl?.classList.add('slide-out');
			setTimeout(doCloseSession, SLIDE_DURATION_MS);
		});
	}

	function doCloseSession() {
		if (nextSessionTarget) {
			selectedPartideSession.set(nextSessionTarget);
			partideActiveLakeIndex.set(lakes.findIndex((l) => l.id === nextSessionTarget!.lakeId));
			goto(base + sessionHref(nextSessionTarget.lakeId, nextSessionTarget.sessionId));
		} else {
			selectedPartideSession.set(null);
			goto(base + '/sessions');
			justClosedSession = true;
			setTimeout(() => { justClosedSession = false; }, SLIDE_DURATION_MS);
		}
		despreSingleImage.set(null);
		closingSession = false;
		nextSessionTarget = null;
	}

	// Current session data (for article view)
	$: sessionLake = effectiveSession ? lakes.find((l) => l.id === effectiveSession.lakeId) : null;
	$: sessionData = sessionLake && effectiveSession
		? sessionLake.sessions.find((s) => s.id === effectiveSession.sessionId)
		: null;
	$: sessionsList = sessionLake?.sessions ?? [];
	$: currentSessionIndex = sessionData ? sessionsList.findIndex((s) => s.id === sessionData.id) : -1;
	$: nextSession =
		currentSessionIndex >= 0 && currentSessionIndex < sessionsList.length - 1
			? sessionsList[currentSessionIndex + 1]
			: null;

	let sessionBodyText = '';
	$: if (browser && effectiveSession) {
		sessionBodyText = '';
		const path = partideSessionBodyPath(effectiveSession.lakeId, effectiveSession.sessionId);
		fetch(base + path)
			.then((r) => (r.ok ? r.text() : ''))
			.then((text) => { sessionBodyText = text; })
			.catch(() => { sessionBodyText = ''; });
	}

	$: sessionGalleryImages =
		sessionData?.galleryKeys?.map((key) => ({
			src: base + imgPath.partideSessionFullMobile(effectiveSession!.lakeId, effectiveSession!.sessionId, key),
			alt: sessionData.title,
		})) ?? [];
	$: sessionGalleryThumbItems =
		sessionData?.galleryKeys?.map((key) => ({
			link: '#',
			image: base + imgPath.partideThumb(effectiveSession!.lakeId, effectiveSession!.sessionId, key),
			caption: sessionData.title,
		})) ?? [];

	// Bottom: session thumbs for active lake (Partide home)
	$: sessionThumbItems = activeLake?.sessions.map((s) => ({
		link: '#',
		image: base + getPartideSessionHeroPath(activeLake.id, s.id),
		caption: s.title,
		id: s.id,
	})) ?? [];

	function openSingleImage(index: number) {
		if (sessionGalleryImages.length > 0 && index >= 0 && index < sessionGalleryImages.length) {
			despreSingleImage.set({ images: sessionGalleryImages, index });
		}
	}

	// Refs
	let partideHomeWrapEl: HTMLDivElement;
	let partideBottomWrapEl: HTMLDivElement;
	let sessionArticleWrapEl: HTMLDivElement;
	let sessionBottomWrapEl: HTMLDivElement;
	let tickerWrapperEl: HTMLDivElement;
	let tickerContentEl: HTMLDivElement;
	let sessionBodyWrapperEl: HTMLDivElement;
	let sessionBodyContentEl: HTMLDivElement;
	let lenisInstance: any = null;

	const LENIS_OPTS = { lerp: 0.07, duration: 1.4, smoothWheel: true, wheelMultiplier: 0.8, autoRaf: true };
	let lenisPrevClosing: boolean | null = null;
	let lenisPrevSession: string | null = null;
	let lenisScheduled = false;

	function scheduleLenisTicker() {
		if (lenisScheduled) return;
		lenisScheduled = true;
		tick().then(() => {
			lenisScheduled = false;
			if (tickerWrapperEl && tickerContentEl && !effectiveSession && !closingSession) {
				lenisInstance?.destroy();
				lenisInstance = new Lenis({ wrapper: tickerWrapperEl, content: tickerContentEl, ...LENIS_OPTS });
			}
		});
	}
	function scheduleLenisSession() {
		if (lenisScheduled) return;
		lenisScheduled = true;
		tick().then(() => {
			lenisScheduled = false;
			if (sessionBodyWrapperEl && sessionBodyContentEl && effectiveSession && !closingSession) {
				lenisInstance?.destroy();
				lenisInstance = new Lenis({
					wrapper: sessionBodyWrapperEl,
					content: sessionBodyContentEl,
					...LENIS_OPTS,
				});
			}
		});
	}

	$: if (section === 'middle' && browser) {
		const key = effectiveSession ? `${effectiveSession.lakeId}/${effectiveSession.sessionId}` : null;
		if (closingSession) {
			lenisInstance?.destroy();
			lenisInstance = null;
			lenisPrevClosing = true;
			lenisPrevSession = key;
		} else if (effectiveSession) {
			const needDestroy = lenisPrevClosing !== false || lenisPrevSession !== key;
			if (needDestroy) {
				lenisInstance?.destroy();
				lenisInstance = null;
			}
			lenisPrevClosing = false;
			lenisPrevSession = key;
			if (needDestroy) scheduleLenisSession();
		} else {
			const needDestroy = lenisPrevClosing !== false || lenisPrevSession !== null;
			if (needDestroy) {
				lenisInstance?.destroy();
				lenisInstance = null;
			}
			lenisPrevClosing = false;
			lenisPrevSession = null;
			if (needDestroy) scheduleLenisTicker();
		}
	}

	onDestroy(() => {
		lenisInstance?.destroy();
		lenisInstance = null;
		selectedPartideSession.set(null);
		despreSingleImage.set(null);
	});
</script>

{#if section === 'middle'}
	<div class="middle-content">
		{#if effectiveSession && sessionData && !openingSession}
			<!-- Session article view (same pattern as Despre article) -->
			<div
				class="session-article-view"
				class:sweep-in={selectedSession && !closingSession}
				class:slide-out={closingSession}
				bind:this={sessionArticleWrapEl}
			>
				<div class="session-article-center-group">
					<div class="session-article-nav session-article-nav-left">
						<button
							type="button"
							class="session-article-nav-btn session-article-nav-up"
							aria-label="Înapoi la Partide"
							on:click={requestCloseSession}
							disabled={closingSession}
						>
							<span aria-hidden="true">›</span>
						</button>
					</div>
					<div class="session-article-body-wrap">
						<div class="session-article-body-scroll" bind:this={sessionBodyWrapperEl}>
							<div class="session-article-body-inner" bind:this={sessionBodyContentEl}>
								<div class="session-article-body">
									{#if sessionBodyText}
										{@html sessionBodyText}
									{:else if sessionData.body}
										{#each sessionData.body as p}
											<p>{p}</p>
										{/each}
									{:else}
										<p class="session-article-loading">Se încarcă...</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
					{#if nextSession}
						<div class="session-article-nav session-article-nav-right">
							<button
								type="button"
								class="session-article-nav-btn session-article-next-btn"
								aria-label="Sesiune următoare: {nextSession.title}"
								on:click={requestNextSession}
							>
								<span aria-hidden="true">›</span><span aria-hidden="true">›</span>
							</button>
						</div>
					{:else}
						<div class="session-article-nav session-article-nav-right session-article-nav-placeholder" aria-hidden="true"></div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Partide home: ticker left, lake strip right -->
			<div
				class="partide-home-wrap"
				class:slide-out={!!openingSession}
				class:partide-slide-in={justClosedSession}
				bind:this={partideHomeWrapEl}
			>
				<div class="ticker-area">
					{#if activeLake}
						<h2 class="lake-title">{activeLake.title}</h2>
					{/if}
					<div class="ticker-content">
						<div class="desktop-ticker-scroll" bind:this={tickerWrapperEl}>
							<div class="ticker-inner" bind:this={tickerContentEl}>
								{#each partideTickerParagraphs as paragraph}
									<p class="intro-text">{paragraph}</p>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<div class="lake-rail-area">
					<ThumbRail
						items={lakeRailItems}
						variant="large"
						activeIndex={activeLakeIndex}
						onItemClick={(_item, index) => partideActiveLakeIndex.set(index)}
						onNavigate={onLakeNavigate}
					/>
				</div>
			</div>
		{/if}
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		{#if effectiveSession && sessionData && !openingSession}
			{#key effectiveSession.lakeId + '/' + effectiveSession.sessionId}
			<div
				class="session-bottom-wrap"
				class:slide-out={closingSession}
				class:slide-in={!closingSession}
				bind:this={sessionBottomWrapEl}
			>
				<div class="gallery-thumbs-label">Galerie</div>
				<ThumbRail
					items={sessionGalleryThumbItems}
					onItemClick={(_item, index) => openSingleImage(index)}
				/>
			</div>
			{/key}
		{:else}
			<div
				class="partide-bottom-wrap"
				class:slide-out={!!openingSession}
				class:partide-slide-in={justClosedSession}
				bind:this={partideBottomWrapEl}
			>
				<div class="sessions-label">SESIUNI{#if activeLake} · {activeLake.title}{/if}</div>
				<ThumbRail
					items={sessionThumbItems}
					onItemClick={(item, _index) => item.id && activeLake && openSession(activeLake.id, item.id)}
				/>
			</div>
		{/if}
	</div>
{/if}

<style>
	.middle-content {
		display: flex;
		gap: var(--space-6);
		height: 100%;
	}

	.ticker-area {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		/* Slightly reduce height so title + ticker don’t get clipped at the bottom */
		padding-bottom: var(--space-8);
	}

	.lake-title {
		flex-shrink: 0;
		font-family: var(--font-family-base);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 var(--space-3);
		letter-spacing: 0.02em;
	}

	/* Same scrolling structure as Despre Home: ticker-content wraps scroll area, Lenis on desktop-ticker-scroll */
	.ticker-content {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.desktop-ticker-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding-bottom: var(--space-2);
		scrollbar-width: thin;
		scrollbar-color: var(--color-accent) transparent;
	}

	.desktop-ticker-scroll::-webkit-scrollbar {
		width: 6px;
	}

	.desktop-ticker-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.desktop-ticker-scroll::-webkit-scrollbar-thumb {
		background: var(--color-accent);
		border-radius: 3px;
	}

	.desktop-ticker-scroll::-webkit-scrollbar-thumb:hover {
		background: color-mix(in srgb, var(--color-accent) 85%, white);
	}

	.intro-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		margin: 0 0 var(--space-2);
		text-align: justify;
	}

	.intro-text:last-child {
		margin-bottom: 0;
	}

	/* Lake rail: same no-half-cut system and size as Despre (ThumbRail variant large).
	 * Extra padding so the scaled active thumb (1.08) has breathing room and doesn’t overflow/clip. */
	.lake-rail-area {
		flex: 1.5;
		min-width: 0;
		display: flex;
		align-items: center;
		padding: var(--space-4);
	}

	/* Partide home / bottom wrappers (slide out/in like Despre) */
	.partide-home-wrap,
	.partide-bottom-wrap {
		display: flex;
		width: 100%;
		height: 100%;
		min-width: 0;
		transition: opacity 0.28s var(--ease-out), transform 0.28s var(--ease-out);
	}

	.partide-home-wrap {
		flex: 1;
		gap: var(--space-6);
	}

	.partide-bottom-wrap {
		flex: 1;
		align-items: center;
		gap: var(--space-6);
	}

	.partide-home-wrap.slide-out,
	.partide-bottom-wrap.slide-out {
		opacity: 0;
		transform: translateX(1.5rem);
	}

	.partide-home-wrap.partide-slide-in,
	.partide-bottom-wrap.partide-slide-in {
		animation: partideSlideIn 0.28s var(--ease-out) forwards;
	}

	@keyframes partideSlideIn {
		from {
			opacity: 0;
			transform: translateX(-1.5rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Bottom section */
	.bottom-content {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		height: 100%;
	}

	.sessions-label,
	.gallery-thumbs-label {
		flex-shrink: 0;
		width: 200px;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	/* Lake title after "SESIUNI ·" stays normal case */
	.sessions-label {
		text-transform: none;
	}

	.session-bottom-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--space-6);
		height: 100%;
		transition: opacity 0.28s var(--ease-out), transform 0.28s var(--ease-out);
	}

	.session-bottom-wrap.slide-out {
		opacity: 0;
		transform: translateX(1.5rem);
	}

	.session-bottom-wrap.slide-in {
		animation: articleSlideIn 0.28s var(--ease-out) forwards;
	}

	@keyframes articleSlideIn {
		from {
			opacity: 0;
			transform: translateX(1.5rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Session article view (mirror Despre article) */
	.session-article-view {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		opacity: 0;
		transform: translateX(1.5rem);
		transition: opacity 0.28s var(--ease-out), transform 0.28s var(--ease-out);
	}

	.session-article-view.sweep-in {
		opacity: 1;
		transform: translateX(0);
	}

	.session-article-view.slide-out {
		opacity: 0;
		transform: translateX(1.5rem);
	}

	.session-article-center-group {
		display: flex;
		align-items: stretch;
		gap: var(--space-3);
		width: 100%;
		max-width: calc(1000px + 32px + 32px + var(--space-3) * 2);
		height: 100%;
		min-height: 0;
		margin-left: auto;
		margin-right: auto;
	}

	.session-article-nav {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.session-article-nav-placeholder {
		width: 32px;
		pointer-events: none;
		visibility: hidden;
	}

	.session-article-nav-btn {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background var(--duration-fast), border-color var(--duration-fast);
	}

	.session-article-nav-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: var(--color-accent);
	}

	.session-article-nav-up span {
		display: inline-block;
		transform: rotate(-90deg);
	}

	.session-article-next-btn {
		gap: 2px;
	}

	.session-article-body-wrap {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
	}

	.session-article-body-scroll {
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--color-accent) transparent;
	}

	.session-article-body-scroll::-webkit-scrollbar {
		width: 6px;
	}

	.session-article-body-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.session-article-body-scroll::-webkit-scrollbar-thumb {
		background: var(--color-accent);
		border-radius: 3px;
	}

	.session-article-body-scroll::-webkit-scrollbar-thumb:hover {
		background: color-mix(in srgb, var(--color-accent) 85%, white);
	}

	.session-article-body-inner {
		min-height: min-content;
	}

	.session-article-body {
		box-sizing: border-box;
		width: 100%;
		max-width: 1000px;
		min-height: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		text-align: justify;
		padding: 0 var(--space-4);
	}

	.session-article-body :global(p) {
		margin: 0 0 var(--space-2);
	}

	.session-article-loading {
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
	}
</style>
