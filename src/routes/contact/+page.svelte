<script lang="ts">
	/**
	 * Contact - Mobile: Contact theme BG, one message for sender, thin-line form (Nume, E-mail, Mesaj).
	 * Same outro pattern as other mobile sections.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import Chenar from '$lib/components/Chenar.svelte';
	import SectionNav from '$lib/components/SectionNav.svelte';
	import OutroSocialWordmark from '$lib/components/OutroSocialWordmark.svelte';

	const CONTACT_EMAIL = 'cristi_manolescu86@yahoo.com';

	const SENDER_MESSAGE =
		'Dacă ai fi abordat o situație altfel, m-aș bucura să aflu. Învățarea nu se termină niciodată, iar schimbul de idei face parte din farmecul acestei pasiuni';

	let screen2El: HTMLElement;
	let screen3FixedVisible = false;
	let screen3ScrollTriggerCleanup: (() => void) | null = null;

	function handleSubmit(e: Event) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const nome = (form.querySelector('[name="nume"]') as HTMLInputElement)?.value ?? '';
		const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value ?? '';
		const mesaj = (form.querySelector('[name="mesaj"]') as HTMLTextAreaElement)?.value ?? '';
		const subject = encodeURIComponent(`Contact Pescuit în Argeș${nome ? ` – ${nome}` : ''}`);
		const body = encodeURIComponent(
			(mesaj ? `Mesaj:\n${mesaj}\n\n` : '') + (email ? `De la: ${email}` : '')
		);
		window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
	}

	onMount(() => {
		if (!browser) return;
		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);
				tick().then(() => initScreen3Reveal(ScrollTrigger));
			});
		});
	});

	onDestroy(() => {
		screen3ScrollTriggerCleanup?.();
	});

	function initScreen3Reveal(ScrollTrigger: any) {
		if (!screen2El) return;
		const st = ScrollTrigger.create({
			trigger: screen2El,
			start: 'bottom bottom',
			end: 'bottom top',
			onEnter: () => {
				screen3FixedVisible = true;
			},
			onLeaveBack: () => {
				screen3FixedVisible = false;
			},
		});
		screen3ScrollTriggerCleanup = () => st.kill();
	}
</script>

<svelte:head>
	<title>Contact – Pescuit în Argeș</title>
	<meta name="description" content="Contactează-mă pentru schimb de idei despre pescuit" />
</svelte:head>

<main class="contact-mobile">
	<section class="contact-main" bind:this={screen2El}>
		<div class="contact-spacer" aria-hidden="true"></div>
		<div class="contact-chenar-wrap">
			<div class="contact-scroll-hint" aria-hidden="true">
				<span class="scroll-text">Scroll</span>
				<span class="scroll-arrow">↓</span>
			</div>
			<Chenar variant="minimal" glowIntensity="none" noPadding>
				<div class="contact-chenar-content">
					<!-- Screen 1: title only (same as other sections) -->
					<div class="contact-title-block">
						<h1 class="contact-title">Contact</h1>
					</div>
					<!-- Screen 2: message + form -->
					<p class="contact-message">{SENDER_MESSAGE}</p>

					<form class="contact-form" on:submit={handleSubmit}>
						<div class="contact-field">
							<label for="contact-nume">Nume*</label>
							<input
								id="contact-nume"
								type="text"
								name="nume"
								class="contact-input"
								required
								autocomplete="name"
							/>
						</div>
						<div class="contact-field">
							<label for="contact-email">E-mail*</label>
							<input
								id="contact-email"
								type="email"
								name="email"
								class="contact-input"
								required
								autocomplete="email"
							/>
						</div>
						<div class="contact-field">
							<label for="contact-mesaj">Mesaj*</label>
							<textarea
								id="contact-mesaj"
								name="mesaj"
								class="contact-input contact-textarea"
								rows="4"
								required
							></textarea>
						</div>
						<button type="submit" class="contact-submit">Trimite</button>
					</form>
				</div>
			</Chenar>
		</div>
	</section>

	<section class="contact-screen-3">
		<div class="contact-screen-3-spacer" aria-hidden="true"></div>
		{#if screen3FixedVisible}
			<div class="contact-screen-3-fixed">
				<SectionNav navClass="contact-screen-3-nav" />
				<div class="contact-outro-bottom">
					<OutroSocialWordmark />
				</div>
			</div>
		{/if}
	</section>
</main>

<style>
	.contact-mobile {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100svh;
	}

	.contact-main {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--header-height));
		min-height: calc(100svh - var(--header-height));
		padding: var(--space-4) 0 0;
		overflow-x: hidden;
	}

	.contact-spacer {
		flex: 1;
		min-height: calc(100vh - var(--header-height) - 12rem);
		min-height: calc(100svh - var(--header-height) - 12rem);
	}

	.contact-chenar-wrap {
		width: 100%;
		margin-top: var(--space-3);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.contact-scroll-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		animation: contact-bounce 2s ease-in-out infinite;
	}

	.contact-scroll-hint .scroll-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}

	.contact-scroll-hint .scroll-arrow {
		font-size: var(--font-size-lg);
		color: var(--color-accent);
	}

	@keyframes contact-bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(6px); }
	}

	.contact-chenar-wrap :global(.chenar) {
		width: 100%;
		align-self: stretch;
	}

	.contact-chenar-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding: var(--space-4) var(--space-4) var(--space-12);
	}

	/* Screen 1: title only (same as Gallery/Despre – no extra height) */
	.contact-title-block {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4) var(--space-4) max(var(--space-6), env(safe-area-inset-bottom));
	}

	.contact-title {
		font-family: var(--font-family-script);
		font-size: clamp(2.5rem, 12vw, 5rem);
		font-weight: normal;
		color: var(--color-text-primary);
		text-shadow:
			0 0 30px rgba(255, 255, 255, 0.3),
			0 2px 15px rgba(0, 0, 0, 0.5);
		margin: 0;
	}

	.contact-message {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		margin: 0;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.contact-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.contact-field label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	/* One thin line in section theme */
	.contact-input {
		width: 100%;
		padding: var(--space-2) 0;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--color-accent);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		font-family: inherit;
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	.contact-input::placeholder {
		color: var(--color-text-muted);
	}

	.contact-input:focus {
		outline: none;
		border-bottom-color: var(--color-accent);
		box-shadow: 0 1px 0 0 var(--color-accent);
	}

	.contact-textarea {
		resize: vertical;
		min-height: 5rem;
	}

	.contact-submit {
		margin-top: var(--space-2);
		padding: var(--space-3) var(--space-6);
		background: var(--color-accent);
		border: none;
		border-radius: var(--frame-radius);
		color: var(--color-bg-primary);
		font-size: var(--font-size-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		cursor: pointer;
		transition: opacity var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
		align-self: flex-start;
	}

	.contact-submit:hover {
		opacity: 0.95;
		transform: scale(1.02);
	}

	/* Screen 3 – outro (same pattern as Gallery/Despre) */
	.contact-screen-3 {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
	}

	.contact-screen-3-spacer {
		display: block;
		min-height: 100vh;
		min-height: 100svh;
	}

	.contact-screen-3-fixed {
		position: fixed;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.contact-outro-bottom {
		pointer-events: auto;
		flex: 0 0 auto;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
	}

</style>
