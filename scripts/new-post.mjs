#!/usr/bin/env node
/**
 * Scaffold a new post into the content directory.
 *
 *   npm run new "Principal components, from the eigendecomposition up"
 *   npm run new "Part one: fetching" -- --series pca-from-scratch --part 1
 *
 * Writes a draft (`published: false`), because a post that starts life
 * publishable is a post that gets published half-finished.
 *
 * The slug is derived from the title with the SAME rules github-slugger uses
 * for heading anchors, so the two never diverge in style — and the script
 * refuses to overwrite an existing file rather than silently clobbering work.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listPosts } from './posts.mjs';

const CONTENT_DIR = process.env.BLOG_CONTENT_DIR ?? 'content';
const POSTS_DIR = join(CONTENT_DIR, 'posts');

const args = process.argv.slice(2);
const title = args.find((a) => !a.startsWith('--'));

if (!title) {
	console.error('\n  Usage: npm run new "Your post title" [-- --series <id> --part <n>]\n');
	process.exit(1);
}

/** Read a `--flag value` pair out of argv. */
function flag(name) {
	const i = args.indexOf(`--${name}`);
	return i !== -1 ? args[i + 1] : undefined;
}

const series = flag('series');
const part = flag('part');

// Lowercase, strip anything that is not a word character or space, collapse
// spaces to hyphens. Matches github-slugger's behaviour for ASCII titles.
const slug = title
	.toLowerCase()
	.replace(/[^\w\s-]/g, '')
	.trim()
	.replace(/\s+/g, '-');

const today = new Date().toISOString().slice(0, 10);
// Each post is a folder named by its slug; figures go beside index.md.
const dir = join(POSTS_DIR, slug);
const file = join(dir, 'index.md');

if (existsSync(dir)) {
	console.error(`\n  Refusing to overwrite an existing post: ${dir}\n`);
	process.exit(1);
}
await mkdir(dir, { recursive: true });

/*
 * The date is QUOTED. Unquoted `date: 2026-05-25` is a YAML timestamp and
 * arrives as a JavaScript Date; quoted, it arrives as a string. Both are
 * handled by lib/posts.js, but quoting keeps every post consistent and avoids
 * depending on that tolerance.
 */
const frontmatter = [
	'---',
	`title: "${title.replace(/"/g, '\\"')}"`,
	`date: "${today}"`,
	'theme: tutorial',
	...(series ? [`series: ${series}`, `part: ${part ?? 1}`] : []),
	'tags: []',
	'description: ',
	'published: false',
	'---',
	'',
	'<script>',
	"  import CodeTabs from '$lib/components/CodeTabs.svelte';",
	"  import Callout from '$lib/components/Callout.svelte';",
	"  import Figure from '$lib/components/Figure.svelte';",
	'</script>',
	'',
	'Opening paragraph: what this post answers, and for whom.',
	'',
	'## First section',
	'',
	'<CodeTabs labels={[\'Python\', \'R\']}>',
	'',
	'```python',
	'# ...',
	'```',
	'',
	'```r',
	'# ...',
	'```',
	'',
	'</CodeTabs>',
	''
].join('\n');

await writeFile(file, frontmatter);

const count = (await listPosts(POSTS_DIR)).length;
console.log(`\n  created ${file}`);
console.log(`  slug    ${slug}`);
console.log(`  figures go in ${dir}/`);
console.log(`  status  draft (published: false)`);
console.log(`  ${count} post(s) in ${POSTS_DIR}\n`);
console.log('  Preview it:  npm run sync:drafts && npm run dev\n');
