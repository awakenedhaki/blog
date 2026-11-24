import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { posts } from '$lib/posts.js';

/*
 * Loads ONE post's compiled component on demand. The index pages only ship
 * metadata; the article body is code-split per post, so reading one article
 * never downloads the others.
 */
const modules = import.meta.glob('/src/posts/*/index.md');

export async function load({ params }) {
	// Each post is a folder named by its slug (scripts/posts.mjs).
	const path = `/src/posts/${params.slug}/index.md`;
	const loader = modules[path];

	// Unknown slug -> a proper 404 rather than a blank page.
	if (!loader) error(404, `No post called "${params.slug}"`);

	const mod = await loader();

	/*
	 * Drafts are readable while writing, invisible once deployed.
	 *
	 * In `dev` an unpublished post loads normally, so you can preview a draft
	 * at its real URL with the real layout. In a production build the same
	 * post 404s. Without this check a draft would be served to anyone who
	 * guessed the slug — `published: false` only ever removed it from the
	 * LISTINGS, never from the route itself.
	 */
	if (!dev && mod.metadata?.published === false) {
		error(404, `No post called "${params.slug}"`);
	}

	return {
		content: mod.default, // the compiled article component
		meta: mod.metadata // the frontmatter (title, date, theme, tags, ...)
	};
}

/*
 * Tells the prerenderer which /blog/<slug> pages to emit.
 *
 * Derived from `posts` — the already-published-filtered list — rather than
 * from the raw module keys. Using the raw keys had two consequences, both bad:
 *
 *   1. Every draft was written to build/ as real HTML and shipped.
 *   2. It CRASHED the build. A draft's tags are absent from `allTags` (which
 *      counts published posts only), so the draft page linked to a /tags/<tag>
 *      route that was never generated, and the prerenderer aborted on the 404.
 *
 * Sourcing both the entry list and the listings from one filtered array means
 * they cannot disagree again.
 */
export function entries() {
	return posts.map((post) => ({ slug: post.slug }));
}
