<script lang="ts">
	/**
	 * ContactScreen - Desktop Contact panel.
	 * Main: same text as mobile (left) + thin-line form (right). Bottom: social icons (same links as mobile outro).
	 */
	const CONTACT_EMAIL = 'cristi_manolescu86@yahoo.com';
	const SENDER_MESSAGE =
		'Dacă ai fi abordat o situație altfel, m-aș bucura să aflu. Învățarea nu se termină niciodată, iar schimbul de idei face parte din farmecul acestei pasiuni.';

	const SOCIAL_LINKS = [
		{ id: 'fb', label: 'Facebook', href: 'https://www.facebook.com/ShyshyBMF/?locale=ro_RO', icon: 'fb' },
		{ id: 'ig', label: 'Instagram', href: 'https://www.instagram.com/cristianmihaimanolescu/', icon: 'ig' },
		{ id: 'gh', label: 'GitHub', href: 'https://github.com/Cristi-Manolescu', icon: 'gh' },
		{ id: 'yt', label: 'YouTube', href: '', icon: 'yt', tbd: true },
	] as const;

	function handleSubmit(e: Event) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const nume = (form.querySelector('[name="nume"]') as HTMLInputElement)?.value ?? '';
		const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value ?? '';
		const mesaj = (form.querySelector('[name="mesaj"]') as HTMLTextAreaElement)?.value ?? '';
		const subject = encodeURIComponent(`Contact Pescuit în Argeș${nume ? ` – ${nume}` : ''}`);
		const body = encodeURIComponent(
			(mesaj ? `Mesaj:\n${mesaj}\n\n` : '') + (email ? `De la: ${email}` : '')
		);
		window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
	}

	export let section: 'middle' | 'bottom' = 'middle';
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="contact-text-area">
			<p class="contact-message">{SENDER_MESSAGE}</p>
		</div>
		<form class="contact-form" on:submit={handleSubmit}>
			<input
				type="text"
				name="nume"
				class="contact-input"
				placeholder="Nume*"
				required
				autocomplete="name"
				aria-label="Nume"
			/>
			<input
				type="email"
				name="email"
				class="contact-input"
				placeholder="E-mail*"
				required
				autocomplete="email"
				aria-label="E-mail"
			/>
			<textarea
				name="mesaj"
				class="contact-input contact-textarea"
				placeholder="Mesaj*"
				rows="3"
				required
				aria-label="Mesaj"
			></textarea>
			<button type="submit" class="contact-submit">Trimite</button>
		</form>
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		<div class="contact-social" aria-label="Rețele sociale">
			{#each SOCIAL_LINKS as link}
				{#if link.tbd}
					<span class="contact-social-link contact-social-link--tbd" title="În curând">
						{#if link.icon === 'fb'}{@render fbIcon()}{:else if link.icon === 'ig'}{@render igIcon()}{:else if link.icon === 'gh'}{@render ghIcon()}{:else}{@render ytIcon()}{/if}
						<span class="sr-only">{link.label} (în curând)</span>
					</span>
				{:else}
					<a
						href={link.href}
						class="contact-social-link"
						target="_blank"
						rel="noopener noreferrer"
						aria-label={link.label}
					>
						{#if link.icon === 'fb'}{@render fbIcon()}{:else if link.icon === 'ig'}{@render igIcon()}{:else if link.icon === 'gh'}{@render ghIcon()}{:else}{@render ytIcon()}{/if}
					</a>
				{/if}
			{/each}
		</div>
	</div>
{/if}

{#snippet fbIcon()}
	<svg class="contact-social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
{/snippet}
{#snippet igIcon()}
	<svg class="contact-social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
{/snippet}
{#snippet ghIcon()}
	<svg class="contact-social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
{/snippet}
{#snippet ytIcon()}
	<svg class="contact-social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
{/snippet}

<style>
	.middle-content {
		display: flex;
		flex-direction: row;
		gap: var(--space-8);
		height: 100%;
		align-items: center;
		min-width: 0;
	}

	/* Equal-width columns for text and form */
	.contact-text-area {
		flex: 1 1 0;
		min-width: 0;
	}

	.contact-message {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: var(--line-height-relaxed);
		margin: 0;
		letter-spacing: 0.02em;
	}

	.contact-form {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}

	/* Thin line minimalistic; hint text via placeholder, replaced when filled */
	.contact-input {
		width: 100%;
		padding: var(--space-1) 0;
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
		min-height: 3.25rem;
	}

	.contact-submit {
		margin-top: var(--space-1);
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		border: none;
		border-radius: var(--frame-radius);
		color: var(--color-bg-primary);
		font-size: var(--font-size-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		cursor: pointer;
		transition: opacity var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
		align-self: flex-start;
	}

	.contact-submit:hover {
		opacity: 0.95;
		transform: scale(1.02);
	}

	/* Bottom: social icons (same links as mobile OutroSocialWordmark) */
	.bottom-content {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.contact-social {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-4);
	}

	.contact-social-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		color: var(--color-text-primary);
		transition: background var(--duration-fast) var(--ease-out),
			border-color var(--duration-fast) var(--ease-out),
			box-shadow var(--duration-fast) var(--ease-out);
	}

	.contact-social-link:hover:not(.contact-social-link--tbd),
	.contact-social-link:active {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid var(--color-accent);
		box-shadow: 0 4px 20px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}

	.contact-social-link--tbd {
		opacity: 0.5;
		cursor: default;
		pointer-events: none;
	}

	.contact-social-icon {
		width: 1.5rem;
		height: 1.5rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
