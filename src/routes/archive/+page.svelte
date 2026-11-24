<script>
	/**
	 * Archive — every published post grouped by year of publication.
	 *
	 * This is the fourth browse axis (alongside category, series and tag) and
	 * the only one that is exhaustive: every post appears exactly once, which
	 * makes it the page to reach for when you know roughly WHEN you wrote
	 * something but not what you filed it under.
	 *
	 * Design choice: a dense one-line-per-post list rather than the PostCard
	 * used elsewhere. Cards are for browsing and invite reading a description;
	 * an archive is for FINDING, so the year and title carry it and everything
	 * else is stripped. Counterpoint: this sacrifices the tag links that cards
	 * offer — acceptable, because /tags exists for exactly that job.
	 */
	import { site } from '$lib/site.js';
	import { postsByYear, formatDate, machineDate } from '$lib/posts.js';
	import { themeLabel, seriesById } from '$lib/site.js';

	// Computed once at module scope: the post set is fixed at build time.
	const years = postsByYear();
	const total = years.reduce((sum, group) => sum + group.posts.length, 0);
</script>

<svelte:head>
	<title>Archive — {site.name}</title>
	<meta name="description" content="Every article on {site.name}, by year of publication." />
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> browse by year</p>
<h1>Archive</h1>
<p class="lede">{total} {total === 1 ? 'article' : 'articles'}, newest first.</p>

{#each years as group}
	<section>
		<!-- The year is a heading, not decoration, so the page outlines
		     correctly for screen readers and in-page search. -->
		<h2 id={`y${group.year}`}>
			{group.year}
			<span class="count meta">n = {group.posts.length}</span>
		</h2>

		<ul>
			{#each group.posts as post}
				<li>
					<time class="meta" datetime={machineDate(post.date)}>{formatDate(post.date)}</time>
					<a class="title" href={`/blog/${post.slug}/`}>{post.title}</a>
					<span class="meta filed">
						{themeLabel(post.theme)}{#if post.series && seriesById(post.series)} · {seriesById(post.series).title}, pt. {post.part}{/if}
					</span>
				</li>
			{/each}
		</ul>
	</section>
{:else}
	<p>No published articles yet.</p>
{/each}

<style>
	h1 {
		margin: 0.3rem 0 0.4rem;
	}

	.lede {
		color: var(--muted);
		margin: 0 0 2rem;
	}

	section {
		margin-bottom: 2.4rem;
	}

	h2 {
		font-family: var(--font-mono);
		font-size: var(--type-title-l);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--divider); /* the chart-axis motif */
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.count {
		font-weight: 400;
	}

	ul {
		list-style: none;
		margin: 0.9rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	/* Desktop: a three-column grid so dates and titles align down the page
	   like a table — the whole point of an archive is fast visual scanning. */
	li {
		display: grid;
		grid-template-columns: 6.5rem minmax(0, 1fr) auto;
		gap: 0.9rem;
		align-items: baseline;
	}

	time {
		white-space: nowrap;
	}

	.title {
		color: var(--ink);
		text-decoration: none;
	}
	.title:hover {
		text-decoration-line: underline;
	}

	.filed {
		color: var(--muted);
		text-align: right;
		white-space: nowrap;
	}

	/* Phones: the three columns cannot coexist at 360px without truncating
	   titles, so stack them. The title leads because it is what you scan for;
	   date and filing drop to a single secondary line beneath it. */
	@media (max-width: 640px) {
		li {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.15rem;
		}
		.title {
			order: -1; /* title first, metadata after */
			font-size: var(--type-body-l);
		}
		.filed {
			text-align: left;
			white-space: normal;
		}
	}
</style>
