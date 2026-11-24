<script>
	/**
	 * Chevron — the open/closed mark for disclosures (Topics menu, Contents,
	 * callouts). A 2px round-capped stroke rather than a ▾ text glyph, so it
	 * matches the line icons and does not depend on the font.
	 *
	 * Points down; the parent rotates it (e.g. `details[open] .chevron`).
	 */
	let { size = 12 } = $props();
</script>

<svg class="chevron" viewBox="0 0 12 12" width={size} height={size} aria-hidden="true" focusable="false">
	<path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>

<style>
	.chevron {
		flex: none;
		color: var(--muted);
		transition: transform 120ms ease;
	}
</style>
