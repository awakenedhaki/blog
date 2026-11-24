<script>
	/**
	 * Error page. Without this file SvelteKit serves its own unstyled fallback
	 * — a bare black-on-white "404" with no header, no navigation and no way
	 * back — which on a static host is what every mistyped URL, stale link and
	 * renamed slug lands on.
	 */
	import { page } from '$app/state';
	import { site } from '$lib/site.js';
	import { posts } from '$lib/posts.js';

	const recent = posts.slice(0, 3);
	const isMissing = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{page.status} — {site.name}</title>
	<!-- Mistyped URLs should not accumulate in search results. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<p class="meta"><span aria-hidden="true">#</span> status: {page.status}</p>
<h1>{isMissing ? 'That page is not here' : 'Something went wrong'}</h1>

<p class="lede">
	{#if isMissing}
		The address may be mistyped, or the post may have been renamed since it was
		linked.
	{:else}
		{page.error?.message ?? 'An unexpected error occurred.'}
	{/if}
</p>

<p>
	Try <a href="/blog/">all posts</a>, browse <a href="/topics/">by topic</a>, or go
	back to the <a href="/">home page</a>.
</p>

{#if recent.length}
	<h2>Recent posts</h2>
	<ul>
		{#each recent as post}
			<li><a href={`/blog/${post.slug}/`}>{post.title}</a></li>
		{/each}
	</ul>
{/if}

<style>
	h1 {
		font-size: var(--type-headline);
		margin: 0.3rem 0 0.6rem;
	}
	.lede {
		color: var(--muted);
		max-width: 46rem;
	}
	h2 {
		font-size: var(--type-title-l);
		margin-top: 2.5rem;
	}
	ul {
		padding-left: 1.2rem;
	}
	li + li {
		margin-top: 0.4rem;
	}
</style>
