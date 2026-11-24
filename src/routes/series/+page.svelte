<script>
	/** Series index: every ordered multi-part project on the blog. */
	import { site, series } from '$lib/site.js';
	import { seriesPosts } from '$lib/posts.js';
</script>

<svelte:head>
	<title>Series — {site.name}</title>
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> ordered, multi-part projects</p>
<h1>Series</h1>

{#each series as s}
	{@const parts = seriesPosts(s.id)}
	<a class="card" href={`/series/${s.id}/`}>
		<p class="meta">{parts.length} {parts.length === 1 ? 'part' : 'parts'}</p>
		<h2>{s.title}</h2>
		<p class="blurb">{s.blurb}</p>
	</a>
{:else}
	<p>No series yet — define one in <code>src/lib/site.js</code> and tag posts with it.</p>
{/each}

<style>
	h1 {
		margin: 0.3rem 0 1.4rem;
	}
	.card {
		display: block;
		background: var(--tile);
		border: 1px solid var(--outline);
		border-radius: var(--radius-card);
		padding: var(--space-4) var(--space-5);
		margin-bottom: var(--space-4);
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
		color: var(--muted);
		font-size: var(--type-body);
	}
</style>
