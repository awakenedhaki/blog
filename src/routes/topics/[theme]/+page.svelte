<script>
	/** A single topic's listing page (e.g. /topics/tutorial). */
	import { site } from '$lib/site.js';
	import { posts } from '$lib/posts.js';
	import PostCard from '$lib/components/PostCard.svelte';

	let { data } = $props();

	const matching = $derived(posts.filter((post) => post.theme === data.theme.id));
</script>

<svelte:head>
	<title>{data.theme.label} — {site.name}</title>
	<meta name="description" content={data.theme.blurb} />
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> topic · n = {matching.length} · <a href="/topics/">all topics</a></p>
<h1>{data.theme.label}</h1>
<p class="blurb">{data.theme.blurb}</p>

{#if matching.length}
	{#each matching as post}
		<PostCard {post} />
	{/each}
{:else}
	<p>Nothing published under this topic yet — it's on the way.</p>
{/if}

<style>
	h1 {
		margin: 0.3rem 0 0.4rem;
	}
	.blurb {
		color: var(--muted);
		margin: 0 0 1rem;
	}
</style>
