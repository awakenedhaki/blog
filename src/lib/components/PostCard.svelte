<script>
	/**
	 * PostCard — one entry in a post listing.
	 * The metadata line is set like a code comment (`# date · theme`), and the
	 * theme/tags link straight into the corresponding /blog filter.
	 */
	import { themeLabel, seriesById } from '$lib/site.js';
	import { formatDate } from '$lib/posts.js';

	let { post } = $props();
</script>

<article>
	<p class="meta">
		<span aria-hidden="true">#</span> {formatDate(post.date)} ·
		<a class="theme" href={`/topics/${post.theme}/`}>{themeLabel(post.theme)}</a>
		{#if post.series && seriesById(post.series)}
			· <a class="series" href={`/series/${post.series}/`}>{seriesById(post.series).title}, pt. {post.part}</a>
		{/if}
	</p>
	<h3><a href={`/blog/${post.slug}/`}>{post.title}</a></h3>
	{#if post.description}
		<p class="desc">{post.description}</p>
	{/if}
	{#if post.tags?.length}
		<p class="meta tags">
			{#each post.tags as tag}
				<a href={`/tags/${tag}/`}><span aria-hidden="true">#</span>{tag}</a>
			{/each}
		</p>
	{/if}
</article>

<style>
	article {
		padding-block: 1.4rem;
		border-bottom: 1px solid var(--divider);
	}

	h3 {
		margin: 0.3rem 0 0.4rem;
		font-size: var(--type-title-l);
	}
	h3 a {
		color: var(--ink);
		text-decoration: none;
	}
	h3 a:hover {
		text-decoration-line: underline;
	}

	.theme {
		color: var(--muted);
		text-decoration: none;
	}
	.theme:hover {
		text-decoration-line: underline;
	}

	.series {
		color: var(--muted);
		text-decoration: none;
	}
	.series:hover {
		text-decoration-line: underline;
	}

	.desc {
		margin: 0;
		color: var(--muted);
		max-width: var(--measure);
	}

	.tags {
		margin-top: 0.5rem;
		display: flex;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.tags a {
		color: var(--muted);
		text-decoration: none;
	}
	.tags a:hover {
		color: var(--ink);
		text-decoration-line: underline;
	}
</style>
