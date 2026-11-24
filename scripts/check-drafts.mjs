#!/usr/bin/env node
/**
 * Build guard: refuse to build if an unpublished post is sitting in src/posts.
 *
 * Why this exists rather than trusting `published: false`:
 *
 * `published: false` removes a post from listings, from the search index, and
 * (since the entries() fix) from the prerendered routes. What it CANNOT do is
 * keep the text out of the JavaScript bundle. lib/search.js reads post bodies
 * with an EAGER `import.meta.glob(..., { query: '?raw' })`, which Vite inlines
 * as string literals at build time. The filtering happens afterwards, at
 * runtime, so the unused strings are still in the chunk — dynamic property
 * access defeats tree-shaking. Draft prose ends up shipped and readable by
 * anyone who opens the bundle, even though no page links to it.
 *
 * The only robust fix is to keep drafts out of the directory Vite scans.
 * That is what `content/` and `npm run sync` are for; this script is the
 * backstop that makes forgetting impossible rather than merely unlikely.
 *
 * Runs automatically via the `prebuild` npm lifecycle hook.
 */
import { isDraft, listPosts } from './posts.mjs';

const POSTS_DIR = 'src/posts';

const posts = await listPosts(POSTS_DIR);

// Collect every offender before reporting, so one run fixes every problem
// rather than surfacing them one build at a time.
const drafts = [];
for (const post of posts) {
	if (await isDraft(post.file)) drafts.push(post.slug);
}

if (drafts.length) {
	console.error('\n  Build stopped: unpublished posts found in ' + POSTS_DIR + '\n');
	for (const name of drafts) console.error(`    - ${name}`);
	console.error(
		'\n  Their text would be inlined into the JS bundle and shipped, even\n' +
			'  though no page links to them.\n\n' +
			'  Fix: keep drafts in content/posts/ and run `npm run sync` (which\n' +
			'  copies published posts only). To preview drafts locally use\n' +
			'  `npm run sync:drafts` then `npm run dev` — never `npm run build`.\n'
	);
	process.exit(1);
}

console.log(`  drafts check: ${posts.length} post(s) in ${POSTS_DIR}, none unpublished`);
