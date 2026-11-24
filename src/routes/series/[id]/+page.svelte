<script>
	/**
	 * A single series page: the project's description and its parts as a
	 * NUMBERED list — one of the few places numbering is the honest choice,
	 * because reading order genuinely carries information here.
	 */
	import { site } from '$lib/site.js';
	import { seriesPosts, formatDate } from '$lib/posts.js';

	let { data } = $props();

	const parts = $derived(seriesPosts(data.def.id));
</script>

<svelte:head>
	<title>{data.def.title} — {site.name}</title>
	<meta name="description" content={data.def.blurb} />
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> series · {parts.length} parts · <a href="/series/">all series</a></p>
<h1>{data.def.title}</h1>
<p class="blurb">{data.def.blurb}</p>

<ol>
	{#each parts as part, i}
		<li>
			<span class="num meta">{String(i + 1).padStart(2, '0')}</span>
			<div>
				<a class="title" href={`/blog/${part.slug}/`}>{part.title}</a>
				{#if part.description}<p class="desc">{part.description}</p>{/if}
				<p class="meta"><span aria-hidden="true">#</span> {formatDate(part.date)}</p>
			</div>
		</li>
	{/each}
</ol>

<style>
	h1 {
		margin: 0.3rem 0 0.4rem;
	}
	.blurb {
		color: var(--muted);
		margin: 0 0 1.6rem;
		max-width: var(--measure);
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		display: flex;
		gap: 1rem;
		padding: 1.1rem 0;
		border-bottom: 1px solid var(--divider);
	}
	.num {
		color: var(--muted);
		padding-top: 0.2rem;
	}
	.title {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: var(--type-title-l);
		color: var(--ink);
		text-decoration: none;
	}
	.title:hover {
		text-decoration-line: underline;
	}
	.desc {
		margin: 0.25rem 0 0.3rem;
		color: var(--muted);
		max-width: var(--measure);
	}
</style>
