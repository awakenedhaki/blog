<script>
	/**
	 * Tag listing page (e.g. /tags/python): every article sharing this tag.
	 * This is the destination of every clickable tag chip across the site.
	 */
	import { site } from '$lib/site.js';
	import { posts, allTags } from '$lib/posts.js';
	import PostCard from '$lib/components/PostCard.svelte';

	let { data } = $props();

	const matching = $derived(posts.filter((post) => (post.tags ?? []).includes(data.tag)));
	const otherTags = $derived(allTags().filter((tag) => tag !== data.tag));
</script>

<svelte:head>
	<title>#{data.tag} — {site.name}</title>
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> tag · n = {matching.length}</p>
<h1><span aria-hidden="true">#</span>{data.tag}</h1>

{#each matching as post}
	<PostCard {post} />
{/each}

{#if otherTags.length}
	<p class="meta other"><span aria-hidden="true">#</span> other tags:
		{#each otherTags as tag, i}{i ? ' ' : ''}<a href={`/tags/${tag}/`}><span aria-hidden="true">#</span>{tag}</a>{/each}
	</p>
{/if}

<style>
	h1 {
		margin: 0.3rem 0 0.6rem;
		font-family: var(--font-mono);
		font-weight: 500;
	}
	.other {
		margin-top: 2rem;
	}
	.other a {
		text-decoration: none;
		color: var(--muted);
	}
	.other a:hover {
		text-decoration-line: underline;
	}
</style>
