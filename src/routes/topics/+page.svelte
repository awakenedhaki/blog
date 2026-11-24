<script>
	/**
	 * Topics index — the navigation hub between tutorials, opinions, analyses…
	 * One card per theme, with a live post count, linking to that topic's own
	 * prerendered page at /topics/<id>.
	 */
	import { site, themes, series } from '$lib/site.js';
	import { posts, seriesPosts } from '$lib/posts.js';

	// Count posts per theme once; cards render the number as a "n = …" stat.
	const countFor = (id) => posts.filter((post) => post.theme === id).length;
</script>

<svelte:head>
	<title>Topics — {site.name}</title>
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> browse by topic</p>
<h1>Topics</h1>

<div class="grid">
	{#each themes as t}
		<a class="card" href={`/topics/${t.id}/`}>
			<p class="meta">n = {countFor(t.id)}</p>
			<h2>{t.label}</h2>
			<p class="blurb">{t.blurb}</p>
		</a>
	{/each}
</div>

{#if series.length}
	<p class="meta series-line">
		<span aria-hidden="true">#</span> ongoing series:
		{#each series as s, i}{i ? ' · ' : ''}<a href={`/series/${s.id}/`}>{s.title}</a> ({seriesPosts(s.id).length} parts){/each}
		— <a href="/series/">all series</a>
	</p>
{/if}

<style>
	.series-line {
		margin-top: 1.6rem;
	}
	.series-line a {
		color: var(--ink);
		text-decoration: none;
	}
	.series-line a:hover {
		text-decoration-line: underline;
	}

	h1 {
		margin: 0.3rem 0 1.6rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 1rem;
	}

	.card {
		display: block;
		background: var(--tile);
		border: 1px solid var(--outline);
		border-radius: var(--radius-card);
		padding: var(--space-4) var(--space-5);
		text-decoration: none;
		color: var(--ink);
		transition: background-color 120ms ease;
	}
	.card:hover {
		background: var(--tappable);
	}

	.card h2 {
		font-size: var(--type-title-l);
		margin: 0.3rem 0 0.4rem;
	}

	.blurb {
		margin: 0;
		font-size: var(--type-body);
		color: var(--muted);
	}
</style>
