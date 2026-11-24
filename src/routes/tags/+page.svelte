<script>
	/**
	 * Tag index — the landing page for the "by tag" browse axis.
	 *
	 * This route was missing: /tags/<tag> pages existed and post cards linked
	 * into them, but there was no way to see WHICH tags exist without first
	 * finding a post that used one. The dropdown's "By tag" entry needs a real
	 * destination, so this fills that hole.
	 *
	 * Presentation: a weighted cloud, sized by post count. Weighting is capped
	 * at three steps rather than scaled continuously — with a young blog the
	 * counts are small and a linear scale would make a 3-post tag look like a
	 * headline while 1-post tags became unreadably small. Three steps stays
	 * legible at every stage of the blog's life.
	 *
	 * Counterpoint worth knowing: tag clouds are a weak information display
	 * (area is hard to compare precisely). That is fine HERE, because the job
	 * is "show me roughly what this blog covers and let me click", not "rank
	 * these tags exactly" — the explicit count next to each tag covers the
	 * cases where precision actually matters.
	 */
	import { site } from '$lib/site.js';
	import { tagCounts } from '$lib/posts.js';

	const tags = tagCounts();

	// The largest count sets the top of the scale, so weighting adapts as the
	// blog grows instead of being hard-coded to today's numbers.
	const maxCount = Math.max(1, ...tags.map((t) => t.count));

	/** Bucket a tag into one of three size steps (1 = smallest, 3 = largest). */
	function sizeStep(count) {
		const ratio = count / maxCount;
		if (ratio > 0.66) return 3;
		if (ratio > 0.33) return 2;
		return 1;
	}
</script>

<svelte:head>
	<title>Tags — {site.name}</title>
	<meta name="description" content="Every tag used on {site.name}, by frequency." />
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> browse by tag</p>
<h1>Tags</h1>
<p class="lede">
	{tags.length} {tags.length === 1 ? 'tag' : 'tags'} across the archive, most used first.
</p>

<ul class="cloud">
	{#each tags as { tag, count }}
		<li>
			<a href={`/tags/${tag}/`} data-size={sizeStep(count)}>
				<span><span aria-hidden="true">#</span>{tag}</span><span class="count">{count}</span>
			</a>
		</li>
	{:else}
		<li class="empty">No tags yet — add a <code>tags:</code> list to a post's frontmatter.</li>
	{/each}
</ul>

<style>
	h1 {
		margin: 0.3rem 0 0.4rem;
	}

	.lede {
		color: var(--muted);
		margin: 0 0 1.8rem;
	}

	.cloud {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap; /* wrapping, not scrolling: no horizontal overflow */
		gap: 0.6rem;
		align-items: baseline;
	}

	.cloud a {
		display: inline-flex;
		align-items: baseline;
		gap: 0.4rem;
		font-family: var(--font-mono);
		text-decoration: none;
		color: var(--ink);
		background: var(--tile);
		border: 1px solid var(--outline);
		border-radius: var(--radius-pill);
		padding: var(--space-1) var(--space-3);
		transition: background-color 120ms ease;
	}
	.cloud a:hover {
		background: var(--tappable);
	}

	/* Three discrete weight steps (see sizeStep above). */
	.cloud a[data-size='1'] {
		font-size: var(--type-meta);
	}
	.cloud a[data-size='2'] {
		font-size: var(--type-body);
	}
	.cloud a[data-size='3'] {
		font-size: var(--type-body-l);
	}

	/* The exact count, for when relative size is not precise enough. */
	.count {
		font-size: var(--type-label);
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	.empty {
		color: var(--muted);
	}
</style>
