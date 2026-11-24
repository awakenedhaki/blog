<script>
	/**
	 * SearchScrim — the dimming layer behind the expanded search field.
	 *
	 * This lives in the ROOT layout, as a sibling of <header>, and that
	 * placement is the whole point rather than an organisational preference.
	 *
	 * The header is sticky with a `z-index`, so it forms its own stacking
	 * context. A fixed scrim nested inside it would be painted within the
	 * header's layer — above the nav links, never beneath them — so its
	 * `z-index: 5` would never be compared against the header's `z-index: 10`.
	 * As a sibling it sits in the root stacking context, where 5 < 10 means
	 * what it looks like it means.
	 */
	import { searchState } from '$lib/search-state.svelte.js';

	function close() {
		searchState.open = false;
	}
</script>

{#if searchState.open}
	<div class="scrim" onclick={close} role="presentation"></div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		/* Below the header (10), above page content. */
		z-index: 5;
		background: var(--scrim);
		animation: fade 160ms ease;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	/* Phones: search is a popup rather than an inline expansion (see
	   SearchBar), so the dimming SHOULD cover the header too — the popup is
	   the focus, not the navbar. Lifting the scrim above the header is the
	   only difference between the two behaviours. */
	@media (max-width: 640px) {
		.scrim {
			z-index: 20;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scrim {
			animation: none;
		}
	}
</style>
