<script>
	/**
	 * SeriesNav — connects the parts of a series on the article page.
	 *
	 * Two placements, one component:
	 *   position="top"    -> a slim banner under the article header:
	 *                        "Part 2 of 3 in Penguins, end to end"
	 *   position="bottom" -> previous/next cards + a link to the series page,
	 *                        so finishing one part flows straight into the next.
	 *
	 * Renders nothing for posts that aren't in a (registered) series, so the
	 * article template can include it unconditionally.
	 *
	 * Props: `post` — an object with at least { slug, series } (the article
	 * page passes its frontmatter merged with the slug).
	 */
	import { seriesInfo } from '$lib/posts.js';

	let { post, position = 'top' } = $props();

	const info = $derived(seriesInfo(post));
</script>

{#if info}
	{#if position === 'top'}
		<p class="banner meta">
			# series · part {info.index + 1} of {info.parts.length} in
			<a href={`/series/${info.def.id}/`}>{info.def.title}</a>
		</p>
	{:else}
		<nav class="pager" aria-label="Series navigation">
			{#if info.prev}
				<a class="card prev" href={`/blog/${info.prev.slug}/`}>
					<span class="meta">← part {info.index}</span>
					<span class="title">{info.prev.title}</span>
				</a>
			{:else}
				<span class="spacer" aria-hidden="true"></span>
			{/if}

			{#if info.next}
				<a class="card next" href={`/blog/${info.next.slug}/`}>
					<span class="meta">part {info.index + 2} →</span>
					<span class="title">{info.next.title}</span>
				</a>
			{:else}
				<a class="card next done" href={`/series/${info.def.id}/`}>
					<span class="meta">series complete ✓</span>
					<span class="title">Revisit {info.def.title}</span>
				</a>
			{/if}
		</nav>
		<p class="meta all"><a href={`/series/${info.def.id}/`}>All parts of {info.def.title} →</a></p>
	{/if}
{/if}

<style>
	.banner {
		margin: 0 0 1.4rem;
		border: 1px solid var(--divider);
		border-left: 3px solid var(--accent);
		border-radius: var(--radius-card);
		background: var(--tile);
		padding: 0.55rem 0.9rem;
	}
	.banner a {
		color: var(--ink);
		text-decoration: none;
	}
	.banner a:hover {
		text-decoration-line: underline;
	}

	.pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.8rem;
		margin-top: 1.4rem;
	}
	@media (max-width: 560px) {
		.pager {
			grid-template-columns: 1fr; /* stack on phones — no squeezing */
		}
		.spacer {
			display: none;
		}
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		border: 1px solid var(--outline);
		border-radius: var(--radius-card);
		background: var(--tile);
		padding: var(--space-3) var(--space-4);
		text-decoration: none;
		color: var(--ink);
		transition: background-color 120ms ease;
	}
	.card:hover {
		background: var(--tappable);
	}
	.next {
		text-align: right;
		align-items: flex-end;
	}
	.title {
		font-weight: 500;
		font-size: var(--type-body);
	}

	.all {
		margin-top: 0.7rem;
	}
	.all a {
		text-decoration: none;
		color: var(--muted);
	}
	.all a:hover {
		text-decoration-line: underline;
	}
</style>
