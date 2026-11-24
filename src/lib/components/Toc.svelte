<script>
	/**
	 * Toc — the article's table of contents.
	 *
	 * Design follows the FixIt theme on awakenedhaki.dev: a "Contents" heading
	 * over a NESTED list, where each h3 sits indented beneath its parent h2.
	 * The nesting is the point — a flat list of fifteen headings tells you the
	 * article has fifteen sections; a nested one tells you it has six sections,
	 * two of which are subdivided. That is the structural preview a reader
	 * actually wants before committing to a long technical piece.
	 *
	 * Headings arrive as a PROP, extracted from the Markdown tree at build time
	 * (see remarkCollectHeadings in mdsvex.config.js). Consequences:
	 *   - the list is in the prerendered HTML, so it is visible on first paint,
	 *     with no layout shift and no dependency on JavaScript;
	 *   - nesting is real, because it came from a tree rather than a DOM query;
	 *   - ids match the heading anchors exactly (same slugger, same order).
	 *
	 * JavaScript is used for ONE thing: the scrollspy that highlights the
	 * section currently in view. If it never runs, the reader still has a
	 * complete, working, clickable contents list.
	 *
	 * @param {Array} headings - nested [{ id, text, level, children: [...] }]
	 */
	import { page } from '$app/state';
	import Chevron from './Chevron.svelte';

	let { headings = [] } = $props();

	let activeId = $state('');
	let open = $state(false); // mobile <details> state; forced open on desktop
	let wide = $state(false); // the always-open sidebar rail is showing

	// Total entries including nested children. The threshold below is about
	// usefulness: a two-section article does not need a contents list.
	const count = $derived(
		headings.reduce((sum, heading) => sum + 1 + heading.children.length, 0)
	);

	// Desktop renders the sidebar variant, which is always expanded. Tracking
	// the breakpoint in JS (not just CSS) keeps the <details> element's own
	// state honest, so a reader who collapsed it on mobile then rotated to
	// landscape does not end up with an invisible, still-collapsed rail.
	// On the rail the summary also leaves the tab order: CSS already blocks
	// the mouse, and a keyboard must not be able to collapse it either.
	$effect(() => {
		const wideScreen = window.matchMedia('(min-width: 1100px)');
		const sync = () => {
			wide = wideScreen.matches;
			if (wide) open = true;
		};
		sync();
		wideScreen.addEventListener('change', sync);
		return () => wideScreen.removeEventListener('change', sync);
	});

	// Scrollspy. Re-registered per article because the same component instance
	// is reused when navigating between two posts.
	$effect(() => {
		void page.url.pathname; // dependency: re-run on navigation

		const targets = headings
			.flatMap((heading) => [heading, ...heading.children])
			.map((heading) => document.getElementById(heading.id))
			.filter(Boolean);

		if (!targets.length) return;

		/*
		 * rootMargin explained: the top offset (-88px) clears the sticky
		 * header, so a heading counts as "reached" only once it is actually
		 * visible rather than hidden behind the bar. The bottom offset (-65%)
		 * narrows the detection band to the upper third of the viewport, which
		 * stops every heading on a short screen from matching at once.
		 */
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) activeId = entry.target.id;
				}
			},
			{ rootMargin: '-88px 0px -65% 0px' }
		);

		targets.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

{#if count >= 2}
	<details class="toc" bind:open>
		<summary tabindex={wide ? -1 : undefined}>
			<span class="title">Contents</span>
			<Chevron />
		</summary>

		<nav aria-label="Table of contents">
			<ul class="level-2">
				{#each headings as heading}
					<li class:active={heading.id === activeId}>
						<a href={`#${heading.id}`}>{heading.text}</a>

						{#if heading.children.length}
							<ul class="level-3">
								{#each heading.children as child}
									<li class:active={child.id === activeId}>
										<a href={`#${child.id}`}>{child.text}</a>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</nav>
	</details>
{/if}

<style>
	/* ---- shared ------------------------------------------------------------ */
	summary {
		cursor: pointer;
		list-style: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	summary::-webkit-details-marker {
		display: none;
	}

	/* FixIt: toc_title_font_size = 1rem, set in the body family (not mono)
	   and simply bolded — the theme has no mono/uppercase eyebrow treatment. */
	.title {
		font-size: var(--type-title);
		font-weight: 700;
		color: var(--ink);
	}

	.toc[open] :global(.chevron) {
		transform: rotate(180deg);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.level-2 {
		margin-top: 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	/* Nested entries are indented AND hang off their own rule, so the depth is
	   legible at a glance rather than inferred from a small margin. */
	.level-3 {
		margin: 0.5rem 0 0.1rem 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	li {
		font-size: var(--type-body);
		font-variant-numeric: tabular-nums;
		line-height: 1.45;
	}

	a {
		display: block;
		color: var(--muted);
		text-decoration: none;
		/* the axis-tick motif: every entry hangs off a left rule, which the
		   scrollspy then colours to mark the reader's position */
		border-left: 2px solid var(--divider);
		padding-left: 0.75rem;
		transition: color 120ms ease, border-color 120ms ease;
	}
	a:hover {
		color: var(--ink);
		border-left-color: color-mix(in srgb, var(--accent) 55%, var(--divider));
	}

	li.active > a {
		color: var(--ink);
		border-left-color: var(--accent);
	}

	/* ---- mobile / tablet: a collapsible card above the article ------------- */
	.toc {
		border: 1px solid var(--divider);
		border-radius: var(--radius-card);
		padding: 0.9rem 1.1rem;
		background: var(--tile);
		margin-bottom: 2rem;
	}

	/* ---- desktop: a sticky rail, on the same tile as code and callouts ---- */
	@media (min-width: 1100px) {
		.toc {
			margin-bottom: 0;
			/* Cap the rail and let it scroll internally: a 20-heading contents
			   list on a 13" screen would otherwise run off the bottom with no
			   way to reach the last entries. */
			max-height: calc(100vh - 8rem);
			overflow-y: auto;
		}
		summary {
			pointer-events: none; /* always open in the rail; nothing to toggle */
		}
		summary :global(.chevron) {
			display: none;
		}
	}
</style>
