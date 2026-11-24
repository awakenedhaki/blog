<script>
	/**
	 * TopicsMenu — the "Topics" item in the header, as a dropdown listing the
	 * four browse axes (category, series, tag, year).
	 *
	 * Why <details>/<summary> rather than a button + custom popup:
	 * - It opens and closes with ZERO JavaScript. On a statically prerendered
	 *   blog that matters: the nav keeps working if the bundle is slow, blocked
	 *   or still hydrating. A hand-rolled popup is dead until JS arrives.
	 * - The browser supplies the disclosure semantics and keyboard handling
	 *   (Enter/Space toggle, focus behaviour) for free and correctly.
	 * - The JS below is therefore pure enhancement: close on Escape, close on
	 *   outside click, close after navigating. If it never runs, the menu is
	 *   merely slightly less polished, not broken.
	 *
	 * Trade-off accepted: <details> is a disclosure, not an ARIA menu. Screen
	 * readers will announce "Topics, collapsed/expanded" and then a list of
	 * links, rather than a menu with menuitems. For a set of navigation links
	 * that reading is arguably MORE accurate than role="menu" (which implies
	 * application-style commands), and it avoids the roving-tabindex code that
	 * a true menu pattern requires.
	 *
	 * Nuance on the trigger: the axes are also listed on /topics itself, so a
	 * reader who never opens the dropdown loses nothing. That redundancy is
	 * deliberate — it keeps the site navigable on touch devices, where hover
	 * affordances do not exist.
	 */
	import { browseAxes } from '$lib/site.js';
	import { page } from '$app/state';
	import NavIcon from './NavIcon.svelte';
	import Chevron from './Chevron.svelte';

	let { icon = 'topics' } = $props();

	let open = $state(false);

	// Marks "Topics" as the current section on any of the browse pages.
	const current = $derived(
		browseAxes.some(
			(axis) => page.url.pathname.startsWith(axis.href) // hrefs end in a slash
		)
	);
	let root = $state(null); // the <details> element, for outside-click tests

	// Close the menu whenever the route changes, so it never lingers over the
	// page the reader just navigated to.
	$effect(() => {
		void page.url.pathname; // dependency: re-run on navigation
		open = false;
	});

	// Enhancement: Escape closes and returns focus to the summary; a click
	// anywhere outside closes. Both listeners are removed on teardown.
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
			// `composedPath` rather than `contains` so clicks inside any nested
			// shadow DOM still register as "inside".
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
	<summary class:current>
		<NavIcon name={icon} />
		<span class="name">Topics</span><Chevron />
	</summary>

	<nav aria-label="Browse the archive">
		<ul>
			{#each browseAxes as axis}
				<li>
					<a href={axis.href} aria-current={page.url.pathname === axis.href ? 'page' : undefined}>
						<NavIcon name={axis.icon} size={16} />
						<span class="text">
							<span class="label">{axis.label}</span>
							<span class="blurb">{axis.blurb}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</details>

<style>
	.menu {
		position: relative;
	}

	summary {
		cursor: pointer;
		list-style: none; /* hide the default disclosure triangle... */
		font-size: var(--type-body);
		color: var(--ink);
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		gap: 0.25rem;
	}
	summary::-webkit-details-marker {
		display: none; /* ...including in Safari, which ignores list-style */
	}
	summary:hover .name {
		text-decoration-line: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 0.2em;
	}
	summary.current .name {
		text-decoration: underline 2px var(--accent);
		text-underline-offset: 0.35em;
	}

	/* The chevron turns to point up while the menu is open — the only visual
	   signal of state, so it must not depend on JS. `details[open]` is a pure
	   CSS selector, so it does not. */
	.menu[open] :global(.chevron) {
		transform: rotate(180deg);
	}

	nav {
		position: absolute;
		top: calc(100% + 0.6rem);
		right: 0;
		z-index: 20;
		min-width: 15rem;
		background: var(--tile);
		border: 1px solid var(--divider);
		border-radius: var(--radius-card);
		padding: var(--space-2);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li a {
		/* Icon and text on one row, with the icon aligned to the LABEL's
		   baseline rather than centred on the whole two-line block — centring
		   would float it between the label and the blurb, reading as if it
		   belonged to neither. */
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		min-height: 40px;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-tile);
		text-decoration: none;
		color: var(--ink);
		/* the axis-tick motif used by the TOC and post cards */
		border-left: 2px solid transparent;
	}
	li a:hover {
		background: var(--tappable);
	}
	li a[aria-current='page'] {
		border-left-color: var(--accent);
	}

	.text {
		display: block;
		min-width: 0;
	}

	.label {
		display: block;
		font-size: var(--type-label-l);
		font-weight: 600;
		letter-spacing: var(--tracking-label-l);
	}

	.blurb {
		display: block;
		font-family: var(--font-mono);
		font-size: var(--type-meta);
		color: var(--muted);
		line-height: 1.35;
	}

	/* Phones: the header nav wraps, and an absolutely positioned panel pinned
	   to the right can overhang the viewport. Pin it to both edges of the
	   header instead so it can never cause horizontal scroll. */
	@media (max-width: 640px) {
		.menu {
			position: static; /* the panel now positions against the header bar */
		}
		nav {
			left: 0;
			right: 0;
			min-width: 0;
		}
	}
</style>
