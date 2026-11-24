<script>
	/**
	 * Article view.
	 *
	 * Layout: on wide screens, a two-column grid — prose plus a sticky table
	 * of contents in the right rail. On phones, the grid collapses and the
	 * TOC renders first as a collapsible "contents" block (it's placed first
	 * in the DOM so keyboard/screen-reader order matches the visual order).
	 *
	 * Series posts additionally get a banner under the header ("part i of n")
	 * and a previous/next pager at the foot, before the share row.
	 */
	import { page } from '$app/state';
	import { themeLabel, site } from '$lib/site.js';
	import { formatDate } from '$lib/posts.js';
	import ShareLinks from '$lib/components/ShareLinks.svelte';
	import SeriesNav from '$lib/components/SeriesNav.svelte';
	import Toc from '$lib/components/Toc.svelte';

	let { data } = $props();

	const Content = $derived(data.content);
	const meta = $derived(data.meta);

	// Frontmatter + slug: what SeriesNav and the share links need.
	const path = $derived(`/blog/${page.params.slug}/`);
	const postRef = $derived({ ...meta, slug: page.params.slug });

	/*
	 * Headings are extracted from the Markdown tree at build time and travel
	 * in frontmatter, so the contents list is prerendered rather than
	 * assembled in the browser. `?? []` guards posts compiled before the
	 * remark plugin existed, which would otherwise throw on `.reduce`.
	 */
	const headings = $derived(meta.headings ?? []);

	// Show the TOC unless the author opted out, and only when there is enough
	// structure for it to be useful.
	const showToc = $derived(meta.toc !== false && headings.length > 0);
</script>

<svelte:head>
	<title>{meta.title} — {site.name}</title>
	{#if meta.description}
		<meta name="description" content={meta.description} />
	{/if}
</svelte:head>

<div class="layout" class:with-toc={showToc}>
	{#if showToc}
		<aside>
			<Toc {headings} />
		</aside>
	{/if}

	<article class="prose">
		<header>
			<p class="meta">
				<span aria-hidden="true">#</span> {formatDate(meta.date)} · filed under
				<a class="topic" href={`/topics/${meta.theme}/`}>{themeLabel(meta.theme)}</a>
			</p>
			<h1>{meta.title}</h1>
			{#if meta.description}
				<p class="lede">{meta.description}</p>
			{/if}
			{#if meta.tags?.length}
				<p class="meta tags">
					{#each meta.tags as tag}
						<a href={`/tags/${tag}/`}><span aria-hidden="true">#</span>{tag}</a>
					{/each}
				</p>
			{/if}
		</header>

		<SeriesNav post={postRef} position="top" />

		<Content />

		<footer>
			<SeriesNav post={postRef} position="bottom" />
			<div class="share-row">
				<ShareLinks title={meta.title} {path} />
			</div>
		</footer>
	</article>
</div>

<style>
	/* Mobile-first: one column, TOC block above the article. */
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr); /* minmax(0,…) lets code blocks shrink */
		gap: 1.5rem;
	}

	/* Wide screens: content on the left, sticky TOC rail on the right.

	   `1fr` for the content column, NOT a fixed width: the content absorbs
	   whatever the capped container leaves after the fixed-width rail (53rem
	   at full width; the article itself keeps to the 48rem measure inside
	   it, so the rail stays on the site's right edge). A fixed column here
	   would reintroduce the exact failure this layout had before — a grid
	   wider than its container, silently shrunk by the browser.

	   Breakpoint raised 1080 -> 1100 to match Toc.svelte's own media query;
	   the two disagreeing by 20px meant a sliver of widths where the rail was
	   laid out as a sidebar but still styled as a collapsible card. */
	@media (min-width: 1100px) {
		.layout.with-toc {
			grid-template-columns: minmax(0, 1fr) var(--rail);
			gap: var(--gutter);
		}
		aside {
			order: 2; /* visually right, while staying first for mobile DOM order */
			position: relative;
		}
		aside > :global(*) {
			position: sticky;
			top: 6.5rem;
		}
	}

	header {
		margin-bottom: 2.6rem;   /* was 1.6rem */
		padding-bottom: 1.6rem;
		border-bottom: 1px solid var(--divider);
	}

	h1 {
		font-size: var(--type-headline-l);
		margin: 0.5rem 0 0.8rem;
		line-height: 1.15;
	}

	.topic {
		color: var(--muted);
		text-decoration: none;
	}
	.topic:hover {
		text-decoration-line: underline;
	}

	.lede {
		font-size: var(--type-body-l);
		color: var(--muted);
		margin: 0 0 1rem;
		max-width: var(--measure);
	}

	.tags {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
		margin: 0;
	}
	.tags a {
		text-decoration: none;
		color: var(--muted);
	}
	.tags a:hover {
		color: var(--ink);
		text-decoration-line: underline;
	}

	footer {
		margin-top: 2.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--divider);
	}
	.share-row {
		margin-top: 1.4rem;
	}
</style>
