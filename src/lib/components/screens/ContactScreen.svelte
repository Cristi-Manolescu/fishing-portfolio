<script lang="ts">
	export let section: 'middle' | 'bottom' = 'middle';
</script>

{#if section === 'middle'}
	<div class="middle-content">
		<div class="info-area">
			<p class="info-text">
				Ai întrebări despre pescuit sau vrei să mă contactezi pentru colaborări?
				Completează formularul sau găsește-mă pe rețelele sociale.
			</p>
		</div>
		
		<form class="contact-form" on:submit|preventDefault>
			<input type="text" placeholder="Nume" class="form-input" />
			<input type="email" placeholder="Email" class="form-input" />
			<textarea placeholder="Mesaj" rows="4" class="form-input form-textarea"></textarea>
			<button type="submit" class="form-submit">Trimite</button>
		</form>
	</div>
{:else if section === 'bottom'}
	<div class="bottom-content">
		<div class="social-links">
			<a href="#" class="social-link">
				<span class="social-icon">📷</span>
				<span class="social-label">Instagram</span>
			</a>
			<a href="#" class="social-link">
				<span class="social-icon">📘</span>
				<span class="social-label">Facebook</span>
			</a>
			<a href="#" class="social-link">
				<span class="social-icon">📺</span>
				<span class="social-label">YouTube</span>
			</a>
		</div>
	</div>
{/if}

<style>
	.middle-content {
		display: flex;
		gap: var(--space-8);
		height: 100%;
		align-items: center;
	}

	.info-area {
		flex: 1;
	}

	.info-text {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.contact-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-width: 400px;
	}

	.form-input {
		width: 100%;
		padding: var(--space-3) var(--space-4);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	.form-input::placeholder {
		color: var(--color-text-muted);
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}

	.form-submit {
		padding: var(--space-3) var(--space-6);
		background: var(--color-accent);
		border: none;
		border-radius: 0.5rem;
		color: white;
		font-size: var(--font-size-sm);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		transition: all var(--duration-fast) var(--ease-out);
		align-self: flex-start;
	}

	.form-submit:hover {
		filter: brightness(1.1);
		transform: translateY(-2px);
		box-shadow: 0 4px 20px color-mix(in srgb, var(--color-accent) 50%, transparent);
	}

	.bottom-content {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.social-links {
		display: flex;
		gap: var(--space-6);
	}

	.social-link {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.social-link:hover {
		border-color: var(--color-accent);
		background: rgba(255, 255, 255, 0.1);
	}

	.social-icon {
		font-size: var(--font-size-lg);
	}

	.social-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.social-link:hover .social-label {
		color: var(--color-accent);
	}
</style>
