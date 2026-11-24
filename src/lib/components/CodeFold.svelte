<script>
	/**
	 * CodeFold — collapse code that's useful but not essential to keep on
	 * screen, e.g. the chunk that generated a figure. The same idea as
	 * R Markdown's `code_folding: hide`, so it will feel familiar to readers
	 * coming from Rmd/Quarto.
	 *
	 * Usage (works around a single fence OR a whole <CodeTabs> block —
	 * keep the blank lines, as with every component in mdsvex):
	 *
	 *   <CodeFold title="Show the code that made this figure">
	 *
	 *   <CodeTabs labels={['R', 'Python']}>
	 *   ...fences...
	 *   </CodeTabs>
	 *
	 *   </CodeFold>
	 *
	 * Props
	 *   title : the summary line (default "Show the code")
	 *   open  : start expanded? default false — collapsed is the point.
	 *
	 * Like Callout, this is built on native <details>: keyboard- and
	 * screen-reader-accessible, and the code stays in the prerendered HTML, so
	 * it remains findable by browser Ctrl-F and search engines even while
	 * visually collapsed.
	 */
	let { title = 'Show the code', open = false, children } = $props();
</script>

<details class="codefold" {open}>
	<summary><span class="marker">&lt;/&gt;</span>{title}</summary>
	<div class="content">
		{@render children?.()}
	</div>
</details>

<style>
	.codefold {
		margin: 1.75rem 0;
	}

	summary {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 40px;
		cursor: pointer;
		font-size: var(--type-label-l);
		font-weight: 600;
		letter-spacing: var(--tracking-label-l);
		color: var(--ink);
		border: 1px solid var(--outline);
		border-radius: var(--radius-pill);
		padding: 0 var(--space-4);
		list-style: none;
		transition: background-color 120ms ease;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover {
		background: var(--tappable);
	}

	.marker {
		font-family: var(--font-mono);
		color: var(--muted);
	}

	/* collapse the inner block's own top margin so it tucks under the summary */
	.content > :global(*:first-child) {
		margin-top: 0.6rem !important;
	}
</style>
