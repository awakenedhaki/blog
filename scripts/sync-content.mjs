#!/usr/bin/env node
/**
 * Copy posts from the content source into src/posts, filtering by status.
 *
 *   npm run sync           published posts only  (safe to build and deploy)
 *   npm run sync:drafts    everything, including drafts  (LOCAL PREVIEW ONLY)
 *
 * The content source defaults to ./content/posts and can be pointed anywhere
 * with BLOG_CONTENT_DIR, which is what makes a separate content repository
 * work — see WRITING.md.
 *
 * Design notes:
 *
 * - src/posts is treated as a BUILD ARTEFACT, not a source of truth. The sync
 *   clears it first, so deleting a post upstream actually deletes it here
 *   instead of leaving an orphan that keeps getting published.
 * - A post is a folder: index.md plus its figures (see scripts/posts.mjs).
 *   The whole folder is copied, so a post can never arrive without its
 *   images, and a draft's figures stay out of the build with it.
 * - The script is deliberately dumb: copy, filter, report. Anything cleverer
 *   (merging, three-way diffs) would make src/posts something you could edit
 *   by hand, which is exactly the ambiguity this is meant to remove.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isDraft, listPosts } from './posts.mjs';

const CONTENT_DIR = process.env.BLOG_CONTENT_DIR ?? 'content';
const SRC_POSTS = 'src/posts';
// The pre-folder layout kept figures here; remove it if a sync finds it.
const OLD_SRC_FIGURES = 'src/figures';

const includeDrafts = process.argv.includes('--drafts');

const postsSrc = join(CONTENT_DIR, 'posts');
if (!existsSync(postsSrc)) {
	console.error(`\n  No content directory at ${postsSrc}\n`);
	console.error('  Either create it, or point BLOG_CONTENT_DIR at your content repo:');
	console.error('    BLOG_CONTENT_DIR=../blog-content npm run sync\n');
	process.exit(1);
}

// Clear first: src/posts mirrors the content repo exactly, never accumulates.
await rm(SRC_POSTS, { recursive: true, force: true });
await rm(OLD_SRC_FIGURES, { recursive: true, force: true });
await mkdir(SRC_POSTS, { recursive: true });

const copied = [];
const skipped = [];

for (const post of await listPosts(postsSrc)) {
	const draft = await isDraft(post.file);
	if (draft && !includeDrafts) {
		skipped.push(post.slug);
		continue;
	}
	await cp(post.dir, join(SRC_POSTS, post.slug), { recursive: true });
	copied.push(draft ? `${post.slug}  (draft)` : post.slug);
}

console.log(`\n  synced from ${CONTENT_DIR}`);
for (const name of copied) console.log(`    + ${name}`);
for (const name of skipped) console.log(`    - ${name}  (draft, held back)`);

if (includeDrafts && copied.some((n) => n.includes('(draft)'))) {
	console.log(
		'\n  Drafts are now in src/posts. `npm run build` will REFUSE to run\n' +
			'  until you re-sync without --drafts. That is intentional.\n'
	);
}
