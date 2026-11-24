<script>
	/**
	 * CodeTabs — show the same task in several languages, one visible at a time.
	 *
	 * Usage inside a post (blank lines around the fences are REQUIRED — that is
	 * how Markdown-inside-components works in mdsvex):
	 *
	 *   <CodeTabs labels={['Python', 'R']}>
	 *
	 *   ```python
	 *   df.groupby("site").mean()
	 *   ```
	 *
	 *   ```r
	 *   df |> summarise(across(everything(), mean), .by = site)
	 *   ```
	 *
	 *   </CodeTabs>
	 *
	 * How it works: mdsvex has already highlighted each fence and wrapped it in
	 * a `<div class="code-block" data-language="...">`. After mount, this
	 * component finds those child blocks, builds one tab per block, and toggles
	 * which block is visible. `labels` is optional — when omitted, the tab text
	 * falls back to each block's data-language (e.g. "python", "r").
	 *
	 * Switching language is animated, briefly and only when the reader asks:
	 * the accent pill slides to the chosen tab, the box eases to the new
	 * block's height and the new block fades in, all within 200ms. Under
	 * "reduce motion" the switch is instant.
	 *
	 * Nuance: before JavaScript hydrates, CSS shows only the FIRST block. The
	 * alternative (show all blocks stacked) avoids hiding content from no-JS
	 * readers but causes a visible layout jump on every page load; for a blog
	 * audience the first-block default is the better trade.
	 */
	let { labels = [], children } = $props();

	const uid = $props.id(); // stable across server and client, for the ARIA ids
	const tabId = (i) => `${uid}-tab-${i}`;
	const panelId = (i) => `${uid}-panel-${i}`;

	const SWITCH_MS = 200;

	let tablist = $state(null); // the row of tab buttons
	let body = $state(null); // the container holding the highlighted blocks
	let blocks = $state([]); // the .code-block elements found inside it
	let active = $state(0); // index of the currently visible block

	// The sliding pill behind the chosen tab: its box, measured from the
	// button, and whether it has been placed once (so it doesn't slide in from
	// the corner on first paint).
	let thumb = $state(null);
	let thumbReady = $state(false);

	// Tab captions: explicit `labels` prop wins; otherwise read data-language.
	const tabLabels = $derived(
		labels.length ? labels : blocks.map((el) => el.dataset.language ?? 'code')
	);

	// Step 1 (on mount): discover the highlighted blocks rendered by mdsvex.
	$effect(() => {
		if (body) blocks = [...body.querySelectorAll('.code-block')];
	});

	// Step 2: each block is a tab panel, named by its tab. Only done when
	// there are tabs to name it (a single block renders no tab row).
	$effect(() => {
		if (blocks.length < 2) return;
		blocks.forEach((el, i) => {
			el.id = panelId(i);
			el.setAttribute('role', 'tabpanel');
			el.setAttribute('aria-labelledby', tabId(i));
		});
	});

	// Step 3: show only the active block. Inline styles win over the
	// stylesheet's pre-hydration "first block only" default.
	function showActive() {
		blocks.forEach((el, i) => (el.style.display = i === active ? 'block' : 'none'));
	}
	$effect(showActive);

	// Step 4: keep the pill under the chosen tab, including when the row
	// wraps or the column resizes.
	function placeThumb() {
		const button = tablist?.querySelectorAll('[role="tab"]')[active];
		if (!button) return;
		thumb = {
			x: button.offsetLeft,
			y: button.offsetTop,
			w: button.offsetWidth,
			h: button.offsetHeight
		};
	}
	$effect(() => {
		void active;
		placeThumb();
	});
	$effect(() => {
		if (!tablist) return;
		const observer = new ResizeObserver(placeThumb);
		observer.observe(tablist);
		requestAnimationFrame(() => (thumbReady = true));
		return () => observer.disconnect();
	});

	function select(i) {
		if (i === active || !body) return;
		const from = body.offsetHeight;
		active = i;
		showActive();

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const to = body.offsetHeight;
		if (from !== to) {
			// Clip only while the height eases, so focus rings are never cut.
			body.style.overflow = 'hidden';
			body
				.animate([{ height: `${from}px` }, { height: `${to}px` }], {
					duration: SWITCH_MS,
					easing: 'ease-out'
				})
				.finished.finally(() => (body.style.overflow = ''));
		}
		blocks[i].animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: SWITCH_MS * 0.75,
			easing: 'ease-out'
		});
	}

	// Roving keyboard support: ←/→ move between tabs, Home and End jump to the
	// ends, and focus moves with the selection so the next key acts on the
	// tab the reader can see is chosen.
	function onKeydown(event) {
		const last = blocks.length - 1;
		const next = {
			ArrowRight: active === last ? 0 : active + 1,
			ArrowLeft: active === 0 ? last : active - 1,
			Home: 0,
			End: last
		}[event.key];
		if (next === undefined) return;
		event.preventDefault();
		select(next);
		tablist?.querySelectorAll('[role="tab"]')[next]?.focus();
	}
</script>

<div class="codetabs">
	{#if blocks.length > 1}
		<div
			class="tabs"
			class:has-thumb={thumb}
			role="tablist"
			tabindex="-1"
			aria-label="Code language"
			onkeydown={onKeydown}
			bind:this={tablist}
		>
			{#if thumb}
				<span
					class="thumb"
					class:ready={thumbReady}
					aria-hidden="true"
					style="width: {thumb.w}px; height: {thumb.h}px; transform: translate({thumb.x}px, {thumb.y}px)"
				></span>
			{/if}
			{#each tabLabels as label, i}
				<button
					type="button"
					role="tab"
					id={tabId(i)}
					aria-controls={panelId(i)}
					aria-selected={i === active}
					tabindex={i === active ? 0 : -1}
					onclick={() => select(i)}
				>
					{label}
				</button>
			{/each}
		</div>
	{/if}

	<div class="body" bind:this={body}>
		{@render children?.()}
	</div>
</div>

<style>
	.codetabs {
		margin: 1.75rem 0;
	}

	/* The studio's segmented control: one outlined pill holding the
	   languages, the chosen one filled with the accent. */
	.tabs {
		display: inline-flex;
		flex-wrap: wrap; /* long label sets wrap on phones instead of side-scrolling */
		gap: var(--space-1);
		margin-bottom: var(--space-2);
		padding: 2px;
		border: 1px solid var(--outline);
		border-radius: var(--radius-pill);
		position: relative; /* the thumb and the buttons' offsets are measured from here */
	}

	/* The accent pill behind the chosen tab. It only slides once it has been
	   placed, so the first paint has it already in position. */
	.thumb {
		position: absolute;
		top: 0;
		left: 0;
		border-radius: var(--radius-pill);
		background: var(--accent);
		pointer-events: none;
	}
	.thumb.ready {
		transition:
			transform 200ms ease-out,
			width 200ms ease-out,
			height 200ms ease-out;
	}

	.tabs button {
		min-width: 40px;
		min-height: 40px;
		padding: 0 var(--space-4);
		font-family: var(--font-body);
		font-size: var(--type-label-l);
		font-weight: 600;
		letter-spacing: var(--tracking-label-l);
		color: var(--ink);
		background: transparent;
		border: none;
		border-radius: var(--radius-pill);
		cursor: pointer;
		position: relative; /* above the thumb */
		transition: color 200ms ease-out;
	}

	.tabs button:hover {
		background: var(--tappable);
	}

	/* Before the thumb is measured (and without JS there is no tab row at
	   all), the chosen tab fills itself. */
	.tabs button[aria-selected='true'] {
		color: var(--on-accent);
		background: var(--accent);
	}
	.tabs.has-thumb button[aria-selected='true'] {
		background: transparent;
	}

	/* Collapse the blocks' own margins inside the tab body. */
	.body :global(.code-block) {
		margin: 0;
	}

	/* Pre-hydration default: only the first block is visible (the effect above
	   takes over with inline styles once JavaScript loads). */
	.body :global(.code-block:not(:first-child)) {
		display: none;
	}

	/* The tab itself names the language, so drop the per-block corner chip. */
	.body :global(.code-block)::after {
		display: none;
	}

	/* Last, so it wins over the transitions above: under reduced motion they
	   are off, not merely shortened (the global rule in app.css only
	   shortens). */
	@media (prefers-reduced-motion: reduce) {
		.thumb.ready,
		.tabs button {
			transition: none;
		}
	}
</style>
