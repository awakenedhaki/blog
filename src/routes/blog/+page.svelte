<script>
	/**
	 * The full chronological archive. Filtering now lives on dedicated,
	 * prerendered pages — /topics/<id> and /tags/<tag> — which are shareable
	 * URLs and better for SEO than the old query-string filters, so this page
	 * stays deliberately simple: every post, newest first.
	 */
	import { site } from '$lib/site.js';
	import { posts } from '$lib/posts.js';
	import PostCard from '$lib/components/PostCard.svelte';
</script>

<svelte:head>
	<title>Posts — {site.name}</title>
	<meta name="description" content={site.description} />
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> all posts · n = {posts.length} · <a href="/topics/">browse by topic</a> · <a href="/series/">series</a> · press <code>/</code> to search</p>
<h1>Posts</h1>

{#each posts as post}
	<PostCard {post} />
{/each}

<style>
	h1 {
		margin: 0.3rem 0 0.6rem;
	}
</style>
