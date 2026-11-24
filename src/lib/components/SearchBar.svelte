<script>
	/**
	 * SearchBar — a magnifier that expands IN PLACE into an input field.
	 *
	 * Interaction: clicking the magnifier widens the control from a square
	 * button into a text field (a width transition, so the icon appears to
	 * stretch into the bar), focuses it, and dims the page behind it. The
	 * header stays at full brightness, so attention lands on the one thing
	 * that is now interactive. Escape or a click on the dimmed area closes it.
	 *
	 * Why the dimming works the way it does: the overlay is a fixed layer at
	 * z-index 5 and the header sits at z-index 10, so the header is simply
	 * above it — no cut-outs, no masks, no duplicated header. The header is
	 * opaque, so the dim never greys the navbar. `searchState` shares the open
	 * flag with the overlay, which lives outside this component.
	 *
	 * Results live in memory already (lib/search.js), so they update per
	 * keystroke with no request. "/" opens search from anywhere, Enter jumps to
	 * the top hit.
	 *
	 * Results are a plain list of links, not a listbox: they behave like any
	 * link (open in a new tab, copy the address), and the reader moves between
	 * them with Tab or with Up and Down. A polite status line says what the
	 * list holds ("3 posts found", "No matches for …", "Loading index…"). It
	 * is in the page whenever search is open, even before there is anything
	 * to say, because screen readers only announce changes to a live region
	 * that already exists.
	 */
	import { goto } from '$app/navigation';
	import { search, loadIndex, searchIndex } from '$lib/search.svelte.js';
	import { searchState } from '$lib/search-state.svelte.js';
	import { themeLabel } from '$lib/site.js';
	import { formatDate } from '$lib/posts.js';

	let query = $state('');
	let inputEl = $state(null);
	let rootEl = $state(null);

	const results = $derived(search(query));
	const open = $derived(searchState.open);
	const hasQuery = $derived(query.trim().length >= 1);

	// What the status line says. "Loading" and "no matches" stay apart: the
	// latter is a factual claim that cannot be made before the index lands.
	const status = $derived(
		!hasQuery
			? ''
			: searchIndex.failed
				? 'Search is unavailable right now.'
				: !searchIndex.ready
					? 'Loading index…'
					: results.length
						? `${results.length} ${results.length === 1 ? 'post' : 'posts'} found`
						: `No matches for “${query.trim()}”.`
	);

	function show() {
		query = '';
		searchState.open = true;
		// Fetch the index on first open. Deliberately not awaited: the field
		// should expand and accept typing immediately, and results appear when
		// the index lands a moment later.
		loadIndex();
	}

	function hide() {
		searchState.open = false;
		query = '';
	}

	// Focus the field once it has actually widened enough to be usable. Focusing
	// on the same tick would scroll some browsers to a zero-width element.
	$effect(() => {
		if (open && inputEl) inputEl.focus();
	});

	function onWindowKeydown(event) {
		if (event.key === 'Escape' && open) {
			hide();
			return;
		}
		// "/" opens search — but never steal the key while someone is typing.
		if (event.key === '/' && !open) {
			if (event.target.closest?.('input, textarea, [contenteditable]')) return;
			event.preventDefault();
			show();
		}
	}

	function go(slug) {
		hide();
		goto(`/blog/${slug}/`);
	}

	function onInputKeydown(event) {
		if (event.key === 'Enter' && results.length) go(results[0].slug);
		if (event.key === 'ArrowDown' && results.length) {
			event.preventDefault();
			rootEl.querySelector('.results a')?.focus();
		}
	}

	// Up and Down move between results; Up from the first returns to the field.
	function onResultsKeydown(event) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		const links = [...rootEl.querySelectorAll('.results a')];
		const i = links.indexOf(document.activeElement);
		if (i < 0) return;
		event.preventDefault();
		if (event.key === 'ArrowDown') links[Math.min(i + 1, links.length - 1)].focus();
		else if (i === 0) inputEl.focus();
		else links[i - 1].focus();
	}

	// Closing on blur would fire before a result click registers, so closing is
	// driven by Escape and by SearchScrim instead.
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="search" class:open bind:this={rootEl}>
	<!-- The magnifier doubles as the field's leading icon once expanded, which
	     is what sells the "icon stretches into a bar" effect: it never moves. -->
	<button
		class="icon"
		type="button"
		onclick={show}
		tabindex={open ? -1 : 0}
		aria-label="Search the site"
		aria-expanded={open}
		title="Search (press /)"
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
			<circle cx="11" cy="11" r="7" />
			<path d="m20.5 20.5-4-4" />
		</svg>
	</button>

	<input
		bind:this={inputEl}
		bind:value={query}
		onkeydown={onInputKeydown}
		type="text"
		placeholder="Search posts, tags, even code…"
		aria-label="Search query"
		tabindex={open ? 0 : -1}
		aria-hidden={!open}
	/>

	{#if open}
		<!-- Visually hidden until there is a query, but always present while
		     open, so the status line below is a live region from the start. -->
		<div class="results" class:empty={!hasQuery} onkeydown={onResultsKeydown} role="presentation">
			<p class="meta status" class:error={searchIndex.failed} role="status">{status}</p>
			{#if hasQuery && searchIndex.ready && results.length}
				<ul aria-label="Search results">
					{#each results as result}
						<li>
							<a href={`/blog/${result.slug}/`} onclick={hide}>
								<span class="title">{result.title}</span>
								<span class="meta">{themeLabel(result.theme)} · {formatDate(result.date)}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* ---- the control itself ----------------------------------------------- */
	.search {
		position: relative;
		display: flex;
		align-items: center;
		height: 40px;
		width: 40px; /* collapsed: an icon button */
		border-radius: var(--radius-pill);
		background: transparent;
		overflow: hidden;
		/* Animating `width` is the point: the box visibly grows out of the icon.
		   It is not a compositor-only property, but this is a single small
		   element animating once on click, not a scroll-linked effect, so the
		   layout cost is irrelevant and the alternative (transform: scaleX)
		   would stretch the icon and the text along with the box. */
		transition: width 200ms ease-out, background-color 160ms ease;
	}

	.search.open {
		width: min(24rem, 46vw);
		background: var(--page);
	}
	/* The open field's hairline is drawn over the box rather than as its
	   border, so the 40px icon button inside never shrinks to make room. */
	.search.open::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 1px solid var(--outline);
		border-radius: inherit;
		pointer-events: none;
	}
	.search.open:focus-within::before {
		border-color: var(--accent);
	}

	.icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 40px;
		height: 40px;
		padding: 0;
		color: var(--ink);
		background: transparent;
		border: none;
		border-radius: 50%;
		cursor: pointer;
	}
	.search:not(.open) .icon:is(:hover, :active) {
		background: var(--tappable);
	}
	.search.open .icon {
		color: var(--muted);
		cursor: default;
	}
	.icon svg {
		width: 20px;
		height: 20px;
	}

	input {
		flex: 1;
		min-width: 0; /* let the input shrink to nothing while collapsed */
		border: none;
		background: transparent;
		color: var(--ink);
		font-family: var(--font-body);
		font-size: var(--type-body);
		padding: 0 0.6rem 0 0;
		outline: none;
		/* Fade the text in slightly behind the width animation so the field
		   does not show a cramped placeholder mid-expansion. */
		opacity: 0;
		transition: opacity 140ms ease 120ms;
	}
	.search.open input {
		opacity: 1;
	}
	input::placeholder {
		color: var(--muted);
	}

	/* ---- results ----------------------------------------------------------- */
	.results {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		width: min(26rem, 80vw);
		background: var(--tile);
		border: 1px solid var(--divider);
		border-radius: var(--radius-card);
		overflow: hidden;
		z-index: 20;
	}

	/* The panel must escape the control's `overflow: hidden`, which exists to
	   clip the input while collapsed. Lifting it out of the flow is not enough
	   — the parent needs to stop clipping once open. */
	.search.open {
		overflow: visible;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0.35rem;
		max-height: 19rem;
		overflow-y: auto;
	}
	li a {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		border-radius: var(--radius-tile);
		padding: 0.55rem 0.7rem;
		color: var(--ink);
		text-decoration: none;
	}
	li a:hover,
	li a:focus-visible {
		background: var(--tappable);
	}
	.title {
		font-size: var(--type-body-l);
	}
	.status {
		margin: 0;
		padding: 0.6rem 1rem 0.2rem;
	}
	.status:only-child {
		padding-bottom: 0.8rem;
	}
	.status.error {
		color: var(--error);
	}

	/* No query yet: off screen but still in the accessibility tree. */
	.results.empty {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		border: 0;
		padding: 0;
	}

	/* Phones: an inline expansion has nowhere to go. A 375px viewport, minus
	   the wordmark, the theme toggle and the padding, leaves under 8rem — too
	   narrow to read what you are typing, and it pushes the navbar into a
	   second row mid-interaction.

	   So below 640px the control stops expanding and becomes a popup instead:
	   it detaches from the bar and pins itself under the header at full width.
	   The trigger stays exactly where it was, so the control the user tapped
	   does not appear to move. */
	@media (max-width: 640px) {
		.search.open {
			position: fixed;
			top: 0.75rem;
			left: 0.75rem;
			right: 0.75rem;
			width: auto;
			height: 44px;
			z-index: 30; /* above the mobile scrim (20) */
			background: var(--page);
			/* No width animation on mobile — the element is changing position,
			   and animating both reads as a glitch rather than a transition. */
			transition: none;
		}

		.search.open .results {
			left: 0;
			right: 0;
			width: auto;
		}

		.search.open input {
			font-size: var(--type-body-l); /* >=16px or iOS Safari zooms the whole page on focus */
			transition: none;
			opacity: 1;
		}
	}
</style>
