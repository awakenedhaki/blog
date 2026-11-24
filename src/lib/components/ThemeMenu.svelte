<script>
	/**
	 * ThemeMenu — System · Light · Dark, from one header control.
	 *
	 * The same <details> pattern as TopicsMenu, for the same reasons: it opens
	 * without JavaScript, and the browser supplies the disclosure semantics.
	 * Escape closes it and returns focus; a click outside closes it.
	 *
	 * The choices are native radio buttons in a fieldset, so arrow keys move
	 * between them and screen readers announce "1 of 3" with no roving
	 * tabindex to maintain. Choosing applies at once and leaves the panel open,
	 * since arrowing through the group chooses each option in turn.
	 *
	 * The icon shows the choice (sun, moon, or a half-filled circle for
	 * System) and does not animate.
	 */
	import { page } from '$app/state';
	import { CHOICES, setTheme, theme } from '$lib/theme.svelte.js';

	const LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

	let open = $state(false);
	let root = $state(null);

	$effect(() => {
		void page.url.pathname; // close after navigating
		open = false;
	});

	$effect(() => {
		function onKeydown(event) {
			// Read the element, not `open`: a menu opened before hydration
			// never told the bound state, and must still close.
			if (event.key === 'Escape' && root?.open) {
				root.open = open = false;
				root?.querySelector('summary')?.focus();
			}
		}

		function onPointerDown(event) {
			if (root?.open && !event.composedPath().includes(root)) root.open = open = false;
		}

		document.addEventListener('keydown', onKeydown);
		document.addEventListener('pointerdown', onPointerDown);
		return () => {
			document.removeEventListener('keydown', onKeydown);
			document.removeEventListener('pointerdown', onPointerDown);
		};
	});
</script>

<details class="menu" bind:open bind:this={root}>
	<summary aria-label="Theme: {LABELS[theme.choice]}" title="Theme">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			{#if theme.choice === 'light'}
				<circle cx="12" cy="12" r="4.2" />
				<path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
			{:else if theme.choice === 'dark'}
				<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
			{:else}
				<circle cx="12" cy="12" r="8.5" />
				<path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
			{/if}
		</svg>
	</summary>

	<fieldset class="panel">
		<legend>Theme</legend>
		{#each CHOICES as choice}
			<label>
				<input
					type="radio"
					name="theme"
					value={choice}
					checked={theme.choice === choice}
					onchange={() => setTheme(choice)}
				/>
				<span>{LABELS[choice]}</span>
			</label>
		{/each}
	</fieldset>
</details>

<style>
	.menu {
		position: relative;
	}

	summary {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		color: var(--ink);
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover,
	.menu[open] summary {
		background: var(--tappable);
	}

	svg {
		width: 20px;
		height: 20px;
	}

	.panel {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		z-index: 20;
		min-width: 10rem;
		margin: 0;
		padding: 0.5rem;
		background: var(--tile);
		border: 1px solid var(--divider);
		border-radius: var(--radius-card);
	}

	legend {
		/* Spoken as the group's name and shown as the panel title. `float`
		   pulls the legend inside the panel's box instead of onto its border. */
		float: left;
		width: 100%;
		padding: 0.25rem 0.5rem 0.5rem;
		font-size: var(--type-title);
		font-weight: 700;
		color: var(--ink);
	}

	label {
		clear: both;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 40px;
		padding: 0 0.5rem;
		border-radius: var(--radius-pill);
		font-size: var(--type-label-l);
		font-weight: 600;
		letter-spacing: var(--tracking-label-l);
		color: var(--ink);
		cursor: pointer;
	}
	label:hover {
		background: var(--tappable);
	}

	input {
		margin: 0;
		accent-color: var(--accent);
	}
</style>
